import {PageHeader, Pill} from '@/components/ui';
import {loadManagementState} from '@/lib/management';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const state = await loadManagementState();

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Connection and operating state for the FPBCraft management service."
        action={<Pill tone={state.source === 'api' ? 'good' : 'blue'}>{state.source}</Pill>}
      />

      {state.errors.length ? (
        <section className="notice notice-warn">
          <strong>Connection warning</strong>
          {state.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">FPBPack</span>
            <h2>Connection</h2>
          </div>
          <Pill tone={state.status.read_only ? 'blue' : 'warn'}>
            {state.status.read_only ? 'Read only' : state.status.mode}
          </Pill>
        </div>
        <dl className="detail-list">
          <div>
            <dt>Data source</dt>
            <dd>{state.source}</dd>
          </div>
          <div>
            <dt>FPBPack version</dt>
            <dd>{state.status.version ?? 'Unavailable'}</dd>
          </div>
          <div>
            <dt>Server state</dt>
            <dd>{state.status.server_state}</dd>
          </div>
          <div>
            <dt>Installed JARs</dt>
            <dd>{state.status.mods}</dd>
          </div>
          <div>
            <dt>Managed</dt>
            <dd>{state.status.managed}</dd>
          </div>
          <div>
            <dt>Explicitly unmanaged</dt>
            <dd>{state.status.unmanaged}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
