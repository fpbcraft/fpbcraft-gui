'use server';

import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {API_URL_COOKIE, normalizeApiUrl} from '@/lib/api-config';

export async function saveApiUrl(formData: FormData) {
  const rawValue = String(formData.get('apiUrl') ?? '');
  const store = await cookies();

  if (!rawValue.trim()) {
    store.delete(API_URL_COOKIE);
    redirect('/settings?connection=default');
  }

  let normalized: string;
  try {
    normalized = normalizeApiUrl(rawValue);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid API URL.';
    redirect('/settings?connection=invalid&message=' + encodeURIComponent(message));
  }

  store.set(API_URL_COOKIE, normalized, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect('/settings?connection=saved');
}

export async function resetApiUrl() {
  const store = await cookies();
  store.delete(API_URL_COOKIE);
  redirect('/settings?connection=default');
}
