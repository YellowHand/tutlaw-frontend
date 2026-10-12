import { useParams, Link } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/layout/PageHeader";
import { ROUTES } from "../config/routes";
import { parseId, useCategories, useSubjects } from "../features/flashcards/hooks";
import { loadErrorMessage } from "../lib/errors";
import { NotFoundPage } from "../features/misc/NotFoundPage";

export function SubjectsPage() {
  const { categoryId } = useParams();
  const id = parseId(categoryId);
  const { data: subjects, isError, error, refetch } = useSubjects(id);
  // Nagłówek bierzemy z listy kategorii (jest już w pamięci po wejściu tutaj z listy). Gdy się nie uda, zostaje domyślny.
  const { data: categories } = useCategories();
  const category = categories?.find((c) => c.id === id);

  if (id === undefined) return <NotFoundPage />;

  return (
    <div>
      <PageHeader title={category?.itemsLabel ?? "Przedmioty"} subtitle={category?.name} />
      <div className="px-4 pb-8 sm:px-8">
        {isError ? (
          <ErrorState message={loadErrorMessage(error, "listy")} onRetry={() => refetch()} />
        ) : subjects === undefined ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <EmptyState icon={BookOpen} title="Brak przedmiotów" description="Wkrótce pojawią się tu materiały." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Link key={subject.id} to={ROUTES.flashcardsSources(subject.id)} className="group block">
                <Card className="flex h-full flex-col justify-between gap-4 transition-colors hover:bg-surface-2">
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <BookOpen size={20} aria-hidden="true" />
                    </span>
                    <ChevronRight size={18} className="text-fg-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{subject.name}</h2>
                    <p className="text-sm text-fg-muted">Zobacz rozdziały i fiszki</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}