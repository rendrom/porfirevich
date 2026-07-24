import { readJson } from '@/utils/http';

const ACCESS_TOKEN_STORAGE_KEY = 'token';

export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function storeAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function clearStoredAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

export async function refreshAccessToken() {
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    credentials: 'same-origin',
  });
  const { token } = await readJson<{ token: string }>(response);
  storeAccessToken(token);
  return token;
}

export async function closeServerSession() {
  const response = await fetch('/auth/logout', {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok && response.status !== 401) {
    throw new Error(`Unable to close session: ${response.status}`);
  }
}
