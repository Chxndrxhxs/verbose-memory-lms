import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAssignmentBoards,
  getAssignmentCatalog,
  getMyPacks,
  getPacks,
  type PackListItem,
} from "@masterlms/shared";
import { AssignmentCatalog } from "../components/AssignmentCatalog";

function packInBoard(pack: PackListItem, boardId: number | null): boolean {
  if (boardId == null) return true;
  return pack.board?.id === boardId;
}

export function AssignmentCatalogContainer() {
  const boardsQuery = useQuery({
    queryKey: ["assignment-boards"],
    queryFn: getAssignmentBoards,
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

  const [boardId, setBoardId] = useState<number | null>(null);
  const reset = () => setBoardId(null);

  const filtered = useMemo(() => {
    const items = itemsQuery.data ?? [];
    if (boardId == null) return items;
    return items.filter((a) => a.board?.id === boardId);
  }, [itemsQuery.data, boardId]);

  const { ownedPacks, packsForSale } = useMemo(() => {
    const ownedIds = new Set((myPacksQuery.data ?? []).map((p) => p.id));
    const inScope = (packsQuery.data ?? []).filter((p) => packInBoard(p, boardId));
    return {
      ownedPacks: inScope.filter((p) => p.owned || ownedIds.has(p.id)),
      packsForSale: inScope.filter((p) => !p.owned && !ownedIds.has(p.id)),
    };
  }, [packsQuery.data, myPacksQuery.data, boardId]);

  return (
    <AssignmentCatalog
      boards={boardsQuery.data ?? []}
      assignments={filtered}
      ownedPacks={ownedPacks}
      packsForSale={packsForSale}
      isLoading={boardsQuery.isLoading || itemsQuery.isLoading || packsQuery.isLoading}
      error={(boardsQuery.error ?? itemsQuery.error ?? packsQuery.error) as Error | null}
      boardId={boardId}
      onSelectBoard={setBoardId}
      onReset={reset}
    />
  );
}
