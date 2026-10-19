import { BookOpen } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { useActMastery } from "./hooks";
import type { ActMastery } from "./types";

function masteryColor(percentage: number): string {
  if (percentage < 50) return "bg-danger";
  if (percentage < 80) return "bg-warning";
  return "bg-success";
}

/** Akty z puli pogrupowane w dziedziny; w dziedzinie najsłabsze akty na górze, dziedziny wg kolejności z serwera. */
function groupByField(acts: ActMastery[]): { fieldId: number; fieldName: string; acts: ActMastery[] }[] {
  const groups = new Map<number, { fieldId: number; fieldName: string; acts: ActMastery[] }>();
  for (const act of acts) {
    const group = groups.get(act.fieldId) ?? { fieldId: act.fieldId, fieldName: act.fieldName, acts: [] };
    group.acts.push(act);
    groups.set(act.fieldId, group);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    acts: [...group.acts].sort((a, b) => a.masteryPercentage - b.masteryPercentage),
  }));
}

/**
 * „Opanowanie aktów prawnych": dla każdego aktu z puli, ile jego pytań jest opanowanych. Fiszki i testy liczą się
 * razem (to te same pytania), więc to jeden wskaźnik, a nie dwa.
 */
export function ActMasteryList() {
  const { data, isLoading, isError, refetch } = useActMastery();

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  if (isError || !Array.isArray(data)) {
    return (
      <Card>
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  const acts = data.filter((act) => act.totalQuestions > 0);
  if (acts.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={BookOpen}
          title="Brak aktów prawnych do pokazania"
          description="Gdy w Twojej puli pojawią się pytania, zobaczysz tu opanowanie aktów."
        />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6" data-testid="act-mastery">
      <div>
        <h2 className="text-lg font-semibold">Opanowanie aktów prawnych</h2>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">
          Najsłabiej opanowane akty każdej dziedziny są na górze. Procent to pytania, które masz już mocno w głowie.
        </p>
      </div>
      {groupByField(acts).map((group) => (
        <section key={group.fieldId} aria-label={group.fieldName} className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-fg-muted">{group.fieldName}</h3>
          {group.acts.map((act) => (
            <div key={act.actId}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="truncate pr-2" title={act.name}>
                  {act.name}
                </span>
                <span className="tabular-nums shrink-0 text-fg-muted">
                  {Math.round(act.masteryPercentage)}% ({act.matureQuestions}/{act.totalQuestions})
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className={masteryColor(act.masteryPercentage)}
                  style={{ width: `${Math.min(100, Math.max(0, act.masteryPercentage))}%`, height: "100%" }}
                />
              </div>
            </div>
          ))}
        </section>
      ))}
    </Card>
  );
}
