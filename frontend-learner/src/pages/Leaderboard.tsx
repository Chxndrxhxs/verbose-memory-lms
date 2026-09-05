import { TopNav } from "../components/TopNav";
import { LeaderboardContainer } from "../containers/Leaderboard.container";

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <TopNav />
      <div className="w-full px-4 py-6 sm:px-6">
        <div className="w-full rounded-[20px] bg-white p-6 shadow-sm sm:p-8">
          <LeaderboardContainer />
        </div>
      </div>
    </div>
  );
}
