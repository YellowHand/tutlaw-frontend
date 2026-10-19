import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, MinusCircle, RotateCcw, XCircle } from "lucide-react";
import type { CustomTestSessionDetail, CustomTestSessionQuestion } from "../../api/customTest";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { formatDateTime, formatDuration } from "../exam/format";
import { ReportQuestionButton } from "../report/ReportQuestionButton";
import { LegalBasisLine } from "../review/LegalBasisLine";
import { SourceLabel } from "../review/SourceLabel";
import { Breadcrumbs } from "../tests/Breadcrumbs";
import { START_BUTTON } from "../tests/StartButtons";
import { KIND_LABELS } from "./kindLabels";
import { StatusBadge } from "./MyTestsPage";
import type { CustomTestPrefill } from "./prefill";
import { useCustomTestSession } from "./sessionsHooks";

const OPTION_KEYS = ["A", "B", "C"] as const;

/** Szczegóły zapisanego testu: ustawienia, wynik i wszystkie pytania z odpowiedziami, plus ułożenie testu od nowa. */
export function MyTestDetailPage() {
  const { id } = useParams();
  const sessionId = id !== undefined && /^\d+$/.test(id) ? Number(id) : null;
  const { data, isLoading, isError, refetch } = useCustomTestSession(sessionId);

  const crumbs = [
    { label: "Testy", to: ROUTES.tests },
    { label: "Własny test", to: ROUTES.customTest },
    { label: "Moje testy", to: ROUTES.myTests },
    { label: "Szczegóły" },
  ];

  if (sessionId === null || isError) {
    return (
      <div>
        <Breadcrumbs items={crumbs} />
        <div className="px-4 pt-6 sm:px-8">
          <ErrorState
            message={sessionId === null ? "Nie ma takiego testu." : "Nie udało się pobrać tego testu. Mógł zostać usunięty."}
            onRetry={sessionId === null ? undefined : () => refetch()}
          />
          <Link to={ROUTES.myTests} className="mt-4 inline-flex min-h-11 items-center text-sm text-accent-ink underline">
            Wróć do listy testów
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div>
        <Breadcrumbs items={crumbs} />
        <div className="flex flex-col gap-4 px-4 pt-6 sm:px-8">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs items={crumbs} />
      <PageHeader title="Własny test" subtitle={data.summary.scopeLabel} />
      <Detail detail={data} />
    </div>
  );
}

function Detail({ detail }: { detail: CustomTestSessionDetail }) {
  const { summary, questions } = detail;
  const navigate = useNavigate();
  const [onlyMistakes, setOnlyMistakes] = useState(false);
  const wrong = questions.filter((q) => q.correct !== true);
  const shown = onlyMistakes ? wrong : questions;

  function rearrange() {
    const prefill: CustomTestPrefill = {
      fieldIds: summary.fieldIds,
      actIds: summary.actIds,
      sourceGroups: summary.sourceGroups,
      kind: summary.kind,
      requestedCount: summary.requestedCount,
    };
    navigate(ROUTES.customTest, { state: { prefill } });
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 sm:px-8">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <StatusBadge finished={summary.finished} className="text-base font-semibold" />
          <p className="text-2xl font-bold tabular-nums">
            {summary.correctCount} / {summary.questionCount}
            <span className="sr-only"> poprawnych</span>
          </p>
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Fact label="Pytania">{KIND_LABELS[summary.kind]}</Fact>
          <Fact label="Rozpoczęty">{formatDateTime(summary.startedAt)}</Fact>
          <Fact label="Odpowiedzi">
            <span className="tabular-nums">
              {summary.answeredCount} z {summary.questionCount}
            </span>
            {summary.guessedCount > 0 && (
              <span className="block text-xs font-normal text-fg-muted">
                z zaznaczeniem „Nie jestem pewien": {summary.guessedCount}
              </span>
            )}
          </Fact>
          <Fact label="Czas odpowiadania">{summary.answeredCount > 0 ? formatDuration(summary.timeSeconds) : "brak"}</Fact>
        </dl>

        {!summary.finished && (
          <p className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-fg-muted">
            Ten test został zaczęty, ale nie odpowiedziano na wszystkie pytania. Nie da się do niego wrócić, ale możesz
            ułożyć nowy z tymi samymi ustawieniami.
          </p>
        )}

        <div>
          <button type="button" onClick={rearrange} className={cn(START_BUTTON, "cursor-pointer")} data-testid="rearrange">
            <RotateCcw size={16} aria-hidden="true" />
            Ułóż ponownie z tymi ustawieniami
          </button>
        </div>
      </Card>

      <section aria-labelledby="my-test-questions" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="my-test-questions" className="text-lg font-semibold">
            Pytania
          </h2>
          {wrong.length > 0 && wrong.length < questions.length && (
            <div role="group" aria-label="Które pytania pokazać" className="flex gap-2">
              <FilterButton active={!onlyMistakes} onClick={() => setOnlyMistakes(false)}>
                Wszystkie ({questions.length})
              </FilterButton>
              <FilterButton active={onlyMistakes} onClick={() => setOnlyMistakes(true)}>
                Błędne i bez odpowiedzi ({wrong.length})
              </FilterButton>
            </div>
          )}
        </div>
        <ol className="flex flex-col gap-4">
          {shown.map((question) => (
            <li key={question.questionId}>
              <QuestionReview question={question} />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-fg-muted">{label}</dt>
      <dd className="font-medium">{children}</dd>
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

function QuestionReview({ question }: { question: CustomTestSessionQuestion }) {
  const texts = { A: question.optionA, B: question.optionB, C: question.optionC };
  const unanswered = question.selectedOption === null;
  const explanation = question.explanation?.trim() ?? "";

  return (
    <article aria-label={`Pytanie ${question.position}`} className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
        <span className="tabular-nums text-fg-muted">Pytanie {question.position}</span>
        {question.correct === true ? (
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
        {question.guessed && <span className="text-xs font-normal text-fg-muted">Niepewna odpowiedź</span>}
        {question.timeSeconds !== null && (
          <span className="text-xs font-normal tabular-nums text-fg-muted">{formatDuration(question.timeSeconds)}</span>
        )}
      </p>

      <SourceLabel actName={question.actName} sourceName={question.sourceName} examYear={question.examYear} className="mt-2" />
      <p className="mt-2 text-base font-semibold leading-snug">{question.body}</p>

      <ul className="mt-3 flex flex-col gap-2">
        {OPTION_KEYS.map((key) => {
          const isCorrect = question.correctOption === key;
          const isSelected = question.selectedOption === key;
          return (
            <li
              key={key}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm leading-snug",
                isCorrect ? "border-success/60 bg-success/10" : isSelected ? "border-danger/60 bg-danger/10" : "border-line"
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
      {!unanswered && (
        <div className="mt-1">
          <ReportQuestionButton questionId={question.questionId} />
        </div>
      )}
    </article>
  );
}
