import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "@masterlms/shared";
import type { SharedCoupon } from "@masterlms/shared";
import { couponIsExpired } from "../services/coupon.service";
import { PageHeader, Panel } from "./Panel";
import { Badge, type Tone } from "./Badge";
import { Button } from "./Button";
import { SearchInput, Select } from "./Controls";
import { ListMessage, ListPanel, Pager, SkeletonRows } from "./DataGrid";

function statusOf(c: SharedCoupon): { tone: Tone; label: string } {
  if (couponIsExpired(c)) return { tone: "halt", label: "Expired" };
  if (c.valid_from && new Date(c.valid_from).getTime() > Date.now())
    return { tone: "hold", label: "Scheduled" };
  return c.is_active ? { tone: "live", label: "Active" } : { tone: "muted", label: "Inactive" };
}

function formatDiscount(c: SharedCoupon): string {
  if (c.discount_type === "percent") return `${c.discount_value}% off`;
  return `₹${(c.discount_value / 100).toLocaleString("en-IN")} off`;
}

function formatWindow(c: SharedCoupon): string {
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
  if (!from && !to) return "No window set";
  if (from && to) return `${from} – ${to}`;
  return to ? `until ${to}` : `from ${from}`;
}

export function CouponListView({
  coupons,
  total,
  empty,
  page,
  pages,
  query,
  onQuery,
  status,
  onStatus,
  onPage,
  loading,
  courseTitle,
  onDelete,
  deletingId,
}: {
  coupons: SharedCoupon[];
  total: number;
  empty: boolean;
  page: number;
  pages: number;
  query: string;
  onQuery: (v: string) => void;
  status: "all" | "active" | "expired";
  onStatus: (v: "all" | "active" | "expired") => void;
  onPage: (p: number) => void;
  loading: boolean;
  courseTitle: (id: number | null) => string;
  onDelete: (c: SharedCoupon) => void;
  deletingId?: number;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Promotions"
        title="Your coupons"
        description="Discount codes for your courses. Set a validity window and the coupon switches itself off when it closes."
        action={
          <Link
            to="/coupons/new"
            className="inline-flex h-10 items-center gap-2 border border-ink bg-ink px-4 text-sm font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
          >
            New coupon
          </Link>
        }
      />

      {loading ? (
        <Panel flush>
          <SkeletonRows rows={5} />
        </Panel>
      ) : empty ? (
        <Panel flush>
          <ListMessage
            kind="empty"
            title="No coupons yet"
            body="Create a discount code for one of your courses — give it a start and end date and it turns itself off when the window closes."
            action={
              <Link
                to="/coupons/new"
                className="inline-flex h-9 items-center border border-ink bg-ink px-4 text-xs font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
              >
                Create your first coupon
              </Link>
            }
          />
        </Panel>
      ) : (
        <ListPanel
          toolbar={
            <>
              <SearchInput
                value={query}
                onChange={onQuery}
                placeholder="Search by code"
              />
              <Select
                value={status}
                onChange={(e) =>
                  onStatus(e.target.value as "all" | "active" | "expired")
                }
                aria-label="Filter by status"
                className="w-auto min-w-[150px]"
              >
                <option value="all">All coupons</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </Select>
            </>
          }
          footer={
            <Pager
              page={page}
              pages={pages}
              total={total}
              onChange={onPage}
              noun="coupon"
            />
          }
        >
          {coupons.length === 0 ? (
            <ListMessage
              kind="empty"
              title="No coupons match those filters"
              body="Try a different code or status, or clear the filters."
            />
          ) : (
            <ul className="divide-y divide-rule">
              {coupons.map((c) => {
                const status = statusOf(c);
                return (
                  <li
                    key={c.id}
                    className="row-hover flex flex-wrap items-center gap-4 px-4 py-3.5 sm:flex-nowrap"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/coupons/${c.id}/edit`}
                        className="block max-w-[240px] truncate font-mono text-sm font-semibold text-ink hover:underline"
                      >
                        {c.code}
                      </Link>
                      <p className="tnum mt-0.5 truncate text-xs text-ink-faint">
                        {courseTitle(c.course)} · {formatDiscount(c)}
                      </p>
                    </div>

                    <div className="hidden w-44 shrink-0 sm:block">
                      <p className="tnum truncate text-xs text-ink-muted">
                        {formatWindow(c)}
                      </p>
                      <p className="text-[11px] text-ink-faint">validity</p>
                    </div>

                    <div className="hidden w-24 shrink-0 text-right sm:block">
                      <p className="tnum text-sm font-semibold text-ink">
                        {c.usage_limit
                          ? `${c.usage_count} / ${c.usage_limit}`
                          : `${c.usage_count}`}
                      </p>
                      <p className="text-[11px] text-ink-faint">redeemed</p>
                    </div>

                    <div className="shrink-0">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Link
                        to={`/coupons/${c.id}/edit`}
                        className="inline-flex h-8 items-center gap-1.5 border border-rule px-2.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-slate-sunk hover:text-ink"
                      >
                        <Pencil size={14} strokeWidth={2.25} aria-hidden />
                        Edit
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onDelete(c)}
                        disabled={deletingId === c.id}
                      >
                        <Trash2 size={14} strokeWidth={2.25} aria-hidden />
                        Delete
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ListPanel>
      )}
    </div>
  );
}
