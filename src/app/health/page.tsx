import {EmptyState, Metric, PageHeader, Pill} from '@/components/ui';
import {loadDashboardState} from '@/lib/fpbpack';

export const dynamic = 'force-dynamic';

export default async function HealthPage() {
  const state = await loadDashboardState();
  const report = state.report;
  const unresolved = report?.unresolved ?? [];
  const conflicts = report?.conflicts ?? [];
  const placement = report?.placement_warnings ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Diagnostics"
        title="Health"
        description="Migration and catalog findings that need attention before FPBPack is allowed to deploy."
        action={<Pill tone={unresolved.length + conflicts.length + placement.length === 0 ? 'good' : 'warn'}>
          {unresolved.length + conflicts.length + placement.length === 0 ? 'No blocking findings' : 'Review required'}
        </Pill>}
      />

      <section className="metrics-grid">
        <Metric label="Unresolved" value={unresolved.length} detail="No verified management source" tone={unresolved.length ? 'bad' : 'good'} />
        <Metric label="Conflicts" value={conflicts.length} detail="Multiple installed versions" tone={conflicts.length ? 'bad' : 'good'} />
        <Metric label="Placement" value={placement.length} detail="Strict side mismatches" tone={placement.length ? 'warn' : 'good'} />
        <Metric label="Duplicates" value={report?.summary.duplicate_artifacts ?? '—'} detail="Byte-identical physical duplicates" />
      </section>

      <section className="panel">
        <div className="panel-heading"><div><span className="eyebrow">Findings</span><h2>Current blockers</h2></div></div>
        {unresolved.length + conflicts.length + placement.length === 0 ? (
          <EmptyState title="Catalog is clean">
            No unresolved artifacts, version conflicts, or strict placement mismatches are recorded.
          </EmptyState>
        ) : (
          <div className="stack-list">
            {unresolved.map((item) => (
              <div className="stack-row" key={item.sha512}>
                <div><strong>{item.filename}</strong><span>Unresolved source</span></div>
                <Pill tone="bad">Unresolved</Pill>
              </div>
            ))}
            {conflicts.map((item) => (
              <div className="stack-row" key={`${item.provider}:${item.project_id}`}>
                <div><strong>{item.project_id}</strong><span>{item.files.length} versions installed</span></div>
                <Pill tone="bad">Conflict</Pill>
              </div>
            ))}
            {placement.map((item) => (
              <div className="stack-row" key={item.filename}>
                <div><strong>{item.filename}</strong><span>{item.environment} deployed as {item.deployment}</span></div>
                <Pill tone="warn">Placement</Pill>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
