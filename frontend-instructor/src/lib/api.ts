const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";
const BASE = API.replace(/\/api\/v\d+\/?$/, "");

export async function api<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth: _auth, ...rest } = init as RequestInit & { auth?: boolean };
  const headers: Record<string, string> = { "Content-Type": "application/json", ...((rest.headers as Record<string, string>) ?? {}) };
  const res = await fetch(`${API}${path}`, { ...rest, headers, credentials: "include" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.detail || `API ${res.status}`);
  return (json.data ?? json) as T;
}

export function absoluteMediaUrl(path: string | undefined | null): string | null {
  if (!path) return null;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function uploadFile(file: File): Promise<{ url: string; size: number }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/upload/`, { method: "POST", body: form, credentials: "include" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.detail || `Upload ${res.status}`);
  return json.data as { url: string; size: number };
}
