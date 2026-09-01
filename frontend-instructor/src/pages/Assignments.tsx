import { InstructorHeader } from "../components/InstructorHeader";

export default function Assignments() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className="mx-auto max-w-[1080px] px-3 py-6 sm:px-4">
        <div className="rounded-[20px] bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold">Assignments — review</h1>
          <p className="text-sm text-zinc-500">Mock queue — grade and give feedback.</p>
          <div className="mt-6 space-y-3">
            {[
              ["Maya Chen","UX Audit","Pending"],
              ["James Park","Business Case","Graded"],
            ].map(([name, title, status])=>(
              <div key={name} className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-zinc-500">{name}</p></div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${status==="Pending"?"bg-yellow-400 text-zinc-900":"bg-emerald-500 text-white"}`}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
