import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminDeleteAssignment,
  adminDuplicateAssignment,
  adminListAssignments,
  adminPublishAssignment,
  adminUnpublishAssignment,
} from "@masterlms/shared";
import { AssignmentsView } from "../components/AssignmentsView";

export function AssignmentsContainer() {
  const qc = useQueryClient();
  // Row actions are rejected server-side (e.g. publishing an
  // assignment with no questions) — surface the error instead
  // of failing silently.
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "assignments"],
    queryFn: adminListAssignments,
  });

  const succeed = () => {
    setActionError(null);
    qc.invalidateQueries({ queryKey: ["admin", "assignments"] });
  };

  const fail = (e: unknown) => setActionError(String(e));

  const publish = useMutation({
    mutationFn: (id: number) => adminPublishAssignment(id),
    onSuccess: succeed,
    onError: fail,
  });
  const unpublish = useMutation({
    mutationFn: (id: number) => adminUnpublishAssignment(id),
    onSuccess: succeed,
    onError: fail,
  });
  const duplicate = useMutation({
    mutationFn: (id: number) => adminDuplicateAssignment(id),
    onSuccess: succeed,
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: (id: number) => adminDeleteAssignment(id),
    onSuccess: succeed,
    onError: fail,
  });

  return (
    <AssignmentsView
      assignments={data ?? []}
      loading={isLoading}
      error={error ? String(error) : null}
      actionError={actionError}
      onDismissActionError={() => setActionError(null)}
      busy={publish.isPending || unpublish.isPending || duplicate.isPending || remove.isPending}
      onPublish={(id) => publish.mutate(id)}
      onUnpublish={(id) => unpublish.mutate(id)}
      onDuplicate={(id) => duplicate.mutate(id)}
      onDelete={(id) => remove.mutate(id)}
    />
  );
}
