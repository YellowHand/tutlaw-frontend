import { api } from "./axiosInstance";

export interface LearningSettings {
  newCardsPerDay: number;
  newTestQuestionsPerDay: number;
  maxReviewsPerDay: number;
  /** Docelowa szansa przypomnienia sobie karty (0,70–0,97). */
  desiredRetention: number;
  /** RRRR-MM-DD albo null. */
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
  /** Tylko gdy ustawiono datę egzaminu, która jeszcze nie minęła. */
  plan: {
    newTestQuestionsLeft: number;
    newFlashcardsLeft: number;
    planningDays: number;
    suggestedTestQuestionsPerDay: number;
    suggestedFlashcardsPerDay: number;
  } | null;
}

/** Pełny zestaw do zapisu: null w polu liczbowym = wartość domyślna, null w examDate = brak daty. */
export interface LearningSettingsUpdate {
  newCardsPerDay: number | null;
  newTestQuestionsPerDay: number | null;
  maxReviewsPerDay: number | null;
  desiredRetention: number | null;
  examDate: string | null;
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
