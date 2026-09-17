import { useParams } from "react-router-dom";
import { AssignmentTakeContainer } from "../containers/AssignmentTake.container";

export default function AssignmentTake() {
  const { attemptId } = useParams<{ attemptId: string }>();
  return <AssignmentTakeContainer attemptId={attemptId ?? ""} />;
}