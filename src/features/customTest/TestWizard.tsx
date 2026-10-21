import { useId, useMemo, useState, type RefObject } from "react";
import { ArrowLeft, ArrowRight, Landmark, Layers, PenLine, Play, Shuffle } from "lucide-react";
import { COUNT_CHOICES, EMPTY_SCOPE, type CustomTestCounts, type CustomTestKind, type CustomTestScope } from "../../api/customTest";
import { Dialog } from "../../components/ui/Dialog";
import { Skeleton } from "../../components/ui/Skeleton";
import { cn } from "../../lib/cn";
import { pluralizePl } from "../../lib/plural";
import { SOURCE_MODE_HINTS, SOURCE_MODE_LABELS, SOURCE_MODE_ORDER, type SourceMode } from "../../lib/sourceMode";
import { formatCount } from "../tests/format";
import { useTestCatalog } from "../tests/hooks";
import { START_BUTTON } from "../tests/StartButtons";
import { ChoiceCard } from "./ChoiceCard";
import { loadRemembered, saveRemembered } from "./customTestStorage";
import { useCustomTestCounts, useDebounced, useStartCustomTest } from "./hooks";
import { scopeOf, type CustomTestPrefill } from "./prefill";
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
import { WizardSteps } from "./WizardSteps";

/** „Nauka": pytania do wyboru (nowe, błędy, zmiany w prawie); „Powtórki": tylko pytania po terminie powtórki. */
export type WizardFlavor = "STUDY" | "REVIEW";

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
];

const DUE_KIND: KindOption = { kind: "DUE", label: "Zaległe powtórki", hint: "Po terminie powtórki", count: (c) => c.due };

const SOURCE_ICONS: Record<SourceMode, typeof Layers> = { ALL: Layers, MINISTRY: Landmark, AUTHORED: PenLine };

const questionsWord = (n: number) => pluralizePl(n, { one: "pytanie", few: "pytania", many: "pytań" });

const FIELD_TITLE = "text-sm font-semibold";

interface TestWizardProps {
  flavor: WizardFlavor;
  /** Ustawienia z zapisanego testu albo z Pulpitu: kreator otwiera się wtedy od razu na kroku 2. */
  prefill: CustomTestPrefill | null;
  onClose: () => void;
  returnFocusTo?: RefObject<HTMLElement | null>;
}

/**
 * Kreator testu w dwóch krokach (okno; na telefonie cały ekran). Krok 1 „Przepisy": źródło pytań (wszystkie, Ministerstwo
 * Sprawiedliwości, autorskie) i zakres (cała pula albo wybrane dziedziny, akty prawne i ich rozdziały). Krok 2 „Pytania i
 * start": które pytania (nowe, błędy, zmiany w prawie) i ile ich ma być. To nauka, nie egzamin: bez wyniku „zdał / nie zdał".
 * Każdy test zapisuje się w „Moich testach", a stamtąd można go ułożyć ponownie z tymi samymi ustawieniami (`prefill`).
 * Okno montuje się tylko wtedy, gdy jest otwarte, więc zawsze startuje od zapamiętanego wyboru albo od `prefill`.
 */
export function TestWizard({ flavor, prefill, onClose, returnFocusTo }: TestWizardProps) {
  const review = flavor === "REVIEW";
  const remembered = useMemo(() => loadRemembered(), []);
  const prefillScope = prefill ? scopeOf(prefill) : null;
  const prefillIsAll = prefillScope
    ? prefillScope.fieldIds.length + prefillScope.actIds.length + prefillScope.courseIds.length + prefillScope.sectionIds.length === 0
    : false;

  const [step, setStep] = useState<1 | 2>(prefill ? 2 : 1);
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
  const { start, starting, error, clearError } = useStartCustomTest();
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
    // prefill i remembered nie zmieniają się w czasie życia okna
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
  const canGoNext = !noScope && scope !== null && countsReady && (inScope ?? 0) > 0;
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
  const description = step === 1 ? "Skąd mają być pytania?" : review ? "Ile pytań powtórzyć?" : "Jakie pytania i ile?";

  let status: string;
  if (noScope) status = coursesMode ? "Zaznacz co najmniej jeden przedmiot lub akt." : "Zaznacz co najmniej jedną dziedzinę, akt lub rozdział.";
  else if (counts.isError && !counts.data) status = "Nie udało się sprawdzić, ile jest pytań.";
  else if (!countsReady) status = "Liczę pytania…";
  else if (review) status = `${formatCount(inScope ?? 0)} ${questionsWord(inScope ?? 0)} do powtórki w zakresie`;
  else status = `${formatCount(inScope ?? 0)} ${questionsWord(inScope ?? 0)} w zakresie`;

  return (
    <Dialog title={title} description={description} onClose={onClose} returnFocusTo={returnFocusTo} layout="wizard" closeOnBackdrop={false}>
      <WizardSteps step={step} labels={["Przepisy", "Pytania i start"]} />

      {step === 1 ? (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto border-t border-line px-5 py-5 sm:px-6" data-testid="wizard-step-1">
            <section aria-labelledby={`${groupName}-source`} className="flex flex-col gap-2.5">
              <h3 id={`${groupName}-source`} className={FIELD_TITLE}>
                Źródło pytań
              </h3>
              <div role="radiogroup" aria-labelledby={`${groupName}-source`} className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
            </section>

            <section aria-labelledby={`${groupName}-scope`} className="flex flex-col gap-2.5">
              <h3 id={`${groupName}-scope`} className={FIELD_TITLE}>
                Przepisy
              </h3>
              <div role="radiogroup" aria-labelledby={`${groupName}-scope`} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            </section>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-5 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" data-testid="wizard-scope-label">
                {scopeLabel}
              </p>
              <p className="text-xs text-fg-muted" aria-live="polite" data-testid="wizard-status">
                {status}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-surface-2 px-5 text-sm font-medium transition-colors hover:bg-line">
                Anuluj
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canGoNext}
                data-testid="wizard-next"
                className={cn(START_BUTTON, "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50")}
              >
                Dalej
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto border-t border-line md:grid-cols-[minmax(0,1fr)_20rem] md:overflow-hidden" data-testid="wizard-step-2">
            <div className="flex min-w-0 flex-col gap-7 px-5 py-5 sm:px-6 md:overflow-y-auto">
              {prefillMissing > 0 && (
                <p data-testid="prefill-notes" className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-fg-muted">
                  Część przepisów z tamtego testu nie jest teraz dostępna (inne źródło, inny zakres nauki albo ścieżka), więc jej nie
                  zaznaczyliśmy.
                </p>
              )}
              {!review && (
                <section aria-labelledby={`${kindName}-title`} className="flex flex-col gap-2.5">
                  <h3 id={`${kindName}-title`} className={FIELD_TITLE}>
                    Które pytania?
                  </h3>
                  <div role="radiogroup" aria-labelledby={`${kindName}-title`} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                </section>
              )}

              <section aria-labelledby={`${kindName}-count`} className="flex flex-col gap-2.5">
                <h3 id={`${kindName}-count`} className={FIELD_TITLE}>
                  Ile pytań?
                </h3>
                {countsReady && available > 0 ? (
                  <CountChips available={available} chosenKey={chosen?.key ?? null} onPick={setPickedCount} />
                ) : (
                  <p className="text-sm text-fg-muted">
                    {noScope
                      ? "Najpierw wybierz przepisy w kroku 1."
                      : countsReady
                        ? "W tym zakresie nie ma takich pytań. Wybierz inny rodzaj pytań albo zakres."
                        : "Liczę pytania…"}
                  </p>
                )}
              </section>

              <p className="flex items-center gap-2 text-sm text-fg-muted">
                <Shuffle size={16} aria-hidden="true" className="shrink-0" />
                Kolejność pytań i odpowiedzi jest losowa.
              </p>

              {error && (
                <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {error}
                </p>
              )}
            </div>

            <aside aria-labelledby={`${kindName}-summary`} className="flex flex-col gap-4 border-t border-line bg-canvas/40 px-5 py-5 sm:px-6 md:border-t-0 md:border-l md:overflow-y-auto">
              <h3 id={`${kindName}-summary`} className={FIELD_TITLE}>
                Twój test
              </h3>
              <dl className="flex flex-col gap-3.5 text-sm">
                <SummaryRow label="Rodzaj">{review ? "Powtórki" : "Nauka"}</SummaryRow>
                <SummaryRow label="Źródło" onChange={() => setStep(1)}>
                  {SOURCE_MODE_LABELS[source]}
                </SummaryRow>
                <SummaryRow label="Zakres" onChange={() => setStep(1)}>
                  {scopeLabel}
                </SummaryRow>
                <SummaryRow label="Pytania">{kindOption.label}</SummaryRow>
                <SummaryRow label="Liczba">
                  <span data-testid="wizard-count-summary">
                    {!countsReady || chosen === null
                      ? "…"
                      : chosen.all
                        ? `Wszystkie ${formatCount(available)}`
                        : `${formatCount(chosen.count)} z ${formatCount(available)}`}
                  </span>
                </SummaryRow>
              </dl>
              {counts.isError && !counts.data && (
                <button type="button" onClick={() => void counts.refetch()} className="inline-flex min-h-11 items-center self-start text-xs text-accent-ink underline underline-offset-2">
                  Spróbuj ponownie
                </button>
              )}
            </aside>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-surface px-5 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => {
                clearError();
                setStep(1);
              }}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-surface-2 px-4 text-sm font-medium transition-colors hover:bg-line"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Wstecz
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart}
              data-testid="wizard-start"
              className={cn(START_BUTTON, "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50")}
            >
              <Play size={16} aria-hidden="true" />
              {starting ? "Losuję pytania…" : "Zacznij test"}
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}

function SummaryRow({ label, onChange, children }: { label: string; onChange?: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="flex items-center justify-between gap-2 font-semibold">
        <span className="min-w-0">{children}</span>
        {onChange && (
          <button
            type="button"
            onClick={onChange}
            className="inline-flex min-h-11 shrink-0 cursor-pointer items-center px-1 text-[13px] font-semibold text-accent-ink hover:underline"
          >
            Zmień<span className="sr-only">: {label.toLowerCase()}</span>
          </button>
        )}
      </dd>
    </div>
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
