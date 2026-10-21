import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCustomTestSession, listCustomTestSessions } from "../../api/customTest";
import { LIST_PAGE_SIZE } from "../../api/pagination";

export const CUSTOM_TEST_SESSIONS_KEY = ["custom-test", "sessions"] as const;

/**
 * Jedna strona zapisanych własnych testów („Moje testy", od najnowszego). Zawsze świeża: po sesji lista ma pokazywać nowy
 * wynik. Poprzednia strona zostaje na ekranie, dopóki następna się nie wczyta.
 */
export function useCustomTestSessions(page = 0, size = LIST_PAGE_SIZE) {
  return useQuery({
    queryKey: [...CUSTOM_TEST_SESSIONS_KEY, "page", page, size],
    queryFn: () => listCustomTestSessions(page, size),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
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
