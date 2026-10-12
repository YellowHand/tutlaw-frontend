import { Link } from "react-router-dom";
import { Library } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { useOverview } from "../statistics/hooks";
import { normalizeRetentionRate } from "../statistics/selectors";
import { ROUTES } from "../../config/routes";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressCard() {
  const { data, isLoading, isError, refetch } = useOverview();
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const targetProgress = data && data.totalCards > 0 ? data.cardsStarted / data.totalCards : 0;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatedProgress(targetProgress));
    return () => cancelAnimationFrame(frame);
  }, [targetProgress]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (isError || !data) {
    return (
      <Card>
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  if (data.totalCards === 0) {
    return (
      <Card>
        <EmptyState
          icon={Library}
          title="Brak fiszek do nauki"
          description="Dodaj fiszki, żeby zobaczyć tu postęp."
          action={
            <Link to={ROUTES.flashcards} className="text-sm text-accent underline">
              Przejdź do Fiszek
            </Link>
          }
        />
      </Card>
    );
  }

  const percentage = Math.round(targetProgress * 100);
  const dashOffset = CIRCUMFERENCE * (1 - animatedProgress);
  const learning = Math.max(0, data.cardsStarted - data.matureCards);
  const notStarted = data.totalCards - data.cardsStarted;
  const retention = normalizeRetentionRate(data.retentionRate);

  const segments = [
    { label: "Opanowane", value: data.matureCards, className: "bg-success" },
    { label: "W nauce", value: learning, className: "bg-accent-2" },
    { label: "Nowe", value: notStarted, className: "bg-surface-2" },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg-muted">Postęp w fiszkach</h2>
        <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium tabular-nums">
          Skuteczność: {Math.round(retention)}%
        </span>
      </div>

      <div className="mt-4 flex items-center gap-6">
        <div className="relative shrink-0" role="img" aria-label={`Postęp: ${percentage}%`}>
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--color-surface-2)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
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
            <span className="tabular-nums text-xl font-bold">{percentage}%</span>
          </div>
        </div>
        <p className="text-sm text-fg-muted">
          {data.cardsStarted} z {data.totalCards} fiszek rozwiązanych
        </p>
      </div>

      <div className="mt-6">
        <div className="flex h-2 overflow-hidden rounded-full">
          {segments.map((segment) => (
            <div key={segment.label} className={segment.className} style={{ width: `${(segment.value / data.totalCards) * 100}%` }} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
          {segments.map((segment) => (
            <span key={segment.label} className="tabular-nums">
              {segment.label}: {segment.value}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}