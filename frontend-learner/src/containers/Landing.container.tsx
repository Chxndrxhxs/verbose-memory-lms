import { useQuery } from "@tanstack/react-query";
import { Hexagon, Code, Target, Diamond } from "@masterlms/shared";
import { LandingView } from "../components/LandingView";
import { api } from "../lib/api";
import type { Course } from "../types/course";

type ApiCourse = {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  price: string;
  original_price: string;
  average_rating: string;
  level: string;
  instructor_name: string;
  instructor_avatar: string;
  cover_image: string;
  student_count: number;
  section_count: number;
  lesson_count: number;
};

const accentMap: Record<string, string> = {
  Design: "bg-[#3478ff]",
  Business: "bg-[#3478ff]",
  Engineering: "bg-[#111827]",
  Marketing: "bg-emerald-500",
};
const iconMap: Record<string, typeof Diamond> = {
  Design: Diamond,
  Business: Hexagon,
  Engineering: Code,
  Marketing: Target,
};

function mapApi(c: ApiCourse): Course {
  const priceNum = Number(c.price);
  const origNum = Number(c.original_price);
  return {
    id: String(c.id),
    title: c.title,
    subtitle: c.subtitle,
    meta: `${c.average_rating ? `${Number(c.average_rating).toFixed(1)} • ` : ""}${c.level ?? ""}`,
    instructor: c.instructor_name ?? "Instructor",
    instructorAvatar: c.instructor_avatar || "",
    price: priceNum === 0 ? "Free" : `₹${priceNum.toLocaleString("en-IN")}`,
    rawPrice: priceNum,
    originalPrice: origNum > priceNum ? origNum : undefined,
    rating: c.average_rating ? Number(c.average_rating).toFixed(1) : undefined,
    img: c.cover_image || "",
    accent: accentMap[c.category] ?? "bg-zinc-900",
    icon: iconMap[c.category] ?? Target,
    category: c.category,
    level: c.level,
    studentCount: c.student_count ?? 0,
    sectionCount: c.section_count ?? 0,
    lessonCount: c.lesson_count ?? 0,
  };
}

async function fetchLandingCourses(): Promise<Course[]> {
  const data = await api<{ results: ApiCourse[] } | ApiCourse[]>("/courses/", { auth: false });
  const list = Array.isArray(data) ? data : data.results ?? [];
  return list.map(mapApi);
}

export function LandingContainer() {
  const { data } = useQuery({ queryKey: ["landing-courses"], queryFn: fetchLandingCourses });
  const { data: enrolledData } = useQuery({
    queryKey: ["me", "courses"],
    queryFn: async () => {
      try {
        const res = await api<{ course: { id: number } }[] | { results: { course: { id: number } }[] }>("/me/courses");
        const list = Array.isArray(res) ? res : (res as { results: { course: { id: number } }[] }).results ?? [];
        return new Set(list.map((e) => String(e.course.id)));
      } catch { return new Set<string>(); }
    },
  });
  const enrolledIds = enrolledData ?? new Set<string>();
  const enriched = (data ?? []).map((c) => ({ ...c, enrolled: enrolledIds.has(c.id) }));
  return <LandingView courses={enriched} />;
}
