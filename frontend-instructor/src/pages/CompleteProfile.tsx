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
  type AuthUser,
} from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { api, absoluteMediaUrl, uploadFile } from "../lib/api";
import { TeachMark } from "../components/Badge";
import { Button } from "../components/Button";
import { Field, Input, Notice } from "../components/Controls";

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
  const [saveError, setSaveError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      // A brand-new account's "name" is the raw mobile number (the username)
      // until the profile is completed — never prefill the field with it.
      name: /^\d+$/.test(user?.name ?? "") ? "" : (user?.name ?? ""),
      email: user?.email ?? "",
      age: user?.age === null || user?.age === undefined ? "" : String(user.age),
      city: "",
    } as Form,
  });

  useEffect(() => {
    if (!user)
      api<{ name: string } | null>("/users/me")
        .then((u) => {
          if (u) setUser(u as unknown as { name: string; email: string; mobile: string });
          else nav("/login");
        })
        .catch(() => nav("/login"));
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
    setSaveError(null);
    try {
      let avatarUrl = avatar || "";
      if (avatarFile) {
        const uploaded = await uploadFile(avatarFile, "avatar");
        avatarUrl = absoluteMediaUrl(uploaded.url) ?? "";
      }
      const updated = await api<AuthUser>("/auth/complete-profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          age: Number(data.age),
          city: data.city,
          avatar: avatarUrl,
        }),
      });
      setUser(updated);
      setToast("Profile saved. Opening your studio.");
      setTimeout(() => nav("/dashboard"), 800);
    } catch (e) {
      const msg = String(e);
      // A failure is a recovery path: say what broke and keep them on the form.
      setSaveError(msg);
      setToast(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-ground">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col px-4 py-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center bg-ink text-[13px] font-bold text-ink-inverse">
            Q
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">QTNXT</span>
          <TeachMark />
        </Link>

        <div className="flex flex-1 items-center py-10">
          <div className="w-full">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Set up your instructor profile
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              Learners see your name, city and photo on every course you publish. You can
              change any of this later.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-rule bg-slate-sunk text-ink-faint">
                  {avatar ? (
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User size={24} strokeWidth={1.8} aria-hidden />
                  )}
                </div>
                <div>
                  <label
                    htmlFor="avatar"
                    className="inline-flex h-9 cursor-pointer items-center border border-rule-strong bg-slate-panel px-4 text-xs font-semibold text-ink transition-colors hover:bg-slate-sunk"
                  >
                    Upload photo
                  </label>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={onAvatarPicked}
                    className="sr-only"
                  />
                  <p className="mt-1.5 text-xs text-ink-faint">JPG or PNG, up to 2 MB</p>
                </div>
              </div>
              {avatarError && (
                <p className="text-xs font-medium text-halt" role="alert">
                  {avatarError}
                </p>
              )}

              <Field label="Full name" htmlFor="name" error={errors.name?.message}>
                <Input id="name" placeholder="Ayse Sharma" autoComplete="name" {...register("name")} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" htmlFor="email" error={errors.email?.message}>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ayse@mail.com"
                    autoComplete="email"
                    {...register("email")}
                  />
                </Field>
                <Field
                  label="Age"
                  htmlFor="age"
                  hint={`${MIN_AGE} to ${MAX_AGE}`}
                  error={errors.age?.message}
                >
                  <Input
                    id="age"
                    type="number"
                    min={MIN_AGE}
                    max={MAX_AGE}
                    inputMode="numeric"
                    {...register("age")}
                  />
                </Field>
              </div>

              <Field label="City" htmlFor="city" error={errors.city?.message}>
                <Input
                  id="city"
                  placeholder="Bengaluru, Mumbai, Delhi"
                  autoComplete="address-level2"
                  {...register("city")}
                />
              </Field>

              <Field
                label="Mobile"
                htmlFor="mobile"
                hint="Your sign-in number. This cannot be changed here."
              >
                <Input
                  id="mobile"
                  value={user?.mobile ?? ""}
                  readOnly
                  className="tnum bg-slate-sunk text-ink-muted"
                />
              </Field>

              {saveError && (
                <Notice tone="error" role="alert" title="Could not save your profile">
                  {saveError} Check each field and try again.
                </Notice>
              )}

              <Button type="submit" variant="primary" size="lg" block disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Continue to your studio"}
                {!isSubmitting && <ArrowRight size={16} strokeWidth={2.5} aria-hidden />}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-rule-strong bg-ink px-5 py-2.5 text-sm text-ink-inverse shadow-[0_18px_40px_-12px_rgba(20,24,38,0.4)]">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}