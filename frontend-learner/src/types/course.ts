import type { LucideIcon } from "@masterlms/shared";

export type Course = {
  id: string;
  title: string;
  subtitle?: string;
  meta: string;
  instructor: string;
  instructorAvatar?: string;
  price: string;
  img: string;
  icon: LucideIcon;
  accent: string;
  featured?: boolean;
  description?: string;
  lessons?: string[];
  category?: string;
  level?: string;
  cover_image?: string;
};
