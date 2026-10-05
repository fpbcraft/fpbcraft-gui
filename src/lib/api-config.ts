export const API_URL_STORAGE_KEY = 'fpbpack_api_url';

export type ApiUrlSource = 'browser' | 'environment' | 'none';

export function normalizeApiUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(
      'Enter a valid absolute URL, for example http://192.168.1.50:8787.',
    );
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('FPBPack API URL must use http:// or https://.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('Credentials must not be embedded in the FPBPack API URL.');
  }
  if (parsed.pathname !== '/' && parsed.pathname !== '') {
    throw new Error('FPBPack API URL must not include a path.');
  }

  parsed.hash = '';
  parsed.search = '';
  parsed.pathname = '';
  return parsed.toString().replace(/\/$/, '');
}
