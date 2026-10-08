import { useState } from "react";
import { Archive, Check, Copy, Trash2, X, type AssignmentDetail } from "@masterlms/shared";
import { PageHeader } from "./Panel";
import { Badge, statusTone } from "./Badge";
import { Button } from "./Button";
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
import { ConfirmDialog } from "./ConfirmDialog";

export function AssignmentsView({
  assignments,
  loading,
  error,
  actionError,
  onDismissActionError,
  busy,
  onPublish,
  onUnpublish,
  onDuplicate,
  onDelete,
}: {
  assignments: AssignmentDetail[];
  loading: boolean;
  error: string | null;
  actionError: string | null;
  onDismissActionError: () => void;
  busy: boolean;
  onPublish: (id: number) => void;
  onUnpublish: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [target, setTarget] = useState<AssignmentDetail | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Manage published assessments across categories."
      />

      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 border border-halt bg-halt-soft px-4 py-3"
        >
          <p className="text-sm font-medium text-halt">{actionError}</p>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={onDismissActionError}
            aria-label="Dismiss error"
          >
            <X size={14} strokeWidth={2.5} aria-hidden />
          </Button>
        </div>
      )}

      <GridPanel>
        {loading ? (
          <GridSkeleton rows={5} cells={6} />
        ) : error ? (
          <GridMessage kind="error" title="Could not load assignments" body={error} />
        ) : assignments.length === 0 ? (
          <GridMessage
            kind="empty"
            title="No assignments yet"
            body="Create an assignment in the instructor console, then publish it here to make it visible to learners."
          />
        ) : (
          <GridScroll>
            <GridHead>
              <Th>Assignment</Th>
              <Th>Category</Th>
              <Th align="right">Tests</Th>
              <Th align="right">Duration</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </GridHead>
            <tbody>
              {assignments.map((a) => (
                <Tr key={a.id}>
                  <Td>
                    <p className="max-w-[280px] truncate text-sm font-medium text-ink">{a.title}</p>
                    <p className="tnum text-xs text-ink-faint">
                      {a.questions_count} questions
                    </p>
                  </Td>
                  <Td className="text-ink-muted">
                    {a.inter_category ? categoryLabel(a.inter_category) : "—"}
                  </Td>
                  <Td align="right" className="tnum text-ink-muted">
                    {(a.models?.length ?? a.models_preview.length) || 0}
                  </Td>
                  <Td align="right" className="tnum whitespace-nowrap text-ink-muted">
                    {a.duration_label}
                  </Td>
                  <Td>
                    <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1">
                      {a.status === "published" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          onClick={() => onUnpublish(a.id)}
                          disabled={busy}
                          aria-label={`Unpublish ${a.title}`}
                        >
                          <Archive size={15} strokeWidth={2.2} aria-hidden />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          onClick={() => onPublish(a.id)}
                          disabled={busy}
                          aria-label={`Publish ${a.title}`}
                          className="text-live hover:bg-live-soft"
                        >
                          <Check size={15} strokeWidth={2.5} aria-hidden />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        onClick={() => onDuplicate(a.id)}
                        disabled={busy}
                        aria-label={`Duplicate ${a.title}`}
                      >
                        <Copy size={15} strokeWidth={2.2} aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        onClick={() => setTarget(a)}
                        disabled={busy}
                        aria-label={`Delete ${a.title}`}
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
        title="Delete assignment?"
        description={`Delete "${target?.title}"? All models, questions and learner attempts are removed. This cannot be undone.`}
        busy={busy}
        onConfirm={() => {
          if (target) onDelete(target.id);
          setTarget(null);
        }}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}

function categoryLabel(inter: AssignmentDetail["inter_category"]): string {
  if (!inter) return "—";
  return `${inter.sub_category.category.name} / ${inter.sub_category.name} / ${inter.name}`;
}