import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { chooseExam, type ExamChoice, type LearningSettings } from "../../api/settings";
import { formatDatePl } from "../../lib/date";
import { pluralizePl } from "../../lib/plural";
import { CUSTOM_TEST_COUNTS_KEY, DUE_COUNT_KEY, MISTAKES_COUNT_KEY } from "../review/hooks";
import { TEST_CATALOG_KEY } from "../tests/hooks";
import { ORIGIN_FILTER_KEY } from "../tests/originFilter";
import { LEARNING_SETTINGS_KEY } from "./hooks";

/**
 * Po wyborze aplikacji serwer ustawia także filtr pochodzenia pytań (wybrana aplikacja i pytania autorskie), więc
 * odświeżamy wszystko, co liczy pytania testowe. Statystyk i Fiszek nie ruszamy, bo filtr ich nie dotyczy.
 */
export function refreshAfterExamChosen(queryClient: QueryClient, settings: LearningSettings): void {
  queryClient.setQueryData(LEARNING_SETTINGS_KEY, settings);
  void queryClient.invalidateQueries({ queryKey: ORIGIN_FILTER_KEY });
  void queryClient.invalidateQueries({ queryKey: TEST_CATALOG_KEY });
  void queryClient.invalidateQueries({ queryKey: DUE_COUNT_KEY });
  void queryClient.invalidateQueries({ queryKey: MISTAKES_COUNT_KEY });
  void queryClient.invalidateQueries({ queryKey: CUSTOM_TEST_COUNTS_KEY });
}

/** Wybór aplikacji, do której użytkownik się przygotowuje, albo „student" (zmiana w Koncie). */
export function useChooseExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (choice: ExamChoice) => chooseExam(choice),
    onSuccess: (settings) => refreshAfterExamChosen(queryClient, settings),
  });
}

/** „egzamin 15 marca 2027, za 154 dni", „termin nieogłoszony" albo null, gdy terminów nie udało się pobrać. */
export function examTermLine(date: string | null | undefined, days: number | null | undefined, loaded: boolean): string | null {
  if (!loaded) return null;
  if (!date) return "termin nieogłoszony";
  if (days == null) return `egzamin ${formatDatePl(date)}`;
  if (days === 0) return `egzamin dzisiaj, ${formatDatePl(date)}`;
  return `egzamin ${formatDatePl(date)}, za ${days} ${pluralizePl(days, { one: "dzień", few: "dni", many: "dni" })}`;
}
