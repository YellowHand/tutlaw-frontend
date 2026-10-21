import { useEffect, useRef, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronRight, CircleDashed } from "lucide-react";
import type { CustomTestSessionSummary } from "../../api/customTest";
import { LIST_PAGE_SIZE } from "../../api/pagination";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { ExamAttemptRow } from "../exam/ExamAttemptRow";
import { formatDateTime, formatDuration } from "../exam/format";
import { useExamHistory } from "../exam/hooks";
import { Breadcrumbs } from "../tests/Breadcrumbs";
import { START_BUTTON } from "../tests/StartButtons";
import { SOURCE_MODE_LABELS } from "../../lib/sourceMode";
import { KIND_LABELS } from "./kindLabels";
import { Pagination } from "./Pagination";
import { useCustomTestSessions } from "./sessionsHooks";

type Tab = "tests" | "exams";

const TESTS_NOUNS = { one: "test", few: "testy", many: "testów" };
const EXAMS_NOUNS = { one: "egzamin", few: "egzaminy", many: "egzaminów" };

/**
 * „Moje testy": przełącznik Testy / Egzaminy. Testy to zapisane własne testy (nieukończone też zostają na liście),
 * Egzaminy to podejścia do egzaminu próbnego z wynikiem i, jeśli zapisano odpowiedzi, raportem. Obie listy są od
 * najnowszego i stronicowane po 20. Zakładka i numer strony są w adresie (`?tab=exams&page=2`), więc przycisk Wstecz
 * przeglądarki i odświeżenie wracają w to samo miejsce.
 */
export function MyTestsPage() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "exams" ? "exams" : "tests";
  const pageNumber = Number(params.get("page"));
  const page = Number.isInteger(pageNumber) && pageNumber >= 1 ? pageNumber - 1 : 0;
  const listTop = useRef<HTMLDivElement>(null);

  const go = (next: { tab: Tab; page: number }, scroll = false, replace = false) => {
    const nextParams = new URLSearchParams();
    if (next.tab === "exams") nextParams.set("tab", "exams");
    if (next.page > 0) nextParams.set("page", String(next.page + 1));
    setParams(nextParams, { replace });
    // Po zmianie strony lista zaczyna się od góry: przycisk „Dalej" jest pod nią, więc bez przewinięcia widać by było jej dół.
    if (scroll) listTop.current?.scrollIntoView({ block: "start" });
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Testy", to: ROUTES.tests }, { label: "Moje testy" }]} />
      <PageHeader
        title="Moje testy"
        subtitle="Testy, które ułożyłeś, i egzaminy próbne, które zrobiłeś. Zaczęty i niedokończony test też zostaje na liście."
      />

      <div className="flex flex-col gap-3 px-4 pb-8 sm:px-8">
        <div role="group" aria-label="Co pokazać" className="flex gap-2">
          <TabButton active={tab === "tests"} onClick={() => go({ tab: "tests", page: 0 })} testId="tab-tests">
            Testy
          </TabButton>
          <TabButton active={tab === "exams"} onClick={() => go({ tab: "exams", page: 0 })} testId="tab-exams">
            Egzaminy
          </TabButton>
        </div>

        <div ref={listTop} className="scroll-mt-4 flex flex-col gap-3">
          {tab === "tests" ? (
            <TestsList page={page} onPage={(p, replace) => go({ tab, page: p }, true, replace)} />
          ) : (
            <ExamsList page={page} onPage={(p, replace) => go({ tab, page: p }, true, replace)} />
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function TabButton({
  active,
  onClick,
  testId,
  children,
}: {
  active: boolean;
  onClick: () => void;
  testId: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "min-h-11 cursor-pointer rounded-xl border px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink",
        active ? "border-accent-ink bg-accent/10 text-fg" : "border-line text-fg-muted hover:bg-surface-2"
      )}
    >
      {children}
    </button>
  );
}

type OnPage = (page: number, replace?: boolean) => void;

/**
 * Wraca na ostatnią istniejącą stronę, gdy adres wskazuje stronę poza listą (np. po ręcznej zmianie numeru). Zastępuje
 * wpis w historii przeglądarki, żeby „Wstecz" nie wracał na stronę, której nie ma.
 */
function useClampPage(
  data: { items: unknown[]; totalElements: number; totalPages: number } | undefined,
  isPlaceholder: boolean,
  page: number,
  onPage: OnPage
) {
  useEffect(() => {
    if (!data || isPlaceholder) return;
    if (page > 0 && data.items.length === 0 && data.totalElements > 0) onPage(Math.max(0, data.totalPages - 1), true);
  }, [data, isPlaceholder, page, onPage]);
}

function TestsList({ page, onPage }: { page: number; onPage: OnPage }) {
  const { data, isLoading, isError, isPlaceholderData, refetch } = useCustomTestSessions(page, LIST_PAGE_SIZE);
  useClampPage(data, isPlaceholderData, page, onPage);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError || !data) return <ErrorState message="Nie udało się pobrać listy testów." onRetry={() => refetch()} />;
  if (data.totalElements === 0) {
    return (
      <Card className="flex flex-col items-start gap-3 p-5">
        <p className="text-sm text-fg-muted">
          Nie ułożyłeś jeszcze żadnego testu. Każdy test, który zaczniesz, pojawi się tutaj.
        </p>
        <Link to={ROUTES.tests} className={START_BUTTON}>
          Ułóż test
        </Link>
      </Card>
    );
  }

  return (
    <>
      <ul className={cn("flex flex-col gap-2", isPlaceholderData && "opacity-60")} data-testid="my-tests-list">
        {data.items.map((session) => (
          <li key={session.id}>
            <SessionRow session={session} />
          </li>
        ))}
      </ul>
      <Pagination
        page={data.page}
        size={data.size}
        totalElements={data.totalElements}
        totalPages={data.totalPages}
        onPage={onPage}
        nouns={TESTS_NOUNS}
      />
    </>
  );
}

function ExamsList({ page, onPage }: { page: number; onPage: OnPage }) {
  const { data, isLoading, isError, isPlaceholderData, refetch } = useExamHistory(page, LIST_PAGE_SIZE);
  useClampPage(data, isPlaceholderData, page, onPage);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError || !data) return <ErrorState message="Nie udało się pobrać listy egzaminów." onRetry={() => refetch()} />;
  if (data.totalElements === 0) {
    return (
      <Card className="flex flex-col items-start gap-3 p-5">
        <p className="text-sm text-fg-muted">
          Nie masz jeszcze żadnego podejścia do egzaminu. Wynik pierwszego egzaminu pojawi się tutaj.
        </p>
        <Link to={ROUTES.exam} className={START_BUTTON}>
          Zrób egzamin próbny
        </Link>
      </Card>
    );
  }

  return (
    <>
      <ul className={cn("flex flex-col gap-2", isPlaceholderData && "opacity-60")} data-testid="my-exams-list">
        {data.items.map((attempt) => (
          <li key={attempt.id}>
            <ExamAttemptRow attempt={attempt} />
          </li>
        ))}
      </ul>
      <Pagination
        page={data.page}
        size={data.size}
        totalElements={data.totalElements}
        totalPages={data.totalPages}
        onPage={onPage}
        nouns={EXAMS_NOUNS}
      />
    </>
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
          <span>{SOURCE_MODE_LABELS[session.source]}</span>
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
