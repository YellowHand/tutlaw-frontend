import { api } from "./axiosInstance";
import type { TestQueueItem } from "./review";
import type { QuestionOrigin } from "../lib/origin";

export type OptionKey = "A" | "B" | "C";

/**
 * Egzamin ma stały format: zawsze 150 pytań z całego materiału, zaliczenie od 100 punktów. Losuje je i ocenia serwer,
 * użytkownik niczego nie wybiera (poza czasem, który liczy tylko frontend).
 */
export interface ExamStart {
  scopeLabel: string;
  /** Ile pytań ma pełny egzamin (150); gdy w materiale jest mniej, pytań jest tyle, ile dostępnych. */
  requestedCount: number;
  /** Ile punktów trzeba mieć, żeby zdać ten egzamin: 100, a przy krótszym zestawie proporcjonalnie. */
  passPoints: number;
  questions: TestQueueItem[];
}

export interface ExamAnswerPayload {
  cardId: number;
  /** null = pytanie bez odpowiedzi. */
  selectedOption: OptionKey | null;
}

/** Próg zaliczenia i zakres ustala serwer, więc w zgłoszeniu ich nie ma. */
export interface ExamSubmitPayload {
  /** null = egzamin bez limitu czasu. */
  timeLimitMinutes: number | null;
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
  /** Próg w pełnych procentach (do wyświetlania liczy się `passPoints`, gdy jest). */
  passThresholdPercent: number;
  /**
   * Próg zaliczenia w punktach (100 z 150). null = podejście sprzed stałego formatu: miało własny próg w procentach
   * (`passThresholdPercent`) i własny zakres.
   */
  passPoints: number | null;
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

export async function startExam(): Promise<ExamStart> {
  const res = await api.post<ExamStart>("/api/exams/start");
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
