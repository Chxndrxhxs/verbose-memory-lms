import { Link } from "react-router-dom";
import { Search } from "@masterlms/shared";
import type { AdminPayment } from "../types/admin";
import { cn } from "../lib/utils";
import { Card } from "./Card";
import { Pagination } from "./Pagination";

export function PaymentsView({
  data,
  total,
  pages,
  page,
  onPage,
  q,
  onSearch,
  status,
  onStatus,
  searchLoading,
  loading,
  error,
}: {
  data: AdminPayment[];
  total: number;
  pages: number;
  page: number;
  onPage: (p: number) => void;
  q: string;
  onSearch: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  searchLoading: boolean;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Payments</h1>
        <p className="text-sm text-zinc-500">All transactions across the platform, read-only.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" strokeWidth={2.5} />
            <input
              value={q}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search user, course or order id…"
              className="w-full rounded-xl border bg-zinc-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-zinc-900"
            />
            {searchLoading && <span className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 animate-ping rounded-full bg-zinc-400" />}
          </div>
          <select
            value={status}
            onChange={(e) => onStatus(e.target.value)}
            className="rounded-xl border bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 outline-none"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="divide-y">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 px-5 py-4">
                <div className="h-4 w-32 rounded bg-zinc-200" />
                <div className="ml-auto h-4 w-16 rounded bg-zinc-200" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="px-5 py-8 text-center text-sm text-red-600">{error}</p>
        ) : data.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-400">No payments match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Course</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Order ID</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3">
                      <Link to={`/users/${p.user_id}`} className="font-semibold text-zinc-800 hover:underline">{p.user_name}</Link>
                      <p className="text-xs text-zinc-400">+91 {p.user_mobile}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Link to={`/courses/${p.course_id}`} className="block max-w-[240px] truncate font-semibold text-zinc-800 hover:underline">{p.course_title}</Link>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-zinc-700">₹{p.amount_inr.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-zinc-400">{(p.amount / 100).toFixed(2)} {p.currency}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase", p.status === "paid" ? "bg-emerald-100 text-emerald-700" : p.status === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-500">{p.razorpay_order_id || "—"}</td>
                    <td className="px-5 py-3 text-zinc-500">{new Date(p.created_at).toLocaleDateString()}</td>
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
    </div>
  );
}