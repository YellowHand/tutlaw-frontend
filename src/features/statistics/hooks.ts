import { useQuery } from "@tanstack/react-query";
import type { SessionMode } from "../../api/review";
import { fetchActivity, fetchChapterMastery, fetchOverview, fetchTestStats, fetchWeakCards } from "./api";

const STALE_TIME = 60_000;

/** mode: tylko fiszki ("FLASHCARD") albo tylko testy ("TEST"); bez trybu wszystko razem. */
export function useOverview(subjectId?: number, mode?: SessionMode) {
  return useQuery({
    queryKey: ["statistics", "overview", subjectId ?? "all", mode ?? "all"],
    queryFn: () => fetchOverview(subjectId, mode),
    staleTime: STALE_TIME,
  });
}

export function useActivity(days = 30, mode?: SessionMode) {
  return useQuery({
    queryKey: ["statistics", "activity", days, mode ?? "all"],
    queryFn: () => fetchActivity(days, mode),
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

/** Statystyki Testów. Klucz zaczyna się od „statistics", więc odświeża się razem z resztą po sesji nauki. */
export function useTestStats() {
  return useQuery({
    queryKey: ["statistics", "tests"],
    queryFn: fetchTestStats,
    staleTime: STALE_TIME,
  });
}
