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

export type Tier = "Iron" | "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Ascendant" | "Immortal" | "Radiant";
export interface LeaderboardLearner { id: number; name: string; avatar: string; city: string }
export interface LeaderboardEntry {
  rank: number; rr: number; tier: Tier;
  learner: LeaderboardLearner;
  breakdown: { quiz: number; completion: number; certs: number; streak: number };
  stats: { quiz_accuracy: number; completion_rate: number; certificates: number; streak: number; lessons_completed: number };
}
export interface LeaderboardResponse {
  data: LeaderboardEntry[]; error: null;
  meta: { page: number; total: number; pages: number; season: string; cities: string[]; categories: string[] };
  me: LeaderboardEntry | null;
}

