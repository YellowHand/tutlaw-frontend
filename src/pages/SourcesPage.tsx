import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Layers, ChevronRight } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/layout/PageHeader";
import { ROUTES } from "../config/routes";
import { parseId, useSourcesWithProgress, type SourceWithProgress } from "../features/flashcards/hooks";
import { loadErrorMessage } from "../lib/errors";
import { NotFoundPage } from "../features/misc/NotFoundPage";

export function SourcesPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const id = parseId(subjectId);
  const { data: sources, isError, error, refetch } = useSourcesWithProgress(id);

  function handleSelect(source: SourceWithProgress) {
    if (source.sourceType === "TEXTBOOK") {
      navigate(ROUTES.flashcardsChapters(subjectId ?? "", source.id));
    } else {
      navigate(ROUTES.study(subjectId ?? "", source.id));
    }
  }

  if (id === undefined) return <NotFoundPage />;

  return (
    <div>
      <PageHeader title="Źródła" />
      <div className="px-4 pb-8 sm:px-8">
        {isError ? (
          <ErrorState message={loadErrorMessage(error, "źródeł")} onRetry={() => refetch()} />
        ) : sources === undefined ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : sources.length === 0 ? (
          <EmptyState icon={BookOpen} title="Brak źródeł" description="Wkrótce pojawią się tu materiały." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {sources.map((source) => {
              const percentage = source.progress?.progressPercentage ?? 0;
              const isTextbook = source.sourceType === "TEXTBOOK";
              return (
                <button key={source.id} onClick={() => handleSelect(source)} className="text-left">
                  <Card className="flex h-full flex-col gap-3 transition-colors hover:bg-surface-2">
                    <div className="flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        {isTextbook ? <BookOpen size={20} aria-hidden="true" /> : <Layers size={20} aria-hidden="true" />}
                      </span>
                      <ChevronRight size={18} className="text-fg-muted" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="font-semibold">{source.name}</h2>
                      <p className="text-xs text-fg-muted">{isTextbook ? "Wybierz zakres nauki" : "Cała pula fiszek"}</p>
                    </div>
                    <div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${percentage}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-fg-muted tabular-nums">
                        {source.progress?.cardsStarted ?? 0} / {source.progress?.totalCards ?? 0} fiszek
                      </p>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}