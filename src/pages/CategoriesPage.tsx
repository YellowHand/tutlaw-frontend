import { Link } from "react-router-dom";
import { GraduationCap, ChevronRight } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/layout/PageHeader";
import { ROUTES } from "../config/routes";
import { DueReviewBanner } from "../features/review/DueReviewBanner";
import { useNonEmptyCategories } from "../features/flashcards/hooks";
import { loadErrorMessage } from "../lib/errors";

export function CategoriesPage() {
  const { data: categories, isError, error, refetch } = useNonEmptyCategories();

  return (
    <div>
      <PageHeader title="Fiszki" />
      <div className="px-4 pb-8 sm:px-8">
        <DueReviewBanner className="mb-6" />
        <h2 className="mb-3 text-sm font-medium text-fg-muted">Materiały do nauki</h2>
        {isError ? (
          <ErrorState message={loadErrorMessage(error, "kategorii")} onRetry={() => refetch()} />
        ) : categories === undefined ? (
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
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
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