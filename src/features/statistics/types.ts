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
  /** Odpowiedzi w testach na każdy z ostatnich 28 dni (ten sam kształt co aktywność w fiszkach). */
  activity: ActivityItem[];
}
