import { Link, useParams } from "react-router-dom";
import { BookOpen, FolderOpen } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { pluralizePl } from "../../lib/plural";
import { Breadcrumbs } from "./Breadcrumbs";
import { CatalogTile, TileGrid } from "./CatalogTile";
import { useTestCatalog } from "./hooks";
import { OriginFilterChip } from "./OriginFilterChip";
import { isFilterActive, useOriginFilter } from "./originFilter";
import { StartAllButton } from "./StartButtons";

/** Poziom 2: przedmioty / akty prawne w wybranym rodzaju. */
export function TestCategoryPage() {
  const { categoryId } = useParams();
  const { data, isLoading, isError, refetch } = useTestCatalog();
  const category = data?.categories.find((c) => String(c.id) === categoryId);
  const filterActive = isFilterActive(useOriginFilter().data);

  if (isLoading) {
    return (
      <div className="px-4 pt-6 sm:px-8">
        <Skeleton className="mb-6 h-8 w-64" />
        <TileGrid>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </TileGrid>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="px-4 pt-6 sm:px-8">
        <ErrorState message="Nie udało się pobrać listy testów." onRetry={() => refetch()} />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="px-4 pt-6 sm:px-8">
        <EmptyState
          icon={FolderOpen}
          title="Nie znaleziono tego rodzaju"
          description="Mógł zostać usunięty albo adres jest nieprawidłowy."
          action={
            <Link to={ROUTES.tests} className="text-sm text-accent underline">
              Wróć do Testów
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "Testy", to: ROUTES.tests }, { label: category.name }]} />
      <PageHeader
        title={category.name}
        actions={
          <>
            <OriginFilterChip />
            {category.questionCount > 0 && (
              <StartAllButton to={ROUTES.testCategory(category.id)} label="Test z całego rodzaju" />
            )}
          </>
        }
      />

      <div className="flex flex-col gap-6 px-4 pb-8 sm:px-8">
        <section aria-labelledby="test-items" className="flex flex-col gap-3">
          <h2 id="test-items" className="text-sm font-medium text-fg-muted">
            {category.itemsLabel}
          </h2>

          {category.subjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Wkrótce"
              description={`W tym rodzaju nie ma jeszcze pozycji (${category.itemsLabel.toLowerCase()}).`}
            />
          ) : (
            <TileGrid>
              {category.subjects.map((subject) => (
                <CatalogTile
                  key={subject.id}
                  to={ROUTES.testsSubject(category.id, subject.id)}
                  icon={BookOpen}
                  title={subject.name}
                  subtitle={`${subject.sources.length} ${pluralizePl(subject.sources.length, {
                    one: "źródło",
                    few: "źródła",
                    many: "źródeł",
                  })}`}
                  counts={subject}
                  emptyLabel={filterActive ? "Brak w filtrze" : undefined}
                />
              ))}
            </TileGrid>
          )}
        </section>
      </div>
    </div>
  );
}
