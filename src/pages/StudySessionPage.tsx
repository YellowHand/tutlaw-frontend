import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { getReviewQueue, submitReview, getAvailableNewCardsCount, type ReviewQueueItem } from "../api/review";
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
import { OriginLabel } from "../features/review/OriginLabel";
import { originLabel } from "../lib/origin";
import { HideCardButton } from "../features/admin/HideCardButton";
import { LeechHint } from "../features/difficult/LeechHint";
import { SuspendCardButton } from "../features/difficult/SuspendCardButton";
import { SessionLoadError } from "../features/review/SessionLoadError";
import { loadErrorMessage } from "../lib/errors";

const MAX_EXTRA_BATCH = 10;

/** Nagłówek h1 tylko dla czytnika ekranu: sesja nie ma widocznego tytułu, ale strona musi mieć nagłówek pierwszego poziomu. */
const SESSION_TITLE = "Sesja nauki fiszek";

/**
 * Oceny 1–4 (Again / Hard / Good / Easy) w kolorach palety:
 * danger → warning → success → accent.
 * Pełne nazwy klas muszą zostać w stringach, żeby Tailwind v4 je wykrył.
 */
const RATING_BUTTONS = [
  {
    value: 1,
    label: "Nie pamiętam",
    tone: "text-danger",
    className:
      "border-danger/35 bg-danger/10 text-danger hover:border-danger hover:bg-danger/15 focus-visible:outline-danger",
  },
  {
    value: 2,
    label: "Trudne",
    tone: "text-warning",
    className:
      "border-warning/35 bg-warning/10 text-warning hover:border-warning hover:bg-warning/20 focus-visible:outline-warning",
  },
  {
    value: 3,
    label: "Znam",
    tone: "text-success",
    className:
      "border-success/35 bg-success/10 text-success hover:border-success hover:bg-success/20 focus-visible:outline-success",
  },
  {
    value: 4,
    label: "Łatwe",
    tone: "text-accent",
    className:
      "border-accent/35 bg-accent/10 text-accent hover:border-accent hover:bg-accent/20 focus-visible:outline-accent",
  },
];

/** Jedna już ocenioną fiszka – trzymana tylko w pamięci strony, do podglądu. */
type HistoryEntry = { card: ReviewQueueItem; rating: number };

const CARD_HEIGHT = "h-[clamp(19rem,50vh,30rem)]";
// Ta sama kolumna i to samo zakotwiczenie co w TestSessionPage – przełączanie Testy ↔ Fiszki nic nie przeskakuje.
const PAGE_SHELL = "mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pt-6 sm:p-6 sm:pt-[8vh]";

// Na telefonie przyciski poprzednie/następne mają 44 px (wygodny cel dla palca), od szerokości sm wracają do 32 px.
const NAV_BUTTON =
  "inline-flex size-11 cursor-pointer sm:size-8 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const PRIMARY_BUTTON =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-medium text-accent-fg hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const FACE_BASE: CSSProperties = {
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
};

/** 1 fiszkę, 2–4 fiszki, 5+ fiszek (biernik) */
function fiszkiForm(n: number) {
  if (n === 1) return "fiszkę";
  const lastTwo = n % 100;
  const last = n % 10;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return "fiszki";
  return "fiszek";
}

export function StudySessionPage() {
  const { subjectId } = useParams();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get("sourceId");
  const navigate = useNavigate();
  useRefreshReviewDataOnExit();

  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // Ocena się nie zapisała / nie udało się pobrać kolejnej porcji: pokazujemy komunikat zamiast milczeć.
  const [rateError, setRateError] = useState(false);
  const [extraError, setExtraError] = useState(false);
  const [availableExtra, setAvailableExtra] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // Fiszki zawieszone w tej sesji: nie wracają na koniec kolejki po „Nie pamiętam".
  const [suspendedIds, setSuspendedIds] = useState<ReadonlySet<number>>(() => new Set());
  // Karty ukryte przez administratora w tej sesji.
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<number>>(() => new Set());
  const handleHidden = useCallback((cardId: number) => {
    setHiddenIds((prev) => new Set(prev).add(cardId));
  }, []);
  const handleSuspended = useCallback((cardId: number) => {
    setSuspendedIds((prev) => new Set(prev).add(cardId));
  }, []);
  // Po „Ucz się jeszcze" / „Powtórz jeszcze" sesja jest dodatkową porcją: informacja o zaległościach z początku nie dotyczy.
  const [isExtraBatch, setIsExtraBatch] = useState(false);
  // null = bieżąca fiszka; liczba = indeks w history (podgląd tylko do odczytu)
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  // Ustawiane przy każdym wczytaniu pytania; początkowe 0 nigdy nie trafia do backendu.
  const cardShownAt = useRef<number>(0);
  const pausedAtRef = useRef<number | null>(null);
  const fetchedKeyRef = useRef<string | null>(null);
  // Numer ostatniego zapytania o kolejkę: spóźniona odpowiedź na starsze zapytanie jest ignorowana.
  const requestRef = useRef(0);

  const numericSubjectId = subjectId ? Number(subjectId) : undefined;
  const numericSourceId = sourceId ? Number(sourceId) : undefined;
  const finished = !loading && !loadError && currentIndex >= queue.length;
  const backlog = useBacklog({ mode: "FLASHCARD", subjectId: numericSubjectId, sourceId: numericSourceId });
  const refetchBacklog = backlog.refetch;

  useEffect(() => {
    // Bez subjectId (trasa /app/study) kolejka obejmuje cały materiał użytkownika.
    const key = `${subjectId ?? "all"}:${sourceId ?? ""}:${reloadCount}`;
    if (fetchedKeyRef.current === key) return;
    fetchedKeyRef.current = key;

    const requestId = ++requestRef.current;
    setLoading(true);
    setLoadError(null);
    getReviewQueue(numericSubjectId, numericSourceId)
      .then((items) => {
        if (requestRef.current !== requestId) return;
        setQueue(items);
        setCurrentIndex(0);
        setShowAnswer(false);
        setHistory([]);
        setViewIndex(null);
        setRateError(false);
        setExtraError(false);
        setIsExtraBatch(false);
        pausedAtRef.current = null;
        setLoading(false);
        cardShownAt.current = Date.now();
      })
      .catch((e: unknown) => {
        if (requestRef.current !== requestId) return;
        setLoadError(loadErrorMessage(e, "fiszek"));
        setLoading(false);
      });
  }, [subjectId, sourceId, reloadCount, numericSubjectId, numericSourceId]);

  useEffect(() => {
    if (loading || loadError || currentIndex < queue.length) return;
    // Gdy nie uda się sprawdzić, ile jest nowych fiszek, po prostu nie pokazujemy przycisku „Ucz się jeszcze".
    getAvailableNewCardsCount(numericSubjectId, numericSourceId)
      .then(setAvailableExtra)
      .catch(() => setAvailableExtra(0));
  }, [loading, loadError, currentIndex, queue.length, numericSubjectId, numericSourceId]);

  // Na końcu sesji (i po każdej nowej kolejce) pytamy o zaległości jeszcze raz: ile zostało na kolejne dni.
  useEffect(() => {
    if (finished) void refetchBacklog();
  }, [finished, queue, refetchBacklog]);

  const handleFlip = useCallback(() => setShowAnswer(true), []);

  const handleRate = useCallback(
    async (rating: number) => {
      const currentCard = queue[currentIndex];
      if (!currentCard || submitting) return;

      setSubmitting(true);
      setRateError(false);
      try {
        const timeSpentSeconds = Math.max(0, (Date.now() - cardShownAt.current) / 1000);
        await submitReview(currentCard.cardId, rating, timeSpentSeconds);

        setHistory((prev) => [...prev, { card: currentCard, rating }]);
        // „Nie pamiętam": karta wraca na koniec tej samej sesji, zamiast czekać do następnego dnia.
        if (rating === 1 && !suspendedIds.has(currentCard.cardId)) setQueue((prev) => [...prev, currentCard]);
        setShowAnswer(false);
        setCurrentIndex((prev) => prev + 1);
        cardShownAt.current = Date.now();
      } catch {
        // Karta zostaje na ekranie z odkrytą odpowiedzią: można od razu ocenić ją jeszcze raz.
        setRateError(true);
      } finally {
        setSubmitting(false);
      }
    },
    [queue, currentIndex, submitting, suspendedIds]
  );

  // --- Cofanie: tylko podgląd, niczego nie wysyła do backendu ---

  const goBack = useCallback(() => {
    if (submitting) return;

    if (viewIndex === null) {
      if (history.length === 0) return;
      pausedAtRef.current = Date.now();
      setViewIndex(history.length - 1);
    } else if (viewIndex > 0) {
      setViewIndex(viewIndex - 1);
    }
  }, [submitting, viewIndex, history.length]);

  const resumeLive = useCallback(() => {
    // Czas spędzony w podglądzie nie liczy się do czasu nauki bieżącej fiszki.
    if (pausedAtRef.current !== null) {
      cardShownAt.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
    setViewIndex(null);
  }, []);

  const goForward = useCallback(() => {
    if (viewIndex === null) return;

    if (viewIndex >= history.length - 1) resumeLive();
    else setViewIndex(viewIndex + 1);
  }, [viewIndex, history.length, resumeLive]);

  // Skróty: Spacja/Enter – odkryj odpowiedź, 1–4 – oceń, ←/→ – poprzednia/następna fiszka.
  // Gdy widać przyciski ocen albo podgląd, Spacja jest zablokowana i nic nie robi.
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

      if (viewIndex !== null) {
        if (e.key === " ") e.preventDefault();
        return;
      }

      if (showAnswer && e.key === " ") {
        e.preventDefault();
        return;
      }

      if (e.repeat) return;

      if (!showAnswer) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleFlip();
        }
        return;
      }

      const rating = Number(e.key);
      if (rating >= 1 && rating <= 4) {
        e.preventDefault();
        void handleRate(rating);
      }
    }

    // Firefox aktywuje sfokusowany przycisk dopiero na keyup – tam też blokujemy Spację.
    function onKeyUp(e: KeyboardEvent) {
      if ((showAnswer || viewIndex !== null) && e.key === " " && !isTyping(e.target)) e.preventDefault();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [loading, finished, viewIndex, showAnswer, handleFlip, handleRate, goBack, goForward]);

  /** Wczytuje dodatkową porcję fiszek (nowe albo zaległe ponad limit) i zaczyna z nią nową sesję. */
  async function startExtraBatch(load: () => Promise<ReviewQueueItem[]>) {
    setLoading(true);
    setExtraError(false);
    try {
      const extraItems = await load();

      setQueue(extraItems);
      setCurrentIndex(0);
      setShowAnswer(false);
      setHistory([]);
      setViewIndex(null);
      pausedAtRef.current = null;
      setAvailableExtra(null);
      setIsExtraBatch(true);
      cardShownAt.current = Date.now();
    } catch {
      setExtraError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleStudyMore() {
    if (!availableExtra) return;
    const batchSize = Math.min(MAX_EXTRA_BATCH, availableExtra);
    void startExtraBatch(() => getReviewQueue(numericSubjectId, numericSourceId, batchSize));
  }

  /** „Powtórz jeszcze": kolejna porcja zaległych ponad dzienny limit (bez nowych fiszek). */
  function handleExtraDue(batch: number) {
    void startExtraBatch(() => getReviewQueue(numericSubjectId, numericSourceId, 0, undefined, batch));
  }

  const viewEntry = viewIndex !== null ? (history[viewIndex] ?? null) : null;
  const viewing = viewEntry !== null;

  if (loading) {
    return (
      <div className={PAGE_SHELL}>
        <h1 className="sr-only">{SESSION_TITLE}</h1>
        <Skeleton className="h-5 w-full" />
        <Skeleton className={cn("w-full rounded-2xl", CARD_HEIGHT)} />
      </div>
    );
  }

  if (loadError) {
    return (
      <SessionLoadError
        title={SESSION_TITLE}
        message={loadError}
        onRetry={() => setReloadCount((c) => c + 1)}
        backTo={ROUTES.flashcards}
        backLabel="Wróć do Fiszek"
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
        <h1 className="text-xl font-bold">Brawo! Skończyłeś powtórki na dziś.</h1>

        {extraError && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Nie udało się pobrać kolejnych fiszek. Spróbuj ponownie.
          </p>
        )}

        {backlogDeferred > 0 && (
          <BacklogFinishNotice
            deferred={backlogDeferred}
            batch={backlogBatch}
            onMore={() => handleExtraDue(backlogBatch)}
            unit={fiszkiForm(backlogBatch)}
          />
        )}

        {extraBatch > 0 && (
          <button
            onClick={handleStudyMore}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-accent px-6 text-sm font-medium text-accent hover:bg-accent/10"
          >
            Ucz się jeszcze {extraBatch} {fiszkiForm(extraBatch)}
          </button>
        )}

        <button
          onClick={() => navigate(ROUTES.flashcards)}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-accent px-6 text-sm font-medium text-accent-fg hover:opacity-90"
        >
          Wróć do Fiszek
        </button>

        {history.length > 0 && (
          <button
            onClick={goBack}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Przejrzyj powtórki
          </button>
        )}
      </div>
    );
  }

  const shownCard = viewEntry ? viewEntry.card : queue[currentIndex];
  const flipped = viewing ? true : showAnswer;
  const shownIndex = viewIndex ?? currentIndex;
  // Ta sama karta była już w tej sesji wcześniej (ocenione „Nie pamiętam"), więc to jej powtórka.
  const isRepeat = !viewing && queue.findIndex((c) => c.cardId === shownCard.cardId) < currentIndex;
  const canGoBack = !submitting && (viewing ? (viewIndex ?? 0) > 0 : history.length > 0);
  const ratingMeta = viewEntry ? RATING_BUTTONS.find((b) => b.value === viewEntry.rating) : undefined;
  const progress = (currentIndex / queue.length) * 100;
  const sourceLabel = [shownCard.sourceName, shownCard.pageNumber ? `s. ${shownCard.pageNumber}` : null]
    .filter(Boolean)
    .join(", ");

  return (
    <div className={PAGE_SHELL}>
      <h1 className="sr-only">{SESSION_TITLE}</h1>
      {/* Postęp + cofanie */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm tabular-nums text-fg-muted">
            <span>
              <span className="font-medium text-fg">{shownIndex + 1}</span> / {queue.length}
            </span>
            {viewing && <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs">Podgląd</span>}
            {isRepeat && <span className="rounded-md bg-danger/10 px-2 py-0.5 text-xs text-danger">Jeszcze raz</span>}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goBack}
              disabled={!canGoBack}
              aria-label="Poprzednia fiszka"
              title="Poprzednia fiszka (←)"
              className={NAV_BUTTON}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goForward}
              disabled={!viewing}
              aria-label="Następna fiszka"
              title="Następna fiszka (→)"
              className={NAV_BUTTON}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          role="progressbar"
          aria-label="Postęp sesji"
          aria-valuemin={0}
          aria-valuemax={queue.length}
          aria-valuenow={currentIndex}
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

      {/*
        key = cardId + pozycja → każda karta to świeży element (także jej powtórka w tej samej sesji): nowa fiszka pojawia się od razu "od przodu"
        i NIE odwraca się z powrotem (inaczej przez chwilę byłoby widać odpowiedź następnej karty).
        W podglądzie karta od razu jest odwrócona, na odpowiedzi.
      */}
      <div
        key={`${shownCard.cardId}:${shownIndex}`}
        className={cn(
          "relative w-full transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none",
          CARD_HEIGHT
        )}
        style={{ perspective: "1600px" }}
      >
        <div
          onClick={flipped ? undefined : handleFlip}
          className={cn(
            "relative h-full w-full transition-transform duration-500 ease-out motion-reduce:transition-none",
            !flipped && "cursor-pointer"
          )}
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Przód – samo pytanie */}
          <div
            aria-hidden={flipped}
            style={FACE_BASE}
            className={cn(
              "absolute inset-0 flex flex-col rounded-2xl border border-line bg-surface p-6 transition-colors sm:p-8",
              !flipped && "hover:bg-surface-2"
            )}
          >
            <OriginLabel origin={shownCard.origin} examYear={shownCard.examYear} className="mb-2 shrink-0 justify-center" />
            <div className="flex flex-1 flex-col overflow-y-auto">
              <p className="my-auto text-pretty text-center text-xl font-semibold leading-snug text-fg sm:text-2xl">
                {shownCard.front}
              </p>
            </div>
          </div>

          {/* Tył – pytanie I odpowiedź razem */}
          <div
            aria-hidden={!flipped}
            style={{ ...FACE_BASE, transform: "rotateY(180deg)" }}
            className="absolute inset-0 flex flex-col gap-4 rounded-2xl border border-accent/30 bg-surface p-6 sm:p-8"
          >
            <div className="shrink-0 border-b border-line pb-3">
              <p className="line-clamp-3 text-sm text-fg-muted">{shownCard.front}</p>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto">
              <div className="my-auto">
                {shownCard.verbatimQuote ? (
                  <blockquote className="border-l-2 border-accent/60 pl-4 text-lg italic leading-relaxed text-fg sm:text-xl">
                    „{shownCard.back}”
                  </blockquote>
                ) : (
                  <p className="text-lg leading-relaxed text-fg sm:text-xl">{shownCard.back}</p>
                )}
              </div>
            </div>

            {(sourceLabel || shownCard.legalBasis || shownCard.validAsOf || shownCard.leech || originLabel(shownCard.origin, shownCard.examYear)) && (
              <div className="flex shrink-0 flex-col gap-1 border-t border-line pt-3 text-xs text-fg-muted">
                <OriginLabel origin={shownCard.origin} examYear={shownCard.examYear} />
                {sourceLabel && (
                  <p className="flex items-center gap-2">
                    <BookOpen size={14} aria-hidden="true" />
                    <span>{sourceLabel}</span>
                  </p>
                )}
                <LegalBasisLine legalBasis={shownCard.legalBasis} validAsOf={shownCard.validAsOf} />
                {shownCard.leech && (
                  <LeechHint kind="flashcard" lapses={shownCard.lapses} className="mt-1 text-xs text-fg-muted" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stała wysokość strefy pod kartą – karta nie "skacze" po odkryciu odpowiedzi */}
      <div className="min-h-[8.75rem] sm:min-h-16">
        {viewEntry ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-fg-muted">
              Twoja ocena:{" "}
              <span className={cn("font-semibold", ratingMeta?.tone)}>{ratingMeta?.label}</span>
            </p>
            <button type="button" onClick={resumeLive} className={PRIMARY_BUTTON}>
              {finished ? "Wróć do podsumowania" : "Kontynuuj"}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          showAnswer && (
            <div className="flex flex-col gap-3 transition-opacity duration-200 starting:opacity-0">
              {rateError && (
                <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  Nie udało się zapisać oceny. Sprawdź połączenie i spróbuj ponownie.
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {RATING_BUTTONS.map((btn) => (
                  <button
                    key={btn.value}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleRate(btn.value)}
                    className={cn(
                      "flex min-h-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-2.5 text-sm font-semibold",
                      "transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60",
                      "focus-visible:outline-2 focus-visible:outline-offset-2",
                      btn.className
                    )}
                  >
                    <span>{btn.label}</span>
                    <kbd className="hidden font-sans text-[11px] font-medium opacity-60 sm:block">{btn.value}</kbd>
                  </button>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {!viewing && (
        <KeyboardHint
          hints={
            showAnswer
              ? [
                  { keys: ["1", "2", "3", "4"], label: "oceń" },
                  { keys: ["←", "→"], label: "poprzednia / następna" },
                ]
              : [
                  { keys: ["Spacja"], label: "odkryj odpowiedź" },
                  { keys: ["←", "→"], label: "poprzednia / następna" },
                ]
          }
        />
      )}

      {(viewing || showAnswer) && (
        <div className="flex flex-wrap items-center gap-x-4 self-start">
          <ReportCardButton key={`report:${shownCard.cardId}:${shownIndex}`} cardId={shownCard.cardId} />
          <HideCardButton
            key={`hide:${shownCard.cardId}:${shownIndex}`}
            cardId={shownCard.cardId}
            alreadyHidden={hiddenIds.has(shownCard.cardId)}
            onHidden={handleHidden}
          />
          {shownCard.leech && (
            <SuspendCardButton
              key={`suspend:${shownCard.cardId}:${shownIndex}`}
              cardId={shownCard.cardId}
              alreadySuspended={suspendedIds.has(shownCard.cardId)}
              onSuspended={handleSuspended}
            />
          )}
        </div>
      )}
    </div>
  );
}
