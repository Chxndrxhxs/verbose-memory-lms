import { Link } from "react-router-dom";
import { LESSON_KIND_BADGE, Minus, Play, Plus } from "@masterlms/shared";
import type { CourseDetail } from "../types/course";

type Props = {
  data: CourseDetail;
  enrolled: boolean;
  processing: boolean;
  open: number;
  toast: string | null;
  onOpen: (i: number) => void;
  onEnroll: () => void;
};

export function CourseDetailView({
  data,
  enrolled,
  processing,
  open,
  toast,
  onOpen,
  onEnroll,
}: Props) {
  const curriculum = data.curriculum ?? [];
  const learn = data.learn ?? [];
  const lectureCount = curriculum.reduce((a, c) => a + c.lessons.length, 0);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* LEFT */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          {data.level && <span className="rounded-full border bg-white px-2.5 py-1 text-zinc-700 capitalize">{data.level}</span>}
          <span className="rounded-full border bg-white px-2.5 py-1 text-zinc-700">{lectureCount} lecture{lectureCount === 1 ? "" : "s"}</span>
        </div>

        <h1 className="mt-4 text-[28px] font-extrabold leading-tight tracking-tight sm:text-[32px]">{data.title}</h1>
        {data.subtitle && <p className="mt-2 text-sm leading-relaxed text-zinc-600">{data.subtitle}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          {data.rating && <span className="inline-flex items-center gap-1 font-semibold"><span className="text-amber-400">★ {data.rating}</span></span>}
          {data.students && <span className="text-zinc-500">({data.students})</span>}
          {(data.instructor || data.avatar) && (
            <span className="flex items-center gap-1.5 text-zinc-500">
              {data.avatar && <img src={data.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />}
              <span className="font-medium text-zinc-700">{data.instructor}</span>
            </span>
          )}
        </div>

        {/* Mobile preview card */}
        {data.img && (
        <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm lg:hidden">
          <div className="relative"><img src={data.img} alt="" className="h-48 w-full object-cover" /><button className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow"><Play size={20} strokeWidth={2.5} className="ml-0.5" /></button></div>
          <div className="p-4">
            <div className="flex items-baseline gap-2"><span className="text-2xl font-black">{data.price}</span></div>
            {enrolled ? (
              <Link to={`/learn/${data.id}`} className="mt-3 block w-full rounded-full bg-emerald-600 py-3 text-center text-sm font-bold text-white">Start learning →</Link>
            ) : (
              <button onClick={onEnroll} disabled={processing} className="mt-3 w-full rounded-full bg-[#0f172a] py-3 text-sm font-bold text-white disabled:opacity-60">
                {processing ? "Processing…" : data.price === "Free" ? "Enroll now — Free" : "Enroll now"}
              </button>
            )}
          </div>
        </div>
        )}

        {/* What you'll learn */}
        {learn.length > 0 && (
        <div className="mt-6 rounded-2xl border bg-[#fdfdfc] p-5">
          <h3 className="text-sm font-bold">What you’ll learn</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {learn.map((l) => (
              <div key={l} className="flex gap-2 text-xs leading-relaxed text-zinc-700"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">✓</span>{l}</div>
            ))}
          </div>
        </div>
        )}

        {/* Curriculum */}
        {curriculum.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Course content</h3><span className="text-xs text-zinc-500">{curriculum.length} sections • {lectureCount} lectures</span></div>
          <div className="mt-3 overflow-hidden rounded-2xl border bg-white">
            {curriculum.map((sec, i) => (
              <div key={sec.title} className="border-b last:border-0">
                <button onClick={() => onOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between bg-zinc-50 px-4 py-3 text-left hover:bg-zinc-100">
                  <span className="text-sm font-semibold">{sec.title}</span><span className="flex items-center gap-2 text-xs text-zinc-500">{sec.meta}<span className={`flex h-6 w-6 items-center justify-center rounded-full ${open === i ? "bg-[#3478ff] text-white" : "bg-white text-zinc-700"}`}>{open === i ? <Minus size={12} strokeWidth={2.5} /> : <Plus size={12} strokeWidth={2.5} />}</span></span>
                </button>
                {open === i && <ul className="px-4 py-2">{sec.lessons.map((l) => { const badge = LESSON_KIND_BADGE[l.kind]; const Icon = badge.Icon; return (
                  <li key={l.id} className="flex items-center gap-2 py-2 text-xs text-zinc-700">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${badge.badge}`}><Icon size={11} strokeWidth={2.5} /></span>
                    <span className="min-w-0 flex-1 truncate">{l.title}</span>
                    {l.kind === "quiz" && <span className="rounded-full bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-zinc-900">Quiz</span>}
                    <span className="text-zinc-400">{l.duration}</span>
                  </li>
                ); })}</ul>}
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Description + instructor */}
        {data.description && (
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold">Description</h3><p className="mt-2 text-sm leading-relaxed text-zinc-600">{data.description}</p>
          {(data.instructor || data.avatar) && (
          <div className="mt-5 flex gap-3 rounded-xl bg-zinc-50 p-4">
            {data.avatar && <img src={data.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />}
            <div><p className="text-sm font-bold">{data.instructor}</p>{data.instructorRole && <p className="text-xs text-zinc-500">{data.instructorRole}</p>}</div>
          </div>
          )}
        </div>
        )}
      </div>

      {/* RIGHT — sticky enroll card */}
      <div className="hidden lg:block">
        <div className="sticky top-[88px] overflow-hidden rounded-[20px] border bg-white shadow-sm">
          {data.img && (
          <div className="relative"><img src={data.img} alt="" className="h-44 w-full object-cover" /><button className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lg"><Play size={20} strokeWidth={2.5} className="ml-0.5" /></button><span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">Preview this course</span></div>
          )}
          <div className="p-5">
            <div className="flex items-baseline gap-2"><span className="text-[28px] font-black tracking-tight">{data.price}</span></div>
            {enrolled ? (
              <Link to={`/learn/${data.id}`} className="mt-4 block w-full rounded-full bg-emerald-600 py-3 text-center text-sm font-bold text-white hover:bg-emerald-700">Start learning →</Link>
            ) : (
              <button onClick={onEnroll} disabled={processing} className="mt-4 w-full rounded-full bg-[#0f172a] py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-60">
                {processing ? "Processing…" : "Enroll now"}
              </button>
            )}
            <button className="mt-2 w-full rounded-full border py-2.5 text-sm font-semibold hover:bg-zinc-50">Add to wishlist ♡</button>
            <p className="mt-2 text-center text-[11px] text-zinc-500">30-day money-back guarantee • Full lifetime access</p>

            <div className="mt-5 rounded-xl bg-zinc-50 p-4">
              <p className="text-xs font-bold">This course includes:</p>
              <ul className="mt-2 space-y-1.5 text-xs text-zinc-600">
                <li className="flex gap-2"><span>●</span> On-demand videos</li>
                <li className="flex gap-2"><span>●</span> {curriculum.length} section{curriculum.length === 1 ? "" : "s"} • {lectureCount} lecture{lectureCount === 1 ? "" : "s"}</li>
                <li className="flex gap-2"><span>●</span> Interactive quizzes</li>
                <li className="flex gap-2"><span>●</span> Certificate of completion</li>
                <li className="flex gap-2"><span>●</span> Full lifetime access</li>
              </ul>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-full border py-2 text-xs font-medium">Share</button>
              <button className="flex-1 rounded-full border py-2 text-xs font-medium">Gift</button>
              <button className="flex-1 rounded-full border py-2 text-xs font-medium">Coupon</button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
