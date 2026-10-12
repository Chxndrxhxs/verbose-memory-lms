import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { couponService } from "../services/coupon.service";
import type { SharedCouponWrite } from "@masterlms/shared";

export function useCouponList() {
  return useQuery({
    queryKey: ["instructor", "coupons"],
    queryFn: () => couponService.list(),
  });
}

export function useCoupon(id: string) {
  return useQuery({
    queryKey: ["instructor", "coupon", id],
    queryFn: () => couponService.get(id),
    enabled: id !== "",
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SharedCouponWrite) => couponService.create(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["instructor", "coupons"] }),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SharedCouponWrite }) =>
      couponService.update(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["instructor", "coupons"] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => couponService.remove(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["instructor", "coupons"] }),
  });
}
