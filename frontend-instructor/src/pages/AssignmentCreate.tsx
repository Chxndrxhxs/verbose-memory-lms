import { InstructorHeader } from "../components/InstructorHeader";
import { AssignmentCreateContainer } from "../containers/AssignmentCreate.container";
import { PageShell } from "../components/Panel";

export default function AssignmentCreate() {
  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell>
        <AssignmentCreateContainer />
      </PageShell>
    </div>
  );
}