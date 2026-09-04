import { Link } from "react-router-dom";
import { Award, CheckCircle2, HelpCircle, Shield, Star, Trophy } from "lucide-react";
import type { InstructorActivityItem } from "../hooks/useInstructorActivity";

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function verbIcon(verb: string) {
  if (verb === "enrolled") return { Icon: Award, bg: "bg-amber-50 text-amber-700 ring-amber-200" };
  if (verb === "completed_lesson") return { Icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  if (verb === "quiz_attempt") return { Icon: HelpCircle, bg: "bg-sky-50 text-sky-700 ring-sky-200" };
  if (verb === "rated_course") return { Icon: Star, bg: "bg-yellow-50 text-amber-700 ring-yellow-200" };
  if (verb === "earned_certificate") return { Icon: Trophy, bg: "bg-amber-100 text-amber-900 ring-amber-300" };
  return { Icon: Shield, bg: "bg-zinc-50 text-zinc-600 ring-zinc-200" };
}

function verbLabel(verb: string): string {
  if (verb === "enrolled") return "enrolled";
  if (verb === "completed_lesson") return "completed";
  if (verb === "quiz_attempt") return "quiz";
  if (verb === "rated_course") return "rated";
  if (verb === "earned_certificate") return "certificate";
  return verb;
}

function primaryText(item: InstructorActivityItem): string {
  const name = item.learner?.name ?? "Someone";
  const course = item.course_title ?? "a course";
  const lesson = item.lesson_title ?? "a lesson";
  const meta = item.meta as Record<string, unknown>;
  if (item.verb === "enrolled") return `${name} enrolled in ${course}`;
  if (item.verb === "completed_lesson") return `${name} completed ${lesson}`;
  if (item.verb === "quiz_attempt") {
    const s = meta.score as number | undefined;
    const t = meta.total as number | undefined;
    if (typeof s === "number" && typeof t === "number") return `${name} scored ${s}/${t} on ${lesson}`;
    return `${name} attempted ${lesson}`;
  }
  if (item.verb === "rated_course") {
    const r = meta.rating as number | undefined;
    return r != null ? `${name} rated ${course} ${r}★` : `${name} rated ${course}`;
  }
  if (item.verb === "earned_certificate") return `${name} earned certificate · ${course}`;
  return `${name} — ${item.verb}`;
}

function secondaryText(item: InstructorActivityItem): string {
  const course = item.course_title ?? "";
  const lesson = item.lesson_title ?? "";
  const meta = item.meta as Record<string, unknown>;
  if (item.verb === "enrolled") {
    const city = item.learner?.city ? `${item.learner.city} → ` : "";
    return `${city}${course}`;
  }
  if (item.verb === "completed_lesson") return course;
  if (item.verb === "quiz_attempt") {
    const attempt = meta.attempt != null ? ` · attempt ${String(meta.attempt)}` : "";
    return `${lesson} · ${course}${attempt}`;
  }
  if (item.verb === "rated_course") return course;
  if (item.verb === "earned_certificate") {
    const cid = meta.certificate_id ? ` · ${String(meta.certificate_id)}` : "";
    return `${course}${cid}`;
  }
  return course || lesson;
}

const VERBS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "enrolled", label: "Enrolled" },
  { value: "completed_lesson", label: "Completed" },
  { value: "quiz_attempt", label: "Quiz" },
  { value: "rated_course", label: "Rated" },
  { value: "earned_certificate", label: "Certificate" },
];

export function ActivityFeed({
  items,
  meta,
  isLoading,
  isError,
  error,
  onRetry,
  params,
  courses,
  onCourse,
  onVerb,
  onPage,
}: {
  items: InstructorActivityItem[];
  meta: { page: number; total: number; pages: number } | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
  params: { courseId: string; verb: string; page: number };
  courses: { id: number; title: string }[];
  onCourse: (v: string) => void;
  onVerb: (v: string) => void;
  onPage: (p: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Activity</h1>
        <p className="text-sm text-zinc-500">Live feed of learner actions on your courses.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-white p-3 shadow-sm">
        <select
          value={params.courseId}
          onChange={(e) => onCourse(e.target.value)}
          className="rounded-full border bg-zinc-50 px-3 py-2 text-xs font-semibold outline-none"
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.title}</option>
          ))}
        </select>
        <select
          value={params.verb}
          onChange={(e) => onVerb(e.target.value)}
          className="rounded-full border bg-zinc-50 px-3 py-2 text-xs font-semibold outline-none"
        >
          {VERBS.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
        {params.courseId || params.verb ? (
          <button
            onClick={() => { onCourse(""); onVerb(""); }}
            className="rounded-full border bg-white px-3 py-2 text-xs font-semibold hover:bg-zinc-50"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {isError ? (
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Couldn't load activity</p>
          <p className="mt-1 text-xs text-zinc-500">{error?.message ?? "Try again."}</p>
          <button onClick={onRetry} className="mt-3 rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-bold text-white">Retry</button>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[64px] animate-pulse rounded-2xl bg-white shadow-sm" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-8 text-center shadow-sm">
          {meta?.total === 0 ? (
            <>
              <p className="text-sm font-bold">No activity yet</p>
              <p className="mt-1 text-xs text-zinc-500">Publish a course and share your link to get your first enrollments.</p>
              <Link to="/courses/create" className="mt-3 inline-block rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white">Create course</Link>
            </>
          ) : (
            <>
              <p className="text-sm font-bold">No {params.verb ? verbLabel(params.verb) : "matching"} events</p>
              <p className="mt-1 text-xs text-zinc-500">Try All verbs or another course.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            {items.map((item) => {
              const { Icon, bg } = verbIcon(item.verb);
              return (
                <div key={item.id} className="flex gap-3 border-b px-4 py-3 last:border-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ${bg}`}>
                    <Icon size={16} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight">{primaryText(item)}</p>
                    <p className="truncate text-xs text-zinc-500">{secondaryText(item)}</p>
                    {item.learner?.city ? <p className="text-[11px] text-zinc-400">{item.learner.city}</p> : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-zinc-600">{timeAgo(item.created_at)}</p>
                    {item.course_title ? <p className="mt-0.5 inline-block rounded-full bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-100">{item.course_title}</p> : null}
                  </div>
                </div>
              );
            })}
          </div>

          {meta && meta.pages > 1 ? (
            <div className="flex items-center justify-center gap-2">
              <button disabled={params.page <= 1} onClick={() => onPage(params.page - 1)} className="rounded-full border bg-white px-4 py-1.5 text-xs font-bold disabled:opacity-40">Prev</button>
              <span className="text-xs text-zinc-500">Page {meta.page} / {meta.pages} · {meta.total} events</span>
              <button disabled={params.page >= meta.pages} onClick={() => onPage(params.page + 1)} className="rounded-full border bg-white px-4 py-1.5 text-xs font-bold disabled:opacity-40">Next</button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
