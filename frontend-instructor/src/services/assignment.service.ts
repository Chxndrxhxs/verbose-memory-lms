import { api } from "../lib/api";
import type { Assignment, AssignmentStatus } from "../types/assignment";

interface AssignmentListResponse {
  data: Assignment[];
  error: null;
  meta: { page: number; total: number };
}

export const assignmentService = {
  async list(page = 1, search = "", status?: AssignmentStatus): Promise<AssignmentListResponse> {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const envelope = await api<AssignmentListResponse>(
      `/admin/assignments/?${params.toString()}`
    );
    return envelope;
  },

  async get(id: string): Promise<Assignment> {
    const result = await api<Assignment & { draft_data?: Assignment }>(
      `/admin/assignments/${id}/`
    );
    return result.draft_data ?? result;
  },

  async create(data: Partial<Assignment>): Promise<Assignment> {
    return api<Assignment>("/admin/assignments/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Assignment>): Promise<Assignment> {
    return api<Assignment>(`/admin/assignments/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async remove(id: string): Promise<void> {
    await api(`/admin/assignments/${id}/`, { method: "DELETE" });
  },

  async publish(id: string): Promise<Assignment> {
    return api<Assignment>(`/admin/assignments/${id}/publish`, {
      method: "POST",
    });
  },

  async saveStructure(id: string, models: unknown[]): Promise<void> {
    await api(`/admin/assignments/${id}/structure`, {
      method: "PUT",
      body: JSON.stringify({ models }),
    });
  },

  async archive(id: string): Promise<Assignment> {
    return api<Assignment>(`/admin/assignments/${id}/unpublish`, {
      method: "POST",
    });
  },

  async duplicate(id: string): Promise<Assignment> {
    return api<Assignment>(`/admin/assignments/${id}/duplicate`, {
      method: "POST",
    });
  },

  async generateQuestions(
    _id: string,
    config: {
      numberOfQuestions: number;
      difficulty: string;
      marksPerQuestion: number;
      numberOfOptions: number;
      generateExplanations: boolean;
      distributeEvenly: boolean;
    }
  ): Promise<{ questions: Assignment["questions"] }> {
    return api(`/admin/assignments/generate-questions`, {
      method: "POST",
      body: JSON.stringify(config),
    });
  },

  async regenerateQuestion(
    _assignmentId: string,
    _questionId: string
  ): Promise<{ question: Assignment["questions"][0] }> {
    return api(`/admin/assignments/regenerate-question`, {
      method: "POST",
    });
  },

  async regenerateOptions(
    _assignmentId: string,
    _questionId: string
  ): Promise<{ question: Assignment["questions"][0] }> {
    return api(`/admin/assignments/regenerate-options`, {
      method: "POST",
    });
  },
};
