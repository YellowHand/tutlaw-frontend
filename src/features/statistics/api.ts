import { apiFetch } from "../../lib/apiClient";
import type { SessionMode } from "../../api/review";
import type { ActivityItem, ChapterMastery, OverviewResponse, TestStats, WeakCard } from "./types";

/** Bez trybu backend liczy fiszki i testy razem (strona Statystyki); z trybem tylko wskazany rodzaj kart. */
export function fetchOverview(subjectId?: number, mode?: SessionMode): Promise<OverviewResponse> {
  const params = new URLSearchParams();
  if (subjectId) params.set("subjectId", String(subjectId));
  if (mode) params.set("mode", mode);
  const query = params.toString();
  return apiFetch<OverviewResponse>(`/api/statistics/overview${query ? `?${query}` : ""}`);
}

export function fetchActivity(days = 30, mode?: SessionMode): Promise<ActivityItem[]> {
  const params = new URLSearchParams({ days: String(days) });
  if (mode) params.set("mode", mode);
  return apiFetch<ActivityItem[]>(`/api/statistics/activity?${params.toString()}`);
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

export function fetchTestStats(): Promise<TestStats> {
  return apiFetch<TestStats>("/api/statistics/tests");
}
