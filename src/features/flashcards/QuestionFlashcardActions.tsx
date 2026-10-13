import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Layers, Minus, Plus } from "lucide-react";
import { addToFlashcards, removeFromFlashcards } from "../../api/flashcards";
import type { FlashcardStatus } from "../../api/review";
import { cn } from "../../lib/cn";
import { serverMessage } from "../../lib/errors";
import { invalidateReviewData } from "../review/hooks";

interface QuestionFlashcardActionsProps {
  questionId: number;
  /** Stan fiszki po odpowiedzi albo po ostatniej zmianie w tej sesji. */
  status: FlashcardStatus;
  onStatusChange: (questionId: number, status: FlashcardStatus) => void;
}

const BUTTON_CLASS =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-1 text-sm text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-60";

/**
 * Przycisk fiszki pod odpowiedzią w teście:
 * „Dodaj do fiszek" (fiszki pytania jeszcze nie ma w Fiszkach), potem „W fiszkach" z „Usuń z fiszek" (cofnięcie).
 * Fiszka dodana przez błąd nie ma przycisku (tego nie da się cofnąć), a pytanie bez fiszki nie ma nic.
 * `data-no-shortcuts`: skróty sesji (Enter, strzałki) nie uruchamiają się, gdy fokus jest na tych przyciskach.
 */
export function QuestionFlashcardActions({ questionId, status, onStatusChange }: QuestionFlashcardActionsProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (add: boolean) => (add ? addToFlashcards(questionId) : removeFromFlashcards(questionId)),
    onSuccess: (next) => {
      setError(null);
      onStatusChange(questionId, next);
      // Fiszki i liczniki w menu mają zobaczyć zmianę od razu, a nie dopiero po wyjściu z sesji.
      invalidateReviewData(queryClient);
    },
    onError: (err) => setError(serverMessage(err, "Nie udało się zmienić fiszek. Spróbuj ponownie.")),
  });

  if (status === "UNAVAILABLE" || status === "ADDED_BY_MISTAKE") return null;

  return (
    <div data-no-shortcuts className="flex flex-wrap items-center gap-x-3">
      {status === "AVAILABLE" ? (
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(true)}
          className={BUTTON_CLASS}
        >
          <Plus size={16} aria-hidden="true" />
          {mutation.isPending ? "Dodaję…" : "Dodaj do fiszek"}
        </button>
      ) : (
        <>
          <span
            data-testid="flashcard-added"
            className={cn("inline-flex min-h-11 items-center gap-2 text-sm text-fg-muted")}
          >
            <Check size={16} className="text-success" aria-hidden="true" />W fiszkach
          </span>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(false)}
            className={BUTTON_CLASS}
          >
            <Minus size={16} aria-hidden="true" />
            {mutation.isPending ? "Usuwam…" : "Usuń z fiszek"}
          </button>
        </>
      )}
      {error && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}

interface FlashcardStatusNoteProps {
  status: FlashcardStatus;
  /** Ta odpowiedź właśnie sama dodała fiszkę do Fiszek (pierwszy pewny błąd w pytaniu). */
  justAdded: boolean;
  className?: string;
}

/** Zdanie w panelu wyniku, gdy fiszka trafiła do Fiszek przez błąd w pytaniu. */
export function FlashcardStatusNote({ status, justAdded, className }: FlashcardStatusNoteProps) {
  if (status !== "ADDED_BY_MISTAKE") return null;
  return (
    <p
      data-testid={justAdded ? "flashcard-unlocked" : "flashcard-present"}
      className={cn("flex items-start gap-2 text-sm text-fg-muted", className)}
    >
      <Layers size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
      <span>{justAdded ? "Dodałem fiszkę do tego pytania w Fiszkach." : "Fiszka tego pytania jest w Fiszkach."}</span>
    </p>
  );
}
