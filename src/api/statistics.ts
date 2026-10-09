import { api } from "./axiosInstance";

export interface OverviewResponse {
  totalCards: number;
  cardsStarted: number;
  matureCards: number;
  retentionRate: number;
  upcomingReviews: { date: string; count: number }[];
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

export interface ActivityItem {
  date: string;
  reviewCount: number;
}

export async function getOverview(subjectId: number) {
  const res = await api.get<OverviewResponse>("/api/statistics/overview", { params: { subjectId } });
  return res.data;
}

export async function getChapterMastery(subjectId: number) {
  const res = await api.get<ChapterMastery[]>("/api/statistics/chapters", { params: { subjectId } });
  return res.data;
}

export async function getWeakCards(subjectId: number, limit = 10) {
  const res = await api.get<WeakCard[]>("/api/statistics/weak-cards", { params: { subjectId, limit } });
  return res.data;
}

export async function getActivity(days = 30) {
  const res = await api.get<ActivityItem[]>("/api/statistics/activity", { params: { days } });
  return res.data;
}