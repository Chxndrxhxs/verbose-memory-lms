import { useParams } from "react-router-dom";
import { LearnContainer } from "../containers/Learn.container";

const titles: Record<string, string> = {
  "ux-fundamentals": "UX/UI Design Fundamentals",
  "business-leadership": "Strategic Business Leadership",
  "python-basics": "Python Programming Basics",
  "marketing-analytics": "Digital Marketing Analytics",
};

export default function Learn() {
  const { id } = useParams();
  return <LearnContainer courseId={id!} title={titles[id!] ?? "Course"} />;
}
