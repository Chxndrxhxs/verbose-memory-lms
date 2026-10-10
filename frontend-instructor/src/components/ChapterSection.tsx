import {
  AlignLeft,
  Check,
  HelpCircle,
  ImageIcon,
  Plus,
  Trash2,
  Upload,
  Video,
  X,
  LESSON_KIND_BADGE,
  quizOption,
  toEmbed,
  type LucideIcon,
} from "@masterlms/shared";
import { useRef, useState } from "react";
import { absoluteMediaUrl } from "../lib/api";
import { cn } from "../lib/utils";
import type { Chapter, Lesson, LessonKind, QuizQ, QuizQuestionType } from "../types/courseCreate";

const KIND_LABEL: Record<LessonKind, string> = {
  video: "Video",
  pdf: "PDF",
  quiz: "Quiz",
  link: "Link",
  audio: "Audio",
  text: "Text",
};

type Props = {
  chapter: Chapter;
  uploadingId: string | null;
  onRename: (title: string) => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onUpdateLesson: (lessonId: string, patch: Partial<Lesson>) => void;
  onDeleteLesson: (lessonId: string) => void;
  onUploadLesson: (lessonId: string, file: File) => void;
  onUploadQuizMedia: (file: File) => Promise<string>;
  fetchVideoTitle: (url: string) => Promise<string | null>;
};

const QUIZ_TYPES: { value: QuizQuestionType; label: string; Icon: LucideIcon }[] = [
  { value: "text", label: "Text", Icon: AlignLeft },
  { value: "image", label: "Image", Icon: ImageIcon },
  { value: "video", label: "Video", Icon: Video },
  { value: "qa", label: "Q&A", Icon: HelpCircle },
];

function newQuestion(): QuizQ {
  return {
    id: `q${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: "text",
    question: "",
    options: ["", ""],
    correct: 0,
  };
}

const OPTION_TYPES: { value: "text" | "image" | "video"; label: string; Icon: LucideIcon }[] = [
  { value: "text", label: "Text", Icon: AlignLeft },
  { value: "image", label: "Image", Icon: ImageIcon },
  { value: "video", label: "Video", Icon: Video },
];

function newOption(): QuizQ["options"][number] {
  return { type: "text", text: "" };
}

function UploadMediaButton({ accept, uploading, onFile }: {
  accept: string;
  uploading: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label className={cn("shrink-0 cursor-pointer rounded-sm border border-rule bg-slate-panel px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-slate-sunk", uploading && "opacity-60")}>
      {uploading ? (
        "Uploading…"
      ) : (
        <span className="inline-flex items-center gap-1"><Upload size={11} /> Upload</span>
      )}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function mediaEmbed(url: string) {
  const raw = (url ?? "").trim();
  if (/^<iframe/i.test(raw)) return raw;
  return (
    toEmbed(raw) ??
    (raw.match(/\.(mp4|webm|mov)(\?|$)/) ? absoluteMediaUrl(raw) : null)
  );
}

function QuizEditor({ lesson, onUpdate, onUploadMedia }: {
  lesson: Lesson;
  onUpdate: (patch: Partial<Lesson>) => void;
  onUploadMedia: (file: File) => Promise<string>;
}) {
  const questions = lesson.quiz_data ?? [];
  const [busy, setBusy] = useState<string | null>(null);

  const setQuestions = (next: QuizQ[]) => onUpdate({ quiz_data: next });
  const patch = (qi: number, p: Partial<QuizQ>) =>
    setQuestions(questions.map((x, i) => (i === qi ? { ...x, ...p } : x)));

  const uploadMedia = async (file: File, key: string, apply: (url: string) => void) => {
    if (busy) return;
    setBusy(key);
    try {
      apply(await onUploadMedia(file));
    } catch {
      alert("Upload failed — try again");
    } finally {
      setBusy(null);
    }
  };

  const setType = (qi: number, type: QuizQuestionType) =>
    setQuestions(
      questions.map((x, i) => {
        if (i !== qi) return x;
        if (type === "qa") {
          return {
            ...x,
            type,
            options: [],
            answer: x.answer ?? quizOption(x.options[x.correct]).text,
          };
        }
        const options = x.options.length ? x.options : ["", ""];
        return {
          ...x,
          type,
          options,
          correct: Math.max(0, Math.min(x.correct, options.length - 1)),
        };
      })
    );

  return (
    <div className="mt-2 space-y-3">
      {questions.map((q, qi) => {
        const qtype = q.type ?? "text";
        const embed = q.media_url ? mediaEmbed(q.media_url) : null;
        const isVideo = /\.(mp4|webm|mov)(\?|$)/.test(embed ?? "") || /^<iframe/i.test((q.media_url ?? "").trim());
        return (
          <div key={q.id} className="border border-rule bg-slate-panel p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-ink-faint tnum">Q{qi + 1}</span>
              <input
                value={q.question}
                onChange={(e) => patch(qi, { question: e.target.value })}
                placeholder={`Question ${qi + 1}`}
                className="min-w-0 flex-1 rounded-sm border border-rule bg-slate-sunk px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:bg-slate-panel"
              />
              <div className="flex rounded-sm border border-rule bg-slate-sunk p-0.5">
                {QUIZ_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(qi, t.value)}
                    className={cn(
                      "flex items-center gap-1 rounded-sm px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors",
                      qtype === t.value ? "bg-slate-panel text-ink" : "text-ink-faint hover:text-ink"
                    )}
                  >
                    <t.Icon size={11} strokeWidth={2.5} />
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setQuestions(questions.filter((_, i) => i !== qi))}
                className="text-xs text-ink-faint hover:text-halt"
              ><X size={13} aria-hidden /></button>
            </div>

            {qtype === "image" && (
              <div className="mt-2">
                <div className="flex gap-2">
                  <input
                    value={q.media_url ?? ""}
                    onChange={(e) => patch(qi, { media_url: e.target.value })}
                    placeholder="Image URL (or upload a file)"
                    className="min-w-0 flex-1 rounded-sm border border-rule bg-slate-sunk px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:bg-slate-panel"
                  />
                  <UploadMediaButton
                    accept="image/*"
                    uploading={busy === `q${qi}-media`}
                    onFile={(f) => uploadMedia(f, `q${qi}-media`, (url) => patch(qi, { media_url: url }))}
                  />
                </div>
                {q.media_url ? (
                  <img
                    src={absoluteMediaUrl(q.media_url) ?? q.media_url}
                    alt=""
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    className="mt-2 max-h-40 w-full rounded-sm border border-rule bg-slate-sunk object-contain"
                  />
                ) : null}
              </div>
            )}

            {qtype === "video" && (
              <div className="mt-2">
                <div className="flex gap-2">
                  <input
                    value={q.media_url ?? ""}
                    onChange={(e) => patch(qi, { media_url: e.target.value })}
                    placeholder="https://youtu.be/… or upload an mp4"
                    className="min-w-0 flex-1 rounded-sm border border-rule bg-slate-sunk px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:bg-slate-panel"
                  />
                  <UploadMediaButton
                    accept="video/*"
                    uploading={busy === `q${qi}-media`}
                    onFile={(f) => uploadMedia(f, `q${qi}-media`, (url) => patch(qi, { media_url: url }))}
                  />
                </div>
                {q.media_url && embed ? (
                  <div className="mt-2 overflow-hidden rounded-sm border border-rule bg-slate-sunk">
                    {isVideo ? (
                      <video src={embed} controls className="max-h-40 w-full object-contain" />
                    ) : (
                      <iframe src={embed} title="Question media" className="aspect-video w-full" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {qtype === "qa" ? (
              <div className="mt-2">
                <input
                  value={q.prompt ?? ""}
                  onChange={(e) => patch(qi, { prompt: e.target.value })}
                  placeholder="Instruction (optional), e.g. “Type the output of the command”"
                  className="w-full rounded-sm border border-rule bg-slate-sunk px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:bg-slate-panel"
                />
                <label className="mt-2 flex items-center gap-2 rounded-sm border border-rule bg-slate-sunk px-3 py-2">
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Answer</span>
                  <input
                    value={q.answer ?? ""}
                    onChange={(e) => patch(qi, { answer: e.target.value })}
                    placeholder="Expected answer learners type in"
                    className="min-w-0 flex-1 bg-transparent text-xs text-ink placeholder:text-ink-faint"
                  />
                </label>
                <p className="mt-1 text-[10px] text-ink-faint">
                  Checked loosely — the learner’s typed answer is compared case-insensitively.
                </p>
              </div>
            ) : (
              <div className="mt-2 grid gap-2">
                {q.options.map((optEntry, oi) => {
                  const opt = quizOption(optEntry);
                  const oEmbed = opt.media_url ? mediaEmbed(opt.media_url) : null;
                  const oIsVideo = /\.(mp4|webm|mov)(\?|$)/.test(oEmbed ?? "") || /^<iframe/i.test((opt.media_url ?? "").trim());
                  const patchOption = (p: { type?: "text" | "image" | "video"; text?: string; media_url?: string }) => {
                    const options = [...q.options];
                    options[oi] = { ...opt, ...p };
                    patch(qi, { options });
                  };
                  return (
                    <div key={oi} className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => patch(qi, { correct: oi })}
                        title="Mark as correct answer"
                        className={cn("mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", q.correct === oi ? "border-live bg-live text-ink-inverse" : "border-rule-strong")}
                      >
                        {q.correct === oi && <Check size={10} strokeWidth={3} />}
                      </button>
                      <div className="flex-1 rounded-sm border border-rule bg-slate-sunk px-3 py-2">
                        <div className="flex items-center gap-1">
                          <div className="flex rounded-sm border border-rule bg-slate-panel p-0.5">
                            {OPTION_TYPES.map((t) => (
                              <button
                                key={t.value}
                                type="button"
                                onClick={() => patchOption({ type: t.value, media_url: t.value === "text" ? undefined : opt.media_url })}
                                title={t.label}
                                className={cn("rounded-sm p-1 transition-colors", opt.type === t.value ? "bg-ink text-ink-inverse" : "text-ink-faint hover:text-ink-muted")}
                              >
                                <t.Icon size={12} strokeWidth={2.5} />
                              </button>
                            ))}
                          </div>
                          {opt.type !== "text" && (
                            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                              {opt.type === "image" ? "Image option" : "Video option"}
                            </span>
                          )}
                        </div>
                        <input
                          value={opt.text}
                          onChange={(e) => patchOption({ text: e.target.value })}
                          placeholder={opt.type === "text" ? `Option ${oi + 1}` : "Label (optional, shown under media)"}
                          className="mt-1 w-full bg-transparent text-xs text-ink placeholder:text-ink-faint"
                        />
                        {opt.type === "image" && (
                          <>
                            <div className="mt-1 flex gap-2">
                              <input
                                value={opt.media_url ?? ""}
                                onChange={(e) => patchOption({ media_url: e.target.value })}
                                placeholder="Image URL (or upload a file)"
                                className="min-w-0 flex-1 rounded-sm border border-rule bg-slate-panel px-2 py-1 text-xs text-ink placeholder:text-ink-faint focus:border-ink"
                              />
                              <UploadMediaButton
                                accept="image/*"
                                uploading={busy === `o${qi}-${oi}-media`}
                                onFile={(f) => uploadMedia(f, `o${qi}-${oi}-media`, (url) => patchOption({ media_url: url }))}
                              />
                            </div>
                            {opt.media_url ? (
                              <img
                                src={absoluteMediaUrl(opt.media_url) ?? opt.media_url}
                                alt=""
                                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                                className="mt-1 max-h-24 w-full rounded-sm border border-rule bg-slate-sunk object-contain"
                              />
                            ) : null}
                          </>
                        )}
                        {opt.type === "video" && (
                          <>
                            <div className="mt-1 flex gap-2">
                              <input
                                value={opt.media_url ?? ""}
                                onChange={(e) => patchOption({ media_url: e.target.value })}
                                placeholder="https://youtu.be/… or upload mp4"
                                className="min-w-0 flex-1 rounded-sm border border-rule bg-slate-panel px-2 py-1 text-xs text-ink placeholder:text-ink-faint focus:border-ink"
                              />
                              <UploadMediaButton
                                accept="video/*"
                                uploading={busy === `o${qi}-${oi}-media`}
                                onFile={(f) => uploadMedia(f, `o${qi}-${oi}-media`, (url) => patchOption({ media_url: url }))}
                              />
                            </div>
                            {opt.media_url && oEmbed ? (
                              <div className="mt-1 overflow-hidden rounded-sm border border-rule bg-slate-sunk">
                                {oIsVideo ? (
                                  <video src={oEmbed} controls className="max-h-24 w-full object-contain" />
                                ) : (
                                  <iframe src={oEmbed} title={`Option ${oi + 1} media`} className="aspect-video w-full" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                                )}
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setQuestions(
                            questions.map((x, i) => {
                              if (i !== qi) return x;
                              const options = x.options.filter((_, j) => j !== oi);
                              let correct = x.correct;
                              if (oi < correct) correct -= 1;
                              if (oi === correct) correct = 0;
                              correct = Math.max(0, Math.min(correct, Math.max(options.length - 1, 0)));
                              return { ...x, options, correct };
                            })
                          )
                        }
                        className="mt-1 text-xs text-ink-faint hover:text-halt"
                      ><X size={13} aria-hidden /></button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => patch(qi, { options: [...q.options, newOption()] })}
                  className="rounded-sm border border-rule bg-slate-panel py-1 text-xs text-ink-muted hover:bg-slate-sunk"
                >+ Option</button>
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => setQuestions([...questions, newQuestion()])}
        className="w-full rounded-sm border border-rule bg-slate-panel py-2 text-xs font-semibold text-ink hover:bg-slate-sunk"
      >+ Add question</button>
    </div>
  );
}

function LessonEditor({ lesson, onUpdate, uploading, onUpload, onUploadMedia, fetchVideoTitle }: {
  lesson: Lesson;
  onUpdate: (patch: Partial<Lesson>) => void;
  uploading: boolean;
  onUpload: (file: File) => void;
  onUploadMedia: (file: File) => Promise<string>;
  fetchVideoTitle: (url: string) => Promise<string | null>;
}) {
  // Out-of-order guard: only the latest blur's response may fill the title.
  const autoTitleReq = useRef(0);
  // RAM-58: the source mode is explicit state. Deriving it from the field
  // content meant the Embed code tab never highlighted until an <iframe>
  // string was pasted — clicking the tab was a no-op.
  const [videoMode, setVideoMode] = useState<"url" | "embed">(() =>
    /^<iframe/i.test(lesson.resource_url.trim()) ? "embed" : "url"
  );
  switch (lesson.kind) {
    case "text":
      return (
        <>
          <textarea
            value={lesson.resource_url}
            onChange={(e) => onUpdate({ resource_url: e.target.value })}
            placeholder="Write lesson in markdown…"
            rows={4}
            className="mt-2 w-full rounded-sm border border-rule bg-slate-sunk p-3 text-xs font-mono text-ink placeholder:text-ink-faint focus:border-ink focus:bg-slate-panel"
          />
          {lesson.resource_url && (
            <div className="mt-2 border border-rule bg-slate-panel p-3 text-xs leading-relaxed whitespace-pre-wrap text-ink">
              {lesson.resource_url.slice(0, 400)}
            </div>
          )}
        </>
      );
    case "quiz":
      return <QuizEditor lesson={lesson} onUpdate={onUpdate} onUploadMedia={onUploadMedia} />;
    case "video": {
      const embedUrl = toEmbed(lesson.resource_url) ?? (
        lesson.resource_url.match(/\.(mp4|webm|mov)(\?|$)/) ? absoluteMediaUrl(lesson.resource_url) : null
      );
      return (
        <>
          <div className="mt-2 flex rounded-sm border border-rule bg-slate-sunk p-0.5">
            <button
              type="button"
              onClick={() => {
                setVideoMode("url");
                if (/^<iframe/i.test(lesson.resource_url.trim())) onUpdate({ resource_url: "" });
              }}
              className={cn("flex-1 rounded-sm py-1 text-xs font-semibold transition-colors", videoMode === "url" ? "bg-ink text-ink-inverse" : "text-ink-muted hover:text-ink")}
            >YouTube URL</button>
            <button
              type="button"
              onClick={() => {
                setVideoMode("embed");
                if (lesson.resource_url && !/^<iframe/i.test(lesson.resource_url.trim())) onUpdate({ resource_url: "" });
              }}
              className={cn("flex-1 rounded-sm py-1 text-xs font-semibold transition-colors", videoMode === "embed" ? "bg-ink text-ink-inverse" : "text-ink-muted hover:text-ink")}
            >Embed code</button>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_96px]">
            <div className="flex min-w-0 gap-2">
              <input
                value={lesson.resource_url}
                onChange={(e) => onUpdate({ resource_url: e.target.value })}
                onBlur={() => {
                  if (lesson.title !== `New video`) return;
                  const seq = ++autoTitleReq.current;
                  void fetchVideoTitle(lesson.resource_url).then((t) => {
                    if (t && seq === autoTitleReq.current) onUpdate({ title: t });
                  });
                }}
                placeholder={videoMode === "embed" ? '<iframe src="https://www.youtube.com/embed/…" …></iframe>' : "https://youtu.be/… or youtube.com/watch?v=…"}
                className="min-w-0 flex-1 rounded-sm border border-rule bg-slate-sunk px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:bg-slate-panel"
              />
              <label className="shrink-0 cursor-pointer rounded-sm bg-ink px-3 py-1.5 text-xs font-semibold text-ink-inverse hover:bg-ink/88">
                {uploading ? "Uploading…" : "Upload"}
                <input type="file" className="hidden" onChange={(e) => onUpload(e.target.files?.[0] ?? new File([], ""))} />
              </label>
            </div>
            <input
              value={lesson.duration}
              onChange={(e) => onUpdate({ duration: e.target.value })}
              placeholder="05:00"
              className="rounded-sm border border-rule bg-slate-sunk px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:bg-slate-panel tnum"
            />
          </div>
          <p className="mt-1 text-[10px] text-ink-faint">
            {videoMode === "embed" ? "Paste a YouTube/Vimeo/Loom <iframe> embed code." : "Paste a YouTube, Vimeo or Loom share URL, or upload an mp4."}
          </p>
          {lesson.resource_url && embedUrl ? (
            <div className="mt-2 flex aspect-[16/9] max-h-[440px] flex-col overflow-hidden border border-rule">
              {/\.(mp4|webm|mov)(\?|$)/.test(embedUrl) ? (
                <video src={embedUrl} controls className="h-full w-full bg-ink object-contain" />
              ) : (
                <iframe src={embedUrl} title={lesson.title} className="h-full w-full" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
              )}
            </div>
          ) : null}
        </>
      );
    }
    default:
      return (
        <>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_96px]">
            <div className="flex min-w-0 gap-2">
              <input
                value={lesson.resource_url}
                onChange={(e) => onUpdate({ resource_url: e.target.value })}
                placeholder={lesson.kind === "link" ? "https://external.com" : `https://… ${KIND_LABEL[lesson.kind]}`}
                className="min-w-0 flex-1 rounded-sm border border-rule bg-slate-sunk px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:bg-slate-panel"
              />
              {(lesson.kind === "pdf" || lesson.kind === "audio") && (
                <label className="shrink-0 cursor-pointer rounded-sm bg-ink px-3 py-1.5 text-xs font-semibold text-ink-inverse hover:bg-ink/88">
                  {uploading ? "Uploading…" : "Upload"}
                  <input type="file" className="hidden" onChange={(e) => onUpload(e.target.files?.[0] ?? new File([], ""))} />
                </label>
              )}
            </div>
            <input
              value={lesson.duration}
              onChange={(e) => onUpdate({ duration: e.target.value })}
              placeholder="05:00"
              className="rounded-sm border border-rule bg-slate-sunk px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:bg-slate-panel tnum"
            />
          </div>
          {lesson.kind === "audio" && lesson.resource_url && (
            <audio
              src={lesson.resource_url}
              controls
              className="mt-2 w-full"
            />
          )}
        </>
      );
  }
}

export function ChapterSection({ chapter, uploadingId, onRename, onDelete, onAddLesson, onUpdateLesson, onDeleteLesson, onUploadLesson, onUploadQuizMedia, fetchVideoTitle }: Props) {
  return (
    <div className="border border-rule bg-slate-sunk p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 cursor-move select-none text-ink-faint">⠿</span>
          <input
            value={chapter.title}
            onChange={(e) => onRename(e.target.value)}
            placeholder="Chapter title"
            className="w-full bg-transparent text-sm font-semibold text-ink placeholder:text-ink-faint"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-faint tnum">{chapter.lessons.length} lesson{chapter.lessons.length === 1 ? "" : "s"}</span>
          <button type="button" onClick={onDelete} className="flex h-6 w-6 items-center justify-center rounded-full border border-rule bg-slate-panel text-xs text-ink-muted hover:text-halt">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {chapter.lessons.map((l) => {
          const meta = LESSON_KIND_BADGE[l.kind];
          const Icon = meta.Icon;
          return (
            <li key={l.id} className="border border-rule bg-slate-panel p-4 sm:p-5">
              <div className="flex items-start gap-2">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${meta.badge}`}>
                  <Icon size={14} strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      value={l.title}
                      onChange={(e) => onUpdateLesson(l.id, { title: e.target.value })}
                      className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink"
                    />
                    <select
                      value={l.kind}
                      onChange={(e) => onUpdateLesson(l.id, { kind: e.target.value as LessonKind })}
                      className="rounded-sm border border-rule bg-slate-sunk px-3 py-2 text-xs text-ink"
                    >
                      {(Object.keys(KIND_LABEL) as LessonKind[]).map((k) => (
                        <option key={k} value={k}>{KIND_LABEL[k]}</option>
                      ))}
                    </select>
                  </div>
                  <LessonEditor
                    lesson={l}
                    onUpdate={(patch) => onUpdateLesson(l.id, patch)}
                    uploading={uploadingId === l.id}
                    onUpload={(file) => onUploadLesson(l.id, file)}
                    onUploadMedia={onUploadQuizMedia}
                    fetchVideoTitle={fetchVideoTitle}
                  />
                </div>
                <button type="button" onClick={() => onDeleteLesson(l.id)} className="text-xs text-ink-faint hover:text-halt">
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onAddLesson}
        className="mt-4 h-12 w-full rounded-sm border border-rule bg-slate-panel text-sm font-semibold text-ink hover:bg-slate-sunk"
      >
        <span className="inline-flex items-center gap-2"><Plus size={14} /> Add lesson</span>
      </button>
    </div>
  );
}