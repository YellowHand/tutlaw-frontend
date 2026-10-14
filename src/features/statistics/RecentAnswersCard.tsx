import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { pluralizePl } from "../../lib/plural";
import { QUIET_BUTTON } from "../tests/StartButtons";
import { useMistakesCount } from "../review/hooks";
import { useTestStats } from "./hooks";
import { normalizeRetentionRate } from "./selectors";

/**
 * „Ostatnie 30 dni": trzy liczby o jakości odpowiedzi w testach, każda z jednym zdaniem, co znaczy. Poprawność mówi, jak
 * często trafiasz. Dwie pozostałe mówią, na ile możesz temu ufać: „pewne błędy" to błędne przekonania (najgroźniejsze),
 * a „trafione w ciemno" to poprawne odpowiedzi, które nie są jeszcze wiedzą.
 */
export function RecentAnswersCard() {
  const { data, isLoading, isError, refetch } = useTestStats();
  const mistakes = useMistakesCount();

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError || !data) {
    return (
      <Card>
        <ErrorState message="Nie udało się pobrać statystyk odpowiedzi." onRetry={() => refetch()} />
      </Card>
    );
  }

  const accuracy = normalizeRetentionRate(data.accuracyRate);
  const answers = data.answersLast30Days;
  const confident = data.confidentMistakesLast30Days;
  const lucky = data.luckyGuessesLast30Days;
  const mistakesCount = typeof mistakes.data?.count === "number" ? mistakes.data.count : 0;

  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6" data-testid="recent-answers">
      <div>
        <h2 className="text-lg font-semibold">Ostatnie 30 dni</h2>
        <p className="mt-1 text-sm text-fg-muted">Jak Ci idzie w testach i na ile możesz ufać swoim odpowiedziom.</p>
      </div>

      {answers === 0 ? (
        <p className="text-sm text-fg-muted" data-testid="recent-empty">
          W ostatnich 30 dniach nie było odpowiedzi w testach. Gdy się pojawią, zobaczysz tu poprawność i błędy.
        </p>
      ) : (
        <dl className="flex flex-col gap-4">
          <div>
            <dt className="text-sm text-fg-muted">Poprawność</dt>
            <dd className="text-3xl font-bold tabular-nums" data-testid="recent-accuracy">
              {accuracy === null ? "—" : `${Math.round(accuracy)}%`}
            </dd>
            <dd className="text-xs text-fg-muted">
              {data.correctLast30Days} z {answers} {pluralizePl(answers, { one: "odpowiedzi", few: "odpowiedzi", many: "odpowiedzi" })} było
              poprawnych.
            </dd>
          </div>
          <div className="border-t border-line pt-4">
            <dt className="text-sm text-fg-muted">Pewne błędy</dt>
            <dd className="text-2xl font-bold tabular-nums" data-testid="recent-confident">
              {confident}
            </dd>
            <dd className="text-xs text-fg-muted">
              Błędna odpowiedź, przy której nie zaznaczono „Nie jestem pewien". To najgroźniejsze: pamiętasz coś na opak, więc
              takie pytania warto poprawić w pierwszej kolejności.
            </dd>
          </div>
          <div className="border-t border-line pt-4">
            <dt className="text-sm text-fg-muted">Trafione w ciemno</dt>
            <dd className="text-2xl font-bold tabular-nums" data-testid="recent-lucky">
              {lucky}
            </dd>
            <dd className="text-xs text-fg-muted">
              Poprawna odpowiedź z zaznaczonym „Nie jestem pewien". To jeszcze nie wiedza, więc takie pytanie wraca szybciej niż
              pewnie zaliczone.
            </dd>
          </div>
        </dl>
      )}

      {mistakesCount > 0 && (
        <Link to={ROUTES.testMistakes} className={`${QUIET_BUTTON} w-fit`}>
          Popraw moje błędy: {mistakesCount}
        </Link>
      )}
    </Card>
  );
}
