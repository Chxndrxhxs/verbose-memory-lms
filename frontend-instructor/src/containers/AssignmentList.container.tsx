import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAssignmentList,
  useDeleteAssignment,
  useDuplicateAssignment,
  usePublishAssignment,
  useArchiveAssignment,
} from "../hooks/useAssignments";
import { AssignmentListView } from "../components/AssignmentListView";
import type { AssignmentStatus } from "../types/assignment";

export function AssignmentListContainer() {
  const nav = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | "">("");

  const { data, isLoading } = useAssignmentList(
    page,
    search,
    statusFilter || undefined
  );
  const deleteMut = useDeleteAssignment();
  const duplicateMut = useDuplicateAssignment();
  const publishMut = usePublishAssignment();
  const archiveMut = useArchiveAssignment();

  const assignments = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this assignment? This cannot be undone.")) return;
    deleteMut.mutate(id);
  };

  const handleDuplicate = (id: string) => {
    duplicateMut.mutate(id, {
      onSuccess: (newAssignment) => {
        nav(`/assignments/${newAssignment.id}/edit`);
      },
    });
  };

  const handlePublish = (id: string) => {
    publishMut.mutate(id);
  };

  const handleArchive = (id: string) => {
    archiveMut.mutate(id);
  };

  return (
    <AssignmentListView
      assignments={assignments}
      isLoading={isLoading}
      page={page}
      total={total}
      search={search}
      statusFilter={statusFilter}
      onSearchChange={(q) => { setSearch(q); setPage(1); }}
      onStatusFilterChange={(s) => { setStatusFilter(s); setPage(1); }}
      onPageChange={setPage}
      onDelete={handleDelete}
      onDuplicate={handleDuplicate}
      onPublish={handlePublish}
      onArchive={handleArchive}
    />
  );
}
