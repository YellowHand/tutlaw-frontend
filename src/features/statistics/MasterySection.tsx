import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { cn } from "../../lib/cn";
import { useLearningSettings } from "../settings/hooks";
import { MasteryExplainer } from "./MasteryExplainer";
import { useOriginStats } from "./hooks";
import {
  answersWord,
  formatPercent,
  masterySplit,
  originGroupLabel,
  orderedEntries,
  questionsWord,
  sumMetrics,
  yearsRange,
  type MasteryScope,
} from "./originStats";
import type { OriginMetrics, OriginStatsEntry } from "./types";

const ALL = "ALL" as const;

/**
 * „Opanowanie pytań": ile pytań jest opanowanych, ile w nauce, a ile nowych, dla jednej aplikacji albo wszystkich
 * razem, z rozbiciem na lata egzaminu i z wyjaśnieniem, co znaczy „opanowane". Nie zależy od filtra pochodzenia z
 * Testów. Domyślnie pokazuje aplikację wybraną w Koncie jako egzamin użytkownika, a bez wyboru wszystkie razem.
 */
export function MasterySection() {
  const { data, isLoading, isError, refetch } = useOriginStats();
  const settings = useLearningSettings();
  const [chosen, setChosen] = useState<MasteryScope | null>(null);

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (isError || !data || !Array.isArray(data.origins)) {
    return (
      <Card>
        <ErrorState message="Nie udało się pobrać statystyk według aplikacji." onRetry={() => refetch()} />
      </Card>
    );
  }

  const entries = orderedEntries(data);
  const withQuestions = entries.filter((e) => e.stats.totalQuestions > 0);
  const examOrigin = settings.data?.examOrigin ?? null;
  const fallback: MasteryScope = examOrigin && withQuestions.some((e) => e.origin === examOrigin) ? examOrigin : ALL;
  const scope: MasteryScope =
    chosen && (chosen === ALL || entries.some((e) => e.origin === chosen)) ? chosen : fallback;
  const entry = scope === ALL ? null : (entries.find((e) => e.origin === scope) ?? null);
  const metrics = scope === ALL ? sumMetrics(entries) : (entry?.stats ?? null);

  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6" data-testid="origin-stats">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Opanowanie pytań</h2>
          <p className="mt-1 max-w-prose text-sm text-fg-muted">
            Ile pytań masz już mocno w głowie, ile jest w trakcie nauki, a ile jeszcze nietkniętych. Liczby nie zależą od
            filtra pochodzenia w Testach.
          </p>
        </div>
        {/* Na telefonie podpis nad listą, a lista na całą szerokość: nazwy aplikacji są długie. */}
        <label className="flex w-full flex-col gap-1 text-sm sm:w-auto sm:flex-row sm:items-center sm:gap-2">
          <span className="text-fg-muted">Aplikacja:</span>
          <select
            value={scope}
            onChange={(event) => setChosen(event.target.value as MasteryScope)}
            className="min-h-11 w-full min-w-0 rounded-xl border border-field bg-surface-2 px-3 text-sm sm:w-auto"
          >
            <option value={ALL}>Wszystkie aplikacje ({sumMetrics(entries).totalQuestions})</option>
            {entries.map((item) => (
              <option key={item.origin} value={item.origin}>
                {originGroupLabel(item.origin)} ({item.stats.totalQuestions})
              </option>
            ))}
          </select>
        </label>
      </div>

      {metrics === null || metrics.totalQuestions === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Brak pytań w tym zakresie"
          description="Gdy pojawią się pytania, zobaczysz tu opanowanie."
        />
      ) : (
        <div className="flex flex-col gap-6" data-testid="origin-details">
          <MasteryNumbers
            metrics={metrics}
            title={scope === ALL ? "Wszystkie aplikacje" : originGroupLabel(scope)}
            entry={entry}
          />
          <MasteryExplainer />

          {entry && entry.years.length > 0 ? (
            <YearTable entry={entry} />
          ) : (
            <p className="text-sm text-fg-muted" data-testid="origin-no-years">
              {scope === ALL
                ? "Wybierz jedną aplikację, żeby zobaczyć rozbicie na lata egzaminu."
                : scope === "AUTHORED"
                  ? "Pytania autorskie nie mają roku egzaminu, więc nie ma rozbicia na lata."
                  : "Pytania z tej aplikacji nie mają jeszcze podanego roku egzaminu."}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

const SEGMENTS = [
  { key: "mastered", label: "Opanowane", hint: "pewnie zapamiętane", swatch: "bg-accent", testId: "origin-mature" },
  { key: "learning", label: "W nauce", hint: "już rozwiązane, jeszcze niepewne", swatch: "bg-accent/45", testId: "origin-learning" },
  { key: "fresh", label: "Nowe", hint: "jeszcze bez odpowiedzi", swatch: "border border-field bg-surface-2", testId: "origin-fresh" },
] as const;

function MasteryNumbers({ metrics, title, entry }: { metrics: OriginMetrics; title: string; entry: OriginStatsEntry | null }) {
  const split = masterySplit(metrics);
  const range = entry ? yearsRange(entry) : null;
  const bar = (n: number) => `${(n * 100) / Math.max(1, split.total)}%`;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-fg-muted">
          {split.total} {questionsWord(split.total)}
          {range && <>, egzaminy z lat {range}</>}
        </p>
      </div>

      <div
        role="img"
        aria-label={`Opanowane ${split.mastered}, w nauce ${split.learning}, nowe ${split.fresh} z ${split.total} pytań.`}
        className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2"
        data-testid="mastery-bar"
      >
        {split.mastered > 0 && <div className="h-full bg-accent" style={{ width: bar(split.mastered) }} />}
        {split.learning > 0 && <div className="h-full bg-accent/45" style={{ width: bar(split.learning) }} />}
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {SEGMENTS.map((segment) => (
          <div key={segment.key}>
            <dt className="flex items-center gap-2 text-sm text-fg-muted">
              <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", segment.swatch)} />
              {segment.label}
            </dt>
            <dd className="mt-0.5 text-2xl font-bold tabular-nums" data-testid={segment.testId}>
              {split[segment.key]}
            </dd>
            <dd className="text-xs text-fg-muted">{segment.hint}</dd>
          </div>
        ))}
      </dl>

      <p className="text-sm text-fg-muted" data-testid="origin-recent">
        Do powtórki teraz: <span className="font-medium tabular-nums text-fg" data-testid="origin-due">{metrics.dueQuestions}</span>
        <span className="ml-4">
          Skuteczność:{" "}
          <span className="font-medium tabular-nums text-fg" data-testid="origin-accuracy">
            {formatPercent(metrics.accuracyRate)}
          </span>
          {metrics.answers > 0 ? ` (z ${metrics.answers} ${answersWord(metrics.answers)})` : " (brak odpowiedzi)"}
        </span>
      </p>
    </div>
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
                Opanowane
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                W nauce
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Nowe
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
            {entry.years.map(({ year, stats }) => {
              const split = masterySplit(stats);
              return (
                <tr key={year} className="border-b border-line last:border-0">
                  <th scope="row" className="tabular-nums py-3 pr-4 text-left font-semibold">
                    {year}
                  </th>
                  <td className="tabular-nums py-3 pr-4 text-fg-muted">{split.total}</td>
                  <td className="tabular-nums py-3 pr-4 text-fg-muted">{split.mastered}</td>
                  <td className="tabular-nums py-3 pr-4 text-fg-muted">{split.learning}</td>
                  <td className="tabular-nums py-3 pr-4 text-fg-muted">{split.fresh}</td>
                  <td className="tabular-nums py-3 pr-4 text-fg-muted">{stats.dueQuestions}</td>
                  <td className="tabular-nums py-3 text-fg-muted">{formatPercent(stats.accuracyRate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
