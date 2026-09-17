import { useQuery } from "@tanstack/react-query";
import { getAssignmentTranscript } from "@masterlms/shared";
import { AssignmentResultView } from "../components/AssignmentResultView";

export function AssignmentResultContainer({
  assignmentId,
  attemptId,
}: {
  assignmentId: string;
  attemptId?: string;
}) {
  const query = useQuery({
    queryKey: ["assignment-transcript", assignmentId, attemptId ?? "latest"],
    queryFn: () =>
      getAssignmentTranscript(
        Number(assignmentId),
        attemptId ? Number(attemptId) : undefined,
      ),
    retry: false,
  });

  return (
    <AssignmentResultView
      result={query.data}
      isLoading={query.isLoading}
      error={query.error}
    />
  );
}