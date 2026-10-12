import { CheckCircle2 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { useWeakCards } from "./hooks";
import { formatRelativeTimePl } from "../../lib/date";

interface WeakCardsTableProps {
  subjectId?: number;
}

export function WeakCardsTable({ subjectId }: WeakCardsTableProps) {
  const { data, isLoading, isError, refetch } = useWeakCards(subjectId, 10);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (isError || !data) {
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
      <h2 className="mb-4 text-sm font-semibold text-fg-muted">Do poprawy</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-fg-muted">
              <th scope="col" className="py-2 pr-4 font-medium">Fiszka</th>
              <th scope="col" className="py-2 pr-4 font-medium">Błędy</th>
              <th scope="col" className="py-2 pr-4 font-medium">Pewność</th>
              <th scope="col" className="py-2 font-medium">Ostatnia powtórka</th>
            </tr>
          </thead>
          <tbody>
            {data.map((card) => (
              <tr key={card.cardId} className="border-b border-line last:border-0">
                <td className="max-w-xs py-3 pr-4">
                  <span className="line-clamp-2">{card.front}</span>
                </td>
                <td className="tabular-nums py-3 pr-4 text-fg-muted">{card.lapses}</td>
                <td className="tabular-nums py-3 pr-4 text-fg-muted">{Math.round(card.currentRetrievability * 100)}%</td>
                <td className="py-3 text-fg-muted">{formatRelativeTimePl(card.lastReviewAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}