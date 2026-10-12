import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { useActivity } from "../statistics/hooks";
import { WeeklyBars } from "./WeeklyBars";

export function WeeklyBarsCard() {
  const { data, isLoading, isError, refetch } = useActivity(28);

  if (isLoading) return <Skeleton className="h-60 w-full" />;

  if (isError || !data) {
    return (
      <Card className="flex h-60 items-center justify-center">
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  return <WeeklyBars activity={data} unit="powtórek" />;
}
