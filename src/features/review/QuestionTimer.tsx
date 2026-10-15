import { Timer } from "lucide-react";
import { cn } from "../../lib/cn";
import { formatQuestionTime } from "./formatQuestionTime";

interface QuestionTimerProps {
  /** Pełne sekundy od pokazania pytania (liczone tylko przy widocznej karcie przeglądarki). */
  seconds: number;
  /** true: licznik jest schowany, zostaje sama ikona do ponownego pokazania. */
  hidden: boolean;
  onToggle: () => void;
}

// Wysokość jak przyciski strzałek obok (44 px na telefonie, 32 px od sm), żeby rząd się nie zmieniał.
const BASE =
  "inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs tabular-nums text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg sm:h-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink";

/**
 * Mały licznik czasu przy pytaniu. Kliknięcie go chowa, kliknięcie ikony pokazuje z powrotem (zapamiętane na koncie).
 * Czas w przycisku jest ukryty przed czytnikiem ekranu, żeby nie odczytywał kolejnych sekund.
 */
export function QuestionTimer({ seconds, hidden, onToggle }: QuestionTimerProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={hidden ? "Pokaż licznik czasu" : "Ukryj licznik czasu"}
      title={hidden ? "Pokaż licznik czasu" : "Czas na to pytanie. Kliknij, żeby ukryć"}
      data-testid="question-timer"
      className={cn(BASE, hidden && "opacity-60")}
    >
      <Timer size={14} aria-hidden="true" />
      {!hidden && <span aria-hidden="true">{formatQuestionTime(seconds)}</span>}
    </button>
  );
}
