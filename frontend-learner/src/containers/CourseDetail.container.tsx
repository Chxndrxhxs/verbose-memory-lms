import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import type { SharedApiCourseDetail } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { loadRazorpayScript } from "../lib/razorpay";
import { CourseDetailView } from "../components/CourseDetailView";
import type { CourseDetail } from "../types/course";

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
  const user = useAuth((s) => s.user);

  const { data: enrollmentList = [] } = useQuery({
    queryKey: ["enrollment", id],
    queryFn: async () => {
      const res = await api<{ course: { id: number } }[] | { results: { course: { id: number } }[] }>("/me/courses");
      return Array.isArray(res) ? res : (res.results ?? []);
    },
    enabled: !!id && !!data,
  });
  const enrolled = enrollmentList.some((e) => String(e.course.id) === String(id));

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

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
      showToast("Payment successful! You're enrolled.");
    },
    onError: (e) => showToast(String(e)),
  });

  const processing = freeEnroll.isPending || mockVerify.isPending;

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
        { method: "POST", body: JSON.stringify({ course_id: Number(data.id) }) }
      );

      if (orderRes.free || orderRes.already_enrolled) {
        queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
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

  if (isLoading) return <p className="py-10 text-center text-sm text-zinc-500">Loading…</p>;
  if (isError) return <p className="py-10 text-center text-sm text-zinc-500">Couldn't load this course. <button onClick={() => refetch()} className="text-[#3478ff] underline">Retry</button> <Link to="/courses" className="text-[#3478ff] underline">Back</Link></p>;
  if (!data) return <p className="py-10 text-center text-sm">Course not found. <Link to="/courses" className="text-[#3478ff] underline">Back</Link></p>;

  return (
    <CourseDetailView
      data={data}
      enrolled={enrolled}
      processing={processing}
      open={open}
      toast={toast}
      onOpen={setOpen}
      onEnroll={handleEnroll}
    />
  );
}
