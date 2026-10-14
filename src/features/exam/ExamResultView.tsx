import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, MinusCircle, Play, XCircle } from "lucide-react";
import type { ExamQuestionResult, ExamResult, OptionKey } from "../../api/exam";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { pluralizePl } from "../../lib/plural";
import { LegalBasisLine } from "../review/LegalBasisLine";
import { OriginLabel } from "../review/OriginLabel";
import { ReportCardButton } from "../report/ReportCardButton";
import { START_BUTTON } from "../tests/StartButtons";
import { formatDateTime, formatDuration, formatPercent, pointsNeeded } from "./format";

const OPTION_KEYS: readonly OptionKey[] = ["A", "B", "C"];

const questionsWord = (n: number) => pluralizePl(n, { one: "pytanie", few: "pytania", many: "pytań" });

interface ExamResultViewProps {
  result: ExamResult;
  onNewExam: () => void;
}

/** Raport po egzaminie: werdykt, wynik, czas, wyniki wg źródeł i przegląd pytań z poprawnymi odpowiedziami. */
export function ExamResultView({ result, onNewExam }: ExamResultViewProps) {
  const { attempt, questions, bySource, excludedCount } = result;
  const mistakes = questions.filter((q) => !q.correct);
  const [onlyMistakes, setOnlyMistakes] = useState(true);
  const showMistakesOnly = onlyMistakes && mistakes.length > 0;
  const unanswered = attempt.questionCount - attempt.answeredCount;
  // Podejścia sprzed stałego formatu nie mają progu w punktach: dla nich liczymy go z progu w procentach.
  const needed = attempt.passPoints ?? pointsNeeded(attempt.questionCount, attempt.passThresholdPercent);
  const missing = attempt.passed ? 0 : Math.max(0, needed - attempt.correctCount);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold">Wynik egzaminu</h1>

      <Card className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p
            className={cn(
              "inline-flex items-center gap-2 text-2xl font-bold",
              attempt.passed ? "text-success" : "text-danger"
            )}
          >
            {attempt.passed ? <CheckCircle2 size={28} aria-hidden="true" /> : <XCircle size={28} aria-hidden="true" />}
            {attempt.passed ? "Zaliczony" : "Niezaliczony"}
          </p>
          <p className="text-2xl font-bold tabular-nums">
            {attempt.correctCount} / {attempt.questionCount}{" "}
            <span className="text-lg font-semibold text-fg-muted">({formatPercent(attempt.scorePercent)})</span>
          </p>
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-fg-muted">Próg zaliczenia</dt>
            <dd className="font-medium tabular-nums">
              {attempt.passPoints !== null ? (
                <>
                  {attempt.passPoints} z {attempt.questionCount} pkt
                </>
              ) : (
                <>
                  {attempt.passThresholdPercent}% (co najmniej {needed}{" "}
                  {pluralizePl(needed, { one: "poprawna", few: "poprawne", many: "poprawnych" })})
                </>
              )}
              {missing > 0 && <span className="block text-xs font-normal text-fg-muted">Zabrakło {missing} pkt do zaliczenia.</span>}
            </dd>
          </div>
          <div>
            <dt className="text-fg-muted">Czas</dt>
            <dd className="inline-flex items-center gap-1.5 font-medium">
              <Clock size={14} aria-hidden="true" className="text-fg-muted" />
              {formatDuration(attempt.durationSeconds)}
              {attempt.timeLimitMinutes !== null ? ` z ${attempt.timeLimitMinutes} min` : " (bez limitu czasu)"}
            </dd>
          </div>
          <div>
            <dt className="text-fg-muted">Odpowiedzi</dt>
            <dd className="font-medium tabular-nums">
              udzielone: {attempt.answeredCount}, bez odpowiedzi: {unanswered}
            </dd>
          </div>
          <div>
            <dt className="text-fg-muted">Zakres i data</dt>
            <dd className="font-medium">
              {attempt.scopeLabel}
              <span className="block text-xs font-normal text-fg-muted">{formatDateTime(attempt.finishedAt)}</span>
            </dd>
          </div>
        </dl>

        {attempt.timedOut && (
          <p className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-fg-muted">
            Czas minął, więc egzamin został zakończony automatycznie. Pytania bez odpowiedzi liczą się jako błędne.
          </p>
        )}
        {excludedCount > 0 && (
          <p className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-fg-muted">
            {excludedCount} {questionsWord(excludedCount)} nie udało się ocenić (zostały usunięte albo nie są już
            dostępne), więc nie wliczają się do wyniku.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {mistakes.length > 0 && (
            <Link to={ROUTES.testPractice(mistakes.map((q) => q.cardId))} className={START_BUTTON}>
              <Play size={16} aria-hidden="true" />
              Przerób błędne i pominięte ({mistakes.length})
            </Link>
          )}
          <Button type="button" variant="secondary" onClick={onNewExam}>
            Nowy egzamin
          </Button>
          <Link
            to={ROUTES.tests}
            className="inline-flex min-h-11 items-center rounded-lg px-1 text-sm text-fg-muted underline hover:text-fg"
          >
            Wróć do Testów
          </Link>
        </div>
        {mistakes.length > 0 && (
          <p className="-mt-2 text-xs text-fg-muted">
            „Przerób" to zwykła sesja testowa z tych pytań: odpowiedzi trafią wtedy do Twoich powtórek. Sam egzamin
            niczego w powtórkach nie zmienił.
          </p>
        )}
      </Card>

      {bySource.length > 1 && (
        <section aria-labelledby="exam-by-source" className="flex flex-col gap-3">
          <h2 id="exam-by-source" className="text-sm font-medium text-fg-muted">
            Wynik według źródeł
          </h2>
          <ul className="flex flex-col gap-2">
            {bySource.map((row) => {
              const percent = row.total === 0 ? 0 : Math.round((row.correct / row.total) * 1000) / 10;
              return (
                <li key={row.sourceName} className="rounded-xl border border-line bg-surface px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium">{row.sourceName || "Bez źródła"}</span>
                    <span className="tabular-nums text-fg-muted">
                      {row.correct} / {row.total} ({formatPercent(percent)})
                    </span>
                  </div>
                  <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="exam-review" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="exam-review" className="text-lg font-semibold">
            Przegląd pytań
          </h2>
          {mistakes.length > 0 && (
            <div role="group" aria-label="Które pytania pokazać" className="flex gap-2">
              <FilterButton active={showMistakesOnly} onClick={() => setOnlyMistakes(true)}>
                Błędne i bez odpowiedzi ({mistakes.length})
              </FilterButton>
              <FilterButton active={!showMistakesOnly} onClick={() => setOnlyMistakes(false)}>
                Wszystkie ({questions.length})
              </FilterButton>
            </div>
          )}
        </div>

        {mistakes.length === 0 && (
          <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-fg-muted">
            Wszystkie odpowiedzi są poprawne. Poniżej jest pełny przegląd pytań.
          </p>
        )}

        <ol className="flex flex-col gap-4">
          {questions.map((q, i) =>
            showMistakesOnly && q.correct ? null : (
              <li key={q.cardId}>
                <ReviewItem number={i + 1} question={q} />
              </li>
            )
          )}
        </ol>
      </section>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "min-h-11 cursor-pointer rounded-xl border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink",
        active ? "border-accent-ink bg-accent/10 text-fg" : "border-line text-fg-muted hover:bg-surface-2"
      )}
    >
      {children}
    </button>
  );
}

function ReviewItem({ number, question }: { number: number; question: ExamQuestionResult }) {
  const texts: Record<OptionKey, string> = { A: question.optionA, B: question.optionB, C: question.optionC };
  const unanswered = question.selectedOption === null;
  const explanation = question.explanation?.trim() ?? "";

  return (
    <article
      aria-label={`Pytanie ${number}`}
      className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
    >
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
        <span className="tabular-nums text-fg-muted">Pytanie {number}</span>
        {question.correct ? (
          <span className="inline-flex items-center gap-1 text-success">
            <CheckCircle2 size={16} aria-hidden="true" /> Poprawnie
          </span>
        ) : unanswered ? (
          <span className="inline-flex items-center gap-1 text-warning">
            <MinusCircle size={16} aria-hidden="true" /> Bez odpowiedzi
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-danger">
            <XCircle size={16} aria-hidden="true" /> Błędnie
          </span>
        )}
        {question.sourceName && <span className="text-xs font-normal text-fg-muted">{question.sourceName}</span>}
      </p>

      <OriginLabel origin={question.origin} examYear={question.examYear} className="mt-2" />
      <p className="mt-2 text-base font-semibold leading-snug">{question.front}</p>

      <ul className="mt-3 flex flex-col gap-2">
        {OPTION_KEYS.map((key) => {
          const isCorrect = question.correctOption === key;
          const isSelected = question.selectedOption === key;
          return (
            <li
              key={key}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm leading-snug",
                isCorrect
                  ? "border-success/60 bg-success/10"
                  : isSelected
                    ? "border-danger/60 bg-danger/10"
                    : "border-line"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isCorrect
                    ? "border-success bg-success text-canvas"
                    : isSelected
                      ? "border-danger bg-danger text-canvas"
                      : "border-line text-fg-muted"
                )}
              >
                {key}
              </span>
              <span className="flex-1">
                {texts[key]}
                {(isSelected || isCorrect) && (
                  <span className="mt-1 block text-xs font-medium text-fg-muted">
                    {isSelected && isCorrect && "Twoja odpowiedź, poprawna"}
                    {isSelected && !isCorrect && "Twoja odpowiedź"}
                    {!isSelected && isCorrect && "Poprawna odpowiedź"}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {explanation !== "" && <p className="mt-3 text-sm leading-relaxed text-fg">{explanation}</p>}
      <LegalBasisLine
        legalBasis={question.legalBasis}
        validAsOf={question.validAsOf}
        className={cn("text-sm text-fg-muted", explanation !== "" ? "mt-2" : "mt-3")}
      />
      <div className="mt-1">
        <ReportCardButton cardId={question.cardId} />
      </div>
    </article>
  );
}
