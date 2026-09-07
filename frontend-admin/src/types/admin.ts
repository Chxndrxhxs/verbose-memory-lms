export type AdminRole = "learner" | "instructor" | "admin";

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  role: AdminRole;
  age: number | null;
  city: string;
  avatar: string;
  is_mobile_verified: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface AdminCourse {
  id: number;
  instructor_id: number;
  instructor_name: string;
  instructor_avatar: string;
  instructor_role: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  price: string;
  pricing_type: "free" | "one_time";
  original_price: string;
  pg_fees_to_learner: string;
  cover_image: string;
  status: "draft" | "published";
  level: string;
  average_rating: number;
  what_you_will_learn: string[];
  student_count: number;
  section_count: number;
  lesson_count: number;
  slug: string;
  meta: string;
  created_at: string;
  updated_at: string;
  sections?: AdminSection[];
  rating_count?: number;
}

export interface AdminLesson {
  id: number;
  title: string;
  kind: string;
  duration: string;
  video_url: string;
  resource_url: string;
  quiz_data: unknown;
  order: number;
}

export interface AdminSection {
  id: number;
  title: string;
  order: number;
  lessons: AdminLesson[];
}

export interface AdminEnrollment {
  id: number;
  learner_id: number;
  learner_name: string;
  learner_mobile: string;
  learner_avatar: string;
  course_id: number;
  course_title: string;
  course_price: string;
  course_status: string;
  instructor: string;
  progress: number;
  enrolled_at: string;
}

export interface AdminPayment {
  id: number;
  user_id: number;
  user_name: string;
  user_mobile: string;
  course_id: number;
  course_title: string;
  course?: AdminCourse;
  amount: number;
  amount_inr: number;
  currency: string;
  status: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUserDetail {
  user: AdminUser;
  enrollments: AdminEnrollment[];
  payments: AdminPayment[];
}

export interface AdminCourseDetailResponse {
  course: AdminCourse & { sections: AdminSection[]; rating_count: number };
  sections: AdminSection[];
}

export interface AdminDashboard {
  users: { total: number; learners: number; instructors: number; admins: number };
  courses: { total: number; published: number; drafts: number; paid: number; free: number };
  enrollments: { total: number; in_progress: number; completed: number };
  revenue_inr: number;
  payments_paid: number;
  top_categories: { category: string; count: number }[];
  recent_users: {
    id: number;
    name: string;
    mobile: string;
    role: AdminRole;
    city: string;
    avatar: string;
    date_joined: string;
  }[];
  recent_enrollments: {
    id: number;
    learner_id: number;
    learner: string;
    course: string;
    progress: number;
    enrolled_at: string;
  }[];
}

export interface Envelope<T> {
  data: T[];
  error: null;
  meta: { page: number; total: number; pages: number };
}

export interface AdminNavItem {
  to: string;
  label: string;
  end?: boolean;
}