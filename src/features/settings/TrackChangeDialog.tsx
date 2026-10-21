import { useState, type FormEvent, type RefObject } from "react";
import { hasProgress, isResetConfirmed } from "../../api/studyProgress";
import type { Track } from "../../api/tracks";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { serverMessage } from "../../lib/errors";
import { useResetStudyProgress, useStudyProgress } from "../progress/hooks";
import { ConfirmWordField, ProgressLossList } from "../progress/ResetConfirmation";
import { useChooseTrack } from "./trackChoice";

interface TrackChangeDialogProps {
  from: Track | null;
  to: Track;
  returnFocusTo: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** Ścieżka zmieniona (a gdy zaznaczono „Zacznij od zera": postępy wyzerowane). */
  onDone: () => void;
}

/** Czego dotyczy pula pytań po zmianie: aplikacje mają akty prawne, Student przedmioty. */
function poolSentence(to: Track): string {
  return to.kind === "STUDENT"
    ? "Zmienia się pula pytań: będziesz się uczyć z przedmiotów (wszystkich albo tych, które wybierzesz w „Zakresie nauki”, poniżej w Koncie)."
    : "Zmienia się pula pytań: zdejmiemy wybór aktów prawnych (potem zawęzisz go w „Zakresie nauki” w Koncie).";
}

/**
 * Potwierdzenie zmiany ścieżki. Mówi wprost, że postępy zostają (stan pytań, terminy powtórek, historia, statystyki), bo
 * to najczęstsza obawa. „Zacznij od zera" jest domyślnie niezaznaczone; po zaznaczeniu pokazuje, co zniknie, i wymaga
 * wpisania WYZERUJ, tak samo jak zerowanie w Koncie. Najpierw zmieniamy ścieżkę, potem zerujemy: gdyby zmiana się nie
 * udała, użytkownik nie traci postępów.
 */
export function TrackChangeDialog({ from, to, returnFocusTo, onClose, onDone }: TrackChangeDialogProps) {
  const choose = useChooseTrack();
  const reset = useResetStudyProgress();
  const [fresh, setFresh] = useState(false);
  const [typed, setTyped] = useState("");
  const [trackChanged, setTrackChanged] = useState(false);
  const progress = useStudyProgress(fresh);

  const loaded = progress.data;
  const nothing = loaded ? !hasProgress(loaded) : false;
  const resetReady = !fresh || (Boolean(loaded) && (nothing || isResetConfirmed(typed)));
  const busy = choose.isPending || reset.isPending;

  async function run() {
    try {
      if (!trackChanged) {
        await choose.mutateAsync(to.id);
        setTrackChanged(true);
      }
      if (fresh && !nothing) await reset.mutateAsync();
      onDone();
    } catch {
      // Błąd pokazują `choose.isError` i `reset.isError` poniżej; okno zostaje otwarte, żeby można było ponowić.
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!resetReady || busy) return;
    void run();
  }

  return (
    <Dialog title="Zmienić ścieżkę?" onClose={onClose} returnFocusTo={returnFocusTo} closeOnBackdrop={false}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-fg-muted">
          {from ? (
            <>
              Zmieniasz ścieżkę z <span className="font-medium text-fg">{from.name}</span> na{" "}
              <span className="font-medium text-fg">{to.name}</span>.
            </>
          ) : (
            <>
              Wybierasz ścieżkę <span className="font-medium text-fg">{to.name}</span>.
            </>
          )}
        </p>

        <div data-testid="progress-stays" className="rounded-xl border border-line bg-surface-2 p-3 text-sm">
          <p className="font-medium text-fg">Twoje postępy zostają</p>
          <p className="mt-1 text-fg-muted">
            Stan pytań w testach i fiszkach, terminy powtórek, historia odpowiedzi, własne testy, egzaminy i statystyki zostają
            tak, jak są. {poolSentence(to)}
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={fresh}
            disabled={busy || trackChanged}
            onChange={(e) => {
              setFresh(e.target.checked);
              setTyped("");
            }}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-danger)]"
          />
          <span>
            <span className="font-medium text-fg">Zacznij od zera</span>
            <span className="block text-xs text-fg-muted">
              Dodatkowo wyzeruję moje postępy i statystyki. Tego nie da się cofnąć.
            </span>
          </span>
        </label>

        {fresh && (
          <div className="flex flex-col gap-3" data-testid="fresh-start">
            {progress.isLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : progress.isError || !loaded ? (
              <ErrorState message="Nie udało się sprawdzić, co zniknie." onRetry={() => void progress.refetch()} />
            ) : (
              <>
                <p className="text-sm text-fg-muted">Zniknie:</p>
                <ProgressLossList progress={loaded} />
                {!nothing && <ConfirmWordField value={typed} onChange={setTyped} disabled={busy} />}
              </>
            )}
          </div>
        )}

        {choose.isError && (
          <p role="alert" className="text-sm text-danger">
            {serverMessage(choose.error, "Nie udało się zmienić ścieżki. Spróbuj ponownie.")}
          </p>
        )}
        {reset.isError && (
          <p role="alert" className="text-sm text-danger">
            Ścieżka jest już zmieniona, ale postępów nie udało się wyzerować:{" "}
            {serverMessage(reset.error, "spróbuj ponownie.")} Możesz też zrobić to później w Koncie, w karcie „Wyzeruj postępy”.
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            {trackChanged ? "Zamknij" : "Anuluj"}
          </Button>
          <Button type="submit" variant={fresh ? "danger" : "primary"} disabled={!resetReady || busy}>
            {busy ? "Zapisuję..." : fresh ? "Zmień ścieżkę i wyzeruj" : "Zmień ścieżkę"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
