import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import {
  ageField,
  ArrowRight,
  AVATAR_SIZE_MSG,
  cityField,
  emailField,
  isAvatarSizeAllowed,
  MAX_AGE,
  MIN_AGE,
  nameField,
  User,
} from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { api, absoluteMediaUrl, uploadFile } from "../lib/api";
import { Button } from "../components/Button";
import { Input } from "../components/Controls";
import { Toast } from "../components/Toast";

const schema = z.object({
  name: nameField("Full name", { min: 2 }),
  email: emailField("Email"),
  age: ageField(),
  city: cityField("City"),
});

type Form = z.infer<typeof schema>;

export default function CompleteProfile() {
  const nav = useNavigate();
  const { user, setUser } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      age: user?.age === null || user?.age === undefined ? "" : String(user.age),
      city: "",
    } as Form,
  });

  useEffect(() => {
    if (!user) {
      api<{ name: string } | null>("/users/me").then((u) => {
        if (u) setUser(u as unknown as { name: string; email: string; mobile: string });
        else nav("/login");
      }).catch(() => nav("/login"));
    }
  }, []);

  const onAvatarPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!isAvatarSizeAllowed(f)) {
      setAvatarError(AVATAR_SIZE_MSG);
      setAvatarFile(null);
      e.target.value = "";
      return;
    }
    setAvatarError(null);
    setAvatarFile(f);
    const r = new FileReader();
    r.onload = () => setAvatar(r.result as string);
    r.readAsDataURL(f);
  };

  const onSubmit = async (data: Form) => {
    try {
      let avatarUrl = avatar || "";
      if (avatarFile) {
        const uploaded = await uploadFile(avatarFile, "avatar");
        avatarUrl = absoluteMediaUrl(uploaded.url) ?? "";
      }
      const updated = await api<{ name: string; email: string; mobile: string; age: number; city: string; avatar: string }>("/auth/complete-profile", { method: "PATCH", body: JSON.stringify({ name: data.name, email: data.email, age: Number(data.age), city: data.city, avatar: avatarUrl }) });
      setUser({ name: updated.name || data.name, email: updated.email, mobile: updated.mobile, age: updated.age, avatar: avatarUrl || undefined });
      setToast("Profile saved! Welcome to QTNXT");
      setTimeout(() => nav("/"), 800);
    } catch (e) { setToast(String(e)); setTimeout(()=>setToast(null),2200); }
  };

  return (
    <div className="min-h-screen w-full bg-room lg:grid lg:grid-cols-2">
      <div className="flex min-h-screen flex-col bg-room-raised px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center bg-ink text-xs font-semibold text-ink-inverse">K</span>
          <span className="text-sm font-semibold text-ink">QTNXT</span>
        </Link>

        <main id="main" className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-md">
            <h1 className="text-2xl font-semibold text-ink">Complete your profile</h1>
            <p className="mt-2 text-sm text-ink-muted">Tell us a bit about you — helps personalize your learning.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-rule bg-room-sunk">
                  {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <User size={24} className="text-ink-faint" aria-hidden />}
                </div>
                <label className="cursor-pointer border border-rule bg-room-raised px-4 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-room-sunk">Upload photo<input type="file" accept="image/*" className="hidden" onChange={onAvatarPicked} /></label>
                <span className="text-xs text-ink-faint">PNG/JPG, max 2MB</span>
              </div>
              {avatarError && <p role="alert" className="-mt-3 text-xs text-halt">{avatarError}</p>}

              <div>
                <label htmlFor="cp-name" className="text-xs font-semibold text-ink-muted">Full name</label>
                <Input id="cp-name" {...register("name")} placeholder="Ayse Sharma" className="mt-1.5" />
                {errors.name && <p role="alert" className="mt-1 text-xs text-halt">{errors.name.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cp-email" className="text-xs font-semibold text-ink-muted">Email</label>
                  <Input id="cp-email" {...register("email")} placeholder="ayse@mail.com" className="mt-1.5" />
                  {errors.email && <p role="alert" className="mt-1 text-xs text-halt">{errors.email.message}</p>}
                </div>
                <div>
                  <label htmlFor="cp-age" className="text-xs font-semibold text-ink-muted">Age</label>
                  <Input id="cp-age" type="number" min={MIN_AGE} max={MAX_AGE} inputMode="numeric" placeholder={`${MIN_AGE}–${MAX_AGE}`} {...register("age")} className="tnum mt-1.5" />
                  {errors.age && <p role="alert" className="mt-1 text-xs text-halt">{errors.age.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="cp-city" className="text-xs font-semibold text-ink-muted">City</label>
                <Input id="cp-city" {...register("city")} placeholder="Bengaluru, Mumbai, Delhi…" className="mt-1.5" />
                {errors.city && <p role="alert" className="mt-1 text-xs text-halt">{errors.city.message}</p>}
              </div>

              <div>
                <label htmlFor="cp-mobile" className="text-xs font-semibold text-ink-muted">Mobile</label>
                <Input id="cp-mobile" value={user?.mobile ?? ""} readOnly className="tnum mt-1.5 bg-room-sunk text-ink-muted" />
              </div>

              <Button type="submit" variant="primary" size="lg" block disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : <>Continue to QTNXT <ArrowRight size={14} strokeWidth={2.5} aria-hidden /></>}
              </Button>
            </form>
          </div>
        </main>
      </div>

      <div className="relative hidden h-screen lg:block">
        <img src="https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=1400" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-room-deep/80 via-room-deep/25 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-ink-inverse">
          <p className="text-3xl font-semibold leading-tight">Your journey<br/>starts here.</p>
          <p className="mt-3 max-w-sm text-sm text-ink-inverse/80">Personalized paths, calm sessions, real progress — built around how you actually learn.</p>
          <div className="mt-6 flex items-center gap-3 text-xs text-ink-inverse/70">
            <span className="h-px w-8 bg-ink-inverse/40" />
            <span>One last step before the fun begins</span>
          </div>
        </div>
      </div>

      {toast && <Toast>{toast}</Toast>}
    </div>
  );
}