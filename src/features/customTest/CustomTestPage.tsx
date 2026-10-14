import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ClipboardList, Play } from "lucide-react";
import { drawCustomTest, type CustomTestCounts, type CustomTestKind } from "../../api/customTest";
import { PageHeader } from "../../components/layout/PageHeader";
import { Field } from "../../components/ui/Field";
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
import { OriginFilterChip } from "../tests/OriginFilterChip";
import { isFilterActive, useOriginFilter } from "../tests/originFilter";
import { START_BUTTON } from "../tests/StartButtons";
import { loadRemembered, saveRemembered } from "./customTestStorage";
import { useCustomTestCounts, useDebounced, useExamYears } from "./hooks";
import {
  allSubjectIds,
  buildTree,
  describeSelection,
  hasSelection,
  isEverythingSelected,
  restrictToTree,
  toScope,
} from "./selection";
import { ScopeTree } from "./ScopeTree";

const COUNT_LIMITS = { min: 1, max: 200 };
const COUNT_PRESETS = [10, 20, 50, 100, 200];
const DEFAULT_COUNT = 20;

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

function parseCount(raw: string): number | null {
  const trimmed = raw.trim();
  const value = Number(trimmed);
  return trimmed !== "" && Number.isInteger(value) ? value : null;
}

function describeYears(from: number | null, to: number | null): string | null {
  if (from === null && to === null) return null;
  if (from !== null && to !== null) return from === to ? String(from) : `${from}–${to}`;
  return from !== null ? `od ${from}` : `do ${to}`;
}

/**
 * Własny test: użytkownik składa sesję nauki sam. Wybiera rodzaje i akty prawne, które pytania (wszystkie, nowe, błędy,
 * zaległe), opcjonalnie lata egzaminu i liczbę pytań. To nauka, nie egzamin: nie ma progu ani wyniku „zdał / nie zdał",
 * a odpowiedzi idą zwykłą drogą testu (ocena pamięci, pomyłki trafiają do „Moich błędów").
 */
export function CustomTestPage() {
  const navigate = useNavigate();
  const catalogQuery = useTestCatalog();
  const filterActive = isFilterActive(useOriginFilter().data);
  const years = useExamYears();
  const remembered = useMemo(() => loadRemembered(), []);

  const tree = useMemo(() => buildTree(catalogQuery.data), [catalogQuery.data]);

  // null = użytkownik jeszcze nic nie zmieniał: pokazujemy zapamiętany wybór (albo wszystko) w świetle bieżącego katalogu.
  const [picked, setPicked] = useState<Set<number> | null>(null);
  const selected = useMemo(() => {
    if (picked !== null) return restrictToTree(tree, picked);
    if (remembered && !remembered.all) {
      const kept = restrictToTree(tree, remembered.subjectIds);
      if (kept.size > 0) return kept;
    }
    return allSubjectIds(tree);
  }, [picked, remembered, tree]);

  const [kind, setKind] = useState<CustomTestKind>(remembered?.kind ?? "ALL");
  const [countInput, setCountInput] = useState(String(remembered?.questionCount ?? DEFAULT_COUNT));
  const [rawYearFrom, setYearFrom] = useState<number | null>(remembered?.yearFrom ?? null);
  const [rawYearTo, setYearTo] = useState<number | null>(remembered?.yearTo ?? null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lata pokazujemy i wysyłamy tylko takie, które są na liście (zapamiętany rok bez pytań po prostu odpada).
  const yearFrom = rawYearFrom !== null && years.includes(rawYearFrom) ? rawYearFrom : null;
  const yearTo = rawYearTo !== null && years.includes(rawYearTo) ? rawYearTo : null;

  const selectionMade = hasSelection(tree, selected);
  const scope = useMemo(
    () => (tree.length > 0 && selectionMade ? toScope(tree, selected, yearFrom, yearTo) : null),
    [tree, selected, selectionMade, yearFrom, yearTo]
  );
  const scopeKey = JSON.stringify(scope);
  const debouncedScope = useDebounced(scope, 250);
  const settled = JSON.stringify(debouncedScope) === scopeKey;
  const counts = useCustomTestCounts(debouncedScope);
  const countsReady = settled && counts.data !== undefined && !counts.isPlaceholderData;

  const kindOption = KIND_OPTIONS.find((o) => o.kind === kind) ?? KIND_OPTIONS[0];
  const available = counts.data ? kindOption.count(counts.data) : 0;
  const asked = parseCount(countInput);
  const countValid = asked !== null && asked >= COUNT_LIMITS.min && asked <= COUNT_LIMITS.max;
  const willDraw = countValid ? Math.min(asked, available) : 0;
  const canStart = scope !== null && countsReady && available > 0 && countValid && !starting;

  async function handleStart() {
    if (!canStart || scope === null || asked === null) return;
    setError(null);
    setStarting(true);
    try {
      const selection = await drawCustomTest(scope, kind, asked);
      saveRemembered({
        version: 1,
        all: isEverythingSelected(tree, selected),
        subjectIds: Array.from(selected),
        kind,
        questionCount: asked,
        yearFrom,
        yearTo,
      });
      navigate(ROUTES.testCustom(selection.cardIds));
    } catch (err) {
      setError(serverMessage(err, "Nie udało się ułożyć testu. Spróbuj ponownie."));
      setStarting(false);
    }
  }

  function changeFrom(value: number | null) {
    setYearFrom(value);
    if (value !== null && yearTo !== null && value > yearTo) setYearTo(value);
  }

  function changeTo(value: number | null) {
    setYearTo(value);
    if (value !== null && yearFrom !== null && value < yearFrom) setYearFrom(value);
  }

  const header = (
    <>
      <Breadcrumbs items={[{ label: "Testy", to: ROUTES.tests }, { label: "Własny test" }]} />
      <PageHeader
        title="Własny test"
        subtitle={`Ułóż sesję z wybranych działów. To nauka, nie egzamin: bez wyniku „zdał / nie zdał".`}
        actions={<OriginFilterChip />}
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
          <ErrorState message="Nie udało się pobrać listy działów." onRetry={() => catalogQuery.refetch()} />
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
            title={filterActive ? "Brak w filtrze" : "Wkrótce"}
            description={
              filterActive
                ? "W wybranych pochodzeniach nie ma teraz pytań. Zmień filtr powyżej."
                : "Nie ma jeszcze pytań, z których dałoby się ułożyć test."
            }
          />
        </div>
      </div>
    );
  }

  const yearsText = describeYears(yearFrom, yearTo);
  const summaryLine = [describeSelection(tree, selected), kindOption.label, yearsText && `lata ${yearsText}`]
    .filter(Boolean)
    .join(" · ");

  let status: string;
  if (!selectionMade) status = "Zaznacz co najmniej jeden dział.";
  else if (!countValid) status = `Liczba pytań: wpisz liczbę od ${COUNT_LIMITS.min} do ${COUNT_LIMITS.max}.`;
  else if (counts.isError && !counts.data) status = "Nie udało się sprawdzić, ile jest pytań.";
  else if (!countsReady) status = "Liczę pytania…";
  else if (available === 0) status = "Brak takich pytań w wybranym zakresie.";
  else status = willDraw === available && asked > available ? `Wylosuję wszystkie ${formatCount(available)}` : `Wylosuję ${formatCount(willDraw)} z ${formatCount(available)}`;

  return (
    <div>
      {header}

      <div className="flex flex-col gap-6 px-4 pb-8 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
        <div className="flex min-w-0 flex-col gap-8">
          <ScopeTree
            tree={tree}
            selected={selected}
            onChange={setPicked}
            onSelectAll={() => setPicked(allSubjectIds(tree))}
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
            <div className="flex flex-wrap items-end gap-2">
              {COUNT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCountInput(String(preset))}
                  aria-pressed={asked === preset}
                  className={cn(
                    "inline-flex min-h-11 min-w-14 items-center justify-center rounded-xl border px-4 text-sm font-medium tabular-nums transition-colors",
                    asked === preset
                      ? "border-accent-ink bg-accent/10 text-fg"
                      : "border-line bg-surface text-fg hover:bg-surface-2"
                  )}
                >
                  {preset}
                </button>
              ))}
              <div className="w-32">
                <Field
                  label="Inna liczba"
                  type="number"
                  inputMode="numeric"
                  min={COUNT_LIMITS.min}
                  max={COUNT_LIMITS.max}
                  value={countInput}
                  onChange={(e) => setCountInput(e.target.value)}
                  aria-invalid={!countValid}
                />
              </div>
            </div>
            <p className="text-xs text-fg-muted">
              Od {COUNT_LIMITS.min} do {COUNT_LIMITS.max}. Gdy jest mniej pytań, dostaniesz wszystkie.
            </p>
          </fieldset>

          {years.length > 0 && (
            <details className="group rounded-2xl border border-line bg-surface" open={yearsText !== null}>
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-2 [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-medium">
                  Lata egzaminu
                  <span className="ml-2 font-normal text-fg-muted">{yearsText ?? "dowolne"}</span>
                </span>
                <ChevronDown size={18} aria-hidden="true" className="text-fg-muted transition-transform group-open:rotate-180" />
              </summary>
              <div className="flex flex-col gap-3 px-4 pb-4">
                <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
                  <YearSelect label="Od roku" years={years} value={yearFrom} onChange={changeFrom} />
                  <YearSelect label="Do roku" years={years} value={yearTo} onChange={changeTo} />
                </div>
                <p className="text-xs text-fg-muted">
                  Pytania autorskie nie mają roku egzaminu, więc przy wybranych latach nie wejdą do testu.
                  {yearsText !== null && (
                    <>
                      {" "}
                      <button
                        type="button"
                        onClick={() => {
                          setYearFrom(null);
                          setYearTo(null);
                        }}
                        className="inline-flex min-h-11 items-center text-accent-ink underline underline-offset-2"
                      >
                        Wyczyść lata
                      </button>
                    </>
                  )}
                </p>
              </div>
            </details>
          )}
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

function YearSelect({
  label,
  years,
  value,
  onChange,
}: {
  label: string;
  years: number[];
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-fg-muted">
      {label}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="min-h-11 rounded-xl border border-field bg-surface-2 px-3 text-fg"
      >
        <option value="">Dowolny</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </label>
  );
}
