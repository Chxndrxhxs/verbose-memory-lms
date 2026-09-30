import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, getWishlist, type SharedApiCourseDetail } from "@masterlms/shared";
import { CourseCard } from "../components/CourseCard";
import { useToggleWishlist } from "../hooks/useWishlist";
import { useMyCourses } from "../hooks/useMyCourses";
import type { Course } from "../types/course";

const accentMap: Record<string, string> = {
  Design: "bg-[#3478ff]",
  Business: "bg-[#3478ff]",
  Engineering: "bg-[#111827]",
  Marketing: "bg-emerald-500",
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
    accent: accentMap[c.category ?? ""] ?? "bg-zinc-900",
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

  if (isLoading) return <p className="py-10 text-center text-sm text-zinc-500">Loading…</p>;
  if (isError) return <p className="py-10 text-center text-sm text-zinc-500">Couldn't load your wishlist. Try again in a moment.</p>;

  if (courses.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed bg-white px-4 py-12 text-center">
        <p className="text-sm font-bold">Your wishlist is empty.</p>
        <p className="mt-1 text-xs text-zinc-500">
          Open any course and hit “Add to wishlist ♡” to save it here.
        </p>
        <Link
          to="/courses"
          className="mt-4 inline-block rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-black"
        >
          Browse courses
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map((c) => (
          <div key={c.id} className="flex flex-col gap-1.5">
            <CourseCard
              {...c}
              enrolled={enrolledIds.has(c.id)}
              progress={progressById.get(c.id)}
            />
            <button
              type="button"
              onClick={() => toggle.mutate({ courseId: Number(c.id), wishlisted: true })}
              disabled={toggle.isPending}
              className="self-center rounded-full border px-3 py-1 text-[11px] font-semibold text-zinc-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
