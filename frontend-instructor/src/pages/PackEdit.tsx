import { useParams } from "react-router-dom";
import { InstructorHeader } from "../components/InstructorHeader";
import { PackBuilderContainer } from "../containers/PackBuilder.container";
import { PageShell } from "../components/Panel";

export default function PackEdit() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell>
        <PackBuilderContainer existingId={id} />
      </PageShell>
    </div>
  );
}