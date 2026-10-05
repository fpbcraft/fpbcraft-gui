import {PageHeader, Pill} from '@/components/ui';
import {displayModName, displayModVersion, loadDashboardState} from '@/lib/fpbpack';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

export default async function ModsPage({
  searchParams,
}: {
  searchParams: Promise<{q?: string; page?: string; location?: string}>;
}) {
  const state = await loadDashboardState();
  const params = await searchParams;
  const q = (params.q ?? '').trim().toLowerCase();
  const location = params.location ?? 'all';
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);

  const managedByHash = new Map(
    (state.report?.managed ?? []).map((entry) => [entry.sha512, entry]),
  );
  const pinnedByHash = new Map(
    (state.report?.pinned_artifacts ?? []).map((entry) => [entry.sha512, entry]),
  );

  const filtered = (state.inventory?.mods ?? []).filter((mod) => {
    const text = `${displayModName(mod)} ${mod.filename} ${displayModVersion(mod)}`.toLowerCase();
    return (!q || text.includes(q)) && (location === 'all' || mod.location === location);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);

  const pageHref = (nextPage: number) =>
    `/mods?q=${encodeURIComponent(params.q ?? '')}&location=${encodeURIComponent(location)}&page=${nextPage}`;

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Mods"
        description="Physical JARs discovered by FPBPack, including their deployment location and management state."
      />

      <form className="filters" action="/mods">
        <input
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Search name, filename, version…"
          aria-label="Search mods"
        />
        <select name="location" defaultValue={location} aria-label="Filter by location">
          <option value="all">All locations</option>
          <option value="server">Server/common</option>
          <option value="client">Client-only</option>
        </select>
        <button type="submit">Filter</button>
      </form>

      <section className="panel table-panel">
        <div className="table-summary">
          <span>{filtered.length} matching JARs</span>
          <span>Page {safePage} of {totalPages}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mod</th>
                <th>Version</th>
                <th>Location</th>
                <th>Source</th>
                <th>Management</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((mod) => {
                const managed = managedByHash.get(mod.sha512);
                const pinned = pinnedByHash.get(mod.sha512);
                return (
                  <tr key={`${mod.location}:${mod.path}`}>
                    <td data-label="Mod">
                      <div>
                        <strong>{displayModName(mod)}</strong>
                        <span className="subtle mono">{mod.filename}</span>
                      </div>
                    </td>
                    <td data-label="Version">{displayModVersion(mod)}</td>
                    <td data-label="Location">
                      <Pill tone={mod.location === 'client' ? 'blue' : 'neutral'}>
                        {mod.location}
                      </Pill>
                    </td>
                    <td data-label="Source">{managed?.provider ?? (pinned ? 'local' : 'unknown')}</td>
                    <td data-label="Management">
                      {managed ? (
                        <Pill tone="good">Managed</Pill>
                      ) : pinned ? (
                        <Pill tone="warn">Unmanaged</Pill>
                      ) : (
                        <Pill tone="bad">Unresolved</Pill>
                      )}
                    </td>
                  </tr>
                );
              })}
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
