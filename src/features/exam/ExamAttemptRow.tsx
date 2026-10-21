import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, XCircle } from "lucide-react";
import type { ExamAttempt } from "../../api/exam";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { formatDateTime, formatDuration, formatPercent } from "./format";

const ROW_FRAME = "flex min-h-11 items-center gap-3 rounded-2xl border border-line bg-surface p-4";

/**
 * Jedno podejście do egzaminu próbnego na liście „Moje testy" → Egzaminy: werdykt, wynik, zakres, czas. Podejście z
 * zapisanymi odpowiedziami otwiera swój raport; starsze (sprzed zapisywania odpowiedzi) pokazują tylko wynik.
 */
export function ExamAttemptRow({ attempt }: { attempt: ExamAttempt }) {
  const unanswered = attempt.questionCount - attempt.answeredCount;
  const body = (
    <div className="min-w-0 flex-1">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
        <span className={cn("inline-flex items-center gap-1", attempt.passed ? "text-success" : "text-danger")}>
          {attempt.passed ? <CheckCircle2 size={16} aria-hidden="true" /> : <XCircle size={16} aria-hidden="true" />}
          {attempt.passed ? "Zaliczony" : "Niezaliczony"}
        </span>
        <span className="tabular-nums text-fg">
          {attempt.correctCount} / {attempt.questionCount} ({formatPercent(attempt.scorePercent)})
        </span>
      </p>
      <p className="mt-1 truncate text-sm">{attempt.scopeLabel}</p>
      <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-fg-muted">
        <span>{formatDateTime(attempt.finishedAt)}</span>
        <span>próg {attempt.passPoints !== null ? `${attempt.passPoints} pkt` : `${attempt.passThresholdPercent}%`}</span>
        <span>
          {formatDuration(attempt.durationSeconds)}
          {attempt.timeLimitMinutes !== null ? ` z ${attempt.timeLimitMinutes} min` : ", bez limitu czasu"}
        </span>
        {attempt.timedOut && <span>czas minął</span>}
        {unanswered > 0 && <span>bez odpowiedzi: {unanswered}</span>}
        {!attempt.detailsAvailable && <span>tylko wynik, bez odpowiedzi</span>}
      </p>
    </div>
  );

  if (!attempt.detailsAvailable) {
    return (
      <div className={ROW_FRAME} data-testid="exam-attempt-row" data-details="false">
        {body}
      </div>
    );
  }

  return (
    <Link
      to={ROUTES.myExam(attempt.id)}
      data-testid="exam-attempt-row"
      data-details="true"
      className={cn(
        ROW_FRAME,
        "group transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
      )}
    >
      {body}
      <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-fg-muted group-hover:text-fg" />
    </Link>
  );
}
