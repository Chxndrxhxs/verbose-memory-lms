import type {
  AssignmentAttemptBrief,
  AssignmentCatalogCategory,
  AssignmentCatalogItem,
  AssignmentDetail,
  AssignmentHierarchyNode,
  AssignmentModelPreview,
  AssignmentResultPayload,
  AssignmentTakeStep,
} from './types';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';
const BASE = API.replace(/\/api\/v\d+\/?$/, '');

function errorMessage(json: Record<string, unknown>, status: number): string {
  if (typeof json.error === 'string') return json.error;
  if (typeof json.detail === 'string') return json.detail;
  for (const value of Object.values(json)) {
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  }
  return `API ${status}`;
}

export async function api<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth: _auth, ...rest } = init;
  const res = await request(path, rest);
  if (res.status !== 401 || path.startsWith('/auth/')) {
    return handle<T>(res);
  }
  try {
    const refresh = await request('/auth/refresh', { method: 'POST' });
    if (!refresh.ok) return handle<T>(res);
  } catch {
    return handle<T>(res);
  }
  return handle<T>(await request(path, rest));
}

/** Alias kept for leaderboard/activity callers: same refresh-on-401 behavior, raw envelope. */

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export async function apiEnvelope<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth: _auth, ...rest } = init;
  let res = await request(path, rest);
  if (res.status === 401 && !path.startsWith('/auth/')) {
    try {
      const refresh = await request('/auth/refresh', { method: 'POST' });
      if (refresh.ok) res = await request(path, rest);
    } catch {}
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(errorMessage(json, res.status), res.status, json);
  return json as T;
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
  if (!res.ok) throw new ApiError(errorMessage(json, res.status), res.status, json);
  return (json.data ?? json) as T;
}

export function absoluteMediaUrl(path: string | undefined | null): string | null {
  if (!path) return null;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  const absolute = `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  if (/^https?:/.test(absolute)) return absolute;
  // Relative VITE_API_URL (same-origin deploy) yields "/media/..." which DRF
  // URLFields reject, so expand against the page origin into a real absolute URL.
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${absolute}`;
  }
  return absolute;
}

export async function uploadFile(file: File): Promise<{ url: string; size: number }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/upload/`, { method: 'POST', body: form, credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.detail || `Upload ${res.status}`);
  return json.data as { url: string; size: number };
}

export function getAssignmentCatalog(): Promise<AssignmentCatalogItem[]> {
  return api('/assignments/');
}

export function getAssignmentCategories(): Promise<AssignmentCatalogCategory[]> {
  return api('/assignments/categories/');
}

export function getAssignmentModels(assignmentId: number): Promise<AssignmentModelPreview[]> {
  return api(`/assignments/models/${assignmentId}/`);
}

export function startAssignmentAttempt(
  assignmentId: number,
  modelId: number,
): Promise<{ attempt: AssignmentAttemptBrief; structure: AssignmentTakeStep[] }> {
  return api(`/assignments/${assignmentId}/start`, {
    method: 'POST',
    body: JSON.stringify({ model_id: modelId }),
  });
}

export function submitAssignmentAttempt(
  assignmentId: number,
  attemptId: number,
  answers: Record<string, Record<string, number>>,
): Promise<AssignmentResultPayload> {
  return api(`/assignments/${assignmentId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ attempt_id: attemptId, answers }),
  });
}

export function getAssignmentDetail(assignmentId: number): Promise<AssignmentDetail> {
  return api(`/assignments/${assignmentId}/`);
}

export type AssignmentTakeOrResult =
  | { attempt: AssignmentAttemptBrief; structure: AssignmentTakeStep[]; answers?: Record<string, Record<string, number>> }
  | AssignmentResultPayload;

export function getAssignmentAttempt(attemptId: number): Promise<AssignmentTakeOrResult> {
  return api(`/assignments/attempts/${attemptId}/`);
}

export function saveAssignmentAttemptAnswers(
  attemptId: number,
  answers: Record<string, Record<string, number>>,
): Promise<{ saved: boolean; saved_at: string }> {
  return api(`/assignments/attempts/${attemptId}/save`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export function getMyAssignmentAttempts(): Promise<AssignmentAttemptBrief[]> {
  return api('/assignments/attempts/');
}

export function getAssignmentTranscript(
  assignmentId: number,
  attemptId?: number,
): Promise<AssignmentResultPayload> {
  const query = attemptId ? `?attempt_id=${attemptId}` : '';
  return api(`/assignments/transcripts/${assignmentId}/${query}`);
}

// ---------------------------------------------------------------------------
// Admin: hierarchy + attempt management (shared by instructor & admin apps)
// ---------------------------------------------------------------------------

function okOrThrow<T>(promise: Promise<T>): Promise<T> {
  return promise;
}

export function adminListCategories(): Promise<AssignmentHierarchyNode[]> {
  return okOrThrow(api('/admin/categories/'));
}

export function adminCreateCategory(data: {
  name: string;
  position?: number;
}): Promise<AssignmentHierarchyNode> {
  return okOrThrow(
    api('/admin/categories/', { method: 'POST', body: JSON.stringify(data) }),
  );
}

export function adminUpdateCategory(
  id: number,
  data: Partial<Pick<AssignmentHierarchyNode, 'name' | 'is_active' | 'position'>>,
): Promise<AssignmentHierarchyNode> {
  return okOrThrow(
    api(`/admin/categories/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  );
}

export function adminDeleteCategory(id: number): Promise<void> {
  return okOrThrow(api(`/admin/categories/${id}/`, { method: 'DELETE' }));
}

export function adminListSubCategories(categoryId?: number): Promise<AssignmentHierarchyNode[]> {
  return okOrThrow(
    api(`/admin/subcategories/${categoryId ? `?category_id=${categoryId}` : ''}`),
  );
}

export function adminCreateSubCategory(data: {
  name: string;
  category_id: number;
  position?: number;
}): Promise<AssignmentHierarchyNode> {
  return okOrThrow(
    api('/admin/subcategories/', { method: 'POST', body: JSON.stringify(data) }),
  );
}

export function adminUpdateSubCategory(
  id: number,
  data: Partial<Pick<AssignmentHierarchyNode, 'name' | 'is_active' | 'position' | 'category_id'>>,
): Promise<AssignmentHierarchyNode> {
  return okOrThrow(
    api(`/admin/subcategories/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  );
}

export function adminDeleteSubCategory(id: number): Promise<void> {
  return okOrThrow(api(`/admin/subcategories/${id}/`, { method: 'DELETE' }));
}

export function adminListInterCategories(subCategoryId?: number): Promise<AssignmentHierarchyNode[]> {
  return okOrThrow(
    api(`/admin/intercategories/${subCategoryId ? `?sub_category_id=${subCategoryId}` : ''}`),
  );
}

export function adminCreateInterCategory(data: {
  name: string;
  sub_category_id: number;
  position?: number;
}): Promise<AssignmentHierarchyNode> {
  return okOrThrow(
    api('/admin/intercategories/', { method: 'POST', body: JSON.stringify(data) }),
  );
}

export function adminUpdateInterCategory(
  id: number,
  data: Partial<Pick<AssignmentHierarchyNode, 'name' | 'is_active' | 'position' | 'sub_category_id'>>,
): Promise<AssignmentHierarchyNode> {
  return okOrThrow(
    api(`/admin/intercategories/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  );
}

export function adminDeleteInterCategory(id: number): Promise<void> {
  return okOrThrow(api(`/admin/intercategories/${id}/`, { method: 'DELETE' }));
}

export function adminListAssignments(): Promise<AssignmentDetail[]> {
  return okOrThrow(api('/admin/assignments/'));
}

export function adminGetAssignment(id: number): Promise<AssignmentDetail> {
  return okOrThrow(api(`/admin/assignments/${id}/`));
}

export function adminListAttempts(assignmentId: number): Promise<AssignmentResultPayload['attempt'][]> {
  return okOrThrow(api(`/admin/assignments/${assignmentId}/attempts/`));
}

export function adminPublishAssignment(id: number, payload?: { as_draft?: boolean }): Promise<AssignmentDetail> {
  return okOrThrow(
    api(`/admin/assignments/${id}/publish`, {
      method: 'POST',
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    }),
  );
}

export function adminUnpublishAssignment(id: number): Promise<AssignmentDetail> {
  return okOrThrow(api(`/admin/assignments/${id}/unpublish`, { method: 'POST' }));
}

export function adminDuplicateAssignment(id: number): Promise<AssignmentDetail> {
  return okOrThrow(api(`/admin/assignments/${id}/duplicate`, { method: 'POST' }));
}

export function adminDeleteAssignment(id: number): Promise<void> {
  return okOrThrow(api(`/admin/assignments/${id}/`, { method: 'DELETE' }));
}

export async function adminSaveStructure(id: number, models: Record<string, unknown>[]): Promise<void> {
  await okOrThrow(
    api(`/admin/assignments/${id}/structure`, {
      method: 'PUT',
      body: JSON.stringify({ models }),
    }),
  );
}
