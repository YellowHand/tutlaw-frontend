export interface DailyCount {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface OverviewResponse {
  totalCards: number;
  cardsStarted: number;
  matureCards: number;
  retentionRate: number;
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