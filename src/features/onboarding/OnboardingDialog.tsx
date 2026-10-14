import { useId, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chooseExam, chooseTheme, type LearningSettings } from "../../api/settings";
import { LogoutButton } from "../../components/layout/LogoutButton";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { cn } from "../../lib/cn";
import { serverMessage } from "../../lib/errors";
import { EXAM_APPLICATIONS, ORIGIN_LABELS, type QuestionOrigin } from "../../lib/origin";
import { applyTheme, isTheme, type Theme } from "../../lib/theme";
import { examTermLine, refreshAfterExamChosen } from "../settings/examChoice";
import { LEARNING_SETTINGS_KEY, useExamTerms, useLearningSettings } from "../settings/hooks";
import { ThemePicker } from "../settings/ThemePicker";

/**
 * Okno startowe po zalogowaniu: dopóki użytkownik nie wybrał aplikacji, do której się przygotowuje, nie przejdzie dalej.
 * Pytamy dopiero, gdy serwer wprost mówi, że wyboru nie ma (`examOrigin: null`): błąd, ładowanie ani nieoczekiwana
 * odpowiedź ustawień nie blokują aplikacji.
 */
export function OnboardingGate() {
  const { data } = useLearningSettings();
  if (!data || data.examOrigin !== null) return null;
  return <OnboardingDialog settings={data} />;
}

interface SaveInput {
  origin: QuestionOrigin;
  theme: Theme;
}

/**
 * Obowiązkowy wybór aplikacji i wyglądu strony. Z aplikacji biorą się termin, odliczanie i plan dnia, a pytania w Testach
 * zawężają się do niej i do pytań autorskich (potem filtr zmienia się osobno). Wygląd (domyślnie ciemny) widać od razu
 * jako podgląd, a zapisuje się razem z aplikacją. Okna nie da się zamknąć bez wyboru; jedyne inne wyjście to wylogowanie.
 */
function OnboardingDialog({ settings }: { settings: LearningSettings }) {
  const queryClient = useQueryClient();
  const terms = useExamTerms();
  const hintId = useId();
  const groupId = useId();
  const savedTheme: Theme = isTheme(settings.theme) ? settings.theme : "DARK";
  const [origin, setOrigin] = useState<QuestionOrigin | null>(null);
  const [theme, setTheme] = useState<Theme>(savedTheme);

  const termList = Array.isArray(terms.data) ? terms.data : null;
  const byOrigin = new Map((termList ?? []).map((term) => [term.origin, term]));

  const save = useMutation({
    mutationFn: async ({ origin: chosenOrigin, theme: chosenTheme }: SaveInput) => {
      // Wygląd zapisujemy tylko wtedy, gdy się zmienił; potem aplikacja (to ona zamyka okno).
      if (chosenTheme !== savedTheme) {
        queryClient.setQueryData(LEARNING_SETTINGS_KEY, await chooseTheme(chosenTheme));
      }
      return chooseExam(chosenOrigin);
    },
    onSuccess: (updated) => refreshAfterExamChosen(queryClient, updated),
  });

  function handleTheme(next: Theme) {
    setTheme(next);
    applyTheme(next); // podgląd; zapis dopiero z aplikacją
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!origin || save.isPending) return;
    save.mutate({ origin, theme });
  }

  return (
    <Dialog title="Witaj w Tutlaw" onClose={() => undefined} dismissible={false}>
      <p className="text-sm text-fg-muted">
        Wybierz aplikację, do której się przygotowujesz, i wygląd strony. Oba ustawienia zmienisz później w Koncie.
      </p>

      <form onSubmit={handleSubmit} aria-label="Pierwsze ustawienia" data-testid="onboarding" className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2" aria-describedby={hintId}>
          <legend className="mb-1 text-sm font-semibold text-fg">Do jakiego egzaminu się przygotowujesz?</legend>
          <p className="text-xs text-fg-muted">
            Na tej podstawie pokażemy odliczanie i dzienny plan, a w Testach zostaną pytania z wybranej aplikacji i pytania
            autorskie.
          </p>
          {EXAM_APPLICATIONS.map((application) => {
            const term = byOrigin.get(application);
            const line = examTermLine(term?.examDate, term?.daysToExam, termList !== null);
            const selected = origin === application;
            return (
              <label key={application} className="relative block cursor-pointer">
                <input
                  type="radio"
                  name={`onboarding-origin-${groupId}`}
                  value={application}
                  checked={selected}
                  onChange={() => setOrigin(application)}
                  disabled={save.isPending}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-3 rounded-xl border bg-surface-2 px-4 py-2.5 transition-colors hover:bg-line",
                    "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-ink",
                    selected ? "border-accent-ink bg-accent/10" : "border-field"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg">{ORIGIN_LABELS[application]}</span>
                    {line && <span className="block text-xs text-fg-muted">{line}</span>}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-4 shrink-0 rounded-full border-2",
                      selected ? "border-accent-ink bg-accent-ink" : "border-field"
                    )}
                  />
                </span>
              </label>
            );
          })}
        </fieldset>

        <ThemePicker name={`onboarding-theme-${groupId}`} legend="Wygląd strony" value={theme} onChange={handleTheme} disabled={save.isPending} />

        {save.isError && (
          <p role="alert" className="text-sm text-danger">
            {serverMessage(save.error, "Nie udało się zapisać wyboru. Spróbuj ponownie.")}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <p id={hintId} aria-live="polite" className="min-h-5 text-xs text-fg-muted">
            {origin ? "" : "Wybierz aplikację, żeby przejść dalej."}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <LogoutButton variant="text" />
            <Button type="submit" disabled={!origin || save.isPending} className="disabled:cursor-not-allowed disabled:opacity-50">
              {save.isPending ? "Zapisuję…" : "Zacznij naukę"}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
