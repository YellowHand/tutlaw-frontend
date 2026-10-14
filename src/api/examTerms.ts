import { api } from "./axiosInstance";
import type { QuestionOrigin } from "../lib/origin";

/** Termin egzaminu jednej aplikacji. */
export interface ExamTerm {
  origin: QuestionOrigin;
  /** RRRR-MM-DD albo null = termin nieogłoszony. */
  examDate: string | null;
  /** Ile dni do egzaminu; null, gdy terminu nie ma albo już minął. */
  daysToExam: number | null;
}

/** Terminy wszystkich aplikacji (bez pytań autorskich), także tych bez ogłoszonego terminu. */
export async function getExamTerms(): Promise<ExamTerm[]> {
  const res = await api.get<ExamTerm[]>("/api/exam-terms");
  return res.data;
}

/** Tylko administrator. null w examDate usuwa termin. */
export async function updateExamTerm(origin: QuestionOrigin, examDate: string | null): Promise<ExamTerm> {
  const res = await api.put<ExamTerm>(`/api/exam-terms/${origin}`, { examDate });
  return res.data;
}
