import {PageHeader, Pill} from '@/components/ui';
import {loadManagementState, type ManagementMod} from '@/lib/management';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

function managementTone(
  management: ManagementMod['management'],
): 'good' | 'warn' | 'bad' | 'neutral' {
  if (management === 'managed') return 'good';
  if (management === 'unmanaged') return 'warn';
  if (management === 'unresolved' || management === 'external') return 'bad';
  return 'neutral';
}

export default async function ModsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    deployment?: string;
    management?: string;
    provider?: string;
  }>;
}) {
  const state = await loadManagementState();
  const params = await searchParams;
  const q = (params.q ?? '').trim().toLowerCase();
  const deployment = params.deployment ?? 'all';
  const management = params.management ?? 'all';
  const provider = params.provider ?? 'all';
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);

  const providers = [...new Set(state.mods.map((mod) => mod.provider).filter(Boolean))]
    .map(String)
    .sort((a, b) => a.localeCompare(b));

  const filtered = state.mods.filter((mod) => {
    const text = [
      mod.name,
      mod.filename,
      mod.installed_version ?? '',
      mod.provider ?? '',
      mod.project_id ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return (
      (!q || text.includes(q)) &&
      (deployment === 'all' || mod.deployment === deployment) &&
      (management === 'all' || mod.management === management) &&
      (provider === 'all' || mod.provider === provider)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);

  const pageHref = (nextPage: number) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (deployment !== 'all') query.set('deployment', deployment);
    if (management !== 'all') query.set('management', management);
    if (provider !== 'all') query.set('provider', provider);
    query.set('page', String(nextPage));
    return '/mods?' + query.toString();
  };

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Mods"
        description="Installed JARs with management identity, placement, and provider ownership."
        action={
          <Pill tone={state.source === 'api' ? 'good' : 'blue'}>
            {state.source === 'api' ? 'FPBPack API' : 'Compatibility mode'}
          </Pill>
        }
      />

      {state.errors.length ? (
        <section className="notice notice-warn">
          <strong>Data source warning</strong>
          {state.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </section>
      ) : null}

      <form className="filters" action="/mods">
        <input
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Search name, filename, version…"
          aria-label="Search mods"
        />
        <select
          name="deployment"
          defaultValue={deployment}
          aria-label="Filter by deployment"
        >
          <option value="all">All placements</option>
          <option value="server">Server/common</option>
          <option value="client">Client-only</option>
        </select>
        <select
          name="management"
          defaultValue={management}
          aria-label="Filter by management state"
        >
          <option value="all">All management</option>
          <option value="managed">Managed</option>
          <option value="unmanaged">Unmanaged</option>
          <option value="unresolved">Unresolved</option>
          <option value="external">External change</option>
        </select>
        <select name="provider" defaultValue={provider} aria-label="Filter by provider">
          <option value="all">All providers</option>
          {providers.map((item) => (
            <option value={item} key={item}>
              {item}
            </option>
          ))}
        </select>
        <button type="submit">Filter</button>
      </form>

      <section className="panel table-panel">
        <div className="table-summary">
          <span>{filtered.length} matching JARs</span>
          <span>
            Page {safePage} of {totalPages}
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mod</th>
                <th>Version</th>
                <th>Side</th>
                <th>Source</th>
                <th>Management</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((mod) => (
                <tr key={mod.id + ':' + mod.path}>
                  <td data-label="Mod">
                    <div>
                      <strong>{mod.name}</strong>
                      <span className="subtle mono">{mod.filename}</span>
                    </div>
                  </td>
                  <td data-label="Version">{mod.installed_version || '—'}</td>
                  <td data-label="Side">
                    <Pill tone={mod.side === 'client' ? 'blue' : 'neutral'}>
                      {mod.side}
                    </Pill>
                  </td>
                  <td data-label="Source">
                    {mod.project_url ? (
                      <a href={mod.project_url} target="_blank" rel="noreferrer">
                        {mod.provider ?? 'unknown'}
                      </a>
                    ) : (
                      mod.provider ?? 'unknown'
                    )}
                  </td>
                  <td data-label="Management">
                    <Pill tone={managementTone(mod.management)}>{mod.management}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          {safePage > 1 ? <a href={pageHref(safePage - 1)}>Previous</a> : <span />}
          {safePage < totalPages ? <a href={pageHref(safePage + 1)}>Next</a> : <span />}
        </div>
      </section>
    </>
  );
}
