import { useId, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Landmark, Layers, PenLine, Play, Shuffle } from "lucide-react";
import { COUNT_CHOICES, EMPTY_SCOPE, type CustomTestCounts, type CustomTestKind, type CustomTestScope } from "../../api/customTest";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { SectionCard, SummaryRow } from "../../components/ui/SectionCard";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { pluralizePl } from "../../lib/plural";
import { SOURCE_MODE_HINTS, SOURCE_MODE_LABELS, SOURCE_MODE_ORDER, type SourceMode } from "../../lib/sourceMode";
import { Breadcrumbs } from "../tests/Breadcrumbs";
import { formatCount } from "../tests/format";
import { useTestCatalog } from "../tests/hooks";
import { QUIET_BUTTON, START_BUTTON } from "../tests/StartButtons";
import { ChoiceCard } from "./ChoiceCard";
import { loadRemembered, saveRemembered } from "./customTestStorage";
import { useCustomTestCounts, useDebounced, useStartCustomTest } from "./hooks";
import { readPrefill, scopeOf } from "./prefill";
import { ScopePicker } from "./ScopePicker";
import {
  buildTree,
  countOptions,
  describeSelection,
  everything,
  hasSelection,
  isCourseTree,
  isEverythingSelected,
  NOTHING,
  pickCountOption,
  restrictToTree,
  selectionFromScope,
  toScope,
  type Selection,
} from "./selection";

/** „Nauka": pytania do wyboru (nowe, błędy, zmiany w prawie, terminy, pułapki); „Powtórki": tylko pytania po terminie powtórki. */
export type BuilderFlavor = "STUDY" | "REVIEW";

interface KindOption {
  kind: CustomTestKind;
  label: string;
  hint: string;
  count: (counts: CustomTestCounts) => number;
}

const STUDY_KINDS: KindOption[] = [
  { kind: "ALL", label: "Wszystkie", hint: "Każde pytanie z zakresu", count: (c) => c.all },
  { kind: "NEW", label: "Nowe", hint: "Jeszcze nierozwiązywane", count: (c) => c.newQuestions },
  { kind: "MISTAKES", label: "Moje błędy", hint: "Ostatnia odpowiedź błędna", count: (c) => c.mistakes },
  { kind: "LAW_CHANGE", label: "Zmiany w prawie", hint: "Zmienione w ostatnim roku", count: (c) => c.lawChanges },
  { kind: "TIME_LIMIT", label: "Terminy", hint: "Pytania o terminy i okresy", count: (c) => c.timeLimits },
  { kind: "TRAPS", label: "Pułapki", hint: "Podchwytliwe sformułowania", count: (c) => c.traps },
];

const DUE_KIND: KindOption = { kind: "DUE", label: "Zaległe powtórki", hint: "Po terminie powtórki", count: (c) => c.due };

const SOURCE_ICONS: Record<SourceMode, typeof Layers> = { ALL: Layers, MINISTRY: Landmark, AUTHORED: PenLine };

const questionsWord = (n: number) => pluralizePl(n, { one: "pytanie", few: "pytania", many: "pytań" });

/**
 * Kreator testu „Nauka" i „Powtórki": jedna podstrona (Testy → Nauka). Po lewej wybór w czterech częściach: źródło pytań
 * (wszystkie, Ministerstwo Sprawiedliwości, autorskie), przepisy (cała pula albo wybrane dziedziny, akty i rozdziały), które
 * pytania (nowe, błędy, zmiany w prawie, terminy, pułapki) i ile ich ma być. Po prawej, przyklejone przy przewijaniu, podsumowanie „Twój test"
 * z przyciskiem startu; na telefonie przycisk jest w dolnym pasku. To nauka, nie egzamin: bez wyniku „zdał / nie zdał".
 * Każdy test zapisuje się w „Moich testach", a stamtąd można go ułożyć ponownie z tymi samymi ustawieniami (`prefill`
 * w stanie nawigacji; skróty z Pulpitu działają tak samo). Bez `prefill` strona startuje od zapamiętanego wyboru.
 */
export function TestBuilderPage({ flavor }: { flavor: BuilderFlavor }) {
  const review = flavor === "REVIEW";
  const location = useLocation();
  const [prefill] = useState(() => readPrefill(location.state));
  const remembered = useMemo(() => loadRemembered(), []);
  const prefillScope = prefill ? scopeOf(prefill) : null;
  const prefillIsAll = prefillScope
    ? prefillScope.fieldIds.length + prefillScope.actIds.length + prefillScope.courseIds.length + prefillScope.sectionIds.length === 0
    : false;

  const [source, setSource] = useState<SourceMode>(prefill?.source ?? remembered?.source ?? "ALL");
  const [scopeMode, setScopeMode] = useState<"all" | "selected">(
    prefill ? (prefillIsAll ? "all" : "selected") : remembered && !remembered.all ? "selected" : "all"
  );
  // null = użytkownik jeszcze nic nie zmieniał: pokazujemy wybór z `prefill` albo zapamiętany, w świetle bieżącego drzewa.
  const [picked, setPicked] = useState<Selection | null>(null);
  const [studyKind, setStudyKind] = useState<CustomTestKind>(
    prefill && prefill.kind !== "DUE" ? prefill.kind : (remembered?.kind !== "DUE" ? remembered?.kind : undefined) ?? "ALL"
  );
  // null = użytkownik nie wybierał: bierzemy liczbę z `prefill` albo zapamiętaną (a bez nich 20) spośród tych, które się mieszczą.
  const [pickedCount, setPickedCount] = useState<string | null>(null);
  const { start, starting, error } = useStartCustomTest();
  const groupName = useId();
  const kindName = useId();

  const kind: CustomTestKind = review ? "DUE" : studyKind;
  const kindOption = review ? DUE_KIND : (STUDY_KINDS.find((option) => option.kind === kind) ?? STUDY_KINDS[0]);

  // Drzewo przepisów dla wybranego źródła (akty bez pytań z tego źródła znikają).
  const catalog = useTestCatalog(source);
  const tree = useMemo(() => buildTree(catalog.data), [catalog.data]);
  const coursesMode = isCourseTree(tree);

  const initialSelection = useMemo<Selection>(() => {
    if (prefillScope && !prefillIsAll) return selectionFromScope(tree, prefillScope).selection;
    if (remembered && !remembered.all) {
      return restrictToTree(tree, { acts: new Set(remembered.actIds), sections: new Set(remembered.sectionIds) });
    }
    return NOTHING;
    // prefill i remembered nie zmieniają się w czasie życia strony
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);
  // Ile pozycji z zapisanego testu nie da się odtworzyć w obecnym drzewie (ma sens dopiero, gdy drzewo się wczytało).
  const prefillMissing =
    prefillScope && !prefillIsAll && picked === null && tree.length > 0 ? selectionFromScope(tree, prefillScope).missing : 0;
  const selection = scopeMode === "all" ? everything(tree) : restrictToTree(tree, picked ?? initialSelection);
  const selectionMade = hasSelection(selection);
  const scope = scopeMode === "all" ? EMPTY_SCOPE : tree.length > 0 && selectionMade ? toScope(tree, selection) : null;

  // Zapytanie o liczby idzie z opóźnieniem (przy szybkim klikaniu serwer dostaje jedno pytanie); porównujemy napisy, bo
  // obiekty zakresu powstają od nowa przy każdym rysowaniu.
  const requestKey = JSON.stringify(scope ? { scope, source } : null);
  const debouncedKey = useDebounced(requestKey, 250);
  const settled = debouncedKey === requestKey;
  const debounced = JSON.parse(debouncedKey) as { scope: CustomTestScope; source: SourceMode } | null;
  const counts = useCustomTestCounts(debounced?.scope ?? null, debounced?.source ?? "ALL");
  const countsReady = settled && counts.data !== undefined && !counts.isPlaceholderData;

  // Liczby przy kartach źródeł: cała pula w każdym z nich (Powtórki: ile z nich czeka na powtórkę).
  const sourceTotals: Record<SourceMode, number | null> = {
    ALL: useCustomTestCounts(EMPTY_SCOPE, "ALL").data?.[review ? "due" : "all"] ?? null,
    MINISTRY: useCustomTestCounts(EMPTY_SCOPE, "MINISTRY").data?.[review ? "due" : "all"] ?? null,
    AUTHORED: useCustomTestCounts(EMPTY_SCOPE, "AUTHORED").data?.[review ? "due" : "all"] ?? null,
  };

  const available = counts.data ? kindOption.count(counts.data) : 0;
  const inScope = counts.data ? (review ? counts.data.due : counts.data.all) : null;
  const options = useMemo(() => (countsReady ? countOptions(available) : []), [countsReady, available]);
  const wanted: number | "all" | null = prefill ? prefill.requestedCount : (remembered?.questionCount ?? null);
  const chosen = useMemo(() => {
    const own = pickedCount !== null ? options.find((o) => o.key === pickedCount) : undefined;
    return own ?? pickCountOption(options, wanted);
  }, [options, pickedCount, wanted]);

  const scopeLabel = scopeMode === "all" ? "Cała pula" : describeSelection(tree, selection);
  const everythingChosen = scopeMode === "all" || isEverythingSelected(tree, selection);
  const noScope = scopeMode === "selected" && !selectionMade;
  const canStart = scope !== null && countsReady && available > 0 && chosen !== null && !starting;

  function changeSource(next: SourceMode) {
    setSource(next);
    setPickedCount(null);
  }

  async function handleStart() {
    if (!canStart || scope === null || chosen === null) return;
    const ok = await start({ scope, source, kind, questionCount: chosen.sends });
    if (ok) {
      saveRemembered({
        version: 4,
        source,
        all: everythingChosen,
        actIds: everythingChosen ? [] : Array.from(selection.acts),
        sectionIds: everythingChosen ? [] : Array.from(selection.sections),
        kind: review ? (remembered?.kind ?? "ALL") : kind,
        questionCount: chosen.all ? "all" : chosen.count,
      });
    }
  }

  const title = review ? "Powtórki" : "Nauka";

  let status: string;
  if (noScope) status = coursesMode ? "Zaznacz co najmniej jeden przedmiot lub akt." : "Zaznacz co najmniej jedną dziedzinę, akt lub rozdział.";
  else if (counts.isError && !counts.data) status = "Nie udało się sprawdzić, ile jest pytań.";
  else if (!countsReady) status = "Liczę pytania…";
  else if (review) status = `${formatCount(inScope ?? 0)} ${questionsWord(inScope ?? 0)} do powtórki w zakresie`;
  else status = `${formatCount(inScope ?? 0)} ${questionsWord(inScope ?? 0)} w zakresie`;

  const countLabel = chosen === null ? "…" : chosen.all ? `Wszystkie ${formatCount(available)}` : `${formatCount(chosen.count)} z ${formatCount(available)}`;
  const startLabel = starting ? "Losuję pytania…" : "Zacznij test";

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Testy", to: ROUTES.tests }, { label: title }]} />
      <PageHeader
        title={title}
        subtitle={
          review
            ? "Pytania, którym minął termin powtórki. Wybierz źródło i zakres."
            : "Wybierz źródło pytań, przepisy i rodzaj pytań. Po każdej odpowiedzi zobaczysz wyjaśnienie."
        }
      />

      <div className="grid grid-cols-1 gap-5 px-4 pb-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-col gap-5" data-testid="builder-form">
          {prefillMissing > 0 && (
            <p data-testid="prefill-notes" className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-fg-muted">
              Część przepisów z tamtego testu nie jest teraz dostępna (inne źródło, inny zakres nauki albo ścieżka), więc jej nie
              zaznaczyliśmy.
            </p>
          )}

          <SectionCard title="Źródło pytań" data-testid="builder-source">
            <div role="radiogroup" aria-label="Źródło pytań" className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {SOURCE_MODE_ORDER.map((mode) => {
                const Icon = SOURCE_ICONS[mode];
                const total = sourceTotals[mode];
                return (
                  <ChoiceCard
                    key={mode}
                    name={`${groupName}-source`}
                    checked={source === mode}
                    onChange={() => changeSource(mode)}
                    disabled={total === 0 && source !== mode}
                    className="md:items-start"
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-3 md:flex-col md:items-start md:gap-2.5">
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
                          source === mode ? "bg-accent/15 text-accent-ink" : "bg-surface-2 text-fg-muted"
                        )}
                      >
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">{SOURCE_MODE_LABELS[mode]}</span>
                        <span className="block text-xs text-fg-muted">
                          {total === null
                            ? SOURCE_MODE_HINTS[mode]
                            : total === 0
                              ? review
                                ? "Nic do powtórki."
                                : "Brak pytań."
                              : `${formatCount(total)} ${questionsWord(total)}${review ? " do powtórki" : ""}. ${SOURCE_MODE_HINTS[mode]}`}
                        </span>
                      </span>
                    </span>
                  </ChoiceCard>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Przepisy" data-testid="builder-scope">
            <div role="radiogroup" aria-label="Przepisy" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ChoiceCard name={`${groupName}-scope`} checked={scopeMode === "all"} onChange={() => setScopeMode("all")} className="min-h-13 rounded-[14px] py-0">
                <span className="flex-1 text-sm font-semibold">Cała pula</span>
              </ChoiceCard>
              <ChoiceCard name={`${groupName}-scope`} checked={scopeMode === "selected"} onChange={() => setScopeMode("selected")} className="min-h-13 rounded-[14px] py-0">
                <span className="flex-1 text-sm font-semibold">Wybrane przepisy</span>
              </ChoiceCard>
            </div>

            {scopeMode === "selected" &&
              (catalog.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : catalog.isError ? (
                <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  Nie udało się pobrać listy przepisów.{" "}
                  <button type="button" onClick={() => void catalog.refetch()} className="underline">
                    Spróbuj ponownie
                  </button>
                </p>
              ) : tree.length === 0 ? (
                <p className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-fg-muted">
                  W tym źródle nie ma pytań z Twojego zakresu nauki. Wybierz inne źródło.
                </p>
              ) : (
                <ScopePicker key={source} tree={tree} selection={selection} onChange={setPicked} courses={coursesMode} />
              ))}
          </SectionCard>

          {!review && (
            <SectionCard title="Które pytania?" data-testid="builder-kind">
              <div role="radiogroup" aria-label="Które pytania" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {STUDY_KINDS.map((option) => {
                  const total = counts.data ? option.count(counts.data) : null;
                  return (
                    <ChoiceCard
                      key={option.kind}
                      name={kindName}
                      checked={kind === option.kind}
                      onChange={() => {
                        setStudyKind(option.kind);
                        setPickedCount(null);
                      }}
                      className="min-h-[68px] rounded-[14px]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{option.label}</span>
                        <span className="block text-xs text-fg-muted">{option.hint}</span>
                      </span>
                      <span className={cn("text-sm font-semibold tabular-nums", kind === option.kind ? "text-accent-ink" : "text-fg-muted")}>
                        {total === null ? "…" : formatCount(total)}
                        <span className="sr-only"> {questionsWord(total ?? 0)}</span>
                      </span>
                    </ChoiceCard>
                  );
                })}
              </div>
            </SectionCard>
          )}

          <SectionCard title="Ile pytań?" data-testid="builder-count">
            {countsReady && available > 0 ? (
              <CountChips available={available} chosenKey={chosen?.key ?? null} onPick={setPickedCount} />
            ) : (
              <p className="text-sm text-fg-muted">
                {noScope
                  ? "Najpierw wybierz przepisy."
                  : countsReady
                    ? "W tym zakresie nie ma takich pytań. Wybierz inny rodzaj pytań albo zakres."
                    : "Liczę pytania…"}
              </p>
            )}
            <p className="flex items-center gap-2 text-sm text-fg-muted">
              <Shuffle size={16} aria-hidden="true" className="shrink-0" />
              Kolejność pytań i odpowiedzi jest losowa.
            </p>
          </SectionCard>
        </div>

        <aside aria-labelledby={`${kindName}-summary`} className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6" data-testid="builder-summary">
          <Card className="flex flex-col gap-4 p-5">
            <h2 id={`${kindName}-summary`} className="text-base font-semibold">
              Twój test
            </h2>
            <dl className="flex flex-col gap-3.5 text-sm">
              <SummaryRow label="Rodzaj">{review ? "Powtórki" : "Nauka"}</SummaryRow>
              <SummaryRow label="Źródło">{SOURCE_MODE_LABELS[source]}</SummaryRow>
              <SummaryRow label="Zakres">
                <span data-testid="builder-scope-label">{scopeLabel}</span>
              </SummaryRow>
              <SummaryRow label="Pytania">{kindOption.label}</SummaryRow>
              <SummaryRow label="Liczba">
                <span data-testid="builder-count-summary">{countLabel}</span>
              </SummaryRow>
            </dl>

            <p className="text-sm text-fg-muted" aria-live="polite" data-testid="builder-status">
              {status}
            </p>

            {counts.isError && !counts.data && (
              <button type="button" onClick={() => void counts.refetch()} className="inline-flex min-h-11 items-center self-start text-xs text-accent-ink underline underline-offset-2">
                Spróbuj ponownie
              </button>
            )}

            {error && (
              <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void handleStart()}
                disabled={!canStart}
                data-testid="builder-start"
                className={cn(START_BUTTON, "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 max-lg:hidden")}
              >
                <Play size={16} aria-hidden="true" />
                {startLabel}
              </button>
              <Link to={ROUTES.tests} data-testid="builder-cancel" className={QUIET_BUTTON}>
                Anuluj
              </Link>
            </div>
          </Card>
        </aside>
      </div>

      {/* Telefon i tablet: podsumowanie jest pod formularzem, a start zawsze pod kciukiem. `bottom-0` liczy się od wnętrza przewijanego
          obszaru, który ma już odstęp na dolne menu, więc pasek siedzi tuż nad menu. */}
      <div className="sticky bottom-0 z-10 border-t border-line bg-surface px-4 py-3 sm:px-8 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm text-fg-muted" data-testid="builder-bar-status">
            {canStart && chosen ? `${chosen.all ? "Wszystkie" : formatCount(chosen.count)} ${questionsWord(chosen.all ? available : chosen.count)}` : status}
          </p>
          <button
            type="button"
            onClick={() => void handleStart()}
            disabled={!canStart}
            data-testid="builder-start-bar"
            className={cn(START_BUTTON, "shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50")}
          >
            <Play size={16} aria-hidden="true" />
            {startLabel}
          </button>
        </div>
      </div>
    </PageContainer>
  );
}

/**
 * Liczby pytań: 10, 20, 50, 100, 150 (te, na które nie starcza pytań, są wyszarzone) oraz „Wszystkie (N)", gdy N nie wypada
 * na żadną z nich. Przy mniej niż 10 pytaniach jest tylko „Wszystkie (N)".
 */
function CountChips({ available, chosenKey, onPick }: { available: number; chosenKey: string | null; onPick: (key: string) => void }) {
  const enabled = countOptions(available);
  const allOption = enabled.find((option) => option.all);
  const tooMany = COUNT_CHOICES.filter((choice) => choice > available);
  const list =
    available < COUNT_CHOICES[0]
      ? enabled
      : [
          ...COUNT_CHOICES.map((choice) => ({
            key: String(choice),
            label: String(choice),
            disabled: choice > available,
          })),
          ...(allOption ? [{ key: allOption.key, label: allOption.label, disabled: false }] : []),
        ];

  return (
    <>
      <div role="group" aria-label="Liczba pytań" className="flex flex-wrap gap-2" data-testid="count-options">
        {list.map((option) => {
          const disabled = "disabled" in option && option.disabled;
          const active = chosenKey === option.key;
          return (
            <button
              key={option.key}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onPick(option.key)}
              className={cn(
                "inline-flex min-h-11 min-w-14 cursor-pointer items-center justify-center rounded-full border px-4 text-sm tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink",
                active ? "border-accent bg-accent/10 font-bold text-accent-ink" : "border-line bg-surface font-medium text-fg hover:bg-surface-2",
                disabled && "cursor-not-allowed border-dashed border-line bg-transparent text-fg-muted/70 hover:bg-transparent"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {tooMany.length > 0 && available >= COUNT_CHOICES[0] && (
        <p className="text-xs text-fg-muted">
          W tym zakresie jest {formatCount(available)} {questionsWord(available)}, więc{" "}
          {tooMany.join(", ")} {tooMany.length === 1 ? "nie jest dostępne" : "nie są dostępne"}.
        </p>
      )}
    </>
  );
}
