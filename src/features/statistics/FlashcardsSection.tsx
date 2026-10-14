import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ChapterMasteryList } from "./ChapterMasteryList";
import { SubjectFilter } from "./SubjectFilter";
import { WeakCardsTable } from "./WeakCardsTable";
import { useOverview } from "./hooks";
import { normalizeRetentionRate } from "./selectors";

interface FlashcardsSectionProps {
  subjectId: number | undefined;
  onSubjectChange: (subjectId: number | undefined) => void;
  /** Podręcznik wybranego przedmiotu (do opanowania działów); brak = nie ma czego pokazać. */
  textbookSourceId: number | undefined;
}

/**
 * „Fiszki i podręcznik": liczby o fiszkach, najsłabsze karty i opanowanie działów. Tylko ta sekcja zależy od wyboru
 * przedmiotu, dlatego filtr stoi w jej nagłówku, a nie na górze strony: testy powyżej zawsze liczą cały materiał.
 */
export function FlashcardsSection({ subjectId, onSubjectChange, textbookSourceId }: FlashcardsSectionProps) {
  return (
    <section aria-labelledby="flashcards-title" className="flex flex-col gap-4" data-testid="flashcards-section">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="flashcards-title" className="text-lg font-semibold">
          Fiszki i podręcznik
        </h2>
        <SubjectFilter value={subjectId} onChange={onSubjectChange} />
      </div>
      <FlashcardNumbers subjectId={subjectId} />
      {subjectId !== undefined && <ChapterMasteryList sourceId={textbookSourceId} />}
      <WeakCardsTable subjectId={subjectId} />
    </section>
  );
}

function FlashcardNumbers({ subjectId }: { subjectId: number | undefined }) {
  const { data, isLoading, isError, refetch } = useOverview(subjectId, "FLASHCARD");

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (isError || !data) {
    return (
      <Card>
        <ErrorState message="Nie udało się pobrać statystyk fiszek." onRetry={() => refetch()} />
      </Card>
    );
  }

  if (data.totalCards === 0) {
    return (
      <Card>
        <p className="text-sm text-fg-muted" data-testid="flashcards-empty">
          Nie ma jeszcze fiszek{subjectId ? " z tego przedmiotu" : ""}. Fiszki powstają z pytań, w których pomylisz się w
          teście, i możesz je też dodać ręcznie.
        </p>
      </Card>
    );
  }

  const retention = normalizeRetentionRate(data.retentionRate);
  const stats = [
    { label: "Wszystkie fiszki", value: String(data.totalCards), hint: "dostępne dla Ciebie" },
    { label: "Rozpoczęte", value: String(data.cardsStarted), hint: "powtórzone co najmniej raz" },
    { label: "Opanowane", value: String(data.matureCards), hint: "kolejna powtórka za ponad 3 tygodnie" },
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
