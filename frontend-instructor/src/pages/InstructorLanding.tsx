import { Link } from "react-router-dom";
import { ArrowRight } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";

const HERO = "https://images.pexels.com/photos/3184311/pexels-photo-3184311.jpeg?auto=compress&cs=tinysrgb&w=1600";
const avatars = [
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80",
];

export default function InstructorLanding() {
  const user = useAuth((s) => s.user);
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <div className="px-3 pt-3 sm:px-4">
        <div className="relative overflow-hidden rounded-[28px]">
          <img src={HERO} alt="" className="h-[620px] w-full object-cover sm:h-[700px] lg:h-[760px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0f172a]/30 via-transparent to-yellow-200/20 mix-blend-overlay" />

          {/* pill nav — same as InstructorHeader but absolute hero version */}
          <header className="absolute left-1/2 top-4 flex w-[92%] max-w-[720px] -translate-x-1/2 items-center justify-between rounded-full bg-white px-2 py-2 shadow-lg sm:px-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-white">K</span>
              <span className="text-sm font-bold tracking-tight">QTNXT</span>
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-zinc-900">Teach</span>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <Link to="/dashboard" className="inline-flex items-center gap-1.5 rounded-full bg-[#0f172a] px-4 py-1.5 text-sm font-semibold text-white">Go to dashboard <ArrowRight size={14} strokeWidth={2.5} /></Link>
              ) : (
                <>
                  <Link to="/login" className="hidden rounded-full px-4 py-1.5 text-sm font-medium sm:block">Login</Link>
                  <Link to="/login" className="rounded-full bg-[#0f172a] px-4 py-1.5 text-sm font-semibold text-white">Start teaching</Link>
                </>
              )}
            </div>
          </header>

          {/* floating deco — teach earnings + live students */}
          <div className="absolute left-6 top-[38%] hidden -rotate-3 rounded-2xl bg-white p-3 shadow-xl lg:flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white text-sm">₹</div>
            <div><p className="text-xs font-bold">₹2,840 this month</p><p className="text-[10px] text-zinc-500">Avg. top 10% instructors</p></div>
          </div>
          <div className="absolute right-6 top-[42%] hidden rotate-2 rounded-2xl bg-white p-3 shadow-xl lg:flex items-center gap-2">
            <div className="flex -space-x-2">{avatars.map((a)=><img key={a} src={a} alt="" className="h-8 w-8 rounded-full border-2 border-white object-cover" />)}</div>
            <div className="ml-1"><p className="text-xs font-bold leading-none">1,204 students</p><p className="text-[10px] font-medium text-emerald-600">● 12 live now</p></div>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pt-12 text-center">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md border border-white/20"><span className="h-2 w-2 rounded-full bg-yellow-400" /> Teach on QTNXT • Keep 85% revenue</span>
            <h1 className="max-w-[660px] leading-[0.88] tracking-[-0.04em] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.35)]">
              <span className="block text-[30px] font-light tracking-[-0.03em] sm:text-[46px]">Share what you</span>
              <span className="block font-serif text-[36px] font-normal italic tracking-[-0.03em] sm:text-[56px]"><span className="relative inline-block px-1.5"><span className="relative z-10">know</span><span className="absolute inset-x-0 bottom-1.5 h-[10px] bg-yellow-400 -rotate-1 sm:h-[14px]" /></span> & inspire</span>
              <span className="block text-[32px] font-black tracking-[-0.05em] sm:text-[50px]">the next generation.</span>
            </h1>
            <p className="mt-3 max-w-[520px] text-[12px] font-light leading-relaxed tracking-wide text-white/80 sm:text-[13px]">Create courses, reach 12k+ learners, and turn your expertise into income — calm tools, clear analytics.</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-zinc-900 shadow-lg">Go to dashboard <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white"><ArrowRight size={12} strokeWidth={3} /></span></Link>
              ) : (
                <>
                  <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-zinc-900 shadow-lg">Start teaching <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white"><ArrowRight size={12} strokeWidth={3} /></span></Link>
                  <a href="#how" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur border border-white/30 hover:bg-white/20">How it works</a>
                </>
              )}
            </div>
            <div className="mt-5 flex items-center gap-3 text-[11px] font-medium text-white/80">
              <span>85% revenue share</span><span className="h-3 w-px bg-white/30" /><span>No upfront fees</span><span className="h-3 w-px bg-white/30" /><span>Payouts monthly</span>
            </div>
          </div>
        </div>
      </div>
      <section id="how" className="w-full px-3 py-10 sm:px-4 grid gap-4 sm:grid-cols-3">
        {[
          ["Create", "Record and upload — we handle hosting", "✎"],
          ["Publish", "Set price, go live to 12k+ learners", "◉"],
          ["Earn", "Track revenue & students in one place", "$"],
        ].map(([t,d,i])=>(
          <div key={t} className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f172a] text-white text-sm">{i}</div><h3 className="mt-3 text-sm font-bold">{t}</h3><p className="text-xs text-zinc-500">{d}</p></div>
        ))}
      </section>
    </div>
  );
}
