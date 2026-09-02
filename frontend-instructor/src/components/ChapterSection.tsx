import { Check, Plus, Trash2, LESSON_KIND_BADGE, toEmbed } from "@masterlms/shared";
import { absoluteMediaUrl } from "../lib/api";
import { cn } from "../lib/utils";
import type { Chapter, Lesson, LessonKind } from "../types/courseCreate";

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
};

function QuizEditor({ lesson, onUpdate }: { lesson: Lesson; onUpdate: (patch: Partial<Lesson>) => void }) {
  const questions = lesson.quiz_data ?? [];

  const setQuestions = (next: typeof questions) => onUpdate({ quiz_data: next });

  return (
    <div className="mt-2 space-y-3">
      {questions.map((q, qi) => (
        <div key={q.id} className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500">Q{qi + 1}</span>
            <input
              value={q.question}
              onChange={(e) => setQuestions(questions.map((x, i) => i === qi ? { ...x, question: e.target.value } : x))}
              placeholder={`Question ${qi + 1}`}
              className="flex-1 rounded-lg border bg-zinc-50 px-2 py-1.5 text-xs outline-none focus:bg-white"
            />
            <button
              onClick={() => setQuestions(questions.filter((_, i) => i !== qi))}
              className="text-xs text-zinc-400 hover:text-red-500"
            >✕</button>
          </div>
          <div className="mt-2 grid gap-1.5">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <button
                  onClick={() => setQuestions(questions.map((x, i) => i === qi ? { ...x, correct: oi } : x))}
                  title="Mark as correct answer"
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${q.correct === oi ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300"}`}
                >
                  {q.correct === oi && <Check size={10} strokeWidth={3} />}
                </button>
                <input
                  value={opt}
                  onChange={(e) => {
                    const options = [...q.options];
                    options[oi] = e.target.value;
                    setQuestions(questions.map((x, i) => i === qi ? { ...x, options } : x));
                  }}
                  placeholder={`Option ${oi + 1}`}
                  className="flex-1 rounded-lg border bg-zinc-50 px-2 py-1.5 text-xs outline-none focus:bg-white"
                />
                <button
                  onClick={() => setQuestions(questions.map((x, i) => {
                    if (i !== qi) return x;
                    const options = q.options.filter((_, j) => j !== oi);
                    return { ...x, options, correct: q.correct >= oi && q.correct > 0 ? q.correct - 1 : q.correct };
                  }))}
                  className="text-xs text-zinc-400 hover:text-red-500"
                >✕</button>
              </div>
            ))}
            <button
              onClick={() => setQuestions(questions.map((x, i) => i === qi ? { ...x, options: [...x.options, ""] } : x))}
              className="rounded-lg border bg-white py-1 text-xs"
            >+ Option</button>
          </div>
        </div>
      ))}
      <button
        onClick={() => setQuestions([...questions, { id: `q${Date.now()}`, question: "", options: ["", ""], correct: 0 }])}
        className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 text-xs font-semibold hover:bg-zinc-50"
      >+ Add question</button>
    </div>
  );
}

function LessonEditor({ lesson, onUpdate, uploading, onUpload }: {
  lesson: Lesson;
  onUpdate: (patch: Partial<Lesson>) => void;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  switch (lesson.kind) {
    case "text":
      return (
        <>
          <textarea
            value={lesson.resource_url}
            onChange={(e) => onUpdate({ resource_url: e.target.value })}
            placeholder="Write lesson in markdown…"
            rows={4}
            className="mt-2 w-full rounded-lg border bg-zinc-50 p-2 text-xs font-mono outline-none focus:bg-white"
          />
          {lesson.resource_url && (
            <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-3 text-xs leading-relaxed whitespace-pre-wrap">
              {lesson.resource_url.slice(0, 400)}
            </div>
          )}
        </>
      );
    case "quiz":
      return <QuizEditor lesson={lesson} onUpdate={onUpdate} />;
    case "video": {
      const isEmbedCode = /^<iframe/i.test(lesson.resource_url.trim());
      const embedUrl = toEmbed(lesson.resource_url) ?? (
        lesson.resource_url.match(/\.(mp4|webm|mov)(\?|$)/) ? absoluteMediaUrl(lesson.resource_url) : null
      );
      return (
        <>
          <div className="mt-2 flex rounded-lg border border-zinc-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => { if (isEmbedCode) onUpdate({ resource_url: "" }); }}
              className={cn("flex-1 rounded-md py-1 text-xs font-semibold transition-colors", !isEmbedCode ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900")}
            >YouTube URL</button>
            <button
              type="button"
              onClick={() => { if (!isEmbedCode && lesson.resource_url) onUpdate({ resource_url: "" }); }}
              className={cn("flex-1 rounded-md py-1 text-xs font-semibold transition-colors", isEmbedCode ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900")}
            >Embed code</button>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_90px]">
            <div className="flex min-w-0 gap-1.5">
              <input
                value={lesson.resource_url}
                onChange={(e) => onUpdate({ resource_url: e.target.value })}
                placeholder={isEmbedCode ? '<iframe src="https://www.youtube.com/embed/…" …></iframe>' : "https://youtu.be/… or youtube.com/watch?v=…"}
                className="min-w-0 flex-1 rounded-lg border bg-zinc-50 px-2 py-1.5 text-xs outline-none focus:bg-white"
              />
              <label className="shrink-0 cursor-pointer rounded-lg bg-[#0f172a] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-black">
                {uploading ? "Uploading…" : "Upload"}
                <input type="file" className="hidden" onChange={(e) => onUpload(e.target.files?.[0] ?? new File([], ""))} />
              </label>
            </div>
            <input
              value={lesson.duration}
              onChange={(e) => onUpdate({ duration: e.target.value })}
              placeholder="05:00"
              className="rounded-lg border bg-zinc-50 px-2 py-1.5 text-xs outline-none focus:bg-white"
            />
          </div>
          <p className="mt-1 text-[10px] text-zinc-400">
            {isEmbedCode ? "Paste a YouTube/Vimeo/Loom <iframe> embed code." : "Paste a YouTube, Vimeo or Loom share URL, or upload an mp4."}
          </p>
          {lesson.resource_url && embedUrl ? (
            <div className="mt-2 overflow-hidden rounded-xl border">
              {/\.(mp4|webm|mov)(\?|$)/.test(embedUrl) ? (
                <video src={embedUrl} controls className="h-32 w-full bg-black object-contain" />
              ) : (
                <iframe src={embedUrl} title={lesson.title} className="h-32 w-full" allowFullScreen />
              )}
            </div>
          ) : null}
        </>
      );
    }
    default:
      return (
        <>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_90px]">
            <div className="flex min-w-0 gap-1.5">
              <input
                value={lesson.resource_url}
                onChange={(e) => onUpdate({ resource_url: e.target.value })}
                placeholder={lesson.kind === "link" ? "https://external.com" : `https://… ${KIND_LABEL[lesson.kind]}`}
                className="min-w-0 flex-1 rounded-lg border bg-zinc-50 px-2 py-1.5 text-xs outline-none focus:bg-white"
              />
              {(lesson.kind === "pdf" || lesson.kind === "audio") && (
                <label className="shrink-0 cursor-pointer rounded-lg bg-[#0f172a] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-black">
                  {uploading ? "Uploading…" : "Upload"}
                  <input type="file" className="hidden" onChange={(e) => onUpload(e.target.files?.[0] ?? new File([], ""))} />
                </label>
              )}
            </div>
            <input
              value={lesson.duration}
              onChange={(e) => onUpdate({ duration: e.target.value })}
              placeholder="05:00"
              className="rounded-lg border bg-zinc-50 px-2 py-1.5 text-xs outline-none focus:bg-white"
            />
          </div>
          {(lesson.kind === "pdf" || lesson.kind === "audio") && lesson.resource_url && (
            <div className="mt-2 truncate rounded-lg border bg-zinc-50 px-2 py-1.5 text-xs">{lesson.resource_url}</div>
          )}
        </>
      );
  }
}

export function ChapterSection({ chapter, uploadingId, onRename, onDelete, onAddLesson, onUpdateLesson, onDeleteLesson, onUploadLesson }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 cursor-move select-none text-zinc-300">⠿</span>
          <input
            value={chapter.title}
            onChange={(e) => onRename(e.target.value)}
            placeholder="Chapter title"
            className="w-full bg-transparent text-sm font-bold outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">{chapter.lessons.length} lesson{chapter.lessons.length === 1 ? "" : "s"}</span>
          <button onClick={onDelete} className="flex h-6 w-6 items-center justify-center rounded-full border bg-white text-xs hover:text-red-500">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {chapter.lessons.map((l) => {
          const meta = LESSON_KIND_BADGE[l.kind];
          const Icon = meta.Icon;
          return (
            <li key={l.id} className="rounded-xl border border-zinc-200 bg-white p-3">
              <div className="flex items-start gap-2">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${meta.badge}`}>
                  <Icon size={14} strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      value={l.title}
                      onChange={(e) => onUpdateLesson(l.id, { title: e.target.value })}
                      className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
                    />
                    <select
                      value={l.kind}
                      onChange={(e) => onUpdateLesson(l.id, { kind: e.target.value as LessonKind })}
                      className="rounded-full border bg-zinc-50 px-2 py-1 text-xs"
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
                  />
                </div>
                <button onClick={() => onDeleteLesson(l.id)} className="text-xs text-zinc-400 hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        onClick={onAddLesson}
        className="mt-3 w-full rounded-full border border-zinc-200 bg-white py-2 text-xs font-semibold hover:bg-zinc-100"
      >
        <span className="inline-flex items-center gap-1"><Plus size={13} /> Add lesson</span>
      </button>
    </div>
  );
}