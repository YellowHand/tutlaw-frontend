import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import {
  getTestQueue,
  submitTestAnswer,
  getAvailableNewCardsCount,
  type TestQueueItem,
  type TestAnswerResult,
} from "../api/review";
import { getLearningSettings } from "../api/settings";
import { Skeleton } from "../components/ui/Skeleton";
import { cn } from "../lib/cn";
import { ROUTES } from "../config/routes";
import { useRefreshReviewDataOnExit } from "../features/review/hooks";
import { isTyping } from "../features/review/keyboard";
import { LegalBasisLine } from "../features/review/LegalBasisLine";
import { BacklogFinishNotice, BacklogNotice } from "../features/review/BacklogNotice";
import { KeyboardHint } from "../features/review/KeyboardHint";
import { EXTRA_DUE_BATCH, useBacklog } from "../features/review/useBacklog";
import { ReportCardButton } from "../features/report/ReportCardButton";
import { LeechHint } from "../features/difficult/LeechHint";
import { SuspendCardButton } from "../features/difficult/SuspendCardButton";
import { SessionLoadError } from "../features/review/SessionLoadError";
import { loadErrorMessage } from "../lib/errors";
import {
  OPTION_KEYS,
  displayKeyOf,
  originalKeyOf,
  chooseOptionOrder,
  type OptionKey,
  type OptionOrder,
} from "../features/tests/shuffle";

const MAX_EXTRA_BATCH = 10;

/** Pytanie z kolejnością odpowiedzi ustaloną na czas sesji (losową albo z bazy, gdy pytanie odwołuje się do innych odpowiedzi). */
type TestQuestion = TestQueueItem & { order: OptionOrder };

/**
 * Nadaje pytaniom kolejność odpowiedzi. Przy każdym nowym ułożeniu kolejki losujemy od nowa,
 * chyba że użytkownik wyłączył mieszanie w ustawieniach nauki (wtedy zawsze kolejność z bazy).
 */
function prepareQuestions(items: TestQueueItem[], shuffle: boolean): TestQuestion[] {
  return items.map((item) => ({
    ...item,
    order: chooseOptionOrder([item.optionA, item.optionB, item.optionC], shuffle),
  }));
}

function optionText(question: TestQueueItem, originalKey: OptionKey): string {
  return originalKey === "A" ? question.optionA : originalKey === "B" ? question.optionB : question.optionC;
}

type OptionState = "idle" | "pending" | "correct" | "wrong" | "dimmed";

/** Jedno już rozwiązane pytanie – trzymane tylko w pamięci strony, do podglądu. */
type HistoryEntry = { question: TestQuestion; selected: OptionKey; result: TestAnswerResult; guessed: boolean };

/** Skróty klawiszowe: A/B/C albo 1/2/3 wybierają odpowiedź. */
const KEY_TO_OPTION: Record<string, OptionKey> = {
  a: "A",
  b: "B",
  c: "C",
  "1": "A",
  "2": "B",
  "3": "C",
};

/**
 * Wygląd odpowiedzi w poszczególnych stanach – kolory z palety strony.
 * Pełne nazwy klas muszą zostać w stringach, żeby Tailwind v4 je wykrył.
 */
const OPTION_STYLES: Record<OptionState, { button: string; badge: string }> = {
  idle: {
    button: "cursor-pointer border-line bg-surface hover:bg-surface-2",
    badge: "border-line text-fg-muted group-hover:border-accent/60 group-hover:text-accent",
  },
  pending: {
    button: "border-accent bg-accent/10",
    badge: "border-accent bg-accent text-accent-fg",
  },
  correct: {
    button: "border-success/60 bg-success/10",
    badge: "border-success bg-success text-canvas",
  },
  wrong: {
    button: "border-danger/60 bg-danger/10",
    badge: "border-danger bg-danger text-canvas",
  },
  // 70% zamiast 50% – wyjaśnienie często odnosi się do pozostałych odpowiedzi, muszą być czytelne.
  dimmed: {
    button: "border-line bg-surface opacity-70",
    badge: "border-line text-fg-muted",
  },
};

// Ta sama kolumna i to samo zakotwiczenie co w StudySessionPage – przełączanie Testy ↔ Fiszki nic nie przeskakuje.
const PAGE_SHELL = "mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pt-6 sm:p-6 sm:pt-[8vh]";

const NAV_BUTTON =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const PRIMARY_BUTTON =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-medium text-accent-fg hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** 1 pytanie, 2–4 pytania, 5+ pytań (biernik) */
function pytaniaForm(n: number) {
  if (n === 1) return "pytanie";
  const lastTwo = n % 100;
  const last = n % 10;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return "pytania";
  return "pytań";
}

interface QuestionBodyProps {
  question: TestQuestion;
  selected: OptionKey | null;
  result: TestAnswerResult | null;
  /** Podgląd poprzedniego pytania – odpowiedzi są zablokowane. */
  readOnly?: boolean;
  saveError?: boolean;
  onSelect?: (option: OptionKey) => void;
  /** „Nie jestem pewien" – widoczne tylko, zanim użytkownik odpowie. */
  guessed?: boolean;
  onGuessedChange?: (guessed: boolean) => void;
  /** Pytania zawieszone w tej sesji (do stanu przycisku „Zawieś pytanie" także w podglądzie). */
  suspendedIds?: ReadonlySet<number>;
  onSuspended?: (cardId: number) => void;
  footer?: ReactNode;
}

/** Pytanie + odpowiedzi + wyjaśnienie. Ten sam wygląd dla bieżącego pytania i dla podglądu. */
function QuestionBody({
  question,
  selected,
  result,
  readOnly = false,
  saveError = false,
  onSelect,
  guessed = false,
  onGuessedChange,
  suspendedIds,
  onSuspended,
  footer,
}: QuestionBodyProps) {
  // Litery A/B/C to pozycje na ekranie. Oryginalny klucz odpowiedzi (z bazy) wraca do serwera i z serwera.
  const options = OPTION_KEYS.map((key, index) => ({ key, text: optionText(question, question.order[index]) }));
  const correctDisplayKey = result ? displayKeyOf(question.order, result.correctOption) : null;

  return (
    <div className="flex flex-col gap-4 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none">
      {/* Pytanie */}
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <p className="text-pretty text-lg font-semibold leading-snug text-fg sm:text-xl">{question.front}</p>
      </div>

      {/* Odpowiedzi */}
      <div role="group" aria-label="Odpowiedzi" className="flex flex-col gap-3">
        {options.map((option) => {
          const isSelected = selected === option.key;
          const isCorrectOption = correctDisplayKey === option.key;

          let state: OptionState = "idle";
          if (result) {
            if (isCorrectOption) state = "correct";
            else if (isSelected && !result.correct) state = "wrong";
            else state = "dimmed";
          } else if (selected) {
            state = isSelected ? "pending" : "dimmed";
          }

          const styles = OPTION_STYLES[state];

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelect?.(option.key)}
              disabled={readOnly || !!selected}
              className={cn(
                "group flex min-h-14 w-full items-center gap-4 rounded-xl border px-4 py-3 text-left text-base leading-snug text-fg transition-colors sm:px-5",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                styles.button
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  styles.badge
                )}
              >
                {option.key}
              </span>
              <span className="flex-1">{option.text}</span>
              {state === "correct" && <CheckCircle2 className="shrink-0 text-success" size={20} aria-hidden="true" />}
              {state === "wrong" && <XCircle className="shrink-0 text-danger" size={20} aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {/* Pewność odpowiedzi: poprawna, ale zgadywana odpowiedź wróci wcześniej niż pewna. */}
      {!readOnly && !selected && !result && onGuessedChange && (
        <button
          type="button"
          role="switch"
          aria-checked={guessed}
          onClick={() => onGuessedChange(!guessed)}
          title="Nie jestem pewien (G)"
          className="inline-flex min-h-11 cursor-pointer items-center gap-3 self-start rounded-lg pr-3 text-sm text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span
            aria-hidden="true"
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
              guessed ? "border-accent bg-accent/20" : "border-line bg-surface-2"
            )}
          >
            <span
              className={cn(
                "absolute size-3.5 rounded-full transition-all",
                guessed ? "left-[18px] bg-accent" : "left-0.5 bg-fg-muted"
              )}
            />
          </span>
          Nie jestem pewien
        </button>
      )}

      {saveError && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          Nie udało się zapisać odpowiedzi. Spróbuj ponownie.
        </p>
      )}

      {/* Wynik + wyjaśnienie – neutralny panel, kolor tylko w nagłówku */}
      {result && (
        <div
          role="status"
          className="rounded-2xl border border-line bg-surface-2 p-4 transition-opacity duration-200 starting:opacity-0 sm:p-5"
        >
          <p className={cn("mb-1 text-sm font-semibold", result.correct ? "text-success" : "text-danger")}>
            {result.correct ? "Poprawnie!" : "Niepoprawnie"}
          </p>
          <p className="mb-2 text-sm text-fg-muted">
            {result.correct && !guessed && "Zapisano jako „Znam”."}
            {result.correct && guessed && "Zaznaczone jako niepewne: zapisano jako „Nie pamiętam”, pytanie wróci w powtórkach."}
            {!result.correct && "Zapisano jako „Nie pamiętam”: pytanie wróci w powtórkach."}
          </p>
          {result.explanation?.trim() && <p className="text-base leading-relaxed text-fg">{result.explanation}</p>}
          <LegalBasisLine
            legalBasis={result.legalBasis}
            validAsOf={result.validAsOf}
            className="mt-3 text-sm text-fg-muted"
          />
          {result.leech && <LeechHint kind="test" lapses={result.lapses} className="mt-3 text-sm text-fg-muted" />}
        </div>
      )}

      {result && (
        <div className="flex flex-wrap items-center gap-x-4 self-start">
          <ReportCardButton key={question.cardId} cardId={question.cardId} />
          {result.leech && (
            <SuspendCardButton
              key={`suspend:${question.cardId}`}
              cardId={question.cardId}
              alreadySuspended={suspendedIds?.has(question.cardId)}
              onSuspended={onSuspended}
            />
          )}
        </div>
      )}

      {footer}
    </div>
  );
}

export function TestSessionPage() {
  const { subjectId } = useParams();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get("sourceId");
  const categoryId = searchParams.get("categoryId");
  const navigate = useNavigate();
  useRefreshReviewDataOnExit();

  const [queue, setQueue] = useState<TestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [result, setResult] = useState<TestAnswerResult | null>(null);
  const [guessed, setGuessed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [extraError, setExtraError] = useState(false);
  const [availableExtra, setAvailableExtra] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // Po „Rozwiąż jeszcze" / „Powtórz jeszcze" / „Powtórz teraz" sesja jest dodatkową porcją: informacja o zaległościach z początku nie dotyczy.
  const [isExtraBatch, setIsExtraBatch] = useState(false);
  // null = bieżące pytanie; liczba = indeks w history (podgląd tylko do odczytu)
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  // Ustawiane przy każdym wczytaniu pytania; początkowe 0 nigdy nie trafia do backendu.
  const questionShownAt = useRef<number>(0);
  const pausedAtRef = useRef<number | null>(null);
  const fetchedKeyRef = useRef<string | null>(null);
  // Numer ostatniego zapytania o kolejkę: spóźniona odpowiedź na starsze zapytanie jest ignorowana.
  const requestRef = useRef(0);
  // Czy mieszać kolejność odpowiedzi (ustawienie użytkownika, domyślnie tak); wczytywane razem z pierwszą kolejką.
  const shuffleRef = useRef(true);
  // Pytania zawieszone w tej sesji: nie wracają w „Powtórz teraz".
  const [suspendedIds, setSuspendedIds] = useState<ReadonlySet<number>>(() => new Set());
  const handleSuspended = useCallback((cardId: number) => {
    setSuspendedIds((prev) => new Set(prev).add(cardId));
  }, []);

  const numericSubjectId = subjectId ? Number(subjectId) : undefined;
  const numericSourceId = sourceId ? Number(sourceId) : undefined;
  const numericCategoryId = categoryId ? Number(categoryId) : undefined;
  const finished = !loading && !loadError && currentIndex >= queue.length;
  const backlog = useBacklog({
    mode: "TEST",
    subjectId: numericSubjectId,
    sourceId: numericSourceId,
    categoryId: numericCategoryId,
  });
  const refetchBacklog = backlog.refetch;

  useEffect(() => {
    // Bez subjectId i categoryId (trasa /app/test) test obejmuje cały materiał użytkownika.
    const key = `${subjectId ?? "all"}:${sourceId ?? ""}:${categoryId ?? ""}:${reloadCount}`;
    if (fetchedKeyRef.current === key) return;
    fetchedKeyRef.current = key;

    const requestId = ++requestRef.current;
    setLoading(true);
    setLoadError(null);
    // Gdy nie uda się wczytać ustawień, mieszamy (zachowanie domyślne); to nie powód, żeby blokować test.
    const shuffleSetting = getLearningSettings()
      .then((settings) => settings.shuffleOptions)
      .catch(() => true);
    Promise.all([getTestQueue(numericSubjectId, numericSourceId, undefined, numericCategoryId), shuffleSetting])
      .then(([items, shuffle]) => {
        if (requestRef.current !== requestId) return;
        shuffleRef.current = shuffle;
        setQueue(prepareQuestions(items, shuffle));
        setCurrentIndex(0);
        setSelected(null);
        setResult(null);
        setGuessed(false);
        setCorrectCount(0);
        setSaveError(false);
        setExtraError(false);
        setIsExtraBatch(false);
        setHistory([]);
        setViewIndex(null);
        pausedAtRef.current = null;
        setLoading(false);
        questionShownAt.current = Date.now();
      })
      .catch((e: unknown) => {
        if (requestRef.current !== requestId) return;
        setLoadError(loadErrorMessage(e, "pytań"));
        setLoading(false);
      });
  }, [subjectId, sourceId, categoryId, reloadCount, numericSubjectId, numericSourceId, numericCategoryId]);

  useEffect(() => {
    if (loading || loadError || currentIndex < queue.length) return;
    // Gdy nie uda się sprawdzić, ile jest nowych pytań, po prostu nie pokazujemy przycisku „Rozwiąż jeszcze".
    getAvailableNewCardsCount(numericSubjectId, numericSourceId, numericCategoryId)
      .then(setAvailableExtra)
      .catch(() => setAvailableExtra(0));
  }, [loading, loadError, currentIndex, queue.length, numericSubjectId, numericSourceId, numericCategoryId]);

  // Na końcu sesji (i po każdej nowej kolejce) pytamy o zaległości jeszcze raz: ile zostało na kolejne dni.
  useEffect(() => {
    if (finished) void refetchBacklog();
  }, [finished, queue, refetchBacklog]);

  const handleSelect = useCallback(
    async (option: OptionKey) => {
      const currentCard = queue[currentIndex];
      if (!currentCard || selected) return;

      setSaveError(false);
      setSelected(option);

      const timeSpentSeconds = Math.max(0, (Date.now() - questionShownAt.current) / 1000);

      try {
        // Serwer zna odpowiedzi pod oryginalnymi kluczami, więc literę z ekranu zamieniamy z powrotem.
        const res = await submitTestAnswer(
          currentCard.cardId,
          originalKeyOf(currentCard.order, option),
          timeSpentSeconds,
          guessed
        );
        setResult(res);
        if (res.correct) setCorrectCount((prev) => prev + 1);
      } catch {
        // Bez tego po błędzie sieci wszystkie odpowiedzi zostałyby zablokowane na stałe.
        setSelected(null);
        setSaveError(true);
      }
    },
    [queue, currentIndex, selected, guessed]
  );

  const handleNext = useCallback(() => {
    const answeredQuestion = queue[currentIndex];
    if (answeredQuestion && selected && result) {
      setHistory((prev) => [...prev, { question: answeredQuestion, selected, result, guessed }]);
    }

    setSelected(null);
    setResult(null);
    setGuessed(false);
    setSaveError(false);
    setCurrentIndex((prev) => prev + 1);
    questionShownAt.current = Date.now();
  }, [queue, currentIndex, selected, result, guessed]);

  // --- Cofanie: tylko podgląd, niczego nie wysyła do backendu ---

  const goBack = useCallback(() => {
    if (viewIndex === null) {
      if (history.length === 0) return;
      pausedAtRef.current = Date.now();
      setViewIndex(history.length - 1);
    } else if (viewIndex > 0) {
      setViewIndex(viewIndex - 1);
    }
  }, [viewIndex, history.length]);

  const resumeLive = useCallback(() => {
    // Czas spędzony w podglądzie nie liczy się do czasu odpowiedzi na bieżące pytanie.
    if (pausedAtRef.current !== null) {
      questionShownAt.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
    setViewIndex(null);
  }, []);

  const goForward = useCallback(() => {
    if (viewIndex === null) return;

    if (viewIndex >= history.length - 1) resumeLive();
    else setViewIndex(viewIndex + 1);
  }, [viewIndex, history.length, resumeLive]);

  // Skróty: A/B/C lub 1/2/3 – wybór odpowiedzi, G – „nie jestem pewien", Enter – następne pytanie, ←/→ – poprzednie/następne. Spacja nic nie robi.
  useEffect(() => {
    if (loading) return;
    if (finished && viewIndex === null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goForward();
        return;
      }

      if (e.repeat || viewIndex !== null) return;

      if (result) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleNext();
        }
        return;
      }

      if (selected) return;

      if (e.key.toLowerCase() === "g") {
        e.preventDefault();
        setGuessed((prev) => !prev);
        return;
      }

      const option = KEY_TO_OPTION[e.key.toLowerCase()];
      if (option) {
        e.preventDefault();
        void handleSelect(option);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, finished, viewIndex, selected, result, handleSelect, handleNext, goBack, goForward]);

  /** Wczytuje dodatkową porcję pytań (nowe albo zaległe ponad limit) i zaczyna z nią nową sesję. */
  async function startExtraBatch(load: () => Promise<TestQueueItem[]>) {
    setLoading(true);
    setExtraError(false);
    try {
      const extraItems = await load();

      setQueue(prepareQuestions(extraItems, shuffleRef.current));
      setCurrentIndex(0);
      setSelected(null);
      setResult(null);
      setGuessed(false);
      setCorrectCount(0);
      setSaveError(false);
      setHistory([]);
      setViewIndex(null);
      pausedAtRef.current = null;
      setAvailableExtra(null);
      setIsExtraBatch(true);
      questionShownAt.current = Date.now();
    } catch {
      setExtraError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleStudyMore() {
    if (!availableExtra) return;
    const batchSize = Math.min(MAX_EXTRA_BATCH, availableExtra);
    void startExtraBatch(() => getTestQueue(numericSubjectId, numericSourceId, batchSize, numericCategoryId));
  }

  /** „Powtórz jeszcze": kolejna porcja zaległych pytań ponad dzienny limit (bez nowych pytań). */
  function handleExtraDue(batch: number) {
    void startExtraBatch(() => getTestQueue(numericSubjectId, numericSourceId, 0, numericCategoryId, batch));
  }

  // Pytania, które wrócą w powtórkach: błędne albo oznaczone jako „Nie jestem pewien". Zawieszone w tej sesji odpadają.
  const toReview = history
    .filter((h) => (!h.result.correct || h.guessed) && !suspendedIds.has(h.question.cardId))
    .map((h) => h.question);

  function handleRepeatMistakes() {
    if (toReview.length === 0) return;

    setQueue(prepareQuestions(toReview, shuffleRef.current));
    setIsExtraBatch(true);
    setCurrentIndex(0);
    setSelected(null);
    setResult(null);
    setGuessed(false);
    setCorrectCount(0);
    setSaveError(false);
    setHistory([]);
    setViewIndex(null);
    pausedAtRef.current = null;
    setAvailableExtra(null);
    questionShownAt.current = Date.now();
  }

  const viewEntry = viewIndex !== null ? (history[viewIndex] ?? null) : null;
  const viewing = viewEntry !== null;

  if (loading) {
    return (
      <div className={PAGE_SHELL}>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <SessionLoadError
        message={loadError}
        onRetry={() => setReloadCount((c) => c + 1)}
        backTo={ROUTES.tests}
        backLabel="Wróć do Testów"
      />
    );
  }

  if (finished && !viewing) {
    const extraBatch = availableExtra !== null ? Math.min(MAX_EXTRA_BATCH, availableExtra) : 0;
    // Liczby z serwera pokazujemy dopiero po odświeżeniu na końcu sesji, żeby nie mignęły stare.
    const backlogDeferred = backlog.data && !backlog.isFetching ? backlog.data.deferred : 0;
    const backlogBatch = Math.min(EXTRA_DUE_BATCH, backlogDeferred);

    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
        <CheckCircle2 className="text-success" size={40} aria-hidden="true" />
        <p className="text-xl font-bold">Brawo! Skończyłeś test na dziś.</p>

        {extraError && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Nie udało się pobrać kolejnych pytań. Spróbuj ponownie.
          </p>
        )}

        {queue.length > 0 && (
          <p className="text-sm tabular-nums text-fg-muted">
            Poprawne odpowiedzi:{" "}
            <span className="font-semibold text-fg">
              {correctCount} / {queue.length}
            </span>
          </p>
        )}

        {toReview.length > 0 && (
          <>
            <p className="max-w-md text-sm text-fg-muted">
              Do powtórki: <span className="font-semibold tabular-nums text-fg">{toReview.length}</span> (błędne albo
              oznaczone jako niepewne). Wrócą w powtórkach, możesz też przejść przez nie jeszcze raz teraz.
            </p>
            <button
              onClick={handleRepeatMistakes}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-danger/40 px-6 text-sm font-medium text-danger hover:bg-danger/10"
            >
              Powtórz teraz ({toReview.length})
            </button>
          </>
        )}

        {backlogDeferred > 0 && (
          <BacklogFinishNotice
            deferred={backlogDeferred}
            batch={backlogBatch}
            onMore={() => handleExtraDue(backlogBatch)}
            unit={pytaniaForm(backlogBatch)}
          />
        )}

        {extraBatch > 0 && (
          <button
            onClick={handleStudyMore}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-accent px-6 text-sm font-medium text-accent hover:bg-accent/10"
          >
            Rozwiąż jeszcze {extraBatch} {pytaniaForm(extraBatch)}
          </button>
        )}

        <button
          onClick={() => navigate(ROUTES.tests)}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-accent px-6 text-sm font-medium text-accent-fg hover:opacity-90"
        >
          Wróć do Testów
        </button>

        {history.length > 0 && (
          <button
            onClick={goBack}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Przejrzyj odpowiedzi
          </button>
        )}
      </div>
    );
  }

  const isLast = currentIndex === queue.length - 1;
  const answered = currentIndex + (result ? 1 : 0);
  const progress = (answered / queue.length) * 100;
  const shownIndex = viewIndex ?? currentIndex;
  const canGoBack = viewing ? (viewIndex ?? 0) > 0 : history.length > 0;

  return (
    <div className={PAGE_SHELL}>
      {/* Postęp + cofanie */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm tabular-nums text-fg-muted">
            <span>
              <span className="font-medium text-fg">{shownIndex + 1}</span> / {queue.length}
            </span>
            {viewing && <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs">Podgląd</span>}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goBack}
              disabled={!canGoBack}
              aria-label="Poprzednie pytanie"
              title="Poprzednie pytanie (←)"
              className={NAV_BUTTON}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goForward}
              disabled={!viewing}
              aria-label="Następne pytanie"
              title="Następne pytanie (→)"
              className={NAV_BUTTON}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          role="progressbar"
          aria-label="Postęp testu"
          aria-valuemin={0}
          aria-valuemax={queue.length}
          aria-valuenow={answered}
          className="h-1 overflow-hidden rounded-full bg-surface-2"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>

        {!isExtraBatch && !viewing && backlog.data && (
          <BacklogNotice deferred={backlog.data.deferred} className="text-xs text-fg-muted" />
        )}
      </div>

      {/* key = cardId → każde pytanie pojawia się świeże, bez resztek stanu poprzedniego */}
      {viewEntry ? (
        <QuestionBody
          key={`view-${viewEntry.question.cardId}`}
          question={viewEntry.question}
          selected={viewEntry.selected}
          result={viewEntry.result}
          guessed={viewEntry.guessed}
          suspendedIds={suspendedIds}
          onSuspended={handleSuspended}
          readOnly
          footer={
            <div className="flex justify-end">
              <button type="button" onClick={resumeLive} className={PRIMARY_BUTTON}>
                {finished ? "Wróć do podsumowania" : "Kontynuuj"}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          }
        />
      ) : (
        <QuestionBody
          key={queue[currentIndex].cardId}
          question={queue[currentIndex]}
          selected={selected}
          result={result}
          saveError={saveError}
          onSelect={handleSelect}
          guessed={guessed}
          onGuessedChange={setGuessed}
          suspendedIds={suspendedIds}
          onSuspended={handleSuspended}
          footer={
            result && (
              <div className="flex justify-end">
                <button type="button" onClick={handleNext} className={PRIMARY_BUTTON}>
                  {isLast ? "Zakończ test" : "Dalej"}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            )
          }
        />
      )}

      {!viewing && (
        <KeyboardHint
          hints={
            result
              ? [
                  { keys: ["Enter"], label: "dalej" },
                  { keys: ["←", "→"], label: "poprzednie / następne" },
                ]
              : [
                  { keys: ["A", "B", "C"], label: "wybierz odpowiedź" },
                  { keys: ["G"], label: "niepewna" },
                  { keys: ["←", "→"], label: "poprzednie / następne" },
                ]
          }
        />
      )}
    </div>
  );
}
