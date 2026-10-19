import { Link } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { formatDatePl } from "../../lib/date";
import { EXAM_PASS_POINTS, EXAM_QUESTION_COUNT } from "../exam/format";
import { useExamHistory } from "../exam/hooks";
import { QUIET_BUTTON } from "../tests/StartButtons";
import { InlineError } from "./InlineError";
import { recentFixedFormatAttempts } from "./selectors";

/** Dzień z daty i godziny zwróconej przez serwer: „12 października 2026". */
function attemptDay(finishedAt: string): string {
  return formatDatePl(finishedAt.slice(0, 10));
}

/**
 * Egzamin próbny na pulpicie: ostatni wynik i kilka ostatnich podejść na tle progu 100 punktów. Same fakty, bez prognoz.
 * Liczą się tylko podejścia w stałym formacie; starsze (z własnym zakresem i progiem) są w historii na ekranie egzaminu.
 */
export function ExamCard({ className }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useExamHistory();
  const frame = cn("flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5", className);

  if (isLoading) return <Skeleton className={cn("h-48 w-full", className)} />;

  // Odpowiedź, która nie jest listą, traktujemy jak błąd: jedna zepsuta karta nie może przewrócić całego Pulpitu.
  if (isError || !Array.isArray(data)) {
    return (
      <section aria-labelledby="exam-card-title" className={frame}>
        <h2 id="exam-card-title" className="text-sm font-medium text-fg-muted">
          Egzamin próbny
        </h2>
        <InlineError message="Nie udało się pobrać wyników egzaminów." onRetry={() => void refetch()} />
      </section>
    );
  }

  const attempts = recentFixedFormatAttempts(data);
  const last = attempts[attempts.length - 1];

  if (!last) {
    return (
      <section aria-labelledby="exam-card-title" className={frame}>
        <h2 id="exam-card-title" className="text-sm font-medium text-fg-muted">
          Egzamin próbny
        </h2>
        <p className="text-sm text-fg-muted">
          {EXAM_QUESTION_COUNT} pytań z Twojej puli, zaliczenie od {EXAM_PASS_POINTS} punktów. Zrób go, żeby sprawdzić, na
          jakim jesteś poziomie.
        </p>
        <Link to={ROUTES.exam} className={cn(QUIET_BUTTON, "w-fit")}>
          Zrób egzamin próbny
        </Link>
      </section>
    );
  }

  const thresholdRatio = EXAM_PASS_POINTS / EXAM_QUESTION_COUNT;
  const chartLabel = `Ostatnie podejścia, poprawne odpowiedzi: ${attempts
    .map((a) => `${a.correctCount} z ${a.questionCount}`)
    .join(", ")}. Próg zaliczenia: ${EXAM_PASS_POINTS} punktów z ${EXAM_QUESTION_COUNT}.`;

  return (
    <section aria-labelledby="exam-card-title" className={frame}>
      <h2 id="exam-card-title" className="text-sm font-medium text-fg-muted">
        Egzamin próbny
      </h2>

      <div>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-3xl font-bold">
            {last.correctCount} <span className="text-xl font-semibold text-fg-muted">/ {last.questionCount}</span>
          </span>
          <span
            className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", last.passed ? "text-success" : "text-danger")}
          >
            {last.passed ? <CheckCircle2 size={16} aria-hidden="true" /> : <XCircle size={16} aria-hidden="true" />}
            {last.passed ? "Zaliczony" : "Niezaliczony"}
          </span>
        </p>
        <p className="mt-1 text-sm text-fg-muted">
          Ostatnie podejście: {attemptDay(last.finishedAt)}. Próg: {last.passPoints} pkt.
        </p>
      </div>

      {attempts.length > 1 && (
        <div role="img" aria-label={chartLabel} className="relative h-20">
          <div className="flex h-full items-end gap-2">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className={cn("min-w-0 flex-1 rounded-t", attempt.passed ? "bg-success/70" : "bg-danger/60")}
                style={{ height: `${Math.max(4, Math.min(100, (attempt.correctCount / attempt.questionCount) * 100))}%` }}
              />
            ))}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-fg-muted"
            style={{ bottom: `${thresholdRatio * 100}%` }}
          />
        </div>
      )}
      {attempts.length > 1 && (
        <p className="-mt-2 text-xs text-fg-muted">Linia przerywana to próg zaliczenia ({EXAM_PASS_POINTS} z {EXAM_QUESTION_COUNT} pkt).</p>
      )}

      <Link to={ROUTES.exam} className={cn(QUIET_BUTTON, "w-fit")}>
        Nowy egzamin
      </Link>
    </section>
  );
}
