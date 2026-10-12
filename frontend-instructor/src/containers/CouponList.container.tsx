import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { couponIsExpired } from "../services/coupon.service";
import { useCouponList, useDeleteCoupon } from "../hooks/useCoupons";
import { CouponListView } from "../components/CouponListView";
import type { CourseOption, SharedCoupon } from "../types/coupon";

async function fetchCourseOptions(): Promise<CourseOption[]> {
  try {
    const data = await api<{ results: CourseOption[] } | CourseOption[]>(
      "/courses/mine/",
    );
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch {
    return [];
  }
}

const PER_PAGE = 12;

export function CouponListContainer() {
  const { data, isLoading } = useCouponList();
  const { data: courses = [] } = useQuery({
    queryKey: ["mine-courses"],
    queryFn: fetchCourseOptions,
  });
  const del = useDeleteCoupon();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "expired">("all");
  const [page, setPage] = useState(1);

  const list = data ?? [];

  const courseTitle = useMemo(() => {
    const map = new Map(courses.map((c) => [c.id, c.title]));
    return (id: number | null) =>
      id != null ? (map.get(id) ?? `Course ${id}`) : "All courses";
  }, [courses]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    return list.filter((c) => {
      if (status === "active" && !(c.is_active && !couponIsExpired(c)))
        return false;
      if (status === "expired" && !couponIsExpired(c)) return false;
      if (q && !c.code.includes(q)) return false;
      return true;
    });
  }, [list, query, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE,
  );

  // A filter that empties the current page must return the operator
  // to page 1, or they land on a blank list and think it broke.
  const applyQuery = (v: string) => {
    setQuery(v);
    setPage(1);
  };
  const applyStatus = (v: "all" | "active" | "expired") => {
    setStatus(v);
    setPage(1);
  };

  const handleDelete = (c: SharedCoupon) => {
    if (
      !window.confirm(
        `Delete coupon ${c.code}? Learners can no longer redeem it. This cannot be undone.`,
      )
    )
      return;
    del.mutate(c.id);
  };

  return (
    <CouponListView
      coupons={visible}
      total={filtered.length}
      empty={list.length === 0}
      page={safePage}
      pages={pages}
      query={query}
      onQuery={applyQuery}
      status={status}
      onStatus={applyStatus}
      onPage={setPage}
      loading={isLoading}
      courseTitle={courseTitle}
      onDelete={handleDelete}
      deletingId={del.variables as number | undefined}
    />
  );
}
