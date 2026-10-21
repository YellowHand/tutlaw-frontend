import { EMPTY_SCOPE, type CustomTestCounts, type CustomTestKind } from "../../api/customTest";
import { cn } from "../../lib/cn";
import { pluralizePl } from "../../lib/plural";
import { useCustomTestCounts, useStartCustomTest } from "../customTest/hooks";
import { formatCount } from "./format";

/** Ile pytań losuje szybki zestaw. Inny zakres albo liczbę ustawia się w kreatorze („Nauka"). */
export const QUICK_SET_SIZE = 20;

interface QuickSet {
  kind: CustomTestKind;
  label: string;
  hint: string;
  count: (counts: CustomTestCounts) => number;
}

const SETS: QuickSet[] = [
  { kind: "MISTAKES", label: "Moje błędy", hint: "Pytania, w których ostatnia odpowiedź była błędna.", count: (c) => c.mistakes },
  { kind: "LAW_CHANGE", label: "Zmiany w prawie", hint: "Pytania zmienione w ostatnim roku.", count: (c) => c.lawChanges },
  { kind: "NEW", label: "Nowe pytania", hint: "Pytania, których jeszcze nie rozwiązywałeś.", count: (c) => c.newQuestions },
];

/**
 * „Szybkie zestawy": trzy kafelki, które od razu zaczynają test z całej puli (do 20 pytań danego rodzaju), bez kreatora.
 * Liczba na kafelku to wszystkie dostępne pytania tego rodzaju; zestaw bez pytań jest wyszarzony.
 */
export function QuickSets() {
  const counts = useCustomTestCounts(EMPTY_SCOPE, "ALL");
  const { start, starting, error } = useStartCustomTest();

  return (
    <section aria-labelledby="quick-sets" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <h2 id="quick-sets" className="text-sm font-medium text-fg-muted">
          Szybkie zestawy
        </h2>
        <p className="text-xs text-fg-muted">Start od razu, do {QUICK_SET_SIZE} pytań. Własny zakres ustawisz w „Nauce".</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {SETS.map((set, index) => {
          const total = counts.data ? set.count(counts.data) : null;
          const empty = total === 0;
          const questions = pluralizePl(total ?? 0, { one: "pytanie", few: "pytania", many: "pytań" });
          return (
            <button
              key={set.kind}
              type="button"
              disabled={starting || empty || total === null}
              onClick={() => void start({ scope: EMPTY_SCOPE, source: "ALL", kind: set.kind, questionCount: QUICK_SET_SIZE })}
              title={empty ? `${set.hint} Teraz nie ma takich pytań.` : `${set.hint} Losuje do ${QUICK_SET_SIZE} pytań.`}
              data-testid={`quick-${set.kind.toLowerCase()}`}
              className={cn(
                "flex min-h-13 cursor-pointer items-center justify-between gap-1.5 rounded-2xl border border-line bg-surface px-3 text-left text-sm font-semibold transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-surface sm:min-h-16 sm:gap-3 sm:px-4",
                // Na telefonie trzy kafelki w dwóch kolumnach: trzeci zajmuje cały wiersz.
                index === 2 && "col-span-2 sm:col-span-1"
              )}
            >
              <span className="min-w-0">{set.label}</span>
              <span className="shrink-0 rounded-full bg-surface-2 px-2 text-xs font-medium tabular-nums text-fg-muted">
                {total === null ? "…" : formatCount(total)}
                <span className="sr-only"> {questions}</span>
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
