import { Tag } from "lucide-react";
import { cn } from "../../lib/cn";
import { sourceLabel } from "../../lib/source";

interface SourceLabelProps {
  /** Akt prawny pytania (np. „Kodeks cywilny"); pomijany, gdy go nie ma. */
  actName?: string | null;
  sourceName: string | null | undefined;
  examYear: number | null | undefined;
  className?: string;
}

/**
 * „Kodeks cywilny · Notarialna 2021" albo „Kodeks cywilny · Pytania autorskie": z jakiego aktu i z jakiego źródła
 * pochodzi pytanie. Bez żadnej z wartości nic nie renderuje.
 */
export function SourceLabel({ actName, sourceName, examYear, className }: SourceLabelProps) {
  const source = sourceLabel(sourceName, examYear);
  const parts = [actName?.trim() || null, source].filter((part): part is string => part !== null);
  if (parts.length === 0) return null;
  return (
    <p data-testid="source-label" className={cn("flex items-center gap-1.5 text-xs text-fg-muted", className)}>
      <Tag size={12} className="shrink-0" aria-hidden="true" />
      <span>{parts.join(" · ")}</span>
    </p>
  );
}
