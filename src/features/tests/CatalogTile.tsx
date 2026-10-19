import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import type { TestCounts } from "../../api/tests";
import { Card } from "../../components/ui/Card";
import { cn } from "../../lib/cn";
import { formatCount, isEmpty, progressPercent } from "./format";

interface CatalogTileProps {
  to: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  counts: TestCounts;
  /** Napis na pustej pozycji. */
  emptyLabel?: string;
}

export function ProgressLine({ counts }: { counts: TestCounts }) {
  const percentage = progressPercent(counts);
  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <div className="h-full rounded-full bg-accent" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-1 flex flex-wrap items-center justify-between gap-x-3 text-xs tabular-nums text-fg-muted">
        <span>
          Rozwiązano: {formatCount(counts.solvedCount)} / {formatCount(counts.questionCount)}
        </span>
      </p>
    </div>
  );
}

function TileBody({
  icon: Icon,
  title,
  subtitle,
  counts,
  emptyLabel,
  interactive,
}: Omit<CatalogTileProps, "to"> & { interactive: boolean }) {
  const empty = isEmpty(counts);
  return (
    <Card
      className={cn(
        "flex h-full flex-col justify-between gap-4",
        // Pusty kafelek odróżniamy kreskowaną ramką i przygaszoną ikoną, a nie przezroczystością całej karty:
        // przezroczystość obniżała kontrast tekstu poniżej 4,5:1.
        interactive ? "transition-colors group-hover:bg-surface-2" : "border-dashed"
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent-ink",
            !interactive && "opacity-60"
          )}
        >
          <Icon size={20} aria-hidden="true" />
        </span>
        {interactive ? (
          <ChevronRight
            size={18}
            className="text-fg-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden="true"
          />
        ) : (
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-fg-muted">{emptyLabel ?? "Brak pytań"}</span>
        )}
      </div>
      <div>
        <h2 className={cn("font-semibold", !interactive && "text-fg-muted")}>{title}</h2>
        {subtitle && <p className="text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {!empty && <ProgressLine counts={counts} />}
    </Card>
  );
}

/**
 * Kafelek jednego poziomu katalogu Testów. Pusty (bez pytań w puli) jest wyszarzony
 * i nie prowadzi dalej: użytkownik widzi pełny układ, ale nie wchodzi w ślepą uliczkę.
 */
export function CatalogTile(props: CatalogTileProps) {
  const interactive = !isEmpty(props.counts);
  const body = <TileBody {...props} interactive={interactive} />;

  if (!interactive) {
    return <div>{body}</div>;
  }
  return (
    <Link to={props.to} className="group block rounded-2xl">
      {body}
    </Link>
  );
}

export function TileGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
