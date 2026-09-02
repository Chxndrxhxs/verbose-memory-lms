import { InstructorHeader } from "../components/InstructorHeader";

export default function Analytics() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className="w-full px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Analytics</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Revenue</p><p className="mt-1 text-2xl font-black">₹8,420</p><div className="mt-3 h-2 rounded-full bg-zinc-100 overflow-hidden"><div className="h-full w-[72%] bg-[#3478ff]" /></div></div>
          <div className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Enrollments</p><p className="mt-1 text-2xl font-black">1,204</p><div className="mt-3 flex gap-1">{[40,60,30,80,50,90,70].map((h,i)=>(<div key={i} className="flex-1 rounded bg-emerald-500" style={{height:`${h}px`}} />))}</div></div>
          <div className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Top course</p><p className="mt-1 text-sm font-bold">UX/UI Fundamentals</p><p className="text-xs text-zinc-500">62% of revenue</p></div>
        </div>
      </div>
    </div>
  );
}
