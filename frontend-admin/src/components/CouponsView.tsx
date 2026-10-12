import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "@masterlms/shared";
import type { AdminCoupon, CouponScope } from "../types/admin";
import type { Tone } from "./Badge";
import { PageHeader } from "./Panel";
import { Badge } from "./Badge";
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

function formatDiscount(c: AdminCoupon): string {
  if (c.discount_type === "percent") return `${c.discount_value}%`;
  const inr = (c.discount_value / 100).toLocaleString("en-IN");
  return c.max_discount_paise
    ? `₹${inr} (cap ₹${(c.max_discount_paise / 100).toLocaleString("en-IN")})`
    : `₹${inr}`;
}

function formatWindow(c: AdminCoupon): string {
  const fmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        })
      : "";
  const from = fmt(c.valid_from);
  const to = fmt(c.valid_to);
  if (!from && !to) return "—";
  if (from && to) return `${from} – ${to}`;
  return to ? `until ${to}` : `from ${from}`;
}

function statusOf(c: AdminCoupon): { tone: Tone; label: string } {
  const now = Date.now();
  if (c.valid_to && new Date(c.valid_to).getTime() < now)
    return { tone: "halt", label: "Expired" };
  if (c.valid_from && new Date(c.valid_from).getTime() > now)
    return { tone: "hold", label: "Scheduled" };
  return c.is_active ? { tone: "live", label: "Active" } : { tone: "muted", label: "Inactive" };
}

export function CouponsView({
  data,
  total,
  pages,
  page,
  onPage,
  q,
  onSearch,
  isActive,
  onIsActive,
  appliesTo,
  onAppliesTo,
  searchLoading,
  loading,
  error,
  onDelete,
  deleting,
  deletingId,
}: {
  data: AdminCoupon[];
  total: number;
  pages: number;
  page: number;
  onPage: (p: number) => void;
  q: string;
  onSearch: (v: string) => void;
  isActive: "true" | "false" | "";
  onIsActive: (v: "true" | "false" | "") => void;
  appliesTo: CouponScope | "";
  onAppliesTo: (v: CouponScope | "") => void;
  searchLoading: boolean;
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
  deleting: boolean;
  deletingId?: number;
}) {
  const [target, setTarget] = useState<AdminCoupon | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        description="Discount codes learners apply at checkout. Set a validity window and they expire on their own."
        action={
          <Link
            to="/coupons/new"
            className="inline-flex h-9 items-center gap-2 border border-ink bg-ink px-3 text-xs font-semibold text-paper-raised transition-colors hover:bg-ink/88"
          >
            New coupon
          </Link>
        }
      />

      <GridPanel
        toolbar={
          <>
            <SearchInput
              value={q}
              onChange={onSearch}
              placeholder="Search by code"
              busy={searchLoading}
            />
            <Select
              value={isActive}
              onChange={(e) => onIsActive(e.target.value as "true" | "false" | "")}
              aria-label="Filter by status"
              className="w-auto min-w-[140px]"
            >
              <option value="">Any status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
            <Select
              value={appliesTo}
              onChange={(e) => onAppliesTo(e.target.value as CouponScope | "")}
              aria-label="Filter by scope"
              className="w-auto min-w-[140px]"
            >
              <option value="">Any scope</option>
              <option value="all">All courses</option>
              <option value="course">One course</option>
              <option value="pack">One pack</option>
            </Select>
          </>
        }
        footer={
          <Pagination page={page} pages={pages} total={total} onChange={onPage} />
        }
      >
        {loading ? (
          <GridSkeleton rows={6} cells={7} />
        ) : error ? (
          <GridMessage kind="error" title="Could not load coupons" body={error} />
        ) : data.length === 0 ? (
          <GridMessage
            kind="empty"
            title={q || isActive || appliesTo ? "No coupons match those filters" : "No coupons yet"}
            body={
              q || isActive || appliesTo
                ? "Try a different code, status or scope. Clear the filters to see everyone."
                : "Create a discount code and it shows up here."
            }
          />
        ) : (
          <GridScroll>
            <GridHead>
              <Th>Code</Th>
              <Th>Discount</Th>
              <Th>Scope</Th>
              <Th>Validity</Th>
              <Th>Usage</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </GridHead>
            <tbody>
              {data.map((c) => {
                const status = statusOf(c);
                return (
                  <Tr key={c.id}>
                    <Td>
                      <Link
                        to={`/coupons/${c.id}`}
                        className="block max-w-[180px] truncate font-mono text-sm font-semibold text-ink hover:underline"
                      >
                        {c.code}
                      </Link>
                    </Td>
                    <Td className="tnum whitespace-nowrap text-ink-muted">
                      {formatDiscount(c)}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-muted">
                      {c.applies_to === "all"
                        ? "All courses"
                        : c.applies_to === "course"
                          ? "One course"
                          : "One pack"}
                    </Td>
                    <Td className="tnum whitespace-nowrap text-ink-muted">
                      {formatWindow(c)}
                    </Td>
                    <Td className="tnum whitespace-nowrap text-ink-muted">
                      {c.usage_limit
                        ? `${c.usage_count} / ${c.usage_limit}`
                        : `${c.usage_count} used`}
                    </Td>
                    <Td>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </Td>
                    <Td align="right">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/coupons/${c.id}`}
                          className="inline-flex h-8 items-center border border-transparent px-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-rule hover:bg-paper-raised hover:text-ink"
                        >
                          Edit
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          onClick={() => setTarget(c)}
                          disabled={deleting && deletingId === c.id}
                          aria-label={`Delete ${c.code}`}
                        >
                          <Trash2 size={15} strokeWidth={2.2} aria-hidden />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </GridScroll>
        )}
      </GridPanel>

      <ConfirmDialog
        open={target !== null}
        title="Delete this coupon?"
        description={`Permanently remove ${target?.code}? Learners can no longer redeem it, and past redemptions stay recorded. This cannot be undone.`}
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
