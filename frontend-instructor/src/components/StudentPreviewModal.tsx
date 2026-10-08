import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LESSON_KIND_BADGE,
  Minus,
  Plus,
  absoluteMediaUrl,
  X,
} from "@masterlms/shared";
import type { SharedApiCourseDetail } from "@masterlms/shared";
import { api } from "../lib/api";

/** Read-only mirror of the learner course detail page. Enroll/wishlist/share
 *  controls are shown exactly as a learner sees them but stay inert — this is
 *  a preview, not a checkout. */
export function StudentPreviewModal({
  courseId,
  onClose,
}: {
  courseId: string;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(0);

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api<SharedApiCourseDetail>(`/courses/${courseId}/`),
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 text-sm text-ink-inverse">
        Loading preview…
      </div>
    );
  }
  if (isError || !course) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4">
        <div className="border border-rule bg-slate-panel p-6 text-center">
          <p className="text-sm font-semibold text-ink">Preview unavailable</p>
          <p className="mt-1 text-xs text-ink-muted">
            We couldn&apos;t load this course. Save your changes and try again.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-sm bg-ink px-5 py-2 text-xs font-semibold text-ink-inverse"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const sections = course.sections ?? [];
  const learn = course.what_you_will_learn ?? [];
  const lectureCount = sections.reduce((a, s) => a + (s.lessons?.length ?? 0), 0);
  const priceNum = Number(course.price);
  const price = priceNum === 0 ? "Free" : `₹${priceNum.toLocaleString("en-IN")}`;
  const cover = course.cover_image
    ? (absoluteMediaUrl(course.cover_image) ?? course.cover_image)
    : "";
  const rating = course.average_rating ? Number(course.average_rating).toFixed(1) : "";

  const disabled =
    "cursor-not-allowed disabled:opacity-45 disabled:hover:bg-slate-panel disabled:hover:border-current";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden border border-rule-strong bg-slate-ground"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview of ${course.title}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-rule bg-slate-panel px-5 py-3">
          <p className="min-w-0 truncate text-sm font-semibold text-ink">
            Student preview
            <span className="ml-2 font-normal text-ink-muted">
              what a learner sees on this page
            </span>
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="shrink-0 rounded-sm border border-rule p-2 text-ink-muted hover:bg-slate-sunk"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* LEFT */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tnum">
                {course.level && (
                  <span className="border border-rule bg-slate-panel px-2 py-1 capitalize text-ink-muted">
                    {course.level}
                  </span>
                )}
                <span className="border border-rule bg-slate-panel px-2 py-1 text-ink-muted">
                  {lectureCount} lecture{lectureCount === 1 ? "" : "s"}
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-semibold">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {course.subtitle}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                {rating && (
                  <span className="font-semibold text-hold tnum">★ {rating}</span>
                )}
                {course.student_count != null && (
                  <span className="text-ink-muted tnum">{course.student_count} students</span>
                )}
                {course.instructor_name && (
                  <span className="flex items-center gap-2 text-ink-muted">
                    {course.instructor_avatar && (
                      <img
                        src={absoluteMediaUrl(course.instructor_avatar) ?? course.instructor_avatar}
                        alt=""
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    )}
                    <span className="font-medium text-ink">
                      {course.instructor_name}
                    </span>
                  </span>
                )}
              </div>

              {learn.length > 0 && (
                <div className="mt-6 border border-rule bg-slate-panel p-5">
                  <h3 className="text-sm font-semibold text-ink">What you&apos;ll learn</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {learn.map((item) => (
                      <div
                        key={item}
                        className="flex gap-2 text-xs leading-relaxed text-ink-muted"
                      >
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-live text-[10px] text-ink-inverse">
                          ✓
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sections.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-ink">Course content</h3>
                    <span className="text-xs text-ink-muted tnum">
                      {sections.length} section{sections.length === 1 ? "" : "s"} •{" "}
                      {lectureCount} lecture{lectureCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-3 overflow-hidden border border-rule bg-slate-panel">
                    {sections.map((sec, i) => (
                      <div key={sec.id} className="border-b border-rule last:border-0">
                        <button
                          type="button"
                          onClick={() => setOpen(open === i ? -1 : i)}
                          className="flex w-full items-center justify-between bg-slate-sunk px-4 py-3 text-left hover:bg-slate-panel"
                        >
                          <span className="text-sm font-semibold text-ink">{sec.title}</span>
                          <span className="flex items-center gap-2 text-xs text-ink-muted tnum">
                            {(sec.lessons?.length ?? 0) === 1 ? "1 lecture" : `${sec.lessons?.length ?? 0} lectures`}
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                open === i ? "bg-ink text-ink-inverse" : "bg-slate-panel text-ink-muted border border-rule"
                              }`}
                            >
                              {open === i ? (
                                <Minus size={12} strokeWidth={2.5} />
                              ) : (
                                <Plus size={12} strokeWidth={2.5} />
                              )}
                            </span>
                          </span>
                        </button>
                        {open === i && (
                          <ul className="px-4 py-2">
                            {(sec.lessons ?? []).map((l) => {
                              const badge = LESSON_KIND_BADGE[l.kind];
                              const Icon = badge.Icon;
                              return (
                                <li
                                  key={l.id}
                                  className="flex items-center gap-2 py-2 text-xs text-ink-muted"
                                >
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${badge.badge}`}
                                  >
                                    <Icon size={11} strokeWidth={2.5} />
                                  </span>
                                  <span className="min-w-0 flex-1 truncate">{l.title}</span>
                                  {l.kind === "quiz" && (
                                    <span className="border border-hold/30 bg-hold-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-hold">
                                      Quiz
                                    </span>
                                  )}
                                  <span className="text-ink-faint tnum">{l.duration}</span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {course.description && (
                <div className="mt-6 border border-rule bg-slate-panel p-5">
                  <h3 className="text-sm font-semibold text-ink">Description</h3>
                  <p className="mt-2 break-words whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                    {course.description}
                  </p>
                  {course.instructor_name && (
                    <div className="mt-5 flex gap-3 border border-rule bg-slate-sunk p-4">
                      {course.instructor_avatar && (
                        <img
                          src={absoluteMediaUrl(course.instructor_avatar) ?? course.instructor_avatar}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-ink">{course.instructor_name}</p>
                        {course.instructor_role && (
                          <p className="text-xs text-ink-muted">{course.instructor_role}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT — mirrors the learner's enroll card */}
            <div>
              <div className="sticky top-0 overflow-hidden border border-rule bg-slate-panel">
                {cover && (
                  <img src={cover} alt="" className="h-40 w-full object-cover" />
                )}
                <div className="p-5">
                  <span className="text-2xl font-semibold tnum">{price}</span>

                  <button
                    type="button"
                    disabled
                    className={`mt-4 w-full rounded-sm bg-ink py-3 text-sm font-semibold text-ink-inverse ${disabled}`}
                  >
                    Enroll now
                  </button>
                  <button
                    type="button"
                    disabled
                    className={`mt-2 w-full rounded-sm border border-rule-strong py-2 text-sm font-semibold text-ink-muted ${disabled}`}
                  >
                    Add to wishlist ♡
                  </button>
                  <p className="mt-2 text-center text-[11px] text-ink-muted">
                    30-day money-back guarantee • Full lifetime access
                  </p>

                  <div className="mt-5 border border-rule bg-slate-sunk p-4">
                    <p className="text-xs font-semibold text-ink">This course includes:</p>
                    <ul className="mt-2 space-y-2 text-xs text-ink-muted">
                      <li className="flex gap-2">
                        <span>●</span> On-demand videos
                      </li>
                      <li className="flex gap-2 tnum">
                        <span>●</span> {sections.length} section
                        {sections.length === 1 ? "" : "s"} • {lectureCount} lecture
                        {lectureCount === 1 ? "" : "s"}
                      </li>
                      <li className="flex gap-2">
                        <span>●</span> Interactive quizzes
                      </li>
                      <li className="flex gap-2">
                        <span>●</span> Certificate of completion
                      </li>
                      <li className="flex gap-2">
                        <span>●</span> Full lifetime access
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled
                      className={`flex-1 rounded-sm border border-rule-strong py-2 text-xs font-medium text-ink-muted ${disabled}`}
                    >
                      Share
                    </button>
                    <button
                      type="button"
                      disabled
                      className={`flex-1 rounded-sm border border-rule-strong py-2 text-xs font-medium text-ink-muted ${disabled}`}
                    >
                      Gift
                    </button>
                    <button
                      type="button"
                      disabled
                      className={`flex-1 rounded-sm border border-rule-strong py-2 text-xs font-medium text-ink-muted ${disabled}`}
                    >
                      Coupon
                    </button>
                  </div>
                  <p className="mt-3 text-center text-[11px] text-ink-faint">
                    Preview only — actions are disabled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}