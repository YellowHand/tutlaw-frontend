import { useId, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chooseTheme, chooseTrack, type LearningSettings } from "../../api/settings";
import type { Track } from "../../api/tracks";
import { LogoutButton } from "../../components/layout/LogoutButton";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Skeleton } from "../../components/ui/Skeleton";
import { cn } from "../../lib/cn";
import { serverMessage } from "../../lib/errors";
import { applyTheme, isTheme, type Theme } from "../../lib/theme";
import { LEARNING_SETTINGS_KEY, useExamTerms, useLearningSettings, useTracks } from "../settings/hooks";
import { ThemePicker } from "../settings/ThemePicker";
import { examTermLine, refreshAfterTrackChosen } from "../settings/trackChoice";

/**
 * Okno startowe po zalogowaniu: dopóki użytkownik nie wybrał ścieżki (jednej z pięciu aplikacji albo Studenta), nie przejdzie
 * dalej. Pytamy dopiero, gdy serwer wprost mówi, że wyboru nie ma (`track: null`): błąd, ładowanie ani nieoczekiwana
 * odpowiedź ustawień (brak pola) nie blokują aplikacji.
 */
export function OnboardingGate() {
  const { data } = useLearningSettings();
  if (!data || data.track !== null) return null;
  return <OnboardingDialog settings={data} />;
}

interface SaveInput {
  trackId: number;
  theme: Theme;
}

/** Opis pod nazwą ścieżki, gdy nie ma terminu egzaminu (Student) albo go nie pobrano. */
const STUDENT_HINT = "Bez odliczania i planu dnia. Uczysz się z wybranych przedmiotów (potem zmienisz je w „Puli pytań”)";

/**
 * Obowiązkowy wybór ścieżki (aplikacja albo Student) i wyglądu strony. Z aplikacji biorą się termin, odliczanie i plan dnia,
 * a pula pytań to własne arkusze aplikacji i akty prawne, które ona obejmuje (potem zawęzisz ją w „Puli pytań"). Student
 * nie ma terminu ani planu, a pulę składa z przedmiotów. Wygląd (domyślnie ciemny) widać od razu jako podgląd, a zapisuje
 * się razem ze ścieżką. Okna nie da się zamknąć bez wyboru; jedyne inne wyjście to wylogowanie.
 */
function OnboardingDialog({ settings }: { settings: LearningSettings }) {
  const queryClient = useQueryClient();
  const tracksQuery = useTracks();
  const terms = useExamTerms();
  const hintId = useId();
  const groupId = useId();
  const savedTheme: Theme = isTheme(settings.theme) ? settings.theme : "DARK";
  const [choice, setChoice] = useState<number | null>(null);
  const [theme, setTheme] = useState<Theme>(savedTheme);

  const tracks = tracksQuery.data ?? [];
  const termList = Array.isArray(terms.data) ? terms.data : null;
  const termOf = new Map((termList ?? []).map((term) => [term.track.id, term]));

  const save = useMutation({
    mutationFn: async ({ trackId, theme: chosenTheme }: SaveInput) => {
      // Wygląd zapisujemy tylko wtedy, gdy się zmienił; potem ścieżkę (to ona zamyka okno).
      if (chosenTheme !== savedTheme) {
        queryClient.setQueryData(LEARNING_SETTINGS_KEY, await chooseTheme(chosenTheme));
      }
      return chooseTrack(trackId);
    },
    onSuccess: (updated) => refreshAfterTrackChosen(queryClient, updated),
  });

  function handleTheme(next: Theme) {
    setTheme(next);
    applyTheme(next); // podgląd; zapis dopiero ze ścieżką
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (choice === null || save.isPending) return;
    save.mutate({ trackId: choice, theme });
  }

  function renderTrack(track: Track) {
    const selected = choice === track.id;
    const term = termOf.get(track.id);
    const detail =
      track.kind === "EXAM" ? examTermLine(term?.examDate, term?.daysToExam, termList !== null) : STUDENT_HINT;
    return (
      <label key={track.id} className="relative block cursor-pointer">
        <input
          type="radio"
          name={`onboarding-track-${groupId}`}
          value={track.id}
          checked={selected}
          onChange={() => setChoice(track.id)}
          disabled={save.isPending}
          data-testid={track.kind === "STUDENT" ? "onboarding-student" : `onboarding-track-${track.slug}`}
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
            <span className="block text-sm font-medium text-fg">{track.name}</span>
            {detail && <span className="block text-xs text-fg-muted">{detail}</span>}
          </span>
          <span
            aria-hidden="true"
            className={cn("size-4 shrink-0 rounded-full border-2", selected ? "border-accent-ink bg-accent-ink" : "border-field")}
          />
        </span>
      </label>
    );
  }

  return (
    <Dialog title="Witaj w Gradus iuris" onClose={() => undefined} dismissible={false}>
      <p className="text-sm text-fg-muted">
        Wybierz, do czego się przygotowujesz (aplikacja albo Student), i wygląd strony. Oba ustawienia zmienisz później w
        Koncie.
      </p>

      <form onSubmit={handleSubmit} aria-label="Pierwsze ustawienia" data-testid="onboarding" className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2" aria-describedby={hintId}>
          <legend className="mb-1 text-sm font-semibold text-fg">Do czego się przygotowujesz?</legend>
          <p className="text-xs text-fg-muted">
            Na tej podstawie ułożymy pulę pytań: arkusze Twojej aplikacji i akty prawne, które obejmuje. W aplikacjach
            pokażemy też odliczanie i dzienny plan.
          </p>
          {tracksQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : tracksQuery.isError || tracks.length === 0 ? (
            <p role="alert" className="text-sm text-danger">
              Nie udało się pobrać listy ścieżek.{" "}
              <button type="button" onClick={() => void tracksQuery.refetch()} className="underline underline-offset-2">
                Spróbuj ponownie
              </button>
            </p>
          ) : (
            // Aplikacje w kolejności z bazy, Student zawsze na końcu.
            [...tracks.filter((track) => track.kind === "EXAM"), ...tracks.filter((track) => track.kind === "STUDENT")].map(renderTrack)
          )}
        </fieldset>

        <ThemePicker name={`onboarding-theme-${groupId}`} legend="Wygląd strony" value={theme} onChange={handleTheme} disabled={save.isPending} />

        {save.isError && (
          <p role="alert" className="text-sm text-danger">
            {serverMessage(save.error, "Nie udało się zapisać wyboru. Spróbuj ponownie.")}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <p id={hintId} aria-live="polite" className="min-h-5 text-xs text-fg-muted">
            {choice !== null ? "" : "Wybierz aplikację albo Studenta, żeby przejść dalej."}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <LogoutButton variant="text" />
            <Button type="submit" disabled={choice === null || save.isPending} className="disabled:cursor-not-allowed disabled:opacity-50">
              {save.isPending ? "Zapisuję…" : "Zacznij naukę"}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
