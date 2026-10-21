import { Link } from "react-router-dom";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { useTestStats } from "../statistics/hooks";
import { useTestCatalog } from "../tests/hooks";
import { usePool } from "../pool/hooks";
import { isPoolRestricted } from "../pool/summary";
import type { CustomTestPrefill } from "../customTest/prefill";
import { InlineError } from "./InlineError";
import { percentOf } from "./selectors";

const TEXT_LINK =
  "-my-3 inline-flex min-h-11 items-center text-sm text-fg-muted underline underline-offset-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink";

/**
 * „Postęp": jeden pasek „Przerobione" (ile pytań z puli zobaczyłeś co najmniej raz) i pod nim dziedziny z postępem, każda
 * otwiera w Testach kreator „Nauka" z tą dziedziną. „Przerobione" to nie „opanowane": pasek rośnie od pierwszego dnia, a opanowanie
 * (które pojawia się dopiero po około dwóch tygodniach) jest opisane w Statystykach.
 */
export function ProgressCard({ className }: { className?: string }) {
  const stats = useTestStats();
  const pool = usePool();
  const catalog = useTestCatalog();
  const frame = cn("flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 sm:p-6", className);

  if (stats.isLoading) return <Skeleton className={cn("h-72 w-full", className)} />;

  const header = (
    <div className="flex items-center justify-between gap-3">
      <h2 id="progress-title" className="text-sm font-medium text-fg-muted">
        Postęp
      </h2>
      <Link to={ROUTES.statistics} className={TEXT_LINK}>
        Statystyki
      </Link>
    </div>
  );

  if (stats.isError || !stats.data) {
    return (
      <section aria-labelledby="progress-title" className={frame}>
        {header}
        <InlineError message="Nie udało się pobrać postępu." onRetry={() => void stats.refetch()} />
      </section>
    );
  }

  const total = Math.max(0, stats.data.totalQuestions);
  const done = Math.min(Math.max(0, stats.data.solvedQuestions), total);
  const percent = percentOf(done, total);
  // Aplikacje widzą postęp w dziedzinach, Student w przedmiotach (jego pytania to akty przypisane do przedmiotów).
  const courses = (Array.isArray(catalog.data?.courses) ? catalog.data.courses : []).filter((course) => course.questionCount > 0);
  const studentView = courses.length > 0;
  // Kliknięcie wiersza otwiera w Testach kreator „Nauka" z tą dziedziną (przedmiotem) już wybraną, od razu na kroku „Pytania i start".
  const launch = (scope: Pick<CustomTestPrefill, "fieldIds" | "courseIds">): { prefill: CustomTestPrefill } => ({
    prefill: { actIds: [], sectionIds: [], source: "ALL", kind: "ALL", requestedCount: 20, ...scope },
  });
  const rows = studentView
    ? courses.map((course) => ({ ...course, state: launch({ fieldIds: [], courseIds: [course.id] }) }))
    : (Array.isArray(catalog.data?.fields) ? catalog.data.fields : [])
        .filter((field) => field.questionCount > 0)
        .map((field) => ({ ...field, state: launch({ fieldIds: [field.id], courseIds: [] }) }));

  return (
    <section aria-labelledby="progress-title" className={frame}>
      {header}

      {total === 0 ? (
        <p className="text-sm text-fg-muted">Nie ma jeszcze pytań do rozwiązania.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-fg-muted">
            Przerobione:{" "}
            <span className="text-2xl font-bold tabular-nums text-fg">{done}</span> z{" "}
            <span className="font-semibold tabular-nums text-fg">{total}</span> ({percent}%)
          </p>
          <div
            role="progressbar"
            aria-label="Przerobione pytania"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            aria-valuetext={`${done} z ${total} pytań, ${percent}%`}
            className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
          >
            <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-fg-muted">
            Przerobione to pytania, które miały już choć jedną odpowiedź.
            {pool.data &&
              isPoolRestricted(pool.data) &&
              (studentView
                ? " Liczymy tylko pytania z Twojego zakresu nauki (wybrane przedmioty)."
                : " Liczymy tylko pytania z Twojego zakresu nauki (wybrane akty).")}
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <ul aria-label={studentView ? "Postęp według przedmiotów" : "Postęp według dziedzin"} className="flex flex-col divide-y divide-line border-t border-line">
          {rows.map((field) => (
            <li key={field.id}>
              <Link
                to={ROUTES.tests}
                state={field.state}
                className="-mx-2 flex min-h-11 flex-col justify-center gap-1.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-medium">{field.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-fg-muted">
                    {field.solvedCount} z {field.questionCount}
                    <span className="sr-only"> pytań przerobionych</span>
                  </span>
                </span>
                <span aria-hidden="true" className="block h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${percentOf(field.solvedCount, field.questionCount)}%` }}
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {catalog.isError && <InlineError message="Nie udało się pobrać dziedzin." onRetry={() => void catalog.refetch()} />}
    </section>
  );
}
