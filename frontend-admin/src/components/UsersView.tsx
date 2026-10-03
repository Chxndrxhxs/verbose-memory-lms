import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, User } from "@masterlms/shared";
import type { AdminRole, AdminUser } from "../types/admin";
import { PageHeader } from "./Panel";
import { RoleBadge } from "./Badge";
import { Button } from "./Button";
import { SearchInput, Select } from "./Controls";
import {
  GridHead,
  GridMessage,
  GridPanel,
  GridScroll,
  GridSkeleton,
  Td,
  Th,
  Tr,
} from "./DataGrid";
import { Pagination } from "./Pagination";
import { ConfirmDialog } from "./ConfirmDialog";

export function UsersView({
  data,
  total,
  pages,
  page,
  onPage,
  q,
  onSearch,
  role,
  onRole,
  searchLoading,
  loading,
  error,
  onDelete,
  deleting,
  deletingId,
}: {
  data: AdminUser[];
  total: number;
  pages: number;
  page: number;
  onPage: (p: number) => void;
  q: string;
  onSearch: (v: string) => void;
  role: AdminRole | "";
  onRole: (v: AdminRole | "") => void;
  searchLoading: boolean;
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
  deleting: boolean;
  deletingId?: number;
}) {
  const [target, setTarget] = useState<AdminUser | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Every account on the platform, editable and removable."
      />

      <GridPanel
        toolbar={
          <>
            <SearchInput
              value={q}
              onChange={onSearch}
              placeholder="Search name, mobile or email"
              busy={searchLoading}
            />
            <Select
              value={role}
              onChange={(e) => onRole(e.target.value as AdminRole | "")}
              aria-label="Filter by role"
              className="w-auto min-w-[150px]"
            >
              <option value="">All roles</option>
              <option value="learner">Learners</option>
              <option value="instructor">Instructors</option>
              <option value="admin">Admins</option>
            </Select>
          </>
        }
        footer={
          <Pagination page={page} pages={pages} total={total} onChange={onPage} />
        }
      >
        {loading ? (
          <GridSkeleton rows={6} cells={6} />
        ) : error ? (
          <GridMessage
            kind="error"
            title="Could not load users"
            body={error}
          />
        ) : data.length === 0 ? (
          <GridMessage
            kind="empty"
            title={q || role ? "No accounts match those filters" : "No accounts yet"}
            body={
              q || role
                ? "Try a different name, mobile or role. Clear the filters to see everyone."
                : "Accounts appear here as soon as learners and instructors register."
            }
          />
        ) : (
          <GridScroll>
            <GridHead>
              <Th>User</Th>
              <Th>Mobile</Th>
              <Th>Role</Th>
              <Th>City</Th>
              <Th>Joined</Th>
              <Th align="right">Actions</Th>
            </GridHead>
            <tbody>
              {data.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="h-8 w-8 shrink-0 object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-paper-sunk text-ink-faint">
                          <User size={15} strokeWidth={2.2} aria-hidden />
                        </span>
                      )}
                      <div className="min-w-0">
                        <Link
                          to={`/users/${u.id}`}
                          className="block max-w-[200px] truncate text-sm font-medium text-ink hover:underline"
                        >
                          {u.name || u.username}
                        </Link>
                        <p className="max-w-[200px] truncate text-xs text-ink-faint">
                          {u.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="tnum whitespace-nowrap text-ink-muted">+91 {u.mobile}</Td>
                  <Td>
                    <RoleBadge role={u.role} />
                  </Td>
                  <Td className="text-ink-muted">{u.city || "—"}</Td>
                  <Td className="tnum whitespace-nowrap text-ink-muted">
                    {new Date(u.date_joined).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })}
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/users/${u.id}`}
                        className="inline-flex h-8 items-center border border-transparent px-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-rule hover:bg-paper-raised hover:text-ink"
                      >
                        View
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        onClick={() => setTarget(u)}
                        disabled={deleting && deletingId === u.id}
                        aria-label={`Delete ${u.name || u.username}`}
                      >
                        <Trash2 size={15} strokeWidth={2.2} aria-hidden />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </GridScroll>
        )}
      </GridPanel>

      <ConfirmDialog
        open={target !== null}
        title="Delete this user?"
        description={`Permanently remove ${target?.name || target?.username} (${target?.email || target?.mobile})? Their enrollments and payments are removed too. This cannot be undone.`}
        busy={deleting}
        onConfirm={() => {
          if (target) onDelete(target.id);
          setTarget(null);
        }}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}