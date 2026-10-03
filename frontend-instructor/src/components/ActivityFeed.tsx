import { Link } from "react-router-dom";
import { Award, CheckCircle2, HelpCircle, Shield, Star, Trophy } from "@masterlms/shared";
import type { InstructorActivityItem } from "../hooks/useInstructorActivity";
import { PageHeader } from "./Panel";
import { ListMessage, ListPanel, Pager, SkeletonRows } from "./DataGrid";
import { Button } from "./Button";
import { Select } from "./Controls";
import { cn } from "../lib/utils";

/*
 * The old feed used six hand-picked Tailwind pastel/ring combinations keyed on
 * the verb. That made the event type the loudest thing on the page. Now the
 * verb is carried by the word and the icon, and colour only marks live.
 */

const VERBS: { value: string; label: string }[] = [
  { value: "", label: "All activity" },
  { value: "enrolled", label: "Enrolled" },
  { value: "completed_lesson", label: "Completed a lesson" },
  { value: "quiz_attempt", label: "Quiz attempt" },
  { value: "rated_course", label: "Rated" },
  { value: "earned_certificate", label: "Certificate" },
];

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

const VERB_ICON: Record<string, typeof Award> = {
  enrolled: Award,
  completed_lesson: CheckCircle2,
  quiz_attempt: HelpCircle,
  rated_course: Star,
  earned_certificate: Trophy,
};

function verbLabel(verb: string): string {
  switch (verb) {
    case "enrolled":
      return "enrolled";
    case "completed_lesson":
      return "completed a lesson in";
    case "quiz_attempt":
      return "attempted a quiz in";
    case "rated_course":
      return "rated";
    case "earned_certificate":
      return "earned a certificate in";
    default:
      return verb.replace(/_/g, " ");
  }
}

function primaryText(item: InstructorActivityItem): string {
  const m = item.meta as Record<string, unknown>;
  const who = item.learner?.name ?? "A learner";
  switch (item.verb) {
    case "enrolled":
      return `${who} enrolled`;
    case "completed_lesson":
      return `${who} completed ${item.lesson_title ?? "a lesson"}`;
    case "quiz_attempt": {
      const score = m.score as number | undefined;
      const total = m.total as number | undefined;
      return `${who} scored ${score ?? 0}${total ? ` of ${total}` : ""}`;
    }
    case "rated_course":
      return `${who} rated ${item.course_title ?? "a course"} ${m.rating ?? ""}`.trim();
    case "earned_certificate":
      return `${who} earned a certificate`;
    default:
      return `${who} ${verbLabel(item.verb)}`;
  }
}

function secondaryText(item: InstructorActivityItem): string {
  const m = item.meta as Record<string, unknown>;
  switch (item.verb) {
    case "quiz_attempt":
      return m.attempt != null ? `Attempt ${m.attempt}` : "Quiz attempt";
    case "rated_course":
      return item.course_title ?? "Course review";
    case "earned_certificate":
      return item.course_title ?? "Course completion";
    default:
      return item.course_title ?? "";
  }
}

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
  const filtered = Boolean(params.courseId || params.verb);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feed"
        title="Activity"
        description="Every learner action on your courses, newest first."
      />

      <ListPanel
        toolbar={
          <>
            <Select
              value={params.courseId}
              onChange={(e) => onCourse(e.target.value)}
              aria-label="Filter by course"
              className="w-full min-w-[180px] sm:w-auto"
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title}
                </option>
              ))}
            </Select>
            <Select
              value={params.verb}
              onChange={(e) => onVerb(e.target.value)}
              aria-label="Filter by activity type"
              className="w-full min-w-[180px] sm:w-auto"
            >
              {VERBS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </Select>
            {filtered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onCourse("");
                  onVerb("");
                }}
              >
                Clear filters
              </Button>
            )}
          </>
        }
        footer={
          meta && meta.pages > 1 ? (
            <Pager
              page={meta.page}
              pages={meta.pages}
              total={meta.total}
              onChange={onPage}
              noun="event"
            />
          ) : null
        }
      >
        {isError ? (
          <ListMessage
            kind="error"
            title="Could not load activity"
            body={error?.message ?? "The request failed. Check your connection and try again."}
            action={
              <Button variant="secondary" size="sm" onClick={onRetry}>
                Retry
              </Button>
            }
          />
        ) : isLoading ? (
          <SkeletonRows rows={6} />
        ) : items.length === 0 ? (
          <ListMessage
            kind="empty"
            title={
              meta?.total === 0
                ? "No activity yet"
                : params.verb
                  ? `No ${verbLabel(params.verb)} events`
                  : "No matching events"
            }
            body={
              meta?.total === 0
                ? "Publish a course and share its link. Enrolments, completions and reviews land here as they happen."
                : "Try a different activity type or course, or clear the filters to see everything."
            }
            action={
              meta?.total === 0 ? (
                <Link
                  to="/courses/create"
                  className="inline-flex h-9 items-center border border-ink bg-ink px-4 text-xs font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
                >
                  Create your first course
                </Link>
              ) : null
            }
          />
        ) : (
          <ul className="divide-y divide-rule">
            {items.map((item) => {
              const Icon = VERB_ICON[item.verb] ?? Shield;
              const accent = item.verb === "completed_lesson";
              return (
                <li key={item.id} className="row-hover flex gap-3 px-4 py-3">
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center border",
                      accent
                        ? "border-live/25 bg-live-soft text-live"
                        : "border-rule bg-slate-sunk text-ink-muted",
                    )}
                  >
                    <Icon size={16} strokeWidth={2.2} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{primaryText(item)}</p>
                    {(secondaryText(item) || item.learner?.city) && (
                      <p className="truncate text-xs text-ink-faint">
                        {[secondaryText(item), item.learner?.city].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="tnum text-xs text-ink-faint">{timeAgo(item.created_at)}</p>
                    {item.course_title && (
                      <p className="mt-1 max-w-[160px] truncate text-[11px] font-medium text-ink-muted">
                        {item.course_title}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ListPanel>
    </div>
  );
}