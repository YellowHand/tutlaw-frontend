import { useRef, useState } from "react";
import { ChevronDown, Layers3 } from "lucide-react";
import { cn } from "../../lib/cn";
import { formatCount } from "../tests/format";
import { usePool } from "./hooks";
import { PoolDialog } from "./PoolDialog";
import { describePool, isPoolRestricted, questionsWord } from "./summary";

interface PoolChipProps {
  className?: string;
}

/**
 * Znacznik „Pula pytań" przy tytule strony: z czego użytkownik się teraz uczy (ścieżka, zawężenie do aktów, filtr
 * źródeł). Kliknięcie otwiera okno wyboru. Gdy pula jest czymś zawężona, znacznik ma złotą kropkę i liczbę pytań, bo
 * zawężenie po cichu zmienia liczby w Testach. Gdy puli nie uda się pobrać, znacznika nie ma, a nauka działa jak zwykle.
 */
export function PoolChip({ className }: PoolChipProps) {
  const { data } = usePool();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (!data) return null;

  const restricted = isPoolRestricted(data);
  const count = data.questionCount;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        data-testid="pool-chip"
        aria-haspopup="dialog"
        title={`${formatCount(count)} ${questionsWord(count)} w puli`}
        onClick={() => setOpen(true)}
        className={cn(
          "relative inline-flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-full border px-4 text-sm transition-colors hover:bg-surface-2",
          restricted ? "border-accent-ink/50 bg-accent/10" : "border-line bg-surface",
          className
        )}
      >
        <Layers3 size={16} aria-hidden="true" className={restricted ? "shrink-0 text-accent-ink" : "shrink-0 text-fg-muted"} />
        <span className="min-w-0 truncate">
          <span className="text-fg-muted">Pula pytań: </span>
          <span data-testid="pool-summary" className="font-medium">
            {describePool(data)}
          </span>
        </span>
        {restricted && <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-accent" />}
        <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-fg-muted" />
        <span className="sr-only">
          {restricted ? `, pula zawężona: ${formatCount(count)} ${questionsWord(count)}. Zmień` : ". Zmień"}
        </span>
      </button>
      {open && <PoolDialog pool={data} onClose={() => setOpen(false)} returnFocusTo={buttonRef} />}
    </>
  );
}
