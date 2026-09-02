import type { LucideIcon } from "@masterlms/shared";

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
