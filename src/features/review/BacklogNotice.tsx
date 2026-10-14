import { pluralizePl } from "../../lib/plural";

const BACKLOG_FORMS = { one: "zaległa powtórka", few: "zaległe powtórki", many: "zaległych powtórek" };

interface BacklogNoticeProps {
  /** Ile zaległych powtórek nie zmieściło się dziś w sesji. */
  deferred: number;
  className?: string;
}

/** Krótka informacja na początku sesji: dlaczego nie widać wszystkich zaległości i że reszta poczeka. */
export function BacklogNotice({ deferred, className }: BacklogNoticeProps) {
  if (deferred <= 0) return null;
  return (
    <p data-testid="backlog-notice" className={className}>
      Na dziś najpilniejsze: zaczynasz od tego, co najłatwiej zapomnieć. Jeszcze{" "}
      <span className="font-semibold tabular-nums text-fg">{deferred}</span>{" "}
      {pluralizePl(deferred, BACKLOG_FORMS)} poczeka na kolejne dni.
    </p>
  );
}

interface BacklogFinishNoticeProps {
  deferred: number;
  /** Ile powtórek dołoży przycisk „Powtórz jeszcze". */
  batch: number;
  onMore: () => void;
  /** Etykieta jednostki w przycisku, np. „fiszek" albo „pytań". */
  unit: string;
}

/** Na końcu sesji: dzienny limit wykonany, reszta zaległości na kolejne dni, z możliwością zrobienia jeszcze porcji. */
export function BacklogFinishNotice({ deferred, batch, onMore, unit }: BacklogFinishNoticeProps) {
  if (deferred <= 0) return null;
  return (
    <div data-testid="backlog-finish" className="flex max-w-md flex-col items-center gap-3">
      <p className="text-sm text-fg-muted">
        Dzienny limit zaległych powtórek wykonany. Jeszcze{" "}
        <span className="font-semibold tabular-nums text-fg">{deferred}</span>{" "}
        {pluralizePl(deferred, BACKLOG_FORMS)} poczeka na kolejne dni (najpilniejsze pójdą pierwsze).
      </p>
      <button
        type="button"
        onClick={onMore}
        className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-accent-ink px-6 text-sm font-medium text-accent-ink hover:bg-accent/10"
      >
        Powtórz jeszcze {batch} {unit}
      </button>
    </div>
  );
}
