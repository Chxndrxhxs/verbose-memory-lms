import { Link } from "react-router-dom";
import type { LucideIcon } from "@masterlms/shared";

type Props = {
  id: string;
  title: string;
  meta: string;
  instructor: string;
  instructorAvatar?: string;
  price: string;
  rating?: string;
  img: string;
  icon: LucideIcon;
  accent: string;
  featured?: boolean;
};

export function CourseCard({ id, title, meta, instructor, instructorAvatar, price, rating, img, icon: Icon, accent, featured }: Props) {
  return (
    <div
      className={`relative rounded-2xl border bg-white p-3 shadow-sm ${featured ? "scale-[1.03] shadow-lg -rotate-[1deg] z-10" : ""}`}
    >
      <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500">
        <span>{meta}</span>
        <span className={`rounded-full px-2 py-0.5 text-white ${price === "Free" ? "bg-zinc-900" : "bg-[#3478ff]"}`}>
          {price}
        </span>
      </div>
      <Link to={`/courses/${id}`} className={`relative mt-3 flex h-36 items-center justify-center overflow-hidden rounded-xl ${accent}`}>
        <img src={img} alt="" className="h-full w-full object-cover mix-blend-overlay opacity-80" />
        <Icon className="absolute text-4xl text-white/90" size={36} strokeWidth={1.5} />
      </Link>
      <Link to={`/courses/${id}`}>
        <h3 className="mt-3 text-sm font-bold leading-tight hover:text-[#3478ff]">{title}</h3>
      </Link>
      <div className="mt-1 flex items-center gap-1.5">
        {instructorAvatar ? <img src={instructorAvatar} alt="" className="h-5 w-5 rounded-full object-cover" /> : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[10px]">{instructor[0]}</span>}
        <p className="text-xs text-zinc-500">{instructor}</p>
      </div>
      {rating && (
        <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
          ★ {rating}
        </div>
      )}
      {featured && (
        <Link to={`/courses/${id}`} className="mt-3 block w-full rounded-full bg-[#3478ff] py-1.5 text-center text-xs font-semibold text-white">
          View course
        </Link>
      )}
    </div>
  );
}
