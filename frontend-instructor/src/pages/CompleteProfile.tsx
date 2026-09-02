import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { User, ArrowRight } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { api, absoluteMediaUrl, uploadFile } from "../lib/api";

const schema = z.object({
  name: z.string().min(2, "Required"),
  email: z.string().email("Valid email required"),
  age: z.coerce.number().min(13, "Min 13").max(80, "Max 80"),
  city: z.string().min(2, "Required"),
});

type Form = z.infer<typeof schema>;

export default function CompleteProfile() {
  const nav = useNavigate();
  const { user, setUser } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [toast, setToast] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema) as never,
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "", age: (user?.age as unknown as number) ?? 22, city: "" } as unknown as Form,
  });

  useEffect(() => {
    if (!user) api<{ name: string } | null>("/users/me").then((u) => { if (u) setUser(u as unknown as { name: string; email: string; mobile: string }); else nav("/login"); }).catch(() => nav("/login"));
  }, []);

  const onAvatarPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    const r = new FileReader();
    r.onload = () => setAvatar(r.result as string);
    r.readAsDataURL(f);
  };

  const onSubmit = async (data: Form) => {
    try {
      let avatarUrl = avatar || "";
      if (avatarFile) {
        const uploaded = await uploadFile(avatarFile);
        avatarUrl = absoluteMediaUrl(uploaded.url) ?? "";
      }
      const updated = await api<{ name: string; email: string; mobile: string; age: number; city: string; avatar: string }>("/auth/complete-profile", { method: "PATCH", body: JSON.stringify({ name: data.name, email: data.email, age: data.age, city: data.city, avatar: avatarUrl }) });
      setUser({ name: updated.name || data.name, email: updated.email, mobile: updated.mobile, age: updated.age, avatar: avatarUrl || undefined });
      setToast("Profile saved! Welcome to QTNXT");
      setTimeout(() => nav("/dashboard"), 800);
    } catch (e) { setToast(String(e)); setTimeout(()=>setToast(null),2200); }
  };

  return (
    <div className="min-h-screen w-full bg-[#f6f5f1] lg:grid lg:grid-cols-2">
      <div className="flex min-h-screen flex-col bg-white px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-white">K</span>
          <span className="text-sm font-bold">QTNXT</span>
          <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-zinc-900">Teach</span>
        </Link>

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-md">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Instructor profile</h1>
            <p className="mt-2 text-sm text-zinc-500">Set up your teaching profile — students will see this.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full bg-zinc-100 flex items-center justify-center">
                  {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <User size={24} className="text-zinc-400" />}
                </div>
                <label className="rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-semibold cursor-pointer hover:bg-zinc-50">Upload photo<input type="file" accept="image/*" className="hidden" onChange={onAvatarPicked} /></label>
                <span className="text-xs text-zinc-400">PNG/JPG, max 2MB</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700">Full name</label>
                <input {...register("name")} placeholder="Ayse Sharma" className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-900 focus:bg-white" />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Email</label>
                  <input {...register("email")} placeholder="ayse@mail.com" className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-900 focus:bg-white" />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Age</label>
                  <input type="number" {...register("age")} className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-900 focus:bg-white" />
                  {errors.age && <p className="mt-1 text-xs text-red-500">{errors.age.message}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700">City</label>
                <input {...register("city")} placeholder="Bengaluru, Mumbai, Delhi…" className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-900 focus:bg-white" />
                {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700">Mobile</label>
                <input value={user?.mobile ?? ""} readOnly className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2.5 text-sm text-zinc-500" />
              </div>

              <button disabled={isSubmitting} className="w-full rounded-full bg-[#0f172a] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60 flex items-center justify-center gap-2">
                {isSubmitting ? "Saving…" : <>Continue to QTNXT <ArrowRight size={14} strokeWidth={2.5} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="relative hidden h-screen lg:block">
        <img src="https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=1400" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="text-3xl font-extrabold leading-tight tracking-tight">Your teaching<br/>journey starts here.</p>
          <p className="mt-3 max-w-sm text-sm text-white/80">Build your profile once — students across India will find you by skill and city.</p>
          <div className="mt-6 flex items-center gap-3 text-xs text-white/70">
            <span className="h-px w-8 bg-white/40" />
            <span>One last step before going live</span>
          </div>
        </div>
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl">{toast}</div>}
    </div>
  );
}