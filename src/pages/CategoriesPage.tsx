import { Link } from "react-router-dom";
import { GraduationCap, ChevronRight, Layers } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/layout/PageHeader";
import { ROUTES } from "../config/routes";
import { DueReviewBanner } from "../features/review/DueReviewBanner";
import { useNonEmptyCategories } from "../features/flashcards/hooks";
import { useOverview } from "../features/statistics/hooks";
import { loadErrorMessage } from "../lib/errors";

export function CategoriesPage() {
  const { data: categories, isError, error, refetch } = useNonEmptyCategories();
  // Fiszki zaczynają puste: pojawiają się po błędach w testach albo po „Dodaj do fiszek". Gdy nie ma żadnej, tłumaczymy to
  // zamiast pokazywać kategorie, w których nic nie ma. Gdy nie uda się tego sprawdzić, pokazujemy zwykłą listę.
  const overview = useOverview(undefined, "FLASHCARD");
  const noFlashcardsYet = overview.data?.totalCards === 0;

  return (
    <div>
      <PageHeader title="Fiszki" />
      <div className="px-4 pb-8 sm:px-8">
        {!noFlashcardsYet && <DueReviewBanner className="mb-6" />}
        {!noFlashcardsYet && <h2 className="mb-3 text-sm font-medium text-fg-muted">Materiały do nauki</h2>}
        {noFlashcardsYet ? (
          <EmptyState
            icon={Layers}
            title="Nie masz jeszcze fiszek"
            description="Fiszki pojawiają się tu same: po błędnej odpowiedzi w teście (bez zaznaczenia „Nie jestem pewien”) albo gdy po odpowiedzi klikniesz „Dodaj do fiszek”."
            action={
              <Link
                to={ROUTES.tests}
                className="mt-1 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-6 text-sm font-medium text-accent-fg hover:opacity-90"
              >
                Przejdź do Testów
              </Link>
            }
          />
        ) : isError ? (
          <ErrorState message={loadErrorMessage(error, "kategorii")} onRetry={() => refetch()} />
        ) : categories === undefined || overview.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <EmptyState icon={GraduationCap} title="Brak kategorii" description="Wkrótce pojawią się tu materiały." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link key={category.id} to={ROUTES.flashcardsSubjects(category.id)} className="group block">
                <Card className="flex h-full flex-col justify-between gap-4 transition-colors hover:bg-surface-2">
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent-ink">
                      <GraduationCap size={20} aria-hidden="true" />
                    </span>
                    <ChevronRight size={18} className="text-fg-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{category.name}</h2>
                    <p className="text-sm text-fg-muted">Zobacz: {category.itemsLabel.toLowerCase()}</p>
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