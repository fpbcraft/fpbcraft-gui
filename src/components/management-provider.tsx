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
  resetBrowserApiUrl: () => Promise<ConnectResult>;
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

async function loadBrowserState(
  baseUrl: string,
  source: 'browser' | 'environment',
  environmentApiUrl: string | null,
): Promise<ManagementState> {
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
    apiUrlSource: source,
    environmentApiUrl,
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
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const load = useCallback(
    async (
      baseUrl: string,
      source: 'browser' | 'environment',
    ): Promise<ConnectResult> => {
      setConnectionStatus('connecting');
      setConnectionError(null);
      try {
        const next = await loadBrowserState(
          baseUrl,
          source,
          initialState.environmentApiUrl,
        );
        setState(next);
        setConnectionStatus('connected');
        return {ok: true};
      } catch (error: unknown) {
        const message = connectionMessage(baseUrl, error);
        setState({
          ...initialState,
          apiUrl: baseUrl,
          apiUrlSource: source,
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
      return load(normalized, 'browser');
    },
    [load],
  );

  const resetBrowserApiUrl = useCallback(async (): Promise<ConnectResult> => {
    window.localStorage.removeItem(API_URL_STORAGE_KEY);
    setBrowserApiUrl(null);
    setConnectionError(null);

    if (initialState.environmentApiUrl) {
      return load(initialState.environmentApiUrl, 'environment');
    }

    setConnectionStatus('idle');
    setState(initialState);
    return {ok: true};
  }, [initialState, load]);

  const refresh = useCallback(async (): Promise<ConnectResult> => {
    if (!state.apiUrl || state.apiUrlSource === 'none') {
      return {ok: false, error: 'No API URL is configured.'};
    }
    return load(state.apiUrl, state.apiUrlSource);
  }, [state.apiUrl, state.apiUrlSource, load]);

  useEffect(() => {
    const stored = window.localStorage.getItem(API_URL_STORAGE_KEY);
    if (stored) {
      let normalized: string;
      try {
        normalized = normalizeApiUrl(stored);
        if (normalized) {
          setBrowserApiUrl(normalized);
          void load(normalized, 'browser');
          return;
        }
      } catch {
        window.localStorage.removeItem(API_URL_STORAGE_KEY);
      }
    }

    if (initialState.environmentApiUrl) {
      void load(initialState.environmentApiUrl, 'environment');
    }
  }, [initialState.environmentApiUrl, load]);

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
