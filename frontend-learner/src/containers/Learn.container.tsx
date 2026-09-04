import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "@masterlms/shared";
import type { SharedApiCourseDetail } from "@masterlms/shared";
import { toEmbed } from "@masterlms/shared";
import { absoluteMediaUrl, api } from "../lib/api";
import { LearnView } from "../components/LearnView";

type ApiCourse = SharedApiCourseDetail;

export function LearnContainer({ courseId: propId, title: propTitle }: { courseId?: string; title?: string }) {
  const { id: routeId } = useParams();
  const courseId = String(propId ?? routeId);
  const queryClient = useQueryClient();
  const [active, setActive] = useState<number | null>(null);
  const [openSections, setOpenSections] = useState<Set<number>>(() => new Set([0]));
  const [tab, setTab] = useState<"overview" | "notes" | "qna">("overview");
  const [note, setNote] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const courseQuery = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api<ApiCourse>(`/courses/${courseId}/`),
    enabled: !!courseId,
  });
  const sections = useMemo(() => courseQuery.data?.sections ?? [], [courseQuery.data]);
  const title = courseQuery.data?.title ?? propTitle ?? "Course";

  const progressQuery = useQuery({
    queryKey: ["progress", courseId],
    queryFn: async () => {
      const enrollments = await api<
        { course: { id: number }; completed_lessons: number[]; progress: number }[] | { results: { course: { id: number }; completed_lessons: number[] }[] }
      >("/me/courses");
      const list = Array.isArray(enrollments) ? enrollments : (enrollments.results ?? []);
      return list.find((e) => String(e.course.id) === String(courseId)) ?? null;
    },
    enabled: !!courseId,
  });
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  // init default lesson + saved progress once queries resolve (UI state only)
  useEffect(() => {
    if (sections[0]?.lessons[0] && active == null) setActive(sections[0].lessons[0].id);
  }, [sections, active]);
  useEffect(() => {
    const mine = progressQuery.data;
    if (mine && Array.isArray(mine.completed_lessons)) setCompleted(new Set(mine.completed_lessons));
  }, [progressQuery.data]);

  const ratingQuery = useQuery({
    queryKey: ["rating", courseId],
    queryFn: () => api<{ rating: number | null }>(`/courses/${courseId}/rate/`),
    enabled: !!courseId,
  });
  const userRating = ratingQuery.data?.rating ?? null;

  const completeMutation = useMutation({
    mutationFn: (lessonId: number) =>
      api(`/courses/${courseId}/lessons/complete`, {
        method: "POST",
        body: JSON.stringify({ lesson_id: lessonId }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["progress", courseId] }),
  });

  const [quizResult, setQuizResult] = useState<{
    attempt: number;
    best: number;
  } | null>(null);

  const quizMutation = useMutation({
    mutationFn: (args: { lessonId: number; score: number; total: number }) =>
      api<{ score: number; total: number; passed: boolean; attempt: number; best: number }>(
        `/courses/${courseId}/lessons/quiz-attempt`,
        {
          method: "POST",
          body: JSON.stringify({ lesson_id: args.lessonId, score: args.score, total: args.total }),
        }
      ),
    onSuccess: (res) => setQuizResult({ attempt: res.attempt, best: res.best }),
  });

  const rateMutation = useMutation({
    mutationFn: (rating: number) =>
      api(`/courses/${courseId}/rate/`, { method: "POST", body: JSON.stringify({ rating }) }),
    onSuccess: async () => {
      try {
        await api(`/courses/${courseId}/certificate`, { method: "POST" });
      } catch { /* certificate optional */ }
      queryClient.invalidateQueries({ queryKey: ["rating", courseId] });
      setShowRating(false);
      setToast("Thanks for your rating! Certificate issued ★");
      setTimeout(() => setToast(null), 2600);
    },
    onError: (e) => {
      setToast(String(e));
      setTimeout(() => setToast(null), 2200);
    },
  });

  const allLessons = useMemo(() => sections.flatMap((s) => s.lessons), [sections]);
  const activeLesson = sections.flatMap((s) => s.lessons).find((l) => l.id === active);
  const total = allLessons.length;
  const progress = total ? Math.round((completed.size / total) * 100) : 0;

  const toggleSection = (i: number) => {
    const n = new Set(openSections);
    if (n.has(i)) n.delete(i); else n.add(i);
    setOpenSections(n);
  };

  const markComplete = () => {
    if (active == null) return;
    const next = new Set(completed); next.add(active); setCompleted(next);
    completeMutation.mutate(active);
  };

  const submitQuiz = () => {
    if (active == null || !activeLesson?.quiz_data?.length) return;
    const correct = activeLesson.quiz_data.filter((q, qi) => quizAnswers[qi] === q.correct).length;
    if (correct === activeLesson.quiz_data.length) {
      markComplete();
    }
    // best-effort server log — learner flow never blocks on it
    quizMutation.mutate({ lessonId: active, score: correct, total: activeLesson.quiz_data.length });
    setQuizSubmitted(true);
  };

  const submitRating = () => {
    if (!selectedRating) return;
    rateMutation.mutate(selectedRating);
  };

  if (courseQuery.isLoading) return <p className="py-10 text-center text-sm text-zinc-500">Loading course…</p>;
  if (courseQuery.error) return <p className="py-10 text-center text-sm text-zinc-500">{String(courseQuery.error)}. <Link to={`/courses/${courseId}`} className="inline-flex items-center gap-1 text-[#3478ff] underline"><ArrowLeft size={12} strokeWidth={2.5} /> Back</Link></p>;
  if (total === 0) return <p className="py-10 text-center text-sm text-zinc-500">No lessons yet. <Link to={`/courses/${courseId}`} className="inline-flex items-center gap-1 text-[#3478ff] underline"><ArrowLeft size={12} strokeWidth={2.5} /> Back to course</Link></p>;

  const embedUrl = activeLesson ? toEmbed(activeLesson.resource_url) : null;
  const textBody = activeLesson?.kind === "text" ? (activeLesson.resource_url ?? `*${activeLesson.title}*`) : "";
  const pdfUrl = absoluteMediaUrl(activeLesson?.resource_url);
  const audioUrl = activeLesson?.kind === "audio" ? absoluteMediaUrl(activeLesson.resource_url) : null;

  return (
    <LearnView
      courseId={courseId}
      title={title}
      progress={progress}
      total={total}
      active={active}
      activeLesson={activeLesson}
      embedUrl={embedUrl}
      textBody={textBody}
      pdfUrl={pdfUrl}
      audioUrl={audioUrl}
      sections={sections}
      completed={completed}
      openSections={openSections}
      tab={tab}
      note={note}
      quizAnswers={quizAnswers}
      quizSubmitted={quizSubmitted}
      quizAttempt={quizResult?.attempt ?? null}
      quizBest={quizResult?.best ?? null}
      showRating={showRating}
      selectedRating={selectedRating}
      submittingRating={rateMutation.isPending}
      userRating={userRating}
      toast={toast}
      onSelectLesson={(lessonId) => { setActive(lessonId); setQuizSubmitted(false); setQuizResult(null); }}
      onToggleSection={toggleSection}
      onTab={setTab}
      onNote={setNote}
      onAnswer={(qi, oi) => setQuizAnswers((m) => ({ ...m, [qi]: oi }))}
      onMarkComplete={markComplete}
      onSubmitQuiz={submitQuiz}
      onShowRating={() => setShowRating(true)}
      onSelectRating={setSelectedRating}
      onSubmitRating={submitRating}
    />
  );
}
