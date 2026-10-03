import { InstructorHeader } from "../components/InstructorHeader";
import { CourseManageContainer } from "../containers/CourseManage.container";
import { PageShell } from "../components/Panel";

export default function Courses() {
  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell wide>
        <CourseManageContainer />
      </PageShell>
    </div>
  );
}