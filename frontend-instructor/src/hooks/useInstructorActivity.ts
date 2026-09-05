import { useQuery } from "@tanstack/react-query";
import { apiEnvelope } from "@masterlms/shared";

export type InstructorActivityItem = {
  id: number;
  verb: string;
  course: number | null;
  course_title: string | null;
  lesson: number | null;
  lesson_title: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  learner: { id: number; name: string; avatar: string; city: string } | null;
};

export type InstructorActivityResponse = {
  data: InstructorActivityItem[];
  error: null;
  meta: { page: number; total: number; pages: number };
};

export type InstructorActivityParams = {
  courseId?: string;
  verb?: string;
  page?: number;
};

export function useInstructorActivity(params: InstructorActivityParams) {
  const qs = new URLSearchParams();
  if (params.courseId) qs.set("course_id", params.courseId);
  if (params.verb) qs.set("verb", params.verb);
  qs.set("page", String(params.page ?? 1));
  const key = qs.toString();
  return useQuery({
    queryKey: ["instructor", "activity", key],
    queryFn: () => apiEnvelope<InstructorActivityResponse>(`/instructor/activity/?${key}`),
    placeholderData: (prev) => prev,
  });
}
