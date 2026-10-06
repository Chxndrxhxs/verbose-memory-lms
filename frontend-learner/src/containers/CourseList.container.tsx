import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useQuery } from "@tanstack/react-query";
import { Diamond, Hexagon, Code, Target } from "@masterlms/shared";
import { CourseCard } from "../components/CourseCard";
import { api } from "../lib/api";
import { useMyCourses } from "../hooks/useMyCourses";
import type { Course } from "../types/course";
import { Button, Segmented } from "../components/Button";
import { ListMessage } from "../components/DataGrid";
import { SearchInput, Select } from "../components/Controls";

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
  Design: "bg-ink",
  Business: "bg-ink",
  Engineering: "bg-ink",
  Marketing: "bg-live",
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
    accent: accentMap[c.category] ?? "bg-ink",
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

  if (isLoading) return <p className="py-10 text-center text-sm text-ink-muted">Loading courses…</p>;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 border border-rule bg-room-raised p-2">
          <div className="relative">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-haspopup="true"
            >
              Filters{(category !== "all" || level !== "all" || price !== "all") && <span className="tnum ml-1 px-1.5 text-[10px] font-semibold text-live">•</span>} <span aria-hidden className="text-[10px]">▼</span>
            </Button>
            {filtersOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-52 border border-rule-strong bg-room-raised p-3 shadow-lg">
                <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Category</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {["all", ...categories].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`border px-3 py-1 text-xs font-semibold transition-colors ${category === cat ? "border-ink bg-ink text-ink-inverse" : "border-rule bg-room-sunk text-ink-muted hover:text-ink"}`}
                    >
                      {cat === "all" ? "All" : cat}
                    </button>
                  ))}
                </div>
                <p className="mt-3 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Level</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {["all", ...levels].map((lv) => (
                    <button
                      key={lv}
                      type="button"
                      onClick={() => setLevel(lv)}
                      className={`border px-3 py-1 text-xs font-semibold capitalize transition-colors ${level === lv ? "border-ink bg-ink text-ink-inverse" : "border-rule bg-room-sunk text-ink-muted hover:text-ink"}`}
                    >
                      {lv === "all" ? "Any" : lv}
                    </button>
                  ))}
                </div>
                <p className="mt-3 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Price</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {[["all", "Any"], ["free", "Free"], ["paid", "Paid"]].map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPrice(v)}
                      className={`border px-3 py-1 text-xs font-semibold transition-colors ${price === v ? "border-ink bg-ink text-ink-inverse" : "border-rule bg-room-sunk text-ink-muted hover:text-ink"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <Button variant="primary" size="sm" block type="button" onClick={() => setFiltersOpen(false)} className="mt-3">Done</Button>
              </div>
            )}
          </div>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search title, instructor, category…"
            className="min-w-0"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="shrink-0 px-2 py-1 text-xs font-semibold text-ink-faint transition-colors hover:text-ink">✕</button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
          <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort courses" className="text-xs font-semibold">
            <option value="popular">Most popular</option>
            <option value="rating">Highest rated</option>
            <option value="priceLow">Price: low to high</option>
            <option value="priceHigh">Price: high to low</option>
          </Select>
          <Segmented
            value={view}
            onChange={setView}
            ariaLabel="Course layout"
            options={[
              { value: "grid" as const, label: "Grid" },
              { value: "list" as const, label: "List" },
            ]}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
        <p aria-live="polite" className="tnum">{filtered.length} course{filtered.length === 1 ? "" : "s"}{hasFilters ? " match your filters" : ""}</p>
        {hasFilters && (
          <button type="button" onClick={clearAll} className="font-semibold text-ink underline hover:text-ink-muted">Clear all</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 border border-rule bg-room-raised">
          <ListMessage
            kind="empty"
            title="No courses match your filters."
            body="Try a different search term or clear your filters."
            action={<Button variant="primary" size="sm" type="button" onClick={clearAll}>Clear all filters</Button>}
          />
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
              <Link key={c.id} to={to} className="flex items-center gap-3 border border-rule bg-room-raised p-3 transition-colors hover:bg-room-sunk">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center ${c.accent} text-ink-inverse`}>
                  <c.icon size={18} strokeWidth={2} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight text-ink">{c.title}</p>
                  <p className="tnum truncate text-xs text-ink-muted">
                    {c.subtitle ? `${c.subtitle} • ` : ""}{c.category} • {c.level} • {c.instructor} • {c.studentCount} students{c.rating ? ` • ★ ${c.rating}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {enrolled ? (
                    <span className="tnum border border-ink bg-ink px-3 py-1 text-xs font-semibold text-ink-inverse">{label}</span>
                  ) : (
                    <>
                      {c.originalPrice && <span className="tnum hidden text-xs text-ink-faint line-through sm:inline">₹{c.originalPrice.toLocaleString("en-IN")}</span>}
                      {disc > 0 && <span className="tnum hidden border border-gold-deep/35 bg-gold-wash px-1.5 py-0.5 text-[10px] font-semibold text-gold-deep sm:inline">{disc}% off</span>}
                      <span className={`tnum border px-2.5 py-1 text-xs font-semibold ${c.price === "Free" ? "border-live/25 bg-live-soft text-live" : "border-rule bg-room-sunk text-ink"}`}>{c.price}</span>
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
