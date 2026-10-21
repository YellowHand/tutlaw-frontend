import { Check } from "lucide-react";
import { cn } from "../../lib/cn";

/** Pasek „Przepisy → Pytania i start": który krok trwa, a który już za nami. */
export function WizardSteps({ step, labels }: { step: 1 | 2; labels: readonly [string, string] }) {
  return (
    <ol aria-label="Kroki" className="flex items-center gap-3 px-5 pb-4 sm:px-6">
      {labels.map((label, index) => {
        const number = (index + 1) as 1 | 2;
        const done = number < step;
        const current = number === step;
        return (
          <li key={label} aria-current={current ? "step" : undefined} className="flex items-center gap-3">
            {index > 0 && <span aria-hidden="true" className={cn("h-0.5 w-8 sm:w-12", step > 1 ? "bg-accent" : "bg-line")} />}
            <span className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                  current && "bg-accent text-accent-fg",
                  done && "border-2 border-accent text-accent-ink",
                  !current && !done && "border-2 border-line text-fg-muted"
                )}
              >
                {done ? <Check size={14} aria-hidden="true" /> : number}
              </span>
              <span className={cn("text-sm", current ? "font-bold" : "font-medium text-fg-muted")}>
                {label}
                {done && <span className="sr-only"> (gotowe)</span>}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
