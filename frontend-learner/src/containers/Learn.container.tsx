import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ChevronDown, ChevronUp, Play, CheckCircle2, ArrowUpRight } from "@masterlms/shared";
import { PdfReader } from "../components/PdfReader";
import { absoluteMediaUrl, api } from "../lib/api";
import { cn } from "../lib/utils";

type QuizQ = { id: string; question: string; options: string[]; correct: number };
type Lesson = { id: number; title: string; duration: string; preview?: boolean; kind: string; resource_url?: string; quiz_data?: QuizQ[] };
type Section = { id: number; title: string; lessons: Lesson[] };
type ApiCourse = { id: number; title: string; sections: Section[] };

const IFRAME_SRC_RE = /<iframe[^>]*\bsrc=["']([^"']+)["']/i;
const YT_HOSTS = ["youtube.com", "youtu.be"];
const VIMEO_HOSTS = ["vimeo.com"];
const LOOM_HOSTS = ["loom.com"];

function normalizeEmbedInput(input: string | undefined): string {
  if (!input) return "";
  const trimmed = input.trim();
  const iframeMatch = trimmed.match(IFRAME_SRC_RE);
  if (iframeMatch) return iframeMatch[1];
  return trimmed;
}

function toEmbed(input: string | undefined): string | null {
  const url = normalizeEmbedInput(input);
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");

  if (YT_HOSTS.includes(host)) {
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split(/[/?]/)[0];
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
    }
    if (u.pathname.startsWith("/embed/")) return `${url}${u.search ? "" : "?rel=0"}`;
    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}?rel=0`;
    const shorts = u.pathname.match(/^\/shorts\/([\w-]+)/);
    if (shorts) return `https://www.youtube.com/embed/${shorts[1]}?rel=0`;
    return null;
  }
  if (VIMEO_HOSTS.includes(host)) {
    const id = u.pathname.split("/").filter(Boolean).pop();
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (LOOM_HOSTS.includes(host) && u.pathname.includes("/share/")) {
    return url.replace("/share/", "/embed/");
  }
  return null;
}

export function LearnContainer({ courseId: propId, title: propTitle }: { courseId?: string; title?: string }) {
  const { id: routeId } = useParams();
  const courseId = String(propId ?? routeId);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(propTitle ?? "Course");
  const [active, setActive] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [openSections, setOpenSections] = useState<Set<number>>(() => new Set([0]));
  const [tab, setTab] = useState<"overview" | "notes" | "qna">("overview");
  const [note, setNote] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await api<ApiCourse>(`/courses/${courseId}/`);
        if (cancelled) return;
        setTitle(c.title);
        setSections(c.sections ?? []);
        if (c.sections?.[0]?.lessons?.[0]) setActive(c.sections[0].lessons[0].id);
      } catch (e) { setError(String(e)); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [courseId]);

  const allLessons = useMemo(() => sections.flatMap((s) => s.lessons), [sections]);
  const activeLesson = sections.flatMap((s) => s.lessons).find((l) => l.id === active);
  const total = allLessons.length;
  const progress = total ? Math.round((completed.size / total) * 100) : 0;

  const toggleSection = (i: number) => {
    const n = new Set(openSections);
    if (n.has(i)) n.delete(i); else n.add(i);
    setOpenSections(n);
  };

  const markComplete = async () => {
    if (active == null) return;
    const next = new Set(completed); next.add(active); setCompleted(next);
    try { await api(`/courses/${courseId}/lessons/complete`, { method: "POST", body: JSON.stringify({ lesson_id: active }) }); } catch {}
  };

  if (loading) return <p className="py-10 text-center text-sm text-zinc-500">Loading course…</p>;
  if (error) return <p className="py-10 text-center text-sm text-zinc-500">{error}. <Link to={`/courses/${courseId}`} className="inline-flex items-center gap-1 text-[#3478ff] underline"><ArrowLeft size={12} strokeWidth={2.5} /> Back</Link></p>;
  if (total === 0) return <p className="py-10 text-center text-sm text-zinc-500">No lessons yet. <Link to={`/courses/${courseId}`} className="inline-flex items-center gap-1 text-[#3478ff] underline"><ArrowLeft size={12} strokeWidth={2.5} /> Back to course</Link></p>;

  const embedUrl = activeLesson ? toEmbed(activeLesson.resource_url) : null;
  const textBody = activeLesson?.kind === "text" ? (activeLesson.resource_url ?? `*${activeLesson.title}*`) : "";
  const pdfUrl = absoluteMediaUrl(activeLesson?.resource_url);
  const audioUrl = activeLesson?.kind === "audio" ? absoluteMediaUrl(activeLesson.resource_url) : null;

  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <div className="sticky top-0 z-30 flex justify-center bg-[#f6f5f1] px-3 py-3 sm:px-4">
        <div className="flex w-full max-w-[1280px] items-center justify-between gap-3 rounded-full bg-white px-3 py-2 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={`/courses/${courseId}`} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white"><ArrowLeft size={14} strokeWidth={2.5} /></Link>
            <span className="hidden sm:block h-6 w-px bg-zinc-200" />
            <p className="truncate text-sm font-bold tracking-tight">{title}</p>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white">{progress}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block h-1.5 w-24 rounded-full bg-zinc-100 overflow-hidden"><div className="h-full bg-[#0f172a] transition-all" style={{ width: `${progress}%` }} /></div>
            <Link to="/courses" className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 hidden sm:block"><ArrowLeft size={12} strokeWidth={2.5} /> Exit</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1280px] gap-4 px-3 pb-6 sm:px-4 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-[20px] bg-white shadow-sm">
            {activeLesson?.kind === "video" && embedUrl ? (
              <div className="aspect-video w-full bg-black">
                <iframe src={embedUrl} title={activeLesson.title} className="h-full w-full" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
              </div>
            ) : activeLesson?.kind === "video" && !embedUrl ? (
              <div className="aspect-video w-full flex flex-col items-center justify-center gap-3 bg-zinc-900 p-6 text-center text-white">
                <p className="text-sm font-semibold">No video URL set</p>
                <p className="text-xs text-white/70 max-w-md">{`Paste a YouTube/Vimeo/Loom share URL or <iframe> embed code for “${activeLesson.title}”.`}</p>
              </div>
            ) : activeLesson?.kind === "text" ? (
              <div className="bg-white p-6 sm:p-8">
                <div className="prose prose-zinc max-w-none prose-headings:font-display prose-headings:font-normal prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base prose-p:leading-relaxed prose-a:text-[#3478ff] prose-a:no-underline hover:prose-a:underline prose-table:my-4 prose-th:bg-zinc-50 prose-th:p-2 prose-td:p-2 prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:rounded-xl prose-pre:p-4 prose-blockquote:border-l-[#3478ff] prose-blockquote:bg-blue-50/40 prose-blockquote:py-1 prose-blockquote:px-4 prose-img:rounded-xl">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{textBody}</ReactMarkdown>
                </div>
              </div>
            ) : activeLesson?.kind === "pdf" && pdfUrl ? (
              <PdfReader url={pdfUrl} title={activeLesson.title} />
            ) : activeLesson?.kind === "audio" && audioUrl ? (
              <div className="aspect-video w-full bg-zinc-900 flex items-center justify-center p-6"><audio controls src={audioUrl} className="w-full max-w-md" /></div>
             ) : activeLesson?.kind === "link" && activeLesson.resource_url ? (
              <div className="aspect-video w-full bg-white p-6 flex flex-col items-center justify-center text-center gap-3">
                <p className="text-sm font-semibold">External resource</p>
                <a href={activeLesson.resource_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#0f172a] px-5 py-2 text-xs font-bold text-white">Open link <ArrowUpRight size={12} strokeWidth={2.5} /></a>
              </div>
            ) : activeLesson?.kind === "quiz" && activeLesson.quiz_data ? (
              <div className="aspect-video w-full bg-white p-6 overflow-auto">
                <h3 className="text-sm font-bold">Quiz — {activeLesson.title}</h3>
                <div className="mt-4 space-y-4">
                  {activeLesson.quiz_data.map((q, qi)=> (
                    <div key={q.id} className="rounded-xl border bg-zinc-50 p-3">
                      <p className="text-sm font-semibold">Q{qi+1}. {q.question}</p>
                      <div className="mt-2 grid gap-1.5">
                        {q.options.map((opt, oi)=> (
                          <label key={oi} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-sm", quizAnswers[qi]===oi ? "bg-white border-zinc-900" : "bg-white", quizSubmitted && oi===q.correct ? "bg-emerald-50 border-emerald-500" : "")}>
                            <input type="radio" name={`q-${qi}`} checked={quizAnswers[qi]===oi} onChange={()=> setQuizAnswers((m)=> ({...m, [qi]: oi}))} />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!quizSubmitted ? (
                    <button onClick={()=> setQuizSubmitted(true)} className="rounded-full bg-[#0f172a] px-5 py-2 text-sm font-semibold text-white">Submit quiz</button>
                  ) : (
                    <div className="rounded-xl bg-emerald-500 text-white p-3 text-sm">Score: {activeLesson.quiz_data.filter((q, qi)=> quizAnswers[qi]===q.correct).length}/{activeLesson.quiz_data.length} — {(()=>{ const s = activeLesson.quiz_data!.filter((q, qi)=> quizAnswers[qi]===q.correct).length; return s === activeLesson.quiz_data!.length ? "Perfect! ✓" : "Keep practicing"; })()}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="aspect-video w-full bg-zinc-900 flex flex-col items-center justify-center text-white relative">
                <img src="https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&auto=format&fit=crop&q=80" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                 <div className="relative flex flex-col items-center gap-3">
                   <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lg"><Play size={24} strokeWidth={2.5} className="ml-0.5" /></button>
                   <p className="text-sm font-semibold">{activeLesson?.title ?? "Pick a lesson"}</p>
                   <p className="text-xs text-white/70">{activeLesson?.duration}</p>
                 </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="h-1 rounded-full bg-white/20 overflow-hidden"><div className="h-full w-[42%] bg-white" /></div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-white/80"><span>02:14 / {activeLesson?.duration}</span><span className="flex gap-2"><button className="rounded-full bg-white/15 px-2 py-1">1x</button><button className="rounded-full bg-white/15 px-2 py-1">⛶</button></span></div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2 border-b">
            {([
              ["overview", "Overview"],
              ["qna", "Q&A"],
              ["notes", "Notes"],
            ] as const).map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} className={cn("border-b-2 px-3 py-2 text-sm font-medium", tab === k ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700")}>{label}</button>
            ))}
            <button onClick={markComplete} className={cn("ml-auto mb-2 hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", active != null && completed.has(active) ? "bg-emerald-500 text-white" : "bg-white border")}>{active != null && completed.has(active) ? "✓ Completed" : "Mark complete"}</button>
          </div>

          {tab === "overview" && (
            <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold">About this lesson</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">In this lesson you’ll learn the core ideas with a calm, focused approach. Follow along, pause anytime, and build as you go. Notes are auto-saved locally.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">Calm pace</span>
                <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-semibold text-zinc-900">Hands-on</span>
                <span className="rounded-full border bg-white px-3 py-1 text-xs font-medium inline-flex items-center gap-1">Resources <ChevronDown size={12} strokeWidth={2.5} /></span>
              </div>
              <button onClick={markComplete} className="mt-4 sm:hidden w-full rounded-full bg-[#0f172a] py-2.5 text-sm font-semibold text-white">{active != null && completed.has(active) ? "✓ Completed" : "Mark complete"}</button>
            </div>
          )}
          {tab === "notes" && (
            <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold">Your notes</h3>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Take a note for this lesson…" className="mt-3 min-h-[120px] w-full rounded-xl border bg-zinc-50 p-3 text-sm outline-none focus:border-zinc-300" />
              <p className="mt-2 text-xs text-zinc-500">{note.length} characters • local only</p>
            </div>
          )}
          {tab === "qna" && (
            <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold">Q&A</h3>
              <p className="mt-2 text-sm text-zinc-500">Ask a question — the instructor or community will reply.</p>
              <div className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm"><p className="font-semibold">Maya • 2h ago</p><p className="text-zinc-600">How do I export the wireframe?</p></div>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-[72px] lg:h-[calc(100vh-84px)] lg:overflow-auto">
          <div className="overflow-hidden rounded-[20px] border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-bold">Course content</p><span className="text-xs text-zinc-500">{completed.size}/{total} • {progress}%</span>
            </div>
            <div className="p-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
            {sections.map((sec, i) => (
              <div key={sec.id} className="border-b last:border-0">
                <button onClick={() => toggleSection(i)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50">
                  <span className="text-sm font-semibold">{sec.title}</span><span className="text-xs text-zinc-500">{sec.lessons.length} • <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full", openSections.has(i) ? "bg-[#3478ff] text-white" : "bg-zinc-100")}>{openSections.has(i) ? <ChevronUp size={12} strokeWidth={2.5} /> : <ChevronDown size={12} strokeWidth={2.5} />}</span></span>
                </button>
                {openSections.has(i) && (
                  <ul>
                    {sec.lessons.map((l) => (
                      <li key={l.id}>
                        <button onClick={() => { setActive(l.id); setQuizSubmitted(false); }} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50", active === l.id && "bg-[#f6f5f1]")}>
                          <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]", completed.has(l.id) ? "bg-emerald-500 border-emerald-500 text-white" : active === l.id ? "bg-[#0f172a] border-[#0f172a] text-white" : "bg-white text-zinc-400")}>{completed.has(l.id) ? <CheckCircle2 size={12} strokeWidth={2.5} /> : l.kind === "quiz" ? "?" : <Play size={10} strokeWidth={2.5} className="ml-0.5" />}</span>
                          <span className={cn("text-sm", active === l.id ? "font-semibold text-zinc-900" : "text-zinc-700")}>{l.title}</span>
                          <span className="ml-auto flex items-center gap-1 text-xs text-zinc-500">{l.kind === "quiz" && <span className="rounded-full bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-zinc-900">Quiz</span>}{l.duration}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <div className="p-3">
              <Link to={`/courses/${courseId}`} className="block w-full rounded-full border py-2.5 text-center text-sm font-medium hover:bg-zinc-50">Back to course</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}