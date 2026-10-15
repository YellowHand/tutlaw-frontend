import { useQuery } from "@tanstack/react-query";
import { getCustomTestSession, listCustomTestSessions } from "../../api/customTest";

export const CUSTOM_TEST_SESSIONS_KEY = ["custom-test", "sessions"] as const;

/** Zapisane własne testy (ostatnie 50). Zawsze świeże: po sesji lista ma pokazywać nowy wynik. */
export function useCustomTestSessions() {
  return useQuery({ queryKey: CUSTOM_TEST_SESSIONS_KEY, queryFn: listCustomTestSessions, staleTime: 0 });
}

export function useCustomTestSession(id: number | null) {
  return useQuery({
    queryKey: [...CUSTOM_TEST_SESSIONS_KEY, id],
    queryFn: () => getCustomTestSession(id as number),
    enabled: id !== null,
    staleTime: 0,
    retry: false,
  });
}
