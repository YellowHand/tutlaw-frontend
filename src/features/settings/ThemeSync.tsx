import { useLayoutEffect } from "react";
import { applyTheme, isTheme, readStoredTheme, resetTheme, storeTheme } from "../../lib/theme";
import { useLearningSettings } from "./hooks";

/**
 * Utrzymuje wygląd strony zgodny z kontem. Zanim serwer odpowie, obowiązuje ostatni znany wygląd z tej przeglądarki
 * (skrypt w index.html ustawił go już przed pierwszą klatką); gdy ustawienia dotrą, wygrywa wygląd z konta i odświeża
 * kopię. Po wyjściu z aplikacji (wylogowanie) strona wraca do ciemnego wyglądu, bo strona główna i logowanie są ciemne.
 * Nic nie renderuje.
 */
export function ThemeSync() {
  const { data } = useLearningSettings();
  const serverTheme = isTheme(data?.theme) ? data.theme : undefined;

  useLayoutEffect(() => {
    if (serverTheme) {
      applyTheme(serverTheme);
      storeTheme(serverTheme);
    } else {
      applyTheme(readStoredTheme());
    }
  }, [serverTheme]);

  useLayoutEffect(() => resetTheme, []);

  return null;
}
