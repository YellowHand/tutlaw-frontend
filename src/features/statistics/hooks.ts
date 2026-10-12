import { useQuery } from "@tanstack/react-query";
import { fetchActivity, fetchChapterMastery, fetchOverview, fetchWeakCards } from "./api";

const STALE_TIME = 60_000;

export function useOverview(subjectId?: number) {
  return useQuery({
    queryKey: ["statistics", "overview", subjectId ?? "all"],
    queryFn: () => fetchOverview(subjectId),
    staleTime: STALE_TIME,
  });
}

export function useActivity(days = 30) {
  return useQuery({
    queryKey: ["statistics", "activity", days],
    queryFn: () => fetchActivity(days),
    staleTime: STALE_TIME,
  });
}

export function useChapterMastery(sourceId?: number) {
  return useQuery({
    queryKey: ["statistics", "chapters", sourceId ?? "none"],
    queryFn: () => fetchChapterMastery(sourceId),
    enabled: !!sourceId,
    staleTime: STALE_TIME,
  });
}

export function useWeakCards(subjectId?: number, limit = 10) {
  return useQuery({
    queryKey: ["statistics", "weak-cards", subjectId ?? "all", limit],
    queryFn: () => fetchWeakCards(subjectId, limit),
    staleTime: STALE_TIME,
  });
}