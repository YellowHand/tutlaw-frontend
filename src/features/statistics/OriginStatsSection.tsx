import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import type { QuestionOrigin } from "../../lib/origin";
import { useOriginStats } from "./hooks";
import {
  answersWord,
  defaultOrigin,
  formatPercent,
  originGroupLabel,
  orderedEntries,
  questionsWord,
  solvedPercent,
  yearsRange,
} from "./originStats";
import type { OriginMetrics, OriginStatsEntry } from "./types";

/**
 * Statystyki Testów według aplikacji (pochodzenia pytań): wybór aplikacji, liczby dla niej i rozbicie na lata
 * egzaminu. Nie zależy od filtra pochodzenia z Testów ani od filtra przedmiotu na tej stronie.
 */
export function OriginStatsSection() {
  const { data, isLoading, isError, refetch } = useOriginStats();
  const [chosen, setChosen] = useState<QuestionOrigin | null>(null);

  if (isLoading) return <Skeleton className="h-72 w-full" />;

  if (isError || !data || !Array.isArray(data.origins)) {
    return (
      <Card>
        <ErrorState message="Nie udało się pobrać statystyk według aplikacji." onRetry={() => refetch()} />
      </Card>
    );
  }

  const entries = orderedEntries(data);
  const selectedOrigin = chosen && entries.some((e) => e.origin === chosen) ? chosen : defaultOrigin(entries);
  const entry = entries.find((e) => e.origin === selectedOrigin);
  if (!entry) return null;

  return (
    <Card className="flex flex-col gap-5" data-testid="origin-stats">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-fg-muted">Testy według aplikacji</h2>
          <p className="mt-1 max-w-prose text-xs text-fg-muted">
            Wybierz aplikację, żeby zobaczyć, jak Ci idzie z jej pytaniami, także rok po roku. Liczby nie zależą od
            filtra pochodzenia w Testach.
          </p>
        </div>
        {/* Na telefonie podpis nad listą, a lista na całą szerokość: nazwy aplikacji są długie. */}
        <label className="flex w-full flex-col gap-1 text-sm sm:w-auto sm:flex-row sm:items-center sm:gap-2">
          <span className="text-fg-muted">Aplikacja:</span>
          <select
            value={entry.origin}
            onChange={(event) => setChosen(event.target.value as QuestionOrigin)}
            className="min-h-11 w-full min-w-0 rounded-xl border border-field bg-surface-2 px-3 text-sm sm:w-auto"
          >
            {entries.map((item) => (
              <option key={item.origin} value={item.origin}>
                {originGroupLabel(item.origin)} ({item.stats.totalQuestions})
              </option>
            ))}
          </select>
        </label>
      </div>

      <OriginDetails entry={entry} />
    </Card>
  );
}

function OriginDetails({ entry }: { entry: OriginStatsEntry }) {
  const { stats } = entry;
  const label = originGroupLabel(entry.origin);

  if (stats.totalQuestions === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Brak pytań z tej aplikacji"
        description="Gdy pojawią się pytania, zobaczysz tu statystyki."
      />
    );
  }

  const range = yearsRange(entry);
  const solvedBar = solvedPercent(stats.solvedQuestions, stats.totalQuestions);

  return (
    <div className="flex flex-col gap-5" data-testid="origin-details">
      <div>
        <h3 className="text-lg font-semibold">{label}</h3>
        <p className="text-sm text-fg-muted">
          {stats.totalQuestions} {questionsWord(stats.totalQuestions)}
          {range && <>, egzaminy z lat {range}</>}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="tabular-nums text-2xl font-bold" data-testid="origin-solved">
            {stats.solvedQuestions} / {stats.totalQuestions}
          </p>
          <p className="text-xs text-fg-muted">Rozwiązane</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
            <div className="h-full rounded-full bg-accent" style={{ width: `${solvedBar}%` }} />
          </div>
        </div>
        <div>
          <p className="tabular-nums text-2xl font-bold" data-testid="origin-mature">
            {stats.matureQuestions}
          </p>
          <p className="text-xs text-fg-muted">Opanowane</p>
        </div>
        <div>
          <p className="tabular-nums text-2xl font-bold" data-testid="origin-due">
            {stats.dueQuestions}
          </p>
          <p className="text-xs text-fg-muted">Do powtórki</p>
        </div>
        <div>
          <p className="tabular-nums text-2xl font-bold" data-testid="origin-accuracy">
            {formatPercent(stats.accuracyRate)}
          </p>
          <p className="text-xs text-fg-muted">
            {stats.answers > 0
              ? `Skuteczność (z ${stats.answers} ${answersWord(stats.answers)})`
              : "Skuteczność (brak odpowiedzi)"}
          </p>
        </div>
      </div>

      <RecentLine stats={stats} />

      {entry.years.length > 0 ? (
        <YearTable entry={entry} />
      ) : (
        <p className="text-sm text-fg-muted" data-testid="origin-no-years">
          {entry.origin === "AUTHORED"
            ? "Pytania autorskie nie mają roku egzaminu, więc nie ma rozbicia na lata."
            : "Pytania z tej aplikacji nie mają jeszcze podanego roku egzaminu."}
        </p>
      )}
    </div>
  );
}

function RecentLine({ stats }: { stats: OriginMetrics }) {
  if (stats.answersLast30Days === 0) {
    return (
      <p className="text-sm text-fg-muted" data-testid="origin-recent">
        Ostatnie 30 dni: brak odpowiedzi.
      </p>
    );
  }
  return (
    <p className="text-sm text-fg-muted" data-testid="origin-recent">
      Ostatnie 30 dni: {stats.answersLast30Days} {answersWord(stats.answersLast30Days)}, skuteczność{" "}
      {formatPercent(stats.accuracyLast30Days)}
      {stats.confidentMistakesLast30Days > 0 && (
        <>
          , pewne błędy: {stats.confidentMistakesLast30Days} (błędna odpowiedź bez „Nie jestem pewien")
        </>
      )}
      .
    </p>
  );
}

function YearTable({ entry }: { entry: OriginStatsEntry }) {
  const headingId = `origin-years-${entry.origin}`;
  return (
    <div>
      <h3 id={headingId} className="mb-2 text-sm font-semibold text-fg-muted">
        Rok po roku
      </h3>
      {/* Na wąskim ekranie tabela przewija się w bok, więc region musi dać się przewinąć klawiaturą (tabIndex). */}
      <div
        role="region"
        aria-labelledby={headingId}
        tabIndex={0}
        className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <table className="w-full text-sm" data-testid="origin-years">
          <thead>
            <tr className="border-b border-line text-left text-xs text-fg-muted">
              <th scope="col" className="py-2 pr-4 font-medium">
                Rok
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Pytania
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Rozwiązane
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Opanowane
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Do powtórki
              </th>
              <th scope="col" className="py-2 font-medium">
                Skuteczność
              </th>
            </tr>
          </thead>
          <tbody>
            {entry.years.map(({ year, stats }) => (
              <tr key={year} className="border-b border-line last:border-0">
                <th scope="row" className="tabular-nums py-3 pr-4 text-left font-semibold">
                  {year}
                </th>
                <td className="tabular-nums py-3 pr-4 text-fg-muted">{stats.totalQuestions}</td>
                <td className="tabular-nums whitespace-nowrap py-3 pr-4 text-fg-muted">
                  {stats.solvedQuestions} / {stats.totalQuestions}
                </td>
                <td className="tabular-nums py-3 pr-4 text-fg-muted">{stats.matureQuestions}</td>
                <td className="tabular-nums py-3 pr-4 text-fg-muted">{stats.dueQuestions}</td>
                <td className="tabular-nums py-3 text-fg-muted">{formatPercent(stats.accuracyRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
