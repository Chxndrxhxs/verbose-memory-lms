import { TopNav } from "../components/TopNav";

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <TopNav />
      <div className="w-full px-4 py-6 sm:px-6">
        <div className="w-full rounded-[20px] bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Leaderboard</h1>
          <p className="mt-1 text-sm text-zinc-500">See how you rank against other learners.</p>
          <div className="mt-6 rounded-2xl border bg-zinc-50 p-8 text-center text-sm text-zinc-500">Leaderboard coming soon — XP, completions, and rankings.</div>
        </div>
      </div>
    </div>
  );
}
