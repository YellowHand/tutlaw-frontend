import { useQuery } from "@tanstack/react-query";
import { getBacklog, type SessionMode } from "../../api/review";

/** Ile zaległych powtórek dokłada przycisk „Powtórz jeszcze" ponad dzienny limit. */
export const EXTRA_DUE_BATCH = 20;

interface BacklogScope {
  mode: SessionMode;
  subjectId?: number;
  sourceId?: number;
  categoryId?: number;
  /** Gdy false, zapytanie w ogóle nie jest wysyłane (np. sesja „Moje błędy" nie pokazuje zaległości). */
  enabled?: boolean;
}

/**
 * Zaległości w zakresie bieżącej sesji. Dane mają być zawsze świeże (bez pamięci podręcznej),
 * a błąd tego zapytania nie przeszkadza w nauce: po prostu nie pokazujemy informacji o zaległościach.
 */
export function useBacklog({ mode, subjectId, sourceId, categoryId, enabled = true }: BacklogScope) {
  return useQuery({
    queryKey: ["review", "backlog", mode, subjectId ?? null, sourceId ?? null, categoryId ?? null],
    queryFn: () => getBacklog(mode, subjectId, sourceId, categoryId),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
