import { BookOpen } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { useChapterMastery } from "./hooks";

interface ChapterMasteryListProps {
  sourceId?: number;
}

function masteryColor(percentage: number): string {
  if (percentage < 50) return "bg-danger";
  if (percentage < 80) return "bg-warning";
  return "bg-success";
}

export function ChapterMasteryList({ sourceId }: ChapterMasteryListProps) {
  const { data, isLoading, isError, refetch } = useChapterMastery(sourceId);

  if (!sourceId) {
    return (
      <Card>
        <EmptyState icon={BookOpen} title="Wybierz przedmiot z podręcznikiem" description="Pokażemy tu opanowanie działów." />
      </Card>
    );
  }
  if (isLoading) return <Skeleton className="h-48 w-full" />;

  if (isError || !data) {
    return (
      <Card>
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <EmptyState icon={BookOpen} title="Brak rozdziałów do pokazania" />
      </Card>
    );
  }

  // Backend returns chapters in natural (order_index) order, not by
  // mastery — we sort client-side, weakest first, as requested.
  const sorted = [...data].sort((a, b) => a.masteryPercentage - b.masteryPercentage);

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-fg-muted">Opanowanie działów</h2>
      <div className="flex flex-col gap-3">
        {sorted.map((chapter) => (
          <div key={chapter.chapterId}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="truncate pr-2">{chapter.chapterTitle}</span>
              <span className="tabular-nums shrink-0 text-fg-muted">
                {Math.round(chapter.masteryPercentage)}% ({chapter.matureCards}/{chapter.totalCards})
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div className={masteryColor(chapter.masteryPercentage)} style={{ width: `${chapter.masteryPercentage}%`, height: "100%" }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}