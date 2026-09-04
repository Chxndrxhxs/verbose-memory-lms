import type { LessonKind, LucideIcon } from "@masterlms/shared";

export type Course = {
  id: string;
  title: string;
  subtitle?: string;
  meta: string;
  instructor: string;
  instructorAvatar?: string;
  price: string;
  rawPrice: number;
  originalPrice?: number;
  pricingType?: string;
  rating?: string;
  img: string;
  icon: LucideIcon;
  accent: string;
  featured?: boolean;
  description?: string;
  lessons?: string[];
  category?: string;
  level?: string;
  cover_image?: string;
  studentCount: number;
  sectionCount: number;
  lessonCount: number;
  enrolled?: boolean;
};

export type CourseDetail = {
  id: string;
  title: string;
  subtitle: string;
  instructor: string;
  instructorRole: string;
  avatar: string;
  price: string;
  level: string;
  rating: string;
  students: string;
  img: string;
  preview: string;
  description: string;
  learn: string[];
  curriculum: {
    title: string;
    meta: string;
    lessons: { id: number; title: string; kind: LessonKind; duration: string }[];
  }[];
  includes: string[];
};
