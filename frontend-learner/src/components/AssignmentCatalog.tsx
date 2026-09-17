import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  type AssignmentCatalogCategory,
  type AssignmentCatalogItem,
} from "@masterlms/shared";
import { TopNav } from "./TopNav";

type Props = {
  categories: AssignmentCatalogCategory[];
  assignments: AssignmentCatalogItem[];
  isLoading: boolean;
  error: Error | null;
  categoryId: number | null;
  subCategoryId: number | null;
  interCategoryId: number | null;
  onSelectCategory: (id: number) => void;
  onSelectSubCategory: (id: number) => void;
  onSelectInterCategory: (id: number) => void;
  onReset: () => void;
};

export function AssignmentCatalog({
  categories,
  assignments,
  isLoading,
  error,
  categoryId,
  subCategoryId,
  interCategoryId,
  onSelectCategory,
  onSelectSubCategory,
  onSelectInterCategory,
  onReset,
}: Props) {
  const category = categories.find((c) => c.id === categoryId);
  const subCategory = category?.subcategories.find((s) => s.id === subCategoryId);
  const interCategory = subCategory?.intercategories.find(
    (i) => i.id === interCategoryId,
  );

  const contextLabel = interCategory
    ? interCategory.name
    : subCategory
      ? `${subCategory.name}`
      : category
        ? `${category.name}`
        : "All";

  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <TopNav />
      <div className="w-full px-3 py-6 sm:px-4">
        <div className="rounded-[28px] bg-white p-8 shadow-sm sm:p-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900"
          >
            <ArrowLeft size={14} strokeWidth={2.5} /> Back to home
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">Assignments</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Pick a category, then drill into sub-categories and inter-categories.
          </p>

          {/* Category level */}
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Category
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((c) => {
                const active = c.id === categoryId;
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectCategory(c.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-[#0f172a] bg-[#0f172a] text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
              {categories.length === 0 && !isLoading && (
                <p className="text-sm text-zinc-400">No categories yet.</p>
              )}
            </div>
          </div>

          {/* Sub-category level */}
          {category && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {category.name} · Sub-categories
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {category.subcategories.map((s) => {
                  const active = s.id === subCategoryId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelectSubCategory(s.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "border-[#0f172a] bg-[#0f172a] text-white"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inter-category level */}
          {subCategory && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {category?.name} / {subCategory.name} · Inter-categories
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {subCategory.intercategories.map((i) => {
                  const active = i.id === interCategoryId;
                  return (
                    <button
                      key={i.id}
                      onClick={() => onSelectInterCategory(i.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                      }`}
                    >
                      {i.name}
                      <span className={`text-[11px] ${active ? "text-white/80" : "text-zinc-400"}`}>
                        {i.assignments_count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Breadcrumb + reset */}
          {(categoryId !== null || subCategoryId !== null || interCategoryId !== null) && (
            <div className="mt-6 flex flex-wrap items-center gap-1.5 text-sm text-zinc-600">
              <button
                onClick={onReset}
                className="rounded-full px-3 py-1 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-100"
              >
                All assignments
              </button>
              {category && (
                <>
                  <ChevronRight size={14} className="text-zinc-300" />
                  <button
                    onClick={() => onSelectCategory(category.id)}
                    className="font-medium text-zinc-800 hover:underline"
                  >
                    {category.name}
                  </button>
                </>
              )}
              {subCategory && (
                <>
                  <ChevronRight size={14} className="text-zinc-300" />
                  <button
                    onClick={() => onSelectSubCategory(subCategory.id)}
                    className="font-medium text-zinc-800 hover:underline"
                  >
                    {subCategory.name}
                  </button>
                </>
              )}
              {interCategory && (
                <>
                  <ChevronRight size={14} className="text-zinc-300" />
                  <span className="font-semibold text-emerald-700">{interCategory.name}</span>
                </>
              )}
            </div>
          )}

          {/* Assignments */}
          <div className="mt-8">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold">{contextLabel} assignments</h2>
              <span className="text-xs text-zinc-400">
                {assignments.length} {assignments.length === 1 ? "assignment" : "assignments"}
              </span>
            </div>

            {isLoading && <p className="mt-6 text-sm text-zinc-500">Loading assignments…</p>}
            {error && (
              <p className="mt-6 text-sm text-red-600">
                Unable to load assignments: {error.message}
              </p>
            )}
            {!isLoading && !error && assignments.length === 0 && (
              <p className="mt-6 text-sm text-zinc-500">
                No published assignments {categoryId !== null ? "in this category yet" : "yet"}.
              </p>
            )}
            <div className="mt-4 grid gap-3">
              {assignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  to={`/assignments/${assignment.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold">{assignment.title}</p>
                    <p className="text-xs text-zinc-500">
                      {assignment.questions_count} questions · {assignment.duration_label}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                    Available
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}