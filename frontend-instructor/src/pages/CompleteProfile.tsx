import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { User, ArrowRight } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";

const schema = z.object({
  name: z.string().min(2, "Required"),
  email: z.string().email("Valid email required"),
  age: z.coerce.number().min(13, "Min 13").max(80, "Max 80"),
});

type Form = z.infer<typeof schema>;

export default function CompleteProfile() {
  const nav = useNavigate();
  const { user, setUser } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [toast, setToast] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema) as never,
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "", age: (user?.age as unknown as number) ?? 22 } as unknown as Form,
  });

  useEffect(() => {
    if (!user) api<{ name: string } | null>("/users/me").then((u) => { if (u) setUser(u as unknown as { name: string; email: string; mobile: string }); else nav("/login"); }).catch(() => nav("/login"));
  }, []);

  const onSubmit = async (data: Form) => {
    try {
      const updated = await api<{ name: string; email: string; mobile: string; age: number; avatar: string }>("/auth/complete-profile", { method: "PATCH", body: JSON.stringify({ name: data.name, email: data.email, age: data.age, avatar: avatar || "" }) });
      setUser({ name: updated.name || data.name, email: updated.email, mobile: updated.mobile, age: updated.age, avatar: updated.avatar || avatar || undefined });
      setToast("Profile saved! Welcome to Knoova");
      setTimeout(() => nav("/dashboard"), 800);
    } catch (e) { setToast(String(e)); setTimeout(()=>setToast(null),2200); }
  };

  return (
    <div className="min-h-screen bg-[#f6f5f1] flex items-center justify-center p-3 sm:p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-8 sm:p-10">
          <Link to="/" className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-white">K</span><span className="text-sm font-bold">Knoova</span><span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-zinc-900">Teach</span></Link>
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Instructor profile</h1>
          <p className="text-sm text-zinc-500">Set up your teaching profile — students will see this.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-zinc-100 flex items-center justify-center">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <User size={24} className="text-zinc-400" />}
              </div>
              <label className="rounded-full border px-4 py-1.5 text-xs font-semibold cursor-pointer hover:bg-zinc-50">Upload photo<input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>setAvatar(r.result as string); r.readAsDataURL(f); }} /></label>
              <span className="text-xs text-zinc-400">PNG/JPG, max 2MB</span>
            </div>
            <div><label className="text-xs font-semibold">Full name</label><input {...register("name")} placeholder="Ayse Sharma" className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:bg-white" />{errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="text-xs font-semibold">Email</label><input {...register("email")} placeholder="ayse@mail.com" className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:bg-white" />{errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}</div>
              <div><label className="text-xs font-semibold">Age</label><input type="number" {...register("age")} className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:bg-white" />{errors.age && <p className="text-xs text-red-500">{errors.age.message}</p>}</div>
            </div>
            <div><label className="text-xs font-semibold">Mobile</label><input value={user?.mobile ?? ""} readOnly className="mt-1 w-full rounded-xl border bg-zinc-100 px-3 py-2.5 text-sm text-zinc-500" /></div>
            <button disabled={isSubmitting} className="w-full rounded-full bg-[#0f172a] py-3 text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2">
              {isSubmitting ? "Saving…" : <>Continue to Knoova <ArrowRight size={14} strokeWidth={2.5} /></>}
            </button>
          </form>
        </div>
        <div className="relative hidden lg:block">
          <img src="https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=900" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white p-4 shadow-xl">
            <p className="text-sm font-bold">Your journey starts here</p><p className="text-xs text-zinc-500">Personalized paths, calm sessions, real progress.</p>
          </div>
        </div>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl">{toast}</div>}
    </div>
  );
}
