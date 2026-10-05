'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {API_URL_STORAGE_KEY, normalizeApiUrl} from '@/lib/api-config';
import type {
  DiagnosticReport,
  ManagementMod,
  ManagementState,
  ManagementStatus,
} from '@/lib/management';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface ConnectResult {
  ok: boolean;
  error?: string;
}

interface ManagementContextValue {
  state: ManagementState;
  browserApiUrl: string | null;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  connect: (value: string) => Promise<ConnectResult>;
  resetBrowserApiUrl: () => void;
  refresh: () => Promise<ConnectResult>;
}

const ManagementContext = createContext<ManagementContextValue | null>(null);

type LocalNetworkFetchInit = RequestInit & {
  targetAddressSpace?: 'local' | 'loopback';
};

function requestInit(baseUrl: string): LocalNetworkFetchInit {
  const url = new URL(baseUrl);
  const hostname = url.hostname.toLowerCase();
  const loopback =
    hostname === 'localhost' ||
    hostname === '::1' ||
    hostname.startsWith('127.');

  return {
    cache: 'no-store',
    mode: 'cors',
    ...(url.protocol === 'http:'
      ? {targetAddressSpace: loopback ? 'loopback' : 'local'}
      : {}),
  };
}

async function fetchApi<T>(baseUrl: string, path: string): Promise<T> {
  const response = await fetch(baseUrl + path, requestInit(baseUrl));
  if (!response.ok) {
    throw new Error(path + ' returned HTTP ' + response.status);
  }
  return (await response.json()) as T;
}

async function loadBrowserState(baseUrl: string): Promise<ManagementState> {
  const [status, modsResponse, diagnostics] = await Promise.all([
    fetchApi<ManagementStatus>(baseUrl, '/api/status'),
    fetchApi<{mods: ManagementMod[]}>(baseUrl, '/api/mods'),
    fetchApi<DiagnosticReport>(baseUrl, '/api/diagnostics'),
  ]);

  return {
    status,
    mods: modsResponse.mods,
    diagnostics,
    source: 'api',
    apiUrl: baseUrl,
    apiUrlSource: 'browser',
    environmentApiUrl: null,
    errors: [],
  };
}

function connectionMessage(baseUrl: string, error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error);
  return (
    'Could not reach FPBPack at ' +
    baseUrl +
    '. Make sure this device is on the same LAN, allow local-network access when the browser asks, and configure the backend to allow this GUI origin. ' +
    detail
  );
}

export function ManagementProvider({
  initialState,
  children,
}: {
  initialState: ManagementState;
  children: ReactNode;
}) {
  const [state, setState] = useState(initialState);
  const [browserApiUrl, setBrowserApiUrl] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    initialState.source === 'api' ? 'connected' : 'idle',
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const load = useCallback(
    async (baseUrl: string): Promise<ConnectResult> => {
      setConnectionStatus('connecting');
      setConnectionError(null);
      try {
        const next = await loadBrowserState(baseUrl);
        setState({
          ...next,
          environmentApiUrl: initialState.environmentApiUrl,
        });
        setConnectionStatus('connected');
        return {ok: true};
      } catch (error: unknown) {
        const message = connectionMessage(baseUrl, error);
        setState({
          ...initialState,
          apiUrl: baseUrl,
          apiUrlSource: 'browser',
          errors: [message, ...initialState.errors],
        });
        setConnectionStatus('error');
        setConnectionError(message);
        return {ok: false, error: message};
      }
    },
    [initialState],
  );

  const connect = useCallback(
    async (value: string): Promise<ConnectResult> => {
      let normalized: string;
      try {
        normalized = normalizeApiUrl(value);
        if (!normalized) {
          throw new Error('Enter an API URL.');
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Invalid API URL.';
        setConnectionStatus('error');
        setConnectionError(message);
        return {ok: false, error: message};
      }

      window.localStorage.setItem(API_URL_STORAGE_KEY, normalized);
      setBrowserApiUrl(normalized);
      return load(normalized);
    },
    [load],
  );

  const resetBrowserApiUrl = useCallback(() => {
    window.localStorage.removeItem(API_URL_STORAGE_KEY);
    setBrowserApiUrl(null);
    setConnectionError(null);
    setConnectionStatus(initialState.source === 'api' ? 'connected' : 'idle');
    setState(initialState);
  }, [initialState]);

  const refresh = useCallback(async (): Promise<ConnectResult> => {
    if (!browserApiUrl) {
      return {ok: false, error: 'No browser API URL is configured.'};
    }
    return load(browserApiUrl);
  }, [browserApiUrl, load]);

  useEffect(() => {
    const stored = window.localStorage.getItem(API_URL_STORAGE_KEY);
    if (!stored) return;

    let normalized: string;
    try {
      normalized = normalizeApiUrl(stored);
      if (!normalized) return;
    } catch {
      window.localStorage.removeItem(API_URL_STORAGE_KEY);
      return;
    }

    setBrowserApiUrl(normalized);
    void load(normalized);
  }, [load]);

  const value = useMemo(
    () => ({
      state,
      browserApiUrl,
      connectionStatus,
      connectionError,
      connect,
      resetBrowserApiUrl,
      refresh,
    }),
    [
      state,
      browserApiUrl,
      connectionStatus,
      connectionError,
      connect,
      resetBrowserApiUrl,
      refresh,
    ],
  );

  return (
    <ManagementContext.Provider value={value}>
      {children}
    </ManagementContext.Provider>
  );
}

export function useManagement() {
  const value = useContext(ManagementContext);
  if (!value) {
    throw new Error('useManagement must be used inside ManagementProvider.');
  }
  return value;
}
