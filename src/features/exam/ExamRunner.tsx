import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Clock, Flag } from "lucide-react";
import type { ExamAnswerPayload, OptionKey } from "../../api/exam";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { cn } from "../../lib/cn";
import { pluralizePl } from "../../lib/plural";
import { isTyping } from "../review/keyboard";
import { OriginLabel } from "../review/OriginLabel";
import { formatClock } from "./format";
import { saveDraft, type ExamDraft } from "./examStorage";

const OPTION_KEYS: readonly OptionKey[] = ["A", "B", "C"];
const KEY_TO_OPTION: Record<string, OptionKey> = { a: "A", b: "B", c: "C", "1": "A", "2": "B", "3": "C" };
/** Zostało tyle sekund: ogłaszamy czytnikom ekranu (co sekundę nie, bo to uniemożliwiałoby czytanie pytania). */
const TIME_WARNINGS = [
  { seconds: 600, text: "Zostało 10 minut." },
  { seconds: 300, text: "Zostało 5 minut." },
  { seconds: 60, text: "Została 1 minuta." },
] as const;

const OPTION_BASE =
  "group flex min-h-14 w-full cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 text-left text-base leading-snug text-fg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed sm:px-5";

const NAV_BUTTON =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40";

const questionsWord = (n: number) => pluralizePl(n, { one: "pytanie", few: "pytania", many: "pytań" });

interface ExamRunnerProps {
  /** Stan początkowy egzaminu (nowy albo wznowiony); bieżące odpowiedzi trzyma ten komponent. */
  exam: ExamDraft;
  /** Czy zapisywać postęp w przeglądarce (nie, gdy nie wiadomo, kim jest użytkownik). */
  persist: boolean;
  submitting: boolean;
  submitError: string | null;
  onSubmit: (answers: ExamAnswerPayload[], timedOut: boolean) => void;
  /** Porzucenie egzaminu bez oceniania i bez zapisu wyniku. */
  onAbandon: () => void;
}

/** Egzamin w toku: pytanie z odpowiedziami, timer, paleta pytań, oznaczanie do sprawdzenia i zakończenie. */
export function ExamRunner({ exam, persist, submitting, submitError, onSubmit, onAbandon }: ExamRunnerProps) {
  const total = exam.questions.length;
  const [index, setIndex] = useState(exam.currentIndex);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>(() => ({ ...exam.answers }));
  const [flagged, setFlagged] = useState<ReadonlySet<number>>(() => new Set(exam.flagged));
  // null = egzamin bez limitu. Wartość początkowa jest liczona raz, przy wejściu na ekran.
  const [remainingMs, setRemainingMs] = useState<number | null>(() =>
    exam.deadlineMs === null ? null : Math.max(0, exam.deadlineMs - Date.now())
  );
  const [dialog, setDialog] = useState<"finish" | "abandon" | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const headingRef = useRef<HTMLHeadingElement>(null);
  const autoSubmittedRef = useRef(false);
  const announcedRef = useRef<number>(Infinity);

  const question = exam.questions[index];
  const answeredCount = useMemo(
    () => exam.questions.filter((q) => answers[String(q.cardId)] !== undefined).length,
    [exam.questions, answers]
  );
  const unansweredCount = total - answeredCount;
  const timeUp = remainingMs !== null && remainingMs <= 0;

  const buildPayload = useCallback(
    (): ExamAnswerPayload[] =>
      exam.questions.map((q) => ({ cardId: q.cardId, selectedOption: answers[String(q.cardId)] ?? null })),
    [exam.questions, answers]
  );

  // --- Zapis postępu (wznowienie po odświeżeniu strony) ---
  useEffect(() => {
    if (!persist) return;
    saveDraft({ ...exam, answers, flagged: Array.from(flagged), currentIndex: index });
  }, [persist, exam, answers, flagged, index]);

  // --- Ostrzeżenie przed zamknięciem karty w trakcie egzaminu ---
  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  // --- Zegar: liczymy od ustalonego terminu końca, więc nie "dryfuje" i nie zatrzymuje się w ukrytej karcie ---
  useEffect(() => {
    if (exam.deadlineMs === null) return;
    const deadline = exam.deadlineMs;
    const id = window.setInterval(() => {
      const left = Math.max(0, deadline - Date.now());
      setRemainingMs(left);
      const seconds = left / 1000;
      const warning = TIME_WARNINGS.find((w) => seconds <= w.seconds && w.seconds < announcedRef.current);
      if (warning && left > 0) {
        announcedRef.current = warning.seconds;
        setAnnouncement(warning.text);
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [exam.deadlineMs]);

  // --- Koniec czasu: egzamin kończy się sam (raz) ---
  useEffect(() => {
    if (!timeUp || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    onSubmit(buildPayload(), true);
  }, [timeUp, buildPayload, onSubmit]);

  // --- Akcje ---
  const goTo = useCallback(
    (next: number, moveFocus: boolean) => {
      const clamped = Math.min(Math.max(0, next), total - 1);
      setIndex(clamped);
      setAnnouncement(`Pytanie ${clamped + 1} z ${total}.`);
      if (moveFocus) headingRef.current?.focus();
    },
    [total]
  );

  const choose = useCallback(
    (option: OptionKey) => {
      if (submitting || timeUp) return;
      const id = String(exam.questions[index].cardId);
      setAnswers((prev) => {
        const next = { ...prev };
        // Ponowny wybór tej samej odpowiedzi ją odznacza.
        if (next[id] === option) delete next[id];
        else next[id] = option;
        return next;
      });
    },
    [submitting, timeUp, exam.questions, index]
  );

  const toggleFlag = useCallback(() => {
    const id = exam.questions[index].cardId;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [exam.questions, index]);

  // Skróty: A/B/C lub 1/2/3 – odpowiedź, ←/→ – poprzednie/następne, F – oznacz do sprawdzenia.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || dialog !== null || isTyping(e.target)) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(index - 1, true);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(index + 1, true);
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "f") {
        e.preventDefault();
        toggleFlag();
        return;
      }
      const option = KEY_TO_OPTION[key];
      if (option) {
        e.preventDefault();
        choose(option);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialog, index, goTo, toggleFlag, choose]);

  const selected = answers[String(question.cardId)];
  const isFlagged = flagged.has(question.cardId);
  const texts: Record<OptionKey, string> = { A: question.optionA, B: question.optionB, C: question.optionC };
  const frozen = submitting;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 sm:p-6">
      {/* Górny pasek: nazwa, zakres, zegar, zakończenie */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 sm:px-5">
        <div className="min-w-0">
          <h1 className="text-base font-semibold">Egzamin próbny</h1>
          <p className="truncate text-xs text-fg-muted">
            {exam.scopeLabel}
            {exam.passPoints !== null && ` · zaliczenie od ${exam.passPoints} pkt`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p
            role="timer"
            aria-label="Pozostały czas"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-lg font-semibold tabular-nums",
              remainingMs !== null && remainingMs <= 60_000 && "text-danger"
            )}
          >
            <Clock size={18} aria-hidden="true" />
            {remainingMs === null ? "Bez limitu" : formatClock(remainingMs / 1000)}
          </p>
          <Button type="button" className="shrink-0 whitespace-nowrap" disabled={frozen} onClick={() => setDialog("finish")}>
            Zakończ egzamin
          </Button>
        </div>
      </div>

      {exam.requestedCount > total && (
        <p className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-fg-muted">
          Wylosowano {total} z {exam.requestedCount} {questionsWord(exam.requestedCount)}: tyle jest dostępnych w
          materiale. Próg zaliczenia jest proporcjonalnie niższy{exam.passPoints !== null && ` (${exam.passPoints} pkt)`}.
        </p>
      )}

      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        {/* Pytanie */}
        <section aria-labelledby="exam-question" className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="exam-question"
              ref={headingRef}
              tabIndex={-1}
              className="text-sm tabular-nums text-fg-muted outline-none"
            >
              Pytanie <span className="font-medium text-fg">{index + 1}</span> z {total}
            </h2>
            <p className="text-sm tabular-nums text-fg-muted">
              Odpowiedziano: <span className="font-medium text-fg">{answeredCount}</span> / {total}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <OriginLabel origin={question.origin} examYear={question.examYear} className="mb-3" />
            <p className="text-pretty text-lg font-semibold leading-snug text-fg sm:text-xl">{question.front}</p>
          </div>

          <div role="group" aria-label="Odpowiedzi" className="flex flex-col gap-3">
            {OPTION_KEYS.map((key) => {
              const isSelected = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={frozen}
                  onClick={() => choose(key)}
                  className={cn(
                    OPTION_BASE,
                    isSelected ? "border-accent bg-accent/10" : "border-line bg-surface hover:bg-surface-2"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                      isSelected ? "border-accent bg-accent text-accent-fg" : "border-line text-fg-muted"
                    )}
                  >
                    {key}
                  </span>
                  <span className="flex-1">{texts[key]}</span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-fg-muted">
            Kliknij wybraną odpowiedź jeszcze raz, żeby ją wyczyścić. Skróty: A, B, C (albo 1, 2, 3), strzałki ← →,
            F oznacza pytanie do sprawdzenia.
          </p>

          {submitError && (
            <div role="alert" className="flex flex-col gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger sm:flex-row sm:items-center sm:justify-between">
              <p>{submitError}</p>
              <Button type="button" variant="secondary" disabled={frozen} onClick={() => onSubmit(buildPayload(), timeUp)}>
                Wyślij ponownie
              </Button>
            </div>
          )}
          {submitting && (
            <p role="status" className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-fg-muted">
              Sprawdzam egzamin…
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              aria-pressed={isFlagged}
              onClick={toggleFlag}
              disabled={frozen}
              title="Oznacz do sprawdzenia (F)"
              className={cn(NAV_BUTTON, isFlagged && "border-warning/60 bg-warning/10")}
            >
              <Flag size={16} aria-hidden="true" className={isFlagged ? "text-warning" : undefined} />
              {isFlagged ? "Oznaczone do sprawdzenia" : "Oznacz do sprawdzenia"}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goTo(index - 1, false)}
                disabled={index === 0}
                title="Poprzednie pytanie (←)"
                className={NAV_BUTTON}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Poprzednie
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1, false)}
                disabled={index === total - 1}
                title="Następne pytanie (→)"
                className={NAV_BUTTON}
              >
                Następne
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        {/* Paleta pytań */}
        <nav aria-label="Lista pytań" className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-surface p-4 lg:self-start">
          <h2 className="text-sm font-medium text-fg-muted">Pytania</h2>
          <ol className="grid grid-cols-6 gap-1.5 sm:grid-cols-12 lg:max-h-[60vh] lg:grid-cols-5 lg:overflow-y-auto">
            {exam.questions.map((q, i) => {
              const answered = answers[String(q.cardId)] !== undefined;
              const marked = flagged.has(q.cardId);
              const current = i === index;
              return (
                <li key={q.cardId} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => goTo(i, true)}
                    aria-current={current ? "true" : undefined}
                    aria-label={`Pytanie ${i + 1}: ${answered ? "odpowiedziane" : "bez odpowiedzi"}${marked ? ", oznaczone do sprawdzenia" : ""}`}
                    className={cn(
                      "relative flex h-9 w-full min-w-0 cursor-pointer items-center justify-center rounded-lg border text-xs font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      answered ? "border-accent/60 bg-accent/15 text-fg" : "border-line text-fg-muted hover:bg-surface-2",
                      current && "ring-2 ring-accent ring-offset-2 ring-offset-surface"
                    )}
                  >
                    {i + 1}
                    {marked && (
                      <Flag
                        size={10}
                        aria-hidden="true"
                        className="absolute -right-1 -top-1 fill-warning text-warning"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
          <ul className="flex flex-col gap-1 text-xs text-fg-muted" aria-label="Legenda">
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="size-3 rounded border border-accent/60 bg-accent/15" /> odpowiedziane
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="size-3 rounded border border-line" /> bez odpowiedzi
            </li>
            <li className="flex items-center gap-2">
              <Flag size={12} aria-hidden="true" className="fill-warning text-warning" /> oznaczone do sprawdzenia
            </li>
          </ul>
        </nav>
      </div>

      {dialog === "finish" && (
        <Dialog title="Zakończyć egzamin?" onClose={() => setDialog(null)}>
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              Odpowiedziano na <span className="font-semibold tabular-nums">{answeredCount}</span> z{" "}
              <span className="tabular-nums">{total}</span> {questionsWord(total)}.
            </li>
            <li className={unansweredCount > 0 ? "text-warning" : "text-fg-muted"}>
              {unansweredCount > 0
                ? `Bez odpowiedzi: ${unansweredCount}. Takie pytania liczą się jako błędne.`
                : "Wszystkie pytania mają odpowiedź."}
            </li>
            {flagged.size > 0 && (
              <li className="text-fg-muted">Oznaczone do sprawdzenia: {flagged.size}.</li>
            )}
            {remainingMs !== null && <li className="text-fg-muted">Zostało {formatClock(remainingMs / 1000)}.</li>}
          </ul>
          <p className="text-sm text-fg-muted">Po zakończeniu nie da się już zmienić odpowiedzi.</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setDialog("abandon")}
              className="min-h-11 cursor-pointer rounded-lg px-1 text-sm text-fg-muted underline hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Porzuć egzamin
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => setDialog(null)}>
                Wróć do egzaminu
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setDialog(null);
                  onSubmit(buildPayload(), false);
                }}
              >
                Zakończ i sprawdź
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {dialog === "abandon" && (
        <Dialog title="Porzucić egzamin?" onClose={() => setDialog(null)}>
          <p className="text-sm text-fg-muted">
            Twoje odpowiedzi zostaną usunięte, a wynik nie zostanie zapisany ani oceniony. Tego nie da się cofnąć.
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDialog(null)}>
              Wróć do egzaminu
            </Button>
            <Button type="button" variant="danger" onClick={onAbandon}>
              Tak, porzuć egzamin
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
