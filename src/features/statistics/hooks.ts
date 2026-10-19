import { useQuery } from "@tanstack/react-query";
import type { SessionMode } from "../../api/review";
import {
  fetchActMastery,
  fetchActivity,
  fetchLearningSummary,
  fetchOverview,
  fetchSourceStats,
  fetchTestStats,
  fetchWeakQuestions,
} from "./api";

const STALE_TIME = 60_000;

/** mode: tylko fiszki ("FLASHCARD") albo tylko testy ("TEST"); bez trybu wszystko razem. */
export function useOverview(actId?: number, mode?: SessionMode) {
  return useQuery({
    queryKey: ["statistics", "overview", actId ?? "all", mode ?? "all"],
    queryFn: () => fetchOverview(actId, mode),
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

export function useActMastery(mode?: SessionMode) {
  return useQuery({
    queryKey: ["statistics", "acts", mode ?? "all"],
    queryFn: () => fetchActMastery(mode),
    staleTime: STALE_TIME,
  });
}

export function useWeakQuestions(actId?: number, mode?: SessionMode, limit = 10) {
  return useQuery({
    queryKey: ["statistics", "weak-questions", actId ?? "all", mode ?? "all", limit],
    queryFn: () => fetchWeakQuestions(actId, mode, limit),
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

/** Statystyki Testów według grup źródeł i arkuszy. Klucz zaczyna się od „statistics", więc odświeża się po sesji nauki. */
export function useSourceStats() {
  return useQuery({
    queryKey: ["statistics", "sources"],
    queryFn: fetchSourceStats,
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
