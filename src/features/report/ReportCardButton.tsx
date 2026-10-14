import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Flag } from "lucide-react";
import { reportCard, type ReportReason, type ReportResult } from "../../api/reports";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { serverMessage } from "../../lib/errors";
import { cn } from "../../lib/cn";
import { REPORT_COMMENT_MAX_LENGTH, REPORT_REASONS } from "./reasons";

interface ReportCardButtonProps {
  cardId: number;
  className?: string;
}

const TOGGLE_CLASS =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink";

function thanksText(result: ReportResult): string {
  return result.updated
    ? "Uzupełniliśmy Twoje wcześniejsze zgłoszenie tej karty. Dziękujemy!"
    : "Dziękujemy! Zgłoszenie zapisane, sprawdzimy tę kartę.";
}

/**
 * „Zgłoś błąd": przycisk otwiera okno na środku ekranu z powodem i opcjonalnym komentarzem (dla pytań testowych
 * i fiszek). Po wysłaniu okno pokazuje podziękowanie, a po jego zamknięciu w miejscu przycisku zostaje krótka
 * informacja, że zgłoszenie poszło. Używaj z key={cardId}, żeby przy następnej karcie wszystko zaczynało od zera.
 * Skróty klawiszowe sesji (odpowiedzi, Enter, strzałki) działają tu tak samo jak w każdym oknie: nie działają
 * (data-no-shortcuts na przycisku i na oknie).
 */
export function ReportCardButton({ cardId, className }: ReportCardButtonProps) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState<ReportResult | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  // Po wysłaniu przycisk znika, więc po zamknięciu okna fokus ląduje na informacji, a nie przepada w <body>.
  useEffect(() => {
    if (!open && sent) statusRef.current?.focus();
  }, [open, sent]);

  if (sent && !open) {
    return (
      <p
        ref={statusRef}
        tabIndex={-1}
        role="status"
        data-no-shortcuts
        className={cn("flex min-h-11 items-center gap-2 text-sm text-fg-muted outline-none", className)}
      >
        <CheckCircle2 size={16} className="shrink-0 text-success" aria-hidden="true" />
        Zgłoszenie wysłane. Dziękujemy!
      </p>
    );
  }

  return (
    <div data-no-shortcuts className={className}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={TOGGLE_CLASS}
      >
        <Flag size={14} aria-hidden="true" />
        Zgłoś błąd
      </button>
      {open && (
        <ReportDialog
          cardId={cardId}
          returnFocusTo={buttonRef}
          onSent={setSent}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

interface ReportDialogProps {
  cardId: number;
  returnFocusTo: React.RefObject<HTMLElement | null>;
  onSent: (result: ReportResult) => void;
  onClose: () => void;
}

/** Okno zgłoszenia. Montowane tylko, gdy jest otwarte, więc każde otwarcie zaczyna od pustego formularza. */
function ReportDialog({ cardId, returnFocusTo, onSent, onClose }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [comment, setComment] = useState("");
  const groupId = useId();
  const commentId = useId();

  const mutation = useMutation({
    mutationFn: () => reportCard(cardId, reason!, comment),
    onSuccess: onSent,
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason || mutation.isPending) return;
    mutation.mutate();
  }

  const commentRequired = reason === "OTHER";
  // Wpisany komentarz nie ginie od przypadkowego kliknięcia w tło; Esc i „Zamknij okno" nadal zamykają.
  const closeOnBackdrop = comment.trim() === "" && !mutation.isPending;

  return (
    <Dialog title="Zgłoś błąd" onClose={onClose} returnFocusTo={returnFocusTo} closeOnBackdrop={closeOnBackdrop}>
      {mutation.isSuccess ? (
        <div className="flex flex-col gap-4">
          <p role="status" className="flex items-start gap-2 text-sm text-fg">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
            {thanksText(mutation.data)}
          </p>
          <div className="flex justify-end">
            <Button type="button" autoFocus onClick={onClose}>
              Zamknij
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} aria-label="Zgłoszenie błędu" className="flex flex-col gap-4">
          <p className="text-sm text-fg-muted">
            Pomóż nam poprawić treść. Zgłoszenie trafi do sprawdzenia przez zespół.
          </p>

          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-sm font-semibold text-fg">Co jest nie tak?</legend>
            {REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm text-fg hover:bg-surface-2"
              >
                <input
                  type="radio"
                  name={`report-reason-${groupId}`}
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="size-4 shrink-0 accent-[var(--color-accent-ink)]"
                />
                {r.label}
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-1">
            <label htmlFor={commentId} className="text-sm text-fg-muted">
              {commentRequired ? "Opisz, co jest nie tak" : "Komentarz (opcjonalnie)"}
            </label>
            <textarea
              id={commentId}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={REPORT_COMMENT_MAX_LENGTH}
              rows={4}
              required={commentRequired}
              className="rounded-xl border border-field bg-surface-2 px-3 py-2 text-sm"
            />
          </div>

          {mutation.isError && (
            <p role="alert" className="text-sm text-danger">
              {serverMessage(mutation.error, "Nie udało się wysłać zgłoszenia. Spróbuj ponownie.")}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
              Anuluj
            </Button>
            <Button type="submit" disabled={!reason || mutation.isPending} className="disabled:cursor-not-allowed disabled:opacity-50">
              {mutation.isPending ? "Wysyłam…" : "Wyślij zgłoszenie"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
