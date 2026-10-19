import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ClipboardList, History, Play } from "lucide-react";
import { drawCustomTest, type CustomTestCounts, type CustomTestKind } from "../../api/customTest";
import { SOURCE_GROUP_LABELS, SOURCE_GROUP_ORDER, type SourceGroup } from "../../lib/source";
import { PageHeader } from "../../components/layout/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { serverMessage } from "../../lib/errors";
import { pluralizePl } from "../../lib/plural";
import { Breadcrumbs } from "../tests/Breadcrumbs";
import { formatCount } from "../tests/format";
import { useTestCatalog } from "../tests/hooks";
import { PoolChip } from "../pool/PoolChip";
import { usePool } from "../pool/hooks";
import { hiddenGroups } from "../pool/summary";
import { START_BUTTON } from "../tests/StartButtons";
import { loadRemembered, saveRemembered } from "./customTestStorage";
import { useCustomTestCounts, useDebounced } from "./hooks";
import {
  allActIds,
  buildTree,
  countOptions,
  describeSelection,
  hasSelection,
  isEverythingSelected,
  pickCountOption,
  restrictToTree,
  selectionFromScope,
  toScope,
} from "./selection";
import { ScopeTree } from "./ScopeTree";
import type { CustomTestPrefill } from "./prefill";

interface KindOption {
  kind: CustomTestKind;
  label: string;
  hint: string;
  count: (counts: CustomTestCounts) => number;
}

const KIND_OPTIONS: KindOption[] = [
  { kind: "ALL", label: "Wszystkie", hint: "Każde dostępne pytanie", count: (c) => c.all },
  { kind: "NEW", label: "Nowe", hint: "Jeszcze nierozwiązywane", count: (c) => c.newQuestions },
  { kind: "MISTAKES", label: "Moje błędy", hint: "Ostatnia odpowiedź błędna", count: (c) => c.mistakes },
  { kind: "DUE", label: "Zaległe", hint: "Po terminie powtórki", count: (c) => c.due },
];

const questionsWord = (n: number) => pluralizePl(n, { one: "pytanie", few: "pytania", many: "pytań" });

/**
 * Własny test: użytkownik składa sesję nauki sam. Wybiera dziedziny i akty prawne z puli, które pytania (wszystkie, nowe, błędy,
 * zaległe) i liczbę pytań (10, 20, 50, 100 albo 150; przy małym zakresie „Wszystkie"). To nauka, nie egzamin: nie ma progu
 * ani wyniku „zdał / nie zdał", a odpowiedzi idą zwykłą drogą testu (ocena pamięci, pomyłki trafiają do „Moich błędów").
 * Każdy test zapisuje się w „Moich testach"; stamtąd można ułożyć go ponownie z tymi samymi ustawieniami (`prefill`).
 */
export function CustomTestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const catalogQuery = useTestCatalog();
  const pool = usePool().data;
  // Filtr źródeł (grupa wyłączona i mająca pytania) zawęża katalog, więc puste drzewo może być jego skutkiem.
  const filterActive = pool ? hiddenGroups(pool).length > 0 : false;
  const remembered = useMemo(() => loadRemembered(), []);
  // „Ułóż ponownie z tymi ustawieniami" z Moich testów przekazuje ustawienia w stanie nawigacji.
  const prefill = useMemo(() => (location.state as { prefill?: CustomTestPrefill } | null)?.prefill ?? null, [location.state]);

  const tree = useMemo(() => buildTree(catalogQuery.data), [catalogQuery.data]);

  // null = użytkownik jeszcze nic nie zmieniał: pokazujemy zapamiętany wybór (albo wszystko) w świetle bieżącego katalogu.
  const [picked, setPicked] = useState<Set<number> | null>(null);
  const selected = useMemo(() => {
    if (picked !== null) return restrictToTree(tree, picked);
    if (prefill) return selectionFromScope(tree, prefill.fieldIds, prefill.actIds).selected;
    if (remembered && !remembered.all) {
      const kept = restrictToTree(tree, remembered.actIds);
      if (kept.size > 0) return kept;
    }
    return allActIds(tree);
  }, [picked, prefill, remembered, tree]);

  const [kind, setKind] = useState<CustomTestKind>(prefill?.kind ?? remembered?.kind ?? "ALL");
  // null = użytkownik nie wybierał: bierzemy zapamiętaną liczbę (albo 20) spośród tych, które mieszczą się w zakresie.
  const [pickedCount, setPickedCount] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectionMade = hasSelection(tree, selected);
  const scope = useMemo(
    () => (tree.length > 0 && selectionMade ? toScope(tree, selected) : null),
    [tree, selected, selectionMade]
  );
  const scopeKey = JSON.stringify(scope);
  const debouncedScope = useDebounced(scope, 250);
  const settled = JSON.stringify(debouncedScope) === scopeKey;
  const counts = useCustomTestCounts(debouncedScope);
  const countsReady = settled && counts.data !== undefined && !counts.isPlaceholderData;

  const kindOption = KIND_OPTIONS.find((o) => o.kind === kind) ?? KIND_OPTIONS[0];
  const available = counts.data ? kindOption.count(counts.data) : 0;
  // Pokazujemy tylko liczby, które mieszczą się w dostępnych pytaniach; po zmianie zakresu wybór dopasowuje się sam.
  const options = useMemo(() => (countsReady ? countOptions(available) : []), [countsReady, available]);
  const wanted: number | "all" | null = prefill ? prefill.requestedCount : (remembered?.questionCount ?? null);
  const chosen = useMemo(() => {
    const own = pickedCount !== null ? options.find((o) => o.key === pickedCount) : undefined;
    return own ?? pickCountOption(options, wanted);
  }, [options, pickedCount, wanted]);
  const canStart = scope !== null && countsReady && available > 0 && chosen !== null && !starting;

  async function handleStart() {
    if (!canStart || scope === null || chosen === null) return;
    setError(null);
    setStarting(true);
    try {
      const selection = await drawCustomTest(scope, kind, chosen.sends);
      saveRemembered({
        version: 2,
        all: isEverythingSelected(tree, selected),
        actIds: Array.from(selected),
        kind,
        questionCount: chosen.all ? "all" : chosen.count,
      });
      navigate(ROUTES.testCustom(selection.questionIds, selection.sessionId));
    } catch (err) {
      setError(serverMessage(err, "Nie udało się ułożyć testu. Spróbuj ponownie."));
      setStarting(false);
    }
  }

  // Uwagi przy ustawieniach przeniesionych z zapisanego testu: czego nie da się odtworzyć dokładnie.
  const prefillNotes: string[] = [];
  if (prefill && tree.length > 0) {
    if (selectionFromScope(tree, prefill.fieldIds, prefill.actIds).missing > 0) {
      prefillNotes.push("Część aktów prawnych z tamtego testu nie jest teraz w Twojej puli, więc ich nie zaznaczyliśmy.");
    }
    if (pool && prefill.sourceGroups.length > 0) {
      const then = new Set<SourceGroup>(prefill.sourceGroups);
      const now = new Set<SourceGroup>(pool.sourceGroups.filter((group) => group.selected).map((group) => group.code));
      const same = then.size === now.size && SOURCE_GROUP_ORDER.every((code) => then.has(code) === now.has(code));
      if (!same) {
        const nowLabels = SOURCE_GROUP_ORDER.filter((code) => now.has(code)).map((code) => SOURCE_GROUP_LABELS[code].toLowerCase());
        prefillNotes.push(`Tamten test powstał przy innym filtrze źródeł. Teraz obowiązuje: ${nowLabels.join(", ")}.`);
      }
    }
  }

  const header = (
    <>
      <Breadcrumbs items={[{ label: "Testy", to: ROUTES.tests }, { label: "Własny test" }]} />
      <PageHeader
        title="Własny test"
        subtitle={`Ułóż sesję z wybranych dziedzin i aktów prawnych. To nauka, nie egzamin: bez wyniku „zdał / nie zdał".`}
        actions={
          <>
            <Link
              to={ROUTES.myTests}
              data-testid="my-tests-link"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm transition-colors hover:bg-surface-2"
            >
              <History size={16} aria-hidden="true" className="text-fg-muted" />
              Moje testy
            </Link>
            <PoolChip />
          </>
        }
      />
    </>
  );

  if (catalogQuery.isLoading) {
    return (
      <div>
        {header}
        <div className="flex flex-col gap-4 px-4 pb-8 sm:px-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (catalogQuery.isError || !catalogQuery.data) {
    return (
      <div>
        {header}
        <div className="px-4 sm:px-8">
          <ErrorState message="Nie udało się pobrać listy dziedzin i aktów." onRetry={() => catalogQuery.refetch()} />
        </div>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div>
        {header}
        <div className="px-4 sm:px-8">
          <EmptyState
            icon={ClipboardList}
            title={filterActive ? "Brak w filtrze źródeł" : "Wkrótce"}
            description={
              filterActive
                ? "W wybranych grupach źródeł nie ma teraz pytań. Zmień pulę powyżej."
                : "Nie ma jeszcze pytań, z których dałoby się ułożyć test."
            }
          />
        </div>
      </div>
    );
  }

  const summaryLine = [describeSelection(tree, selected), kindOption.label].join(", ");

  let status: string;
  if (!selectionMade) status = "Zaznacz co najmniej jedną dziedzinę lub akt.";
  else if (counts.isError && !counts.data) status = "Nie udało się sprawdzić, ile jest pytań.";
  else if (!countsReady) status = "Liczę pytania…";
  else if (available === 0) status = "Brak takich pytań w wybranym zakresie.";
  else if (chosen === null) status = "Wybierz liczbę pytań.";
  else if (chosen.all) status = `Wylosuję wszystkie ${formatCount(available)}`;
  else status = `Wylosuję ${formatCount(chosen.count)} z ${formatCount(available)}`;

  return (
    <div>
      {header}

      {prefillNotes.length > 0 && (
        <div data-testid="prefill-notes" className="flex flex-col gap-2 px-4 pb-4 sm:px-8">
          {prefillNotes.map((note) => (
            <p key={note} className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-fg-muted">
              {note}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-6 px-4 pb-8 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
        <div className="flex min-w-0 flex-col gap-8">
          <ScopeTree
            tree={tree}
            selected={selected}
            onChange={setPicked}
            onSelectAll={() => setPicked(allActIds(tree))}
            onClear={() => setPicked(new Set())}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-base font-semibold">Które pytania?</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {KIND_OPTIONS.map((option) => {
                const total = counts.data ? option.count(counts.data) : null;
                return (
                  <label key={option.kind} className="relative block cursor-pointer">
                    <input
                      type="radio"
                      name="custom-test-kind"
                      value={option.kind}
                      checked={kind === option.kind}
                      onChange={() => setKind(option.kind)}
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "flex min-h-11 flex-col gap-0.5 rounded-xl border border-line bg-surface px-3 py-2 transition-colors hover:bg-surface-2",
                        "peer-checked:border-accent-ink peer-checked:bg-accent/10 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-ink"
                      )}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium">{option.label}</span>
                        <span className="text-xs tabular-nums text-fg-muted">
                          {total === null ? "…" : formatCount(total)}
                          <span className="sr-only"> {questionsWord(total ?? 0)}</span>
                        </span>
                      </span>
                      <span className="text-xs text-fg-muted">{option.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-base font-semibold">Ile pytań?</legend>
            {options.length > 0 ? (
              <div className="flex flex-wrap gap-2" data-testid="count-options">
                {options.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setPickedCount(option.key)}
                    aria-pressed={chosen?.key === option.key}
                    className={cn(
                      "inline-flex min-h-11 min-w-14 items-center justify-center rounded-xl border px-4 text-sm font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink",
                      chosen?.key === option.key
                        ? "border-accent-ink bg-accent/10 text-fg"
                        : "border-line bg-surface text-fg hover:bg-surface-2"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-fg-muted">
                {!selectionMade
                  ? "Najpierw zaznacz dziedzinę lub akt."
                  : countsReady
                    ? "W tym zakresie nie ma pytań do ułożenia testu."
                    : "Liczę pytania…"}
              </p>
            )}
            <p className="text-xs text-fg-muted">Pokazujemy tylko liczby, na które starcza pytań.</p>
          </fieldset>
        </div>

        <aside
          aria-label="Podsumowanie testu"
          className={cn(
            "z-10 -mx-4 border-t border-line bg-surface px-4 py-3 sm:-mx-8 sm:px-8",
            // Przeglądarka liczy `bottom` od krawędzi pola przewijania bez jego dopełnienia, a <main> ma dopełnienie
            // pod dolną belkę (4,25 rem przy belce wysokiej na 4 rem i 1 px ramki), więc pasek ustawiamy o te 3 px niżej:
            // dolna belka (z-30) je przykrywa i pasek leży równo nad nią. Od `md` belki nie ma: `bottom-0`.
            "sticky -bottom-[3px] md:bottom-0",
            "lg:top-6 lg:bottom-auto lg:mx-0 lg:rounded-2xl lg:border lg:p-5"
          )}
        >
          <div className="flex items-center gap-3 lg:flex-col lg:items-stretch lg:gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="mb-1 hidden text-base font-semibold lg:block">Twój test</h2>
              <p className="text-sm font-semibold tabular-nums" aria-live="polite" aria-busy={!countsReady && selectionMade}>
                {status}
              </p>
              <p className="truncate text-xs text-fg-muted lg:whitespace-normal">{summaryLine}</p>
              {counts.isError && !counts.data && (
                <button
                  type="button"
                  onClick={() => void counts.refetch()}
                  className="inline-flex min-h-11 items-center text-xs text-accent-ink underline underline-offset-2"
                >
                  Spróbuj ponownie
                </button>
              )}
            </div>

            <button type="button" onClick={handleStart} disabled={!canStart} className={cn(START_BUTTON, "shrink-0 disabled:cursor-not-allowed disabled:opacity-50 lg:w-full")}>
              <Play size={16} aria-hidden="true" />
              {starting ? "Losuję pytania…" : "Rozpocznij test"}
            </button>

            <p className="hidden text-xs text-fg-muted lg:block">
              Odpowiedzi liczą się do Twoich powtórek, a pomyłki trafiają do „Moich błędów".
            </p>
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
