import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { getStudyProgress, resetStudyProgress } from "../../api/studyProgress";
import { clearDraft } from "../exam/examStorage";

export const STUDY_PROGRESS_KEY = ["study-progress"] as const;

/** Ile czego zniknie po wyzerowaniu. Pobieramy dopiero, gdy okno jest otwarte (`enabled`), bo to policzone na żądanie. */
export function useStudyProgress(enabled: boolean) {
  return useQuery({ queryKey: STUDY_PROGRESS_KEY, queryFn: getStudyProgress, enabled, staleTime: 0 });
}

/**
 * Po wyzerowaniu zmieniają się liczniki powtórek, błędów, Testów, statystyki, Moje testy i historia egzaminów, więc unieważniamy
 * wszystkie zapytania naraz (ustawienia i konto są tanie, a lista wyjątków byłaby długa i łatwa do pominięcia). Wersja robocza
 * egzaminu z pamięci przeglądarki dotyczy skasowanego podejścia, więc też znika.
 */
export function refreshAfterProgressReset(queryClient: QueryClient): void {
  clearDraft();
  void queryClient.invalidateQueries();
}

/** Zerowanie postępów: nieodwracalne, potwierdzane w oknie wpisaniem słowa WYZERUJ. */
export function useResetStudyProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetStudyProgress,
    onSuccess: () => refreshAfterProgressReset(queryClient),
  });
}
