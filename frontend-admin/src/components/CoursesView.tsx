import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, ImageIcon, Trash2 } from "@masterlms/shared";
import type { AdminCourse } from "../types/admin";
import { PageHeader } from "./Panel";
import { Badge, statusTone } from "./Badge";
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

export function CoursesView({
  data,
  total,
  pages,
  page,
  onPage,
  q,
  onSearch,
  status,
  onStatus,
  searchLoading,
  loading,
  error,
  togglingId,
  onToggle,
  onDelete,
  deleting,
  deletingId,
}: {
  data: AdminCourse[];
  total: number;
  pages: number;
  page: number;
  onPage: (p: number) => void;
  q: string;
  onSearch: (v: string) => void;
  status: "" | "draft" | "published";
  onStatus: (v: "" | "draft" | "published") => void;
  searchLoading: boolean;
  loading: boolean;
  error: string | null;
  togglingId?: number;
  onToggle: (id: number, status: "draft" | "published") => void;
  onDelete: (id: number) => void;
  deleting: boolean;
  deletingId?: number;
}) {
  const [target, setTarget] = useState<AdminCourse | null>(null);
  const [confirming, setConfirming] = useState<AdminCourse | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Edit, publish, unpublish or remove any course on the platform."
      />

      <GridPanel
        toolbar={
          <>
            <SearchInput
              value={q}
              onChange={onSearch}
              placeholder="Search title, instructor or category"
              busy={searchLoading}
            />
            <Select
              value={status}
              onChange={(e) => onStatus(e.target.value as "" | "draft" | "published")}
              aria-label="Filter by status"
              className="w-auto min-w-[150px]"
            >
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </Select>
          </>
        }
        footer={<Pagination page={page} pages={pages} total={total} onChange={onPage} />}
      >
        {loading ? (
          <GridSkeleton rows={6} cells={7} />
        ) : error ? (
          <GridMessage kind="error" title="Could not load courses" body={error} />
        ) : data.length === 0 ? (
          <GridMessage
            kind="empty"
            title={q || status ? "No courses match those filters" : "No courses yet"}
            body={
              q || status
                ? "Try a different title, instructor or status."
                : "Courses appear here once an instructor creates one in the instructor console."
            }
          />
        ) : (
          <GridScroll>
            <GridHead>
              <Th>Course</Th>
              <Th>Instructor</Th>
              <Th align="right">Price</Th>
              <Th align="right">Students</Th>
              <Th align="right">Rating</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </GridHead>
            <tbody>
              {data.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {c.cover_image ? (
                        <img
                          src={c.cover_image}
                          alt=""
                          className="h-9 w-14 shrink-0 bg-paper-sunk object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-14 shrink-0 items-center justify-center bg-paper-sunk text-ink-faint">
                          <ImageIcon size={15} strokeWidth={2} aria-hidden />
                        </span>
                      )}
                      <div className="min-w-0">
                        <Link
                          to={`/courses/${c.id}`}
                          className="block max-w-[240px] truncate text-sm font-medium text-ink hover:underline"
                        >
                          {c.title}
                        </Link>
                        <p className="max-w-[240px] truncate text-xs text-ink-faint">
                          {c.category}
                          {c.subtitle ? ` · ${c.subtitle}` : ""}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-ink-muted">{c.instructor_name}</Td>
                  <Td align="right" className="tnum whitespace-nowrap text-ink">
                    {c.pricing_type === "free"
                      ? "Free"
                      : `₹${Number(c.price).toLocaleString("en-IN")}`}
                  </Td>
                  <Td align="right" className="tnum text-ink-muted">
                    {c.student_count}
                  </Td>
                  <Td align="right" className="tnum whitespace-nowrap text-ink-muted">
                    {Number(c.average_rating).toFixed(1)}
                  </Td>
                  <Td>
                    <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/courses/${c.id}`}
                        className="inline-flex h-8 items-center border border-transparent px-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-rule hover:bg-paper-raised hover:text-ink"
                      >
                        View
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        onClick={() =>
                          c.status === "published"
                            ? onToggle(c.id, "draft")
                            : setConfirming(c)
                        }
                        disabled={togglingId === c.id}
                        aria-label={
                          c.status === "published"
                            ? `Unpublish ${c.title}`
                            : `Publish ${c.title}`
                        }
                      >
                        {c.status === "published" ? (
                          <EyeOff size={15} strokeWidth={2.2} aria-hidden />
                        ) : (
                          <Eye size={15} strokeWidth={2.2} aria-hidden />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        onClick={() => setTarget(c)}
                        disabled={deleting && deletingId === c.id}
                        aria-label={`Delete ${c.title}`}
                        className="text-halt hover:bg-halt-soft"
                      >
                        <Trash2 size={15} strokeWidth={2.2} aria-hidden />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </GridScroll>
        )}
      </GridPanel>

      <ConfirmDialog
        open={target !== null}
        title="Delete this course?"
        description={`Permanently remove "${target?.title}" and all its sections and lessons? Learner enrollments in it will also be removed. This cannot be undone.`}
        busy={deleting}
        onConfirm={() => {
          if (target) onDelete(target.id);
          setTarget(null);
        }}
        onCancel={() => setTarget(null)}
      />

      <ConfirmDialog
        open={confirming !== null}
        title="Publish this course?"
        description={`Make "${confirming?.title}" visible to learners? It has ${
          confirming?.lesson_count ?? 0
        } lessons${confirming?.cover_image ? "" : " and no cover image"}.`}
        confirmLabel="Publish"
        busy={togglingId === confirming?.id}
        onConfirm={() => {
          if (confirming) onToggle(confirming.id, "published");
          setConfirming(null);
        }}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}