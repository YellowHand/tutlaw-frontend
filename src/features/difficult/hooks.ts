import { useQuery } from "@tanstack/react-query";
import { getDifficultCards } from "../../api/difficult";

export const DIFFICULT_CARDS_KEY = ["difficult-cards"] as const;

export function useDifficultCards() {
  return useQuery({ queryKey: DIFFICULT_CARDS_KEY, queryFn: getDifficultCards, staleTime: 30_000 });
}
