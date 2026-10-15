import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { formatDuration } from "../exam/format";
import { useLearningSummary } from "./hooks";

const NUMBER = new Intl.NumberFormat("pl-PL");

/** „45 s", „1 min 5 s" albo „—", gdy nie ma pomiarów. */
function averageText(seconds: number | null): string {
  return seconds === null ? "—" : formatDuration(Math.round(seconds));
}

/** Czas nauki: „0 min" zamiast „0 s", bo to sumy z całych sesji. */
function studyTimeText(seconds: number): string {
  return seconds < 60 ? (seconds === 0 ? "0 min" : "poniżej minuty") : formatDuration(seconds);
}

/**
 * „Podsumowanie nauki": ile odpowiedzi, ukończonych egzaminów i własnych testów, ile czasu zajęła nauka i ile średnio trwa
 * odpowiedź. Czas nauki to czas z otwartą kartą w trakcie sesji (razem z czytaniem wyjaśnień), a średni czas na pytanie
 * to osobna miara: czas samej odpowiedzi.
 */
export function LearningSummarySection() {
  const { data, isLoading, isError, refetch } = useLearningSummary();

  return (
    <section aria-labelledby="learning-summary-title" className="flex flex-col gap-3" data-testid="learning-summary">
      <h2 id="learning-summary-title" className="text-lg font-semibold">
        Podsumowanie nauki
      </h2>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : isError || !data ? (
        <Card>
          <ErrorState message="Nie udało się pobrać podsumowania nauki." onRetry={() => refetch()} />
        </Card>
      ) : (
        <Card className="flex flex-col gap-6 p-5">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              label="Odpowiedzi"
              value={NUMBER.format(data.totalAnswers)}
              hint={`testy: ${NUMBER.format(data.testAnswers)}, fiszki: ${NUMBER.format(data.flashcardReviews)}`}
              testId="summary-answers"
            />
            <Stat label="Egzaminy próbne" value={NUMBER.format(data.examsDone)} hint="ukończone" testId="summary-exams" />
            <Stat
              label="Własne testy"
              value={NUMBER.format(data.customTestsDone)}
              hint={
                <Link to={ROUTES.myTests} className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-fg">
                  ukończone, zobacz Moje testy
                </Link>
              }
              testId="summary-custom-tests"
            />
            <Stat
              label="Średnio na pytanie"
              value={averageText(data.averageSecondsPerQuestion)}
              hint={`na fiszkę: ${averageText(data.averageSecondsPerFlashcard)}`}
              testId="summary-average"
            />
          </dl>

          <div className="flex flex-col gap-3 border-t border-line pt-5">
            <div>
              <h3 className="text-base font-semibold">Czas nauki</h3>
              <p className="text-xs text-fg-muted">
                Liczymy czas na ekranach nauki przy otwartej karcie przeglądarki, razem z czytaniem wyjaśnień. Po 3 minutach
                bez ruchu liczenie się wstrzymuje.
              </p>
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Stat label="Dziś" value={studyTimeText(data.studySecondsToday)} testId="summary-time-today" />
              <Stat label="Ostatnie 7 dni" value={studyTimeText(data.studySecondsLast7Days)} testId="summary-time-week" />
              <Stat label="Łącznie" value={studyTimeText(data.studySecondsTotal)} testId="summary-time-total" />
            </dl>
          </div>
        </Card>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  testId,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  testId: string;
}) {
  return (
    <div data-testid={testId}>
      <dt className="text-sm text-fg-muted">{label}</dt>
      <dd>
        <span className="tabular-nums text-2xl font-bold">{value}</span>
        {hint && <span className="block text-xs text-fg-muted">{hint}</span>}
      </dd>
    </div>
  );
}
