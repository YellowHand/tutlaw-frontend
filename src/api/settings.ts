import { api } from "./axiosInstance";
import type { QuestionOrigin } from "../lib/origin";
import type { Theme } from "../lib/theme";

export interface LearningSettings {
  newCardsPerDay: number;
  /**
   * Limit nowych pytań testowych na dzień, który naprawdę obowiązuje. Przy limicie automatycznym wyliczony z planu do
   * egzaminu (nie mniej niż domyślny, nie więcej niż {@link LearningSettings.plan} `maxTestQuestionsPerDay`).
   */
  newTestQuestionsPerDay: number;
  /** true: użytkownik nie ustawił własnego limitu nowych pytań, więc obowiązuje automatyczny. */
  newTestQuestionsAuto: boolean;
  maxReviewsPerDay: number;
  /** Docelowa szansa przypomnienia sobie karty (0,70–0,97). */
  desiredRetention: number;
  /** Aplikacja, do której użytkownik się przygotowuje (z niej bierze się termin); null = student albo jeszcze nie wybrał. */
  examOrigin: QuestionOrigin | null;
  /**
   * Czy użytkownik zrobił wybór w oknie startowym: aplikację albo „Jestem studentem". Okno startowe pokazujemy, dopóki
   * to jest false. Student ma `startChoiceMade = true` i `examOrigin = null`: bez odliczania, planu i zawężenia pytań.
   */
  startChoiceMade: boolean;
  /** Termin egzaminu wybranej aplikacji (RRRR-MM-DD, ustawia go administrator) albo null = nieogłoszony / brak wyboru. */
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
    /** Ile nowych pytań dziennie trzeba, żeby zdążyć je zacząć przed rezerwą na powtórki (bez sufitu); 0 w ostatnich 14 dniach. */
    requiredTestQuestionsPerDay: number;
    /** Sufit limitu automatycznego: powyżej powtórki rosną szybciej, niż da się je robić. */
    maxTestQuestionsPerDay: number;
    /** Cel na dziś: tyle co `requiredTestQuestionsPerDay`, ale nie więcej niż sufit. Liczony od stanu z początku dnia. */
    suggestedTestQuestionsPerDay: number;
    suggestedFlashcardsPerDay: number;
    /** Ile nowych pytań testowych użytkownik zaczął dzisiaj. */
    newTestQuestionsToday: number;
  } | null;
}

/**
 * Pełny zestaw do zapisu: null w polu liczbowym = wartość domyślna, a w `newTestQuestionsPerDay` = limit automatyczny.
 * Daty egzaminu ani wyglądu tu nie ma (datę ustawia administrator, wygląd ma własne żądanie).
 */
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

/** Wybór w oknie startowym i w Koncie: jedna z aplikacji albo „Jestem studentem / jeszcze nie wybrałem". */
export type ExamChoice = QuestionOrigin | "STUDENT";

/**
 * Wybór aplikacji, do której użytkownik się przygotowuje. Serwer ustawia przy tym filtr pochodzenia pytań na tę
 * aplikację i pytania autorskie (jednorazowo; później filtr zmienia się osobno). „STUDENT" nie ma aplikacji, terminu
 * ani odliczania, a filtr pytań obejmuje wszystkie pochodzenia.
 */
export async function chooseExam(choice: ExamChoice): Promise<LearningSettings> {
  const body = choice === "STUDENT" ? { student: true } : { origin: choice };
  const res = await api.put<LearningSettings>("/api/me/exam", body);
  return res.data;
}

/** Wybór wyglądu aplikacji (ciemny / jasny). Zapisany na koncie, więc taki sam na każdym urządzeniu. */
export async function chooseTheme(theme: Theme): Promise<LearningSettings> {
  const res = await api.put<LearningSettings>("/api/me/theme", { theme });
  return res.data;
}
