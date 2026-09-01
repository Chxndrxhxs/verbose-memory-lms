import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Play } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { loadRazorpayScript } from "../lib/razorpay";

type Detail = {
  id: string;
  title: string;
  subtitle: string;
  instructor: string;
  instructorRole: string;
  avatar: string;
  price: string;
  originalPrice?: string;
  rating: string;
  students: string;
  img: string;
  preview: string;
  description: string;
  learn: string[];
  curriculum: { title: string; meta: string; lessons: string[] }[];
  includes: string[];
};

const fallbackDB: Record<string, Detail> = {
  "ux-fundamentals": { id: "ux-fundamentals", title: "UX/UI Design Fundamentals", subtitle: "Design intuitive interfaces and delightful experiences with hands-on projects.", instructor: "Dr. Ayse Sharma", instructorRole: "Senior Product Designer, Figma", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80", price: "Free", rating: "4.9", students: "12,438 students", img: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&auto=format&fit=crop&q=80", preview: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&auto=format&fit=crop&q=80", description: "Master the basics of user experience and interface design with real-world projects.", learn: ["Wireframing & prototyping in Figma", "User research & personas", "Design systems & tokens", "Usability testing & iteration", "Portfolio-ready case study", "Feedback from mentors"], curriculum: [{ title: "Getting started", meta: "4 lectures • 42 min", lessons: ["What is UX?", "Design thinking process", "Tools setup", "Your first brief"] }, { title: "Wireframing & prototyping", meta: "5 lectures • 1h 20m", lessons: ["Low-fi wireframes", "High-fi mockups", "Interactive prototype", "Design handoff"] }], includes: ["3h 20m on-demand video", "6 downloadable resources", "1 practice project", "Certificate of completion", "Lifetime access"] },
};

type ApiCourse = { id: number; title: string; subtitle: string; description: string; category: string; price: string; cover_image: string; level: string; average_rating: string; what_you_will_learn: string[]; instructor_name: string; instructor_avatar: string; instructor_role: string; student_count: number; sections: { id: number; title: string; lessons: { id: number; title: string; duration: string; kind: string; resource_url: string }[] }[] };

async function fetchCourse(id: string): Promise<Detail | null> {
  // try real API first (numeric id)
  if (/^\d+$/.test(id)) {
    try {
      const c = await api<ApiCourse>(`/courses/${id}/`);
      const priceNum = Number(c.price);
      const sections = c.sections ?? [];
      return {
        id: String(c.id),
        title: c.title,
        subtitle: c.subtitle || (c.category === "Engineering" ? "Build complete web apps — from landing page to deployment." : "Learn with clarity and confidence."),
        instructor: c.instructor_name || "Knoova Instructor",
        instructorRole: c.instructor_role || (c.category === "Engineering" ? "Senior Engineer, Knoova" : "Senior Product Designer, Figma"),
        avatar: c.instructor_avatar || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
        price: priceNum === 0 ? "Free" : `$${priceNum}`,
        rating: c.average_rating ? Number(c.average_rating).toFixed(1) : "4.8",
        students: `${c.student_count ?? 0} students`,
        img: c.cover_image || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&auto=format&fit=crop&q=80",
        preview: c.cover_image || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&auto=format&fit=crop&q=80",
        description: c.description || "No description yet.",
        learn: (c.what_you_will_learn && c.what_you_will_learn.length > 0) ? c.what_you_will_learn : (c.category === "Engineering"
          ? ["Build frontends with HTML/CSS/Tailwind & React", "Create backends with Python & Django REST", "Design & query MySQL databases", "Implement OTP auth & roles", "Add course CRUD, enroll & progress", "Deploy with Docker & Nginx"]
          : ["Wireframing & prototyping in Figma", "User research & personas", "Design systems & tokens", "Usability testing & iteration", "Portfolio-ready case study", "Feedback from mentors"]),
        curriculum: sections.map((s) => ({ title: s.title, meta: `${s.lessons.length} lectures • 30 min`, lessons: s.lessons.map((l) => l.title) })),
        includes: ["3h 20m on-demand video", "6 downloadable resources", "1 practice project", "Certificate of completion", "Lifetime access"],
      };
    } catch { /* fallback to mock below */ }
  }
  return new Promise((res) => setTimeout(() => res(fallbackDB[id] ?? null), 200));
}

export function CourseDetailContainer() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({ queryKey: ["course", id], queryFn: () => fetchCourse(id!), enabled: !!id });
  const [open, setOpen] = useState<number>(0);
  const [enrolled, setEnrolled] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const user = useAuth((s) => s.user);

  useEffect(() => {
    if (!id || !data) return;
    api<{ course: ApiCourse }[] | { results: unknown }>(`/me/courses`).then((res: unknown) => {
      const list = Array.isArray(res) ? res as { course: { id: number } }[] : [];
      if (list.some((e) => String(e.course.id) === id)) setEnrolled(true);
    }).catch(() => {});
  }, [id, data]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const handleEnroll = async () => {
    if (!data || enrolled || processing) return;
    const isFree = data.price === "Free";

    if (isFree) {
      setProcessing(true);
      try {
        await api(`/courses/${data.id}/enroll`, { method: "POST" });
        setEnrolled(true);
        showToast("Successfully enrolled! Start learning now.");
      } catch (e) {
        showToast(String(e));
      } finally {
        setProcessing(false);
      }
      return;
    }

    // Paid course: Razorpay flow
    setProcessing(true);
    try {
      const orderRes = await api<{ order_id: string; amount: number; currency: string; key_id: string; mock?: boolean; free?: boolean; already_enrolled?: boolean }>(
        "/payments/create-order",
        { method: "POST", body: JSON.stringify({ course_id: Number(data.id) }) }
      );

      if (orderRes.free || orderRes.already_enrolled) {
        setEnrolled(true);
        showToast(orderRes.already_enrolled ? "Already enrolled." : "Successfully enrolled!");
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay");

      // mock mode (no keys configured) - verify immediately
      if (orderRes.mock) {
        showToast("Test mode: confirming payment…");
        await api("/payments/verify", {
          method: "POST",
          body: JSON.stringify({
            razorpay_order_id: orderRes.order_id,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: "mock_signature",
            course_id: Number(data.id),
          }),
        });
        setEnrolled(true);
        showToast("Payment successful! You're enrolled.");
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: orderRes.key_id,
          amount: orderRes.amount,
          currency: orderRes.currency,
          name: "Knoova",
          description: data.title,
          order_id: orderRes.order_id,
          handler: async (res: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              await api("/payments/verify", {
                method: "POST",
                body: JSON.stringify({ ...res, course_id: Number(data.id) }),
              });
              setEnrolled(true);
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
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) return <p className="py-10 text-center text-sm text-zinc-500">Loading…</p>;
  if (!data) return <p className="py-10 text-center text-sm">Course not found. <Link to="/courses" className="text-[#3478ff] underline">Back</Link></p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* LEFT */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-[#3478ff] px-2.5 py-1 text-white">Bestseller</span>
          <span className="rounded-full bg-yellow-400 px-2.5 py-1 text-zinc-900">Updated May 2026</span>
          <span className="rounded-full border bg-white px-2.5 py-1 text-zinc-700">Beginner • 3h 20m</span>
        </div>

        <h1 className="mt-4 text-[28px] font-extrabold leading-tight tracking-tight sm:text-[32px]">{data.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{data.subtitle}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold"><span className="text-amber-400">★★★★★</span> {data.rating}</span>
          <span className="text-zinc-500">({data.students})</span>
          <span className="h-3 w-px bg-zinc-200" />
          <span className="flex items-center gap-1.5"><img src={data.avatar} alt="" className="h-6 w-6 rounded-full object-cover" /> <span className="font-medium text-zinc-700">{data.instructor}</span></span>
        </div>

        {/* Mobile preview card */}
        <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm lg:hidden">
          <div className="relative"><img src={data.preview} alt="" className="h-48 w-full object-cover" /><button className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow"><Play size={20} strokeWidth={2.5} className="ml-0.5" /></button></div>
          <div className="p-4">
            <div className="flex items-baseline gap-2"><span className="text-2xl font-black">{data.price}</span>{data.originalPrice && <span className="text-sm text-zinc-400 line-through">{data.originalPrice}</span>}{data.originalPrice && <span className="text-xs font-semibold text-emerald-600">50% off</span>}</div>
            {enrolled ? (
              <Link to={`/learn/${data.id}`} className="mt-3 block w-full rounded-full bg-emerald-600 py-3 text-center text-sm font-bold text-white">Start learning →</Link>
            ) : (
              <button onClick={handleEnroll} disabled={processing} className="mt-3 w-full rounded-full bg-[#0f172a] py-3 text-sm font-bold text-white disabled:opacity-60">
                {processing ? "Processing…" : `Enroll now — ${data.price === "Free" ? "Free" : "Get access"}`}
              </button>
            )}
            <p className="mt-2 text-center text-[11px] text-zinc-500">30-day money-back guarantee</p>
          </div>
        </div>

        {/* What you'll learn — Udemy style but soft */}
        <div className="mt-6 rounded-2xl border bg-[#fdfdfc] p-5">
          <h3 className="text-sm font-bold">What you’ll learn</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.learn.map((l) => (
              <div key={l} className="flex gap-2 text-xs leading-relaxed text-zinc-700"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">✓</span>{l}</div>
            ))}
          </div>
        </div>

        {/* Curriculum */}
        <div className="mt-6">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Course content</h3><span className="text-xs text-zinc-500">{data.curriculum.length} sections • {data.curriculum.reduce((a, c) => a + c.lessons.length, 0)} lectures</span></div>
          <div className="mt-3 overflow-hidden rounded-2xl border bg-white">
            {data.curriculum.map((sec, i) => (
              <div key={sec.title} className="border-b last:border-0">
                <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between bg-zinc-50 px-4 py-3 text-left hover:bg-zinc-100">
                  <span className="text-sm font-semibold">{sec.title}</span><span className="flex items-center gap-2 text-xs text-zinc-500">{sec.meta}<span className={`flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs ${open === i ? "bg-[#3478ff] text-white" : ""}`}>{open === i ? "−" : "+"}</span></span>
                </button>
                {open === i && <ul className="px-4 py-2">{sec.lessons.map((l) => (<li key={l} className="flex items-center gap-2 py-2 text-xs text-zinc-700"><span className="text-zinc-400">▶</span> {l}<span className="ml-auto text-[11px] text-zinc-400">06:20</span></li>))}</ul>}
              </div>
            ))}
          </div>
        </div>

        {/* Description + instructor */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold">Description</h3><p className="mt-2 text-sm leading-relaxed text-zinc-600">{data.description}</p>
          <div className="mt-5 flex gap-3 rounded-xl bg-zinc-50 p-4">
            <img src={data.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
            <div><p className="text-sm font-bold">{data.instructor}</p><p className="text-xs text-zinc-500">{data.instructorRole}</p><p className="mt-1 flex items-center gap-1 text-xs text-amber-400">★★★★★ <span className="text-zinc-500">4.9 Instructor rating</span></p></div>
          </div>
        </div>
      </div>

      {/* RIGHT — sticky enroll card (Udemy pattern) */}
      <div className="hidden lg:block">
        <div className="sticky top-[88px] overflow-hidden rounded-[20px] border bg-white shadow-sm">
          <div className="relative"><img src={data.preview} alt="" className="h-44 w-full object-cover" /><button className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lg"><Play size={20} strokeWidth={2.5} className="ml-0.5" /></button><span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">Preview this course</span></div>
          <div className="p-5">
            <div className="flex items-baseline gap-2"><span className="text-[28px] font-black tracking-tight">{data.price}</span>{data.originalPrice && <span className="text-sm text-zinc-400 line-through">{data.originalPrice}</span>}{data.originalPrice && <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-zinc-900">50% off</span>}</div>
            <p className="text-xs text-emerald-600 font-medium">3 days left at this price!</p>
            {enrolled ? (
              <Link to={`/learn/${data.id}`} className="mt-4 block w-full rounded-full bg-emerald-600 py-3 text-center text-sm font-bold text-white hover:bg-emerald-700">Start learning →</Link>
            ) : (
              <button onClick={handleEnroll} disabled={processing} className="mt-4 w-full rounded-full bg-[#0f172a] py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-60">
                {processing ? "Processing…" : "Enroll now"}
              </button>
            )}
            <button className="mt-2 w-full rounded-full border py-2.5 text-sm font-semibold hover:bg-zinc-50">Add to wishlist ♡</button>
            <p className="mt-2 text-center text-[11px] text-zinc-500">30-day money-back guarantee • Full lifetime access</p>

            <div className="mt-5 rounded-xl bg-zinc-50 p-4">
              <p className="text-xs font-bold">This course includes:</p>
              <ul className="mt-2 space-y-1.5 text-xs text-zinc-600">
                {data.includes.map((it) => (<li key={it} className="flex gap-2"><span>●</span> {it}</li>))}
              </ul>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-full border py-2 text-xs font-medium">Share</button>
              <button className="flex-1 rounded-full border py-2 text-xs font-medium">Gift</button>
              <button className="flex-1 rounded-full border py-2 text-xs font-medium">Coupon</button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
