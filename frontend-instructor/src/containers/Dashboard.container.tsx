import { useQuery } from "@tanstack/react-query";
import { DashboardView } from "../components/DashboardView";
import { api } from "../lib/api";

export type OverviewEnrollment = {
  learner: string;
  course: string;
  price: string;
  enrolled_at: string;
};

export type InstructorOverview = {
  total_courses: number;
  drafts: number;
  total_students: number;
  average_rating: string;
  revenue_inr: number;
  top_course: { id: number; title: string; students: number } | null;
  recent_enrollments: OverviewEnrollment[];
};

export function DashboardContainer() {
  const { data, isLoading } = useQuery({
    queryKey: ["instructor-overview"],
    queryFn: () => api<InstructorOverview>("/instructor/overview"),
  });

  return <DashboardView overview={data ?? null} isLoading={isLoading} />;
}
