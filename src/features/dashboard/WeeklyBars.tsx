import { Card } from "../../components/ui/Card";
import { buildHeatmap } from "../statistics/selectors";
import type { ActivityItem } from "../statistics/types";

const WEEKDAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

interface WeeklyBarsProps {
  /** Aktywność z co najmniej ostatnich 28 dni. */
  activity: ActivityItem[];
  /** Co oznacza jedna jednostka, np. „powtórek" albo „odpowiedzi" (do opisu dla czytników ekranu). */
  unit: string;
}

/** Słupki aktywności z bieżącego tygodnia (Pn–Nd). */
export function WeeklyBars({ activity, unit }: WeeklyBarsProps) {
  const weeks = buildHeatmap(activity);
  const thisWeek = weeks[weeks.length - 1];
  const maxCount = Math.max(1, ...thisWeek.map((d) => d.count));

  return (
    <Card className="flex flex-col p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Aktywność w tym tygodniu</p>

      <div className="mt-4 flex h-36 gap-2">
        {thisWeek.map((day, i) => (
          <div key={day.date} className="flex flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-xs font-semibold tabular-nums text-fg">{day.count > 0 ? day.count : ""}</span>
            <div
              role="img"
              aria-label={`${WEEKDAY_LABELS[i]}: ${day.count} ${unit}`}
              className="w-full rounded-t bg-accent"
              style={{ height: day.isFuture ? "2px" : `${Math.max(6, (day.count / maxCount) * 100)}%` }}
            />
            <span className="text-xs text-fg-muted">{WEEKDAY_LABELS[i]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
