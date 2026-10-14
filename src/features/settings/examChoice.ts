import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chooseExam } from "../../api/settings";
import type { QuestionOrigin } from "../../lib/origin";
import { CUSTOM_TEST_COUNTS_KEY, DUE_COUNT_KEY, MISTAKES_COUNT_KEY } from "../review/hooks";
import { TEST_CATALOG_KEY } from "../tests/hooks";
import { ORIGIN_FILTER_KEY } from "../tests/originFilter";
import { LEARNING_SETTINGS_KEY } from "./hooks";

/**
 * Wybór aplikacji, do której użytkownik się przygotowuje. Serwer ustawia przy tym także filtr pochodzenia pytań
 * (wybrana aplikacja i pytania autorskie), więc odświeżamy wszystko, co liczy pytania testowe. Statystyk i Fiszek
 * nie ruszamy, bo filtr ich nie dotyczy.
 */
export function useChooseExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (origin: QuestionOrigin) => chooseExam(origin),
    onSuccess: (settings) => {
      queryClient.setQueryData(LEARNING_SETTINGS_KEY, settings);
      void queryClient.invalidateQueries({ queryKey: ORIGIN_FILTER_KEY });
      void queryClient.invalidateQueries({ queryKey: TEST_CATALOG_KEY });
      void queryClient.invalidateQueries({ queryKey: DUE_COUNT_KEY });
      void queryClient.invalidateQueries({ queryKey: MISTAKES_COUNT_KEY });
      void queryClient.invalidateQueries({ queryKey: CUSTOM_TEST_COUNTS_KEY });
    },
  });
}
