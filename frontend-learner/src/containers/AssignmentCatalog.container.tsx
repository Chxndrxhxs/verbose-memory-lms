import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAssignmentCatalog,
  getAssignmentCategories,
} from "@masterlms/shared";
import { AssignmentCatalog } from "../components/AssignmentCatalog";

export function AssignmentCatalogContainer() {
  const treeQuery = useQuery({
    queryKey: ["assignment-categories"],
    queryFn: getAssignmentCategories,
  });
  const itemsQuery = useQuery({
    queryKey: ["published-assignments"],
    queryFn: getAssignmentCatalog,
  });

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<number | null>(null);
  const [interCategoryId, setInterCategoryId] = useState<number | null>(null);

  const selectCategory = (id: number) => {
    setCategoryId(id);
    setSubCategoryId(null);
    setInterCategoryId(null);
  };
  const selectSubCategory = (id: number) => {
    setSubCategoryId(id);
    setInterCategoryId(null);
  };
  const selectInterCategory = (id: number) => setInterCategoryId(id);

  const filtered = useMemo(() => {
    const items = itemsQuery.data ?? [];
    if (interCategoryId != null) {
      return items.filter((a) => a.inter_category?.id === interCategoryId);
    }
    if (subCategoryId != null) {
      return items.filter(
        (a) => a.inter_category?.sub_category.id === subCategoryId,
      );
    }
    if (categoryId != null) {
      return items.filter(
        (a) => a.inter_category?.sub_category.category.id === categoryId,
      );
    }
    return items;
  }, [itemsQuery.data, categoryId, subCategoryId, interCategoryId]);

  return (
    <AssignmentCatalog
      categories={treeQuery.data ?? []}
      assignments={filtered}
      isLoading={treeQuery.isLoading || itemsQuery.isLoading}
      error={(treeQuery.error ?? itemsQuery.error) as Error | null}
      categoryId={categoryId}
      subCategoryId={subCategoryId}
      interCategoryId={interCategoryId}
      onSelectCategory={selectCategory}
      onSelectSubCategory={selectSubCategory}
      onSelectInterCategory={selectInterCategory}
      onReset={() => {
        setCategoryId(null);
        setSubCategoryId(null);
        setInterCategoryId(null);
      }}
    />
  );
}