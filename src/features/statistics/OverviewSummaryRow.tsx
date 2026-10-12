import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { useOverview } from "./hooks";
import { normalizeRetentionRate } from "./selectors";

interface OverviewSummaryRowProps {
  subjectId?: number;
}

export function OverviewSummaryRow({ subjectId }: OverviewSummaryRowProps) {
  const { data, isLoading, isError, refetch } = useOverview(subjectId);

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  if (isError || !data) {
    return (
      <Card>
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  const retention = normalizeRetentionRate(data.retentionRate);
  const stats = [
    { label: "Wszystkie fiszki", value: data.totalCards },
    { label: "Rozpoczęte", value: data.cardsStarted },
    { label: "Opanowane", value: data.matureCards },
    { label: "Skuteczność", value: retention === null ? "—" : `${Math.round(retention)}%` },
  ];

  return (
    <Card className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label}>
          <p className="tabular-nums text-2xl font-bold">{stat.value}</p>
          <p className="text-xs text-fg-muted">{stat.label}</p>
        </div>
      ))}
    </Card>
  );
}