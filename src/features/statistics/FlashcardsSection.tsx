import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ActFilter } from "./ActFilter";
import { WeakQuestionsTable } from "./WeakQuestionsTable";
import { useOverview } from "./hooks";
import { normalizeRetentionRate } from "./selectors";

interface FlashcardsSectionProps {
  actId: number | undefined;
  onActChange: (actId: number | undefined) => void;
}

/**
 * „Fiszki": liczby o fiszkach i najsłabsze pytania w tym trybie. Tylko ta sekcja zależy od wyboru aktu prawnego,
 * dlatego filtr stoi w jej nagłówku, a nie na górze strony: testy powyżej zawsze liczą całą pulę.
 */
export function FlashcardsSection({ actId, onActChange }: FlashcardsSectionProps) {
  return (
    <section aria-labelledby="flashcards-title" className="flex flex-col gap-4" data-testid="flashcards-section">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="flashcards-title" className="text-lg font-semibold">
          Fiszki
        </h2>
        <ActFilter value={actId} onChange={onActChange} />
      </div>
      <FlashcardNumbers actId={actId} />
      <WeakQuestionsTable actId={actId} mode="FLASHCARD" />
    </section>
  );
}

function FlashcardNumbers({ actId }: { actId: number | undefined }) {
  const { data, isLoading, isError, refetch } = useOverview(actId, "FLASHCARD");

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (isError || !data) {
    return (
      <Card>
        <ErrorState message="Nie udało się pobrać statystyk fiszek." onRetry={() => refetch()} />
      </Card>
    );
  }

  if (data.totalQuestions === 0) {
    return (
      <Card>
        <p className="text-sm text-fg-muted" data-testid="flashcards-empty">
          Nie ma jeszcze fiszek{actId ? " z tego aktu" : ""}. Fiszka pytania powstaje, gdy pomylisz się w teście (bez
          „Nie jestem pewien"), i możesz ją też dodać ręcznie.
        </p>
      </Card>
    );
  }

  const retention = normalizeRetentionRate(data.retentionRate);
  const stats = [
    { label: "Wszystkie fiszki", value: String(data.totalQuestions), hint: "dostępne dla Ciebie" },
    { label: "Rozpoczęte", value: String(data.questionsStarted), hint: "powtórzone co najmniej raz" },
    { label: "Opanowane", value: String(data.matureQuestions), hint: "kolejna powtórka za ponad 3 tygodnie" },
    {
      label: "Zapamiętane",
      value: retention === null ? "—" : `${Math.round(retention)}%`,
      hint: retention === null ? "brak powtórek w ostatnich 30 dniach" : "udanych powtórek (30 dni)",
    },
  ];

  return (
    <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4" data-testid="flashcard-numbers">
      {stats.map((stat) => (
        <div key={stat.label}>
          <p className="text-sm text-fg-muted">{stat.label}</p>
          <p className="tabular-nums text-2xl font-bold">{stat.value}</p>
          <p className="text-xs text-fg-muted">{stat.hint}</p>
        </div>
      ))}
    </Card>
  );
}
