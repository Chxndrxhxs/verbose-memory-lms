declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void; on: (event: string, handler: (res: unknown) => void) => void };
  }
}

export type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (res: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
};

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
