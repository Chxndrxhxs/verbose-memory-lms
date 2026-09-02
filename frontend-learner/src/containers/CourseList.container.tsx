import { useMemo, useState } from "react";
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
  original_price: string;
  pricing_type: string;
  cover_image: string;
  level: string;
  average_rating: string;
  instructor_name: string;
  instructor_avatar: string;
  instructor_role: string;
  student_count: number;
  section_count: number;
  lesson_count: number;
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
  const origNum = Number(c.original_price);
  return {
    id: String(c.id),
    title: c.title,
    subtitle: c.subtitle,
    meta: c.meta || `${c.average_rating ? `${Number(c.average_rating).toFixed(1)} • ` : ""}${c.level}`,
    instructor: c.instructor_name,
    instructorAvatar: c.instructor_avatar,
    price: priceNum === 0 ? "Free" : `₹${priceNum.toLocaleString("en-IN")}`,
    rawPrice: priceNum,
    originalPrice: origNum > priceNum ? origNum : undefined,
    pricingType: c.pricing_type,
    img: c.cover_image || "",
    accent: accentMap[c.category] ?? "bg-zinc-900",
    icon: iconMap[c.category] ?? Target,
    rating: c.average_rating ? Number(c.average_rating).toFixed(1) : undefined,
    featured: idx === 1,
    category: c.category,
    level: c.level,
    studentCount: c.student_count ?? 0,
    sectionCount: c.section_count ?? 0,
    lessonCount: c.lesson_count ?? 0,
  };
}

async function fetchCourses(): Promise<Course[]> {
  const data = await api<{ results: ApiCourse[] } | ApiCourse[]>("/courses/", { auth: false });
  const list = Array.isArray(data) ? data : data.results ?? [];
  return list.map(mapApi);
}

export function CourseListContainer() {
  const { data, isLoading } = useQuery({ queryKey: ["courses"], queryFn: fetchCourses });
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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories = useMemo(() => {
    const set = new Set((data ?? []).map((c) => c.category).filter(Boolean));
    return Array.from(set) as string[];
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (q && !c.title.toLowerCase().includes(q) && !(c.subtitle ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, query, category]);

  if (isLoading) return <p className="py-10 text-center text-sm text-zinc-500">Loading courses…</p>;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border bg-white p-2 shadow-sm">
          <div className="relative">
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Add Filters <span className="text-[10px]">▼</span>
            </button>
            {filtersOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-44 overflow-hidden rounded-2xl border bg-white shadow-lg">
                <button
                  onClick={() => { setCategory("all"); setFiltersOpen(false); }}
                  className={`flex w-full px-3 py-2 text-left text-xs font-medium hover:bg-zinc-50 ${category === "all" ? "bg-zinc-900 text-white hover:bg-zinc-900" : "text-zinc-700"}`}
                >
                  All courses
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategory(cat); setFiltersOpen(false); }}
                    className={`flex w-full px-3 py-2 text-left text-xs font-medium hover:bg-zinc-50 ${category === cat ? "bg-zinc-900 text-white hover:bg-zinc-900" : "text-zinc-700"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Course Title"
            className="min-w-0 flex-1 rounded-full bg-zinc-50 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:bg-white focus:ring-1 focus:ring-zinc-200"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
          <div className="flex overflow-hidden rounded-xl border bg-white shadow-sm">
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              className={`px-4 py-2 ${view === "list" ? "bg-[#0f172a] text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
            >
              <span className="flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor" />
                  <rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor" />
                  <rect x="2" y="11" width="12" height="2" rx="1" fill="currentColor" />
                </svg>
              </span>
            </button>
            <button
              onClick={() => setView("grid")}
              aria-label="Grid view"
              className={`px-4 py-2 ${view === "grid" ? "bg-[#3478ff] text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
            >
              <span className="flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <rect x="2" y="2" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="6" y="2" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="10" y="2" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="2" y="6" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="6" y="6" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="10" y="6" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="2" y="10" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="6" y="10" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="10" y="10" width="4" height="4" rx="1" fill="currentColor" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-zinc-500">No courses match your filters.</p>
      ) : view === "grid" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => (
            <CourseCard key={c.id} {...c} enrolled={enrolledIds.has(c.id)} />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((c) => {
            const disc = c.originalPrice && c.originalPrice > c.rawPrice ? Math.round(((c.originalPrice - c.rawPrice) / c.originalPrice) * 100) : 0;
            const enrolled = enrolledIds.has(c.id);
            const href = enrolled ? `/learn/${c.id}` : `/courses/${c.id}`;
            return (
              <a key={c.id} href={href} className="flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm hover:bg-zinc-50">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.accent} text-white`}>
                  <c.icon size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold leading-tight">{c.title}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {c.subtitle ? `${c.subtitle} • ` : ""}{c.category} • {c.level} • {c.instructor} • {c.studentCount} students{c.rating ? ` • ★ ${c.rating}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {enrolled ? (
                    <span className="rounded-full bg-[#0f172a] px-3 py-1 text-xs font-bold text-white">Go to course →</span>
                  ) : (
                    <>
                      {c.originalPrice && <span className="hidden text-xs text-zinc-400 line-through sm:inline">₹{c.originalPrice.toLocaleString("en-IN")}</span>}
                      {disc > 0 && <span className="hidden rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold sm:inline">{disc}% off</span>}
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold text-white ${c.price === "Free" ? "bg-emerald-600" : "bg-[#3478ff]"}`}>{c.price}</span>
                    </>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
