import { useCallback, useEffect, useMemo, useState } from "react";
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
      <div className="flex min-h-screen items-center justify-center bg-room text-sm text-halt">
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
    sections,
    counts,
    currentIndex,
    currentSectionIndex,
    selectAnswer,
    markForReview,
    clearAnswer,
    goTo,
    next,
    previous,
    goToSection,
    saveStatus,
    buildSubmitAnswers,
    submitSection,
    isSectionUnlocked,
    isSectionSubmitted,
    sequential,
    isCurrentSectionLast,
    isLastSection,
  } = useAssignmentQuestionState(
    take.structure,
    take.answers ?? {},
    attemptId,
    take.attempt.execution_mode === "sequential",
  );

  const [violations, setViolations] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const { isFullscreen, enter, exit } = useFullscreen();

  const securityEnabled = detailQuery.data?.security;

  // Practice mode is untimed study: no camera gate, no lockdown, no
  // copy/paste/tab listeners. Mock stays fully proctored.
  const isPractice = take.attempt.model_code === "practice";
  const cameraRequired = !isPractice;
  const effectiveSecurity = useMemo(() => {
    if (isPractice) {
      return {
        block_copy: false,
        block_paste: false,
        block_tab_switch: false,
        violations_before_auto_submit: 0,
      };
    }
    return securityEnabled;
  }, [isPractice, securityEnabled]);

  // Always-on exam lockdown for proctored modes only.
  useExamLockdown(!isPractice);

  // Leave fullscreen whenever the exam screen is unmounted (submit, back-nav).
  useEffect(() => {
    return () => {
      exit();
    };
  }, [exit]);

  useEffect(() => {
    if (!effectiveSecurity) return;
    const prevent = (event: Event) => event.preventDefault();
    const onVisibility = () => {
      if (document.hidden && effectiveSecurity.block_tab_switch) {
        setViolations((v) => v + 1);
      }
    };
    if (effectiveSecurity.block_copy) document.addEventListener("copy", prevent);
    if (effectiveSecurity.block_paste) document.addEventListener("paste", prevent);
    if (effectiveSecurity.block_tab_switch)
      document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [effectiveSecurity]);

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

  // Sequential mode: finishing a section unlocks and advances to the next
  // one (handled in the hook). On the final section there is nothing left to
  // unlock, so it submits the whole exam.
  const onSubmitSection = useCallback(() => {
    submitSection(currentSectionIndex);
    if (isLastSection) {
      submitMutation.mutate();
    }
  }, [submitSection, currentSectionIndex, isLastSection, submitMutation]);

  useEffect(() => {
    const threshold = effectiveSecurity?.violations_before_auto_submit ?? 0;
    if (threshold > 0 && violations >= threshold) {
      onAutoSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [violations, effectiveSecurity?.violations_before_auto_submit]);

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
        sections={sections}
        counts={counts}
        currentIndex={currentIndex}
        currentSectionIndex={currentSectionIndex}
        saveStatus={saveStatus}
        violations={violations}
        isFullscreen={isFullscreen}
        cameraStream={cameraStream}
        onAnswer={selectAnswer}
        onMarkForReview={markForReview}
        onClear={clearAnswer}
        onGoTo={goTo}
        onGoToSection={goToSection}
        onNext={next}
        onPrevious={previous}
        onSubmitSection={onSubmitSection}
        isSectionUnlocked={isSectionUnlocked}
        isSectionSubmitted={isSectionSubmitted}
        sequential={sequential}
        isCurrentSectionLast={isCurrentSectionLast}
        isLastSection={isLastSection}
        onEnterFullscreen={enter}
        onSubmit={() => submitMutation.mutate()}
        onAutoSubmit={onAutoSubmit}
        submitting={submitMutation.isPending}
        practice={isPractice}
      />
    </>
  );
}

function useExamLockdown(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled]);
}

function TakeLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-room text-sm text-ink-muted">
      Loading your attempt…
    </div>
  );
}