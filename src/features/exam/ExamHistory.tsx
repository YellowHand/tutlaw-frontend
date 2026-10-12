import { CheckCircle2, XCircle } from "lucide-react";
import type { ExamAttempt } from "../../api/exam";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { cn } from "../../lib/cn";
import { formatDateTime, formatDuration, formatPercent } from "./format";
import { useExamHistory } from "./hooks";

/** Historia podejść do egzaminu próbnego: wynik, zakres, czas. Najnowsze na górze. */
export function ExamHistory() {
  const { data, isLoading, isError, refetch } = useExamHistory();

  return (
    <section aria-labelledby="exam-history" className="flex flex-col gap-3">
      <h2 id="exam-history" className="text-sm font-medium text-fg-muted">
        Ostatnie podejścia
      </h2>

      {isLoading ? (
        <Skeleton className="h-28 w-full" />
      ) : isError || !data ? (
        <Card>
          <ErrorState message="Nie udało się pobrać historii egzaminów." onRetry={() => refetch()} />
        </Card>
      ) : data.length === 0 ? (
        <Card className="text-sm text-fg-muted">Nie masz jeszcze żadnego podejścia. Wynik pierwszego egzaminu pojawi się tutaj.</Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((attempt) => (
            <li key={attempt.id}>
              <AttemptRow attempt={attempt} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AttemptRow({ attempt }: { attempt: ExamAttempt }) {
  const unanswered = attempt.questionCount - attempt.answeredCount;
  return (
    <Card className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
          <span className={cn("inline-flex items-center gap-1", attempt.passed ? "text-success" : "text-danger")}>
            {attempt.passed ? (
              <CheckCircle2 size={16} aria-hidden="true" />
            ) : (
              <XCircle size={16} aria-hidden="true" />
            )}
            {attempt.passed ? "Zaliczony" : "Niezaliczony"}
          </span>
          <span className="tabular-nums text-fg">
            {attempt.correctCount} / {attempt.questionCount} ({formatPercent(attempt.scorePercent)})
          </span>
        </p>
        <p className="truncate text-sm text-fg-muted">{attempt.scopeLabel}</p>
        <p className="text-xs text-fg-muted">
          {formatDateTime(attempt.finishedAt)}
          {" · "}próg {attempt.passThresholdPercent}%
          {" · "}
          {formatDuration(attempt.durationSeconds)}
          {attempt.timeLimitMinutes !== null ? ` z ${attempt.timeLimitMinutes} min` : ", bez limitu czasu"}
          {attempt.timedOut && " · czas minął"}
          {unanswered > 0 && ` · bez odpowiedzi: ${unanswered}`}
        </p>
      </div>
    </Card>
  );
}
