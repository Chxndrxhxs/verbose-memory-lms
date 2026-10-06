import { useParams } from "react-router-dom";
import { InstructorHeader } from "../components/InstructorHeader";
import { AssignmentCreateContainer } from "../containers/AssignmentCreate.container";
import { PageShell } from "../components/Panel";

export default function AssignmentEdit() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell>
        <AssignmentCreateContainer existingId={id} />
      </PageShell>
    </div>
  );
}