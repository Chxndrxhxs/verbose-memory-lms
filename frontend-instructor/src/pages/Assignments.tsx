import { InstructorHeader } from "../components/InstructorHeader";
import { AssignmentListContainer } from "../containers/AssignmentList.container";
import { PageShell, PageHeader } from "../components/Panel";

export default function Assignments() {
  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell>
        <div className="space-y-6">
          <PageHeader
            eyebrow="Assessments"
            title="Assignments"
            description="Create, manage and publish assessments for your learners."
          />
          <AssignmentListContainer />
        </div>
      </PageShell>
    </div>
  );
}