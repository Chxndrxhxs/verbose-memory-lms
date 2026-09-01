import { useQuery } from "@tanstack/react-query";
import { Diamond, Hexagon, Code, Target } from "@masterlms/shared";
import { CourseCard } from "../components/CourseCard";
import { api } from "../lib/api";
import type { Course } from "../types/course";

type ApiCourse = {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  price: string;
  cover_image: string;
  level: string;
  average_rating: string;
  instructor_name: string;
  instructor_avatar: string;
  instructor_role: string;
  student_count: number;
  meta: string;
  slug: string;
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

function mapApi(c: ApiCourse, idx: number): Course {
  const priceNum = Number(c.price);
  return {
    id: String(c.id),
    title: c.title,
    subtitle: c.subtitle,
    meta: c.meta || `${c.average_rating} • ${c.level}`,
    instructor: c.instructor_name,
    instructorAvatar: c.instructor_avatar,
    price: priceNum === 0 ? "Free" : `$${priceNum}`,
    img: c.cover_image || "",
    accent: accentMap[c.category] ?? "bg-zinc-900",
    icon: iconMap[c.category] ?? Target,
    rating: c.average_rating ? Number(c.average_rating).toFixed(1) : undefined,
    featured: idx === 1,
    category: c.category,
  };
}

async function fetchCourses(): Promise<Course[]> {
  const data = await api<{ results: ApiCourse[] } | ApiCourse[]>("/courses/", { auth: false });
  const list = Array.isArray(data) ? data : data.results ?? [];
  return list.map(mapApi);
}

export function CourseListContainer() {
  const { data, isLoading } = useQuery({ queryKey: ["courses"], queryFn: fetchCourses });

  if (isLoading) return <p className="py-10 text-center text-sm text-zinc-500">Loading courses…</p>;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {(data ?? []).map((c) => (
        <CourseCard key={c.id} {...c} />
      ))}
    </div>
  );
}
