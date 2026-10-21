import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getExamAttempt, getExamAvailability, getExamHistory, getExamSheets } from "../../api/exam";
import { LIST_PAGE_SIZE } from "../../api/pagination";

export const EXAM_HISTORY_KEY = ["exam", "history"] as const;

/**
 * Jedna strona historii podejść do egzaminu próbnego (od najnowszego). Poprzednia strona zostaje na ekranie, dopóki
 * następna się nie wczyta, więc lista nie miga przy przełączaniu stron.
 */
export function useExamHistory(page = 0, size = LIST_PAGE_SIZE) {
  return useQuery({
    queryKey: [...EXAM_HISTORY_KEY, page, size],
    queryFn: () => getExamHistory(page, size),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

/** Raport zapisanego podejścia (z odpowiedziami). Bez ponawiania: 404 oznacza, że raportu nie ma. */
export function useExamAttempt(id: number | null) {
  return useQuery({
    queryKey: ["exam", "attempt", id],
    queryFn: () => getExamAttempt(id as number),
    enabled: id !== null,
    staleTime: 0,
    retry: false,
  });
}

/** Ile pytań da się teraz wylosować na egzamin z każdego źródła (do wyboru źródła na ekranie przed egzaminem). */
export function useExamAvailability() {
  return useQuery({ queryKey: ["exam", "availability"], queryFn: getExamAvailability, staleTime: 0 });
}

/** Egzaminy MS z poprzednich lat (aplikacje i lata do wyboru na ekranie przed egzaminem). */
export function useExamSheets() {
  return useQuery({ queryKey: ["exam", "sheets"], queryFn: getExamSheets, staleTime: 0 });
}
