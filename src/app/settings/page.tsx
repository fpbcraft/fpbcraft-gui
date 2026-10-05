'use client';

import {useEffect, useState, type FormEvent} from 'react';
import {PageHeader, Pill} from '@/components/ui';
import {useManagement} from '@/components/management-provider';

export default function SettingsPage() {
  const {
    state,
    browserApiUrl,
    connectionStatus,
    connectionError,
    connect,
    resetBrowserApiUrl,
    refresh,
  } = useManagement();
  const [apiUrl, setApiUrl] = useState(
    browserApiUrl ?? state.apiUrl ?? state.environmentApiUrl ?? '',
  );
  const [browserOrigin, setBrowserOrigin] = useState('');

  useEffect(() => {
    setBrowserOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (browserApiUrl) {
      setApiUrl(browserApiUrl);
    }
  }, [browserApiUrl]);

  const connected = state.source === 'api' && connectionStatus === 'connected';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await connect(apiUrl);
  }

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Connect this browser directly to the FPBPack API on your local network."
        action={
          <Pill
            tone={
              connectionStatus === 'connected'
                ? 'good'
                : connectionStatus === 'error'
                  ? 'warn'
                  : 'blue'
            }
          >
            {connectionStatus === 'connecting'
              ? 'Connecting…'
              : connectionStatus === 'connected'
                ? 'Connected'
                : connectionStatus === 'error'
                  ? 'Connection failed'
                  : state.source}
          </Pill>
        }
      />

      {connectionError ? (
        <section className="notice notice-warn">
          <strong>Connection warning</strong>
          <p>{connectionError}</p>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">FPBPack API</span>
            <h2>Browser connection</h2>
          </div>
          <Pill tone={connected ? 'good' : 'neutral'}>
            {connected ? 'Live backend' : 'Not connected'}
          </Pill>
        </div>

        <form className="connection-form" onSubmit={handleSubmit}>
          <label htmlFor="api-url">
            API URL
            <span>
              Stored only in this browser. Requests go from this device directly to
              Unraid; the Vercel server does not proxy or receive the API traffic.
            </span>
          </label>
          <div className="connection-input-row">
            <input
              id="api-url"
              name="apiUrl"
              type="url"
              inputMode="url"
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
              placeholder="http://192.168.1.50:8787"
              autoComplete="url"
            />
            <button type="submit" disabled={connectionStatus === 'connecting'}>
              {connectionStatus === 'connecting' ? 'Connecting…' : 'Save & connect'}
            </button>
          </div>
        </form>

        <div className="notice">
          <strong>LAN access</strong>
          <p>
            When the GUI is hosted over HTTPS, Chrome may ask for permission to access
            devices on your local network. Allow it for this site. FPBPack must listen
            on the Unraid LAN interface and allow this exact web origin with
            <span className="mono">
              {' '}
              --cors-origin {browserOrigin || 'https://your-gui.example'}
            </span>
            .
          </p>
        </div>

        <div className="connection-meta">
          <div>
            <span>Active source</span>
            <strong>
              {state.apiUrlSource === 'browser'
                ? 'Browser → LAN'
                : state.apiUrlSource === 'environment'
                  ? 'GUI server deployment default'
                  : 'Fallback/demo data'}
            </strong>
          </div>
          <div>
            <span>Active URL</span>
            <strong className="mono">{state.apiUrl ?? '—'}</strong>
          </div>
          <div>
            <span>Saved browser URL</span>
            <strong className="mono">{browserApiUrl ?? '—'}</strong>
          </div>
          <div>
            <span>GUI origin for CORS</span>
            <strong className="mono">{browserOrigin || 'Loading…'}</strong>
          </div>
        </div>

        <div className="connection-actions">
          {browserApiUrl ? (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void refresh()}
                disabled={connectionStatus === 'connecting'}
              >
                Test connection
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  resetBrowserApiUrl();
                  setApiUrl(state.environmentApiUrl ?? '');
                }}
              >
                Clear browser URL
              </button>
            </>
          ) : null}
        </div>
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
