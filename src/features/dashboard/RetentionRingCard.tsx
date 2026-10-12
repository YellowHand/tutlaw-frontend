import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { useOverview } from "../statistics/hooks";
import { normalizeRetentionRate } from "../statistics/selectors";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RetentionRingCard() {
  const { data, isLoading, isError, refetch } = useOverview();
  const [animated, setAnimated] = useState(0);

  const target = data ? normalizeRetentionRate(data.retentionRate) / 100 : 0;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimated(target));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  if (isLoading) return <Skeleton className="h-60 w-full" />;

  if (isError || !data) {
    return (
      <Card className="flex h-60 items-center justify-center">
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  const percentage = Math.round(target * 100);
  const dashOffset = CIRCUMFERENCE * (1 - animated);

  return (
    <Card className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Skuteczność</p>
      <div className="relative" role="img" aria-label={`Skuteczność powtórek: ${percentage}%`}>
        <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
          <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="var(--color-surface-2)" strokeWidth="10" />
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="tabular-nums text-2xl font-bold">{percentage}%</span>
        </div>
      </div>
      <p className="text-xs text-fg-muted">fiszek zapamiętanych (30 dni)</p>
    </Card>
  );
}