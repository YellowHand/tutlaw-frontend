import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { useOverview } from "../statistics/hooks";
import { normalizeRetentionRate } from "../statistics/selectors";
import { AccuracyRing } from "./AccuracyRing";

export function RetentionRingCard() {
  const { data, isLoading, isError, refetch } = useOverview(undefined, "FLASHCARD");

  if (isLoading) return <Skeleton className="h-60 w-full" />;

  if (isError || !data) {
    return (
      <Card className="flex h-60 items-center justify-center">
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  return (
    <AccuracyRing
      percentage={normalizeRetentionRate(data.retentionRate)}
      title="Skuteczność"
      caption="fiszek zapamiętanych (30 dni)"
      emptyCaption="pojawi się po pierwszych powtórkach"
      ariaLabel="Skuteczność powtórek"
    />
  );
}
