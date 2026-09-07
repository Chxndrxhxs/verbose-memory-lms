import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Trash2, User } from "@masterlms/shared";
import type { AdminRole, AdminUser } from "../types/admin";
import { cn } from "../lib/utils";
import { Card } from "./Card";
import { Pagination } from "./Pagination";
import { ConfirmDialog } from "./ConfirmDialog";

const ROLE_STYLES: Record<AdminRole, string> = {
  admin: "bg-[#0f172a] text-white",
  instructor: "bg-violet-100 text-violet-700",
  learner: "bg-emerald-100 text-emerald-700",
};

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
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Users</h1>
        <p className="text-sm text-zinc-500">Every account on the platform, editable and removable.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" strokeWidth={2.5} />
            <input
              value={q}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search name, mobile or email…"
              className="w-full rounded-xl border bg-zinc-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-zinc-900"
            />
            {searchLoading && <span className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 animate-ping rounded-full bg-zinc-400" />}
          </div>
          <select
            value={role}
            onChange={(e) => onRole(e.target.value as AdminRole | "")}
            className="rounded-xl border bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 outline-none"
          >
            <option value="">All roles</option>
            <option value="learner">Learners</option>
            <option value="instructor">Instructors</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="divide-y">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 px-5 py-4">
                <div className="h-9 w-9 rounded-full bg-zinc-200" />
                <div className="h-4 w-40 rounded bg-zinc-200" />
                <div className="ml-auto h-4 w-20 rounded bg-zinc-200" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="px-5 py-8 text-center text-sm text-red-600">{error}</p>
        ) : data.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-400">No users match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Mobile</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">City</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="h-9 w-9 rounded-full bg-zinc-200" />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                            <User size={16} strokeWidth={2.5} />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="max-w-[180px] truncate font-semibold text-zinc-800">
                            <Link to={`/users/${u.id}`} className="hover:underline">{u.name || u.username}</Link>
                          </p>
                          <p className="truncate text-xs text-zinc-400">{u.email || "No email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">+91 {u.mobile}</td>
                    <td className="px-5 py-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase", ROLE_STYLES[u.role])}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{u.city || "—"}</td>
                    <td className="px-5 py-3 text-zinc-500">{new Date(u.date_joined).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/users/${u.id}`}
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#0f172a] hover:bg-zinc-100"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => setTarget(u)}
                          disabled={deleting && deletingId === u.id}
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5">
          <Pagination page={page} pages={pages} total={total} onChange={onPage} />
        </div>
      </Card>

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