import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  X,
  type AssignmentHierarchyNode,
} from "@masterlms/shared";
import { PageHeader, Panel } from "./Panel";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Input } from "./Controls";
import { GridMessage } from "./DataGrid";
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

export function CategoriesView(props: Props) {
  const {
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
  } = props;

  const [categoryName, setCategoryName] = useState("");
  const [subNameFor, setSubNameFor] = useState<number | null>(null);
  const [subName, setSubName] = useState("");
  const [interNameFor, setInterNameFor] = useState<number | null>(null);
  const [interName, setInterName] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const addCategory = () => {
    const v = categoryName.trim();
    if (!v) return;
    onCreateCategory(v);
    setCategoryName("");
  };

  const addSub = (categoryId: number) => {
    const v = subName.trim();
    if (!v) return;
    onCreateSubCategory(v, categoryId);
    setSubName("");
    setSubNameFor(null);
  };

  const addInter = (subId: number) => {
    const v = interName.trim();
    if (!v) return;
    onCreateInterCategory(v, subId);
    setInterName("");
    setInterNameFor(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignment categories"
        description="Category, then sub-category, then inter-category. Assignments are filed against the deepest level."
      />

      <Panel>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addCategory();
          }}
        >
          <label className="min-w-[220px] flex-1">
            <span className="block text-xs font-semibold text-ink-muted">New category</span>
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Electronics"
              className="mt-1.5"
            />
          </label>
          <Button type="submit" variant="primary" disabled={!categoryName.trim() || busy}>
            <Plus size={15} strokeWidth={2.5} aria-hidden /> Add category
          </Button>
        </form>
      </Panel>

      <Panel flush>
        {loading ? (
          <div className="divide-y divide-rule">
            {[0, 1, 2].map((i) => (
              <div key={i} className="px-5 py-4">
                <div className="h-3 w-40 animate-pulse bg-paper-sunk" />
              </div>
            ))}
          </div>
        ) : error ? (
          <GridMessage kind="error" title="Could not load categories" body={error} />
        ) : categories.length === 0 ? (
          <GridMessage
            kind="empty"
            title="No categories yet"
            body="Add your first category above. Sub-categories and inter-categories hang off it, and every published assignment must land on one."
          />
        ) : (
          <ul className="divide-y divide-rule">
            {categories.map((category) => {
              const areaSubs = subcategories.filter((s) => s.category_id === category.id);
              const expanded = expandedCategory === category.id;
              return (
                <li key={category.id}>
                  <div className="flex items-center gap-2 px-4 py-3">
                    <button
                      onClick={() => onToggleCategory(category.id)}
                      aria-expanded={expanded}
                      aria-label={`${expanded ? "Collapse" : "Expand"} ${category.name}`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center text-ink-faint transition-colors hover:bg-paper-sunk hover:text-ink"
                    >
                      {expanded ? (
                        <ChevronDown size={15} strokeWidth={2.5} aria-hidden />
                      ) : (
                        <ChevronRight size={15} strokeWidth={2.5} aria-hidden />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                        <span className="truncate">{category.name}</span>
                        <Badge tone={category.is_active ? "live" : "muted"}>
                          {category.is_active ? "active" : "inactive"}
                        </Badge>
                      </p>
                      <p className="tnum text-xs text-ink-faint">
                        {areaSubs.length} sub-categories · {category.assignments_count ?? 0} assignments
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onToggleActive(category)}
                      disabled={busy}
                    >
                      {category.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      onClick={() =>
                        setConfirm({ kind: "category", id: category.id, name: category.name })
                      }
                      disabled={busy}
                      aria-label={`Delete ${category.name}`}
                      className="text-halt hover:bg-halt-soft"
                    >
                      <Trash2 size={15} strokeWidth={2.2} aria-hidden />
                    </Button>
                  </div>

                  {expanded && (
                    <div className="border-t border-rule bg-paper px-4 py-4 sm:pl-11">
                      <form
                        className="flex flex-wrap items-end gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          addSub(category.id);
                        }}
                      >
                        <label className="min-w-[200px] flex-1">
                          <span className="block text-xs font-semibold text-ink-muted">
                            New sub-category in {category.name}
                          </span>
                          <Input
                            value={subNameFor === category.id ? subName : ""}
                            onChange={(e) => {
                              setSubNameFor(category.id);
                              setSubName(e.target.value);
                            }}
                            placeholder="e.g. Smartphones"
                            className="mt-1.5"
                          />
                        </label>
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          disabled={!subName.trim() || subNameFor !== category.id || busy}
                        >
                          <Plus size={13} strokeWidth={2.5} aria-hidden /> Add
                        </Button>
                      </form>

                      {areaSubs.length === 0 ? (
                        <p className="mt-4 text-xs text-ink-faint">
                          No sub-categories yet. Add one to start filing assignments.
                        </p>
                      ) : (
                        <ul className="mt-4 space-y-2">
                          {areaSubs.map((sub) => {
                            const areaInters = intercategories.filter(
                              (i) => i.sub_category_id === sub.id,
                            );
                            const subExpanded = expandedSubCategory === sub.id;
                            return (
                              <li
                                key={sub.id}
                                className="border border-rule bg-paper-raised"
                              >
                                <div className="flex items-center gap-2 px-3 py-2">
                                  <button
                                    onClick={() => onToggleSubCategory(sub.id)}
                                    aria-expanded={subExpanded}
                                    aria-label={`${subExpanded ? "Collapse" : "Expand"} ${sub.name}`}
                                    className="flex h-6 w-6 shrink-0 items-center justify-center text-ink-faint transition-colors hover:bg-paper-sunk hover:text-ink"
                                  >
                                    {subExpanded ? (
                                      <ChevronDown size={14} strokeWidth={2.5} aria-hidden />
                                    ) : (
                                      <ChevronRight size={14} strokeWidth={2.5} aria-hidden />
                                    )}
                                  </button>
                                  <p className="flex-1 truncate text-sm text-ink">{sub.name}</p>
                                  <span className="tnum shrink-0 text-xs text-ink-faint">
                                    {areaInters.length}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    iconOnly
                                    onClick={() =>
                                      setConfirm({
                                        kind: "subcategory",
                                        id: sub.id,
                                        name: sub.name,
                                      })
                                    }
                                    disabled={busy}
                                    aria-label={`Delete ${sub.name}`}
                                    className="text-halt hover:bg-halt-soft"
                                  >
                                    <Trash2 size={14} strokeWidth={2.2} aria-hidden />
                                  </Button>
                                </div>

                                {subExpanded && (
                                  <div className="border-t border-rule px-3 py-3 sm:pl-8">
                                    <form
                                      className="flex flex-wrap items-end gap-2"
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        addInter(sub.id);
                                      }}
                                    >
                                      <label className="min-w-[180px] flex-1">
                                        <span className="sr-only">
                                          New inter-category in {sub.name}
                                        </span>
                                        <Input
                                          value={interNameFor === sub.id ? interName : ""}
                                          onChange={(e) => {
                                            setInterNameFor(sub.id);
                                            setInterName(e.target.value);
                                          }}
                                          placeholder="New inter-category name"
                                          className="py-2 text-sm"
                                        />
                                      </label>
                                      <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        disabled={
                                          !interName.trim() || interNameFor !== sub.id || busy
                                        }
                                      >
                                        <Plus size={13} strokeWidth={2.5} aria-hidden /> Add
                                      </Button>
                                    </form>

                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                      {areaInters.map((inter) => (
                                        <span
                                          key={inter.id}
                                          className="inline-flex items-center gap-1 border border-rule bg-paper px-2.5 py-1 text-xs text-ink"
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
                                            aria-label={`Delete ${inter.name}`}
                                            className="flex h-4 w-4 items-center justify-center text-ink-faint transition-colors hover:text-halt disabled:opacity-50"
                                          >
                                            <X size={12} strokeWidth={2.5} aria-hidden />
                                          </button>
                                        </span>
                                      ))}
                                      {areaInters.length === 0 && (
                                        <p className="text-xs text-ink-faint">
                                          No inter-categories yet.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

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