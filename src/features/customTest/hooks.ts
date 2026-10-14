import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCustomTestCounts, type CustomTestScope } from "../../api/customTest";
import { CUSTOM_TEST_COUNTS_KEY } from "../review/hooks";
import { useOriginStats } from "../statistics/hooks";

/** Wartość z opóźnieniem: przy szybkim klikaniu w pola wyboru serwer dostaje jedno pytanie, a nie kilka. */
export function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/**
 * Ile pytań każdego rodzaju jest w zakresie. Poprzednia odpowiedź zostaje na ekranie, dopóki nie przyjdzie nowa
 * (liczby nie migają). staleTime 0: po sesji i po zmianie filtra pochodzenia liczby wracają odświeżone.
 */
export function useCustomTestCounts(scope: CustomTestScope | null) {
  return useQuery({
    queryKey: [...CUSTOM_TEST_COUNTS_KEY, scope],
    queryFn: () => getCustomTestCounts(scope as CustomTestScope),
    enabled: scope !== null,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

/**
 * Lata egzaminów, z których są pytania (od najstarszego). Z tych samych statystyk co zakładka Statystyki, więc bez
 * dodatkowego zapytania na serwerze. Błąd nie blokuje ekranu: bez listy lat po prostu nie ma wyboru lat.
 */
export function useExamYears(): number[] {
  const { data } = useOriginStats();
  if (!data) return [];
  const years = new Set<number>();
  for (const entry of data.origins) {
    for (const year of entry.years) {
      if (year.stats.totalQuestions > 0) years.add(year.year);
    }
  }
  return Array.from(years).sort((a, b) => a - b);
}
