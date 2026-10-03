import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import type { SharedApiCourseDetail } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { useToggleWishlist, useWishlistIds } from "../hooks/useWishlist";
import { api } from "../lib/api";
import { loadRazorpayScript } from "../lib/razorpay";
import { CourseDetailView } from "../components/CourseDetailView";
import type { CourseDetail } from "../types/course";
import type {
  CouponQuote,
  GiftInput,
  GiftOutcome,
  RedeemOutcome,
} from "../types/promotions";

type Detail = CourseDetail;

type ApiCourse = SharedApiCourseDetail;

async function fetchCourse(id: string): Promise<Detail> {
  const c = await api<ApiCourse>(`/courses/${id}/`);
  const priceNum = Number(c.price);
  const sections = c.sections ?? [];
  return {
    id: String(c.id),
    title: c.title,
    subtitle: c.subtitle ?? "",
    instructor: c.instructor_name ?? "Instructor",
    instructorRole: c.instructor_role ?? "",
    avatar: c.instructor_avatar ?? "",
    price: priceNum === 0 ? "Free" : `₹${priceNum.toLocaleString("en-IN")}`,
    pricePaise: Math.round(priceNum * 100),
    level: c.level ?? "",
    rating: c.average_rating ? Number(c.average_rating).toFixed(1) : "",
    students: c.student_count != null ? `${c.student_count} students` : "",
    img: c.cover_image || "",
    preview: c.cover_image || "",
    description: c.description ?? "",
    learn: c.what_you_will_learn ?? [],
    curriculum: sections.map((s) => ({
      title: s.title,
      meta: `${(s.lessons ?? []).length} lecture${(s.lessons ?? []).length === 1 ? "" : "s"}`,
      lessons: (s.lessons ?? []).map((l) => ({ id: l.id, title: l.title, kind: l.kind, duration: l.duration })),
    })),
    includes: [],
  };
}

export function CourseDetailContainer() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["course", id], queryFn: () => fetchCourse(id!), enabled: !!id });
  const [open, setOpen] = useState<number>(0);
  const [toast, setToast] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<CouponQuote | null>(null);
  const user = useAuth((s) => s.user);

  const { data: enrollmentList = [] } = useQuery({
    queryKey: ["enrollment", id],
    queryFn: async () => {
      const res = await api<{ course: { id: number }; progress: number }[] | { results: { course: { id: number }; progress: number }[] }>("/me/courses");
      return Array.isArray(res) ? res : (res.results ?? []);
    },
    enabled: !!id && !!data,
  });
  const enrollment = enrollmentList.find((e) => String(e.course.id) === String(id));
  const enrolled = Boolean(enrollment);
  const progress = enrollment?.progress ?? 0;

  const { data: wishlistIds = [] } = useWishlistIds();
  const wishlisted = wishlistIds.includes(Number(id));
  const toggleWishlist = useToggleWishlist();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const handleToggleWishlist = () => {
    if (!id) return;
    toggleWishlist.mutate(
      { courseId: Number(id), wishlisted },
      {
        onSuccess: (nowWishlisted) =>
          showToast(nowWishlisted ? "Added to wishlist ♡" : "Removed from wishlist"),
        onError: (e) => showToast(e instanceof Error ? e.message : String(e)),
      },
    );
  };

  const freeEnroll = useMutation({
    mutationFn: () => api(`/courses/${data!.id}/enroll`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      showToast("Successfully enrolled! Start learning now.");
    },
    onError: (e) => showToast(String(e)),
  });

  const mockVerify = useMutation({
    mutationFn: (orderId: string) =>
      api("/payments/verify", {
        method: "POST",
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: "mock_signature",
          course_id: Number(data!.id),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setCoupon(null);
      showToast("Payment successful! You're enrolled.");
    },
    onError: (e) => showToast(String(e)),
  });

  const processing = freeEnroll.isPending || mockVerify.isPending;

  const validateCoupon = async (code: string): Promise<CouponQuote> => {
    if (!data) throw new Error("Course not loaded");
    const quote = await api<CouponQuote>("/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, course_id: Number(data.id) }),
    });
    setCoupon(quote);
    return quote;
  };

  const redeemGift = async (code: string): Promise<RedeemOutcome> => {
    const res = await api<RedeemOutcome>("/gifts/claim", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    queryClient.invalidateQueries({ queryKey: ["enrollment"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    return res;
  };

  const purchaseGift = async (input: GiftInput): Promise<GiftOutcome> => {
    if (!data) throw new Error("Course not loaded");
    const trimmedCoupon = input.couponCode.trim();
    const res = await api<{
      gift: { code: string };
      free?: boolean;
      claimed?: boolean;
      enrolled?: boolean;
      mock?: boolean;
      order_id?: string;
      amount?: number;
      currency?: string;
      key_id?: string;
    }>("/gifts", {
      method: "POST",
      body: JSON.stringify({
        course_id: Number(data.id),
        recipient_email: input.recipientEmail.trim(),
        recipient_name: input.recipientName.trim(),
        message: input.message.trim(),
        ...(trimmedCoupon ? { coupon_code: trimmedCoupon } : {}),
      }),
    });

    if (res.free) {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      showToast("Gift sent! The recipient will be enrolled automatically.");
      return {
        giftCode: res.gift.code,
        free: true,
        claimed: res.claimed ?? false,
        enrolled: res.enrolled ?? false,
      };
    }

    const orderId = res.order_id ?? "";
    const verifyBody = (extra: Record<string, string>) => ({
      method: "POST",
      body: JSON.stringify({
        razorpay_order_id: orderId,
        course_id: Number(data.id),
        ...extra,
      }),
    });
    type GiftVerify = { gift_code?: string; claimed?: boolean; enrolled?: boolean };

    if (res.mock) {
      showToast("Test mode: confirming gift payment…");
      const verified = await api<GiftVerify>(
        "/payments/verify",
        verifyBody({
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: "mock_signature",
        }),
      );
      showToast("Gift payment successful! Your gift code is ready.");
      return {
        giftCode: verified.gift_code ?? res.gift.code,
        free: false,
        claimed: verified.claimed ?? false,
        enrolled: verified.enrolled ?? false,
      };
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) throw new Error("Failed to load Razorpay");
    return await new Promise<GiftOutcome>((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: res.key_id ?? "",
        amount: res.amount ?? 0,
        currency: res.currency ?? "INR",
        name: "QTNXT",
        description: `Gift: ${data.title}`,
        order_id: orderId,
        handler: async (r: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verified = await api<GiftVerify>("/payments/verify", verifyBody({ ...r }));
            showToast("Gift payment successful! Your gift code is ready.");
            resolve({
              giftCode: verified.gift_code ?? res.gift.code,
              free: false,
              claimed: verified.claimed ?? false,
              enrolled: verified.enrolled ?? false,
            });
          } catch (e) {
            showToast(String(e));
            reject(e);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.mobile || "",
        },
        theme: { color: "#0f172a" },
        modal: {
          ondismiss: () => {
            showToast("Payment cancelled");
            reject(new Error("Payment cancelled"));
          },
        },
      });
      rzp.open();
    });
  };

  const handleEnroll = async () => {
    if (!data || enrolled || processing) return;
    const isFree = data.price === "Free";

    if (isFree) {
      freeEnroll.mutate();
      return;
    }

    // Paid course: Razorpay flow
    try {
      const orderRes = await api<{ order_id: string; amount: number; currency: string; key_id: string; mock?: boolean; free?: boolean; already_enrolled?: boolean }>(
        "/payments/create-order",
        {
          method: "POST",
          body: JSON.stringify({
            course_id: Number(data.id),
            ...(coupon ? { coupon_code: coupon.code } : {}),
          }),
        }
      );

      if (orderRes.free || orderRes.already_enrolled) {
        queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
        setCoupon(null);
        showToast(orderRes.already_enrolled ? "Already enrolled." : "Successfully enrolled!");
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay");

      // mock mode (no keys configured) - verify immediately
      if (orderRes.mock) {
        showToast("Test mode: confirming payment…");
        mockVerify.mutate(orderRes.order_id);
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: orderRes.key_id,
          amount: orderRes.amount,
          currency: orderRes.currency,
          name: "QTNXT",
          description: data.title,
          order_id: orderRes.order_id,
          handler: async (res: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              await api("/payments/verify", {
                method: "POST",
                body: JSON.stringify({ ...res, course_id: Number(data.id) }),
              });
              queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
              queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
              setCoupon(null);
              showToast("Payment successful! You're enrolled.");
              resolve();
            } catch (e) {
              showToast(String(e));
              reject(e);
            }
          },
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: user?.mobile || "",
          },
          theme: { color: "#0f172a" },
          modal: {
            ondismiss: () => {
              showToast("Payment cancelled");
              reject(new Error("Payment cancelled"));
            },
          },
        });
        rzp.open();
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== "Payment cancelled") showToast(msg);
    }
  };

  if (isLoading) return <p className="py-10 text-center text-sm text-ink-muted">Loading…</p>;
  if (isError) return <p className="py-10 text-center text-sm text-ink-muted">Couldn't load this course. <button type="button" onClick={() => refetch()} className="font-semibold text-ink underline">Retry</button> <Link to="/courses" className="font-semibold text-ink underline">Back</Link></p>;
  if (!data) return <p className="py-10 text-center text-sm text-ink-muted">Course not found. <Link to="/courses" className="font-semibold text-ink underline">Back</Link></p>;

  return (
    <CourseDetailView
      data={data}
      enrolled={enrolled}
      progress={progress}
      processing={processing}
      open={open}
      toast={toast}
      onOpen={setOpen}
      onEnroll={handleEnroll}
      onNotify={showToast}
      coupon={coupon}
      onValidateCoupon={validateCoupon}
      onRemoveCoupon={() => setCoupon(null)}
      onPurchaseGift={purchaseGift}
      onRedeemGift={redeemGift}
      wishlisted={wishlisted}
      onToggleWishlist={handleToggleWishlist}
    />
  );
}
