import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, User } from "@masterlms/shared";
import type { AdminEnrollment } from "../types/admin";
import { cn } from "../lib/utils";
import { PageHeader } from "./Panel";
import { Button } from "./Button";
import { SearchInput, Select } from "./Controls";
import {
  GridHead,
  GridMessage,
  GridPanel,
  GridScroll,
  GridSkeleton,
  Td,
  Th,
  Tr,
} from "./DataGrid";
import { Pagination } from "./Pagination";
import { ConfirmDialog } from "./ConfirmDialog";

export function EnrollmentsView({
  data,
  total,
  pages,
  page,
  onPage,
  q,
  onSearch,
  progress,
  onProgress,
  searchLoading,
  loading,
  error,
  onDelete,
  deleting,
  deletingId,
}: {
  data: AdminEnrollment[];
  total: number;
  pages: number;
  page: number;
  onPage: (p: number) => void;
  q: string;
  onSearch: (v: string) => void;
  progress: "" | "active" | "done";
  onProgress: (v: "" | "active" | "done") => void;
  searchLoading: boolean;
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
  deleting: boolean;
  deletingId?: number;
}) {
  const [target, setTarget] = useState<AdminEnrollment | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        description="Every learner to course enrollment on the platform."
      />

      <GridPanel
        toolbar={
          <>
            <SearchInput
              value={q}
              onChange={onSearch}
              placeholder="Search learner or course"
              busy={searchLoading}
            />
            <Select
              value={progress}
              onChange={(e) => onProgress(e.target.value as "" | "active" | "done")}
              aria-label="Filter by progress"
              className="w-auto min-w-[150px]"
            >
              <option value="">All progress</option>
              <option value="active">In progress</option>
              <option value="done">Completed</option>
            </Select>
          </>
        }
        footer={<Pagination page={page} pages={pages} total={total} onChange={onPage} />}
      >
        {loading ? (
          <GridSkeleton rows={6} cells={6} />
        ) : error ? (
          <GridMessage kind="error" title="Could not load enrollments" body={error} />
        ) : data.length === 0 ? (
          <GridMessage
            kind="empty"
            title={q || progress ? "No enrollments match those filters" : "No enrollments yet"}
            body={
              q || progress
                ? "Try a different learner, course or progress state."
                : "An enrollment is created when a learner joins a course."
            }
          />
        ) : (
          <GridScroll>
            <GridHead>
              <Th>Learner</Th>
              <Th>Course</Th>
              <Th>Instructor</Th>
              <Th>Progress</Th>
              <Th>Joined</Th>
              <Th align="right">Remove</Th>
            </GridHead>
            <tbody>
              {data.map((e) => (
                <Tr key={e.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {e.learner_avatar ? (
                        <img src={e.learner_avatar} alt="" className="h-8 w-8 shrink-0 object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-paper-sunk text-ink-faint">
                          <User size={15} strokeWidth={2.2} aria-hidden />
                        </span>
                      )}
                      <div className="min-w-0">
                        <Link
                          to={`/users/${e.learner_id}`}
                          className="block max-w-[160px] truncate text-sm font-medium text-ink hover:underline"
                        >
                          {e.learner_name}
                        </Link>
                        <p className="tnum text-xs text-ink-faint">+91 {e.learner_mobile}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Link
                      to={`/courses/${e.course_id}`}
                      className="block max-w-[240px] truncate text-sm font-medium text-ink hover:underline"
                    >
                      {e.course_title}
                    </Link>
                    <p className="tnum text-xs text-ink-faint">
                      {Number(e.course_price) === 0
                        ? "Free course"
                        : `₹${Number(e.course_price).toLocaleString("en-IN")}`}
                    </p>
                  </Td>
                  <Td className="text-ink-muted">{e.instructor}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1.5 w-16 shrink-0 bg-rule/45"
                        role="img"
                        aria-label={`${e.progress} percent complete`}
                      >
                        <div
                          className={cn(
                            "h-full transition-[width] duration-500 ease-out",
                            e.progress === 100 ? "bg-live" : "bg-flight",
                          )}
                          style={{ width: `${e.progress}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          "tnum text-xs font-semibold",
                          e.progress === 100 ? "text-live" : "text-ink-muted",
                        )}
                      >
                        {e.progress}%
                      </span>
                    </div>
                  </Td>
                  <Td className="tnum whitespace-nowrap text-ink-muted">
                    {new Date(e.enrolled_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })}
                  </Td>
                  <Td align="right">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      onClick={() => setTarget(e)}
                      disabled={deleting && deletingId === e.id}
                      aria-label={`Remove ${e.learner_name} from ${e.course_title}`}
                      className="text-halt hover:bg-halt-soft"
                    >
                      <Trash2 size={15} strokeWidth={2.2} aria-hidden />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </GridScroll>
        )}
      </GridPanel>

      <ConfirmDialog
        open={target !== null}
        title="Remove enrollment?"
        description={`Remove ${target?.learner_name} from "${target?.course_title}"? Their progress in this course is lost. This cannot be undone.`}
        confirmLabel="Remove"
        busy={deleting}
        onConfirm={() => {
          if (target) onDelete(target.id);
          setTarget(null);
        }}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}