import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { pluralizePl } from "../../lib/plural";
import { loadErrorMessage } from "../../lib/errors";
import { useTestStats } from "../statistics/hooks";
import { normalizeRetentionRate } from "../statistics/selectors";
import { AccuracyRing } from "./AccuracyRing";
import { WeeklyBars } from "./WeeklyBars";

/** Zakładka „Testy" na pulpicie: ile pytań rozwiązano, skuteczność i aktywność z testów. */
export function TestsStatsPanel() {
  const { data, isLoading, isError, error, refetch } = useTestStats();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="flex items-center justify-center p-4">
        <ErrorState message={loadErrorMessage(error, "statystyk testów")} onRetry={() => refetch()} />
      </Card>
    );
  }

  if (data.totalQuestions === 0 && data.answersLast30Days === 0) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          title="Nie rozwiązano jeszcze żadnego testu"
          description="Gdy rozwiążesz pierwsze pytania, pojawią się tu Twoje wyniki."
          action={
            <Link to={ROUTES.tests} className="text-sm text-accent underline">
              Przejdź do Testów
            </Link>
          }
        />
      </Card>
    );
  }

  const percentage = data.totalQuestions === 0 ? 0 : Math.min(100, Math.round((data.solvedQuestions / data.totalQuestions) * 100));

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-2 p-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percentage}%` }} />
        </div>
        <p className="text-center text-sm text-fg-muted">
          Rozwiązano <span className="font-semibold text-fg tabular-nums">{data.solvedQuestions}</span> z{" "}
          <span className="font-semibold text-fg tabular-nums">{data.totalQuestions}</span>{" "}
          {pluralizePl(data.totalQuestions, {
            one: "dostępnego pytania",
            few: "dostępnych pytań",
            many: "dostępnych pytań",
          })}
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
        <WeeklyBars activity={data.activity} unit="odpowiedzi" />
        <AccuracyRing
          percentage={normalizeRetentionRate(data.accuracyRate)}
          title="Poprawność"
          caption={`${data.correctLast30Days} z ${data.answersLast30Days} odpowiedzi (30 dni)`}
          emptyCaption="brak odpowiedzi w ostatnich 30 dniach"
          ariaLabel="Poprawność odpowiedzi w testach"
        />
      </div>

      {data.answersLast30Days > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InsightTile
            value={data.confidentMistakesLast30Days}
            title="Pewne błędy"
            description="Pomyłki, przy których nie zaznaczyłeś „Nie jestem pewien”. To utrwalone błędne przekonania, warto je poprawić w pierwszej kolejności."
            valueClassName={data.confidentMistakesLast30Days > 0 ? "text-danger" : "text-fg"}
          />
          <InsightTile
            value={data.luckyGuessesLast30Days}
            title="Trafione w ciemno"
            description="Poprawne odpowiedzi z zaznaczonym „Nie jestem pewien”. Wynik wygląda dobrze, ale wiedza jest krucha."
            valueClassName={data.luckyGuessesLast30Days > 0 ? "text-warning" : "text-fg"}
          />
        </div>
      )}
    </div>
  );
}

interface InsightTileProps {
  value: number;
  title: string;
  description: string;
  valueClassName: string;
}

/** Jedna liczba z ostatnich 30 dni z krótkim wyjaśnieniem, co oznacza. */
function InsightTile({ value, title, description, valueClassName }: InsightTileProps) {
  return (
    <Card className="flex items-start gap-4 p-4">
      <p className={`text-3xl font-semibold tabular-nums ${valueClassName}`} aria-hidden="true">
        {value}
      </p>
      <div>
        <h3 className="text-sm font-semibold text-fg">
          {title}
          <span className="sr-only">: {value} w ostatnich 30 dniach</span>
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-fg-muted">{description}</p>
      </div>
    </Card>
  );
}
