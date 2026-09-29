import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAssignmentCatalog,
  getAssignmentCategories,
  getMyPacks,
  getPacks,
  type PackListItem,
} from "@masterlms/shared";
import { AssignmentCatalog } from "../components/AssignmentCatalog";

function packInCategory(pack: PackListItem, categoryId: number | null, subId: number | null, interId: number | null): boolean {
  const chain = pack.inter_category;
  if (interId != null) return chain?.id === interId;
  if (subId != null) return chain?.sub_category.id === subId;
  if (categoryId != null) return chain?.category.id === categoryId;
  return true;
}

export function AssignmentCatalogContainer() {
  const treeQuery = useQuery({
    queryKey: ["assignment-categories"],
    queryFn: getAssignmentCategories,
  });
  const itemsQuery = useQuery({
    queryKey: ["published-assignments"],
    queryFn: getAssignmentCatalog,
  });
  const packsQuery = useQuery({
    queryKey: ["packs"],
    queryFn: () => getPacks(),
  });
  const myPacksQuery = useQuery({
    queryKey: ["my-packs"],
    queryFn: getMyPacks,
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

  const { ownedPacks, packsForSale } = useMemo(() => {
    const ownedIds = new Set((myPacksQuery.data ?? []).map((p) => p.id));
    const inScope = (packsQuery.data ?? []).filter((p) =>
      packInCategory(p, categoryId, subCategoryId, interCategoryId),
    );
    return {
      ownedPacks: inScope.filter((p) => p.owned || ownedIds.has(p.id)),
      packsForSale: inScope.filter((p) => !p.owned && !ownedIds.has(p.id)),
    };
  }, [packsQuery.data, myPacksQuery.data, categoryId, subCategoryId, interCategoryId]);

  return (
    <AssignmentCatalog
      categories={treeQuery.data ?? []}
      assignments={filtered}
      ownedPacks={ownedPacks}
      packsForSale={packsForSale}
      isLoading={treeQuery.isLoading || itemsQuery.isLoading || packsQuery.isLoading}
      error={(treeQuery.error ?? itemsQuery.error ?? packsQuery.error) as Error | null}
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