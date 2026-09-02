import { Link } from "react-router-dom";
import { Plus, Sparkles } from "@masterlms/shared";
import { ChapterSection } from "./ChapterSection";
import { CoverPhotoUpload } from "./CoverPhotoUpload";
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
  });

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4 min-w-0">
            <div className="rounded-[20px] bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-zinc-900">Course cover</h2>
              <p className="mt-0.5 text-xs text-zinc-500">The first thing learners see on the course card.</p>
              <div className="mt-3">
                <CoverPhotoUpload value={coverImage} onChange={onCoverChange} />
              </div>
            </div>

            <div className="rounded-[20px] bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-zinc-900">Course content</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Build chapters first, then add lessons inside each chapter.</p>
              <div className="mt-4 space-y-3">
                {chapters.map((ch) => (
                  <ChapterSection key={ch.id} {...chapterProps(ch)} />
                ))}
              </div>
              <button
                onClick={onAddChapter}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-300 bg-white py-3 text-sm font-semibold text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
              >
                <Plus size={15} /> Add new chapter
              </button>
            </div>
          </div>

          <div className="h-fit space-y-4 lg:sticky lg:top-[76px]">
            {empty ? (
              <>
                <div className="rounded-[20px] bg-[#eef1ff] p-5">
                  <span className="inline-block rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-[#152561]">NEW</span>
                  <p className="mt-2 text-sm font-semibold text-zinc-900">Now easily add content to your courses</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                    Add chapters, edit names, and make changes to your content quickly and easily.
                  </p>
                  <button
                    onClick={onAiGenerate}
                    className="mt-4 w-full rounded-full bg-gradient-to-r from-[#4490ff] to-[#0620a7] py-2.5 text-sm font-bold text-white hover:opacity-90"
                  >
                    <span className="inline-flex items-center gap-1.5"><Sparkles size={15} /> Generate outline using AI</span>
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-zinc-400">
                  <span className="h-px flex-1 bg-zinc-200" /> OR <span className="h-px flex-1 bg-zinc-200" />
                </div>
                <div className="rounded-[20px] bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-zinc-900">Add first chapter manually</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                    Use <b>Headings</b> for the chapter title and add lessons' content inside.
                  </p>
                  <button
                    onClick={onFirstManual}
                    className="mt-4 w-full rounded-full border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    Add manually
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-[20px] bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-zinc-900">Quick tips</p>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-zinc-600">
                  <li>• Drag lessons to reorder inside a chapter.</li>
                  <li>• Every lesson type renders differently for students.</li>
                  <li>• Use <b>+ Add chapter</b> to structure your course.</li>
                  <li>• Save before previewing so students see the latest.</li>
                </ul>
                <Link to="/courses" className="mt-4 block text-center text-xs font-semibold text-zinc-500 hover:text-zinc-900">
                  ← Back to all courses
                </Link>
              </div>
            )}
      </div>
    </div>
  );
}