import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Check,
  Cloud,
  Eye,
  FileText,
  Play,
  Plus,
  Video,
  canTeach,
} from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { TeachMark } from "../components/Badge";

/*
 * Register: brand. But the old hero was a stock photo, centred type, a pill
 * nav and two floating rotated cards of invented numbers. Everything about it
 * could belong to any course platform.
 *
 * The new proof object is the product itself: an instructor's real course
 * outline, drawn in the same system the app uses. If the outline could be
 * pasted into a fitness app and still make sense, it is too generic — so it
 * is specific: chapters, lesson kinds, marks, a publish check.
 */

const OUTLINE = [
  {
    title: "Setting up the studio",
    meta: "3 lessons · 40 marks",
    lessons: [
      { kind: "video" as const, label: "Welcome and course map", dur: "4:12" },
      { kind: "file" as const, label: "Starter project files", dur: "PDF" },
    ],
  },
  {
    title: "Your first live session",
    meta: "4 lessons · 60 marks",
    lessons: [
      { kind: "video" as const, label: "Scheduling and reminders", dur: "11:40" },
      { kind: "text" as const, label: "Writing the run sheet", dur: "Read" },
    ],
  },
];

const KIND_ICON = {
  video: Video,
  file: FileText,
  text: FileText,
};

const PILLARS = [
  {
    Icon: Cloud,
    title: "Author without leaving the tab",
    body: "Chapters, lessons and uploads save as you type. Close the laptop mid-outline and pick it up tomorrow exactly where you left it.",
  },
  {
    Icon: Eye,
    title: "See the learner view before launch",
    body: "Preview the course as a learner sees it, on every device, so you never publish a broken enrolment to an audience.",
  },
  {
    Icon: BarChart3,
    title: "Know which lessons land",
    body: "Completion and drop-off per lesson, per cohort. The analytics tell you what to cut, not just how many people signed up.",
  },
];

export default function InstructorLanding() {
  const user = useAuth((s) => s.user);
  const teach = canTeach(user);

  const primaryCta = teach ? (
    <Link
      to="/dashboard"
      className="inline-flex h-12 items-center gap-2 border border-ink bg-ink px-6 text-sm font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
    >
      Open your studio <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
    </Link>
  ) : user ? (
    <Link
      to="/login"
      className="inline-flex h-12 items-center gap-2 border border-ink bg-ink px-6 text-sm font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
    >
      Switch to an instructor account <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
    </Link>
  ) : (
    <Link
      to="/login"
      className="inline-flex h-12 items-center gap-2 border border-ink bg-ink px-6 text-sm font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
    >
      Start teaching <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-ground">
      {/* Marketing bar for anonymous visitors; the app header takes over once signed in. */}
      <div className="sticky top-0 z-40 border-b border-rule bg-slate-panel/95 backdrop-blur supports-[backdrop-filter]:bg-slate-panel/80">
        <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center bg-ink text-[13px] font-bold text-ink-inverse">
              Q
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink">QTNXT</span>
            <TeachMark />
          </Link>
          <div className="flex items-center gap-2">
            <a
              href="#how"
              className="hidden h-9 items-center px-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink sm:inline-flex"
            >
              How it works
            </a>
            {teach || user ? (
              <Link
                to="/dashboard"
                className="inline-flex h-9 items-center border border-ink bg-ink px-4 text-sm font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
              >
                Studio
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-9 items-center border border-ink bg-ink px-4 text-sm font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      {/*
        Hero: asymmetric split, not a centred stack. The pitch leads from the
        top-left; the product artefact answers it on the right. Composition
        mass is balanced rather than centred, so the eye travels.
      */}
      <section className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-14 lg:py-20">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            <span aria-hidden className="h-1.5 w-1.5 bg-signal-deep" />
            Instructor studio
          </p>

          {/* Three levels, exactly: hook, bridge, detail. */}
          <h1 className="mt-5 text-[38px] font-semibold leading-[1.02] tracking-[-0.035em] text-ink sm:text-[52px] lg:text-[58px]">
            Teach the thing{" "}
            <br />
            {" "}you know{" "}
            <span className="relative inline-block">
              <span className="relative z-10">properly</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-[0.06em] z-0 h-[0.18em] bg-signal"
              />
            </span>
            .
          </h1>

          <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-ink-muted">
            Build a course the way you would run a workshop: chapters, real
            materials, and a check before you publish so nothing broken reaches a
            paying learner. You keep 85% of every payment.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {primaryCta}
            <a
              href="#how"
              className="inline-flex h-12 items-center border border-rule-strong bg-slate-panel px-6 text-sm font-semibold text-ink transition-colors hover:bg-slate-sunk"
            >
              See how it works
            </a>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-px border border-rule bg-rule">
            {[
              ["85%", "Revenue share"],
              ["Monthly", "Payouts"],
              ["Zero", "Upfront fees"],
            ].map(([v, k]) => (
              <div key={k} className="bg-slate-panel px-4 py-4">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  {k}
                </dt>
                <dd className="tnum mt-1.5 text-xl font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The proof object: a real outline from the real editor. */}
        <div className="min-w-0">
          <div className="border border-rule-strong bg-slate-panel">
            <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  Running live sessions
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">2 chapters · 7 lessons</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 border border-live/25 bg-live-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-live">
                <Check size={11} strokeWidth={3} aria-hidden /> Ready to publish
              </span>
            </div>

            <ol className="divide-y divide-rule">
              {OUTLINE.map((ch, i) => (
                <li key={ch.title}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="tnum shrink-0 text-xs font-semibold text-ink-faint">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{ch.title}</p>
                      <p className="tnum mt-0.5 text-xs text-ink-faint">{ch.meta}</p>
                    </div>
                  </div>
                  <ul className="border-t border-rule bg-slate-sunk px-4 py-2 sm:pl-11">
                    {ch.lessons.map((l) => {
                      const Icon = KIND_ICON[l.kind];
                      return (
                        <li
                          key={l.label}
                          className="flex items-center gap-2.5 py-1.5 text-sm text-ink-muted"
                        >
                          <Icon size={13} strokeWidth={2.2} aria-hidden className="shrink-0 text-ink-faint" />
                          <span className="min-w-0 flex-1 truncate">{l.label}</span>
                          <span className="tnum shrink-0 text-xs text-ink-faint">{l.dur}</span>
                        </li>
                      );
                    })}
                    <li>
                      <span className="inline-flex items-center gap-1.5 py-1.5 text-xs font-medium text-ink-faint">
                        <Plus size={12} strokeWidth={2.5} aria-hidden />
                        Add a lesson
                      </span>
                    </li>
                  </ul>
                </li>
              ))}
            </ol>

            <div className="flex items-center justify-between gap-3 border-t border-rule bg-slate-ground px-4 py-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                <Play size={12} strokeWidth={2.5} aria-hidden />
                Preview as learner
              </span>
              <span className="inline-flex h-8 items-center border border-ink bg-ink px-3 text-xs font-semibold text-ink-inverse">
                Publish
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-[1280px] px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="border-t border-rule-strong pt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            What the studio does
          </p>
          <h2 className="mt-3 max-w-[24ch] text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-[32px]">
            Three things that decide whether your course works.
          </h2>

          <div className="mt-8 grid gap-px border border-rule bg-rule sm:grid-cols-3">
            {PILLARS.map(({ Icon, title, body }) => (
              <div key={title} className="bg-slate-panel p-6">
                <span className="flex h-9 w-9 items-center justify-center border border-rule bg-slate-sunk text-ink-muted">
                  <Icon size={16} strokeWidth={2.2} aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-rule bg-slate-panel">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center bg-ink text-[11px] font-bold text-ink-inverse">
              Q
            </span>
            <span className="text-xs font-medium text-ink-muted">QTNXT Teach</span>
          </div>
          <p className="text-xs text-ink-faint">
            Payouts run monthly. No upfront fees, no listing charge.
          </p>
        </div>
      </footer>
    </div>
  );
}