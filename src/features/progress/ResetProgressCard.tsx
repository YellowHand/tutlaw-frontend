import { useRef, useState, type FormEvent } from "react";
import { RotateCcw } from "lucide-react";
import { isResetConfirmed } from "../../api/studyProgress";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Dialog } from "../../components/ui/Dialog";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { serverMessage } from "../../lib/errors";
import { hasProgress } from "../../api/studyProgress";
import { useResetStudyProgress, useStudyProgress } from "./hooks";
import { ConfirmWordField, ProgressLossList, WHAT_STAYS } from "./ResetConfirmation";

const DANGER_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-full bg-danger px-4 min-h-11 text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

/** Konto → „Wyzeruj postępy": zaczynasz naukę od zera, nic poza postępami się nie zmienia. */
export function ResetProgressCard() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);

  return (
    <Card className="flex flex-col gap-4 border-danger/40" data-testid="reset-progress-card">
      <div>
        <h2 className="text-lg font-semibold text-danger">Wyzeruj postępy</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Zaczniesz naukę od zera: usuniemy stan pytań w testach i fiszkach, terminy powtórek, historię odpowiedzi, własne testy,
          egzaminy próbne, statystyki i czas nauki. Tego nie da się cofnąć. {WHAT_STAYS}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          ref={opener}
          type="button"
          className={DANGER_BUTTON}
          onClick={() => {
            setDone(false);
            setOpen(true);
          }}
        >
          <RotateCcw size={16} aria-hidden="true" />
          Wyzeruj postępy
        </button>
        {done && (
          <p role="status" className="text-sm text-success">
            Postępy wyzerowane. Możesz zacząć od nowa.
          </p>
        )}
      </div>
      {open && (
        <ResetDialog
          returnFocusTo={opener}
          onClose={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            setDone(true);
          }}
        />
      )}
    </Card>
  );
}

interface ResetDialogProps {
  returnFocusTo: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onDone: () => void;
}

function ResetDialog({ returnFocusTo, onClose, onDone }: ResetDialogProps) {
  const progress = useStudyProgress(true);
  const reset = useResetStudyProgress();
  const [typed, setTyped] = useState("");

  const loaded = progress.data;
  const nothing = loaded ? !hasProgress(loaded) : false;
  const canSubmit = Boolean(loaded) && !nothing && isResetConfirmed(typed) && !reset.isPending;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    reset.mutate(undefined, { onSuccess: onDone });
  }

  return (
    <Dialog title="Wyzerować postępy?" onClose={onClose} returnFocusTo={returnFocusTo} closeOnBackdrop={false}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-fg-muted">Po wyzerowaniu zniknie to, co poniżej. Tego nie da się cofnąć.</p>

        {progress.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : progress.isError || !loaded ? (
          <ErrorState message="Nie udało się sprawdzić, co zniknie." onRetry={() => void progress.refetch()} />
        ) : (
          <ProgressLossList progress={loaded} />
        )}

        <p className="text-sm text-fg-muted">{WHAT_STAYS}</p>

        {loaded && !nothing && <ConfirmWordField value={typed} onChange={setTyped} disabled={reset.isPending} />}

        {reset.isError && (
          <p role="alert" className="text-sm text-danger">
            {serverMessage(reset.error, "Nie udało się wyzerować postępów. Spróbuj ponownie.")}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Anuluj
          </Button>
          <button type="submit" disabled={!canSubmit} className={DANGER_BUTTON}>
            {reset.isPending ? "Zeruję..." : "Wyzeruj na stałe"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
