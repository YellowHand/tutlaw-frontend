import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getReviewQueue, submitReview, type ReviewQueueItem } from "../api/review";

/* -------------------------------------------------------------------------- */
/*  Static design config                                                      */
/*  (Tailwind scans source text, so every class must appear as a full string) */
/* -------------------------------------------------------------------------- */

const RATINGS = [
  {
    value: 1,
    label: "Again",
    key: "1",
    accent: "bg-red-500",
    button:
      "border-red-500/20 bg-red-500/10 text-red-700 hover:border-red-500/40 hover:bg-red-500/20 hover:shadow-red-500/25 active:bg-red-500/30 focus-visible:ring-red-500/60 dark:text-red-300",
  },
  {
    value: 2,
    label: "Hard",
    key: "2",
    accent: "bg-orange-500",
    button:
      "border-orange-500/20 bg-orange-500/10 text-orange-700 hover:border-orange-500/40 hover:bg-orange-500/20 hover:shadow-orange-500/25 active:bg-orange-500/30 focus-visible:ring-orange-500/60 dark:text-orange-300",
  },
  {
    value: 3,
    label: "Good",
    key: "3",
    accent: "bg-green-500",
    button:
      "border-green-500/20 bg-green-500/10 text-green-700 hover:border-green-500/40 hover:bg-green-500/20 hover:shadow-green-500/25 active:bg-green-500/30 focus-visible:ring-green-500/60 dark:text-green-300",
  },
  {
    value: 4,
    label: "Easy",
    key: "4",
    accent: "bg-blue-500",
    button:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 hover:border-blue-500/40 hover:bg-blue-500/20 hover:shadow-blue-500/25 active:bg-blue-500/30 focus-visible:ring-blue-500/60 dark:text-blue-300",
  },
] as const;

// Shared by both card faces. Both faces sit in the same grid cell
// (col-start-1 row-start-1) so the card always grows to fit the taller one.
const FACE =
  "relative col-start-1 row-start-1 flex flex-col overflow-hidden rounded-3xl border p-6 shadow-2xl ring-1 backface-hidden sm:p-10";

const FACE_FRONT =
  "border-white/70 bg-linear-to-b from-white to-slate-50/90 shadow-indigo-900/10 ring-black/5 dark:border-white/10 dark:from-slate-800/90 dark:to-slate-900/90 dark:shadow-black/50 dark:ring-white/5";

const FACE_BACK =
  "rotate-y-180 border-indigo-200/70 bg-linear-to-b from-indigo-50 to-white shadow-indigo-900/15 ring-indigo-500/10 dark:border-indigo-400/20 dark:from-indigo-950/80 dark:to-slate-900/95 dark:shadow-black/50 dark:ring-indigo-400/10";

const BADGE =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase";

const PILL =
  "inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-900/10 bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300";

/* -------------------------------------------------------------------------- */
/*  Tiny presentational helpers                                               */
/* -------------------------------------------------------------------------- */

type IconProps = { className?: string };

function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function BookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Full-screen "focus mode" backdrop: soft aurora blobs + faint dot grid. */
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate grid min-h-dvh place-items-center overflow-x-clip bg-slate-100 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-slate-900 antialiased dark:bg-[#080a14] dark:text-slate-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-48 left-1/2 size-[44rem] -translate-x-1/2 rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-600/20" />
        <div className="absolute -bottom-56 -left-40 size-[36rem] rounded-full bg-fuchsia-300/30 blur-3xl dark:bg-fuchsia-700/15" />
        <div className="absolute top-1/3 -right-40 size-[30rem] rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-600/15" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(15_23_42/0.07)_1px,transparent_0)] bg-size-[22px_22px] dark:bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.05)_1px,transparent_0)]" />
      </div>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export function StudySessionPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const cardShownAt = useRef<number>(Date.now());
  const hasFetched = useRef(false);
  // Guards against double submits (e.g. a key held down or two quick taps).
  const isSubmitting = useRef(false);

  useEffect(() => {
    if (!subjectId || hasFetched.current) return;
    hasFetched.current = true;

    getReviewQueue(Number(subjectId)).then((items) => {
      setQueue(items);
      setLoading(false);
      cardShownAt.current = Date.now();
    });
  }, [subjectId]);

  function handleShowAnswer() {
    setShowAnswer(true);
  }

  async function handleRate(rating: number) {
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    const currentCard = queue[currentIndex];
    const timeSpentSeconds = (Date.now() - cardShownAt.current) / 1000;

    try {
      await submitReview(currentCard.cardId, rating, timeSpentSeconds);

      setShowAnswer(false);
      setCurrentIndex((prev) => prev + 1);
      cardShownAt.current = Date.now();
    } finally {
      isSubmitting.current = false;
    }
  }

  // Anki-style shortcuts: Space / Enter flips, 1-4 rates (only once flipped).
  // Must live above the early returns so hook order never changes.
  useEffect(() => {
    if (loading || currentIndex >= queue.length) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;

      if (!showAnswer) {
        const isFlipKey = e.code === "Space" || e.key === "Enter";
        // Let focused buttons/links keep their native Space/Enter behaviour.
        if (isFlipKey && !target?.closest("button, a")) {
          e.preventDefault();
          handleShowAnswer();
        }
        return;
      }

      const rating = RATINGS.find((r) => r.key === e.key);
      if (rating) {
        e.preventDefault();
        void handleRate(rating.value);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, queue, currentIndex, showAnswer]);

  if (loading) {
    return (
      <Shell>
        <div role="status" className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-sm font-medium">Ładowanie...</span>
        </div>
      </Shell>
    );
  }

  if (currentIndex >= queue.length) {
    return (
      <Shell>
        <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/70 p-8 text-center shadow-2xl shadow-indigo-900/10 ring-1 ring-black/5 backdrop-blur-xl sm:p-12 dark:border-white/10 dark:bg-white/5 dark:shadow-black/50 dark:ring-white/5">
          <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-linear-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
            <CheckIcon className="size-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Brawo! Skończyłeś powtórki na dziś.
          </h1>
          {queue.length > 0 && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Liczba przejrzanych kart:{" "}
              <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">
                {queue.length}
              </span>
            </p>
          )}
          <button
            type="button"
            onClick={() => navigate("/subjects")}
            className="mt-8 w-full rounded-2xl bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/30 outline-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/40 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-[0.985] active:brightness-95"
          >
            Wróć do przedmiotów
          </button>
        </div>
      </Shell>
    );
  }

  const card = queue[currentIndex];
  const progress = ((currentIndex + 1) / queue.length) * 100;

  return (
    <Shell>
      <div className="flex w-full max-w-2xl flex-col gap-5 sm:gap-6">
        {/* ── Header: exit + progress ─────────────────────────────────── */}
        <header className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate("/subjects")}
            aria-label="Zakończ sesję"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-900/10 bg-white/60 text-slate-600 shadow-sm outline-hidden backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-90 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <ArrowLeftIcon className="size-5" />
          </button>

          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={queue.length}
            aria-valuenow={currentIndex + 1}
            className="h-2 flex-1 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10"
          >
            <div
              style={{ "--progress": `${progress}%` } as CSSProperties}
              className="h-full w-(--progress) rounded-full bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[0_0_12px_rgb(139_92_246/0.6)] transition-[width] duration-500 ease-in-out motion-reduce:transition-none"
            />
          </div>

          <p className="shrink-0 text-sm font-semibold text-slate-700 tabular-nums dark:text-slate-200">
            {currentIndex + 1}
            <span className="font-medium text-slate-400 dark:text-slate-500"> / {queue.length}</span>
          </p>
        </header>

        {/* ── Card (remounted per card → no answer spoiler while flipping back) */}
        <div
          key={currentIndex}
          className="transition-[opacity,translate,scale] duration-500 ease-out starting:translate-y-4 starting:scale-[0.97] starting:opacity-0 motion-reduce:transition-none"
        >
          <div
            className={`perspective-[1400px] ${showAnswer ? "" : "cursor-pointer"}`}
            onClick={() => {
              if (!showAnswer) handleShowAnswer();
            }}
          >
            <div
              className={`grid min-h-[clamp(18rem,46dvh,28rem)] transform-3d transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
                showAnswer ? "rotate-y-180" : ""
              }`}
            >
              {/* FRONT */}
              <section aria-hidden={showAnswer} className={`${FACE} ${FACE_FRONT}`}>
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-white to-transparent dark:via-white/30" />
                <span aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/20" />

                <div className="relative flex items-center justify-between gap-3">
                  <span className={`${BADGE} border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300`}>
                    <span className="size-1.5 rounded-full bg-indigo-500" />
                    Pytanie
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Kliknij, aby odwrócić</span>
                </div>

                <div className="relative flex min-h-0 max-h-[42dvh] flex-1 flex-col overflow-y-auto py-6">
                  <p className="my-auto text-center text-2xl leading-snug font-semibold tracking-tight break-words text-balance text-slate-900 sm:text-3xl dark:text-white">
                    {card.front}
                  </p>
                </div>
              </section>

              {/* BACK */}
              <section aria-hidden={!showAnswer} className={`${FACE} ${FACE_BACK}`}>
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-indigo-300 to-transparent dark:via-indigo-300/40" />
                <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-500/20" />

                <div className="relative flex items-center justify-between gap-3">
                  <span className={`${BADGE} border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300`}>
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Odpowiedź
                  </span>
                  {card.verbatimQuote && (
                    <span className={`${BADGE} border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300`}>
                      Cytat
                    </span>
                  )}
                </div>

                {/* question recap */}
                <p className="relative mt-4 line-clamp-2 text-center text-sm text-slate-500 dark:text-slate-400">
                  {card.front}
                </p>
                <div aria-hidden="true" className="relative mt-4 h-px w-full bg-linear-to-r from-transparent via-slate-900/15 to-transparent dark:via-white/15" />

                <div className="relative flex min-h-0 max-h-[34dvh] flex-1 flex-col overflow-y-auto py-5">
                  <div className="my-auto w-full">
                    {card.verbatimQuote ? (
                      <blockquote className="rounded-2xl border-l-4 border-indigo-400/70 bg-indigo-500/5 py-4 pr-5 pl-6 font-serif text-lg leading-relaxed break-words text-slate-700 italic sm:text-xl dark:border-indigo-400/50 dark:bg-indigo-400/10 dark:text-slate-200">
                        „{card.back}”
                      </blockquote>
                    ) : (
                      <p className="text-center text-xl leading-relaxed break-words text-balance text-slate-800 sm:text-2xl dark:text-slate-100">
                        {card.back}
                      </p>
                    )}
                  </div>
                </div>

                {(card.pageNumber || card.sourceName) && (
                  <div className="relative flex flex-wrap items-center justify-center gap-2">
                    {card.sourceName ? (
                      <span className={PILL}>
                        <BookIcon className="size-3.5 shrink-0" />
                        <span className="truncate">{card.sourceName}</span>
                      </span>
                    ) : null}
                    {card.pageNumber ? <span className={`${PILL} tabular-nums`}>s. {card.pageNumber}</span> : null}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        {/* ── Bottom dock: "reveal" and "rate" share one cell and cross-fade ── */}
        <div className="rounded-3xl border border-white/70 bg-white/60 p-2 shadow-xl shadow-slate-900/5 ring-1 ring-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/40 dark:ring-white/5">
          <div className="grid *:col-start-1 *:row-start-1">
            {/* Reveal */}
            <div
              aria-hidden={showAnswer}
              className={`transition-all duration-300 ease-in-out motion-reduce:transition-none ${
                showAnswer ? "pointer-events-none translate-y-2 opacity-0" : "opacity-100"
              }`}
            >
              <button
                type="button"
                onClick={handleShowAnswer}
                disabled={showAnswer}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 outline-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/40 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-[0.985] active:brightness-95"
              >
                Pokaż odpowiedź
                <kbd className="hidden rounded-md border border-white/30 bg-white/20 px-1.5 py-0.5 font-sans text-[11px] font-semibold pointer-fine:inline-flex">
                  Spacja
                </kbd>
              </button>
            </div>

            {/* Rate */}
            <div
              aria-hidden={!showAnswer}
              className={`transition-all duration-300 ease-in-out motion-reduce:transition-none ${
                showAnswer ? "opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
              }`}
            >
              <div className="grid grid-cols-4 gap-2">
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    disabled={!showAnswer}
                    onClick={() => handleRate(r.value)}
                    className={`group flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 outline-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 active:translate-y-0 active:scale-95 sm:py-3.5 ${r.button}`}
                  >
                    <span className={`h-1 w-5 rounded-full opacity-70 transition-all duration-300 group-hover:w-9 group-hover:opacity-100 ${r.accent}`} />
                    <span className="text-sm font-semibold sm:text-base">{r.label}</span>
                    <kbd className="hidden rounded-md border border-current/20 bg-current/10 px-1.5 font-sans text-[11px] font-semibold opacity-80 pointer-fine:inline-flex">
                      {r.key}
                    </kbd>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
