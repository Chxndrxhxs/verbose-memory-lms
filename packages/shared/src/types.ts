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
export type QuizOptionKind = "text" | "image" | "video";
export interface SharedQuizOption {
  type: QuizOptionKind;
  text: string;
  media_url?: string;
}
export type SharedQuizOptionInput = string | SharedQuizOption;
export type QuizQuestionType = "image" | "video" | "text" | "qa";
export interface SharedQuizQ {
  id: string;
  type?: QuizQuestionType;
  question: string;
  prompt?: string;
  media_url?: string;
  options: SharedQuizOptionInput[];
  correct: number;
  answer?: string;
}
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

export type AssignmentStatus = "draft" | "published" | "archived";
export type AssignmentDifficulty = "easy" | "medium" | "hard";
export type AssignmentExecutionMode = "sequential" | "parallel";

export interface AssignmentModelPreview {
  id: number;
  code: string;
  name: string;
  description: string;
  execution_mode: AssignmentExecutionMode;
  is_published: boolean;
  duration_seconds: number;
  duration_label: string;
  total_questions: number;
}

export interface AssignmentCatalogItem {
  id: number;
  title: string;
  description: string;
  instructions: string;
  difficulty: AssignmentDifficulty;
  status: AssignmentStatus;
  duration_seconds: number;
  duration_label: string;
  questions_count: number;
  max_attempts: number;
  negative_marking: boolean;
  negative_marks_per_wrong: string;
  start_date: string | null;
  end_date: string | null;
  models_preview: AssignmentModelPreview[];
  inter_category?: {
    id: number;
    name: string;
    sub_category: {
      id: number;
      name: string;
      category: { id: number; name: string };
    };
  } | null;
}

export interface AssignmentCatalogInterCategory {
  id: number;
  name: string;
  position: number;
  assignments_count: number;
}

export interface AssignmentCatalogSubCategory {
  id: number;
  name: string;
  position: number;
  intercategories: AssignmentCatalogInterCategory[];
}

export interface AssignmentCatalogCategory {
  id: number;
  name: string;
  position: number;
  subcategories: AssignmentCatalogSubCategory[];
}

export interface AssignmentAttemptBrief {
  id: number;
  assignment: number;
  model_id: number;
  model_code: string;
  model_name: string;
  status: "in_progress" | "completed" | "expired";
  started_at: string;
  expires_at: string;
  seconds_remaining: number;
  total_questions: number;
}

export interface AssignmentTakeQuestion {
  id: number;
  question: string;
  options: string[];
  marks: number;
  difficulty: AssignmentDifficulty;
  topic: string;
}

export interface AssignmentTakeStep {
  step_id: number;
  name: string;
  kind: "test" | "set";
  duration_seconds: number;
  questions: AssignmentTakeQuestion[];
}

export interface AssignmentCategoryRef {
  id: number;
  name: string;
}
export interface AssignmentSubCategoryRef {
  id: number;
  name: string;
  category: AssignmentCategoryRef;
}
export interface AssignmentInterCategoryRef {
  id: number;
  name: string;
  sub_category: AssignmentSubCategoryRef;
}

export interface AssignmentStepQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  marks: string;
  difficulty: AssignmentDifficulty;
  topic: string;
}

export interface AssignmentStep {
  id: number;
  kind: "test" | "set";
  name: string;
  description: string;
  duration_seconds: number;
  position: number;
  children: AssignmentStep[];
  questions: AssignmentStepQuestion[];
}

export interface AssignmentModel {
  id: number;
  code: string;
  name: string;
  description: string;
  execution_mode: AssignmentExecutionMode;
  is_published: boolean;
  position: number;
  duration_seconds: number;
  total_questions: number;
  steps: AssignmentStep[];
}

export interface AssignmentSecuritySettings {
  fullscreen: boolean;
  camera: boolean;
  microphone: boolean;
  block_tab_switch: boolean;
  block_copy: boolean;
  block_paste: boolean;
  block_right_click: boolean;
  block_shortcuts: boolean;
  violations_before_auto_submit: number;
}

export interface AssignmentResultsSettings {
  instant_result: boolean;
  show_marks: boolean;
  show_correct_answers: boolean;
  show_explanations: boolean;
}

export interface AssignmentDetail extends AssignmentCatalogItem {
  instructions: string;
  access_type: string;
  marks_per_correct: string;
  passing_percentage: string;
  randomize_questions: boolean;
  randomize_options: boolean;
  inter_category: AssignmentInterCategoryRef | null;
  course: { id: number; title: string } | null;
  security: AssignmentSecuritySettings;
  results: AssignmentResultsSettings;
  models?: AssignmentModel[];
  models_preview: AssignmentModelPreview[];
}

export interface AssignmentAttemptFull {
  id: number;
  assignment: number;
  model: number;
  status: "in_progress" | "completed" | "expired";
  started_at: string;
  expires_at: string;
  ended_at: string | null;
  is_auto_submitted: boolean;
  total_questions: number;
  answered: number;
  correct: number;
  wrong: number;
  unanswered: number;
  positive_marks: string;
  negative_marks: string;
  final_score: string;
  max_score: string;
  percentage: string;
  passed: boolean;
}

export interface AttemptStepResult {
  step_id: number;
  name: string;
  kind: string;
  questions: number;
  attempted: number;
  correct: number;
  time_seconds: number;
}

export interface AssignmentTranscript {
  assignment: string;
  category: string;
  sub_category: string;
  inter_category: string;
  model: string;
  model_code: string;
  execution_mode: AssignmentExecutionMode;
  model_duration_seconds: number;
  started_at: string;
  ended_at: string;
  time_taken_seconds: number | null;
  passed: boolean;
  steps: AttemptStepResult[];
}

export interface AssignmentReviewItem {
  step_id: number;
  step_name: string;
  question_id: number;
  question: string;
  options: string[];
  selected: number | null;
  correct_answer: number;
  is_correct: boolean | null;
  marks_awarded: number;
  explanation: string;
}

export interface AssignmentResultPayload {
  attempt: AssignmentAttemptFull;
  transcript: AssignmentTranscript;
  review?: AssignmentReviewItem[];
}

export interface AssignmentHierarchyNode {
  id: number;
  name: string;
  is_active: boolean;
  position: number;
  subcategories_count?: number;
  intercategories_count?: number;
  assignments_count?: number;
  category_id?: number;
  category?: string;
  sub_category_id?: number;
  sub_category?: string;
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
  meta: { page: number; total: number; pages: number; season: string; cities: string[]; categories: string[]; scope?: string; my_students?: boolean };
  me: LeaderboardEntry | null;
}

