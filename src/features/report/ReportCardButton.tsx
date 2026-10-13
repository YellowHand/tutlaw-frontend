import { useId, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Flag } from "lucide-react";
import { reportCard, type ReportReason } from "../../api/reports";
import { serverMessage } from "../../lib/errors";
import { cn } from "../../lib/cn";
import { REPORT_COMMENT_MAX_LENGTH, REPORT_REASONS } from "./reasons";

interface ReportCardButtonProps {
  cardId: number;
  className?: string;
}

const TOGGLE_CLASS =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * „Zgłoś błąd w pytaniu": rozwija mały formularz z powodem i opcjonalnym komentarzem.
 * Używaj z key={cardId}, żeby przy następnym pytaniu formularz zaczynał od zera.
 * Skróty klawiszowe sesji (odpowiedzi, Enter, strzałki) w tym obszarze nie działają: data-no-shortcuts.
 */
export function ReportCardButton({ cardId, className }: ReportCardButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [comment, setComment] = useState("");
  const groupId = useId();
  const commentId = useId();

  const mutation = useMutation({
    mutationFn: () => reportCard(cardId, reason!, comment),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason || mutation.isPending) return;
    mutation.mutate();
  }

  if (mutation.isSuccess) {
    return (
      <p
        role="status"
        data-no-shortcuts
        className={cn("flex items-center gap-2 text-sm text-fg-muted", className)}
      >
        <CheckCircle2 size={16} className="shrink-0 text-success" aria-hidden="true" />
        {mutation.data.updated
          ? "Uzupełniliśmy Twoje wcześniejsze zgłoszenie tego pytania. Dziękujemy!"
          : "Dziękujemy! Zgłoszenie zapisane, sprawdzimy to pytanie."}
      </p>
    );
  }

  if (!open) {
    return (
      <div data-no-shortcuts className={className}>
        <button type="button" onClick={() => setOpen(true)} className={TOGGLE_CLASS}>
          <Flag size={14} aria-hidden="true" />
          Zgłoś błąd w pytaniu
        </button>
      </div>
    );
  }

  const commentRequired = reason === "OTHER";

  return (
    <form
      onSubmit={handleSubmit}
      data-no-shortcuts
      aria-label="Zgłoszenie błędu w pytaniu"
      className={cn("flex flex-col gap-3 rounded-xl border border-line bg-surface p-4", className)}
    >
      <fieldset className="flex flex-col gap-1" aria-describedby={`${groupId}-hint`}>
        <legend className="text-sm font-semibold text-fg">Co jest nie tak z tym pytaniem?</legend>
        {REPORT_REASONS.map((r) => (
          <label key={r.value} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-fg">
            <input
              type="radio"
              name={`report-reason-${groupId}`}
              value={r.value}
              checked={reason === r.value}
              onChange={() => setReason(r.value)}
              className="size-4 shrink-0 accent-[var(--color-accent)]"
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
          rows={3}
          required={commentRequired}
          className="rounded-xl border border-field bg-surface-2 px-3 py-2 text-sm"
        />
      </div>

      {mutation.isError && (
        <p role="alert" className="text-sm text-danger">
          {serverMessage(mutation.error, "Nie udało się wysłać zgłoszenia. Spróbuj ponownie.")}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={!reason || mutation.isPending}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {mutation.isPending ? "Wysyłam..." : "Wyślij zgłoszenie"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={mutation.isPending}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-3 text-sm text-fg-muted hover:text-fg disabled:opacity-50"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
