import { useRef, useState, type RefObject } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DIFFICULT_LIST_LIMIT,
  suspendCard,
  unsuspendCard,
  type DifficultCardItem,
  type DifficultCards,
} from "../../api/difficult";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatDatePl } from "../../lib/date";
import { serverMessage } from "../../lib/errors";
import { pluralizePl } from "../../lib/plural";
import { invalidateReviewData } from "../review/hooks";
import { DIFFICULT_CARDS_KEY, useDifficultCards } from "./hooks";

const MISTAKES = { one: "błąd", few: "błędy", many: "błędów" };
/** „po 1 błędzie", „po 3 błędach", „po 8 błędach" */
const AFTER_MISTAKES = { one: "błędzie", few: "błędach", many: "błędach" };

/** Trudne i zawieszone pytania w Koncie: tu można zawiesić trudne pytanie albo przywrócić zawieszone. */
export function DifficultCardsCard() {
  const { data, isLoading, isError, refetch } = useDifficultCards();

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
  return <DifficultCardsContent data={data} />;
}

function shortLabel(text: string): string {
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

function DifficultCardsContent({ data }: { data: DifficultCards }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const suspendedHeadingRef = useRef<HTMLHeadingElement>(null);
  const leechHeadingRef = useRef<HTMLHeadingElement>(null);

  const mutation = useMutation({
    mutationFn: ({ cardId, suspend }: { cardId: number; suspend: boolean }) =>
      suspend ? suspendCard(cardId) : unsuspendCard(cardId),
    onMutate: ({ cardId }) => {
      setPendingId(cardId);
      setError(null);
      setNotice("");
    },
    onSuccess: async (_result, { suspend }) => {
      // Najpierw odświeżamy listę (wiersz przeskakuje między sekcjami), potem liczniki powtórek.
      await queryClient.invalidateQueries({ queryKey: DIFFICULT_CARDS_KEY });
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
    onSettled: () => setPendingId(null),
  });

  const { suspended, leeches, leechThreshold } = data;
  const afterMistakes = `po ${leechThreshold} ${pluralizePl(leechThreshold, AFTER_MISTAKES)}`;

  return (
    <Card>
      <h2 id="difficult-cards" className="mb-1 text-base font-semibold">
        Trudne i zawieszone pytania
      </h2>
      <p className="mb-4 text-sm text-fg-muted">
        Pytanie uchodzi za trudne {afterMistakes}. Zawieszone pytanie nie wraca w powtórkach ani w testach, ale zachowuje
        Twój postęp. Po przywróceniu wraca zgodnie z terminem.
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
          id="suspended-cards"
          headingRef={suspendedHeadingRef}
          title="Zawieszone"
          items={suspended}
          emptyText="Nie masz zawieszonych pytań."
          actionLabel="Przywróć"
          pendingId={pendingId}
          onAction={(cardId) => mutation.mutate({ cardId, suspend: false })}
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
          pendingId={pendingId}
          onAction={(cardId) => mutation.mutate({ cardId, suspend: true })}
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
  items: DifficultCardItem[];
  emptyText: string;
  actionLabel: string;
  pendingId: number | null;
  onAction: (cardId: number) => void;
  meta: (item: DifficultCardItem) => string | null;
}

function DifficultSection({
  id,
  headingRef,
  title,
  items,
  emptyText,
  actionLabel,
  pendingId,
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
              item.sourceName,
              `${item.lapses} ${pluralizePl(item.lapses, MISTAKES)}`,
              meta(item),
            ].filter(Boolean);
            return (
              <li key={item.cardId} className="flex items-start gap-3 rounded-xl border border-line bg-surface-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-3 text-sm text-fg">{item.front}</p>
                  <p className="mt-1 text-xs text-fg-muted">{details.join(" · ")}</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  disabled={pendingId !== null}
                  aria-label={`${actionLabel}: ${shortLabel(item.front)}`}
                  onClick={() => onAction(item.cardId)}
                >
                  {pendingId === item.cardId ? "…" : actionLabel}
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
