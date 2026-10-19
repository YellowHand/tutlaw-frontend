import { useQuery } from "@tanstack/react-query";
import { getDifficultQuestions } from "../../api/difficult";

export const DIFFICULT_QUESTIONS_KEY = ["difficult-questions"] as const;

export function useDifficultQuestions() {
  return useQuery({ queryKey: DIFFICULT_QUESTIONS_KEY, queryFn: getDifficultQuestions, staleTime: 30_000 });
}
