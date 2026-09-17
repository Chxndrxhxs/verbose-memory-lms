import { useParams, useSearchParams } from "react-router-dom";
import { AssignmentResultContainer } from "../containers/AssignmentResult.container";

export default function AssignmentResult() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [params] = useSearchParams();
  const attemptId = params.get("attempt_id") ?? undefined;
  return (
    <AssignmentResultContainer
      assignmentId={assignmentId ?? ""}
      attemptId={attemptId}
    />
  );
}