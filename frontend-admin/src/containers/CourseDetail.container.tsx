import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { AdminCourse, AdminCourseDetailResponse } from "../types/admin";
import { CourseDetailView } from "../components/CourseDetailView";

export type CourseEditValues = {
  title: string;
  subtitle: string;
  category: string;
  description: string;
  price: string;
  pricing_type: "free" | "one_time";
  cover_image: string;
  status: "draft" | "published";
  level: "beginner" | "intermediate" | "advanced";
  what_you_will_learn: string;
};

function toForm(c: AdminCourse): CourseEditValues {
  return {
    title: c.title,
    subtitle: c.subtitle,
    category: c.category,
    description: c.description,
    price: Number(c.price) === 0 ? "" : c.price,
    pricing_type: c.pricing_type,
    cover_image: c.cover_image,
    status: c.status,
    level: c.level as CourseEditValues["level"],
    what_you_will_learn: (c.what_you_will_learn ?? []).join("\n"),
  };
}

export function CourseDetailContainer() {
  const { id } = useParams();
  const qc = useQueryClient();
  const nav = useNavigate();
  const cid = Number(id);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "course", cid],
    queryFn: () => api<AdminCourseDetailResponse>(`/admin/courses/${cid}`),
    enabled: Number.isFinite(cid),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "course", cid] });
    qc.invalidateQueries({ queryKey: ["admin", "courses"] });
  };

  const update = useMutation({
    mutationFn: (values: CourseEditValues) =>
      api<AdminCourse>(`/admin/courses/${cid}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...values,
          price: values.price === "" ? 0 : Number(values.price),
          what_you_will_learn: values.what_you_will_learn
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      }),
    onSuccess: invalidate,
  });

  const toggle = useMutation({
    mutationFn: (status: "draft" | "published") =>
      api<AdminCourse>(`/admin/courses/${cid}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    onSuccess: invalidate,
  });

  const del = useMutation({
    mutationFn: () => api<null>(`/admin/courses/${cid}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      nav("/courses");
    },
  });

  const course = data?.course;

  return (
    <CourseDetailView
      id={cid}
      data={data}
      loading={isLoading}
      error={isError || !data ? String(error ?? new Error("Failed to load course")) : null}
      initial={course ? toForm(course) : undefined}
      onSave={update.mutate}
      saving={update.isPending}
      saveError={update.isError ? "Could not save changes." : null}
      toggling={toggle.isPending}
      onToggle={(s) => toggle.mutate(s)}
      onDelete={del.mutate}
      deleting={del.isPending}
    />
  );
}