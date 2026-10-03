import { Link } from "react-router-dom";
import type { AdminPayment } from "../types/admin";
import { PageHeader } from "./Panel";
import { Badge, statusTone } from "./Badge";
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
      <PageHeader
        title="Payments"
        description="All transactions across the platform, read-only."
      />

      <GridPanel
        toolbar={
          <>
            <SearchInput
              value={q}
              onChange={onSearch}
              placeholder="Search user, course or order id"
              busy={searchLoading}
            />
            <Select
              value={status}
              onChange={(e) => onStatus(e.target.value)}
              aria-label="Filter by payment status"
              className="w-auto min-w-[150px]"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </Select>
          </>
        }
        footer={<Pagination page={page} pages={pages} total={total} onChange={onPage} />}
      >
        {loading ? (
          <GridSkeleton rows={6} cells={6} />
        ) : error ? (
          <GridMessage kind="error" title="Could not load payments" body={error} />
        ) : data.length === 0 ? (
          <GridMessage
            kind="empty"
            title={q || status ? "No payments match those filters" : "No payments yet"}
            body={
              q || status
                ? "Try a different name, course, order id or status."
                : "Razorpay orders appear here the moment a learner pays for a course."
            }
          />
        ) : (
          <GridScroll>
            <GridHead>
              <Th>User</Th>
              <Th>Course</Th>
              <Th align="right">Amount</Th>
              <Th>Status</Th>
              <Th>Order ID</Th>
              <Th>Date</Th>
            </GridHead>
            <tbody>
              {data.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <Link
                      to={`/users/${p.user_id}`}
                      className="block max-w-[160px] truncate text-sm font-medium text-ink hover:underline"
                    >
                      {p.user_name}
                    </Link>
                    <p className="tnum text-xs text-ink-faint">+91 {p.user_mobile}</p>
                  </Td>
                  <Td>
                    <Link
                      to={`/courses/${p.course_id}`}
                      className="block max-w-[240px] truncate text-sm font-medium text-ink hover:underline"
                    >
                      {p.course_title}
                    </Link>
                  </Td>
                  <Td align="right">
                    <p className="tnum whitespace-nowrap text-sm font-semibold text-ink">
                      ₹{p.amount_inr.toLocaleString("en-IN")}
                    </p>
                    <p className="tnum text-xs text-ink-faint">
                      {(p.amount / 100).toFixed(2)} {p.currency}
                    </p>
                  </Td>
                  <Td>
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  </Td>
                  <Td className="font-mono text-xs text-ink-muted">
                    {p.razorpay_order_id || "—"}
                  </Td>
                  <Td className="tnum whitespace-nowrap text-ink-muted">
                    {new Date(p.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </GridScroll>
        )}
      </GridPanel>
    </div>
  );
}