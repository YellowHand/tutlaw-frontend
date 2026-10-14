import { Card } from "../../components/ui/Card";
import { serverMessage } from "../../lib/errors";
import { THEME_LABELS, readStoredTheme } from "../../lib/theme";
import { useLearningSettings } from "./hooks";
import { ThemePicker } from "./ThemePicker";
import { useChooseTheme } from "./themeChoice";

/**
 * „Wygląd" w Koncie: ciemny (domyślny) albo jasny. Wybór zapisuje się na koncie od razu i obowiązuje na każdym
 * urządzeniu. Działa też wtedy, gdy nie udało się pobrać ustawień nauki: wygląd ma własne żądanie.
 */
export function AppearanceCard() {
  const { data } = useLearningSettings();
  const choose = useChooseTheme();
  const current = choose.isPending ? choose.variables : (data?.theme ?? readStoredTheme());

  return (
    <Card data-testid="appearance-card">
      <h2 className="mb-1 text-base font-semibold">Wygląd</h2>
      <p className="mb-4 max-w-prose text-sm text-fg-muted">
        Wybór zapisujemy na koncie, więc działa tak samo na każdym urządzeniu. Strona główna i logowanie zostają ciemne.
      </p>
      <ThemePicker
        name="account-theme"
        legend="Wygląd strony"
        value={current}
        onChange={(theme) => {
          if (theme !== current) choose.mutate(theme);
        }}
        className="max-w-xl"
      />
      <div className="mt-2 min-h-5" aria-live="polite">
        {choose.isSuccess && !choose.isPending && (
          <p role="status" className="text-sm text-success">
            Zapisano wygląd: {THEME_LABELS[choose.data.theme].toLowerCase()}.
          </p>
        )}
        {choose.isError && (
          <p role="alert" className="text-sm text-danger">
            {serverMessage(choose.error, "Nie udało się zapisać wyglądu. Spróbuj ponownie.")}
          </p>
        )}
      </div>
    </Card>
  );
}
