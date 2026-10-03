import { TopNav } from "../components/TopNav";
import { LeaderboardContainer } from "../containers/Leaderboard.container";
import { PageShell } from "../components/Panel";

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-room">
      <TopNav />
      <PageShell>
        <LeaderboardContainer />
      </PageShell>
    </div>
  );
}