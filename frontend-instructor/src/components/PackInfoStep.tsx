import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAssignmentCategories } from "@masterlms/shared";
import { builderCardClass, builderFieldClass, builderLabelClass } from "../lib/builder";
import type { PackInfoDraft } from "../types/pack";

type Props = {
  info: PackInfoDraft;
  onChange: (info: PackInfoDraft) => void;
};

const inputClass = builderFieldClass;

export function PackInfoStep({ info, onChange }: Props) {
  const set = (patch: Partial<PackInfoDraft>) => onChange({ ...info, ...patch });
  const categoriesQuery = useQuery({
    queryKey: ["assignment-categories"],
    queryFn: getAssignmentCategories,
  });
  const categories = categoriesQuery.data ?? [];

  // Find the chain containing the saved inter_category so editing an existing
  // pack (or data arriving after first render) shows the right values. The
  // list is tiny, so this just runs during render. Local picks override the
  // saved chain while the user is interacting.
  let savedCategory: number | null = null;
  let savedSub: number | null = null;
  for (const c of categories) {
    for (const s of c.subcategories) {
      if (s.intercategories.some((i) => i.id === info.inter_category)) {
        savedCategory = c.id;
        savedSub = s.id;
      }
    }
  }

  const [pickedCategory, setPickedCategory] = useState<number | null | undefined>();
  const [pickedSub, setPickedSub] = useState<number | null | undefined>();
  const categoryId = pickedCategory !== undefined ? pickedCategory : savedCategory;
  const subId = pickedSub !== undefined ? pickedSub : savedSub;

  const activeCategory = categories.find((c) => c.id === categoryId);
  const activeSub = activeCategory?.subcategories.find((s) => s.id === subId);

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

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <label className={builderLabelClass}>
          Category
          <select
            value={categoryId ?? ""}
            onChange={(e) => {
              setPickedCategory(e.target.value ? Number(e.target.value) : null);
              setPickedSub(null);
              set({ inter_category: null });
            }}
            className={`${inputClass} bg-white`}
          >
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className={builderLabelClass}>
          Sub-category
          <select
            value={subId ?? ""}
            onChange={(e) => {
              setPickedSub(e.target.value ? Number(e.target.value) : null);
              set({ inter_category: null });
            }}
            disabled={categoryId == null}
            className={`${inputClass} bg-white disabled:opacity-50`}
          >
            <option value="">Select…</option>
            {activeCategory?.subcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className={builderLabelClass}>
          Topic
          <select
            value={info.inter_category ?? ""}
            onChange={(e) =>
              set({ inter_category: e.target.value ? Number(e.target.value) : null })
            }
            disabled={subId == null}
            className={`${inputClass} bg-white disabled:opacity-50`}
          >
            <option value="">Select…</option>
            {activeSub?.intercategories.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
