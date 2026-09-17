import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminCreateCategory,
  adminCreateInterCategory,
  adminCreateSubCategory,
  adminDeleteCategory,
  adminDeleteInterCategory,
  adminDeleteSubCategory,
  adminListCategories,
  adminListInterCategories,
  adminListSubCategories,
  adminUpdateCategory,
} from "@masterlms/shared";
import { CategoriesView } from "../components/CategoriesView";

export function CategoriesContainer() {
  const qc = useQueryClient();
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [expandedSubCategory, setExpandedSubCategory] = useState<number | null>(null);

  const cats = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => adminListCategories(),
  });
  const subs = useQuery({
    queryKey: ["admin", "subcategories"],
    queryFn: () => adminListSubCategories(),
  });
  const inters = useQuery({
    queryKey: ["admin", "intercategories"],
    queryFn: () => adminListInterCategories(),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    qc.invalidateQueries({ queryKey: ["admin", "subcategories"] });
    qc.invalidateQueries({ queryKey: ["admin", "intercategories"] });
  };

  const createCategory = useMutation({
    mutationFn: (name: string) => adminCreateCategory({ name }),
    onSuccess: refresh,
  });
  const updateCategory = useMutation({
    mutationFn: (pair: { id: number; is_active: boolean }) =>
      adminUpdateCategory(pair.id, { is_active: pair.is_active }),
    onSuccess: refresh,
  });
  const deleteCategory = useMutation({
    mutationFn: (id: number) => adminDeleteCategory(id),
    onSuccess: refresh,
  });

  const createSub = useMutation({
    mutationFn: (input: { name: string; category_id: number }) =>
      adminCreateSubCategory(input),
    onSuccess: refresh,
  });
  const deleteSub = useMutation({
    mutationFn: (id: number) => adminDeleteSubCategory(id),
    onSuccess: refresh,
  });

  const createInter = useMutation({
    mutationFn: (input: { name: string; sub_category_id: number }) =>
      adminCreateInterCategory(input),
    onSuccess: refresh,
  });
  const deleteInter = useMutation({
    mutationFn: (id: number) => adminDeleteInterCategory(id),
    onSuccess: refresh,
  });

  const loading =
    cats.isLoading || subs.isLoading || inters.isLoading;
  const error =
    cats.error || subs.error || inters.error;

  return (
    <CategoriesView
      categories={cats.data ?? []}
      subcategories={subs.data ?? []}
      intercategories={inters.data ?? []}
      loading={loading}
      error={error ? String(error) : null}
      busy={
        cats.isLoading ||
        subs.isLoading ||
        inters.isLoading ||
        createCategory.isPending ||
        deleteCategory.isPending ||
        createSub.isPending ||
        deleteSub.isPending ||
        createInter.isPending ||
        deleteInter.isPending
      }
      expandedCategory={expandedCategory}
      onToggleCategory={(id) =>
        setExpandedCategory((cur) => (cur === id ? null : id))
      }
      expandedSubCategory={expandedSubCategory}
      onToggleSubCategory={(id) =>
        setExpandedSubCategory((cur) => (cur === id ? null : id))
      }
      onCreateCategory={(name) => createCategory.mutate(name)}
      onToggleActive={(cat) => updateCategory.mutate({ id: cat.id, is_active: !cat.is_active })}
      onDeleteCategory={(id) => deleteCategory.mutate(id)}
      onCreateSubCategory={(name, categoryId) =>
        createSub.mutate({ name, category_id: categoryId })
      }
      onDeleteSubCategory={(id) => deleteSub.mutate(id)}
      onCreateInterCategory={(name, subCategoryId) =>
        createInter.mutate({ name, sub_category_id: subCategoryId })
      }
      onDeleteInterCategory={(id) => deleteInter.mutate(id)}
    />
  );
}