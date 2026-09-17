import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  type AssignmentHierarchyNode,
} from "@masterlms/shared";
import { Card } from "./Card";
import { ConfirmDialog } from "./ConfirmDialog";

type Props = {
  categories: AssignmentHierarchyNode[];
  subcategories: AssignmentHierarchyNode[];
  intercategories: AssignmentHierarchyNode[];
  loading: boolean;
  error: string | null;
  busy: boolean;
  expandedCategory: number | null;
  onToggleCategory: (id: number) => void;
  expandedSubCategory: number | null;
  onToggleSubCategory: (id: number) => void;
  onCreateCategory: (name: string) => void;
  onToggleActive: (category: AssignmentHierarchyNode) => void;
  onDeleteCategory: (id: number) => void;
  onCreateSubCategory: (name: string, categoryId: number) => void;
  onDeleteSubCategory: (id: number) => void;
  onCreateInterCategory: (name: string, subCategoryId: number) => void;
  onDeleteInterCategory: (id: number) => void;
};

type ConfirmState = {
  kind: "category" | "subcategory" | "intercategory";
  id: number;
  name: string;
} | null;

export function CategoriesView({
  categories,
  subcategories,
  intercategories,
  loading,
  error,
  busy,
  expandedCategory,
  onToggleCategory,
  expandedSubCategory,
  onToggleSubCategory,
  onCreateCategory,
  onToggleActive,
  onDeleteCategory,
  onCreateSubCategory,
  onDeleteSubCategory,
  onCreateInterCategory,
  onDeleteInterCategory,
}: Props) {
  const [categoryName, setCategoryName] = useState("");
  const [subNameFor, setSubNameFor] = useState<number | null>(null);
  const [subName, setSubName] = useState("");
  const [interNameFor, setInterNameFor] = useState<number | null>(null);
  const [interName, setInterName] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Assignment categories</h1>
          <p className="text-sm text-zinc-500">
            Category → Sub-category → Inter-category tree for published assignments.
          </p>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && categoryName.trim()) {
                onCreateCategory(categoryName.trim());
                setCategoryName("");
              }
            }}
            placeholder="New category name…"
            className="min-w-[220px] flex-1 rounded-xl border bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
          />
          <button
            disabled={!categoryName.trim() || busy}
            onClick={() => {
              onCreateCategory(categoryName.trim());
              setCategoryName("");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <Plus size={15} strokeWidth={2.5} /> Add category
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="divide-y">
            {[0, 1].map((i) => (
              <div key={i} className="animate-pulse px-5 py-4">
                <div className="h-4 w-40 rounded bg-zinc-200" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="px-5 py-8 text-center text-sm text-red-600">{error}</p>
        ) : categories.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-400">
            No categories yet. Create one above.
          </p>
        ) : (
          <div className="divide-y">
            {categories.map((category) => {
              const areaSubs = subcategories.filter((s) => s.category_id === category.id);
              const expanded = expandedCategory === category.id;
              return (
                <div key={category.id}>
                  <div className="flex items-center gap-2 px-5 py-3">
                    <button
                      onClick={() => onToggleCategory(category.id)}
                      className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
                    >
                      {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-zinc-800">
                        {category.name}
                        {!category.is_active && (
                          <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-400">
                            Inactive
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {areaSubs.length} sub-categories ·{" "}
                        {category.assignments_count ?? 0} assignments
                      </p>
                    </div>
                    <button
                      onClick={() => onToggleActive(category)}
                      disabled={busy}
                      className="rounded-full border px-3 py-1 text-[11px] font-semibold text-zinc-500 hover:border-zinc-400 disabled:opacity-50"
                    >
                      {category.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() =>
                        setConfirm({ kind: "category", id: category.id, name: category.name })
                      }
                      disabled={busy}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>

                  {expanded && (
                    <div className="border-t bg-zinc-50/50 py-3 pl-10 pr-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={subNameFor === category.id ? subName : ""}
                          onChange={(e) => {
                            setSubNameFor(category.id);
                            setSubName(e.target.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && subName.trim() && subNameFor === category.id) {
                              onCreateSubCategory(subName.trim(), category.id);
                              setSubName("");
                              setSubNameFor(null);
                            }
                          }}
                          placeholder="New sub-category name…"
                          className="min-w-[200px] flex-1 rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                        />
                        <button
                          disabled={!subName.trim() || subNameFor !== category.id || busy}
                          onClick={() => {
                            onCreateSubCategory(subName.trim(), category.id);
                            setSubName("");
                            setSubNameFor(null);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          <Plus size={13} /> Add
                        </button>
                      </div>

                      {areaSubs.map((sub) => {
                        const areaInters = intercategories.filter(
                          (i) => i.sub_category_id === sub.id,
                        );
                        const subExpanded = expandedSubCategory === sub.id;
                        return (
                          <div key={sub.id} className="mt-3">
                            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2">
                              <button
                                onClick={() => onToggleSubCategory(sub.id)}
                                className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100"
                              >
                                {subExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                              <p className="flex-1 text-sm font-medium text-zinc-700">{sub.name}</p>
                              <button
                                onClick={() =>
                                  setConfirm({
                                    kind: "subcategory",
                                    id: sub.id,
                                    name: sub.name,
                                  })
                                }
                                disabled={busy}
                                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 size={14} strokeWidth={2.5} />
                              </button>
                            </div>

                            {subExpanded && (
                              <div className="mt-2 pl-6">
                                <div className="flex flex-wrap items-center gap-2">
                                  <input
                                    value={interNameFor === sub.id ? interName : ""}
                                    onChange={(e) => {
                                      setInterNameFor(sub.id);
                                      setInterName(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                      if (
                                        e.key === "Enter" &&
                                        interName.trim() &&
                                        interNameFor === sub.id
                                      ) {
                                        onCreateInterCategory(interName.trim(), sub.id);
                                        setInterName("");
                                        setInterNameFor(null);
                                      }
                                    }}
                                    placeholder="New inter-category name…"
                                    className="min-w-[180px] flex-1 rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                                  />
                                  <button
                                    disabled={!interName.trim() || interNameFor !== sub.id || busy}
                                    onClick={() => {
                                      onCreateInterCategory(interName.trim(), sub.id);
                                      setInterName("");
                                      setInterNameFor(null);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                  >
                                    <Plus size={13} /> Add
                                  </button>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  {areaInters.map((inter) => (
                                    <div
                                      key={inter.id}
                                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-3 pr-1 text-xs font-medium text-zinc-700"
                                    >
                                      {inter.name}
                                      <button
                                        onClick={() =>
                                          setConfirm({
                                            kind: "intercategory",
                                            id: inter.id,
                                            name: inter.name,
                                          })
                                        }
                                        disabled={busy}
                                        className="rounded-full p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                      >
                                        <Trash2 size={12} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  ))}
                                  {areaInters.length === 0 && (
                                    <p className="text-xs text-zinc-400">
                                      No inter-categories yet.
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {areaSubs.length === 0 && (
                        <p className="mt-2 text-xs text-zinc-400">No sub-categories yet.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirm !== null}
        title="Delete this item?"
        description={`Delete "${confirm?.name ?? ""}" and every item nested below it? This cannot be undone.`}
        busy={busy}
        onConfirm={() => {
          if (confirm) {
            if (confirm.kind === "category") onDeleteCategory(confirm.id);
            if (confirm.kind === "subcategory") onDeleteSubCategory(confirm.id);
            if (confirm.kind === "intercategory") onDeleteInterCategory(confirm.id);
          }
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}