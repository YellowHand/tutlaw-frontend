import { useQuery } from "@tanstack/react-query";
import { getLearningSettings } from "../../api/settings";

export const LEARNING_SETTINGS_KEY = ["settings", "learning"] as const;

export function useLearningSettings() {
  return useQuery({ queryKey: LEARNING_SETTINGS_KEY, queryFn: getLearningSettings, staleTime: 60_000 });
}
