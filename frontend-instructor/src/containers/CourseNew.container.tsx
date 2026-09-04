import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "@masterlms/shared";
import { InstructorHeader } from "../components/InstructorHeader";
import { api, uploadFile } from "../lib/api";

const schema = z.object({
  title: z.string().min(4, "At least 4 characters"),
  subtitle: z.string().min(8, "Add a short subtitle"),
  category: z.string().min(1, "Required"),
  price: z.string().min(1, "Required"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  cover_image: z.string().url("Valid URL required").min(1, "Cover required"),
  what_you_will_learn: z.string().min(4, "Add at least one item"),
  description: z.string().min(10, "Add a short description"),
});

type Form = z.infer<typeof schema>;

export function CourseNewContainer() {
  const nav = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema) as never,
    defaultValues: { price: "Free", level: "beginner" as const, cover_image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=600&auto=format&fit=crop&q=80" } as unknown as Form,
  });
  const cover = watch("cover_image");

  const showToast = (msg: string, ms = 2500) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  const createMutation = useMutation({
    mutationFn: (data: Form) => {
      const priceNum = data.price === "Free" ? 0 : Number(data.price.replace("₹", "").replace("$", "").replace(/,/g, ""));
      const learn = data.what_you_will_learn.split(".").map((s) => s.trim()).filter(Boolean);
      return api("/courses/", {
        method: "POST",
        body: JSON.stringify({
          title: data.title,
          subtitle: data.subtitle,
          category: data.category,
          level: data.level,
          price: priceNum,
          cover_image: data.cover_image,
          what_you_will_learn: learn,
          description: data.description,
        }),
      });
    },
    onSuccess: () => {
      showToast("Course created — now add curriculum", 700);
      setTimeout(() => nav("/courses"), 700);
    },
    onError: (e) => showToast(String(e)),
  });

  const coverMutation = useMutation({
    mutationFn: (file: File) => uploadFile(file),
    onSuccess: ({ url }) => setValue("cover_image", url, { shouldValidate: true }),
    onError: (err) => showToast(`Upload failed: ${err}`),
  });

  const busy = createMutation.isPending || coverMutation.isPending;

  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className="w-full px-4 py-6 sm:px-6">
        <Link to="/courses" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900"><ArrowLeft size={14} strokeWidth={2.5} /> Back to courses</Link>
        <div className="mt-4 rounded-[20px] bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Create new course</h1>
          <p className="text-sm text-zinc-500">Matches learner view — subtitle, level, and cover now drive the card meta.</p>
          <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="mt-6 grid gap-4">
            <div><label className="text-xs font-semibold">Title</label><input {...register("title")} placeholder="e.g. UX/UI Design Fundamentals" className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:bg-white focus:border-zinc-300" />{errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}</div>
            <div><label className="text-xs font-semibold">Subtitle</label><input {...register("subtitle")} placeholder="Design intuitive interfaces and delightful experiences" className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:bg-white" />{errors.subtitle && <p className="text-xs text-red-500">{errors.subtitle.message}</p>}</div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className="text-xs font-semibold">Category</label><select {...register("category")} className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2.5 text-sm"><option value="">Select</option><option>Design</option><option>Engineering</option><option>Business</option><option>Marketing</option></select>{errors.category && <p className="text-xs text-red-500">Required</p>}</div>
              <div><label className="text-xs font-semibold">Level</label><select {...register("level")} className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2.5 text-sm"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
              <div><label className="text-xs font-semibold">Price</label><select {...register("price")} className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2.5 text-sm"><option>Free</option><option>₹449</option><option>₹799</option><option>₹1,299</option></select></div>
            </div>
            <div>
              <label className="text-xs font-semibold">Cover image</label>
              <div className="mt-1 flex gap-2">
                <input {...register("cover_image")} placeholder="https://... or upload" className="flex-1 rounded-xl border bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:bg-white" />
                <label className="shrink-0 inline-flex items-center rounded-xl bg-[#0f172a] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer hover:bg-black">
                  {coverMutation.isPending ? "Uploading…" : "Upload"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    coverMutation.mutate(f);
                    e.target.value = "";
                  }} />
                </label>
              </div>
              <p className="mt-1 text-[11px] text-zinc-400">Paste a URL or upload an image file.</p>
              {errors.cover_image && <p className="text-xs text-red-500">{errors.cover_image.message}</p>}
              {cover && <img src={cover} alt="" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} className="mt-3 h-32 w-full rounded-xl object-cover border" />}
            </div>
            <div><label className="text-xs font-semibold">What you’ll learn <span className="font-normal text-zinc-400">(dot separated — each sentence becomes a bullet)</span></label><textarea {...register("what_you_will_learn")} rows={3} placeholder="Build frontends with React. Create backends with Django. Design MySQL schemas. Handle OTP auth. Deploy with Docker" className="mt-1 w-full rounded-xl border bg-zinc-50 p-3 text-sm outline-none focus:bg-white" />{errors.what_you_will_learn && <p className="text-xs text-red-500">{errors.what_you_will_learn.message}</p>}</div>
            <div><label className="text-xs font-semibold">Description</label><textarea {...register("description")} rows={4} placeholder="Course overview…" className="mt-1 w-full rounded-xl border bg-zinc-50 p-3 text-sm outline-none focus:bg-white" />{errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}</div>
            <div className="flex gap-3">
              <button disabled={busy} className="rounded-full bg-[#0f172a] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">{createMutation.isPending ? "Creating…" : "Create & continue"}</button>
              <Link to="/courses" className="rounded-full border px-6 py-2.5 text-sm font-medium">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl">{toast}</div>}
    </div>
  );
}
