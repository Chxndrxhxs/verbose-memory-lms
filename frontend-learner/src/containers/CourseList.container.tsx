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
    img: c.cover_image || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=600&auto=format&fit=crop&q=80",
    accent: accentMap[c.category] ?? "bg-zinc-900",
    icon: iconMap[c.category] ?? Target,
    featured: idx === 1,
    category: c.category,
  };
}

async function fetchCourses(): Promise<Course[]> {
  try {
    const data = await api<{ results: ApiCourse[] } | ApiCourse[]>("/courses/", { auth: false });
    const list = Array.isArray(data) ? data : data.results ?? [];
    if (list.length > 0) return list.map(mapApi);
  } catch {}
  // fallback mock if API down
  return [
    { id: "ux-fundamentals", title: "UX/UI Design Fundamentals", meta: "4.9 • Beginner • 3h 20m", instructor: "Dr. Ayse Sharma", price: "Free", accent: "bg-[#3478ff]", icon: Diamond, img: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=600&auto=format&fit=crop&q=80" },
    { id: "business-leadership", title: "Strategic Business Leadership", meta: "4.8 • Intermediate • 5h 10m", instructor: "Mark Chen", price: "$29", accent: "bg-[#3478ff]", icon: Hexagon, featured: true, img: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&auto=format&fit=crop&q=80" },
  ];
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
