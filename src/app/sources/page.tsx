import {EmptyState, PageHeader, Pill} from '@/components/ui';
import {loadDashboardState, providerCounts} from '@/lib/fpbpack';

export const dynamic = 'force-dynamic';

export default async function SourcesPage() {
  const state = await loadDashboardState();
  const providers = providerCounts(state.report);
  const pinned = state.report?.pinned_artifacts ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Management"
        title="Sources"
        description="Which artifacts FPBPack manages and which are deliberately left outside Packwiz."
      />

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <div><span className="eyebrow">Managed</span><h2>Provider catalog</h2></div>
          </div>
          {providers.length ? (
            <div className="provider-list">
              {providers.map(([provider, count]) => (
                <div className="provider-row" key={provider}>
                  <span className={`provider-icon provider-${provider}`}>{provider[0]?.toUpperCase()}</span>
                  <span className="provider-name">{provider}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No managed sources">No migration report is currently available.</EmptyState>}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div><span className="eyebrow">Unmanaged</span><h2>Protected local artifacts</h2></div>
            <Pill tone={pinned.length ? 'warn' : 'good'}>{pinned.length}</Pill>
          </div>
          {pinned.length ? (
            <div className="stack-list">
              {pinned.map((entry) => (
                <div className="stack-row" key={entry.sha512}>
                  <div>
                    <strong>{entry.filename}</strong>
                    <span>{entry.reason}</span>
                  </div>
                  <Pill tone="warn">Leave alone</Pill>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No unmanaged artifacts">Everything in the report is provider-managed.</EmptyState>}
        </article>
      </section>
    </>
  );
}
