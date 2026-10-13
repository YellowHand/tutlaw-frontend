import { api } from "./axiosInstance";
import type { TestQueueItem } from "./review";
import type { QuestionOrigin } from "../lib/origin";

/** Zakres egzaminu od najwęższego: źródło, przedmiot, kategoria; bez żadnego cały dostępny materiał. */
export interface ExamScope {
  categoryId?: number;
  subjectId?: number;
  sourceId?: number;
}

export type OptionKey = "A" | "B" | "C";

export interface ExamStart {
  scopeLabel: string;
  /** Ile pytań użytkownik chciał; gdy w zakresie jest mniej, pytań jest tyle, ile dostępnych. */
  requestedCount: number;
  questions: TestQueueItem[];
}

export interface ExamAnswerPayload {
  cardId: number;
  /** null = pytanie bez odpowiedzi. */
  selectedOption: OptionKey | null;
}

export interface ExamSubmitPayload extends ExamScope {
  /** null = egzamin bez limitu czasu. */
  timeLimitMinutes: number | null;
  passThresholdPercent: number;
  durationSeconds: number;
  /** Czy egzamin zakończył się sam, bo skończył się czas. */
  timedOut: boolean;
  answers: ExamAnswerPayload[];
}

export interface ExamAttempt {
  id: number;
  finishedAt: string;
  scopeLabel: string;
  questionCount: number;
  answeredCount: number;
  correctCount: number;
  /** Wynik w procentach, zaokrąglony do 0,1. */
  scorePercent: number;
  passThresholdPercent: number;
  passed: boolean;
  timeLimitMinutes: number | null;
  durationSeconds: number;
  timedOut: boolean;
}

export interface ExamSourceBreakdown {
  sourceName: string;
  total: number;
  correct: number;
}

export interface ExamQuestionResult {
  cardId: number;
  front: string;
  optionA: string;
  optionB: string;
  optionC: string;
  selectedOption: OptionKey | null;
  correctOption: OptionKey;
  correct: boolean;
  /** Wyjaśnienie bywa puste: nie każde pytanie ma już swoje wyjaśnienie. */
  explanation: string | null;
  legalBasis: string | null;
  validAsOf: string | null;
  sourceName: string | null;
  origin: QuestionOrigin;
  examYear: number | null;
}

export interface ExamResult {
  attempt: ExamAttempt;
  /** Pytania, których nie dało się ocenić (usunięte albo już niedostępne); nie wliczają się do wyniku. */
  excludedCount: number;
  bySource: ExamSourceBreakdown[];
  questions: ExamQuestionResult[];
}

export async function startExam(scope: ExamScope, questionCount: number): Promise<ExamStart> {
  const res = await api.post<ExamStart>("/api/exams/start", { ...scope, questionCount });
  return res.data;
}

export async function submitExam(payload: ExamSubmitPayload): Promise<ExamResult> {
  const res = await api.post<ExamResult>("/api/exams/submit", payload);
  return res.data;
}

export async function getExamHistory(): Promise<ExamAttempt[]> {
  const res = await api.get<ExamAttempt[]>("/api/exams/history");
  return res.data;
}

/** Sesja testowa z podanych pytań (np. błędy z egzaminu), w podanej kolejności. */
export async function getPracticeQueue(cardIds: number[]): Promise<TestQueueItem[]> {
  const res = await api.get<TestQueueItem[]>("/api/review/practice-queue", {
    // Spring przyjmuje listę po przecinku; axios domyślnie zapisałby tablicę jako cardIds[]=1&cardIds[]=2.
    params: { cardIds: cardIds.join(",") },
  });
  return res.data;
}
