import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";

export default function Login() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) { setToast("Enter valid 10-digit mobile"); setTimeout(()=>setToast(null),2000); return; }
    setLoading(true);
    try {
      const res = await api<{ message: string; mock_code: string }>("/auth/send-otp", { method: "POST", body: JSON.stringify({ mobile: phone }) });
      setToast(`OTP sent: ${res.mock_code}`); setTimeout(()=>setToast(null),4000);
      setStep("otp");
    } catch (e) { setToast(String(e)); setTimeout(()=>setToast(null),2200); }
    finally { setLoading(false); }
  };

  const verify = async () => {
    if (otp.length !== 4) { setToast("Enter 4-digit OTP"); setTimeout(()=>setToast(null),2000); return; }
    setLoading(true);
    try {
      const data = await api<{ user: { mobile: string; name: string; email: string; avatar?: string; age?: number }; is_new: boolean }>("/auth/verify-otp", { method: "POST", body: JSON.stringify({ mobile: phone, code: otp }) });
      setUser({ name: data.user.name || "Learner", email: data.user.email, mobile: data.user.mobile, avatar: data.user.avatar, age: data.user.age });
      if (data.is_new) nav("/complete-profile");
      else { setToast("Welcome back!"); setTimeout(()=> nav("/"), 400); }
    } catch (e) { setToast(String(e)); setTimeout(()=>setToast(null),2200); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f6f5f1] flex items-center justify-center p-3 sm:p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-sm lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <img src="https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=900" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white p-4 shadow-xl">
            <p className="text-sm font-bold">Learn without pressure</p><p className="text-xs text-zinc-500">Join 12k+ learners finishing what they start.</p>
          </div>
        </div>
        <div className="flex flex-col p-8 sm:p-10">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-white">K</span><span className="text-sm font-bold">Knoova</span></Link>
            <Link to="/" className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900">
              <Home size={12} strokeWidth={2.5} />
              Home
            </Link>
          </div>
          <h1 className="mt-8 text-2xl font-extrabold tracking-tight">Welcome back</h1>
          <p className="text-sm text-zinc-500">{step === "phone" ? "Enter your mobile to get OTP" : `OTP sent to +91 ${phone}`}</p>

          {step === "phone" ? (
            <div className="mt-6 space-y-4">
              <div><label className="text-xs font-semibold">Mobile number</label><div className="mt-1 flex rounded-xl border bg-zinc-50 focus-within:bg-white focus-within:border-zinc-300"><span className="px-3 py-2.5 text-sm font-medium text-zinc-500">+91</span><input value={phone} onChange={(e)=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="98765 43210" className="w-full bg-transparent px-2 py-2.5 text-sm outline-none" /></div></div>
              <button onClick={sendOtp} disabled={loading} className="w-full rounded-full bg-[#0f172a] py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? "Sending…" : "Send OTP"}</button>
              <p className="text-center text-xs text-zinc-400">Demo: OTP will appear in toast</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div><label className="text-xs font-semibold">Enter OTP</label><input value={otp} onChange={(e)=>setOtp(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="1 2 3 4" className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-3 text-center text-lg tracking-[0.6em] outline-none focus:bg-white" /></div>
              <button onClick={verify} disabled={loading} className="w-full rounded-full bg-[#0f172a] py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? "Verifying…" : "Verify OTP"}</button>
              <button onClick={()=>setStep("phone")} className="w-full rounded-full border py-2.5 text-sm font-medium">Change number</button>
            </div>
          )}
          <div className="mt-auto pt-8 space-y-3">
            <p className="text-center text-xs text-zinc-500">By continuing you agree to our Terms • Privacy</p>
            <Link to="/" className="flex items-center justify-center gap-2 rounded-full bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200">
              <Home size={14} strokeWidth={2.5} />
              Skip — go to Home
            </Link>
          </div>
        </div>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl">{toast}</div>}
    </div>
  );
}
