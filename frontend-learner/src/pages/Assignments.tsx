import { Link } from "react-router-dom";
import { ArrowLeft } from "@masterlms/shared";
import { TopNav } from "../components/TopNav";

const items = [
  { id: "a1", title: "UX Audit — Redesign Checkout Flow", course: "UX/UI Design Fundamentals", due: "Due in 3 days", status: "Pending" },
  { id: "a2", title: "Business Case Study: Q4 Strategy", course: "Strategic Business Leadership", due: "Due tomorrow", status: "In review" },
  { id: "a3", title: "Python: Build a Todo CLI", course: "Python Programming Basics", due: "Completed", status: "Graded — 92%" },
];

export default function Assignments() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <TopNav />
      <div className="w-full px-3 py-6 sm:px-4">
        <div className="rounded-[28px] bg-white p-8 shadow-sm sm:p-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900"><ArrowLeft size={14} strokeWidth={2.5} /> Back to home</Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">Assignments</h1>
          <p className="mt-1 text-sm text-zinc-500">Track and submit your work.</p>
          <div className="mt-8 grid gap-3">
            {items.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
                <div>
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-zinc-500">{a.course} • {a.due}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${a.status.includes("Graded") ? "bg-emerald-500 text-white" : a.status === "In review" ? "bg-yellow-400 text-zinc-900" : "bg-zinc-900 text-white"}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
