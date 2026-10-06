import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Play,
  Star,
  LESSON_KIND_BADGE,
  quizOption,
  toEmbed,
} from "@masterlms/shared";
import type { LessonKind, SharedQuizQ } from "@masterlms/shared";
import { PdfReader } from "./PdfReader";
import { cn } from "../lib/utils";
import { absoluteMediaUrl } from "../lib/api";
import { quizCorrect } from "../lib/quiz";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Textarea } from "./Controls";
import { Panel } from "./Panel";

export type LearnLesson = {
  id: number;
  title: string;
  duration: string;
  preview?: boolean;
  kind: LessonKind;
  resource_url?: string;
  quiz_data?: SharedQuizQ[];
};
export type LearnSection = { id: number; title: string; lessons: LearnLesson[] };
export type LearnTab = "overview" | "notes" | "qna";

type QuizVerdict = { score: number; total: number } | null;

type Props = {
  courseId: string;
  title: string;
  progress: number;
  total: number;
  active: number | null;
  activeLesson: LearnLesson | undefined;
  embedUrl: string | null;
  textBody: string;
  pdfUrl: string | null;
  audioUrl: string | null;
  sections: LearnSection[];
  completed: Set<number>;
  openSections: Set<number>;
  tab: LearnTab;
  note: string;
  quizAnswers: Record<number, number | string>;
  quizSubmitted: boolean;
  quizVerdict: QuizVerdict;
  quizGrading: boolean;
  quizAttempt: number | null;
  quizBest: number | null;
  showRating: boolean;
  selectedRating: number;
  submittingRating: boolean;
  userRating: number | null;
  toast: string | null;
  onSelectLesson: (id: number) => void;
  onToggleSection: (i: number) => void;
  onTab: (t: LearnTab) => void;
  onNote: (v: string) => void;
  onAnswer: (qi: number, value: number | string) => void;
  onMarkComplete: () => void;
  onSubmitQuiz: () => void;
  onShowRating: () => void;
  onSelectRating: (n: number) => void;
  onSubmitRating: () => void;
};

export function LearnView(p: Props) {
  const {
    courseId, title, progress, active, activeLesson, embedUrl, textBody,
    pdfUrl, audioUrl, sections, completed, openSections, tab, note,
    quizAnswers, quizSubmitted, quizVerdict, quizGrading, quizAttempt, quizBest,
    showRating, selectedRating, submittingRating,
    userRating, toast,
  } = p;
  return (
    <div className="min-h-screen bg-room">
      <div className="sticky top-0 z-30 flex justify-center bg-room px-3 py-3 sm:px-4">
        <div className="flex w-full max-w-[1280px] items-center justify-between gap-3 border border-rule bg-room-raised px-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <Link to={`/courses/${courseId}`} className="flex h-7 w-7 shrink-0 items-center justify-center bg-ink text-ink-inverse"><ArrowLeft size={14} strokeWidth={2.5} aria-hidden /></Link>
            <span className="hidden h-6 w-px bg-rule sm:block" />
            <p className="truncate text-sm font-semibold text-ink">{title}</p>
            <Badge tone="live" showIcon={false} className="tnum hidden sm:inline-flex">{progress}%</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden h-1.5 w-24 overflow-hidden bg-rule/50 sm:block"><div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div>
            <Link to="/courses" className="hidden items-center gap-1 border border-rule px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-room-sunk hover:text-ink sm:inline-flex"><ArrowLeft size={12} strokeWidth={2.5} aria-hidden /> Exit</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1280px] gap-4 px-3 pb-6 sm:px-4 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="overflow-hidden border border-rule bg-room-raised">
            {activeLesson?.kind === "video" && embedUrl ? (
              <div className="aspect-video w-full bg-black">
                <iframe src={embedUrl} title={activeLesson.title} className="h-full w-full" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
              </div>
            ) : activeLesson?.kind === "video" && !embedUrl ? (
              <div className="aspect-video w-full flex flex-col items-center justify-center gap-3 bg-room-deep p-6 text-center text-ink-inverse">
                <p className="text-sm font-semibold">No video URL set</p>
                <p className="text-xs text-ink-inverse/70 max-w-md">{`Paste a YouTube/Vimeo/Loom share URL or <iframe> embed code for “${activeLesson.title}”.`}</p>
              </div>
            ) : activeLesson?.kind === "text" ? (
              <div className="bg-room-raised p-6 sm:p-8">
                <div className="prose prose-zinc max-w-none prose-headings:font-display prose-headings:font-normal prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base prose-p:leading-relaxed prose-a:text-ink prose-a:no-underline hover:prose-a:underline prose-table:my-4 prose-th:bg-room-sunk prose-th:p-2 prose-td:p-2 prose-code:bg-room-sunk prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-room-deep prose-pre:text-ink-inverse prose-pre:rounded prose-pre:p-4 prose-blockquote:border-l-ink prose-blockquote:bg-room-sunk prose-blockquote:py-1 prose-blockquote:px-4 prose-img:rounded">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{textBody}</ReactMarkdown>
                </div>
              </div>
            ) : activeLesson?.kind === "pdf" && pdfUrl ? (
              <PdfReader url={pdfUrl} title={activeLesson.title} />
            ) : activeLesson?.kind === "audio" && audioUrl ? (
              <div className="aspect-video w-full bg-room-deep flex items-center justify-center p-6"><audio controls src={audioUrl} className="w-full max-w-md" /></div>
             ) : activeLesson?.kind === "link" && activeLesson.resource_url ? (
              <div className="aspect-video w-full bg-room-raised p-6 flex flex-col items-center justify-center text-center gap-3">
                <p className="text-sm font-semibold text-ink">External resource</p>
                <a href={activeLesson.resource_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 border border-ink bg-ink px-5 py-2 text-xs font-semibold text-ink-inverse">Open link <ArrowUpRight size={12} strokeWidth={2.5} aria-hidden /></a>
              </div>
            ) : activeLesson?.kind === "quiz" && activeLesson.quiz_data ? (
              <div className="aspect-video w-full bg-room-raised p-6 overflow-auto">
                <h3 className="text-sm font-semibold text-ink">Quiz — {activeLesson.title}</h3>
                <div className="mt-4 space-y-4">
                  {activeLesson.quiz_data.map((q, qi)=> (
                    <div key={q.id} className="border border-rule bg-room-sunk p-3">
                      <p className="text-sm font-semibold text-ink">Q{qi+1}. {q.question}</p>
                      {q.prompt && <p className="mt-1 text-xs text-ink-muted">{q.prompt}</p>}
                      {(q.type === "image" || q.type === "video") && q.media_url && (() => {
                        const raw = q.media_url!.trim();
                        const isVideo = q.type === "video";
                        let src: string | null = null;
                        if (isVideo) {
                          src = /^<iframe/i.test(raw) ? raw : (toEmbed(raw) ?? (raw.match(/\.(mp4|webm|mov)(\?|$)/) ? absoluteMediaUrl(raw) : null));
                        } else {
                          src = absoluteMediaUrl(raw);
                        }
                        return src ? (
                          isVideo && src ? (
                            /\.(mp4|webm|mov)(\?|$)/.test(src) ? (
                              <video src={src} controls className="mt-2 max-h-40 w-full border bg-black object-contain" />
                            ) : (
                              <iframe src={src} title={`Q${qi + 1} media`} className="mt-2 aspect-video w-full border" allowFullScreen />
                            )
                          ) : (
                            <img src={src} alt="" className="mt-2 max-h-40 w-full border object-contain bg-room-raised" />
                          )
                        ) : null;
                      })()}
                      <div className="mt-2 grid gap-2">
                        {q.type === "qa" ? (
                          <input
                            type="text"
                            value={typeof quizAnswers[qi] === "string" ? (quizAnswers[qi] as string) : ""}
                            onChange={(e) => p.onAnswer(qi, e.target.value)}
                            disabled={quizSubmitted}
                            placeholder="Type your answer…"
                            className={cn("w-full border border-rule bg-room-raised px-3 py-2 text-sm text-ink", quizSubmitted ? (quizCorrect(q, quizAnswers[qi]) ? "border-live/40 bg-live-soft" : "border-halt/40 bg-halt-soft") : "focus:border-ink")}
                          />
                        ) : (
                          q.options.map((optEntry, oi)=> {
                            const opt = quizOption(optEntry);
                            const isSel = quizAnswers[qi]===oi;
                            const oMp4 = (opt.media_url ?? "").match(/\.(mp4|webm|mov)(\?|$)/);
                            const oSrc = opt.type === "video" ? (oMp4 ? absoluteMediaUrl(opt.media_url) : toEmbed(opt.media_url)) : opt.media_url;
                            return (
                              <label key={oi} className={cn("flex items-start gap-2 border border-rule bg-room-raised px-3 py-2 text-sm text-ink", isSel && !quizSubmitted ? "border-ink" : "", quizSubmitted && oi===q.correct ? "border-live/40 bg-live-soft" : quizSubmitted && isSel && oi!==q.correct ? "border-halt/40 bg-halt-soft" : "")}>
                                <input
                                  type="radio"
                                  name={`q-${qi}`}
                                  checked={isSel}
                                  onChange={()=> p.onAnswer(qi, oi)}
                                  className="mt-1 shrink-0"
                                />
                                <span className="min-w-0 flex-1">
                                  {opt.type === "image" && opt.media_url && (
                                    <img src={absoluteMediaUrl(opt.media_url) ?? opt.media_url} alt="" onError={(e) => { const el = e.target as HTMLImageElement; el.parentElement!.style.display = "none"; }} className="mb-1 max-h-28 w-full border object-contain bg-room-sunk" />
                                  )}
                                  {opt.type === "video" && opt.media_url && oSrc && (
                                    oMp4 ? (
                                      <video src={oSrc} controls className="mb-1 max-h-28 w-full border bg-black object-contain" />
                                    ) : (
                                      <iframe src={oSrc} title={`Option ${oi + 1} media`} className="mb-1 aspect-video w-full border" allowFullScreen />
                                    )
                                  )}
                                  {opt.text ? <span>{opt.text}</span> : <span className="text-ink-faint">Option {oi + 1}</span>}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                      {quizSubmitted && (
                        <p className={cn("mt-1.5 flex items-center gap-1 text-xs font-semibold", quizCorrect(q, quizAnswers[qi]) ? "text-live" : "text-halt")}>
                          {quizCorrect(q, quizAnswers[qi]) ? (<><Check size={12} strokeWidth={3} aria-hidden /> Correct</>) : q.type === "qa" ? <>Correct answer: <span className="font-semibold">{q.answer ?? ""}</span></> : (null)}
                        </p>
                      )}
                    </div>
                  ))}
                    {!quizSubmitted ? (
                    <Button variant="primary" size="md" onClick={p.onSubmitQuiz}>Submit quiz</Button>
                  ) : quizVerdict == null ? (
                    <div className="border border-rule bg-room-sunk p-3 text-sm text-ink-muted">
                      {quizGrading ? "Grading your answers…" : "Submitted — waiting for the grade."}
                      {quizAttempt != null && quizBest != null && (
                        <span className="tnum mt-1 block text-xs text-ink-muted">Attempt {quizAttempt} · Best so far {quizBest}</span>
                      )}
                    </div>
                  ) : (
                    <div className="border border-live/25 bg-live-soft p-3 text-sm text-live">
                      <p className="font-semibold tnum">Score: {quizVerdict.score}/{quizVerdict.total} — {quizVerdict.score === quizVerdict.total ? "Perfect! ✓" : "Keep practicing"}</p>
                      {quizAttempt != null && quizBest != null && quizVerdict.total > 0 && <span className="tnum mt-1 block text-xs text-live/80">Attempt {quizAttempt} · Best {quizBest}/{quizVerdict.total}</span>}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="aspect-video w-full bg-room-deep flex flex-col items-center justify-center text-ink-inverse relative">
                <img src="https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&auto=format&fit=crop&q=80" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                 <div className="relative flex flex-col items-center gap-3">
                   <button type="button" className="flex h-14 w-14 items-center justify-center bg-room-raised text-ink shadow-lg"><Play size={24} strokeWidth={2.5} className="ml-0.5" aria-hidden /></button>
                   <p className="text-sm font-semibold">{activeLesson?.title ?? "Pick a lesson"}</p>
                   <p className="tnum text-xs text-ink-inverse/70">{activeLesson?.duration}</p>
                 </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="h-1 overflow-hidden bg-ink-inverse/20"><div className="h-full w-[42%] bg-gold" /></div>
                  <div className="tnum mt-2 flex items-center justify-between text-[11px] text-ink-inverse/80"><span>02:14 / {activeLesson?.duration}</span><span className="flex gap-2"><button type="button" className="border border-ink-inverse/25 px-2 py-1">1x</button><button type="button" className="border border-ink-inverse/25 px-2 py-1">⛶</button></span></div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2 border-b border-rule">
            {([
              ["overview", "Overview"],
              ["qna", "Q&A"],
              ["notes", "Notes"],
            ] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => p.onTab(k)} className={cn("border-b-2 px-3 py-2 text-sm font-semibold transition-colors", tab === k ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink")}>{label}</button>
            ))}
            <button type="button" onClick={p.onMarkComplete} className={cn("ml-auto mb-2 hidden items-center gap-1.5 border px-3 py-1 text-xs font-semibold transition-colors sm:inline-flex", active != null && completed.has(active) ? "border-live/25 bg-live-soft text-live" : "border-rule bg-room-raised text-ink hover:bg-room-sunk")}>{active != null && completed.has(active) ? "✓ Completed" : "Mark complete"}</button>
          </div>

          {tab === "overview" && (
            <Panel className="mt-4">
              <h3 className="text-sm font-semibold text-ink">About this lesson</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">In this lesson you’ll learn the core ideas with a calm, focused approach. Follow along, pause anytime, and build as you go. Notes are auto-saved locally.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="muted" showIcon={false} className="bg-ink text-ink-inverse">Calm pace</Badge>
                <Badge tone="gold" showIcon={false}>Hands-on</Badge>
              </div>
              <Button variant="primary" block onClick={p.onMarkComplete} className="mt-4 sm:hidden">{active != null && completed.has(active) ? "✓ Completed" : "Mark complete"}</Button>
            </Panel>
          )}
          {tab === "notes" && (
            <Panel className="mt-4">
              <h3 className="text-sm font-semibold text-ink">Your notes</h3>
              <Textarea value={note} onChange={(e) => p.onNote(e.target.value)} placeholder={`Take a note for “${activeLesson?.title ?? "this lesson"}”…`} className="mt-3 min-h-[120px]" />
              <p className="tnum mt-2 text-xs text-ink-muted">{note.length} characters • saved on this device</p>
            </Panel>
          )}
          {tab === "qna" && (
            <Panel className="mt-4">
              <h3 className="text-sm font-semibold text-ink">Q&A</h3>
              <p className="mt-2 text-sm text-ink-muted">Ask a question — the instructor or community will reply.</p>
              <div className="mt-3 border border-rule bg-room-sunk p-3 text-sm"><p className="font-semibold text-ink">Maya • 2h ago</p><p className="text-ink-muted">How do I export the wireframe?</p></div>
            </Panel>
          )}
        </div>

        <div className="lg:sticky lg:top-[72px] lg:h-[calc(100vh-84px)] lg:overflow-auto">
          <div className="overflow-hidden border border-rule bg-room-raised">
            <div className="flex items-center justify-between border-b border-rule px-4 py-3">
              <p className="text-sm font-semibold text-ink">Course content</p><span className="tnum text-xs text-ink-muted">{completed.size}/{p.total} • {progress}%</span>
            </div>
            <div className="p-2">
              <div className="h-1.5 overflow-hidden bg-rule/50"><div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
            {sections.map((sec, i) => (
              <div key={sec.id} className="border-b border-rule last:border-0">
                <button type="button" onClick={() => p.onToggleSection(i)} className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-room-sunk">
                  <span className="text-sm font-semibold text-ink">{sec.title}</span><span className="tnum text-xs text-ink-muted">{sec.lessons.length} • <span className={cn("inline-flex h-5 w-5 items-center justify-center", openSections.has(i) ? "bg-ink text-ink-inverse" : "bg-room-sunk")}>{openSections.has(i) ? <ChevronUp size={12} strokeWidth={2.5} aria-hidden /> : <ChevronDown size={12} strokeWidth={2.5} aria-hidden />}</span></span>
                </button>
                {openSections.has(i) && (
                  <ul>
                    {sec.lessons.map((l) => (
                      <li key={l.id}>
                        <button type="button" onClick={() => p.onSelectLesson(l.id)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-room-sunk", active === l.id && "bg-room-sunk")}>
                          <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center", completed.has(l.id) ? "bg-live text-ink-inverse" : active === l.id ? "bg-ink text-ink-inverse" : LESSON_KIND_BADGE[l.kind].badge)}>{completed.has(l.id) ? <CheckCircle2 size={12} strokeWidth={2.5} aria-hidden /> : (() => { const Icon = LESSON_KIND_BADGE[l.kind].Icon; return <Icon size={11} strokeWidth={2.5} aria-hidden />; })()}</span>
                          <span className={cn("text-sm", active === l.id ? "font-semibold text-ink" : "text-ink-muted")}>{l.title}</span>
                          <span className="tnum ml-auto flex items-center gap-1 text-xs text-ink-muted">{l.kind === "quiz" && <Badge tone="gold" showIcon={false} className="px-1.5 text-[10px]">Quiz</Badge>}{l.duration}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <div className="p-3">
              <Link to={`/courses/${courseId}`} className="block w-full border border-rule py-2.5 text-center text-sm font-semibold text-ink transition-colors hover:bg-room-sunk">Back to course</Link>
              {progress === 100 && !userRating && !showRating && (
                <Button variant="primary" block onClick={p.onShowRating} className="mt-2">Mark course as complete →</Button>
              )}
              {showRating && !userRating && (
                <div className="mt-3 border border-rule bg-room-raised p-4">
                  <h4 className="text-sm font-semibold text-ink">Rate this course</h4>
                  <p className="mt-1 text-xs text-ink-muted">How was your experience?</p>
                  <div className="mt-3 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => p.onSelectRating(n)} className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${n <= selectedRating ? "border-gold-deep bg-gold text-gold-deep" : "bg-room-raised text-ink-faint hover:bg-room-sunk"}`}>
                        <Star size={16} strokeWidth={2.5} fill={n <= selectedRating ? "currentColor" : "none"} aria-hidden />
                      </button>
                    ))}
                  </div>
                  <Button variant="primary" block size="sm" onClick={p.onSubmitRating} disabled={!selectedRating || submittingRating} className="mt-3">{submittingRating ? "Submitting…" : "Submit rating"}</Button>
                </div>
              )}
              {userRating && (
                <div className="mt-3 border border-live/25 bg-live-soft p-3 text-center">
                  <p className="tnum text-xs font-semibold text-live">You rated {userRating} ★ — thanks for your feedback!</p>
                  <p className="mt-1 text-[11px] text-ink-muted">Average rating updated on course details & cards.</p>
                </div>
              )}
            </div>
           </div>
         </div>
       {toast && <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-ink bg-ink px-5 py-2.5 text-sm text-ink-inverse shadow-xl">{toast}</div>}
     </div>
   </div>
 );
 }
