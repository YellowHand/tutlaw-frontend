import type { QuestionOrigin } from "../../lib/origin";

export interface DailyCount {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface OverviewResponse {
  totalCards: number;
  cardsStarted: number;
  matureCards: number;
  /** Procent udanych powtórek z 30 dni; null = jeszcze brak powtórek, z których dałoby się to policzyć. */
  retentionRate: number | null;
  upcomingReviews: DailyCount[];
}

export interface ActivityItem {
  date: string; // YYYY-MM-DD
  reviewCount: number;
}

export interface ChapterMastery {
  chapterId: number;
  chapterTitle: string;
  totalCards: number;
  matureCards: number;
  masteryPercentage: number;
}

export interface WeakCard {
  cardId: number;
  front: string;
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

/** Liczby dla jednego pochodzenia albo jednego roku egzaminu. Dotyczą pytań dostępnych teraz dla użytkownika. */
export interface OriginMetrics {
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

export interface OriginStatsYear {
  year: number;
  stats: OriginMetrics;
}

export interface OriginStatsEntry {
  origin: QuestionOrigin;
  /** Suma ze wszystkich lat. */
  stats: OriginMetrics;
  /** Rozbicie na lata egzaminu, od najnowszego; puste dla pytań autorskich. */
  years: OriginStatsYear[];
}

/** Statystyki Testów według pochodzenia: zawsze wszystkie pochodzenia, bez filtra z Testów. */
export interface OriginStats {
  origins: OriginStatsEntry[];
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
