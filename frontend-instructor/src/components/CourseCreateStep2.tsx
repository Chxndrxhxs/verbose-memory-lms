import { Plus, Sparkles } from "@masterlms/shared";
import { ChapterSection } from "./ChapterSection";
import { CoverPhotoUpload } from "./CoverPhotoUpload";
import { builderCardClass } from "../lib/builder";
import { cn } from "../lib/utils";
import type { Chapter, Lesson } from "../types/courseCreate";

type Props = {
  coverImage: string;
  chapters: Chapter[];
  uploadingId: string | null;
  onCoverChange: (url: string) => void;
  onRenameChapter: (chapterId: string, title: string) => void;
  onDeleteChapter: (chapterId: string) => void;
  onAddChapter: () => void;
  onFirstManual: () => void;
  onAiGenerate: () => void;
  onAddLesson: (chapterId: string) => void;
  onUpdateLesson: (chapterId: string, lessonId: string, patch: Partial<Lesson>) => void;
  onDeleteLesson: (chapterId: string, lessonId: string) => void;
  onUploadLesson: (chapterId: string, lessonId: string, file: File) => void;
  onUploadQuizMedia: (file: File) => Promise<string>;
};

export function CourseCreateStep2(props: Props) {
  const {
    coverImage,
    chapters,
    uploadingId,
    onCoverChange,
    onRenameChapter,
    onDeleteChapter,
    onAddChapter,
    onFirstManual,
    onAiGenerate,
    onAddLesson,
    onUpdateLesson,
    onDeleteLesson,
    onUploadLesson,
    onUploadQuizMedia,
  } = props;

  const empty = chapters.length === 0;

  const chapterProps = (ch: Chapter) => ({
    chapter: ch,
    uploadingId,
    onRename: (t: string) => onRenameChapter(ch.id, t),
    onDelete: () => onDeleteChapter(ch.id),
    onAddLesson: () => onAddLesson(ch.id),
    onUpdateLesson: (lid: string, patch: Partial<Lesson>) => onUpdateLesson(ch.id, lid, patch),
    onDeleteLesson: (lid: string) => onDeleteLesson(ch.id, lid),
    onUploadLesson: (lid: string, file: File) => onUploadLesson(ch.id, lid, file),
    onUploadQuizMedia,
  });

  return (
    <div className={cn("mt-6", empty && "grid gap-6 lg:grid-cols-[1fr_340px]")}>
      <div className="space-y-6 min-w-0">
            <div className={builderCardClass}>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">Course cover</h2>
              <p className="mt-1.5 text-[15px] text-zinc-500">The first thing learners see on the course card.</p>
              <div className="mt-5">
                <CoverPhotoUpload value={coverImage} onChange={onCoverChange} />
              </div>
            </div>

            <div className={builderCardClass}>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">Course content</h2>
              <p className="mt-1.5 text-[15px] text-zinc-500">Build chapters first, then add lessons inside each chapter.</p>
              <div className="mt-6 space-y-4">
                {chapters.map((ch) => (
                  <ChapterSection key={ch.id} {...chapterProps(ch)} />
                ))}
              </div>
              <button
                onClick={onAddChapter}
                className="mt-5 flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-zinc-300 bg-white text-[15px] font-semibold text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
              >
                <Plus size={16} /> Add new chapter
              </button>
            </div>
          </div>

      {/* The onboarding sidebar only helps before the first chapter exists —
          once there is content the builder gets the full width. */}
      {empty && (
        <div className="mt-6 space-y-5 lg:sticky lg:top-[76px] lg:mt-0">
          <div className={`${builderCardClass} !border-0 !bg-[#eef1ff] !shadow-none`}>
            <p className="text-[15px] font-bold text-zinc-900">Add content to your course</p>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
              Add chapters, edit names, and make changes to your content quickly and easily.
            </p>
            <button
              onClick={onAiGenerate}
              disabled
              title="AI outlines are coming soon — add chapters manually for now"
              className="mt-5 flex h-12 w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#4490ff] to-[#0620a7] text-[15px] font-bold text-white opacity-70"
            >
              <span className="inline-flex items-center gap-1.5"><Sparkles size={16} /> AI outline · Soon</span>
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-zinc-400">
            <span className="h-px flex-1 bg-zinc-200" /> OR <span className="h-px flex-1 bg-zinc-200" />
          </div>
          <div className={builderCardClass}>
            <p className="text-[15px] font-bold text-zinc-900">Add first chapter manually</p>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
              Use <b>Headings</b> for the chapter title and add lessons' content inside.
            </p>
            <button
              onClick={onFirstManual}
              className="mt-5 h-12 w-full rounded-full border border-zinc-200 text-[15px] font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Add manually
            </button>
</div>
          </div>
      )}
    </div>
  );
}