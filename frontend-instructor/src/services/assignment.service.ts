import { api } from "../lib/api";
import { createEmptyAssignment, type Assignment, type AssignmentStatus } from "../types/assignment";

interface AssignmentListResponse {
  data: Assignment[];
  error: null;
  meta: { page: number; total: number };
}

const LIST_PAGE_SIZE = 12;

// Raw row from GET /admin/assignments/ (snake_case canonical payload).
// The full wizard state rides along in draft_data — the list card is built
// from it so title, model, questions and counts match the editor.
interface AdminAssignmentRow {
  id?: number | string;
  title?: string;
  status?: AssignmentStatus;
  created_at?: string;
  updated_at?: string;
  draft_data?: Partial<Assignment> | null;
}

function toAssignmentCard(row: AdminAssignmentRow): Assignment {
  const dd = row.draft_data ?? {};
  return {
    ...createEmptyAssignment(),
    ...dd,
    id: String(row.id ?? dd.id ?? ""),
    title: row.title ?? dd.title ?? "",
    status: row.status ?? dd.status ?? "draft",
    createdAt: row.created_at ?? dd.createdAt ?? "",
    updatedAt: row.updated_at ?? dd.updatedAt ?? "",
  };
}

export interface ExtractedQuestionRaw {
  question?: unknown;
  questionImage?: unknown;
  question_image?: unknown;
  options?: unknown;
  correctAnswer?: unknown;
  correct_answer?: unknown;
  explanation?: unknown;
  marks?: unknown;
  difficulty?: unknown;
  topic?: unknown;
  needs_review?: unknown;
  missing_figure?: unknown;
  has_answer?: unknown;
}

export interface ExtractQuestionsResult {
  questions: ExtractedQuestionRaw[];
  done_pages: number[];
  pending_pages: number[];
  skipped_pages: number[];
  total_pages: number;
  rate_limited: boolean;
  error?: string;
}

export interface ExtractJobEnvelope {
  job_id: string;
  status: "queued" | "running" | "paused" | "done" | "failed";
  source_document: string;
  questions: ExtractedQuestionRaw[];
  done_pages: number[];
  pending_pages: number[];
  skipped_pages: number[];
  total_pages: number;
  rate_limited: boolean;
  error: string;
}

export const assignmentService = {
  async list(page = 1, search = "", status?: AssignmentStatus): Promise<AssignmentListResponse> {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    // The endpoint returns a bare array (no meta envelope); search/status are
    // already applied server-side, so paginate the mapped cards client-side.
    const rows = await api<AdminAssignmentRow[]>(
      `/admin/assignments/?${params.toString()}`
    );
    const all = (Array.isArray(rows) ? rows : []).map(toAssignmentCard);
    const start = (Math.max(1, page) - 1) * LIST_PAGE_SIZE;
    return {
      data: all.slice(start, start + LIST_PAGE_SIZE),
      error: null,
      meta: { page, total: all.length },
    };
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

  async extractQuestions(config: {
    source_document: string;
    difficulty: string;
    marksPerQuestion: number;
    pending_pages?: number[];
    done_pages?: number[];
    async_mode?: boolean;
  }): Promise<ExtractQuestionsResult> {
    return api(`/admin/assignments/extract-questions`, {
      method: "POST",
      body: JSON.stringify(config),
    });
  },

  async getExtractJob(jobId: string): Promise<ExtractJobEnvelope> {
    return api(`/admin/assignments/extract-jobs/${jobId}`);
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
