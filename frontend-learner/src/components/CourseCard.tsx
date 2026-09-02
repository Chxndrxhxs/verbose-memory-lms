import { Link } from "react-router-dom";
import type { LucideIcon } from "@masterlms/shared";

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  meta: string;
  instructor: string;
  instructorAvatar?: string;
  price: string;
  rawPrice: number;
  originalPrice?: number;
  rating?: string;
  img: string;
  icon: LucideIcon;
  accent: string;
  featured?: boolean;
  category?: string;
  level?: string;
  studentCount: number;
  sectionCount: number;
  lessonCount: number;
  enrolled?: boolean;
};

function formatCount(n: number): string {
  return n.toLocaleString("en-IN");
}

export function CourseCard({ id, title, subtitle, instructor, instructorAvatar, price, rawPrice, originalPrice, rating, img, icon: Icon, accent: _accent, featured, studentCount, sectionCount, lessonCount, enrolled }: Props) {
  const isFree = rawPrice === 0;
  const bestseller = featured || (rating ? Number(rating) >= 4.6 : false) || studentCount >= 10000;

  return (
    <div className={`relative flex w-full max-w-[280px] mx-auto flex-col overflow-hidden rounded-xl border bg-white shadow-sm ${featured ? "scale-[1.02] shadow-md -rotate-[0.5deg] z-10" : ""}`}>
      <Link to={`/courses/${id}`} className="relative flex h-36 items-center justify-center overflow-hidden bg-zinc-100">
        {img ? (
          <img src={img} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100">
            <Icon className="text-zinc-400" size={32} strokeWidth={1.5} />
          </div>
        )}
        {enrolled ? <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white">Enrolled</span> : isFree ? <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">Free</span> : bestseller ? <span className="absolute left-2 top-2 rounded-full bg-[#0f766e] px-1.5 py-0.5 text-[9px] font-bold text-white">Bestseller</span> : null}
      </Link>

      <div className="flex flex-1 flex-col px-2.5 py-2.5">
        <Link to={`/courses/${id}`}>
          <h3 className="line-clamp-2 text-[13px] font-bold leading-snug tracking-tight hover:text-[#3478ff]">{title}</h3>
        </Link>
        {subtitle && <p className="mt-1 line-clamp-2 text-xs leading-snug text-zinc-500">{subtitle}</p>}

        <div className="mt-2 flex items-center gap-1.5">
          {instructorAvatar ? <img src={instructorAvatar} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" /> : <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600">{instructor[0]?.toUpperCase()}</span>}
          <p className="truncate text-[11px] font-medium text-zinc-600">{instructor}</p>
        </div>

        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-500">
          <span>{sectionCount} {sectionCount === 1 ? "chapter" : "chapters"}</span>
          <span className="text-zinc-300">•</span>
          <span>{lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1">
          {bestseller && <span className="rounded bg-[#0f766e] px-1 py-0.5 text-[9px] font-bold tracking-wide text-white">Bestseller</span>}
          {rating && (
            <span className="inline-flex items-center gap-0.5 rounded bg-zinc-900 px-1 py-0.5 text-[10px] font-bold text-white">
              <span className="text-amber-400">★</span> {rating}
            </span>
          )}
          <span className="rounded bg-zinc-100 px-1 py-0.5 text-[10px] font-medium text-zinc-600">{formatCount(studentCount)} ratings</span>
        </div>

        {enrolled ? (
          <Link to={`/learn/${id}`} className="mt-2 block w-full rounded-full bg-[#0f172a] py-2 text-center text-xs font-bold text-white hover:bg-black">Go to course →</Link>
        ) : (
          <div className="mt-2 flex items-center gap-1.5 border-t pt-2">
            <span className={`text-[13px] font-black tracking-tight ${isFree ? "text-emerald-600" : "text-zinc-900"}`}>{price}</span>
            {originalPrice && <span className="text-xs text-zinc-400 line-through">₹{originalPrice.toLocaleString("en-IN")}</span>}
            <span className="ml-auto text-[10px] text-zinc-400">{studentCount > 0 ? `${formatCount(studentCount)} students` : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}
