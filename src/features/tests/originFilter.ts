import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOriginFilter, saveOriginFilter, type OriginFilter } from "../../api/originFilter";
import { ORIGIN_LABELS, ORIGIN_ORDER, type QuestionOrigin } from "../../lib/origin";
import { pluralizePl } from "../../lib/plural";
import { LEARNING_SETTINGS_KEY } from "../settings/hooks";
import { DUE_COUNT_KEY, MISTAKES_COUNT_KEY } from "../review/hooks";
import { TEST_CATALOG_KEY } from "./hooks";

export const ORIGIN_FILTER_KEY = ["tests", "origin-filter"] as const;

/**
 * Filtr pochodzenia pytań w Testach. Błąd pobrania nie blokuje ekranów: pasek filtra po prostu się nie pokazuje,
 * a Testy działają dalej (serwer i tak stosuje filtr).
 */
export function useOriginFilter() {
  return useQuery({ queryKey: ORIGIN_FILTER_KEY, queryFn: getOriginFilter, staleTime: 30_000 });
}

/**
 * Zapis filtra. Zmienia się wszystko, co liczy pytania testowe, więc unieważniamy katalog Testów, odznakę i licznik
 * powtórek, licznik błędów oraz plan do egzaminu. Statystyk i Fiszek NIE ruszamy, bo filtr ich nie dotyczy.
 */
export function useSaveOriginFilter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (origins: QuestionOrigin[]) => saveOriginFilter(origins),
    onSuccess: (saved) => {
      queryClient.setQueryData(ORIGIN_FILTER_KEY, saved);
      void queryClient.invalidateQueries({ queryKey: TEST_CATALOG_KEY });
      void queryClient.invalidateQueries({ queryKey: DUE_COUNT_KEY });
      void queryClient.invalidateQueries({ queryKey: MISTAKES_COUNT_KEY });
      void queryClient.invalidateQueries({ queryKey: LEARNING_SETTINGS_KEY });
    },
  });
}

/** Czy filtr coś zawęża (nie są wybrane wszystkie pochodzenia). */
export function isFilterActive(filter: OriginFilter | undefined): boolean {
  return filter !== undefined && !filter.all;
}

/** Wybrane pochodzenia w kolejności z okna wyboru (autorskie na końcu). */
export function selectedInOrder(filter: OriginFilter): QuestionOrigin[] {
  return ORIGIN_ORDER.filter((origin) => filter.selected.includes(origin));
}

/** „Wszystkie pochodzenia", „Aplikacja notarialna, Pytanie autorskie" albo „3 z 6 pochodzeń". */
export function describeSelection(filter: OriginFilter): string {
  if (filter.all) return "Wszystkie pochodzenia";
  const chosen = selectedInOrder(filter);
  if (chosen.length <= 2) return chosen.map((origin) => ORIGIN_LABELS[origin]).join(", ");
  return `${chosen.length} z ${ORIGIN_ORDER.length} pochodzeń`;
}

/** Ile pytań testowych mają razem wybrane pochodzenia. */
export function selectedQuestionCount(filter: OriginFilter): number {
  return filter.options.filter((o) => filter.selected.includes(o.origin)).reduce((sum, o) => sum + o.questionCount, 0);
}

export function questionsWord(count: number): string {
  return pluralizePl(count, { one: "pytanie", few: "pytania", many: "pytań" });
}
