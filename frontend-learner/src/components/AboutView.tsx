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
    <div className="min-h-screen bg-room">
      <TopNav />
      <main id="main" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="relative overflow-hidden border border-ink bg-room-deep px-6 py-14 text-center text-ink-inverse sm:px-10 sm:py-20">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-ink-inverse/[0.04] blur-[80px]" />
          <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-gold/10 blur-[90px]" />
          <span className="pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 select-none text-[180px] font-semibold leading-none text-ink-inverse/[0.04] sm:block">
            Q
          </span>
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 border border-ink-inverse/15 bg-ink-inverse/10 px-3 py-1 text-[11px] font-semibold text-ink-inverse/80">
              <Sparkles size={12} aria-hidden /> About QTNXT
            </span>
            <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold leading-tight sm:text-5xl">
              Learning that respects how you actually learn.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-inverse/70 sm:text-base">
              QTNXT is a learning platform built for curious, self-driven people —
              practical courses, real assessments, and verified certificates, all at
              your own pace.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 border border-ink bg-ink px-6 py-2.5 text-sm font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
              >
                Browse courses <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 border border-ink-inverse/25 px-6 py-2.5 text-sm font-semibold text-ink-inverse transition-colors hover:bg-ink-inverse/10"
              >
                Get started free
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="border border-rule bg-room-raised p-5 text-center">
              <p className="tnum text-2xl font-semibold text-ink">{s.value}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {s.label}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 border border-rule bg-room-raised p-6 sm:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            What we believe
          </p>
          <h2 className="mt-2 max-w-xl text-2xl font-semibold sm:text-3xl">
            Calm focus beats cramming. Proof beats promises.
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {PILLARS.map((p) => (
              <div key={p.title} className="border border-rule bg-room-sunk p-5">
                <div className="flex h-9 w-9 items-center justify-center bg-ink text-ink-inverse">
                  <p.Icon size={17} strokeWidth={2.25} aria-hidden />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-ink">{p.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 border border-rule bg-room-raised p-6 sm:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            How it works
          </p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Your journey on QTNXT
          </h2>
          <div className="mt-6 space-y-4">
            {JOURNEY.map((j) => (
              <div key={j.step} className="flex gap-4 border border-rule p-4 sm:p-5">
                <span className="tnum flex h-10 w-10 shrink-0 items-center justify-center border border-gold-deep/40 bg-gold text-sm font-semibold text-ink">
                  {j.step}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{j.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{j.desc}</p>
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
            <div key={c.title} className="border border-rule bg-room-raised p-6 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center border border-flight/25 bg-flight-soft text-flight">
                <c.Icon size={18} strokeWidth={2.25} aria-hidden />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink">{c.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{c.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 border border-rule bg-room-raised p-6 sm:p-10">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-live" aria-hidden />
            <h2 className="text-2xl font-semibold sm:text-3xl">What you get at the end</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="border border-rule bg-room-sunk p-5">
              <div className="flex items-center gap-2 text-live">
                <GraduationCap size={16} aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">
                  Verified certificates
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Finish every lesson in a course and the certificate unlocks, carrying
                your name, the course and the date you completed it.
              </p>
              <div className="mt-3 flex items-center gap-2 text-gold-deep">
                <Trophy size={14} aria-hidden />
                <p className="text-xs font-semibold text-ink">
                  Share it on LinkedIn, add it to your resume.
                </p>
              </div>
            </div>
            <div className="border border-rule bg-room-sunk p-5">
              <div className="flex items-center gap-2 text-live">
                <Target size={16} aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">
                  A transcript you can read
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Every assessment you sit keeps a full transcript. After submitting you
                can see which questions you lost marks on, not just your score.
              </p>
              <div className="mt-3 flex items-center gap-2 text-gold-deep">
                <BookOpen size={14} aria-hidden />
                <p className="text-xs font-semibold text-ink">
                  Use it to decide what to revise.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 border border-rule bg-room-raised p-6 sm:p-10">
          <h2 className="text-center text-2xl font-semibold">Quick answers</h2>
          <div className="mx-auto mt-5 max-w-2xl space-y-3">
            {FAQS.map((f) => (
              <div key={f.q} className="border border-rule bg-room-sunk px-5 py-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <CheckCircle2 size={15} className="shrink-0 text-live" aria-hidden /> {f.q}
                </p>
                <p className="mt-2 pl-7 text-xs leading-relaxed text-ink-muted">{f.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 border border-ink bg-ink px-6 py-2.5 text-sm font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
            >
              Start learning <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
            </Link>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-ink-faint">
          © 2026 QTNXT. All rights reserved.
        </p>
      </main>
    </div>
  );
}
