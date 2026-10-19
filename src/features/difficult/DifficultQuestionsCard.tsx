import { useRef, useState, type RefObject } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DIFFICULT_LIST_LIMIT,
  suspendQuestion,
  unsuspendQuestion,
  type DifficultQuestionItem,
  type DifficultQuestions,
} from "../../api/difficult";
import type { SessionMode } from "../../api/review";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatDatePl } from "../../lib/date";
import { serverMessage } from "../../lib/errors";
import { pluralizePl } from "../../lib/plural";
import { invalidateReviewData } from "../review/hooks";
import { DIFFICULT_QUESTIONS_KEY, useDifficultQuestions } from "./hooks";

const MISTAKES = { one: "błąd", few: "błędy", many: "błędów" };
/** „po 1 błędzie", „po 3 błędach", „po 8 błędach" */
const AFTER_MISTAKES = { one: "błędzie", few: "błędach", many: "błędach" };

const MODE_LABELS: Record<SessionMode, string> = { TEST: "w testach", FLASHCARD: "w fiszkach" };

/** Klucz wiersza: to samo pytanie bywa trudne w obu trybach naraz, a tryby zawiesza się osobno. */
function rowKey(item: DifficultQuestionItem): string {
  return `${item.questionId}-${item.mode}`;
}

/** Trudne i zawieszone pytania w Koncie: tu można zawiesić trudne pytanie albo przywrócić zawieszone (osobno w testach i w fiszkach). */
export function DifficultQuestionsCard() {
  const { data, isLoading, isError, refetch } = useDifficultQuestions();

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }
  if (isError || !data) {
    return (
      <Card>
        <ErrorState message="Nie udało się pobrać listy trudnych pytań." onRetry={() => refetch()} />
      </Card>
    );
  }
  return <DifficultQuestionsContent data={data} />;
}

function shortLabel(text: string): string {
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

function DifficultQuestionsContent({ data }: { data: DifficultQuestions }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const suspendedHeadingRef = useRef<HTMLHeadingElement>(null);
  const leechHeadingRef = useRef<HTMLHeadingElement>(null);

  const mutation = useMutation({
    mutationFn: ({ item, suspend }: { item: DifficultQuestionItem; suspend: boolean }) =>
      suspend ? suspendQuestion(item.questionId, item.mode) : unsuspendQuestion(item.questionId, item.mode),
    onMutate: ({ item }) => {
      setPendingKey(rowKey(item));
      setError(null);
      setNotice("");
    },
    onSuccess: async (_result, { suspend }) => {
      // Najpierw odświeżamy listę (wiersz przeskakuje między sekcjami), potem liczniki powtórek.
      await queryClient.invalidateQueries({ queryKey: DIFFICULT_QUESTIONS_KEY });
      invalidateReviewData(queryClient);
      setNotice(suspend ? "Pytanie zawieszone." : "Pytanie przywrócone.");
      // Kliknięty przycisk zniknął razem z wierszem, więc fokus przenosimy na nagłówek sekcji, z której wiersz zszedł.
      (suspend ? leechHeadingRef : suspendedHeadingRef).current?.focus();
    },
    onError: (err, { suspend }) =>
      setError(
        serverMessage(
          err,
          suspend ? "Nie udało się zawiesić pytania. Spróbuj ponownie." : "Nie udało się przywrócić pytania. Spróbuj ponownie."
        )
      ),
    onSettled: () => setPendingKey(null),
  });

  const { suspended, leeches, leechThreshold } = data;
  const afterMistakes = `po ${leechThreshold} ${pluralizePl(leechThreshold, AFTER_MISTAKES)}`;

  return (
    <Card>
      <h2 id="difficult-questions" className="mb-1 text-base font-semibold">
        Trudne i zawieszone pytania
      </h2>
      <p className="mb-4 text-sm text-fg-muted">
        Pytanie uchodzi za trudne {afterMistakes}. Test i fiszka tego samego pytania liczą się osobno. Zawieszone pytanie nie
        wraca w powtórkach danego trybu, ale zachowuje Twój postęp. Po przywróceniu wraca zgodnie z terminem.
      </p>

      {error && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      )}
      <p role="status" className="mb-3 text-sm text-success empty:hidden">
        {notice}
      </p>

      <div className="flex flex-col gap-6">
        <DifficultSection
          id="suspended-questions"
          headingRef={suspendedHeadingRef}
          title="Zawieszone"
          items={suspended}
          emptyText="Nie masz zawieszonych pytań."
          actionLabel="Przywróć"
          pendingKey={pendingKey}
          onAction={(item) => mutation.mutate({ item, suspend: false })}
          meta={(item) =>
            item.suspendedAt ? `zawieszone ${formatDatePl(item.suspendedAt.slice(0, 10))}` : null
          }
        />
        <DifficultSection
          id="difficult-leeches"
          headingRef={leechHeadingRef}
          title="Trudne, nadal w nauce"
          items={leeches}
          emptyText={`Nie masz trudnych pytań. Pytanie staje się trudne ${afterMistakes}.`}
          actionLabel="Zawieś"
          pendingKey={pendingKey}
          onAction={(item) => mutation.mutate({ item, suspend: true })}
          meta={() => null}
        />
      </div>
    </Card>
  );
}

interface DifficultSectionProps {
  id: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  title: string;
  items: DifficultQuestionItem[];
  emptyText: string;
  actionLabel: string;
  pendingKey: string | null;
  onAction: (item: DifficultQuestionItem) => void;
  meta: (item: DifficultQuestionItem) => string | null;
}

function DifficultSection({
  id,
  headingRef,
  title,
  items,
  emptyText,
  actionLabel,
  pendingKey,
  onAction,
  meta,
}: DifficultSectionProps) {
  return (
    <section aria-labelledby={id}>
      <h3 id={id} ref={headingRef} tabIndex={-1} className="mb-2 text-sm font-medium text-fg focus:outline-none">
        {title} <span className="font-normal text-fg-muted tabular-nums">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-fg-muted">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const details = [
              item.actName,
              MODE_LABELS[item.mode],
              `${item.lapses} ${pluralizePl(item.lapses, MISTAKES)}`,
              meta(item),
            ].filter(Boolean);
            return (
              <li key={rowKey(item)} className="flex items-start gap-3 rounded-xl border border-line bg-surface-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-3 text-sm text-fg">{item.body}</p>
                  <p className="mt-1 text-xs text-fg-muted">{details.join(" · ")}</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  disabled={pendingKey !== null}
                  aria-label={`${actionLabel}: ${shortLabel(item.body)}`}
                  onClick={() => onAction(item)}
                >
                  {pendingKey === rowKey(item) ? "…" : actionLabel}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {items.length >= DIFFICULT_LIST_LIMIT && (
        <p className="mt-2 text-xs text-fg-muted">Pokazano pierwsze {DIFFICULT_LIST_LIMIT} pytań.</p>
      )}
    </section>
  );
}
