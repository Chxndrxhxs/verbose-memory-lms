import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Lock } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import type { AdminRole } from "../types/admin";

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile"),
});
const otpSchema = z.object({
  otp: z.string().regex(/^\d{4}$/, "Enter 4-digit OTP"),
});

type VerifyUser = { name: string; email: string; mobile: string; role: AdminRole; avatar?: string };

export default function Login() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [toast, setToast] = useState<string | null>(null);
  const verifyDone = useRef(false);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const showToast = (msg: string, ms = 2800) => {
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
      verifyDone.current = false;
      showToast(`OTP sent (demo): ${res.mock_code}`);
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
      if (data.user.role !== "admin") {
        await api("/auth/become-admin", { method: "POST" });
      }
      const me = await api<VerifyUser>("/users/me");
      return { me, isNew: data.is_new };
    },
    onSuccess: ({ me }) => {
      verifyDone.current = true;
      setUser({
        name: me.name || "Admin",
        email: me.email,
        mobile: me.mobile,
        role: "admin",
        avatar: me.avatar,
      });
      nav("/");
    },
    onError: (e) => showToast(String(e)),
  });

  const phone = phoneForm.watch("phone");
  const loading = sendOtp.isPending || verify.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-black text-[#0f172a]">Q</span>
          <div className="leading-none">
            <p className="text-lg font-bold tracking-tight text-white">QTNXT Admin</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Control panel</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f172a] text-white">
              <Lock size={16} strokeWidth={2.5} />
            </span>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">Admin sign in</h1>
              <p className="text-xs text-zinc-500">
                {step === "phone" ? "Enter your admin mobile to get an OTP" : `OTP sent to +91 ${phone}`}
              </p>
            </div>
          </div>

          {step === "phone" ? (
            <form onSubmit={phoneForm.handleSubmit((v) => sendOtp.mutate(v.phone))} className="mt-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-zinc-700">Mobile number</label>
                <div className="mt-1.5 flex rounded-xl border border-zinc-200 bg-zinc-50 focus-within:border-zinc-900 focus-within:bg-white">
                  <span className="flex items-center px-3 text-sm font-semibold text-zinc-700">+91</span>
                  <input
                    {...phoneForm.register("phone")}
                    onChange={(e) => phoneForm.setValue("phone", e.target.value.replace(/\D/g, "").slice(0, 10), { shouldValidate: true })}
                    placeholder="98765 43210"
                    className="w-full bg-transparent px-2 py-3 text-sm outline-none"
                  />
                </div>
                {phoneForm.formState.errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{phoneForm.formState.errors.phone.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#0f172a] py-3.5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {sendOtp.isPending ? "Sending…" : "Send OTP"}
              </button>
              <p className="text-center text-[11px] text-zinc-400">
                Only accounts with the admin role can access this panel.
              </p>
            </form>
          ) : (
            <form
              onSubmit={otpForm.handleSubmit((v) => {
                if (verifyDone.current || verify.isPending) return;
                verify.mutate({ mobile: phone, code: v.otp });
              })}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="text-xs font-semibold text-zinc-700">Enter OTP</label>
                <input
                  {...otpForm.register("otp")}
                  disabled={verify.isPending || verifyDone.current}
                  onChange={(e) => otpForm.setValue("otp", e.target.value.replace(/\D/g, "").slice(0, 4), { shouldValidate: true })}
                  placeholder="1 2 3 4"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3.5 text-center text-xl tracking-[0.7em] outline-none focus:border-zinc-900 focus:bg-white"
                />
                {otpForm.formState.errors.otp && (
                  <p className="mt-1 text-xs text-red-600">{otpForm.formState.errors.otp.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#0f172a] py-3.5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {verify.isPending ? "Verifying…" : "Verify & sign in"}
              </button>
              <button
                type="button"
                onClick={() => { verifyDone.current = false; setStep("phone"); }}
                className="w-full rounded-full border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Change number
              </button>
            </form>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}