import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { ReviewScope } from "../../api/review";
import { parseId } from "../../lib/ids";

/**
 * Zakres sesji z adresu (?fieldId=, ?actId=, ?sourceId=). Brak wszystkich trzech to cała pula użytkownika. Zły albo
 * brakujący numer jest pomijany. Obiekt zmienia się tylko razem z adresem, więc można go wpisać do zależności efektów.
 * Parsowanie siedzi w hooku, a nie w komponencie sesji: wywołanie zwykłej funkcji z modułu w treści ekranu sesji wyłącza
 * u nas optymalizację kompilatora Reacta (lint zgłasza wtedy „Compilation Skipped").
 */
export function useScopeParams(): ReviewScope {
  const [searchParams] = useSearchParams();
  const fieldIdParam = searchParams.get("fieldId");
  const actIdParam = searchParams.get("actId");
  const sourceIdParam = searchParams.get("sourceId");
  return useMemo(
    () => ({ fieldId: parseId(fieldIdParam), actId: parseId(actIdParam), sourceId: parseId(sourceIdParam) }),
    [fieldIdParam, actIdParam, sourceIdParam]
  );
}
