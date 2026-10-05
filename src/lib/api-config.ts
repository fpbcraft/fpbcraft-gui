import {cookies} from 'next/headers';

export const API_URL_COOKIE = 'fpbpack_api_url';

export type ApiUrlSource = 'browser' | 'environment' | 'none';

export interface ApiUrlConfig {
  url: string | null;
  source: ApiUrlSource;
  environmentDefault: string | null;
}

export function normalizeApiUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Enter a valid absolute URL, for example http://fpbpack:8787.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('FPBPack API URL must use http:// or https://.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('Credentials must not be embedded in the FPBPack API URL.');
  }

  parsed.hash = '';
  parsed.search = '';
  parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  return parsed.toString().replace(/\/$/, '');
}

export async function loadApiUrlConfig(): Promise<ApiUrlConfig> {
  const store = await cookies();
  const browserValue = store.get(API_URL_COOKIE)?.value?.trim() ?? '';
  const environmentValue = process.env.FPBPACK_API_URL?.trim() ?? '';

  if (browserValue) {
    try {
      return {
        url: normalizeApiUrl(browserValue),
        source: 'browser',
        environmentDefault: environmentValue ? normalizeApiUrl(environmentValue) : null,
      };
    } catch {
      // Ignore a stale/invalid cookie and fall through to the deployment default.
    }
  }

  if (environmentValue) {
    return {
      url: normalizeApiUrl(environmentValue),
      source: 'environment',
      environmentDefault: normalizeApiUrl(environmentValue),
    };
  }

  return {url: null, source: 'none', environmentDefault: null};
}
