import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useEffect } from "react";

type Section = { id: number; title: string; lessons: any[] };
type Course = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  sections: Section[];
  category: string;
  level: string;
  price: string;
};

export function StudentPreviewModal({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api<Course>(`/courses/${courseId}/`),
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (isLoading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 text-white">Loading preview...</div>;
  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative h-[90vh] w-full max-w-4xl overflow-hidden rounded-[28px] bg-[#f6f5f1] shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-white/50 p-2 text-zinc-900 hover:bg-white">✕</button>
        <div className="h-full overflow-y-auto p-8">
            <h1 className="text-3xl font-extrabold">{course.title}</h1>
            <p className="mt-2 text-zinc-600">{course.subtitle}</p>
            <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="font-bold">Description</h2>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{course.description}</p>
            </div>
            <div className="mt-6">
                <h2 className="font-bold">Curriculum</h2>
                <div className="mt-4 space-y-2">
                    {course.sections.map(s => (
                        <div key={s.id} className="rounded-xl border bg-white p-4">
                            <h3 className="font-semibold text-sm">{s.title}</h3>
                            <ul className="mt-2 text-xs text-zinc-500 space-y-1">
                                {s.lessons.map(l => <li key={l.id}>• {l.title}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}