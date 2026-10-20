import { api } from "./axiosInstance";

/**
 * Z czego składają się postępy użytkownika, czyli co zniknie po wyzerowaniu (a w odpowiedzi na zerowanie: co znikło).
 * Konto, ścieżka, ustawienia nauki, wybrane przedmioty i zgłoszenia błędów nie należą do postępów i zostają.
 */
export interface StudyProgress {
  /** Pytania w nauce w trybie testu. */
  testQuestions: number;
  /** Pytania w nauce w trybie fiszek. */
  flashcards: number;
  /** Zapisane odpowiedzi (historia we wszystkich trybach). */
  answers: number;
  /** Pytania dodane do fiszek ręcznie. */
  manualFlashcards: number;
  /** Własne testy z „Moich testów". */
  customTests: number;
  /** Podejścia do egzaminu próbnego. */
  exams: number;
  /** Łączny czas nauki w sekundach. */
  studyTimeSeconds: number;
}

/** Słowo, które użytkownik wpisuje, żeby potwierdzić zerowanie (serwer sprawdza je jeszcze raz). */
export const RESET_CONFIRMATION_WORD = "WYZERUJ";

/** Ile czego zniknie po wyzerowaniu; niczego nie zmienia. */
export async function getStudyProgress(): Promise<StudyProgress> {
  const res = await api.get<StudyProgress>("/api/me/study-progress");
  return res.data;
}

/** Zeruje postępy zalogowanego użytkownika (nieodwracalnie). Odpowiada liczbami sprzed kasowania. */
export async function resetStudyProgress(): Promise<StudyProgress> {
  const res = await api.delete<StudyProgress>("/api/me/study-progress", {
    data: { confirm: RESET_CONFIRMATION_WORD },
  });
  return res.data;
}

/** Czy wpisany tekst potwierdza zerowanie: bez spacji wokół i bez względu na wielkość liter. */
export function isResetConfirmed(typed: string): boolean {
  return typed.trim().toUpperCase() === RESET_CONFIRMATION_WORD;
}

/** Czy użytkownik ma w ogóle jakieś postępy, które można wyzerować. */
export function hasProgress(progress: StudyProgress): boolean {
  return (
    progress.testQuestions + progress.flashcards + progress.answers + progress.manualFlashcards +
      progress.customTests + progress.exams + progress.studyTimeSeconds >
    0
  );
}
