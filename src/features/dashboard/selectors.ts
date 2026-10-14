import type { ExamAttempt } from "../../api/exam";

/** Co ma zrobić główny przycisk na pulpicie. Kolejność: zaległe pytania, zaległe fiszki, nowe pytania, nic. */
export type TodayAction =
  | { kind: "due-tests"; count: number; flashcards: number }
  | { kind: "due-flashcards"; count: number }
  | { kind: "new-questions" }
  | { kind: "all-done" };

interface TodayInput {
  dueTests: number;
  dueFlashcards: number;
  /** Czy zostały pytania, których użytkownik jeszcze nie rozwiązał. */
  newQuestionsLeft: boolean;
}

export function pickTodayAction({ dueTests, dueFlashcards, newQuestionsLeft }: TodayInput): TodayAction {
  if (dueTests > 0) return { kind: "due-tests", count: dueTests, flashcards: Math.max(0, dueFlashcards) };
  if (dueFlashcards > 0) return { kind: "due-flashcards", count: dueFlashcards };
  if (newQuestionsLeft) return { kind: "new-questions" };
  return { kind: "all-done" };
}

/** Procent 0–100 z licznika i mianownika; 0 przy pustym mianowniku. */
export function percentOf(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}

/**
 * Ostatnie podejścia do egzaminu w stałym formacie (z progiem w punktach), od najstarszego do najnowszego,
 * do wykresu. Podejścia sprzed stałego formatu miały własny zakres i próg, więc nie są z nimi porównywalne.
 */
export function recentFixedFormatAttempts(history: ExamAttempt[], limit = 5): ExamAttempt[] {
  return history
    .filter((attempt) => attempt.passPoints !== null)
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
    .slice(0, limit)
    .reverse();
}
