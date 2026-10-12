import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Pause } from "lucide-react";
import { suspendCard } from "../../api/difficult";
import { cn } from "../../lib/cn";
import { serverMessage } from "../../lib/errors";
import { DIFFICULT_CARDS_KEY } from "./hooks";

interface SuspendCardButtonProps {
  cardId: number;
  /** Pytanie zawieszone wcześniej w tej sesji (np. przy podglądzie poprzednich pytań). */
  alreadySuspended?: boolean;
  onSuspended?: (cardId: number) => void;
}

/**
 * „Zawieś pytanie" przy trudnym pytaniu. Zawieszone pytanie znika z powtórek i testów, a postęp zostaje;
 * przywraca się je w Koncie. Jak „Zgłoś błąd": jeden przycisk przed i po (zmienia się tylko opis), żeby fokus nie przepadł,
 * a `data-no-shortcuts` chroni przed uruchomieniem skrótów sesji (Enter/Spacja na przycisku nie idą dalej).
 */
export function SuspendCardButton({ cardId, alreadySuspended = false, onSuspended }: SuspendCardButtonProps) {
  const queryClient = useQueryClient();
  const [done, setDone] = useState(alreadySuspended);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => suspendCard(cardId),
    onSuccess: () => {
      setDone(true);
      setError(null);
      onSuspended?.(cardId);
      void queryClient.invalidateQueries({ queryKey: DIFFICULT_CARDS_KEY });
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
          "inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg px-1 text-sm text-fg-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
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
