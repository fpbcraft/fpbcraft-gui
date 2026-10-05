import {PageHeader, Pill} from '@/components/ui';
import {loadManagementState} from '@/lib/management';
import {resetApiUrl, saveApiUrl} from './actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{connection?: string; message?: string}>;
}) {
  const [state, params] = await Promise.all([loadManagementState(), searchParams]);
  const connected = state.source === 'api';

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Choose which FPBPack backend this browser should use."
        action={
          <Pill tone={connected ? 'good' : state.apiUrl ? 'warn' : 'blue'}>
            {connected ? 'Connected' : state.apiUrl ? 'Connection failed' : state.source}
          </Pill>
        }
      />

      {params.connection === 'saved' && connected ? (
        <section className="notice notice-good">
          <strong>Backend connected</strong>
          <p>The browser-specific FPBPack API URL was saved and verified.</p>
        </section>
      ) : null}

      {params.connection === 'default' ? (
        <section className="notice">
          <strong>Browser override cleared</strong>
          <p>
            The GUI is now using the deployment default, or compatibility data if no
            default backend is configured.
          </p>
        </section>
      ) : null}

      {params.connection === 'invalid' ? (
        <section className="notice notice-warn">
          <strong>Invalid backend URL</strong>
          <p>{params.message ?? 'Enter a valid http:// or https:// URL.'}</p>
        </section>
      ) : null}

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
            <span className="eyebrow">FPBPack API</span>
            <h2>Backend connection</h2>
          </div>
          <Pill tone={connected ? 'good' : 'neutral'}>
            {connected ? 'Live backend' : 'Not connected'}
          </Pill>
        </div>

        <form className="connection-form" action={saveApiUrl}>
          <label htmlFor="api-url">
            API URL
            <span>
              Stored for this browser. The GUI server connects to this address, so it
              must be reachable from the GUI container.
            </span>
          </label>
          <div className="connection-input-row">
            <input
              id="api-url"
              name="apiUrl"
              type="url"
              inputMode="url"
              defaultValue={state.apiUrl ?? state.environmentApiUrl ?? ''}
              placeholder="http://fpbpack:8787"
              autoComplete="url"
            />
            <button type="submit">Save &amp; connect</button>
          </div>
        </form>

        <div className="connection-meta">
          <div>
            <span>Active source</span>
            <strong>
              {state.apiUrlSource === 'browser'
                ? 'Browser override'
                : state.apiUrlSource === 'environment'
                  ? 'Deployment default'
                  : 'No API configured'}
            </strong>
          </div>
          <div>
            <span>Active URL</span>
            <strong className="mono">{state.apiUrl ?? '—'}</strong>
          </div>
          <div>
            <span>Deployment default</span>
            <strong className="mono">{state.environmentApiUrl ?? '—'}</strong>
          </div>
        </div>

        {state.apiUrlSource === 'browser' ? (
          <form action={resetApiUrl}>
            <button type="submit" className="secondary-button">
              Reset to deployment default
            </button>
          </form>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Status</span>
            <h2>Current backend</h2>
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
