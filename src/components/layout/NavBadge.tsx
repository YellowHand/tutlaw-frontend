import { cn } from "../../lib/cn";
import { useDueCount } from "../../features/review/hooks";
import { pluralizePl } from "../../lib/plural";

interface NavBadgeProps {
  /** Pozycja menu jest aktywna – odznaka dostosowuje kolory do tła zaznaczenia. */
  active?: boolean;
  className?: string;
}

/** Licznik fiszek do powtórki. Nic nie renderuje, gdy nie ma czego powtarzać. */
export function NavBadge({ active = false, className }: NavBadgeProps) {
  const { data: dueCount } = useDueCount();

  if (!dueCount) return null;

  const label = `${dueCount} ${pluralizePl(dueCount, { one: "powtórka", few: "powtórki", many: "powtórek" })} do zrobienia`;

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
