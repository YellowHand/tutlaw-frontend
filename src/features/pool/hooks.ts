import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  getPool,
  updatePoolActs,
  updatePoolCourses,
  type Pool,
} from "../../api/pool";
import { CUSTOM_TEST_COUNTS_KEY, DUE_COUNT_KEY, MISTAKES_COUNT_KEY } from "../review/hooks";
import { LEARNING_SETTINGS_KEY } from "../settings/hooks";
import { TEST_CATALOG_KEY } from "../tests/hooks";

export const POOL_KEY = ["pool"] as const;

/**
 * Zakres nauki użytkownika (ścieżka i zawężenie do aktów). Błąd pobrania nie blokuje ekranów: znacznik puli
 * po prostu się nie pokazuje, a nauka działa dalej (serwer i tak stosuje pulę).
 */
export function usePool() {
  return useQuery({ queryKey: POOL_KEY, queryFn: getPool, staleTime: 30_000 });
}

/**
 * Po zmianie puli zmienia się wszystko, co liczy pytania: katalog Testów, odznaki i liczniki powtórek, liczniki błędów
 * i własnego testu, plan nauki w ustawieniach oraz statystyki (statystyki testów liczą się z pulą i zawężeniem do aktów; same statystyki według źródła się nie zmieniają, ale ich odświeżenie jest tanie).
 */
export function invalidateAfterPoolChange(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: TEST_CATALOG_KEY });
  void queryClient.invalidateQueries({ queryKey: DUE_COUNT_KEY });
  void queryClient.invalidateQueries({ queryKey: MISTAKES_COUNT_KEY });
  void queryClient.invalidateQueries({ queryKey: CUSTOM_TEST_COUNTS_KEY });
  void queryClient.invalidateQueries({ queryKey: LEARNING_SETTINGS_KEY });
  void queryClient.invalidateQueries({ queryKey: ["statistics"] });
}

export function useUpdatePoolActs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actIds: number[]) => updatePoolActs(actIds),
    onSuccess: (saved: Pool) => {
      queryClient.setQueryData(POOL_KEY, saved);
      invalidateAfterPoolChange(queryClient);
    },
  });
}

/** Student wybiera przedmioty, z których się uczy (pusta lista = wszystkie). */
export function useUpdatePoolCourses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseIds: number[]) => updatePoolCourses(courseIds),
    onSuccess: (saved: Pool) => {
      queryClient.setQueryData(POOL_KEY, saved);
      invalidateAfterPoolChange(queryClient);
    },
  });
}
