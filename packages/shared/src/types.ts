import type { LessonKind } from './utils';

export type Role = 'learner' | 'instructor' | 'admin';
export interface Paginated<T> { data: T[]; error: null; meta: { page: number; total: number } }
export interface SharedUser {
  id?: number; mobile: string; email: string; name: string; role?: Role;
  age?: number; avatar?: string;
}
export interface SharedApiCourse {
  id: number; title: string; subtitle: string; description: string;
  category: string; price: string; cover_image: string; level: string;
  average_rating: string; instructor_name: string;
}
export interface LessonKinds { kind: string }
export interface SharedQuizQ { id: string; question: string; options: string[]; correct: number }
export interface SharedLesson {
  id: number; title: string; duration: string; kind: LessonKind;
  resource_url?: string; quiz_data?: SharedQuizQ[];
}
export interface SharedSection { id: number; title: string; lessons: SharedLesson[] }
export interface SharedApiCourseDetail {
  id: number; title: string; subtitle?: string; description?: string; category?: string;
  price: string; cover_image?: string; level?: string; average_rating?: string;
  what_you_will_learn?: string[]; instructor_name?: string; instructor_avatar?: string;
  instructor_role?: string; student_count?: number; sections?: SharedSection[];
}
export interface SharedInstructorCourse {
  id: number; title: string; status: string; student_count: number; price: string;
  cover_image: string; updated_at: string; average_rating: string;
}

