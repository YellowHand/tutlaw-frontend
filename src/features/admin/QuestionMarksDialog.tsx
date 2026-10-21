import { decideMark, type AdminQuestion, type MarkStatus, type MarkType } from "../../api/admin";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { serverMessage } from "../../lib/errors";
import { useState } from "react";
import { useAdminMutation } from "./adminQueries";
import { Badge, FormError } from "./adminUi";
import { MARK_TYPES } from "./marks";

const STATE_TEXT: Record<MarkStatus | "NONE", string> = {
  NONE: "Brak",
  SUGGESTED: "Propozycja automatu",
  CONFIRMED: "Zatwierdzone",
  REJECTED: "Odrzucone",
};

interface QuestionMarksDialogProps {
  /** Pytanie z aktualnej listy: po każdej decyzji lista się odświeża, więc okno pokazuje świeży stan. */
  question: AdminQuestion;
  onClose: () => void;
}

/**
 * Oznaczenia jednego pytania: nadanie ręczne (np. „Pułapka: nieaktualny stan prawny”, której automat nie rozpoznaje),
 * zatwierdzenie propozycji, cofnięcie. W testach „Pytania z terminów” i „Pułapki” liczą się tylko oznaczenia zatwierdzone.
 */
export function QuestionMarksDialog({ question, onClose }: QuestionMarksDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const decide = useAdminMutation((v: { mark: MarkType; status: "CONFIRMED" | "REJECTED" }) => decideMark(question.id, v.mark, v.status));

  return (
    <Dialog title={`Oznaczenia pytania nr ${question.id}`} onClose={onClose}>
      <p className="line-clamp-3 text-sm text-fg-muted">{question.body}</p>
      <ul className="flex flex-col gap-3" data-testid="question-marks-list">
        {MARK_TYPES.map(({ type, label, hint }) => {
          const current = question.marks.find((m) => m.mark === type)?.status ?? "NONE";
          return (
            <li key={type} className="flex flex-col gap-2 rounded-xl border border-line p-3" data-testid={`marks-row-${type}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{label}</span>
                <Badge data-testid={`marks-state-${type}`}>
                  {STATE_TEXT[current]}
                </Badge>
              </div>
              <p className="text-xs text-fg-muted">{hint}</p>
              <div className="flex flex-wrap gap-2">
                {current !== "CONFIRMED" && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={decide.isPending}
                    onClick={() => {
                      setError(null);
                      decide.mutate({ mark: type, status: "CONFIRMED" }, { onError: (e) => setError(serverMessage(e, "Nie udało się zapisać oznaczenia.")) });
                    }}
                    data-testid={`marks-confirm-${type}`}
                  >
                    {current === "SUGGESTED" ? "Zatwierdź" : "Nadaj"}
                  </Button>
                )}
                {(current === "CONFIRMED" || current === "SUGGESTED") && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={decide.isPending}
                    onClick={() => {
                      setError(null);
                      decide.mutate({ mark: type, status: "REJECTED" }, { onError: (e) => setError(serverMessage(e, "Nie udało się zapisać oznaczenia.")) });
                    }}
                    data-testid={`marks-reject-${type}`}
                  >
                    {current === "CONFIRMED" ? "Cofnij" : "Odrzuć"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <FormError message={error} />
      <div className="flex justify-end">
        <Button type="button" onClick={onClose} data-testid="marks-close">
          Gotowe
        </Button>
      </div>
    </Dialog>
  );
}
