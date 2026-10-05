import Link from 'next/link';
import {EmptyState, Metric, PageHeader, Pill, formatDate} from '@/components/ui';
import {loadDashboardState, providerCounts} from '@/lib/fpbpack';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const state = await loadDashboardState();
  const {inventory, report} = state;
  const issues =
    (report?.summary.unresolved ?? 0) +
    (report?.summary.conflict_projects ?? 0) +
    (report?.summary.placement_warnings ?? 0);
  const pinned = report?.summary.pinned_artifacts ?? report?.pinned_artifacts?.length ?? 0;
  const providers = providerCounts(report);

  return (
    <>
      <PageHeader
        eyebrow="FPBPack"
        title="Server overview"
        description="A read-only view of the current FPBCraft inventory and management state."
        action={
          <Pill tone={issues === 0 ? 'good' : 'warn'}>
            {issues === 0 ? 'Healthy' : `${issues} findings`}
          </Pill>
        }
      />

      {state.errors.length ? (
        <section className="notice notice-warn">
          <strong>Data source warning</strong>
          {state.errors.map((error) => <p key={error}>{error}</p>)}
        </section>
      ) : null}

      <section className="metrics-grid">
        <Metric
          label="Installed JARs"
          value={inventory?.summary.total ?? '—'}
          detail={inventory ? `${inventory.summary.server} server · ${inventory.summary.client} client` : 'Inventory unavailable'}
        />
        <Metric
          label="Managed"
          value={report?.summary.generated_projects ?? '—'}
          detail="Packwiz catalog projects"
          tone="good"
        />
        <Metric
          label="Unmanaged"
          value={pinned}
          detail="Explicitly left outside Packwiz"
          tone={pinned > 0 ? 'warn' : 'neutral'}
        />
        <Metric
          label="Findings"
          value={issues}
          detail="Unresolved · conflicts · placement"
          tone={issues === 0 ? 'good' : 'bad'}
        />
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Providers</span>
              <h2>Managed sources</h2>
            </div>
            <Link href="/sources">View sources</Link>
          </div>
          {providers.length ? (
            <div className="provider-list">
              {providers.map(([provider, count]) => (
                <div key={provider} className="provider-row">
                  <span className={`provider-icon provider-${provider}`}>
                    {provider.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="provider-name">{provider}</span>
                  <strong>{count}</strong>
                </div>
              ))}
              {pinned > 0 ? (
                <div className="provider-row">
                  <span className="provider-icon provider-pinned">P</span>
                  <span className="provider-name">unmanaged / pinned</span>
                  <strong>{pinned}</strong>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState title="No catalog loaded">
              Mount the FPBPack report into the container to populate provider data.
            </EmptyState>
          )}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Freshness</span>
              <h2>FPBPack state</h2>
            </div>
          </div>
          <dl className="detail-list">
            <div><dt>Inventory generated</dt><dd>{formatDate(inventory?.generated_at ?? null)}</dd></div>
            <div><dt>Inventory file modified</dt><dd>{formatDate(state.inventoryModifiedAt)}</dd></div>
            <div><dt>Catalog modified</dt><dd>{formatDate(state.reportModifiedAt)}</dd></div>
            <div><dt>Inventory schema</dt><dd>{inventory?.schema_version ?? '—'}</dd></div>
            <div><dt>Report schema</dt><dd>{report?.schema_version ?? '—'}</dd></div>
          </dl>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Safety</span>
            <h2>Current operating mode</h2>
          </div>
          <Pill tone="blue">Read only</Pill>
        </div>
        <div className="safety-grid">
          <div><strong>Host data</strong><span>Mounted read-only into Docker</span></div>
          <div><strong>Updates</strong><span>No update or deploy actions exposed yet</span></div>
          <div><strong>Unmanaged mods</strong><span>Visible here, absent from Packwiz metadata</span></div>
        </div>
      </section>
    </>
  );
}
