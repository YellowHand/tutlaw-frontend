import { useEffect } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { getDueCount, getMistakesCount } from "../../api/review";

export const DUE_COUNT_KEY = ["review", "due-count"] as const;
export const MISTAKES_COUNT_KEY = ["review", "mistakes-count"] as const;

/** Ile pytań czeka w „Powtórz moje błędy". Błąd nie blokuje ekranu Testy: karta po prostu się nie pokazuje. */
export function useMistakesCount() {
  return useQuery({
    queryKey: MISTAKES_COUNT_KEY,
    queryFn: getMistakesCount,
    staleTime: 30_000,
  });
}

/** Liczba fiszek z minionym terminem powtórki – dla odznaki w menu i przycisku „Powtórki na dziś". */
export function useDueCount() {
  return useQuery({
    queryKey: DUE_COUNT_KEY,
    queryFn: getDueCount,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Oznacza licznik powtórek i statystyki jako nieaktualne – odświeżą się przy następnym użyciu. */
export function invalidateReviewData(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: DUE_COUNT_KEY });
  void queryClient.invalidateQueries({ queryKey: MISTAKES_COUNT_KEY });
  void queryClient.invalidateQueries({ queryKey: ["statistics"] });
}

/**
 * Do stron sesji (fiszki / test): po wyjściu z sesji licznik w menu i pulpit pokazują świeże dane.
 * Odświeżamy dopiero przy wyjściu, a nie po każdej odpowiedzi, żeby nie wysyłać zapytania co pytanie.
 */
export function useRefreshReviewDataOnExit() {
  const queryClient = useQueryClient();
  useEffect(() => () => invalidateReviewData(queryClient), [queryClient]);
}
