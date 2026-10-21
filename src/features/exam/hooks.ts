import { useQuery } from "@tanstack/react-query";
import { getExamAvailability, getExamHistory, getExamSheets } from "../../api/exam";

export const EXAM_HISTORY_KEY = ["exam", "history"] as const;

/** Ostatnie podejścia do egzaminu próbnego (do 50). */
export function useExamHistory() {
  return useQuery({ queryKey: EXAM_HISTORY_KEY, queryFn: getExamHistory, staleTime: 0 });
}

/** Ile pytań da się teraz wylosować na egzamin z każdego źródła (do wyboru źródła na ekranie przed egzaminem). */
export function useExamAvailability() {
  return useQuery({ queryKey: ["exam", "availability"], queryFn: getExamAvailability, staleTime: 0 });
}

/** Egzaminy MS z poprzednich lat (aplikacje i lata do wyboru na ekranie przed egzaminem). */
export function useExamSheets() {
  return useQuery({ queryKey: ["exam", "sheets"], queryFn: getExamSheets, staleTime: 0 });
}
