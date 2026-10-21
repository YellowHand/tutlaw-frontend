import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { drawCustomTest, getCustomTestCounts, type CustomTestKind, type CustomTestScope } from "../../api/customTest";
import { ROUTES } from "../../config/routes";
import { serverMessage } from "../../lib/errors";
import type { SourceMode } from "../../lib/sourceMode";
import { CUSTOM_TEST_COUNTS_KEY } from "../review/hooks";

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
 * Ile pytań każdego rodzaju jest w zakresie i źródle. Poprzednia odpowiedź zostaje na ekranie, dopóki nie przyjdzie nowa
 * (liczby nie migają). staleTime 0: po sesji i po zmianie zakresu nauki liczby wracają odświeżone. `scope` równe null
 * wyłącza zapytanie (np. gdy nic nie zaznaczono).
 */
export function useCustomTestCounts(scope: CustomTestScope | null, source: SourceMode = "ALL", options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [...CUSTOM_TEST_COUNTS_KEY, source, scope],
    queryFn: () => getCustomTestCounts(scope as CustomTestScope, source),
    enabled: scope !== null && (options.enabled ?? true),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

export interface StartTestArgs {
  scope: CustomTestScope;
  source: SourceMode;
  kind: CustomTestKind;
  /** Liczba wysyłana na serwer (10, 20, 50, 100, 150; przy małym zakresie liczba dostępnych pytań). */
  questionCount: number;
}

/**
 * Losuje pytania, zapisuje test („Moje testy") i otwiera sesję. Jedno miejsce dla kreatora, „Losuj z całej puli"
 * i szybkich zestawów. `start` zwraca prawdę, gdy sesja została otwarta; błąd jest w `error` (po polsku, do pokazania).
 */
export function useStartCustomTest() {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(args: StartTestArgs): Promise<boolean> {
    if (starting) return false;
    setError(null);
    setStarting(true);
    try {
      const selection = await drawCustomTest(args.scope, args.source, args.kind, args.questionCount);
      navigate(ROUTES.testCustom(selection.questionIds, selection.sessionId));
      return true;
    } catch (err) {
      setError(serverMessage(err, "Nie udało się ułożyć testu. Spróbuj ponownie."));
      setStarting(false);
      return false;
    }
  }

  return { start, starting, error, clearError: () => setError(null) };
}
