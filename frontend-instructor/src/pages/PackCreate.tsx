import { InstructorHeader } from "../components/InstructorHeader";
import { PackBuilderContainer } from "../containers/PackBuilder.container";
import { PageShell } from "../components/Panel";

export default function PackCreate() {
  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell>
        <PackBuilderContainer />
      </PageShell>
    </div>
  );
}