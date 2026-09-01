export type Role = 'learner' | 'instructor' | 'admin';
export interface Paginated<T> { data: T[]; error: null; meta: { page: number; total: number } }

