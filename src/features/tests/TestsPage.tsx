import { FolderOpen } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { CatalogTile, TileGrid } from "./CatalogTile";
import { iconForCategory } from "./categoryIcons";
import { describeItems } from "./format";
import { useDueCount } from "../review/hooks";
import { useTestCatalog } from "./hooks";
import { OriginFilterChip } from "./OriginFilterChip";
import { isFilterActive, useOriginFilter } from "./originFilter";
import { DueReviewsCard } from "./DueReviewsCard";
import { QuickStart } from "./QuickStart";

/** Poziom 1: rodzaj (Student, Prawo karne i postępowanie karne, ...). */
export function TestsPage() {
  const { data, isLoading, isError, refetch } = useTestCatalog();
  // To samo zapytanie co odznaka „Testy" w menu, więc nie kosztuje dodatkowego żądania. Błąd po prostu nic nie dopisuje.
  const { data: dueTests } = useDueCount("TEST");
  // Z włączonym filtrem pochodzenia pusta pozycja znaczy „nic w wybranych pochodzeniach", a nie „wkrótce".
  const filterActive = isFilterActive(useOriginFilter().data);

  return (
    <div>
      <PageHeader title="Testy" actions={<OriginFilterChip />} />

      <div className="flex flex-col gap-6 px-4 pb-8 sm:px-8">
        <DueReviewsCard count={dueTests ?? 0} />

        <QuickStart />

        <section aria-labelledby="test-kinds" className="flex flex-col gap-3">
          <h2 id="test-kinds" className="text-sm font-medium text-fg-muted">
            Wybierz rodzaj
          </h2>

          {isLoading ? (
            <TileGrid>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-36 w-full" />
              ))}
            </TileGrid>
          ) : isError || !data ? (
            <ErrorState message="Nie udało się pobrać listy testów." onRetry={() => refetch()} />
          ) : data.categories.length === 0 ? (
            <EmptyState icon={FolderOpen} title="Brak testów" description="Wkrótce pojawią się tu pytania." />
          ) : (
            <TileGrid>
              {data.categories.map((category) => (
                <CatalogTile
                  key={category.id}
                  to={ROUTES.testsCategory(category.id)}
                  icon={iconForCategory(category.slug)}
                  title={category.name}
                  subtitle={describeItems(category.subjects.length, category.itemsLabel)}
                  counts={category}
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
