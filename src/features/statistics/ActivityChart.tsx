import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { cn } from "../../lib/cn";
import { parseLocalDate } from "../../lib/date";
import { pluralizePl } from "../../lib/plural";
import { useActivity } from "./hooks";
import { getStreak, lastDays, sumDaysAgo } from "./selectors";

const DAY_LABEL = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });
const SHORT_LABEL = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" });

const answersWord = (n: number) => pluralizePl(n, { one: "odpowiedź", few: "odpowiedzi", many: "odpowiedzi" });

/**
 * „Aktywność": ile odpowiedzi dawałeś każdego z ostatnich 28 dni (fiszki i testy razem). Słupki mają różną wysokość
 * proporcjonalnie do liczby odpowiedzi, więc od razu widać, które dni były mocne, a które puste. Nad wykresem trzy
 * liczby: seria, ostatnie 7 dni i 7 dni wcześniej (żeby było z czym porównać).
 */
export function ActivityChart() {
  const { data, isLoading, isError, refetch } = useActivity(28);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError || !Array.isArray(data)) {
    return (
      <Card>
        <ErrorState message="Nie udało się pobrać aktywności." onRetry={() => refetch()} />
      </Card>
    );
  }

  const days = lastDays(data, 28);
  const max = Math.max(1, ...days.map((d) => d.count));
  const streak = getStreak(data);
  const last7 = sumDaysAgo(days, 0, 6);
  const before7 = sumDaysAgo(days, 7, 13);
  const total = days.reduce((sum, d) => sum + d.count, 0);

  const summary = `Odpowiedzi z ostatnich 28 dni: razem ${total}, ostatnie 7 dni ${last7}, 7 dni wcześniej ${before7}, seria ${streak} ${pluralizePl(streak, { one: "dzień", few: "dni", many: "dni" })}.`;

  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6" data-testid="activity">
      <div>
        <h2 className="text-lg font-semibold">Aktywność</h2>
        <p className="mt-1 text-sm text-fg-muted">Odpowiedzi w fiszkach i testach, dzień po dniu.</p>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <div>
          <dt className="text-sm text-fg-muted">Seria</dt>
          <dd className="text-2xl font-bold tabular-nums" data-testid="activity-streak">
            {streak}
          </dd>
          <dd className="text-xs text-fg-muted">
            {streak === 0 ? "Zacznij serię dziś" : `${pluralizePl(streak, { one: "dzień", few: "dni", many: "dni" })} z rzędu`}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-fg-muted">Ostatnie 7 dni</dt>
          <dd className="text-2xl font-bold tabular-nums" data-testid="activity-last7">
            {last7}
          </dd>
          <dd className="text-xs text-fg-muted">{answersWord(last7)}</dd>
        </div>
        <div>
          <dt className="text-sm text-fg-muted">7 dni wcześniej</dt>
          <dd className="text-2xl font-bold tabular-nums" data-testid="activity-before7">
            {before7}
          </dd>
          <dd className="text-xs text-fg-muted">{answersWord(before7)}</dd>
        </div>
      </dl>

      {total === 0 ? (
        <p className="text-sm text-fg-muted" data-testid="activity-empty">
          W ostatnich 28 dniach nie było odpowiedzi. Pierwsza sesja narysuje tu pierwszy słupek.
        </p>
      ) : (
        <div>
          <div role="img" aria-label={summary} className="flex h-32 items-end gap-[3px]" data-testid="activity-bars">
            {days.map((day) => (
              <div
                key={day.date}
                title={`${DAY_LABEL.format(parseLocalDate(day.date))}: ${day.count} ${answersWord(day.count)}`}
                className="flex h-full min-w-0 flex-1 items-end"
              >
                <div
                  className={cn(
                    "w-full rounded-t-sm",
                    day.count === 0 ? "bg-line" : day.isToday ? "bg-accent" : "bg-accent/60"
                  )}
                  style={{ height: day.count === 0 ? "2px" : `${Math.max(6, (day.count / max) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div aria-hidden="true" className="mt-1.5 flex justify-between text-xs text-fg-muted">
            <span>{SHORT_LABEL.format(parseLocalDate(days[0].date))}</span>
            <span>dziś</span>
          </div>
          <p className="mt-2 text-xs text-fg-muted">
            Najwyższy słupek to {max} {answersWord(max)}. Najechanie na słupek pokazuje dzień i liczbę odpowiedzi.
          </p>
        </div>
      )}
    </Card>
  );
}
