import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { cn } from "../../lib/cn";
import { MasteryExplainer } from "./MasteryExplainer";
import { useSourceStats } from "./hooks";
import {
  answersWord,
  formatPercent,
  masterySplit,
  orderedGroups,
  questionsWord,
  sourceGroupLabel,
  sumMetrics,
  yearsRange,
  type MasteryScope,
} from "./sourceStats";
import type { SourceGroupEntry, SourceMetrics } from "./types";

const ALL = "ALL" as const;

/**
 * „Opanowanie pytań": ile pytań jest opanowanych, ile w nauce, a ile nowych, dla jednej grupy źródeł (moje arkusze,
 * arkusze innych ścieżek, pytania autorskie) albo całej puli, z rozbiciem na arkusze i z wyjaśnieniem, co znaczy
 * „opanowane". Nie zależy od filtra źródeł z Testów ani od zawężenia puli do aktów. Domyślnie pokazuje moje arkusze,
 * a gdy ich nie ma (Student), całą pulę.
 */
export function MasterySection() {
  const { data, isLoading, isError, refetch } = useSourceStats();
  const [chosen, setChosen] = useState<MasteryScope | null>(null);

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (isError || !data || !Array.isArray(data.groups)) {
    return (
      <Card>
        <ErrorState message="Nie udało się pobrać statystyk według źródeł." onRetry={() => refetch()} />
      </Card>
    );
  }

  const entries = orderedGroups(data);
  const withQuestions = entries.filter((e) => e.stats.totalQuestions > 0);
  const fallback: MasteryScope = withQuestions.some((e) => e.group === "OWN_SHEETS") ? "OWN_SHEETS" : ALL;
  const scope: MasteryScope =
    chosen && (chosen === ALL || entries.some((e) => e.group === chosen)) ? chosen : fallback;
  const entry = scope === ALL ? null : (entries.find((e) => e.group === scope) ?? null);
  const metrics = scope === ALL ? sumMetrics(entries) : (entry?.stats ?? null);

  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6" data-testid="source-stats">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Opanowanie pytań</h2>
          <p className="mt-1 max-w-prose text-sm text-fg-muted">
            Ile pytań masz już mocno w głowie, ile jest w trakcie nauki, a ile jeszcze nietkniętych. Liczby obejmują całą
            pulę Twojej ścieżki, niezależnie od filtra źródeł w Testach.
          </p>
        </div>
        {/* Na telefonie podpis nad listą, a lista na całą szerokość: nazwy grup są długie. */}
        <label className="flex w-full flex-col gap-1 text-sm sm:w-auto sm:flex-row sm:items-center sm:gap-2">
          <span className="text-fg-muted">Źródło:</span>
          <select
            value={scope}
            onChange={(event) => setChosen(event.target.value as MasteryScope)}
            className="min-h-11 w-full min-w-0 rounded-xl border border-field bg-surface-2 px-3 text-sm sm:w-auto"
          >
            <option value={ALL}>Cała pula ({sumMetrics(entries).totalQuestions})</option>
            {entries.map((item) => (
              <option key={item.group} value={item.group}>
                {sourceGroupLabel(item.group)} ({item.stats.totalQuestions})
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
        <div className="flex flex-col gap-6" data-testid="source-details">
          <MasteryNumbers
            metrics={metrics}
            title={scope === ALL ? "Cała pula" : sourceGroupLabel(scope)}
            entry={entry}
          />
          <MasteryExplainer />

          {entry && entry.group !== "AUTHORED" && entry.sources.length > 0 ? (
            <SheetTable entry={entry} />
          ) : (
            <p className="text-sm text-fg-muted" data-testid="source-no-years">
              {scope === ALL
                ? "Wybierz jedną grupę źródeł, żeby zobaczyć rozbicie na arkusze egzaminów."
                : scope === "AUTHORED"
                  ? "Pytania autorskie nie mają roku egzaminu, więc nie ma rozbicia na arkusze."
                  : "W tej grupie nie ma jeszcze arkuszy z pytaniami."}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

const SEGMENTS = [
  { key: "mastered", label: "Opanowane", hint: "pewnie zapamiętane", swatch: "bg-accent", testId: "source-mature" },
  { key: "learning", label: "W nauce", hint: "już rozwiązane, jeszcze niepewne", swatch: "bg-accent/45", testId: "source-learning" },
  { key: "fresh", label: "Nowe", hint: "jeszcze bez odpowiedzi", swatch: "border border-field bg-surface-2", testId: "source-fresh" },
] as const;

function MasteryNumbers({ metrics, title, entry }: { metrics: SourceMetrics; title: string; entry: SourceGroupEntry | null }) {
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

      <p className="text-sm text-fg-muted" data-testid="source-recent">
        Do powtórki teraz: <span className="font-medium tabular-nums text-fg" data-testid="source-due">{metrics.dueQuestions}</span>
        <span className="ml-4">
          Skuteczność:{" "}
          <span className="font-medium tabular-nums text-fg" data-testid="source-accuracy">
            {formatPercent(metrics.accuracyRate)}
          </span>
          {metrics.answers > 0 ? ` (z ${metrics.answers} ${answersWord(metrics.answers)})` : " (brak odpowiedzi)"}
        </span>
      </p>
    </div>
  );
}

function SheetTable({ entry }: { entry: SourceGroupEntry }) {
  const headingId = `source-sheets-${entry.group}`;
  return (
    <div>
      <h3 id={headingId} className="mb-2 text-sm font-semibold text-fg-muted">
        Arkusz po arkuszu
      </h3>
      {/* Na wąskim ekranie tabela przewija się w bok, więc region musi dać się przewinąć klawiaturą (tabIndex). */}
      <div
        role="region"
        aria-labelledby={headingId}
        tabIndex={0}
        className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
      >
        <table className="w-full text-sm" data-testid="source-years">
          <thead>
            <tr className="border-b border-line text-left text-xs text-fg-muted">
              <th scope="col" className="py-2 pr-4 font-medium">
                Arkusz
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
            {entry.sources.map(({ id, name, stats }) => {
              const split = masterySplit(stats);
              return (
                <tr key={id} className="border-b border-line last:border-0">
                  <th scope="row" className="py-3 pr-4 text-left font-semibold">
                    {name}
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
