import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Pause } from "lucide-react";
import { suspendQuestion } from "../../api/difficult";
import type { SessionMode } from "../../api/review";
import { cn } from "../../lib/cn";
import { serverMessage } from "../../lib/errors";
import { DIFFICULT_QUESTIONS_KEY } from "./hooks";

interface SuspendQuestionButtonProps {
  questionId: number;
  /** Tryb sesji: test i fiszka tego samego pytania zawieszają się osobno. */
  mode: SessionMode;
  /** Pytanie zawieszone wcześniej w tej sesji (np. przy podglądzie poprzednich pytań). */
  alreadySuspended?: boolean;
  onSuspended?: (questionId: number) => void;
}

/**
 * „Zawieś pytanie" przy trudnym pytaniu. Zawieszone pytanie znika z powtórek tego trybu (testów albo fiszek), a postęp zostaje;
 * przywraca się je w Koncie. Jak „Zgłoś błąd": jeden przycisk przed i po (zmienia się tylko opis), żeby fokus nie przepadł,
 * a `data-no-shortcuts` chroni przed uruchomieniem skrótów sesji (Enter/Spacja na przycisku nie idą dalej).
 */
export function SuspendQuestionButton({ questionId, mode, alreadySuspended = false, onSuspended }: SuspendQuestionButtonProps) {
  const queryClient = useQueryClient();
  const [done, setDone] = useState(alreadySuspended);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => suspendQuestion(questionId, mode),
    onSuccess: () => {
      setDone(true);
      setError(null);
      onSuspended?.(questionId);
      void queryClient.invalidateQueries({ queryKey: DIFFICULT_QUESTIONS_KEY });
    },
    onError: (err) => setError(serverMessage(err, "Nie udało się zawiesić pytania. Spróbuj ponownie.")),
  });

  const inactive = done || mutation.isPending;

  return (
    <div className="flex flex-wrap items-center gap-x-3">
      <button
        type="button"
        data-no-shortcuts={done ? undefined : true}
        aria-disabled={inactive || undefined}
        onClick={() => {
          if (!inactive) mutation.mutate();
        }}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg px-1 text-sm text-fg-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink",
          inactive ? "cursor-default" : "cursor-pointer hover:text-fg"
        )}
      >
        {done ? <Check size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
        {done ? "Zawieszone" : mutation.isPending ? "Zawieszam…" : "Zawieś pytanie"}
      </button>
      <span role="status" className="text-xs text-fg-muted">
        {done ? "Przywrócisz je w Koncie." : ""}
      </span>
      {error && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
