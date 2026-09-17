import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  getAssignmentAttempt,
  getAssignmentDetail,
  submitAssignmentAttempt,
  type AssignmentAttemptBrief,
  type AssignmentTakeStep,
} from "@masterlms/shared";
import { AssignmentTakeView } from "../components/AssignmentTakeView";
import { CameraGate } from "../components/CameraGate";
import { useAssignmentQuestionState } from "../hooks/useAssignmentQuestionState";
import { useFullscreen } from "../hooks/useFullscreen";

type TakeData = {
  attempt: AssignmentAttemptBrief;
  structure: AssignmentTakeStep[];
  answers?: Record<string, Record<string, number>>;
};

export function AssignmentTakeContainer({ attemptId }: { attemptId: string }) {
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["assignment-attempt", attemptId],
    queryFn: () => getAssignmentAttempt(Number(attemptId)),
    retry: false,
  });

  useEffect(() => {
    if (query.data && "transcript" in query.data) {
      const assignmentIdFromResult = query.data.attempt.assignment;
      navigate(
        `/assignments/transcript/${assignmentIdFromResult}?attempt_id=${query.data.attempt.id}`,
        { replace: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data]);

  if (query.isLoading) {
    return <TakeLoading />;
  }
  if (query.error || !query.data || !("structure" in query.data)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f5f1] text-sm text-red-600">
        {(query.error as Error | null)?.message ?? "Attempt not found or already submitted"}
      </div>
    );
  }

  return <TakeRunner take={query.data} key={attemptId} />;
}

function TakeRunner({ take }: { take: TakeData }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const assignmentId = take.attempt.assignment;
  const attemptId = take.attempt.id;

  const detailQuery = useQuery({
    queryKey: ["assignment-detail", String(assignmentId)],
    queryFn: () => getAssignmentDetail(Number(assignmentId)),
    enabled: assignmentId > 0,
  });

  const {
    questions,
    counts,
    currentIndex,
    selectAnswer,
    markForReview,
    clearAnswer,
    goTo,
    next,
    previous,
    saveStatus,
    buildSubmitAnswers,
  } = useAssignmentQuestionState(take.structure, take.answers ?? {}, attemptId);

  const [violations, setViolations] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const { isFullscreen, enter, exit } = useFullscreen();

  const securityEnabled = detailQuery.data?.security;

  // Camera is mandatory for every exam — enforced here regardless of the
  // assignment's stored security flags so proctoring cannot be skipped.
  const cameraRequired = true;

  // Always-on exam lockdown: right-click, Escape, F-keys, all Ctrl/Cmd & Alt combos.
  useExamLockdown();

  // Leave fullscreen whenever the exam screen is unmounted (submit, back-nav).
  useEffect(() => {
    return () => {
      exit();
    };
  }, [exit]);

  useEffect(() => {
    if (!securityEnabled) return;
    const prevent = (event: Event) => event.preventDefault();
    const onVisibility = () => {
      if (document.hidden && securityEnabled.block_tab_switch) {
        setViolations((v) => v + 1);
      }
    };
    if (securityEnabled.block_copy) document.addEventListener("copy", prevent);
    if (securityEnabled.block_paste) document.addEventListener("paste", prevent);
    if (securityEnabled.block_tab_switch) document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [securityEnabled]);

  // If the camera stream dies mid-exam, count it as a violation.
  useEffect(() => {
    if (!cameraStream) return;
    const track = cameraStream.getVideoTracks()[0];
    if (!track) return;
    const onEnded = () => {
      if (cameraRequired) setViolations((v) => v + 1);
    };
    track.addEventListener("ended", onEnded);
    return () => track.removeEventListener("ended", onEnded);
  }, [cameraStream, cameraRequired]);

  // Stop all camera/mic tracks when leaving the exam.
  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach((t) => t.stop());
    };
  }, [cameraStream]);

  const doSubmit = useCallback(async () => {
    const finalAnswers = buildSubmitAnswers();
    const result = await submitAssignmentAttempt(assignmentId, attemptId, finalAnswers);
    cameraStream?.getTracks().forEach((t) => t.stop());
    exit();
    queryClient.setQueryData(["assignment-transcript", String(assignmentId)], result);
    navigate(`/assignments/transcript/${assignmentId}?attempt_id=${attemptId}`, {
      replace: true,
    });
  }, [assignmentId, attemptId, buildSubmitAnswers, cameraStream, exit, navigate, queryClient]);

  const submitMutation = useMutation({ mutationFn: doSubmit });

  const onAutoSubmit = useCallback(() => {
    if (submitMutation.isPending) return;
    submitMutation.mutate();
  }, [submitMutation]);

  useEffect(() => {
    const threshold = detailQuery.data?.security?.violations_before_auto_submit ?? 0;
    if (threshold > 0 && violations >= threshold) {
      onAutoSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [violations, detailQuery.data?.security?.violations_before_auto_submit]);

  return (
    <>
      {cameraRequired && !cameraStream && (
        <CameraGate
          onApproved={setCameraStream}
          microphone={!!securityEnabled?.microphone}
        />
      )}
      <AssignmentTakeView
        title={detailQuery.data?.title ?? null}
        attempt={take.attempt}
        questions={questions}
        counts={counts}
        currentIndex={currentIndex}
        saveStatus={saveStatus}
        violations={violations}
        isFullscreen={isFullscreen}
        cameraStream={cameraStream}
        onAnswer={selectAnswer}
        onMarkForReview={markForReview}
        onClear={clearAnswer}
        onGoTo={goTo}
        onNext={next}
        onPrevious={previous}
        onEnterFullscreen={enter}
        onSubmit={() => submitMutation.mutate()}
        onAutoSubmit={onAutoSubmit}
        submitting={submitMutation.isPending}
      />
    </>
  );
}

function useExamLockdown() {
  useEffect(() => {
    const onContextMenu = (event: Event) => event.preventDefault();
    const onKeyDown = (event: KeyboardEvent) => {
      const blocked =
        event.key === "Escape" ||
        event.key === "F12" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey;
      if (blocked) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);
}

function TakeLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f5f1] text-sm text-zinc-500">
      Loading attempt…
    </div>
  );
}