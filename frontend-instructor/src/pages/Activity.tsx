import { InstructorHeader } from "../components/InstructorHeader";

export default function Activity() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className="w-full px-4 py-6 sm:px-6">
        <div className="rounded-[20px] bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Activity</h1>
          <p className="mt-1 text-sm text-zinc-500">Course updates, student enrollments, and recent actions.</p>
          <div className="mt-6 rounded-2xl border bg-zinc-50 p-8 text-center text-sm text-zinc-500">Activity feed coming soon.</div>
        </div>
      </div>
    </div>
  );
}
