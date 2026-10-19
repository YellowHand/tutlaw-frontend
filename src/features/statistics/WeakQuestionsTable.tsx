import { CheckCircle2 } from "lucide-react";
import type { SessionMode } from "../../api/review";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { useWeakQuestions } from "./hooks";
import { formatRelativeTimePl } from "../../lib/date";

interface WeakQuestionsTableProps {
  actId?: number;
  mode: SessionMode;
}

/** „Do poprawy": pytania, które użytkownik najłatwiej zapomni, w jednym trybie (fiszki albo testy). */
export function WeakQuestionsTable({ actId, mode }: WeakQuestionsTableProps) {
  const { data, isLoading, isError, refetch } = useWeakQuestions(actId, mode, 10);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (isError || !Array.isArray(data)) {
    return (
      <Card>
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <EmptyState icon={CheckCircle2} title="Brak fiszek do poprawy" description="Świetna robota — nic obecnie nie wymaga dociągnięcia." />
      </Card>
    );
  }

  return (
    <Card>
      <h2 id="weak-cards-heading" className="mb-4 text-sm font-semibold text-fg-muted">Do poprawy</h2>
      {/* Na wąskim ekranie tabela przewija się w bok, więc region musi dać się przewinąć klawiaturą (tabIndex). */}
      <div
        role="region"
        aria-labelledby="weak-cards-heading"
        tabIndex={0}
        className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-fg-muted">
              <th scope="col" className="py-2 pr-4 font-medium">Pytanie</th>
              <th scope="col" className="py-2 pr-4 font-medium">Błędy</th>
              <th scope="col" className="py-2 pr-4 font-medium">Pewność</th>
              <th scope="col" className="py-2 font-medium">Ostatnia powtórka</th>
            </tr>
          </thead>
          <tbody>
            {data.map((question) => (
              <tr key={`${question.questionId}-${question.mode}`} className="border-b border-line last:border-0">
                <td className="max-w-xs py-3 pr-4">
                  <span className="line-clamp-2">{question.body}</span>
                </td>
                <td className="tabular-nums py-3 pr-4 text-fg-muted">{question.lapses}</td>
                <td className="tabular-nums py-3 pr-4 text-fg-muted">{Math.round(question.currentRetrievability * 100)}%</td>
                <td className="py-3 text-fg-muted">{formatRelativeTimePl(question.lastReviewAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
