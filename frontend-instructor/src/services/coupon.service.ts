import { api } from "../lib/api";
import type { SharedCoupon, SharedCouponWrite } from "@masterlms/shared";

/** A coupon is expired once its valid_to window has closed. */
export function couponIsExpired(c: SharedCoupon): boolean {
  return Boolean(c.valid_to && new Date(c.valid_to).getTime() < Date.now());
}

export const couponService = {
  async list(): Promise<SharedCoupon[]> {
    try {
      // The endpoint returns a bare array unless ?page is sent.
      return await api<SharedCoupon[]>("/instructor/coupons");
    } catch {
      return [];
    }
  },
  async get(id: string): Promise<SharedCoupon> {
    return api<SharedCoupon>(`/instructor/coupons/${id}`);
  },
  async create(payload: SharedCouponWrite): Promise<SharedCoupon> {
    return api<SharedCoupon>("/instructor/coupons", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async update(id: number, payload: SharedCouponWrite): Promise<SharedCoupon> {
    return api<SharedCoupon>(`/instructor/coupons/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  async remove(id: number): Promise<void> {
    await api(`/instructor/coupons/${id}`, { method: "DELETE" });
  },
};
