import { api } from "../../api/axiosInstance";
import type { SessionMode } from "../../api/review";
import type {
  ActivityItem,
  ChapterMastery,
  LearningSummary,
  OriginStats,
  OverviewResponse,
  TestStats,
  WeakCard,
} from "./types";

/** Bez trybu backend liczy fiszki i testy razem (strona Statystyki); z trybem tylko wskazany rodzaj kart. */
export async function fetchOverview(subjectId?: number, mode?: SessionMode): Promise<OverviewResponse> {
  const res = await api.get<OverviewResponse>("/api/statistics/overview", {
    params: { subjectId: subjectId || undefined, mode },
  });
  return res.data;
}

export async function fetchActivity(days = 30, mode?: SessionMode): Promise<ActivityItem[]> {
  const res = await api.get<ActivityItem[]>("/api/statistics/activity", { params: { days, mode } });
  return res.data;
}

export async function fetchChapterMastery(sourceId?: number): Promise<ChapterMastery[]> {
  if (!sourceId) return [];
  const res = await api.get<ChapterMastery[]>("/api/statistics/chapters", { params: { sourceId } });
  return res.data;
}

export async function fetchWeakCards(subjectId?: number, limit = 10): Promise<WeakCard[]> {
  const res = await api.get<WeakCard[]>("/api/statistics/weak-cards", {
    params: { subjectId: subjectId || undefined, limit },
  });
  return res.data;
}

export async function fetchTestStats(): Promise<TestStats> {
  const res = await api.get<TestStats>("/api/statistics/tests");
  return res.data;
}

/** Statystyki Testów według pochodzenia pytań (aplikacja) i roku egzaminu. */
export async function fetchOriginStats(): Promise<OriginStats> {
  const res = await api.get<OriginStats>("/api/statistics/origins");
  return res.data;
}

export async function fetchLearningSummary(): Promise<LearningSummary> {
  const res = await api.get<LearningSummary>("/api/statistics/learning-summary");
  return res.data;
}
