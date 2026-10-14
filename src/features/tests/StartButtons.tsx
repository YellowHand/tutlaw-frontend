import { Link } from "react-router-dom";
import { Play } from "lucide-react";

/** Jedyny złoty przycisk na ekranie: główna akcja. Reszta używa QUIET_BUTTON. */
export const START_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-medium text-accent-fg hover:opacity-90";

/** Cichy przycisk: ramka i ciemne tło, bez złota. */
export const QUIET_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-4 text-sm font-medium text-fg transition-colors hover:bg-line";

/** Przycisk „Test z całego …" obok tytułu strony (poziom rodzaju i przedmiotu). */
export function StartAllButton({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className={`${START_BUTTON} whitespace-nowrap`}>
      <Play size={16} aria-hidden="true" />
      {label}
    </Link>
  );
}
