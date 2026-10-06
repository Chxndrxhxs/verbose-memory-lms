import { InstructorHeader } from "../components/InstructorHeader";
import { PackListContainer } from "../containers/PackList.container";
import { PageShell } from "../components/Panel";

export default function Packs() {
  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell>
        <PackListContainer />
      </PageShell>
    </div>
  );
}