import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  Play,
  Shield,
  Target,
  type LucideIcon,
} from "@masterlms/shared";
import { CourseCard } from "./CourseCard";
import { Header } from "./Header";
import { cn } from "../lib/utils";
import type { Course } from "../types/course";

/*
 * The old landing page had blurred gradient orbs, an infinite marquee of
 * vague adjectives ("Growth oriented", "Curious", "Calm"), invented company
 * logos (GOODSCOMPANY, Spotify, Google), and a fabricated testimonial from
 * "Maya Chen". The hero image was commented out and replaced with the blur.
 *
 * None of it could belong to only this product. The new page makes specific,
 * checkable promises instead, and the proof object is the actual catalogue
 * plus the actual lesson player.
 */

const FAQS = [
  {
    q: "Who is QTNXT for?",
    a: "Learners who already know they want to learn something specific. Every course is a real sequence of chapters and lessons, not a playlist of unrelated clips.",
  },
  {
    q: "How do proctored assignments work?",
    a: "Some assessments require the camera and screen monitoring before you begin. You see exactly what is checked, and you confirm it before the timer starts.",
  },
  {
    q: "Do I get a certificate?",
    a: "Yes. Finish every lesson in a course and the certificate unlocks, with your name and the date you completed it.",
  },
  {
    q: "Can I try before paying?",
    a: "Free courses are marked free in the catalogue. Paid courses often include preview lessons you can open before enrolling.",
  },
];

const PILLARS: { title: string; body: string; Icon: LucideIcon }[] = [
  {
    Icon: BookOpen,
    title: "Chapters, not playlists",
    body: "Every course is an ordered structure. You always know what comes next and what is left.",
  },
  {
    Icon: Clock,
    title: "Your place is kept",
    body: "Progress, notes and your current lesson are saved, so you can close the tab and come back to the same line.",
  },
  {
    Icon: Shield,
    title: "Honest assessment",
    body: "Scores, attempt history and your best result are shown plainly. If you did badly, you can see exactly where.",
  },
  {
    Icon: Target,
    title: "Tests that match the work",
    body: "Assessments come from the course's own material, so the test matches what you just learned.",
  },
];

export function LandingView({ courses }: { courses: Course[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const totalLearners = courses.reduce((n, c) => n + c.studentCount, 0);
  const freeCount = courses.filter((c) => c.rawPrice === 0).length;
  const featured = courses.slice(0, 8);

  return (
    <div className="min-h-screen bg-room">
      <Header />
      <main id="main">

      {/*
        Hero: asymmetric editorial split. The promise leads from the left; the
        lesson player answers it on the right. No orbs, no blur, no centred
        stack. The composition has to be recognisable as reading, not as SaaS.
      */}
      <section className="mx-auto grid w-full max-w-[1200px] gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:pb-24">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            <span aria-hidden className="h-1.5 w-1.5 bg-gold-deep" />
            {courses.length} courses open now
          </p>

          <h1 className="mt-5 text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] text-ink sm:text-[54px] lg:text-[60px]">
            Learn the thing,
            <br />
            properly.
          </h1>

          <p className="measure mt-6 text-[15px] leading-relaxed text-ink-muted">
            Real courses built as chapters and lessons, with assessments you can
            actually pass and progress that survives a closed tab. Free courses
            need no card.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/courses"
              className="inline-flex h-12 items-center gap-2 border border-ink bg-ink px-6 text-sm font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
            >
              Browse the catalogue
              <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
            </Link>
            <a
              href="#how"
              className="inline-flex h-12 items-center border border-rule-strong bg-room-raised px-6 text-sm font-semibold text-ink transition-colors hover:bg-room-sunk"
            >
              How it works
            </a>
          </div>

          {/* Real counts from the catalogue, not invented social proof. */}
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-px border border-rule bg-rule">
            {[
              [String(courses.length), "Courses"],
              [totalLearners > 999 ? `${(totalLearners / 1000).toFixed(1)}k` : String(totalLearners), "Learners"],
              [String(freeCount), "Free to start"],
            ].map(([v, k]) => (
              <div key={k} className="bg-room-raised px-4 py-4">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  {k}
                </dt>
                <dd className="tnum mt-1.5 text-2xl font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The proof object: a real lesson player frame, in the real system. */}
        <div className="min-w-0">
          <div className="border border-rule-strong bg-room-raised">
            <div className="flex items-center gap-3 border-b border-rule px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center bg-ink text-ink-inverse">
                <Play size={12} strokeWidth={2.5} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">Python Full Stack</p>
                <p className="text-xs text-ink-faint">Chapter 2 · Your first function</p>
              </div>
              <span className="tnum shrink-0 text-xs font-semibold text-gold-deep">68%</span>
            </div>

            <div className="aspect-video w-full bg-room-deep p-6">
              <div className="flex h-full flex-col justify-center gap-2">
                <p className="font-serif text-[22px] leading-snug text-ink-inverse">
                  Pause anywhere. Your place is kept.
                </p>
                <p className="max-w-[42ch] text-[13px] leading-relaxed text-ink-inverse/60">
                  Progress, notes and the lesson you were on are saved as you go.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-rule px-4 py-3">
              <div className="h-1.5 flex-1 bg-rule/50">
                <div className="h-full w-[68%] bg-gold" />
              </div>
              <span className="tnum shrink-0 text-[11px] text-ink-faint">11:40 / 17:00</span>
            </div>

            <ul className="divide-y divide-rule border-t border-rule">
              {[
                ["Reading the traceback", true],
                ["Writing your first function", true],
                ["Debugging with prints", false],
              ].map(([label, done]) => (
                <li key={label as string} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center border",
                      done ? "border-live/30 bg-live-soft text-live" : "border-rule bg-room-sunk",
                    )}
                  >
                    {done ? (
                      <Check size={11} strokeWidth={3} aria-hidden />
                    ) : (
                      <Play size={9} strokeWidth={2.5} aria-hidden className="text-ink-faint" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm",
                      done ? "text-ink-muted" : "font-medium text-ink",
                    )}
                  >
                    {label as string}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* The catalogue, immediately. No logo wall between promise and proof. */}
      <section className="border-t border-rule bg-room-raised">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-14 sm:px-6 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Open catalogue
              </p>
              <h2 className="mt-3 max-w-[20ch] text-[28px] font-semibold tracking-[-0.03em] text-ink sm:text-[36px]">
                Start with something real.
              </h2>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              See all {courses.length} courses
              <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="mt-8 border border-rule bg-room px-5 py-8 text-center text-sm text-ink-muted">
              No courses are published yet. Check back shortly.
            </p>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((c) => (
                <CourseCard key={c.id} {...c} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-[1200px] px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          How it works
        </p>
        <h2 className="mt-3 max-w-[26ch] text-[28px] font-semibold tracking-[-0.03em] text-ink sm:text-[36px]">
          Four things that make a course worth finishing.
        </h2>

        <div className="mt-8 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ Icon, title, body }) => (
            <div key={title} className="bg-room-raised p-6">
              <span className="flex h-9 w-9 items-center justify-center border border-rule bg-room-sunk text-ink-muted">
                <Icon size={16} strokeWidth={2.2} aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dark moment: the assessment promise, on the one deep surface in the app. */}
      <section className="bg-room-deep">
        <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
              Assessments
            </p>
            <h2 className="mt-4 max-w-[20ch] text-[28px] font-semibold leading-tight tracking-[-0.03em] text-ink-inverse sm:text-[34px]">
              Tested the way real exams are run.
            </h2>
            <p className="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-ink-inverse/70">
              Timed attempts, auto-graded answers, and a full transcript you can
              read afterwards. Where you lost marks is shown, not just your score.
            </p>
            <ul className="mt-7 space-y-2.5">
              {[
                "Countdown timer with auto-submit",
                "Every attempt kept, with your best result",
                "Question-by-question transcript after submit",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-ink-inverse/85">
                  <Check size={15} strokeWidth={3} aria-hidden className="shrink-0 text-gold" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/assignments"
              className="mt-8 inline-flex h-12 items-center gap-2 border border-gold bg-gold px-6 text-sm font-semibold text-ink transition-colors hover:bg-gold/90"
            >
              See available assessments
              <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
            </Link>
          </div>

          <dl className="grid grid-cols-2 gap-px self-stretch border border-white/12 bg-white/12">
            {[
              ["Chapters", "per course"],
              ["Lessons", "tracked"],
              ["Attempts", "kept forever"],
              ["Progress", "never lost"],
            ].map(([v, k]) => (
              <div key={k} className="flex flex-col justify-center bg-room-deep px-5 py-8">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-inverse/50">
                  {k}
                </dt>
                <dd className="mt-2 text-xl font-semibold text-ink-inverse">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[900px] px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-ink sm:text-[34px]">
          Questions people actually ask
        </h2>

        <div className="mt-8 divide-y divide-rule border-y border-rule">
          {FAQS.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q}>
                <h3>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  >
                    <span className="text-[15px] font-medium text-ink">{item.q}</span>
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center border transition-colors",
                        open ? "border-ink bg-ink text-ink-inverse" : "border-rule text-ink-muted",
                      )}
                    >
                      <ChevronDown
                        size={13}
                        strokeWidth={2.5}
                        aria-hidden
                        className={open ? "rotate-180" : undefined}
                      />
                    </span>
                  </button>
                </h3>
                {open && (
                  <p className="measure pb-5 text-sm leading-relaxed text-ink-muted">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      </main>

      <footer className="border-t border-rule bg-room-raised">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Link to="/" className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center bg-ink text-[13px] font-bold text-ink-inverse">
                  Q
                </span>
                <span className="text-sm font-semibold tracking-tight text-ink">QTNXT</span>
              </Link>
              <p className="measure mt-3 text-sm leading-relaxed text-ink-muted">
                Courses built as chapters and lessons, with assessments you can
                sit properly.
              </p>
            </div>
            {[
              { title: "Learn", links: [["Catalogue", "/courses"], ["Assignments", "/assignments"], ["My learning", "/courses"]] },
              { title: "Account", links: [["Profile", "/profile"], ["Activity", "/activity"], ["Leaderboard", "/leaderboard"]] },
              { title: "About", links: [["About QTNXT", "/about"]] },
            ].map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  {col.title}
                </p>
                <ul className="mt-3 space-y-2">
                  {col.links.map(([label, to]) => (
                    <li key={label}>
                      <Link
                        to={to}
                        className="text-sm text-ink-muted transition-colors hover:text-ink"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <p className="mt-10 border-t border-rule pt-6 text-xs text-ink-faint">
            QTNXT. Learn the thing, properly.
          </p>
        </div>
      </footer>
    </div>
  );
}