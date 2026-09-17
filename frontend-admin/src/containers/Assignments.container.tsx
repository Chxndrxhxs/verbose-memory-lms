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

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "assignments"],
    queryFn: adminListAssignments,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "assignments"] });
  };

  const publish = useMutation({
    mutationFn: (id: number) => adminPublishAssignment(id),
    onSuccess: refresh,
  });
  const unpublish = useMutation({
    mutationFn: (id: number) => adminUnpublishAssignment(id),
    onSuccess: refresh,
  });
  const duplicate = useMutation({
    mutationFn: (id: number) => adminDuplicateAssignment(id),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: number) => adminDeleteAssignment(id),
    onSuccess: refresh,
  });

  return (
    <AssignmentsView
      assignments={data ?? []}
      loading={isLoading}
      error={error ? String(error) : null}
      busy={publish.isPending || unpublish.isPending || duplicate.isPending || remove.isPending}
      onPublish={(id) => publish.mutate(id)}
      onUnpublish={(id) => unpublish.mutate(id)}
      onDuplicate={(id) => duplicate.mutate(id)}
      onDelete={(id) => remove.mutate(id)}
    />
  );
}