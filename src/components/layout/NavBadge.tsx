import { cn } from "../../lib/cn";
import type { SessionMode } from "../../api/review";
import { useDueCount } from "../../features/review/hooks";
import { pluralizePl } from "../../lib/plural";

const LABEL_FORMS: Record<SessionMode, { one: string; few: string; many: string }> = {
  FLASHCARD: { one: "powtórka", few: "powtórki", many: "powtórek" },
  TEST: { one: "pytanie do powtórki", few: "pytania do powtórki", many: "pytań do powtórki" },
};

interface NavBadgeProps {
  /** Czego dotyczy licznik: fiszek czy pytań testowych. */
  mode: SessionMode;
  /** Pozycja menu jest aktywna – odznaka dostosowuje kolory do tła zaznaczenia. */
  active?: boolean;
  className?: string;
}

/** Licznik fiszek albo pytań testowych do powtórki. Nic nie renderuje, gdy nie ma czego powtarzać. */
export function NavBadge({ mode, active = false, className }: NavBadgeProps) {
  const { data: dueCount } = useDueCount(mode);

  if (!dueCount) return null;

  const noun = pluralizePl(dueCount, LABEL_FORMS[mode]);
  const label = mode === "FLASHCARD" ? `${dueCount} ${noun} do zrobienia` : `${dueCount} ${noun}`;

  return (
    <span
      role="status"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
        active ? "bg-accent-fg/15 text-accent-fg" : "bg-accent/15 text-accent",
        className
      )}
    >
      {dueCount > 99 ? "99+" : dueCount}
    </span>
  );
}
