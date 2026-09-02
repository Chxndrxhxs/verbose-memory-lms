import { useParams } from "react-router-dom";
import { CourseCreateContainer } from "../containers/CourseCreate.container";

export default function CourseEdit() {
  const { id } = useParams();
  return <CourseCreateContainer existingId={id} />;
}