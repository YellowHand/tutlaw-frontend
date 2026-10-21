import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { pluralizePl } from "../../lib/plural";
import { formatCount } from "../tests/format";

interface PaginationProps {
  /** Numer strony od 0. */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  onPage: (page: number) => void;
  /** Odmiana rzeczownika do podpisu: „Razem: 3 testy", ale „21–40 z 87 testów" (po „z" zawsze liczba mnoga). */
  nouns: { one: string; few: string; many: string };
  className?: string;
}

const BUTTON =
  "inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-xl border border-line px-4 text-sm font-medium transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent";

/**
 * Stronicowanie list („Moje testy": testy i egzaminy): przyciski Wstecz i Dalej oraz podpis, które pozycje widać i ile
 * ich jest łącznie. Przy jednej stronie pokazuje tylko podpis.
 */
export function Pagination({ page, size, totalElements, totalPages, onPage, nouns, className }: PaginationProps) {
  if (totalElements === 0) return null;
  const from = page * size + 1;
  const to = Math.min(totalElements, (page + 1) * size);

  return (
    <nav aria-label="Strony listy" className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <p className="text-sm text-fg-muted tabular-nums" data-testid="pagination-summary" aria-live="polite">
        {totalPages > 1 ? (
          <>
            {formatCount(from)}–{formatCount(to)} z {formatCount(totalElements)} {nouns.many}
            <span className="ml-2">
              (strona {page + 1} z {totalPages})
            </span>
          </>
        ) : (
          <>
            Razem: {formatCount(totalElements)} {pluralizePl(totalElements, nouns)}
          </>
        )}
      </p>
      {totalPages > 1 && (
        <div className="flex gap-2">
          <button type="button" className={BUTTON} disabled={page <= 0} onClick={() => onPage(page - 1)} data-testid="page-prev">
            <ChevronLeft size={16} aria-hidden="true" />
            Wstecz
          </button>
          <button
            type="button"
            className={BUTTON}
            disabled={page >= totalPages - 1}
            onClick={() => onPage(page + 1)}
            data-testid="page-next"
          >
            Dalej
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </nav>
  );
}
