import { useActivity } from "../statistics/hooks";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { buildHeatmap, getStreak, getThisWeekTotal } from "../statistics/selectors";
import { parseLocalDate } from "../../lib/date";
import { pluralizePl } from "../../lib/plural";
import { cn } from "../../lib/cn";

const LEVEL_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-surface-2",
  1: "bg-accent/25",
  2: "bg-accent/50",
  3: "bg-accent/75",
  4: "bg-accent",
};

const WEEKDAY_HEADERS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });

export function ActivityRhythm() {
  const { data, isLoading, isError, refetch } = useActivity(28);

  if (isLoading) return <Skeleton className="h-56 w-full" />;

  if (isError || !data) {
    return (
      <Card>
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  const weeks = buildHeatmap(data);
  const streak = getStreak(data);
  const thisWeekTotal = getThisWeekTotal(data);

  const summary = `Mapa aktywności z ostatnich 4 tygodni, ${thisWeekTotal} ${pluralizePl(thisWeekTotal, {
    one: "powtórka",
    few: "powtórki",
    many: "powtórek",
  })} w tym tygodniu.`;

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-fg-muted">Twój rytm nauki</h2>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div role="img" aria-label={summary} className="flex-1">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-fg-muted">
            {WEEKDAY_HEADERS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="mt-1 flex flex-col gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((cell) => {
                  const label = `${DAY_LABEL_FORMATTER.format(parseLocalDate(cell.date))}: ${cell.count} powtórek`;
                  return (
                    <div
                      key={cell.date}
                      title={label}
                      aria-label={label}
                      className={cn("aspect-square rounded-sm", cell.isFuture ? "bg-surface-2 opacity-40" : LEVEL_CLASSES[cell.level])}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-row gap-6 sm:flex-col">
          <div>
            <p className="tabular-nums text-2xl font-bold">{streak}</p>
            <p className="text-xs text-fg-muted">
              {streak === 0 ? "Zacznij serię dziś" : `${pluralizePl(streak, { one: "dzień", few: "dni", many: "dni" })} z rzędu`}
            </p>
          </div>
          <div>
            <p className="tabular-nums text-2xl font-bold">{thisWeekTotal}</p>
            <p className="text-xs text-fg-muted">
              {pluralizePl(thisWeekTotal, { one: "powtórka", few: "powtórki", many: "powtórek" })} w tym tygodniu
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}