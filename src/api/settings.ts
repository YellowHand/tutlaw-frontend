import { api } from "./axiosInstance";
import type { QuestionOrigin } from "../lib/origin";

export interface LearningSettings {
  newCardsPerDay: number;
  newTestQuestionsPerDay: number;
  maxReviewsPerDay: number;
  /** Docelowa szansa przypomnienia sobie karty (0,70–0,97). */
  desiredRetention: number;
  /** Aplikacja, do której użytkownik się przygotowuje (z niej bierze się termin); null = jeszcze nie wybrał. */
  examOrigin: QuestionOrigin | null;
  /** Termin egzaminu wybranej aplikacji (RRRR-MM-DD, ustawia go administrator) albo null = nieogłoszony / brak wyboru. */
  examDate: string | null;
  shuffleOptions: boolean;
  daysToExam: number | null;
  examPassed: boolean;
  /** Retencja faktycznie użyta do terminów (w ostatnich 30 dniach przed egzaminem co najmniej 95%). */
  effectiveRetention: number;
  retentionBoosted: boolean;
  defaults: {
    newCardsPerDay: number;
    newTestQuestionsPerDay: number;
    maxReviewsPerDay: number;
    desiredRetention: number;
  };
  /** Tylko gdy wybrana aplikacja ma ogłoszony termin, który jeszcze nie minął. */
  plan: {
    newTestQuestionsLeft: number;
    newFlashcardsLeft: number;
    /** Dni, w których warto jeszcze zaczynać nowe pytania; 0 w ostatnich 14 dniach (same powtórki). */
    planningDays: number;
    /** Cel na dziś, liczony od stanu z początku dnia; 0 w ostatnich 14 dniach. */
    suggestedTestQuestionsPerDay: number;
    suggestedFlashcardsPerDay: number;
    /** Ile nowych pytań testowych użytkownik zaczął dzisiaj. */
    newTestQuestionsToday: number;
  } | null;
}

/** Pełny zestaw do zapisu: null w polu liczbowym = wartość domyślna. Daty egzaminu tu nie ma (ustawia ją administrator). */
export interface LearningSettingsUpdate {
  newCardsPerDay: number | null;
  newTestQuestionsPerDay: number | null;
  maxReviewsPerDay: number | null;
  desiredRetention: number | null;
  shuffleOptions: boolean;
}

export async function getLearningSettings(): Promise<LearningSettings> {
  const res = await api.get<LearningSettings>("/api/me/settings");
  return res.data;
}

export async function updateLearningSettings(update: LearningSettingsUpdate): Promise<LearningSettings> {
  const res = await api.put<LearningSettings>("/api/me/settings", update);
  return res.data;
}

/**
 * Wybór aplikacji, do której użytkownik się przygotowuje. Serwer ustawia przy tym filtr pochodzenia pytań na tę
 * aplikację i pytania autorskie (jednorazowo; później filtr zmienia się osobno).
 */
export async function chooseExam(origin: QuestionOrigin): Promise<LearningSettings> {
  const res = await api.put<LearningSettings>("/api/me/exam", { origin });
  return res.data;
}
