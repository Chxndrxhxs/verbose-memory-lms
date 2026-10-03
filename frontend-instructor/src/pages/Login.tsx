import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "@masterlms/shared";
import type { Role } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { TeachMark } from "../components/Badge";
import { Button } from "../components/Button";
import { Field } from "../components/Controls";
import { cn } from "../lib/utils";

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
  const location = useLocation();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
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

  const showToast = (msg: string, ms = 2200) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  // Arrived here because a learner session hit an instructor-only route
  // (auth cookies are shared across apps on one host).
  useEffect(() => {
    const reason = (location.state as { reason?: string } | null)?.reason;
    if (reason === "role") {
      showToast("You're logged in as a learner. Sign in with an instructor account.", 4000);
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
      verifyDone.current = true;
      if (data.user.role !== "instructor") {
        try {
          await api("/auth/become-instructor", { method: "POST" });
        } catch {
          /* already instructor or failed — refetch decides */
        }
      }
      try {
        const me = await api<{
          name: string;
          email: string;
          mobile: string;
          avatar?: string;
          age?: number;
          role?: Role;
        }>("/users/me");
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
        showToast("Instructor access is not enabled for this account.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      if (isNew) nav("/complete-profile");
      else nav("/dashboard");
    },
    onError: (e) => showToast(String(e)),
  });

  const phone = phoneForm.watch("phone");
  const loading = sendOtp.isPending || verify.isPending;

  return (
    <div className="min-h-screen bg-slate-ground">
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col px-4 py-8">
        {/* One lockup only. The old page drew it twice, once per breakpoint. */}
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center bg-ink text-[13px] font-bold text-ink-inverse">
              Q
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink">QTNXT</span>
            <TeachMark />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={13} strokeWidth={2.5} aria-hidden />
            Home
          </Link>
        </div>

        <div className="flex flex-1 items-center py-10">
          <div className="w-full">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Sign in to teach
            </h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              {step === "phone"
                ? "Enter the mobile number on your instructor account."
                : `We sent a 4-digit code to +91 ${phone}.`}
            </p>

            {step === "phone" ? (
              <form
                onSubmit={phoneForm.handleSubmit((v) => sendOtp.mutate(v.phone))}
                className="mt-8 space-y-5"
              >
                <Field
                  label="Mobile number"
                  htmlFor="phone"
                  error={phoneForm.formState.errors.phone?.message}
                >
                  <div className="flex border border-rule bg-slate-panel transition-colors focus-within:border-ink">
                    <span className="flex items-center border-r border-rule px-3 text-sm font-medium text-ink-muted">
                      +91
                    </span>
                    <input
                      id="phone"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      {...phoneForm.register("phone")}
                      onChange={(e) =>
                        phoneForm.setValue(
                          "phone",
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                          { shouldValidate: true },
                        )
                      }
                      placeholder="98765 43210"
                      className="w-full bg-transparent px-3 py-3 text-sm text-ink placeholder:text-ink-faint"
                    />
                  </div>
                </Field>

                <Button type="submit" variant="primary" size="lg" block disabled={loading}>
                  {sendOtp.isPending ? "Sending…" : "Send OTP"}
                </Button>

                <p className="text-xs leading-relaxed text-ink-faint">
                  In this demo the code appears in the message below instead of being
                  sent by SMS.
                </p>
              </form>
            ) : (
              <form
                onSubmit={otpForm.handleSubmit((v) => {
                  if (verifyDone.current || verify.isPending) return;
                  verify.mutate({ mobile: phone, code: v.otp });
                })}
                className="mt-8 space-y-5"
              >
                <Field
                  label="Enter OTP"
                  htmlFor="otp"
                  error={otpForm.formState.errors.otp?.message}
                >
                  <input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    disabled={verify.isPending || verifyDone.current}
                    {...otpForm.register("otp")}
                    onChange={(e) =>
                      otpForm.setValue(
                        "otp",
                        e.target.value.replace(/\D/g, "").slice(0, 4),
                        { shouldValidate: true },
                      )
                    }
                    placeholder="0000"
                    className="tnum w-full border border-rule bg-slate-panel px-3 py-3.5 text-center text-xl tracking-[0.5em] text-ink placeholder:text-ink-faint transition-colors focus:border-ink"
                  />
                </Field>

                <Button type="submit" variant="primary" size="lg" block disabled={loading}>
                  {verify.isPending ? "Verifying…" : "Verify and sign in"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  block
                  onClick={() => {
                    verifyDone.current = false;
                    setStep("phone");
                  }}
                >
                  Change number
                </Button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-ink-faint">
          By continuing you agree to the QTNXT terms and privacy policy.
        </p>
      </div>

      {/* Toast carries the outcome, so it is announced rather than only drawn. */}
      <div aria-live="polite" aria-atomic="true">
        {toast && (
          <div
            className={cn(
              "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-rule-strong",
              "bg-ink px-5 py-2.5 text-sm text-ink-inverse shadow-[0_18px_40px_-12px_rgba(20,24,38,0.4)]",
            )}
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}