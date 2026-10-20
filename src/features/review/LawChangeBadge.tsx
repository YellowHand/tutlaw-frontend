import { Scale } from "lucide-react";
import { cn } from "../../lib/cn";
import { lawChangeLabel, lawChangeNote, type LawChange } from "../../lib/lawChange";

interface LawChangeBadgeProps {
  /** Zmiana w prawie zapisana przy pytaniu; bez niej (null / brak) nic nie renderuje. */
  change: LawChange | null | undefined;
  /** Pokaż też krótki opis od administratora (np. „nowelizacja art. 415 k.c.”) pod plakietką. */
  showNote?: boolean;
  className?: string;
}

/**
 * Plakietka „Zmiana w prawie: 1 października 2026” przy pytaniu, którego treść dotyczy zmiany przepisów z ostatniego roku.
 * Opis zmiany (jeśli jest) pokazujemy tylko tam, gdzie jest miejsce na wyjaśnienie, czyli po odpowiedzi.
 */
export function LawChangeBadge({ change, showNote = false, className }: LawChangeBadgeProps) {
  if (!change) return null;
  const note = showNote ? lawChangeNote(change) : null;
  return (
    <div data-testid="law-change" className={cn("flex flex-col items-start gap-1", className)}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/50 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
        <Scale size={12} className="shrink-0" aria-hidden="true" />
        {lawChangeLabel(change)}
      </span>
      {note && (
        <p data-testid="law-change-note" className="text-sm leading-snug text-fg-muted">
          {note}
        </p>
      )}
    </div>
  );
}
