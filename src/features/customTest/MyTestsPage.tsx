import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, CircleDashed } from "lucide-react";
import type { CustomTestSessionSummary } from "../../api/customTest";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { formatDateTime, formatDuration } from "../exam/format";
import { Breadcrumbs } from "../tests/Breadcrumbs";
import { START_BUTTON } from "../tests/StartButtons";
import { KIND_LABELS } from "./kindLabels";
import { useCustomTestSessions } from "./sessionsHooks";

/** „Moje testy": zapisane własne testy, od najnowszego. Nieukończone zostają na liście z oznaczeniem. */
export function MyTestsPage() {
  const { data, isLoading, isError, refetch } = useCustomTestSessions();

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Testy", to: ROUTES.tests }, { label: "Własny test", to: ROUTES.customTest }, { label: "Moje testy" }]}
      />
      <PageHeader title="Moje testy" subtitle="Testy, które ułożyłeś. Zaczęty i niedokończony test też zostaje na liście." />

      <div className="flex flex-col gap-3 px-4 pb-8 sm:px-8">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : isError || !data ? (
          <ErrorState message="Nie udało się pobrać listy testów." onRetry={() => refetch()} />
        ) : data.length === 0 ? (
          <Card className="flex flex-col items-start gap-3 p-5">
            <p className="text-sm text-fg-muted">
              Nie ułożyłeś jeszcze żadnego testu. Każdy test, który zaczniesz, pojawi się tutaj.
            </p>
            <Link to={ROUTES.customTest} className={START_BUTTON}>
              Ułóż test
            </Link>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2" data-testid="my-tests-list">
            {data.map((session) => (
              <li key={session.id}>
                <SessionRow session={session} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SessionRow({ session }: { session: CustomTestSessionSummary }) {
  return (
    <Link
      to={ROUTES.myTest(session.id)}
      className="group flex min-h-11 items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
    >
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
          <StatusBadge finished={session.finished} />
          <span className="tabular-nums text-fg">
            {session.correctCount} / {session.questionCount}
            <span className="sr-only"> poprawnych</span>
          </span>
        </p>
        <p className="mt-1 truncate text-sm">{session.scopeLabel}</p>
        <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-fg-muted">
          <span>{KIND_LABELS[session.kind]}</span>
          <span>{formatDateTime(session.startedAt)}</span>
          {session.answeredCount > 0 && <span>{formatDuration(session.timeSeconds)}</span>}
          {!session.finished && (
            <span className="tabular-nums">
              odpowiedzi: {session.answeredCount} z {session.questionCount}
            </span>
          )}
        </p>
      </div>
      <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-fg-muted group-hover:text-fg" />
    </Link>
  );
}

export function StatusBadge({ finished, className }: { finished: boolean; className?: string }) {
  return finished ? (
    <span className={cn("inline-flex items-center gap-1 text-success", className)}>
      <CheckCircle2 size={16} aria-hidden="true" />
      Ukończony
    </span>
  ) : (
    <span className={cn("inline-flex items-center gap-1 text-warning", className)}>
      <CircleDashed size={16} aria-hidden="true" />
      Nieukończony
    </span>
  );
}
