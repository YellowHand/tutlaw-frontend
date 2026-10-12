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
import { Skeleton } from "../components/ui/Skeleton";
import { cn } from "../lib/cn";
import { ROUTES } from "../config/routes";

const MAX_EXTRA_BATCH = 10;

type OptionKey = "A" | "B" | "C";
type OptionState = "idle" | "pending" | "correct" | "wrong" | "dimmed";

/** Jedno już rozwiązane pytanie – trzymane tylko w pamięci strony, do podglądu. */
type HistoryEntry = { question: TestQueueItem; selected: OptionKey; result: TestAnswerResult };

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

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

interface QuestionBodyProps {
  question: TestQueueItem;
  selected: OptionKey | null;
  result: TestAnswerResult | null;
  /** Podgląd poprzedniego pytania – odpowiedzi są zablokowane. */
  readOnly?: boolean;
  saveError?: boolean;
  onSelect?: (option: OptionKey) => void;
  footer?: ReactNode;
}

/** Pytanie + odpowiedzi + wyjaśnienie. Ten sam wygląd dla bieżącego pytania i dla podglądu. */
function QuestionBody({ question, selected, result, readOnly = false, saveError = false, onSelect, footer }: QuestionBodyProps) {
  const options: { key: OptionKey; text: string }[] = [
    { key: "A", text: question.optionA },
    { key: "B", text: question.optionB },
    { key: "C", text: question.optionC },
  ];

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
          const isCorrectOption = result?.correctOption === option.key;

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
          {result.explanation && <p className="text-base leading-relaxed text-fg">{result.explanation}</p>}
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
  const navigate = useNavigate();

  const [queue, setQueue] = useState<TestQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [result, setResult] = useState<TestAnswerResult | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableExtra, setAvailableExtra] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // null = bieżące pytanie; liczba = indeks w history (podgląd tylko do odczytu)
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const questionShownAt = useRef<number>(Date.now());
  const pausedAtRef = useRef<number | null>(null);
  const fetchedKeyRef = useRef<string | null>(null);

  const numericSubjectId = subjectId ? Number(subjectId) : undefined;
  const numericSourceId = sourceId ? Number(sourceId) : undefined;
  const finished = !loading && currentIndex >= queue.length;

  useEffect(() => {
    if (!subjectId) return;

    const key = `${subjectId}:${sourceId ?? ""}`;
    if (fetchedKeyRef.current === key) return;
    fetchedKeyRef.current = key;

    setLoading(true);
    getTestQueue(Number(subjectId), numericSourceId).then((items) => {
      setQueue(items);
      setCurrentIndex(0);
      setSelected(null);
      setResult(null);
      setCorrectCount(0);
      setSaveError(false);
      setHistory([]);
      setViewIndex(null);
      pausedAtRef.current = null;
      setLoading(false);
      questionShownAt.current = Date.now();
    });
  }, [subjectId, sourceId]);

  useEffect(() => {
    if (loading || currentIndex < queue.length || numericSubjectId === undefined) return;
    getAvailableNewCardsCount(numericSubjectId, numericSourceId).then(setAvailableExtra);
  }, [loading, currentIndex, queue.length, numericSubjectId, numericSourceId]);

  const handleSelect = useCallback(
    async (option: OptionKey) => {
      const currentCard = queue[currentIndex];
      if (!currentCard || selected) return;

      setSaveError(false);
      setSelected(option);

      const timeSpentSeconds = Math.max(0, (Date.now() - questionShownAt.current) / 1000);

      try {
        const res = await submitTestAnswer(currentCard.cardId, option, timeSpentSeconds);
        setResult(res);
        if (res.correct) setCorrectCount((prev) => prev + 1);
      } catch {
        // Bez tego po błędzie sieci wszystkie odpowiedzi zostałyby zablokowane na stałe.
        setSelected(null);
        setSaveError(true);
      }
    },
    [queue, currentIndex, selected]
  );

  const handleNext = useCallback(() => {
    const answeredQuestion = queue[currentIndex];
    if (answeredQuestion && selected && result) {
      setHistory((prev) => [...prev, { question: answeredQuestion, selected, result }]);
    }

    setSelected(null);
    setResult(null);
    setSaveError(false);
    setCurrentIndex((prev) => prev + 1);
    questionShownAt.current = Date.now();
  }, [queue, currentIndex, selected, result]);

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

  // Skróty: A/B/C lub 1/2/3 – wybór odpowiedzi, Enter – następne pytanie, ←/→ – poprzednie/następne. Spacja nic nie robi.
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

      const option = KEY_TO_OPTION[e.key.toLowerCase()];
      if (option) {
        e.preventDefault();
        void handleSelect(option);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, finished, viewIndex, selected, result, handleSelect, handleNext, goBack, goForward]);

  async function handleStudyMore() {
    if (numericSubjectId === undefined || !availableExtra) return;

    const batchSize = Math.min(MAX_EXTRA_BATCH, availableExtra);
    setLoading(true);
    const extraItems = await getTestQueue(numericSubjectId, numericSourceId, batchSize);

    setQueue(extraItems);
    setCurrentIndex(0);
    setSelected(null);
    setResult(null);
    setCorrectCount(0);
    setSaveError(false);
    setHistory([]);
    setViewIndex(null);
    pausedAtRef.current = null;
    setAvailableExtra(null);
    setLoading(false);
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

  if (finished && !viewing) {
    const extraBatch = availableExtra !== null ? Math.min(MAX_EXTRA_BATCH, availableExtra) : 0;

    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
        <CheckCircle2 className="text-success" size={40} aria-hidden="true" />
        <p className="text-xl font-bold">Brawo! Skończyłeś test na dziś.</p>

        {queue.length > 0 && (
          <p className="text-sm tabular-nums text-fg-muted">
            Poprawne odpowiedzi:{" "}
            <span className="font-semibold text-fg">
              {correctCount} / {queue.length}
            </span>
          </p>
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
          onClick={() => navigate(ROUTES.flashcards)}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-accent px-6 text-sm font-medium text-accent-fg hover:opacity-90"
        >
          Wróć do Katalogu
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
      </div>

      {/* key = cardId → każde pytanie pojawia się świeże, bez resztek stanu poprzedniego */}
      {viewEntry ? (
        <QuestionBody
          key={`view-${viewEntry.question.cardId}`}
          question={viewEntry.question}
          selected={viewEntry.selected}
          result={viewEntry.result}
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
    </div>
  );
}
