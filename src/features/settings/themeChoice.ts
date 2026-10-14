import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chooseTheme } from "../../api/settings";
import { applyTheme, readStoredTheme, type Theme } from "../../lib/theme";
import { LEARNING_SETTINGS_KEY } from "./hooks";

/**
 * Zmiana wyglądu zapisana na koncie. Strona przełącza się od razu (bez czekania na serwer); gdy zapis się nie uda,
 * wracamy do poprzedniego wyglądu i pokazujemy błąd. Kopię w przeglądarce odświeża ThemeSync, gdy przyjdzie odpowiedź.
 */
export function useChooseTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (theme: Theme) => chooseTheme(theme),
    onMutate: (theme) => {
      const previous = queryClient.getQueryData<{ theme?: Theme }>(LEARNING_SETTINGS_KEY)?.theme ?? readStoredTheme();
      applyTheme(theme);
      return { previous };
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(LEARNING_SETTINGS_KEY, settings);
    },
    onError: (_error, _theme, context) => {
      if (context) applyTheme(context.previous);
    },
  });
}
