import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, getWishlist, type SharedApiCourseDetail } from "@masterlms/shared";
import { CourseCard } from "../components/CourseCard";
import { useToggleWishlist } from "../hooks/useWishlist";
import { useMyCourses } from "../hooks/useMyCourses";
import type { Course } from "../types/course";
import { ListMessage } from "../components/DataGrid";

const accentMap: Record<string, string> = {
  Design: "bg-ink",
  Business: "bg-ink",
  Engineering: "bg-ink",
  Marketing: "bg-live",
};

function mapApi(c: SharedApiCourseDetail): Course {
  const priceNum = Number(c.price);
  return {
    id: String(c.id),
    title: c.title,
    subtitle: c.subtitle ?? "",
    meta: c.average_rating ? Number(c.average_rating).toFixed(1) : "New",
    instructor: c.instructor_name ?? "Instructor",
    price: priceNum === 0 ? "Free" : `₹${priceNum.toLocaleString("en-IN")}`,
    rawPrice: priceNum,
    rating: c.average_rating ? Number(c.average_rating).toFixed(1) : undefined,
    img: c.cover_image || "",
    icon: BookOpen,
    accent: accentMap[c.category ?? ""] ?? "bg-ink",
    category: c.category,
    level: c.level,
    studentCount: c.student_count ?? 0,
    sectionCount: c.section_count ?? 0,
    lessonCount: c.lesson_count ?? 0,
  };
}

export function WishlistContainer() {
  const { data: items, isLoading, isError } = useQuery({
    queryKey: ["me", "wishlist", "courses"],
    queryFn: getWishlist,
  });
  const { data: myCourses } = useMyCourses();
  const toggle = useToggleWishlist();

  const progressById = new Map(
    (myCourses ?? []).map((e) => [String(e.course.id), e.progress ?? 0] as [string, number]),
  );
  const enrolledIds = new Set(progressById.keys());
  const courses = (items ?? []).map((i) => mapApi(i.course));

  if (isLoading) return <p className="py-10 text-center text-sm text-ink-muted">Loading…</p>;
  if (isError) return <p role="alert" className="py-10 text-center text-sm text-ink-muted">Couldn't load your wishlist. Try again in a moment.</p>;

  if (courses.length === 0) {
    return (
      <div className="mt-6 border border-dashed border-rule-strong bg-room-raised">
        <ListMessage
          kind="empty"
          title="Your wishlist is empty."
          body="Open any course and hit “Add to wishlist” to save it here."
          action={
            <Link
              to="/courses"
              className="inline-flex h-8 items-center justify-center border border-ink bg-ink px-3 text-xs font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
            >
              Browse courses
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map((c) => (
          <div key={c.id} className="flex flex-col gap-2">
            <CourseCard
              {...c}
              enrolled={enrolledIds.has(c.id)}
              progress={progressById.get(c.id)}
            />
            <button
              type="button"
              onClick={() => toggle.mutate({ courseId: Number(c.id), wishlisted: true })}
              disabled={toggle.isPending}
              className="self-center border border-rule px-3 py-1 text-[11px] font-semibold text-ink-muted transition-colors hover:border-halt/30 hover:bg-halt-soft hover:text-halt disabled:opacity-60"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
