import { InstructorHeader } from "../components/InstructorHeader";
import { ActivityContainer } from "../containers/Activity.container";
import { PageShell } from "../components/Panel";

export default function Activity() {
  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell>
        <ActivityContainer />
      </PageShell>
    </div>
  );
}