import { Tag } from "lucide-react";
import { cn } from "../../lib/cn";
import { originLabel } from "../../lib/origin";

interface OriginLabelProps {
  origin: string | null | undefined;
  examYear: number | null | undefined;
  className?: string;
}

/** „Aplikacja notarialna, 2021" albo „Pytanie autorskie": skąd pochodzi pytanie lub fiszka. Bez etykiety nic nie renderuje. */
export function OriginLabel({ origin, examYear, className }: OriginLabelProps) {
  const label = originLabel(origin, examYear);
  if (!label) return null;
  return (
    <p data-testid="origin-label" className={cn("flex items-center gap-1.5 text-xs text-fg-muted", className)}>
      <Tag size={12} className="shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </p>
  );
}
