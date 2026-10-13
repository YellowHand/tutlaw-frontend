import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { useOverview } from "../statistics/hooks";
import { pluralizePl } from "../../lib/plural";

export function ProgressSummaryCard() {
  const { data, isLoading, isError, refetch } = useOverview(undefined, "FLASHCARD");

  if (isLoading) return <Skeleton className="h-20 w-full" />;

  if (isError || !data) {
    return (
      <Card className="flex items-center justify-center p-4">
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  const percentage = data.totalCards === 0 ? 0 : Math.round((data.cardsStarted / data.totalCards) * 100);

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-center text-sm text-fg-muted">
        Rozwiązano <span className="font-semibold text-fg tabular-nums">{data.cardsStarted}</span> z{" "}
        <span className="font-semibold text-fg tabular-nums">{data.totalCards}</span>{" "}
        {pluralizePl(data.totalCards, { one: "dostępnej fiszki", few: "dostępnych fiszek", many: "dostępnych fiszek" })}
      </p>
    </Card>
  );
}