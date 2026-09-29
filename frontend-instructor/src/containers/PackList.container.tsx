import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  adminDeletePack,
  adminListPacks,
  adminPublishPack,
  adminUnpublishPack,
} from "@masterlms/shared";
import { PackListView } from "../components/PackListView";

export function PackListContainer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const query = useQuery({ queryKey: ["packs-admin"], queryFn: adminListPacks });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["packs-admin"] });

  const publish = useMutation({
    mutationFn: adminPublishPack,
    onSuccess: () => {
      refresh();
      showToast("Pack published! Learners can buy it now.");
    },
    onError: (e) => showToast(String(e)),
  });
  const unpublish = useMutation({
    mutationFn: adminUnpublishPack,
    onSuccess: () => {
      refresh();
      showToast("Pack unpublished.");
    },
    onError: (e) => showToast(String(e)),
  });
  const remove = useMutation({
    mutationFn: adminDeletePack,
    onSuccess: () => {
      setConfirmDelete(null);
      refresh();
      showToast("Pack deleted.");
    },
    onError: (e) => showToast(String(e)),
  });

  return (
    <PackListView
      packs={query.data ?? []}
      isLoading={query.isLoading}
      error={query.error as Error | null}
      toast={toast}
      confirmDelete={confirmDelete}
      onNew={() => navigate("/packs/new")}
      onEdit={(id) => navigate(`/packs/${id}/edit`)}
      onPublish={(id) => publish.mutate(id)}
      onUnpublish={(id) => unpublish.mutate(id)}
      onAskDelete={(id) => setConfirmDelete(id)}
      onCancelDelete={() => setConfirmDelete(null)}
      onConfirmDelete={() => confirmDelete != null && remove.mutate(confirmDelete)}
      busy={publish.isPending || unpublish.isPending || remove.isPending}
    />
  );
}
