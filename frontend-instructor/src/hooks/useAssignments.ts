import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentService } from "../services/assignment.service";
import type { Assignment, AssignmentStatus } from "../types/assignment";

export function useAssignmentList(
  page = 1,
  search = "",
  status?: AssignmentStatus
) {
  return useQuery({
    queryKey: ["assignments", page, search, status],
    queryFn: () => assignmentService.list(page, search, status),
  });
}

export function useAssignment(id: string) {
  return useQuery({
    queryKey: ["assignment", id],
    queryFn: () => assignmentService.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Assignment>) => assignmentService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Assignment> }) =>
      assignmentService.update(id, data),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["assignment", variables.id] });
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function usePublishAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentService.publish(id),
    onSuccess: (_result, id) => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["assignment", id] });
    },
  });
}

export function useArchiveAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentService.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useDuplicateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentService.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useGenerateQuestions() {
  return useMutation({
    mutationFn: ({
      id,
      config,
    }: {
      id: string;
      config: Parameters<typeof assignmentService.generateQuestions>[1];
    }) => assignmentService.generateQuestions(id, config),
  });
}

export function useRegenerateQuestion() {
  return useMutation({
    mutationFn: ({
      assignmentId,
      questionId,
    }: {
      assignmentId: string;
      questionId: string;
    }) => assignmentService.regenerateQuestion(assignmentId, questionId),
  });
}

export function useRegenerateOptions() {
  return useMutation({
    mutationFn: ({
      assignmentId,
      questionId,
    }: {
      assignmentId: string;
      questionId: string;
    }) => assignmentService.regenerateOptions(assignmentId, questionId),
  });
}
