export type { SharedCoupon, SharedCouponWrite } from "@masterlms/shared";

export interface CourseOption {
  id: number;
  title: string;
}

export interface CouponFormValues {
  code: string;
  discountType: "percent" | "flat";
  discountValue: string;
  maxDiscount: string;
  minOrder: string;
  usageLimit: string;
  perUserLimit: string;
  courseId: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}
