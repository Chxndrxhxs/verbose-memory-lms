import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Home } from "@masterlms/shared";
import type { Role } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile"),
});
const otpSchema = z.object({
  otp: z.string().regex(/^\d{4}$/, "Enter 4-digit OTP"),
});

type VerifyUser = {
  mobile: string;
  name: string;
  email: string;
  avatar?: string;
  age?: number;
  role?: string;
};

export default function Login() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [toast, setToast] = useState<string | null>(null);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const showToast = (msg: string, ms = 2200) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  const sendOtp = useMutation({
    mutationFn: (mobile: string) =>
      api<{ message: string; mock_code: string }>("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ mobile }),
      }),
    onSuccess: (res) => {
      showToast(`OTP sent: ${res.mock_code}`, 4000);
      setStep("otp");
    },
    onError: (e) => showToast(String(e)),
  });

  const verify = useMutation({
    mutationFn: async ({ mobile, code }: { mobile: string; code: string }) => {
      const data = await api<{ user: VerifyUser; is_new: boolean }>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ mobile, code }),
      });
      if (data.user.role !== "instructor") {
        try {
          await api("/auth/become-instructor", { method: "POST" });
        } catch { /* already instructor or failed — refetch decides */ }
      }
      try {
        const me = await api<{ name: string; email: string; mobile: string; avatar?: string; age?: number; role?: Role }>("/users/me");
        return { me, isNew: data.is_new, fallback: data.user };
      } catch {
        return { me: null, isNew: data.is_new, fallback: data.user };
      }
    },
    onSuccess: ({ me, isNew, fallback }) => {
      const role = me?.role ?? fallback.role;
      if (me) setUser(me);
      else
        setUser({
          name: fallback.name || "Instructor",
          email: fallback.email,
          mobile: fallback.mobile,
          avatar: fallback.avatar,
          age: fallback.age,
        });
      if (role !== "instructor") {
        showToast("Instructor access not granted for this account");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      if (isNew) nav("/complete-profile");
      else {
        showToast("Welcome back!");
        setTimeout(() => nav("/dashboard"), 400);
      }
    },
    onError: (e) => showToast(String(e)),
  });

  const phone = phoneForm.watch("phone");
  const loading = sendOtp.isPending || verify.isPending;

  return (
    <div className="min-h-screen w-full bg-[#f6f5f1] lg:grid lg:grid-cols-2">
      <div className="relative hidden h-screen lg:block">
        <img src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1400" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute left-10 top-10 flex items-center gap-2 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0f172a]">K</span>
          <span className="text-sm font-bold tracking-wide">QTNXT</span>
          <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-zinc-900">Teach</span>
        </div>
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="text-3xl font-extrabold leading-tight tracking-tight">Teach what you<br/>know.</p>
          <p className="mt-3 max-w-sm text-sm text-white/80">Share skills, grow your audience, earn on your terms. Built for working professionals.</p>
          <div className="mt-6 flex items-center gap-3 text-xs text-white/70">
            <span className="h-px w-8 bg-white/40" />
            <span>Join 2,400+ instructors already on QTNXT</span>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-col bg-white px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-white">K</span>
            <span className="text-sm font-bold">QTNXT</span>
            <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-zinc-900">Teach</span>
          </Link>
          <span className="hidden lg:block" />
          <Link to="/" className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900">
            <Home size={12} strokeWidth={2.5} />
            Home
          </Link>
        </div>

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Instructor login</h1>
            <p className="mt-2 text-sm text-zinc-500">{step === "phone" ? "Enter your mobile to get an OTP" : `OTP sent to +91 ${phone}`}</p>

            {step === "phone" ? (
              <form onSubmit={phoneForm.handleSubmit((v) => sendOtp.mutate(v.phone))} className="mt-8 space-y-5">
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Mobile number</label>
                  <div className="mt-1.5 flex rounded-xl border border-zinc-200 bg-zinc-50 transition focus-within:border-zinc-900 focus-within:bg-white">
                    <span className="flex items-center px-3 text-sm font-semibold text-zinc-700">+91</span>
                    <input
                      {...phoneForm.register("phone")}
                      onChange={(e) => phoneForm.setValue("phone", e.target.value.replace(/\D/g, "").slice(0, 10), { shouldValidate: true })}
                      placeholder="98765 43210"
                      className="w-full bg-transparent px-2 py-3 text-sm outline-none"
                    />
                  </div>
                  {phoneForm.formState.errors.phone && <p className="mt-1 text-xs text-red-600">{phoneForm.formState.errors.phone.message}</p>}
                </div>
                <button type="submit" disabled={loading} className="w-full rounded-full bg-[#0f172a] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60">
                  {sendOtp.isPending ? "Sending…" : "Send OTP"}
                </button>
                <p className="text-center text-xs text-zinc-400">Demo: OTP will appear in the toast below</p>
              </form>
            ) : (
              <form onSubmit={otpForm.handleSubmit((v) => verify.mutate({ mobile: phone, code: v.otp }))} className="mt-8 space-y-5">
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Enter OTP</label>
                  <input
                    {...otpForm.register("otp")}
                    onChange={(e) => otpForm.setValue("otp", e.target.value.replace(/\D/g, "").slice(0, 4), { shouldValidate: true })}
                    placeholder="1 2 3 4"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3.5 text-center text-xl tracking-[0.7em] outline-none transition focus:border-zinc-900 focus:bg-white"
                  />
                  {otpForm.formState.errors.otp && <p className="mt-1 text-xs text-red-600">{otpForm.formState.errors.otp.message}</p>}
                </div>
                <button type="submit" disabled={loading} className="w-full rounded-full bg-[#0f172a] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60">
                  {verify.isPending ? "Verifying…" : "Verify OTP"}
                </button>
                <button type="button" onClick={()=>setStep("phone")} className="w-full rounded-full border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">Change number</button>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-3 pt-8">
          <p className="text-center text-xs text-zinc-400">By continuing you agree to our Terms • Privacy</p>
          <Link to="/" className="flex items-center justify-center gap-2 rounded-full bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200">
            <Home size={14} strokeWidth={2.5} />
            Skip — go to Home
          </Link>
        </div>
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl">{toast}</div>}
    </div>
  );
}
