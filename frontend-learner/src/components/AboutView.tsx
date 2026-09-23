import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  Heart,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "@masterlms/shared";
import { TopNav } from "../components/TopNav";

const STATS = [
  { value: "12+", label: "Expert instructors" },
  { value: "100%", label: "Self-paced learning" },
  { value: "₹0", label: "To start learning" },
  { value: "24/7", label: "Learn anytime" },
];

const PILLARS = [
  {
    title: "Learn by doing",
    desc: "Video lessons, PDFs, quizzes, and hands-on assignments — not endless lecture playlists. Every course ends with something you built or solved.",
    Icon: Target,
  },
  {
    title: "Prove what you know",
    desc: "Timed assignments with instant results, section-wise breakdowns, and verified QTNXT certificates you can share on LinkedIn.",
    Icon: Award,
  },
  {
    title: "Stay in the loop",
    desc: "Activity streaks, leaderboards, and progress tracking keep you steady. Learn at 2am or 2pm — your rhythm, your pace.",
    Icon: LineChart,
  },
  {
    title: "Learn without pressure",
    desc: "No rigid cohorts, no attendance panic. Start free, upgrade only when a course is worth it, cancel anytime.",
    Icon: Heart,
  },
];

const JOURNEY = [
  {
    step: "01",
    title: "Browse & enroll",
    desc: "Explore courses by category, preview the curriculum, and enroll — free courses start instantly, paid ones go through secure Razorpay checkout.",
  },
  {
    step: "02",
    title: "Learn lesson by lesson",
    desc: "Watch videos, read PDFs, take quizzes. Mark lessons complete and watch your progress bar — and your activity heatmap — fill up.",
  },
  {
    step: "03",
    title: "Test yourself",
    desc: "Take timed assignments with proctored focus mode, get instant scores with per-question review, and see where you stand on the leaderboard.",
  },
  {
    step: "04",
    title: "Get certified",
    desc: "Finish 100% of a course to unlock your verified QTNXT certificate with a unique ID — printable, shareable, yours.",
  },
];

const FAQS = [
  {
    q: "Is QTNXT free?",
    a: "Starting is free — browse courses, enroll in free ones, and track progress without paying anything. Paid courses are one-time purchases in ₹, no subscription trap.",
  },
  {
    q: "How do assignments work?",
    a: "Instructors create timed MCQ assignments from real question papers. You get a focus-mode exam screen with a question palette, auto-save, instant scoring, and a full answer review afterwards.",
  },
  {
    q: "Are certificates verified?",
    a: "Yes. Every certificate carries a unique QTNXT ID tied to your account and completion record, so employers can trust it.",
  },
  {
    q: "Can I learn on my phone?",
    a: "Yes — the learner app is fully responsive. Lessons, quizzes, and assignments all work on mobile browsers.",
  },
];

export function AboutView() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <TopNav />
      <div className="mx-auto w-full max-w-5xl px-3 py-8 sm:px-4 sm:py-12">
        <section className="relative overflow-hidden rounded-[28px] bg-[#0f172a] px-6 py-14 text-center text-white sm:px-10 sm:py-20">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#1e3a5f] blur-[80px]" />
          <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-amber-400/10 blur-[90px]" />
          <span className="pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 select-none text-[180px] font-black leading-none text-white/[0.04] sm:block">
            Q
          </span>
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
              <Sparkles size={12} /> About QTNXT
            </span>
            <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Learning that respects how you actually learn.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm font-light leading-relaxed text-white/70 sm:text-base">
              QTNXT is a learning platform built for curious, self-driven people —
              practical courses, real assessments, and verified certificates, all at
              your own pace.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-zinc-900 transition hover:bg-zinc-100"
              >
                Browse courses <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Get started free
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-5 text-center shadow-sm">
              <p className="text-2xl font-black tracking-tight text-zinc-900">{s.value}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                {s.label}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-6 shadow-sm sm:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
            What we believe
          </p>
          <h2 className="mt-2 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
            Calm focus beats cramming. Proof beats promises.
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {PILLARS.map((p) => (
              <div key={p.title} className="rounded-2xl bg-zinc-50 p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f172a] text-white">
                  <p.Icon size={17} strokeWidth={2.25} />
                </div>
                <h3 className="mt-3 text-sm font-bold">{p.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-6 shadow-sm sm:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
            How it works
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Your journey on QTNXT
          </h2>
          <div className="mt-6 space-y-4">
            {JOURNEY.map((j) => (
              <div key={j.step} className="flex gap-4 rounded-2xl border border-zinc-100 p-4 sm:p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-zinc-900">
                  {j.step}
                </span>
                <div>
                  <h3 className="text-sm font-bold">{j.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">{j.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { title: "Courses", desc: "Video, PDF, quiz & link lessons with ratings and reviews.", Icon: BookOpen },
            { title: "Assignments", desc: "Timed MCQ exams with figures, negative marking & review.", Icon: FileText },
            { title: "Community", desc: "Leaderboards, activity streaks & learner profiles.", Icon: Users },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#3478ff]/10 text-[#3478ff]">
                <c.Icon size={18} strokeWidth={2.25} />
              </div>
              <h3 className="mt-3 text-sm font-bold">{c.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{c.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-6 shadow-sm sm:p-10">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">For learners, by learners</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-zinc-50 p-5">
              <div className="text-xs text-amber-400">★★★★★</div>
              <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-800">
                “QTNXT completely changed how I approach learning. I feel more focused,
                less pressured, and I actually finish the courses I start.”
              </p>
              <p className="mt-3 text-xs font-semibold">Maya Chen</p>
              <p className="text-[11px] text-zinc-500">Product Designer • Self-taught learner</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-5">
              <div className="flex items-center gap-2 text-emerald-600">
                <GraduationCap size={16} />
                <p className="text-xs font-bold uppercase tracking-wide">Verified certificates</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Finish any course to earn a certificate with a unique QTNXT ID — proof
                of real work, not just watch time.
              </p>
              <div className="mt-3 flex items-center gap-2 text-amber-500">
                <Trophy size={14} />
                <p className="text-xs font-semibold text-zinc-700">
                  Share it on LinkedIn, add it to your resume.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-6 shadow-sm sm:p-10">
          <h2 className="text-center text-2xl font-bold tracking-tight">Quick answers</h2>
          <div className="mx-auto mt-5 max-w-2xl space-y-3">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-2xl bg-zinc-50 px-5 py-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-500" /> {f.q}
                </p>
                <p className="mt-1.5 pl-7 text-xs leading-relaxed text-zinc-500">{f.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
            >
              Start learning <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-zinc-400">
          © 2026 QTNXT. All rights reserved.
        </p>
      </div>
    </div>
  );
}
