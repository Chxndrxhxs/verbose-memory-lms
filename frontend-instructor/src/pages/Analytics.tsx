import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { InstructorHeader } from "../components/InstructorHeader";
import { api } from "../lib/api";
import { PageHeader, PageShell, Panel, PanelHeader } from "../components/Panel";
import { ListMessage } from "../components/DataGrid";
import { Eyebrow } from "../components/Panel";
import { Badge, statusTone } from "../components/Badge";
import { cn } from "../lib/utils";

type OverviewCourse = {
  id: number;
  title: string;
  students: number;
  price: string;
  status: string;
};

type Overview = {
  total_students: number;
  revenue_inr: number;
  published_courses: number;
  top_course: { id: number; title: string; students: number } | null;
  courses: OverviewCourse[];
};

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["instructor-overview"],
    queryFn: () => api<Overview>("/instructor/overview"),
  });

  const students = data?.total_students ?? 0;
  const revenue = data?.revenue_inr ?? 0;
  const courses = data?.courses ?? [];
  const maxStudents = Math.max(1, ...courses.map((c) => c.students));
  const hasRevenue = revenue > 0;

  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell>
        <div className="space-y-6">
          <PageHeader
            eyebrow="Performance"
            title="Analytics"
            description="Which courses earn, which enroll, and how far learners get."
          />

          <div className="grid gap-px border border-rule bg-rule sm:grid-cols-3">
            <Panel className="border-0">
              <Eyebrow>Revenue earned</Eyebrow>
              <p className="tnum mt-2 text-3xl font-semibold tracking-tight text-ink">
                {isLoading ? "—" : `₹${revenue.toLocaleString("en-IN")}`}
              </p>
              <p className="mt-1.5 text-xs text-ink-muted">
                {hasRevenue ? "85% of every payment lands in your account" : "No payments received yet"}
              </p>
            </Panel>

            <Panel className="border-0">
              <Eyebrow>Learners enrolled</Eyebrow>
              <p className="tnum mt-2 text-3xl font-semibold tracking-tight text-ink">
                {isLoading ? "—" : students.toLocaleString("en-IN")}
              </p>
              <p className="mt-1.5 text-xs text-ink-muted">
                {(data?.published_courses ?? courses.length) > 0
                  ? `across ${data?.published_courses ?? courses.length} ${
                      (data?.published_courses ?? courses.length) === 1
                        ? "published course"
                        : "published courses"
                    }`
                  : "Publish a course to start enrolling"}
              </p>
            </Panel>

            <Panel className="border-0">
              <Eyebrow>Top course</Eyebrow>
              {data?.top_course ? (
                <>
                  <p className="mt-2 truncate text-base font-semibold text-ink">
                    {data.top_course.title}
                  </p>
                  <p className="tnum mt-1.5 text-xs text-ink-muted">
                    {data.top_course.students} enrolled
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-base font-semibold text-ink">
                    {isLoading ? "—" : "Nothing yet"}
                  </p>
                  <p className="mt-1.5 text-xs text-ink-muted">
                    Publish a course to see what learners pick
                  </p>
                </>
              )}
            </Panel>
          </div>

          <Panel flush>
            <PanelHeader
              className="border-b border-rule px-5 py-3"
              title="Enrolments by course"
              meta={courses.length > 0 ? `${courses.length} courses` : undefined}
            />
            {isLoading ? (
              <div className="space-y-4 px-5 py-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-8 animate-pulse bg-slate-sunk" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <ListMessage
                kind="empty"
                title="No courses to compare yet"
                body="Once you publish a course, this chart compares enrolment across your whole catalogue so you can see what learners actually choose."
                action={
                  <Link
                    to="/courses/create"
                    className="inline-flex h-9 items-center border border-ink bg-ink px-4 text-xs font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
                  >
                    Create a course
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-rule">
                {courses.map((c) => {
                  const pct = Math.round((c.students / maxStudents) * 100);
                  return (
                    <li key={c.id} className="row-hover px-5 py-3.5">
                      <div className="flex items-baseline justify-between gap-4">
                        <Link
                          to={`/courses/${c.id}`}
                          className="min-w-0 truncate text-sm font-medium text-ink hover:underline"
                        >
                          {c.title}
                        </Link>
                        <span className="tnum shrink-0 text-sm font-semibold text-ink">
                          {c.students}
                          <span className="ml-2 text-[11px] font-normal text-ink-faint">{pct}%</span>
                        </span>
                      </div>
                      {/* Named bar with a text value, so the number is never colour-only. */}
                      <div
                        className="mt-2 h-2 w-full bg-rule/45"
                        role="img"
                        aria-label={`${c.title}: ${c.students} learners enrolled`}
                      >
                        <div
                          className={cn(
                            "h-full transition-[width] duration-500 ease-out",
                            c.status === "published" ? "bg-live" : "bg-hold",
                          )}
                          style={{ width: `${Math.max(pct, 1)}%` }}
                        />
                      </div>
                      <div className="mt-1.5">
                        <Badge tone={statusTone(c.status)} showIcon={false}>
                          {c.status}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </PageShell>
    </div>
  );
}