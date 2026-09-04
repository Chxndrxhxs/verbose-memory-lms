export type Role = 'learner' | 'instructor' | 'admin';
export interface Paginated<T> { data: T[]; error: null; meta: { page: number; total: number } }
export interface SharedUser {
  id: number; mobile: string; email: string; name: string; role: Role;
}
export interface SharedApiCourse {
  id: number; title: string; subtitle: string; description: string;
  category: string; price: string; cover_image: string; level: string;
  average_rating: string; instructor_name: string;
}
export interface LessonKinds { kind: string }

