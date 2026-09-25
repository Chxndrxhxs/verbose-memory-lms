import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export type MyEnrollment = {
  id: number;
  course: {
    id: number;
    title: string;
    cover_image: string;
    instructor_name: string;
    price: string;
  };
  progress: number;
  enrolled_at: string;
};

async function fetchMyCourses(): Promise<MyEnrollment[]> {
  try {
    const res = await api<MyEnrollment[] | { results: MyEnrollment[] }>("/me/courses");
    return Array.isArray(res) ? res : res.results ?? [];
  } catch {
    return [];
  }
}

// Single owner of the ["me", "courses"] cache: every consumer gets the same
// array shape and derives what it needs (Set/Map) via useMemo.
export function useMyCourses() {
  return useQuery({ queryKey: ["me", "courses"], queryFn: fetchMyCourses });
}
