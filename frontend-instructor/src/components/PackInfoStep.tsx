import { builderCardClass, builderFieldClass, builderLabelClass } from "../lib/builder";
import type { PackInfoDraft } from "../types/pack";
import { ExamBoardPicker } from "./ExamBoardPicker";

type Props = {
  info: PackInfoDraft;
  onChange: (info: PackInfoDraft) => void;
};

const inputClass = builderFieldClass;

export function PackInfoStep({ info, onChange }: Props) {
  const set = (patch: Partial<PackInfoDraft>) => onChange({ ...info, ...patch });

  return (
    <div className={builderCardClass}>
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-zinc-400">
        Step 1 of 4 · Basics
      </p>
      <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900">Pack details</h2>
      <p className="mt-1.5 text-[15px] text-zinc-500">
        This is how the pack appears in the learner store.
      </p>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row">
        <div className="min-w-0 flex-1 space-y-5">
          <label className={builderLabelClass}>
            Title *
            <input
              value={info.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. 100 Aptitude Questions"
              maxLength={200}
              className={inputClass}
            />
          </label>

          <label className={builderLabelClass}>
            Description
            <textarea
              value={info.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={4}
              placeholder="Which exams and topics does this pack cover?"
              className={`${inputClass} resize-none`}
            />
          </label>

          <label className={builderLabelClass}>
            Cover image URL
            <input
              value={info.cover}
              onChange={(e) => set({ cover: e.target.value })}
              placeholder="https://…"
              inputMode="url"
              className={inputClass}
            />
          </label>
        </div>

        {info.cover.trim() && (
          <div className="shrink-0">
            <p className={builderLabelClass}>Preview</p>
            <img
              src={info.cover.trim()}
              alt="Pack cover preview"
              className="mt-1.5 h-44 w-32 rounded-2xl border border-zinc-200 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      <div className="mt-6">
        <ExamBoardPicker
          value={info.board ?? null}
          onChange={(v) => set({ board: v })}
          label="Exam board"
        />
      </div>
    </div>
  );
}
