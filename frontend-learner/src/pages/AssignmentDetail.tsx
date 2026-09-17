import { useParams } from "react-router-dom";
import { AssignmentDetailContainer } from "../containers/AssignmentDetail.container";

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  return <AssignmentDetailContainer assignmentId={id ?? ""} />;
}