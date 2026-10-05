import {
  displayModName,
  displayModVersion,
  loadDashboardState,
  type Location,
} from '@/lib/fpbpack';

export type DiagnosticLevel = 'info' | 'warning' | 'blocking';

export interface DiagnosticFinding {
  code: string;
  level: DiagnosticLevel;
  actionable: boolean;
  message: string;
  mod?: string;
  path?: string;
}

export interface DiagnosticSummary {
  blocking: number;
  warnings: number;
  info: number;
  actionable: number;
}

export interface DiagnosticReport {
  summary: DiagnosticSummary;
  findings: DiagnosticFinding[];
}

export interface ManagementStatus {
  mode: string;
  read_only: boolean;
  server_state: string;
  inventory_generated_at: string;
  mods: number;
  managed: number;
  unmanaged: number;
  diagnostics: DiagnosticSummary;
  version?: string;
}

export interface ManagementMod {
  id: string;
  name: string;
  filename: string;
  installed_version?: string;
  provider?: string;
  project_id?: string;
  project_url?: string;
  side: string;
  deployment: Location;
  management: 'managed' | 'unmanaged' | 'unresolved' | 'external' | string;
  path: string;
  sha512?: string;
}

export interface ManagementState {
  status: ManagementStatus;
  diagnostics: DiagnosticReport;
  mods: ManagementMod[];
  source: 'api' | 'legacy' | 'demo';
  errors: string[];
}

const emptySummary = (): DiagnosticSummary => ({
  blocking: 0,
  warnings: 0,
  info: 0,
  actionable: 0,
});

function summarize(findings: DiagnosticFinding[]): DiagnosticSummary {
  const summary = emptySummary();
  for (const finding of findings) {
    if (finding.level === 'blocking') summary.blocking += 1;
    else if (finding.level === 'warning') summary.warnings += 1;
    else summary.info += 1;
    if (finding.actionable) summary.actionable += 1;
  }
  return summary;
}

async function fetchApi<T>(baseUrl: string, path: string): Promise<T> {
  const response = await fetch(baseUrl + path, {cache: 'no-store'});
  if (!response.ok) {
    throw new Error(path + ' returned HTTP ' + response.status);
  }
  return (await response.json()) as T;
}

async function loadFromApi(baseUrl: string): Promise<ManagementState> {
  const [status, modsResponse, diagnostics] = await Promise.all([
    fetchApi<ManagementStatus>(baseUrl, '/api/status'),
    fetchApi<{mods: ManagementMod[]}>(baseUrl, '/api/mods'),
    fetchApi<DiagnosticReport>(baseUrl, '/api/diagnostics'),
  ]);

  return {
    status,
    mods: modsResponse.mods,
    diagnostics,
    source: 'api',
    errors: [],
  };
}

async function loadLegacyState(apiError?: string): Promise<ManagementState> {
  const legacy = await loadDashboardState();
  const managedByHash = new Map(
    (legacy.report?.managed ?? []).map((entry) => [entry.sha512.toLowerCase(), entry]),
  );
  const pinnedByHash = new Map(
    (legacy.report?.pinned_artifacts ?? []).map((entry) => [
      entry.sha512.toLowerCase(),
      entry,
    ]),
  );

  const mods: ManagementMod[] = (legacy.inventory?.mods ?? []).map((mod) => {
    const managed = managedByHash.get(mod.sha512.toLowerCase());
    const pinned = pinnedByHash.get(mod.sha512.toLowerCase());
    const management = managed ? 'managed' : pinned ? 'unmanaged' : 'unresolved';
    const provider = managed?.provider ?? (pinned ? 'local' : undefined);
    const projectId = managed?.project_id;
    const projectUrl =
      provider === 'modrinth' && projectId
        ? 'https://modrinth.com/project/' + projectId
        : undefined;

    return {
      id:
        provider && projectId
          ? provider + ':' + projectId
          : 'sha512:' + mod.sha512.slice(0, 16).toLowerCase(),
      name: displayModName(mod),
      filename: mod.filename,
      installed_version: displayModVersion(mod),
      provider,
      project_id: projectId,
      project_url: projectUrl,
      side: managed?.side ?? mod.location,
      deployment: mod.location,
      management,
      path: mod.path,
      sha512: mod.sha512,
    };
  });

  const findings: DiagnosticFinding[] = [];
  for (const item of legacy.report?.unresolved ?? []) {
    findings.push({
      code: 'unresolved_artifact',
      level: 'blocking',
      actionable: true,
      message: 'Artifact has no verified management source.',
      mod: item.filename,
      path: item.sources[0]?.path,
    });
  }
  for (const conflict of legacy.report?.conflicts ?? []) {
    findings.push({
      code: 'project_version_conflict',
      level: 'blocking',
      actionable: true,
      message: 'Multiple installed artifacts resolve to the same project.',
      mod: conflict.project_id,
    });
  }
  for (const warning of legacy.report?.placement_warnings ?? []) {
    findings.push({
      code: 'placement_warning',
      level: 'warning',
      actionable: true,
      message:
        'Provider environment ' +
        warning.environment +
        ' disagrees with deployment ' +
        warning.deployment +
        '.',
      mod: warning.filename,
    });
  }

  const pinnedCount =
    legacy.report?.summary.pinned_artifacts ??
    legacy.report?.pinned_artifacts?.length ??
    0;
  if (pinnedCount > 0) {
    findings.push({
      code: 'unmanaged_artifacts',
      level: 'info',
      actionable: false,
      message:
        String(pinnedCount) +
        ' artifact(s) are explicitly unmanaged and excluded from update actions.',
    });
  }

  const diagnostics = {summary: summarize(findings), findings};
  const errors = [...legacy.errors];
  if (apiError) errors.unshift(apiError);

  return {
    status: {
      mode: 'read-only',
      read_only: true,
      server_state: 'unknown',
      inventory_generated_at: legacy.inventory?.generated_at ?? '',
      mods: mods.length,
      managed: legacy.report?.summary.generated_projects ?? 0,
      unmanaged: pinnedCount,
      diagnostics: diagnostics.summary,
    },
    diagnostics,
    mods,
    source: legacy.mode === 'demo' ? 'demo' : 'legacy',
    errors,
  };
}

export async function loadManagementState(): Promise<ManagementState> {
  const configuredUrl = process.env.FPBPACK_API_URL?.trim();
  if (!configuredUrl) return loadLegacyState();

  const baseUrl = configuredUrl.replace(/\/$/, '');
  try {
    return await loadFromApi(baseUrl);
  } catch (error: unknown) {
    const message =
      'FPBPack API unavailable at ' +
      baseUrl +
      ': ' +
      (error instanceof Error ? error.message : String(error));
    return loadLegacyState(message);
  }
}
