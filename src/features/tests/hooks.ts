import { useQuery } from "@tanstack/react-query";
import { getTestCatalog } from "../../api/tests";

export const TEST_CATALOG_KEY = ["tests", "catalog"] as const;

/**
 * Drzewo Testów (rodzaj → przedmiot/akt prawny → źródło). Wszystkie trzy ekrany korzystają z tego samego
 * zapytania, więc przejście głębiej nie pobiera niczego od nowa. staleTime 0: po powrocie z testu liczniki
 * odświeżają się same.
 */
export function useTestCatalog() {
  return useQuery({ queryKey: TEST_CATALOG_KEY, queryFn: getTestCatalog, staleTime: 0 });
}
