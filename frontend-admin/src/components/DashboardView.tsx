import { Link } from "react-router-dom";
import { ArrowUpRight } from "@masterlms/shared";
import type { AdminDashboard } from "../types/admin";
import { cn } from "../lib/utils";
import { Panel, PanelHeader, PageHeader } from "./Panel";
import { GridMessage } from "./DataGrid";

export function DashboardView({
  data,
  isLoading,
  error,
}: {
  data?: AdminDashboard;
  isLoading: boolean;
  error: string | null;
}) {
  if (isLoading) return <DashboardSkeleton />;
  if (error || !data)
    return (
      <Panel>
        <GridMessage
          kind="error"
          title="Could not load the overview"
          body={error ?? "The dashboard API returned no data. Retry, or check that the backend is running."}
        />
      </Panel>
    );

  const d = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description={`Platform activity across ${d.users.total} registered accounts.`}
      />

      {/*
        Metric rail. Revenue is the dominant figure because it is the one
        number an operator opens this panel for; the rest are a ledger of
        counts read at a glance.
      */}
      <div className="grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Revenue collected"
          value={`₹${d.revenue_inr.toLocaleString("en-IN")}`}
          caption={`${d.payments_paid} paid orders`}
          dominant
        />
        <Metric label="Registered users" value={d.users.total} caption={`${d.users.learners} learners`} />
        <Metric label="Live courses" value={d.courses.published} caption={`${d.courses.drafts} in draft`} />
        <Metric
          label="Enrollments"
          value={d.enrollments.total}
          caption={`${d.enrollments.completed} completed`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel flush>
          <PanelHeader title="Course composition" meta={`${d.courses.total} total`} />
          <div className="space-y-4 p-5">
            <Bar label="Paid" value={d.courses.paid} total={d.courses.total} tone="ink" />
            <Bar label="Free" value={d.courses.free} total={d.courses.total} tone="muted" />
            <Bar label="Published" value={d.courses.published} total={d.courses.total} tone="live" />
            <Bar label="Draft" value={d.courses.drafts} total={d.courses.total} tone="hold" />
          </div>
        </Panel>

        <Panel flush>
          <PanelHeader title="Learner progress" meta={`${d.enrollments.total} enrollments`} />
          <div className="space-y-4 p-5">
            <Bar label="In progress" value={d.enrollments.in_progress} total={d.enrollments.total} tone="flight" />
            <Bar label="Completed" value={d.enrollments.completed} total={d.enrollments.total} tone="live" />
            <p className="border-t border-rule pt-4 text-xs leading-relaxed text-ink-muted">
              Completion rate{" "}
              <span className="tnum font-semibold text-ink">
                {d.enrollments.total === 0
                  ? "0%"
                  : `${Math.round((d.enrollments.completed / d.enrollments.total) * 100)}%`}
              </span>{" "}
              of all enrollments.
            </p>
          </div>
        </Panel>

        <Panel flush>
          <PanelHeader
            title="Top categories"
            action={
              <Link
                to="/courses"
                className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                All courses <ArrowUpRight size={12} strokeWidth={2.5} aria-hidden />
              </Link>
            }
          />
          {d.top_categories.length === 0 ? (
            <GridMessage
              kind="empty"
              title="No categories yet"
              body="Categories appear here once instructors start publishing courses."
            />
          ) : (
            <ol className="divide-y divide-rule">
              {d.top_categories.map((c, i) => (
                <li key={c.category} className="flex items-center gap-3 px-5 py-3">
                  <span className="tnum w-5 shrink-0 text-[11px] font-semibold text-ink-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                    {c.category}
                  </span>
                  <span className="tnum shrink-0 text-sm font-semibold text-ink-muted">{c.count}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel flush>
          <PanelHeader
            title="Recent users"
            action={
              <Link
                to="/users"
                className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                All users <ArrowUpRight size={12} strokeWidth={2.5} aria-hidden />
              </Link>
            }
          />
          {d.recent_users.length === 0 ? (
            <GridMessage
              kind="empty"
              title="No accounts yet"
              body="New learner and instructor accounts will appear here as soon as they register."
            />
          ) : (
            <ul className="divide-y divide-rule">
              {d.recent_users.map((u) => (
                <li key={u.id}>
                  <Link
                    to={`/users/${u.id}`}
                    className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-paper-sunk"
                  >
                    <Avatar src={u.avatar} name={u.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{u.name}</p>
                      <p className="tnum truncate text-xs text-ink-faint">+91 {u.mobile}</p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                      {u.role}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel flush>
          <PanelHeader
            title="Recent enrollments"
            action={
              <Link
                to="/enrollments"
                className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                All enrollments <ArrowUpRight size={12} strokeWidth={2.5} aria-hidden />
              </Link>
            }
          />
          {d.recent_enrollments.length === 0 ? (
            <GridMessage
              kind="empty"
              title="No enrollments yet"
              body="When a learner joins a course, the enrolment and its progress show up here."
            />
          ) : (
            <ul className="divide-y divide-rule">
              {d.recent_enrollments.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{e.course}</p>
                    <p className="truncate text-xs text-ink-faint">
                      {e.learner} ·{" "}
                      {new Date(e.enrolled_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "tnum shrink-0 text-xs font-semibold",
                      e.progress === 100 ? "text-live" : "text-flight",
                    )}
                  >
                    {e.progress}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  caption,
  dominant = false,
}: {
  label: string;
  value: number | string;
  caption?: string;
  dominant?: boolean;
}) {
  return (
    <div className={cn("bg-paper-raised p-5", dominant && "sm:col-span-2")}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </p>
      <p
        className={cn(
          "tnum mt-2 font-semibold tracking-tight text-ink",
          dominant ? "text-4xl" : "text-3xl",
        )}
      >
        {value}
      </p>
      {caption && <p className="mt-1.5 text-xs text-ink-muted">{caption}</p>}
    </div>
  );
}

const TONE_BAR: Record<string, string> = {
  ink: "bg-ink",
  muted: "bg-rule-strong",
  live: "bg-live",
  hold: "bg-hold",
  flight: "bg-flight",
};

function Bar({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: keyof typeof TONE_BAR;
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        <span className="tnum text-xs font-semibold text-ink">
          {value}
          <span className="ml-1.5 text-[10px] font-normal text-ink-faint">{pct}%</span>
        </span>
      </div>
      <div
        className="h-1.5 w-full bg-rule/45"
        role="img"
        aria-label={`${label}: ${value} of ${total}`}
      >
        <div
          className={cn("h-full transition-[width] duration-500 ease-out", TONE_BAR[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Avatar({ src, name }: { src?: string; name: string }) {
  if (src) return <img src={src} alt="" className="h-8 w-8 shrink-0 object-cover" />;
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-paper-sunk text-[11px] font-semibold text-ink-muted">
      {(name[0] ?? "?").toUpperCase()}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading overview">
      <div className="h-10 w-56 animate-pulse bg-paper-sunk" />
      <div className="grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-paper-raised p-5">
            <div className="h-2.5 w-20 animate-pulse bg-paper-sunk" />
            <div className="mt-3 h-8 w-24 animate-pulse bg-paper-sunk" />
            <div className="mt-2 h-2.5 w-16 animate-pulse bg-paper-sunk" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-56 animate-pulse border border-rule bg-paper-raised" />
        ))}
      </div>
    </div>
  );
}