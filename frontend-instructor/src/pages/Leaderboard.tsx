import { InstructorHeader } from "../components/InstructorHeader";
import { LeaderboardContainer } from "../containers/Leaderboard.container";
import { PageShell } from "../components/Panel";

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell>
        <LeaderboardContainer />
      </PageShell>
    </div>
  );
}