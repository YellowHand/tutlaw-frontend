import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Filtry listy w adresie strony (powrót z innego ekranu zachowuje wyszukiwanie i stronę). Pole wyszukiwania ma własny
 * stan i trafia do adresu z opóźnieniem 300 ms, żeby nie pytać serwera o każdą literę. Zmiana jakiegokolwiek filtra
 * zeruje stronę.
 */
export function useAdminListParams() {
  const [params, setParams] = useSearchParams();
  const queryParam = params.get("q") ?? "";
  const page = Math.max(0, Number(params.get("page") ?? 0) || 0);
  const [queryText, setQueryText] = useState(queryParam);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (queryText === queryParam) return;
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (queryText) next.set("q", queryText);
          else next.delete("q");
          next.delete("page");
          return next;
        },
        { replace: true }
      );
    }, 300);
    return () => window.clearTimeout(id);
  }, [queryText, queryParam, setParams]);

  const get = useCallback((key: string) => params.get(key) ?? "", [params]);

  const setParam = useCallback(
    (key: string, value: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          if (key !== "page") next.delete("page");
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  /** Ustawia kilka filtrów naraz jedną zmianą adresu (dwa osobne wywołania {@code setParam} nadpisałyby się nawzajem). */
  const setMany = useCallback(
    (values: Record<string, string>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(values)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          next.delete("page");
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const reset = useCallback(() => {
    setQueryText("");
    setParams({}, { replace: true });
  }, [setParams]);

  return { get, setParam, setParams: setMany, page, queryParam, queryText, setQueryText, reset, hasFilters: params.size > 0 && !(params.size === 1 && params.has("page")) };
}
