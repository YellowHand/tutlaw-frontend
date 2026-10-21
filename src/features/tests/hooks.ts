import { useQuery } from "@tanstack/react-query";
import { getTestCatalog } from "../../api/tests";
import type { SourceMode } from "../../lib/sourceMode";

export const TEST_CATALOG_KEY = ["tests", "catalog"] as const;

/**
 * Drzewo Testów (dziedzina → akt prawny → rozdział) z licznikami pytań z wybranego źródła. Kreator, filtr aktów w
 * Statystykach i Fiszki korzystają z tego samego zapytania (dla źródła „wszystkie"). staleTime 0: po powrocie z testu
 * liczniki odświeżają się same. `enabled: false` pozwala nie pobierać drzewa, dopóki kreator nie jest otwarty.
 */
export function useTestCatalog(source: SourceMode = "ALL", options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [...TEST_CATALOG_KEY, source],
    queryFn: () => getTestCatalog(source),
    staleTime: 0,
    enabled: options.enabled ?? true,
  });
}
