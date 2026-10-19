import { api } from "./axiosInstance";
import type { Track } from "./tracks";
import type { Theme } from "../lib/theme";

export interface LearningSettings {
  newFlashcardsPerDay: number;
  /**
   * Limit nowych pytań testowych na dzień, który naprawdę obowiązuje. Przy limicie automatycznym wyliczony z planu do
   * egzaminu (nie mniej niż domyślny, nie więcej niż {@link LearningSettings.plan} `maxTestQuestionsPerDay`).
   */
  newTestQuestionsPerDay: number;
  /** true: użytkownik nie ustawił własnego limitu nowych pytań, więc obowiązuje automatyczny. */
  newTestQuestionsAuto: boolean;
  maxReviewsPerDay: number;
  /** Docelowa szansa przypomnienia sobie pytania (0,70–0,97). */
  desiredRetention: number;
  /**
   * Ścieżka, do której użytkownik się przygotowuje: jedna z pięciu aplikacji albo Student. null = jeszcze nie wybrał:
   * okno startowe pokazujemy, dopóki to jest null. Student nie ma terminu, odliczania ani planu.
   */
  track: Track | null;
  /** Termin egzaminu wybranej aplikacji (RRRR-MM-DD, ustawia go administrator) albo null = nieogłoszony / Student / brak wyboru. */
  examDate: string | null;
  shuffleOptions: boolean;
  /** Wygląd aplikacji zapisany na koncie (domyślnie ciemny). */
  theme: Theme;
  daysToExam: number | null;
  examPassed: boolean;
  /** Retencja faktycznie użyta do terminów (w ostatnich 30 dniach przed egzaminem co najmniej 95%). */
  effectiveRetention: number;
  retentionBoosted: boolean;
  defaults: {
    newFlashcardsPerDay: number;
    newTestQuestionsPerDay: number;
    maxReviewsPerDay: number;
    desiredRetention: number;
  };
  /** Tylko gdy wybrana aplikacja ma ogłoszony termin, który jeszcze nie minął. */
  plan: {
    newTestQuestionsLeft: number;
    /** Dni, w których warto jeszcze zaczynać nowe pytania; 0 w ostatnich 14 dniach (same powtórki). */
    planningDays: number;
    /** Ile nowych pytań dziennie trzeba, żeby zdążyć je zacząć przed rezerwą na powtórki (bez sufitu); 0 w ostatnich 14 dniach. */
    requiredTestQuestionsPerDay: number;
    /** Sufit limitu automatycznego: powyżej powtórki rosną szybciej, niż da się je robić. */
    maxTestQuestionsPerDay: number;
    /** Cel na dziś: tyle co `requiredTestQuestionsPerDay`, ale nie więcej niż sufit. Liczony od stanu z początku dnia. */
    suggestedTestQuestionsPerDay: number;
    /** Ile nowych pytań testowych użytkownik zaczął dzisiaj. */
    newTestQuestionsToday: number;
  } | null;
}

/**
 * Pełny zestaw do zapisu: null w polu liczbowym = wartość domyślna, a w `newTestQuestionsPerDay` = limit automatyczny.
 * Daty egzaminu ani wyglądu tu nie ma (datę ustawia administrator, wygląd ma własne żądanie).
 */
export interface LearningSettingsUpdate {
  newFlashcardsPerDay: number | null;
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
 * Wybór ścieżki: aplikacji albo Studenta. Od ścieżki zależy pula pytań (własne arkusze albo akty prawne ścieżki)
 * i termin egzaminu. Zmiana ścieżki zdejmuje zawężenie puli do aktów i przywraca domyślny filtr źródeł.
 */
export async function chooseTrack(trackId: number): Promise<LearningSettings> {
  const res = await api.put<LearningSettings>("/api/me/track", { trackId });
  return res.data;
}

/** Wybór wyglądu aplikacji (ciemny / jasny). Zapisany na koncie, więc taki sam na każdym urządzeniu. */
export async function chooseTheme(theme: Theme): Promise<LearningSettings> {
  const res = await api.put<LearningSettings>("/api/me/theme", { theme });
  return res.data;
}
