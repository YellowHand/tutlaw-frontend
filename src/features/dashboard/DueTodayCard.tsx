import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { useOverview } from "../statistics/hooks";
import { getDueToday, getNextDaysForecast } from "../statistics/selectors";
import { pluralizePl } from "../../lib/plural";
import { ROUTES } from "../../config/routes";

export function DueTodayCard() {
  const { data, isLoading, isError, refetch } = useOverview();

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (isError || !data) {
    return (
      <Card>
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  const dueToday = getDueToday(data.upcomingReviews);
  const forecast = getNextDaysForecast(data.upcomingReviews);
  const maxForecast = Math.max(1, ...forecast.map((f) => f.count));

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-fg-muted">Na dziś</h2>

      {dueToday === 0 ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <CheckCircle2 className="text-success" size={32} aria-hidden="true" />
          <p className="font-semibold">Na dziś wszystko powtórzone</p>
          <Link to={ROUTES.flashcards} className="text-sm text-accent underline">
            Przejdź do fiszek
          </Link>
        </div>
      ) : (
        <>
          <p className="tabular-nums text-3xl font-bold">
            {dueToday} {pluralizePl(dueToday, { one: "fiszka", few: "fiszki", many: "fiszek" })} do powtórki
          </p>
          <Link
            to={ROUTES.studyAll}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 min-h-11 text-sm font-medium text-accent-fg hover:opacity-90"
          >
            Zacznij powtórkę
          </Link>
        </>
      )}

      <div className="mt-6">
        <p className="mb-2 text-xs text-fg-muted">Kolejne dni</p>
        <div className="flex items-end gap-2" style={{ height: 64 }}>
          {forecast.map((bar) => (
            <div key={bar.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                role="img"
                aria-label={`${bar.dayLabel}: ${bar.count} ${pluralizePl(bar.count, {
                  one: "powtórka",
                  few: "powtórki",
                  many: "powtórek",
                })}`}
                title={`${bar.date}: ${bar.count}`}
                className="w-full rounded-t bg-accent-2"
                style={{ height: `${Math.max(4, (bar.count / maxForecast) * 48)}px` }}
              />
              <span className="text-[10px] text-fg-muted">{bar.dayLabel}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}