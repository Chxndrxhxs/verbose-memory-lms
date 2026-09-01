import { useParams } from "react-router-dom";
import { LearnContainer } from "../containers/Learn.container";

export default function Learn() {
  const { id } = useParams();
  return <LearnContainer courseId={id!} />;
}
