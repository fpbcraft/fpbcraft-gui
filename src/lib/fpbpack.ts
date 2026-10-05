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
  mode: 'live' | 'demo';
}


const demoInventory: Inventory = {
  schema_version: 2,
  generated_at: new Date().toISOString(),
  server_root: '/demo/server',
  server_mods_path: 'mods',
  client_mods_path: 'automodpack/host-modpack/main/mods',
  summary: {
    total: 12,
    server: 8,
    client: 4,
    modrinth_exact: 9,
    curseforge_exact: 3,
    unmatched: 0,
    metadata_unreadable: 0,
  },
  mods: [
    {
      location: 'server',
      path: 'mods/create.jar',
      filename: 'create-6.0.10.jar',
      size: 0,
      sha1: 'demo-create',
      sha512: 'demo-create',
      metadata: [{name: 'Create', version: '6.0.10'}],
    },
    {
      location: 'server',
      path: 'mods/ftb-library.jar',
      filename: 'ftb-library-neoforge-2101.1.36.jar',
      size: 0,
      sha1: 'demo-ftb',
      sha512: 'demo-ftb',
      metadata: [{name: 'FTB Library', version: '2101.1.36'}],
    },
    {
      location: 'client',
      path: 'automodpack/host-modpack/main/mods/immediatelyfast.jar',
      filename: 'ImmediatelyFast-NeoForge-1.6.14+1.21.1.jar',
      size: 0,
      sha1: 'demo-fast',
      sha512: 'demo-fast',
      metadata: [{name: 'ImmediatelyFast', version: '1.6.14'}],
    },
    {
      location: 'server',
      path: 'mods/bluemap3d.jar',
      filename: 'bluemap3d-bundle-4.0.0-1.21.1.jar',
      size: 0,
      sha1: 'demo-bm3d',
      sha512: 'demo-bm3d',
      metadata: [{name: 'BlueMap3D', version: '4.0.0'}],
    },
    {
      location: 'server',
      path: 'mods/player-history-recorder.jar',
      filename: 'player-history-recorder-2.2.0.jar',
      size: 0,
      sha1: 'demo-history',
      sha512: 'demo-history',
      metadata: [{name: 'Player History Recorder', version: '2.2.0'}],
    },
  ],
};

const demoReport: MigrationReport = {
  schema_version: 3,
  inventory_schema_version: 2,
  summary: {
    inventory_jars: 12,
    unique_artifacts: 12,
    duplicate_artifacts: 0,
    generated_projects: 9,
    unresolved: 0,
    conflict_projects: 0,
    placement_warnings: 0,
    pinned_artifacts: 3,
  },
  managed: [
    {
      provider: 'modrinth',
      project_id: 'demo-create',
      version_id: '6.0.10',
      name: 'Create',
      filename: 'create-6.0.10.jar',
      sha512: 'demo-create',
      side: 'both',
      deployment: 'server',
      source_paths: [{location: 'server', path: 'mods/create.jar'}],
    },
    {
      provider: 'curseforge',
      project_id: 'demo-ftb',
      file_id: 1,
      name: 'FTB Library',
      filename: 'ftb-library-neoforge-2101.1.36.jar',
      sha512: 'demo-ftb',
      side: 'both',
      deployment: 'server',
      source_paths: [{location: 'server', path: 'mods/ftb-library.jar'}],
    },
    {
      provider: 'modrinth',
      project_id: 'demo-fast',
      version_id: '1.6.14',
      name: 'ImmediatelyFast',
      filename: 'ImmediatelyFast-NeoForge-1.6.14+1.21.1.jar',
      sha512: 'demo-fast',
      side: 'client',
      deployment: 'client',
      source_paths: [
        {
          location: 'client',
          path: 'automodpack/host-modpack/main/mods/immediatelyfast.jar',
        },
      ],
    },
  ],
  pinned_artifacts: [
    {
      sha512: 'demo-bm3d',
      filename: 'bluemap3d-bundle-4.0.0-1.21.1.jar',
      reason: 'Demo: intentionally managed outside Packwiz.',
      sources: [{location: 'server', path: 'mods/bluemap3d.jar'}],
    },
    {
      sha512: 'demo-history',
      filename: 'player-history-recorder-2.2.0.jar',
      reason: 'Demo: intentionally managed outside Packwiz.',
      sources: [{location: 'server', path: 'mods/player-history-recorder.jar'}],
    },
    {
      sha512: 'demo-custom',
      filename: 'fpbcraft-compat-1.0.2-neoforge-1.21.1.jar',
      reason: 'Demo: intentionally managed outside Packwiz.',
      sources: [{location: 'server', path: 'mods/fpbcraft-compat.jar'}],
    },
  ],
};

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
  if (process.env.FPBPACK_DEMO === 'true') {
    return {
      inventory: demoInventory,
      report: demoReport,
      errors: [],
      inventoryModifiedAt: demoInventory.generated_at,
      reportModifiedAt: demoInventory.generated_at,
      mode: 'demo',
    };
  }

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
    mode: 'live',
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
