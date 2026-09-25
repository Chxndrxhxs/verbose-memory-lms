import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useQuery } from "@tanstack/react-query";
import { Diamond, Hexagon, Code, Target } from "@masterlms/shared";
import { CourseCard } from "../components/CourseCard";
import { api } from "../lib/api";
import { useMyCourses } from "../hooks/useMyCourses";
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
  const { data: myCourses } = useMyCourses();
  const progressById = useMemo(
    () =>
      new Map<string, number>(
        (myCourses ?? []).map((e) => [String(e.course.id), e.progress ?? 0] as [string, number])
      ),
    [myCourses]
  );
  const enrolledIds = new Set(progressById.keys());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [price, setPrice] = useState<string>("all");
  const [sort, setSort] = useState<string>("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query);

  const categories = useMemo(() => {
    const set = new Set((data ?? []).map((c) => c.category).filter(Boolean));
    return Array.from(set) as string[];
  }, [data]);
  const levels = useMemo(() => {
    const set = new Set((data ?? []).map((c) => c.level).filter(Boolean));
    return Array.from(set) as string[];
  }, [data]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const list = (data ?? []).filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (level !== "all" && (c.level ?? "") !== level) return false;
      if (price === "free" && c.rawPrice !== 0) return false;
      if (price === "paid" && c.rawPrice === 0) return false;
      if (!q) return true;
      return [c.title, c.subtitle ?? "", c.instructor, c.category ?? "", c.level ?? ""]
        .some((f) => f.toLowerCase().includes(q));
    });
    const by: Record<string, (a: Course, b: Course) => number> = {
      popular: (a, b) => b.studentCount - a.studentCount,
      rating: (a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0),
      priceLow: (a, b) => a.rawPrice - b.rawPrice,
      priceHigh: (a, b) => b.rawPrice - a.rawPrice,
    };
    return [...list].sort(by[sort] ?? by.popular);
  }, [data, debouncedQuery, category, level, price, sort]);
  const hasFilters =
    query.trim() !== "" || category !== "all" || level !== "all" || price !== "all";
  const clearAll = () => {
    setQuery("");
    setCategory("all");
    setLevel("all");
    setPrice("all");
  };

  if (isLoading) return <p className="py-10 text-center text-sm text-zinc-500">Loading courses…</p>;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border bg-white p-2 shadow-sm">
          <div className="relative">
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-haspopup="true"
              className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Filters{(category !== "all" || level !== "all" || price !== "all") && <span className="ml-1 rounded-full bg-zinc-900 px-1.5 text-[10px] text-white">•</span>} <span className="text-[10px]">▼</span>
            </button>
            {filtersOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-52 rounded-2xl border bg-white p-3 shadow-lg">
                <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-zinc-400">Category</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {["all", ...categories].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${category === cat ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"}`}
                    >
                      {cat === "all" ? "All" : cat}
                    </button>
                  ))}
                </div>
                <p className="mt-3 px-1 text-[11px] font-bold uppercase tracking-wide text-zinc-400">Level</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {["all", ...levels].map((lv) => (
                    <button
                      key={lv}
                      onClick={() => setLevel(lv)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${level === lv ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"}`}
                    >
                      {lv === "all" ? "Any" : lv}
                    </button>
                  ))}
                </div>
                <p className="mt-3 px-1 text-[11px] font-bold uppercase tracking-wide text-zinc-400">Price</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {[["all", "Any"], ["free", "Free"], ["paid", "Paid"]].map(([v, label]) => (
                    <button
                      key={v}
                      onClick={() => setPrice(v)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${price === v ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setFiltersOpen(false)} className="mt-3 w-full rounded-full bg-zinc-900 py-1.5 text-xs font-bold text-white">Done</button>
              </div>
            )}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, instructor, category…"
            aria-label="Search courses"
            className="min-w-0 flex-1 rounded-full bg-zinc-50 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:bg-white focus:ring-1 focus:ring-zinc-200"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="shrink-0 rounded-full px-2 py-1 text-xs font-bold text-zinc-400 hover:text-zinc-900">✕</button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort courses" className="rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm">
            <option value="popular">Most popular</option>
            <option value="rating">Highest rated</option>
            <option value="priceLow">Price: low to high</option>
            <option value="priceHigh">Price: high to low</option>
          </select>
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

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
        <p aria-live="polite">{filtered.length} course{filtered.length === 1 ? "" : "s"}{hasFilters ? " match your filters" : ""}</p>
        {hasFilters && (
          <button onClick={clearAll} className="font-semibold text-[#3478ff] hover:underline">Clear all</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed bg-white px-4 py-10 text-center">
          <p className="text-sm font-bold">No courses match your filters.</p>
          <p className="mt-1 text-xs text-zinc-500">Try a different search term or clear your filters.</p>
          <button onClick={clearAll} className="mt-3 rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white">Clear all filters</button>
        </div>
      ) : view === "grid" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => (
            <CourseCard key={c.id} {...c} enrolled={enrolledIds.has(c.id)} progress={progressById.get(c.id)} />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((c) => {
            const disc = c.originalPrice && c.originalPrice > c.rawPrice ? Math.round(((c.originalPrice - c.rawPrice) / c.originalPrice) * 100) : 0;
            const enrolled = enrolledIds.has(c.id);
            const pct = progressById.get(c.id) ?? 0;
            const to = enrolled ? `/learn/${c.id}` : `/courses/${c.id}`;
            const label = pct >= 100 ? "Review →" : pct > 0 ? `Continue ${pct}% →` : "Go to course →";
            return (
              <Link key={c.id} to={to} className="flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm hover:bg-zinc-50">
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
                    <span className="rounded-full bg-[#0f172a] px-3 py-1 text-xs font-bold text-white">{label}</span>
                  ) : (
                    <>
                      {c.originalPrice && <span className="hidden text-xs text-zinc-400 line-through sm:inline">₹{c.originalPrice.toLocaleString("en-IN")}</span>}
                      {disc > 0 && <span className="hidden rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold sm:inline">{disc}% off</span>}
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold text-white ${c.price === "Free" ? "bg-emerald-600" : "bg-[#3478ff]"}`}>{c.price}</span>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
