import { Link } from "react-router-dom";
import { ArrowRight, Plus, Users, FileText, Star, DollarSign } from "@masterlms/shared";
import { InstructorHeader } from "./InstructorHeader";
import { useAuth } from "../hooks/useAuth";
import type { InstructorOverview } from "../containers/Dashboard.container";
import { PageShell, Panel, PanelHeader, PageHeader, Eyebrow } from "./Panel";
import { ListMessage, SkeletonRows } from "./DataGrid";
import { cn } from "../lib/utils";

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function priceLabel(price: string): string {
  const n = Number(price);
  if (!n) return "Free";
  return `₹${n.toLocaleString("en-IN")}`;
}

export function DashboardView({
  overview,
  isLoading,
}: {
  overview: InstructorOverview | null;
  isLoading: boolean;
}) {
  const user = useAuth((s) => s.user);
  const firstName = user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const students = overview?.total_students ?? 0;
  const revenue = overview?.revenue_inr ?? 0;
  const courses = overview?.total_courses ?? 0;
  const drafts = overview?.drafts ?? 0;
  const rating =
    overview && Number(overview.average_rating) > 0
      ? Number(overview.average_rating).toFixed(1)
      : null;
  const recent = overview?.recent_enrollments ?? [];

  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell>
        <div className="space-y-6">
          <PageHeader
            eyebrow={greeting}
            title={`${firstName}, here is your studio`}
            description="Revenue, learners and what still needs finishing."
            action={
              <Link
                to="/courses/create"
                className="inline-flex h-10 items-center gap-2 border border-ink bg-ink px-4 text-sm font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
              >
                <Plus size={15} strokeWidth={2.75} aria-hidden />
                Create course
              </Link>
            }
          />

          {isLoading ? (
            <div className="grid gap-px border border-rule bg-rule lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-slate-panel p-5">
                  <div className="h-2.5 w-20 animate-pulse bg-slate-sunk" />
                  <div className="mt-3 h-8 w-24 animate-pulse bg-slate-sunk" />
                </div>
              ))}
            </div>
          ) : (
            /*
             * Revenue is the number an instructor opens this panel for, so it
             * gets the dominant cell. The rest are counts, read at a glance.
             */
            <div className="grid gap-px border border-rule bg-rule lg:grid-cols-4">
              <Metric
                label="Revenue earned"
                value={`₹${revenue.toLocaleString("en-IN")}`}
                caption={revenue === 0 ? "No sales yet" : "85% of every payment"}
                dominant
                Icon={DollarSign}
              />
              <Metric
                label="Learners enrolled"
                value={students.toLocaleString("en-IN")}
                caption={students === 0 ? "Share a course link" : "across all courses"}
                Icon={Users}
              />
              <Metric
                label="Courses"
                value={String(courses)}
                caption={courses === 0 ? "Nothing published" : drafts > 0 ? `${drafts} still draft` : "all published"}
                Icon={FileText}
              />
              <Metric
                label="Average rating"
                value={rating ?? "—"}
                caption={rating ? `top: ${overview?.top_course?.title ?? "—"}` : "no ratings yet"}
                Icon={Star}
              />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Panel flush>
              <PanelHeader
                className="border-b border-rule px-5 py-3"
                title="Recent enrolments"
                meta={`${recent.length} latest`}
                action={
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
                  >
                    All courses <ArrowRight size={12} strokeWidth={2.5} aria-hidden />
                  </Link>
                }
              />
              {isLoading ? (
                <SkeletonRows rows={4} />
              ) : recent.length === 0 ? (
                <ListMessage
                  kind="empty"
                  title="No learners yet"
                  body="Publish a course and share its link. Enrolments appear here the moment someone joins."
                  action={
                    <Link
                      to="/courses/create"
                      className="inline-flex h-9 items-center border border-ink bg-ink px-4 text-xs font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
                    >
                      Create your first course
                    </Link>
                  }
                />
              ) : (
                <ul className="divide-y divide-rule">
                  {recent.map((e) => (
                    <li
                      key={`${e.learner}-${e.course}-${e.enrolled_at}`}
                      className="row-hover flex items-center gap-3 px-5 py-3"
                    >
                      <span
                        aria-hidden
                        className="flex h-8 w-8 shrink-0 items-center justify-center bg-slate-sunk text-xs font-semibold text-ink-muted"
                      >
                        {(e.learner[0] ?? "?").toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{e.learner}</p>
                        <p className="truncate text-xs text-ink-faint">joined {e.course}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="tnum text-sm font-semibold text-ink">{priceLabel(e.price)}</p>
                        <p className="tnum text-[11px] text-ink-faint">{timeAgo(e.enrolled_at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel flush>
              <PanelHeader className="border-b border-rule px-5 py-3" title="Next actions" />
              <ul className="divide-y divide-rule">
                {[
                  {
                    to: "/courses/create",
                    title: "Create a course",
                    body: "Start from a blank outline",
                  },
                  {
                    to: "/assignments",
                    title: "Build an assignment",
                    body: "Upload a PDF, generate questions",
                  },
                  {
                    to: "/packs",
                    title: "Bundle a question pack",
                    body: "Reuse questions across courses",
                  },
                  {
                    to: "/analytics",
                    title: "Read your analytics",
                    body: "Drop-off by lesson, revenue over time",
                  },
                ].map((a) => (
                  <li key={a.to}>
                    <Link
                      to={a.to}
                      className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-sunk"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{a.title}</p>
                        <p className="mt-0.5 text-xs text-ink-faint">{a.body}</p>
                      </div>
                      <ArrowRight
                        size={15}
                        strokeWidth={2.25}
                        aria-hidden
                        className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </PageShell>
    </div>
  );
}

function Metric({
  label,
  value,
  caption,
  dominant = false,
  Icon,
}: {
  label: string;
  value: string;
  caption?: string;
  dominant?: boolean;
  Icon: typeof Users;
}) {
  return (
    <div className={cn("bg-slate-panel p-5", dominant && "sm:col-span-2")}>
      <div className="flex items-start justify-between gap-2">
        <Eyebrow>{label}</Eyebrow>
        <Icon size={15} strokeWidth={2.2} aria-hidden className="shrink-0 text-ink-faint" />
      </div>
      <p
        className={cn(
          "tnum mt-2.5 font-semibold tracking-tight text-ink",
          dominant ? "text-4xl" : "text-3xl",
        )}
      >
        {value}
      </p>
      {caption && <p className="mt-1.5 truncate text-xs text-ink-muted">{caption}</p>}
    </div>
  );
}