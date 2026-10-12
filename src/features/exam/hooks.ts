import { useQuery } from "@tanstack/react-query";
import { getExamHistory } from "../../api/exam";

export const EXAM_HISTORY_KEY = ["exam", "history"] as const;

/** Ostatnie podejścia do egzaminu próbnego (do 50). */
export function useExamHistory() {
  return useQuery({ queryKey: EXAM_HISTORY_KEY, queryFn: getExamHistory, staleTime: 0 });
}
