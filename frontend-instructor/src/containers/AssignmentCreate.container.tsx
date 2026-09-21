import { useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";
import { useAssignment, useCreateAssignment, useUpdateAssignment } from "../hooks/useAssignments";
import { AssignmentWizard } from "../components/AssignmentWizard";
import {
  createEmptyAssignment,
  validateAssignment,
  getTotalMarks,
  ensureModelsCollectPool,
  poolQuestionIdsChanged,
  buildModel2FromQuestions,
  type Assignment,
  type AssignmentValidationError,
} from "../types/assignment";
import { assignmentService } from "../services/assignment.service";

export function AssignmentCreateContainer({ existingId }: { existingId?: string }) {
  const [assignment, setAssignment] = useState<Assignment>(createEmptyAssignment());
  const [errors, setErrors] = useState<AssignmentValidationError[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const existingQuery = useAssignment(existingId || "");
  const createMut = useCreateAssignment();
  const updateMut = useUpdateAssignment();

  useEffect(() => {
    if (existingQuery.data) {
      const saved = existingQuery.data;
      setAssignment({
        ...createEmptyAssignment(),
        ...saved,
        questions: saved.questions ?? [],
        tests: saved.tests ?? [],
        model3Tests: saved.model3Tests ?? [],
      });
    }
  }, [existingQuery.data]);

  useEffect(() => {
    if (existingQuery.error) {
      setToast("Failed to load assignment");
      setTimeout(() => setToast(null), 3000);
    }
  }, [existingQuery.error]);

  useEffect(() => {
    const v = validateAssignment(assignment);
    setErrors(v);
  }, [assignment]);

  const handleAssignmentChange = (next: Assignment) => {
    let built = next;
    const poolChanged = poolQuestionIdsChanged(
      assignment.questions,
      next.questions
    );
    if (poolChanged || next.modelType !== assignment.modelType) {
      built = ensureModelsCollectPool(next);
    }
    // Switching to a multi-stage model with no tests/sets yet builds them
    // automatically from the question pool so the wizard never shows an empty
    // configuration screen. model_3 stores its tests in `tests` with sets.
    if (next.modelType !== assignment.modelType) {
      if (next.modelType !== "model_1") {
        if (built.tests.length === 0 && built.questions.length > 0) {
          built = {
            ...built,
            tests: buildModel2FromQuestions(built.questions, built.duration),
          };
        }
      }
    }
    setAssignment(built);
  };

  const persistDraft = async (): Promise<string | null> => {
    setSaving(true);
    try {
      const draftData: Assignment = {
        ...assignment,
        totalMarks: assignment.totalMarks || getTotalMarks(assignment),
        status: "draft" as const,
      };
      // Only send API fields Django understands. The full UI draft belongs in
      // `draft_data`, so labels such as the course name never get treated as a
      // course primary key by the server.
      const payload = {
        title: draftData.title,
        description: draftData.description,
        instructions: draftData.instructions,
        difficulty: draftData.difficulty,
        status: "draft" as const,
        source_document: draftData.sourceDocument,
        source_document_name: draftData.sourceDocumentName,
        passing_percentage: draftData.passingPercentage,
        randomize_questions: draftData.randomizeQuestions,
        randomize_options: draftData.randomizeOptions,
        negative_marking: draftData.negativeMarking,
        negative_marks_per_wrong: draftData.negativeMarks,
        draft_data: draftData,
      };

      const assignmentId = existingId || assignment.id;
      if (assignmentId) {
        await updateMut.mutateAsync({ id: assignmentId, data: payload });
        setToast("Draft saved!");
        setTimeout(() => setToast(null), 1500);
        return assignmentId;
      } else {
        const created = await createMut.mutateAsync(payload);
        if (created.id) {
          const createdId = String(created.id);
          setAssignment((current) => ({ ...current, id: createdId }));
          setToast("Draft saved!");
          setTimeout(() => setToast(null), 1500);
          return createdId;
        }
      }
      throw new Error("The server did not return an assignment ID.");
    } catch (e) {
      setToast(String(e));
      setTimeout(() => setToast(null), 4000);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (publish: boolean) => {
    const assignmentId = await persistDraft();
    if (!assignmentId || !publish) return;
    try {
      await assignmentService.saveStructure(
        assignmentId,
        buildAssignmentModels(assignment)
      );
      await assignmentService.publish(assignmentId);
      setToast("Assignment published! Learners can now see it.");
    } catch (error) {
      setToast(String(error));
    }
  };

  const isEditing = Boolean(existingId && existingQuery.data);

  const blocker = useBlocker(
    Boolean(
      !saving &&
        !isEditing &&
        (assignment.title.trim() ||
          assignment.description.trim() ||
          assignment.sourceDocumentName)
    )
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    const leave = window.confirm(
      "You have unsaved changes. Are you sure you want to leave?"
    );
    if (leave) blocker.proceed();
    else blocker.reset();
  }, [blocker, blocker.state]);

  return (
    <div className="w-full px-4 py-4 sm:px-6">
      {existingId && existingQuery.isLoading ? (
        <div className="flex items-center justify-center py-20 text-sm text-zinc-500">
          Loading assignment…
        </div>
      ) : (
        <AssignmentWizard
          assignment={assignment}
          onAssignmentChange={handleAssignmentChange}
          onSave={handleSave}
          onPersistDraft={persistDraft}
          saving={saving}
          errors={errors}
          isEditing={isEditing}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function buildAssignmentModels(assignment: Assignment): unknown[] {
  const byId = new Map(assignment.questions.map((question) => [question.id, question]));
  const questionPayload = (question: Assignment["questions"][number]) => ({
    question: question.question,
    question_image: question.questionImage,
    options: question.options,
    correct_answer: question.correctAnswer,
    explanation: question.explanation,
    marks: question.marks,
    difficulty: question.difficulty,
    topic: question.topic,
  });
  const questionsFor = (ids: string[], fallback = assignment.questions) =>
    (ids.length ? ids.map((id) => byId.get(id)).filter(Boolean) : fallback).map(
      (question) => questionPayload(question as Assignment["questions"][number])
    );

  const tests =
    assignment.tests.length > 0
      ? assignment.tests
      : buildModel2FromQuestions(assignment.questions, assignment.duration);
  const testSteps = tests.map((test) => ({
    name: test.title,
    description: test.description,
    duration_seconds: test.duration * 60,
    ...(assignment.modelType === "model_3"
      ? {
          children: test.sets.map((set) => ({
            kind: "set",
            name: set.title,
            description: set.description,
            duration_seconds: set.duration * 60,
            questions: questionsFor(set.questionIds, set.questions),
          })),
        }
      : { questions: questionsFor(test.questionIds, test.questions) }),
  }));

  // One selected model only: the wizard persists the instructor's chosen
  // modelType instead of all three, so structure/validation/preview agree.
  const modelMeta = {
    model_1: {
      code: "model_1",
      name: "Direct MCQ",
      description: "All questions in one direct MCQ paper.",
    },
    model_2: { code: "model_2", name: "Tests", description: "Questions split into timed tests." },
    model_3: {
      code: "model_3",
      name: "Tests & Sets",
      description: "Timed tests containing question sets.",
    },
  }[assignment.modelType];
  const modelSteps =
    assignment.modelType === "model_1"
      ? [
          {
            name: "MCQ",
            duration_seconds: assignment.duration * 60,
            questions: assignment.questions.map(questionPayload),
          },
        ]
      : testSteps;

  return [{ ...modelMeta, steps: modelSteps }];
}
