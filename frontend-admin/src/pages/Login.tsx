import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { Button } from "../components/Button";
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
  const location = useLocation();
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

  // Arrived here because a non-admin session hit the admin panel
  // (auth cookies are shared across apps on one host).
  useEffect(() => {
    const reason = (location.state as { reason?: string } | null)?.reason;
    if (reason === "role") {
      showToast("You're not signed in as an admin. Log in with an admin account.", 4000);
      nav(location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const me = await api<VerifyUser>("/users/me");
      return { me, isNew: data.is_new };
    },
    onSuccess: ({ me }) => {
      verifyDone.current = true;
      if (me.role !== "admin") {
        showToast("This account is not an admin. Ask an existing admin to grant access.");
        return;
      }
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
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center bg-ink text-sm font-bold text-paper-raised">
              Q
            </span>
            <div className="leading-none">
              <p className="text-sm font-semibold tracking-tight text-ink">QTNXT Admin</p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                Control panel
              </p>
            </div>
          </div>

          <section className="mt-8 border border-rule bg-paper-raised">
            <header className="flex items-center gap-3 border-b border-rule px-6 py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-rule bg-paper text-ink-muted">
                <Lock size={15} strokeWidth={2.2} aria-hidden />
              </span>
              <div>
                <h1 className="text-base font-semibold text-ink">Admin sign in</h1>
                <p className="text-xs text-ink-muted">
                  {step === "phone"
                    ? "Enter your admin mobile to get an OTP"
                    : `OTP sent to +91 ${phone}`}
                </p>
              </div>
            </header>

            {step === "phone" ? (
              <form
                onSubmit={phoneForm.handleSubmit((v) => sendOtp.mutate(v.phone))}
                className="space-y-5 p-6"
              >
                <label className="block">
                  <span className="block text-xs font-semibold text-ink-muted">Mobile number</span>
                  <div className="mt-1.5 flex border border-rule bg-paper transition-colors focus-within:border-ink">
                    <span className="flex items-center border-r border-rule px-3 text-sm font-medium text-ink-muted">
                      +91
                    </span>
                    <input
                      {...phoneForm.register("phone")}
                      inputMode="numeric"
                      autoComplete="tel-national"
                      onChange={(e) =>
                        phoneForm.setValue("phone", e.target.value.replace(/\D/g, "").slice(0, 10), {
                          shouldValidate: true,
                        })
                      }
                      placeholder="98765 43210"
                      className="w-full bg-transparent px-3 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
                    />
                  </div>
                  {phoneForm.formState.errors.phone && (
                    <p className="mt-1.5 text-xs font-medium text-halt">
                      {phoneForm.formState.errors.phone.message}
                    </p>
                  )}
                </label>

                <Button type="submit" variant="primary" disabled={loading} className="w-full">
                  {sendOtp.isPending ? "Sending…" : "Send OTP"}
                </Button>

                <p className="text-xs leading-relaxed text-ink-faint">
                  Only accounts with the admin role can open this panel.
                </p>
              </form>
            ) : (
              <form
                onSubmit={otpForm.handleSubmit((v) => {
                  if (verifyDone.current || verify.isPending) return;
                  verify.mutate({ mobile: phone, code: v.otp });
                })}
                className="space-y-5 p-6"
              >
                <label className="block">
                  <span className="block text-xs font-semibold text-ink-muted">Enter OTP</span>
                  <input
                    {...otpForm.register("otp")}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    disabled={verify.isPending || verifyDone.current}
                    onChange={(e) =>
                      otpForm.setValue("otp", e.target.value.replace(/\D/g, "").slice(0, 4), {
                        shouldValidate: true,
                      })
                    }
                    placeholder="0000"
                    className="tnum mt-1.5 w-full border border-rule bg-paper px-3 py-3.5 text-center text-xl tracking-[0.6em] text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="mt-1.5 text-xs font-medium text-halt">
                      {otpForm.formState.errors.otp.message}
                    </p>
                  )}
                </label>

                <Button type="submit" variant="primary" disabled={loading} className="w-full">
                  {verify.isPending ? "Verifying…" : "Verify and sign in"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    verifyDone.current = false;
                    setStep("phone");
                  }}
                  className="w-full"
                >
                  Change number
                </Button>
              </form>
            )}
          </section>
        </div>
      </div>

      {/* Toast carries the outcome, so it is announced, not just drawn. */}
      <div aria-live="polite" aria-atomic="true">
        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-rule-strong bg-ink px-5 py-2.5 text-sm text-paper-raised shadow-[0_18px_40px_-12px_rgba(28,25,23,0.4)]">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}