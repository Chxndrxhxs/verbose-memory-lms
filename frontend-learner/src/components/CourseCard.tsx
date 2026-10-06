import { Link } from "react-router-dom";
import { Check, Play, Star, type LucideIcon } from "@masterlms/shared";
import { Badge, Progress } from "./Badge";
import { cn } from "../lib/utils";

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
  progress?: number;
};

/*
 * The card used to tilt and scale itself when "featured" (-rotate, scale-1.02,
 * z-10), which made one card physically float above its neighbours and broke
 * the grid rhythm. Featured is now a badge like any other.
 */
export function CourseCard({
  id,
  title,
  subtitle,
  instructor,
  instructorAvatar,
  price,
  rawPrice,
  originalPrice,
  rating,
  img,
  icon: Icon,
  featured,
  studentCount,
  sectionCount,
  lessonCount,
  enrolled,
  progress = 0,
}: Props) {
  const isFree = rawPrice === 0;
  const started = enrolled && progress > 0;
  const finished = enrolled && progress >= 100;

  return (
    <article className="flex h-full flex-col border border-rule bg-room-raised transition-colors hover:border-rule-strong">
      <Link
        to={`/courses/${id}`}
        className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-room-sunk"
      >
        {img ? (
          <img src={img} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon size={28} strokeWidth={1.5} aria-hidden className="text-ink-faint" />
        )}

        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {enrolled && (
            <Badge tone="live" showIcon={false}>
              Enrolled
            </Badge>
          )}
          {isFree && (
            <Badge tone="live" showIcon={false}>
              Free
            </Badge>
          )}
          {featured && !isFree && !enrolled && (
            <Badge tone="gold" showIcon={false}>
              Featured
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/courses/${id}`} className="min-w-0">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink hover:underline">
            {title}
          </h3>
        </Link>

        {subtitle && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-ink-muted">
            {subtitle}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2">
          {instructorAvatar ? (
            <img src={instructorAvatar} alt="" className="h-5 w-5 shrink-0 object-cover" />
          ) : (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-room-sunk text-[10px] font-semibold text-ink-muted">
              {instructor[0]?.toUpperCase()}
            </span>
          )}
          <p className="truncate text-xs text-ink-muted">{instructor}</p>
        </div>

        <p className="tnum mt-2 text-xs text-ink-faint">
          {sectionCount} {sectionCount === 1 ? "chapter" : "chapters"} · {lessonCount}{" "}
          {lessonCount === 1 ? "lesson" : "lessons"}
        </p>

        <div className="mt-auto pt-4">
          {enrolled ? (
            <>
              {(started || finished) && (
                <div className="mb-2.5">
                  <Progress
                    value={progress}
                    label={`${title} progress`}
                    tone={finished ? "live" : "gold"}
                  />
                  <p className="tnum mt-1.5 text-[11px] text-ink-faint">
                    {finished ? "Completed" : `${progress}% complete`}
                  </p>
                </div>
              )}
              <Link
                to={`/learn/${id}`}
                className="flex h-9 items-center justify-center gap-1.5 border border-ink bg-ink text-xs font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
              >
                {finished ? (
                  <>
                    <Check size={13} strokeWidth={3} aria-hidden /> Review course
                  </>
                ) : started ? (
                  <>
                    <Play size={12} strokeWidth={2.5} aria-hidden /> Continue {progress}%
                  </>
                ) : (
                  "Start course"
                )}
              </Link>
            </>
          ) : (
            <div className="flex items-baseline gap-2 border-t border-rule pt-3">
              <span
                className={cn(
                  "tnum text-base font-semibold",
                  isFree ? "text-live" : "text-ink",
                )}
              >
                {price}
              </span>
              {originalPrice && (
                <span className="tnum text-xs text-ink-faint line-through">
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
              )}
              <span className="tnum ml-auto text-[11px] text-ink-faint">
                {studentCount > 0 ? `${studentCount.toLocaleString("en-IN")} learners` : "New"}
              </span>
            </div>
          )}
        </div>

        {rating && Number(rating) > 0 && (
          <div className="mt-2.5 flex items-center gap-1 text-xs text-ink-muted">
            <Star size={12} strokeWidth={2} aria-hidden className="fill-gold text-gold" />
            <span className="tnum font-medium text-ink">{rating}</span>
            <span className="text-ink-faint">
              {studentCount > 0 ? `from ${studentCount.toLocaleString("en-IN")}` : ""}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}