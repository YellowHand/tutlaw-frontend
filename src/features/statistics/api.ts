import { api } from "../../api/axiosInstance";
import type { SessionMode } from "../../api/review";
import type {
  ActMastery,
  ActivityItem,
  LearningSummary,
  OverviewResponse,
  SourceStats,
  TestStats,
  WeakQuestion,
} from "./types";

/** Bez trybu backend liczy fiszki i testy razem (strona Statystyki); z trybem tylko wskazany rodzaj. */
export async function fetchOverview(actId?: number, mode?: SessionMode): Promise<OverviewResponse> {
  const res = await api.get<OverviewResponse>("/api/statistics/overview", {
    params: { actId: actId || undefined, mode },
  });
  return res.data;
}

export async function fetchActivity(days = 30, mode?: SessionMode): Promise<ActivityItem[]> {
  const res = await api.get<ActivityItem[]>("/api/statistics/activity", { params: { days, mode } });
  return res.data;
}

/** Opanowanie aktów prawnych z puli użytkownika (w jednym trybie albo w obu razem). */
export async function fetchActMastery(mode?: SessionMode): Promise<ActMastery[]> {
  const res = await api.get<ActMastery[]>("/api/statistics/acts", { params: { mode } });
  return res.data;
}

export async function fetchWeakQuestions(actId?: number, mode?: SessionMode, limit = 10): Promise<WeakQuestion[]> {
  const res = await api.get<WeakQuestion[]>("/api/statistics/weak-questions", {
    params: { actId: actId || undefined, mode, limit },
  });
  return res.data;
}

export async function fetchTestStats(): Promise<TestStats> {
  const res = await api.get<TestStats>("/api/statistics/tests");
  return res.data;
}

/** Statystyki Testów według źródła pytań (grupa źródeł → arkusz). */
export async function fetchSourceStats(): Promise<SourceStats> {
  const res = await api.get<SourceStats>("/api/statistics/sources");
  return res.data;
}

export async function fetchLearningSummary(): Promise<LearningSummary> {
  const res = await api.get<LearningSummary>("/api/statistics/learning-summary");
  return res.data;
}
