import { useQuery } from "@tanstack/react-query";
import type { SessionMode } from "../../api/review";
import {
  fetchActivity,
  fetchChapterMastery,
  fetchLearningSummary,
  fetchOriginStats,
  fetchOverview,
  fetchTestStats,
  fetchWeakCards,
} from "./api";

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

/** Statystyki Testów według aplikacji i roku. Klucz zaczyna się od „statistics", więc odświeża się po sesji nauki. */
export function useOriginStats() {
  return useQuery({
    queryKey: ["statistics", "origins"],
    queryFn: fetchOriginStats,
    staleTime: STALE_TIME,
  });
}

/** „Podsumowanie nauki". Klucz zaczyna się od „statistics", więc odświeża się razem z resztą po sesji nauki. */
export function useLearningSummary() {
  return useQuery({
    queryKey: ["statistics", "learning-summary"],
    queryFn: fetchLearningSummary,
    staleTime: STALE_TIME,
  });
}
