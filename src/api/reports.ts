import { api } from "./axiosInstance";

export type ReportReason = "WRONG_ANSWER" | "OUTDATED" | "UNCLEAR" | "OTHER";

export interface ReportResult {
  id: number;
  /** true: miałeś już otwarte zgłoszenie tego pytania, więc je uzupełniliśmy zamiast dodawać nowe. */
  updated: boolean;
}

/** Zgłoszenie błędu w pytaniu (w teście albo w jego fiszce). */
export async function reportQuestion(questionId: number, reason: ReportReason, comment: string): Promise<ReportResult> {
  const res = await api.post<ReportResult>(`/api/questions/${questionId}/reports`, {
    reason,
    comment: comment.trim() || null,
  });
  return res.data;
}
