import {readFile, stat} from 'node:fs/promises';

const inventoryPath =
  process.env.FPBPACK_INVENTORY_PATH ?? '/data/fpbpack-inventory-v2.json';
const reportPath =
  process.env.FPBPACK_REPORT_PATH ?? '/data/fpbpack-modpack/migration-report.json';

export type Location = 'server' | 'client';

export interface InventoryMod {
  location: Location;
  path: string;
  filename: string;
  size: number;
  sha1: string;
  sha512: string;
  metadata?: Array<{
    loader?: string;
    mod_id?: string;
    name?: string;
    version?: string;
  }>;
  modrinth?: {
    project_id: string;
    version_id: string;
    version_number?: string;
    version_name?: string;
    environment?: string;
  };
}

export interface Inventory {
  schema_version: number;
  generated_at: string;
  server_root: string;
  server_mods_path: string;
  client_mods_path: string;
  summary: {
    total: number;
    server: number;
    client: number;
    modrinth_exact: number;
    curseforge_exact: number;
    unmatched: number;
    metadata_unreadable: number;
  };
  mods: InventoryMod[];
}

export interface ManagedEntry {
  provider: 'modrinth' | 'curseforge' | string;
  project_id: string;
  version_id?: string;
  file_id?: number;
  name: string;
  filename: string;
  sha512: string;
  side: 'client' | 'server' | 'both' | string;
  deployment: Location;
  environment?: string;
  source_paths: Array<{location: Location; path: string}>;
}

export interface PinnedArtifact {
  sha512: string;
  filename: string;
  reason: string;
  sources: Array<{location: Location; path: string}>;
}

export interface MigrationReport {
  schema_version: number;
  inventory_schema_version: number;
  summary: {
    inventory_jars: number;
    unique_artifacts: number;
    duplicate_artifacts: number;
    generated_projects: number;
    unresolved: number;
    conflict_projects: number;
    placement_warnings: number;
    pinned_artifacts?: number;
  };
  managed: ManagedEntry[];
  pinned_artifacts?: PinnedArtifact[];
  unresolved?: Array<{
    sha512: string;
    filename: string;
    sources: Array<{location: Location; path: string}>;
  }>;
  conflicts?: Array<{
    provider: string;
    project_id: string;
    files: Array<{filename: string; sha512: string}>;
  }>;
  placement_warnings?: Array<{
    project_id: string;
    environment: string;
    deployment: Location;
    filename: string;
  }>;
}

export interface DashboardState {
  inventory: Inventory | null;
  report: MigrationReport | null;
  errors: string[];
  inventoryModifiedAt: string | null;
  reportModifiedAt: string | null;
}

async function readJson<T>(path: string): Promise<T> {
  const content = await readFile(path, 'utf8');
  return JSON.parse(content) as T;
}

async function modifiedAt(path: string): Promise<string | null> {
  try {
    return (await stat(path)).mtime.toISOString();
  } catch {
    return null;
  }
}

export async function loadDashboardState(): Promise<DashboardState> {
  const errors: string[] = [];

  const [inventoryResult, reportResult, inventoryModifiedAt, reportModifiedAt] =
    await Promise.all([
      readJson<Inventory>(inventoryPath).catch((error: unknown) => {
        errors.push(
          `Inventory unavailable at ${inventoryPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }),
      readJson<MigrationReport>(reportPath).catch((error: unknown) => {
        errors.push(
          `Migration report unavailable at ${reportPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }),
      modifiedAt(inventoryPath),
      modifiedAt(reportPath),
    ]);

  return {
    inventory: inventoryResult,
    report: reportResult,
    errors,
    inventoryModifiedAt,
    reportModifiedAt,
  };
}

export function displayModName(mod: InventoryMod): string {
  const metadataName = mod.metadata?.find((item) => item.name)?.name;
  return metadataName ?? mod.modrinth?.version_name ?? mod.filename;
}

export function displayModVersion(mod: InventoryMod): string {
  const metadataVersion = mod.metadata?.find((item) => item.version)?.version;
  return metadataVersion ?? mod.modrinth?.version_number ?? '—';
}

export function providerCounts(report: MigrationReport | null) {
  const counts = new Map<string, number>();
  for (const entry of report?.managed ?? []) {
    counts.set(entry.provider, (counts.get(entry.provider) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
