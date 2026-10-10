import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye, Pencil, type LucideIcon } from "@masterlms/shared";
import { absoluteMediaUrl, api } from "../lib/api";
import { StudentPreviewModal } from "../components/StudentPreviewModal";
import { PageHeader, Panel } from "../components/Panel";
import { ListMessage, ListPanel, Pager, SkeletonRows } from "../components/DataGrid";
import { Badge, statusTone } from "../components/Badge";
import { Button, Segmented } from "../components/Button";
import { SearchInput, Select } from "../components/Controls";
import { cn } from "../lib/utils";

type ApiCourse = {
  id: number;
  title: string;
  status: string;
  cover_image: string;
  created_at: string;
  updated_at: string;
  student_count: number;
  instructor_name: string;
  price: string;
};

const PER_PAGE = 12;

async function fetchMine(): Promise<ApiCourse[]> {
  try {
    const data = await api<{ results: ApiCourse[] } | ApiCourse[]>("/courses/mine/");
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch {
    return [];
  }
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/* Deterministic cover art, drawn in the studio palette rather than a stock
   photo, so an un-published course still looks deliberate. */
function CoverPattern({ id, cover }: { id: number; cover: string | null }) {
  if (cover) return <img src={cover} alt="" className="h-full w-full object-cover" />;
  const variant = id % 3;
  const dark = variant !== 2;
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center",
        dark ? "bg-slate-deep" : "bg-slate-sunk",
      )}
      style={{
        backgroundImage: dark
          ? "linear-gradient(to right,rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.07) 1px,transparent 1px)"
          : "linear-gradient(to right,rgba(28,32,45,.06) 1px,transparent 1px),linear-gradient(to bottom,rgba(28,32,45,.06) 1px,transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      {variant === 1 ? (
        <span aria-hidden className={cn("h-8 w-8 rounded-full", dark ? "bg-signal/80" : "bg-rule-strong")} />
      ) : (
        <span
          aria-hidden
          className={cn("h-9 w-9", dark ? "bg-slate-panel/90" : "bg-rule-strong")}
          style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
        />
      )}
    </div>
  );
}

export function CourseManageContainer() {
  const { data, isLoading } = useQuery({ queryKey: ["mine-courses"], queryFn: fetchMine });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "draft" | "published">("all");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "list">("list");
  const [previewId, setPreviewId] = useState<number | null>(null);

  const list = data ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (q && !c.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [list, query, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // Changing a filter must return the operator to page 1, or they land on an
  // empty page and think the filter broke.
  const applyQuery = (v: string) => {
    setQuery(v);
    setPage(1);
  };
  const applyStatus = (v: "all" | "draft" | "published") => {
    setStatus(v);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Your courses"
        description="Draft, publish and preview every course you have built."
        action={
          <Link
            to="/courses/create"
            className="inline-flex h-10 items-center gap-2 border border-ink bg-ink px-4 text-sm font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
          >
            New course
          </Link>
        }
      />

      {isLoading ? (
        <Panel flush>
          <SkeletonRows rows={5} />
        </Panel>
      ) : list.length === 0 ? (
        <Panel flush>
          <ListMessage
            kind="empty"
            title="No courses yet"
            body="A course is a set of chapters and lessons. Create your first one and it will appear here as a draft until you publish it."
            action={
              <Link
                to="/courses/create"
                className="inline-flex h-9 items-center border border-ink bg-ink px-4 text-xs font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
              >
                Create your first course
              </Link>
            }
          />
        </Panel>
      ) : (
        <ListPanel
          toolbar={
            <>
              <SearchInput value={query} onChange={applyQuery} placeholder="Search by course title" />
              <Select
                value={status}
                onChange={(e) => applyStatus(e.target.value as typeof status)}
                aria-label="Filter by status"
                className="w-auto min-w-[150px]"
              >
                <option value="all">All courses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </Select>
              <div className="ml-auto">
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
            </>
          }
          footer={
            filtered.length > 0 ? (
              <Pager
                page={safePage}
                pages={pages}
                total={filtered.length}
                onChange={setPage}
                noun="course"
              />
            ) : null
          }
        >
          {visible.length === 0 ? (
            <ListMessage
              kind="empty"
              title="No courses match those filters"
              body="Try a different title, or clear the status filter to see everything you have built."
            />
          ) : view === "grid" ? (
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((c) => (
                <CourseCard key={c.id} course={c} onPreview={() => setPreviewId(c.id)} />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-rule">
              {visible.map((c) => (
                <CourseRow key={c.id} course={c} onPreview={() => setPreviewId(c.id)} />
              ))}
            </ul>
          )}
        </ListPanel>
      )}

      {previewId !== null && (
        <StudentPreviewModal courseId={String(previewId)} onClose={() => setPreviewId(null)} />
      )}
    </div>
  );
}

function CourseRow({
  course: c,
  onPreview,
}: {
  course: ApiCourse;
  onPreview: () => void;
}) {
  const cover = absoluteMediaUrl(c.cover_image);

  return (
    <li className="row-hover flex flex-wrap items-center gap-4 px-4 py-3.5 sm:flex-nowrap">
      <div className="h-12 w-20 shrink-0 overflow-hidden border border-rule bg-slate-sunk">
        <CoverPattern id={c.id} cover={cover} />
      </div>

      <div className="min-w-0 flex-1">
        <Link
          to={`/courses/${c.id}`}
          className="block max-w-[420px] truncate text-sm font-medium text-ink hover:underline"
        >
          {c.title}
        </Link>
        <p className="tnum mt-0.5 truncate text-xs text-ink-faint">
          {c.student_count} {c.student_count === 1 ? "learner" : "learners"} · updated{" "}
          {timeAgo(c.updated_at || c.created_at)}
        </p>
      </div>

      <div className="hidden w-24 shrink-0 text-right sm:block">
        <p className="tnum text-sm font-semibold text-ink">
          {c.price && Number(c.price) > 0 ? `₹${Number(c.price).toLocaleString("en-IN")}` : "Free"}
        </p>
        <p className="text-[11px] text-ink-faint">price</p>
      </div>

      <div className="shrink-0">
        <Badge tone={statusTone(c.status)}>{c.status}</Badge>
      </div>

      <CourseActions course={c} onPreview={onPreview} />
    </li>
  );
}

function CourseActions({
  course,
  onPreview,
}: {
  course: ApiCourse;
  onPreview: () => void;
}) {
  const actions: { label: string; Icon: LucideIcon; to?: string; onClick?: () => void }[] = [
    { label: "Edit", Icon: Pencil, to: `/courses/${course.id}` },
    { label: "Preview", Icon: Eye, onClick: onPreview },
  ];

  return (
    <div className="flex shrink-0 items-center gap-1">
      {actions.map(({ label, Icon, to, onClick }) =>
        to ? (
          <Link
            key={label}
            to={to}
            className="inline-flex h-8 items-center gap-1.5 border border-rule px-2.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-slate-sunk hover:text-ink"
          >
            <Icon size={14} strokeWidth={2.25} aria-hidden />
            {label}
          </Link>
        ) : (
          <Button key={label} variant="secondary" size="sm" onClick={onClick}>
            <Icon size={14} strokeWidth={2.25} aria-hidden />
            {label}
          </Button>
        ),
      )}
    </div>
  );
}

function CourseCard({
  course: c,
  onPreview,
}: {
  course: ApiCourse;
  onPreview: () => void;
}) {
  const cover = absoluteMediaUrl(c.cover_image);

  return (
    <li className="flex flex-col border border-rule bg-slate-panel transition-colors hover:bg-slate-sunk">
      <div className="aspect-[16/9] overflow-hidden border-b border-rule">
        <CoverPattern id={c.id} cover={cover} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/courses/${c.id}`}
            className="line-clamp-2 text-sm font-medium leading-snug text-ink hover:underline"
          >
            {c.title}
          </Link>
          <Badge tone={statusTone(c.status)}>{c.status}</Badge>
        </div>
        <p className="tnum text-xs text-ink-faint">
          {c.student_count} {c.student_count === 1 ? "learner" : "learners"} · updated{" "}
          {timeAgo(c.updated_at || c.created_at)}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="tnum text-sm font-semibold text-ink">
            {c.price && Number(c.price) > 0 ? `₹${Number(c.price).toLocaleString("en-IN")}` : "Free"}
          </span>
          <CourseActions course={c} onPreview={onPreview} />
        </div>
      </div>
    </li>
  );
}