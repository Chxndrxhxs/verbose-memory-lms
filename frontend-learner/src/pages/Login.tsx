import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { Button } from "../components/Button";
import { Field } from "../components/Controls";

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
};

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  // Return target threaded through by whichever page sent
  // us here (enroll, a protected route, …).
  const from = (location.state as { from?: string } | null)?.from;
  const next = typeof from === "string" && from.startsWith("/") ? from : "/";
  const { setUser } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [toast, setToast] = useState<string | null>(null);
  const verifyDone = useRef(false);
  // Seconds until "Resend code" unlocks, so OTP requests stay spaced out.
  const [cooldown, setCooldown] = useState(0);
  // The mock code only exists when the backend runs with
  // DEBUG=True, so this banner is dev-only by construction.
  // A 4-second toast is gone before anyone can type it; keep
  // the code on screen until it is used or dismissed.
  const [mockCode, setMockCode] = useState<string | null>(null);
  const [codeDismissed, setCodeDismissed] = useState(false);

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

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = useMutation({
    mutationFn: (mobile: string) =>
      api<{ message: string; mock_code: string }>("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ mobile }),
      }),
    onSuccess: (res) => {
      verifyDone.current = false;
      setCooldown(30);
      setMockCode(res.mock_code ?? null);
      setCodeDismissed(false);
      showToast(`OTP sent: ${res.mock_code}`, 4000);
      setStep("otp");
    },
    onError: (e) => showToast(String(e)),
  });

  const verify = useMutation({
    mutationFn: ({ mobile, code }: { mobile: string; code: string }) =>
      api<{ user: VerifyUser; is_new: boolean }>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ mobile, code }),
      }),
    onSuccess: (data) => {
      verifyDone.current = true;
      setMockCode(null);
      setUser({
        name: data.user.name || "Learner",
        email: data.user.email,
        mobile: data.user.mobile,
        avatar: data.user.avatar,
        age: data.user.age,
      });
      if (data.is_new) nav("/complete-profile", { state: { from: next } });
      else nav(next);
    },
    onError: (e) => showToast(String(e)),
  });

  const onVerifySubmit = (v: z.infer<typeof otpSchema>) => {
    if (verifyDone.current || verify.isPending) return;
    verify.mutate({ mobile: phone, code: v.otp });
  };

  // send-otp doubles as the resend: a fresh code invalidates the old one.
  const resend = () => {
    if (cooldown > 0 || sendOtp.isPending || verify.isPending) return;
    otpForm.setValue("otp", "");
    sendOtp.mutate(phone);
  };

  const phone = phoneForm.watch("phone");
  const loading = sendOtp.isPending || verify.isPending;

  return (
    <div className="flex min-h-screen items-center bg-room">
      <main id="main" className="mx-auto w-full max-w-[420px] px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center bg-ink text-[13px] font-bold text-ink-inverse">
              Q
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink">QTNXT</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={13} strokeWidth={2.5} aria-hidden />
            Home
          </Link>
        </div>

        <div className="py-12">
          <h1 className="text-2xl font-semibold text-ink">
            {step === "phone" ? "Sign in to keep learning" : "Enter your code"}
          </h1>
          <p className="tnum mt-1.5 text-sm text-ink-muted">
            {step === "phone"
              ? "We will send a one-time code to your mobile."
              : `Sent to +91 ${phone}.`}
          </p>

          {step === "otp" && mockCode && !codeDismissed && (
            <div className="mt-6 flex items-center justify-between gap-3 border border-gold/50 bg-gold/10 px-4 py-3">
              <p className="tnum text-sm text-ink">
                Demo code: <span className="font-semibold">{mockCode}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(mockCode);
                    showToast("Code copied");
                  }}
                  className="px-2 py-1 text-xs font-semibold text-ink underline underline-offset-2"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => setCodeDismissed(true)}
                  className="px-2 py-1 text-xs font-semibold text-ink-muted"
                  aria-label="Dismiss demo code"
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
            </div>
          )}

          {step === "phone" ? (
            <form
              onSubmit={phoneForm.handleSubmit((v) => sendOtp.mutate(v.phone))}
              className="mt-8 space-y-5"
            >
              <Field
                label="Mobile number"
                htmlFor="login-phone"
                error={phoneForm.formState.errors.phone?.message}
              >
                <div className="flex border border-rule bg-room-raised transition-colors focus-within:border-ink">
                  <span className="flex items-center border-r border-rule px-3 text-sm font-medium text-ink-muted">
                    +91
                  </span>
                  <input
                    id="login-phone"
                    {...phoneForm.register("phone")}
                    onChange={(e) =>
                      phoneForm.setValue(
                        "phone",
                        e.target.value.replace(/\D/g, "").slice(0, 10),
                        { shouldValidate: true },
                      )
                    }
                    placeholder="98765 43210"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    className="tnum w-full bg-transparent px-3 py-3 text-sm text-ink placeholder:text-ink-faint"
                  />
                </div>
              </Field>

              <Button type="submit" variant="primary" size="lg" block disabled={loading}>
                {sendOtp.isPending ? "Sending…" : "Send code"}
              </Button>

              <p className="text-xs leading-relaxed text-ink-faint">
                In this demo the code appears in the message below instead of being
                sent by SMS.
              </p>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onVerifySubmit)} className="mt-8 space-y-5">
              <Field label="One-time code" htmlFor="login-otp" error={otpForm.formState.errors.otp?.message}>
                <input
                  id="login-otp"
                  {...otpForm.register("otp")}
                  disabled={verify.isPending || verifyDone.current}
                  onChange={(e) =>
                    otpForm.setValue("otp", e.target.value.replace(/\D/g, "").slice(0, 4), {
                      shouldValidate: true,
                    })
                  }
                  placeholder="0000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="tnum w-full border border-rule bg-room-raised px-3 py-3.5 text-center text-xl tracking-[0.5em] text-ink placeholder:text-ink-faint transition-colors focus:border-ink"
                />
              </Field>

              <Button type="submit" variant="primary" size="lg" block disabled={loading}>
                {verify.isPending ? "Verifying…" : "Verify and continue"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                block
                disabled={cooldown > 0 || loading}
                onClick={resend}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                block
                onClick={() => {
                  verifyDone.current = false;
                  setCooldown(0);
                  setStep("phone");
                }}
              >
                Use a different number
              </Button>
            </form>
          )}
        </div>

        <p className="text-xs leading-relaxed text-ink-faint">
          By continuing you agree to the QTNXT terms and privacy policy.
        </p>
      </main>

      <div aria-live="polite" aria-atomic="true">
        {toast && (
          <div
            role="status"
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-ink bg-ink px-5 py-2.5 text-sm text-ink-inverse shadow-[0_18px_40px_-12px_rgba(30,18,36,0.4)]"
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}