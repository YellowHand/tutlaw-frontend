import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, EyeOff } from "lucide-react";
import { setCardHidden } from "../../api/flashcards";
import { cn } from "../../lib/cn";
import { serverMessage } from "../../lib/errors";
import { invalidateReviewData } from "../review/hooks";
import { useIsAdmin } from "../auth/role";

interface HideCardButtonProps {
  cardId: number;
  /** Karta ukryta wcześniej w tej sesji (np. przy podglądzie poprzednich pytań). */
  alreadyHidden?: boolean;
  onHidden?: (cardId: number) => void;
}

const LINK_CLASS =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-1 text-sm text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * „Ukryj" – tylko dla administratora. Ukrywa pytanie (albo fiszkę) wszystkim użytkownikom: znika z testów, sesji,
 * liczników i egzaminu, a historia odpowiedzi zostaje. Przywraca się je w bazie (UPDATE cards SET hidden = false …).
 * Ukrycie wymaga potwierdzenia, bo dotyczy wszystkich. Ten sam wzorzec co „Zawieś pytanie".
 */
export function HideCardButton({ cardId, alreadyHidden = false, onHidden }: HideCardButtonProps) {
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const [done, setDone] = useState(alreadyHidden);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => setCardHidden(cardId, true),
    onSuccess: () => {
      setDone(true);
      setConfirming(false);
      setError(null);
      onHidden?.(cardId);
      invalidateReviewData(queryClient);
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
    onError: (err) => setError(serverMessage(err, "Nie udało się ukryć. Spróbuj ponownie.")),
  });

  if (!isAdmin) return null;

  if (done) {
    return (
      <p data-testid="hidden-done" role="status" className="flex min-h-11 items-center gap-2 text-sm text-fg-muted">
        <Check size={16} aria-hidden="true" />
        Ukryte dla wszystkich.
      </p>
    );
  }

  if (confirming) {
    return (
      <div data-no-shortcuts className="flex flex-wrap items-center gap-x-3 text-sm text-fg-muted">
        <span>Ukryć dla wszystkich użytkowników?</span>
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className={cn(LINK_CLASS, "font-semibold text-danger hover:text-danger")}
        >
          {mutation.isPending ? "Ukrywam…" : "Tak, ukryj"}
        </button>
        <button type="button" disabled={mutation.isPending} onClick={() => setConfirming(false)} className={LINK_CLASS}>
          Anuluj
        </button>
        {error && (
          <span role="alert" className="text-xs text-danger">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div data-no-shortcuts>
      <button type="button" onClick={() => setConfirming(true)} className={LINK_CLASS}>
        <EyeOff size={14} aria-hidden="true" />
        Ukryj
      </button>
    </div>
  );
}
