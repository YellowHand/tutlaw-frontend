import { useId, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chooseExam, chooseTheme, type ExamChoice, type LearningSettings } from "../../api/settings";
import { LogoutButton } from "../../components/layout/LogoutButton";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { cn } from "../../lib/cn";
import { serverMessage } from "../../lib/errors";
import { EXAM_APPLICATIONS, ORIGIN_LABELS } from "../../lib/origin";
import { applyTheme, isTheme, type Theme } from "../../lib/theme";
import { examTermLine, refreshAfterExamChosen } from "../settings/examChoice";
import { LEARNING_SETTINGS_KEY, useExamTerms, useLearningSettings } from "../settings/hooks";
import { ThemePicker } from "../settings/ThemePicker";

/**
 * Okno startowe po zalogowaniu: dopóki użytkownik nie zrobił wyboru (aplikacja, do której się przygotowuje, albo „Jestem
 * studentem"), nie przejdzie dalej. Pytamy dopiero, gdy serwer wprost mówi, że wyboru nie ma (`startChoiceMade: false`):
 * błąd, ładowanie ani nieoczekiwana odpowiedź ustawień nie blokują aplikacji. Student ma `examOrigin: null`, ale wybór
 * zrobiony, więc okno decyduje flaga, a nie sam brak aplikacji.
 */
export function OnboardingGate() {
  const { data } = useLearningSettings();
  if (!data || data.startChoiceMade !== false) return null;
  return <OnboardingDialog settings={data} />;
}

interface SaveInput {
  choice: ExamChoice;
  theme: Theme;
}

const STUDENT: ExamChoice = "STUDENT";

/**
 * Obowiązkowy wybór aplikacji (albo „Jestem studentem") i wyglądu strony. Z aplikacji biorą się termin, odliczanie i plan dnia,
 * a pytania w Testach zawężają się do niej i do pytań autorskich (potem filtr zmienia się osobno). Student nie ma terminu
 * ani planu i widzi pytania ze wszystkich aplikacji. Wygląd (domyślnie ciemny) widać od razu
 * jako podgląd, a zapisuje się razem z aplikacją. Okna nie da się zamknąć bez wyboru; jedyne inne wyjście to wylogowanie.
 */
function OnboardingDialog({ settings }: { settings: LearningSettings }) {
  const queryClient = useQueryClient();
  const terms = useExamTerms();
  const hintId = useId();
  const groupId = useId();
  const savedTheme: Theme = isTheme(settings.theme) ? settings.theme : "DARK";
  const [choice, setChoice] = useState<ExamChoice | null>(null);
  const [theme, setTheme] = useState<Theme>(savedTheme);

  const termList = Array.isArray(terms.data) ? terms.data : null;
  const byOrigin = new Map((termList ?? []).map((term) => [term.origin, term]));

  const save = useMutation({
    mutationFn: async ({ choice: chosenChoice, theme: chosenTheme }: SaveInput) => {
      // Wygląd zapisujemy tylko wtedy, gdy się zmienił; potem aplikacja (to ona zamyka okno).
      if (chosenTheme !== savedTheme) {
        queryClient.setQueryData(LEARNING_SETTINGS_KEY, await chooseTheme(chosenTheme));
      }
      return chooseExam(chosenChoice);
    },
    onSuccess: (updated) => refreshAfterExamChosen(queryClient, updated),
  });

  function handleTheme(next: Theme) {
    setTheme(next);
    applyTheme(next); // podgląd; zapis dopiero z aplikacją
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!choice || save.isPending) return;
    save.mutate({ choice, theme });
  }

  return (
    <Dialog title="Witaj w Tutlaw" onClose={() => undefined} dismissible={false}>
      <p className="text-sm text-fg-muted">
        Wybierz aplikację, do której się przygotowujesz (albo że jesteś studentem), i wygląd strony. Oba ustawienia zmienisz
        później w Koncie.
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
            const selected = choice === application;
            return (
              <label key={application} className="relative block cursor-pointer">
                <input
                  type="radio"
                  name={`onboarding-origin-${groupId}`}
                  value={application}
                  checked={selected}
                  onChange={() => setChoice(application)}
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
          <label className="relative block cursor-pointer">
            <input
              type="radio"
              name={`onboarding-origin-${groupId}`}
              value="STUDENT"
              checked={choice === STUDENT}
              onChange={() => setChoice(STUDENT)}
              disabled={save.isPending}
              data-testid="onboarding-student"
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex min-h-11 items-center justify-between gap-3 rounded-xl border bg-surface-2 px-4 py-2.5 transition-colors hover:bg-line",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-ink",
                choice === STUDENT ? "border-accent-ink bg-accent/10" : "border-field"
              )}
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-fg">Jestem studentem / jeszcze nie wybrałem</span>
                <span className="block text-xs text-fg-muted">Bez odliczania i planu dnia, pytania ze wszystkich aplikacji</span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0 rounded-full border-2",
                  choice === STUDENT ? "border-accent-ink bg-accent-ink" : "border-field"
                )}
              />
            </span>
          </label>
        </fieldset>

        <ThemePicker name={`onboarding-theme-${groupId}`} legend="Wygląd strony" value={theme} onChange={handleTheme} disabled={save.isPending} />

        {save.isError && (
          <p role="alert" className="text-sm text-danger">
            {serverMessage(save.error, "Nie udało się zapisać wyboru. Spróbuj ponownie.")}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <p id={hintId} aria-live="polite" className="min-h-5 text-xs text-fg-muted">
            {choice ? "" : "Wybierz aplikację albo opcję dla studentów, żeby przejść dalej."}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <LogoutButton variant="text" />
            <Button type="submit" disabled={!choice || save.isPending} className="disabled:cursor-not-allowed disabled:opacity-50">
              {save.isPending ? "Zapisuję…" : "Zacznij naukę"}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
