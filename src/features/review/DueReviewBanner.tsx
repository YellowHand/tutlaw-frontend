import { Link } from "react-router-dom";
import { CheckCircle2, Layers, Play } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { pluralizePl } from "../../lib/plural";
import { cn } from "../../lib/cn";
import { ROUTES } from "../../config/routes";
import { useDueCount } from "./hooks";

interface DueReviewBannerProps {
  className?: string;
}

/**
 * Główne wejście do codziennej nauki: jedna sesja z fiszkami z całej puli
 * (zaległe powtórki + dzienna porcja nowych). Używane na pulpicie i na górze ekranu Fiszki.
 */
export function DueReviewBanner({ className }: DueReviewBannerProps) {
  const { data: dueCount, isLoading, isError, refetch } = useDueCount();

  if (isLoading) return <Skeleton className={cn("h-24 w-full", className)} />;

  if (isError || dueCount === undefined) {
    return (
      <Card className={className}>
        <ErrorState message="Nie udało się pobrać liczby powtórek." onRetry={() => refetch()} />
      </Card>
    );
  }

  const hasDue = dueCount > 0;

  return (
    <Card className={cn("flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-ink">
          {hasDue ? <Layers size={20} aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
        </span>
        <div>
          <h2 className="text-sm font-medium text-fg-muted">Powtórki na dziś</h2>
          {hasDue ? (
            <p className="text-2xl font-bold tabular-nums">
              {dueCount} {pluralizePl(dueCount, { one: "fiszka", few: "fiszki", many: "fiszek" })}
            </p>
          ) : (
            <p className="text-lg font-semibold">Nic nie zalega</p>
          )}
          <p className="text-xs text-fg-muted">W sesji dostaniesz też dzienną porcję nowych fiszek.</p>
        </div>
      </div>

      <Link
        to={ROUTES.studyAll}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-medium text-accent-fg hover:opacity-90"
      >
        <Play size={16} aria-hidden="true" />
        {hasDue ? "Zacznij powtórki" : "Ucz się nowych fiszek"}
      </Link>
    </Card>
  );
}
