export type CouponQuote = {
  code: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  discount_paise: number;
  original_amount_paise: number;
  final_amount_paise: number;
  currency: string;
};

export type GiftInput = {
  recipientEmail: string;
  recipientName: string;
  message: string;
  couponCode: string;
};

export type GiftOutcome = {
  giftCode: string;
  free: boolean;
  claimed: boolean;
  enrolled: boolean;
};

export type RedeemOutcome = {
  gift_code: string;
  claimed: boolean;
  kind: "course" | "pack";
  item_id: number;
  item_title: string;
  enrollment_id?: number;
  purchase_id?: number;
};
