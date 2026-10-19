import type { SessionMode } from "../../api/review";
import type { SourceGroup, SourceKind } from "../../lib/source";

export interface DailyCount {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface OverviewResponse {
  /** Ile pytań (w trybie fiszek: odblokowanych fiszek) można teraz ćwiczyć. */
  totalQuestions: number;
  questionsStarted: number;
  matureQuestions: number;
  /** Procent udanych powtórek z 30 dni; null = jeszcze brak powtórek, z których dałoby się to policzyć. */
  retentionRate: number | null;
  upcomingReviews: DailyCount[];
}

export interface ActivityItem {
  date: string; // YYYY-MM-DD
  reviewCount: number;
}

/** Opanowanie jednego aktu prawnego z puli użytkownika. */
export interface ActMastery {
  actId: number;
  name: string;
  shortName: string;
  fieldId: number;
  fieldName: string;
  totalQuestions: number;
  questionsStarted: number;
  matureQuestions: number;
  masteryPercentage: number;
}

export interface WeakQuestion {
  questionId: number;
  body: string;
  mode: SessionMode;
  lapses: number;
  currentRetrievability: number;
  lastReviewAt: string;
}

export interface TestStats {
  totalQuestions: number;
  solvedQuestions: number;
  answersLast30Days: number;
  correctLast30Days: number;
  /** Procent poprawnych odpowiedzi z 30 dni; null = brak odpowiedzi w tym czasie. */
  accuracyRate: number | null;
  /** Błędne odpowiedzi bez „Nie jestem pewien" z 30 dni: utrwalone błędne przekonania. */
  confidentMistakesLast30Days: number;
  /** Poprawne odpowiedzi z „Nie jestem pewien" z 30 dni: wiedza krucha, wynik przypadkowy. */
  luckyGuessesLast30Days: number;
  /** Odpowiedzi w testach na każdy z ostatnich 28 dni (ten sam kształt co aktywność w fiszkach). */
  activity: ActivityItem[];
}

/** Liczby dla jednej grupy źródeł albo jednego arkusza. Dotyczą pytań dostępnych teraz dla użytkownika. */
export interface SourceMetrics {
  totalQuestions: number;
  /** Ile pytań rozwiązano co najmniej raz. */
  solvedQuestions: number;
  /** Ile jest utrwalonych (jak „Opanowane" w przeglądzie nauki). */
  matureQuestions: number;
  /** Ile ma już miniony termin powtórki. */
  dueQuestions: number;
  answers: number;
  correctAnswers: number;
  /** Procent poprawnych ze wszystkich odpowiedzi; null = jeszcze brak odpowiedzi. */
  accuracyRate: number | null;
  answersLast30Days: number;
  /** Procent poprawnych z 30 dni; null = brak odpowiedzi w tym czasie. */
  accuracyLast30Days: number | null;
  /** Błędne odpowiedzi bez „Nie jestem pewien" z 30 dni. */
  confidentMistakesLast30Days: number;
}

export interface SourceEntry {
  id: number;
  name: string;
  kind: SourceKind;
  /** Rok egzaminu; pytania autorskie go nie mają. */
  examYear: number | null;
  stats: SourceMetrics;
}

export interface SourceGroupEntry {
  group: SourceGroup;
  /** Suma ze wszystkich źródeł grupy. */
  stats: SourceMetrics;
  /** Źródła grupy (arkusze od najnowszego roku); źródła bez pytań są pomijane. */
  sources: SourceEntry[];
}

/** Statystyki Testów według źródła: zawsze trzy grupy, bez filtra źródeł z Testów i bez zawężenia do aktów. */
export interface SourceStats {
  groups: SourceGroupEntry[];
}

/** „Podsumowanie nauki": luźne liczby o całej dotychczasowej nauce. Czasy w sekundach. */
export interface LearningSummary {
  totalAnswers: number;
  testAnswers: number;
  flashcardReviews: number;
  examsDone: number;
  customTestsDone: number;
  studySecondsToday: number;
  studySecondsLast7Days: number;
  studySecondsTotal: number;
  /** Średni czas odpowiedzi na pytanie w teście (pojedyncza odpowiedź najwyżej 120 s); null = brak pomiarów. */
  averageSecondsPerQuestion: number | null;
  averageSecondsPerFlashcard: number | null;
}
