import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  getAssignmentDetail,
  startAssignmentAttempt,
  type AssignmentModelPreview,
} from "@masterlms/shared";
import { AssignmentDetailView } from "../components/AssignmentDetailView";

export function AssignmentDetailContainer({ assignmentId }: { assignmentId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmingModel, setConfirmingModel] = useState<AssignmentModelPreview | null>(null);

  const query = useQuery({
    queryKey: ["assignment-detail", assignmentId],
    queryFn: () => getAssignmentDetail(Number(assignmentId)),
  });

  const start = useMutation({
    mutationFn: (modelId: number) => startAssignmentAttempt(Number(assignmentId), modelId),
    onSuccess: (result) => {
      queryClient.setQueryData(["assignment-attempt", result.attempt.id], result);
      navigate(`/assignments/take/${result.attempt.id}`);
    },
  });

  return (
    <AssignmentDetailView
      assignment={query.data}
      isLoading={query.isLoading}
      error={query.error}
      confirmingModel={confirmingModel}
      onStartRequest={(model) => setConfirmingModel(model)}
      onCancelConfirm={() => setConfirmingModel(null)}
      onConfirmStart={(model) => start.mutate(model.id)}
      starting={start.isPending}
    />
  );
}