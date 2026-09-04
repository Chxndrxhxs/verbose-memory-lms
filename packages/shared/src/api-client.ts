const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';
const BASE = API.replace(/\/api\/v\d+\/?$/, '');

export async function api<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth: _auth, ...rest } = init;
  const res = await request(path, rest);
  if (res.status !== 401 || path.startsWith('/auth/')) {
    return handle<T>(res);
  }
  // access token may have expired — try one cookie refresh, then retry once
  try {
    const refresh = await request('/auth/refresh', { method: 'POST' });
    if (!refresh.ok) return handle<T>(res);
  } catch {
    return handle<T>(res);
  }
  return handle<T>(await request(path, rest));
}

async function request(path: string, init: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };
  return fetch(`${API}${path}`, { ...init, headers, credentials: 'include' });
}

async function handle<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.detail || `API ${res.status}`);
  return (json.data ?? json) as T;
}

export function absoluteMediaUrl(path: string | undefined | null): string | null {
  if (!path) return null;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function uploadFile(file: File): Promise<{ url: string; size: number }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/upload/`, { method: 'POST', body: form, credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.detail || `Upload ${res.status}`);
  return json.data as { url: string; size: number };
}
