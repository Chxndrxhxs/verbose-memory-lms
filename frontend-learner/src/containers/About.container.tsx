import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AboutView } from "../components/AboutView";
import { api } from "../lib/api";

type ApiCourse = {
  id: number;
  price: string;
  student_count: number;
};

async function fetchCatalogue(): Promise<ApiCourse[]> {
  const data = await api<{ results: ApiCourse[] } | ApiCourse[]>("/courses/", {
    auth: false,
  });
  const list = Array.isArray(data) ? data : data.results ?? [];
  return list;
}

export function AboutContainer() {
  const { data } = useQuery({
    queryKey: ["about-catalogue"],
    queryFn: fetchCatalogue,
  });
  const stats = useMemo(() => {
    const courses = data ?? [];
    const totalLearners = courses.reduce((n, c) => n + (c.student_count ?? 0), 0);
    const freeCount = courses.filter((c) => Number(c.price) === 0).length;
    return {
      courses: courses.length,
      learners:
        totalLearners > 999 ? `${(totalLearners / 1000).toFixed(1)}k` : String(totalLearners),
      free: freeCount,
    };
  }, [data]);
  return <AboutView stats={stats} />;
}
