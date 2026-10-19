import { useQuery } from "@tanstack/react-query";
import { getExamTerms } from "../../api/examTerms";
import { getLearningSettings } from "../../api/settings";
import { getTracks } from "../../api/tracks";

export const LEARNING_SETTINGS_KEY = ["settings", "learning"] as const;
export const EXAM_TERMS_KEY = ["settings", "exam-terms"] as const;
export const TRACKS_KEY = ["tracks"] as const;

export function useLearningSettings() {
  return useQuery({ queryKey: LEARNING_SETTINGS_KEY, queryFn: getLearningSettings, staleTime: 60_000 });
}

/** Terminy egzaminów wszystkich aplikacji (ustawia je administrator). Błąd nie blokuje ekranów: terminy się po prostu nie pokazują. */
export function useExamTerms() {
  return useQuery({ queryKey: EXAM_TERMS_KEY, queryFn: getExamTerms, staleTime: 60_000 });
}

/** Ścieżki do wyboru (pięć aplikacji i Student). Zmieniają się tylko razem z bazą, więc długo są świeże. */
export function useTracks() {
  return useQuery({ queryKey: TRACKS_KEY, queryFn: getTracks, staleTime: 10 * 60_000 });
}
