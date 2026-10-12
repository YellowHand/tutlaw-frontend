import { apiFetch } from "../../lib/apiClient";
import type { ActivityItem, ChapterMastery, OverviewResponse, WeakCard } from "./types";

export function fetchOverview(subjectId?: number): Promise<OverviewResponse> {
  const query = subjectId ? `?subjectId=${subjectId}` : "";
  return apiFetch<OverviewResponse>(`/api/statistics/overview${query}`);
}

export function fetchActivity(days = 30): Promise<ActivityItem[]> {
  return apiFetch<ActivityItem[]>(`/api/statistics/activity?days=${days}`);
}

export function fetchChapterMastery(sourceId?: number): Promise<ChapterMastery[]> {
  if (!sourceId) return Promise.resolve([]);
  return apiFetch<ChapterMastery[]>(`/api/statistics/chapters?sourceId=${sourceId}`);
}

export function fetchWeakCards(subjectId?: number, limit = 10): Promise<WeakCard[]> {
  const params = new URLSearchParams();
  if (subjectId) params.set("subjectId", String(subjectId));
  params.set("limit", String(limit));
  return apiFetch<WeakCard[]>(`/api/statistics/weak-cards?${params.toString()}`);
}