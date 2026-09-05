import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useInstructorActivity } from "../hooks/useInstructorActivity";
import { ActivityFeed } from "../components/ActivityFeed";

type Overview = {
  courses: { id: number; title: string }[];
};

export function ActivityContainer() {
  const [sp, setSp] = useSearchParams();
  const courseId = sp.get("course_id") ?? "";
  const verb = sp.get("verb") ?? "";
  const page = Math.max(1, Number(sp.get("page") ?? "1") || 1);

  const q = useInstructorActivity({
    courseId: courseId || undefined,
    verb: verb || undefined,
    page,
  });

  const overviewQ = useQuery({
    queryKey: ["instructor-overview"],
    queryFn: () => api<Overview>("/instructor/overview"),
  });
  const courses = overviewQ.data?.courses ?? [];

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setSp(next, { replace: true });
  }

  return (
    <ActivityFeed
      items={q.data?.data ?? []}
      meta={q.data?.meta}
      isLoading={q.isLoading}
      isError={q.isError}
      error={q.error as Error | null}
      onRetry={() => q.refetch()}
      params={{ courseId, verb, page }}
      courses={courses}
      onCourse={(v) => setParam("course_id", v)}
      onVerb={(v) => setParam("verb", v)}
      onPage={(p) => setParam("page", String(p))}
    />
  );
}
