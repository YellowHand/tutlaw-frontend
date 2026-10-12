import { ClipboardList, FolderOpen } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { CatalogTile, TileGrid } from "./CatalogTile";
import { iconForCategory } from "./categoryIcons";
import { describeItems } from "./format";
import { useTestCatalog } from "./hooks";
import { MistakesCard } from "./MistakesCard";
import { StartTestCard } from "./StartTestCard";

/** Poziom 1: rodzaj (Student, Prawo karne i postępowanie karne, ...). */
export function TestsPage() {
  const { data, isLoading, isError, refetch } = useTestCatalog();

  return (
    <div>
      <PageHeader
        title="Testy"
        subtitle="Wybierz rodzaj, potem przedmiot lub akt prawny. Pytania, w których się pomylisz, wracają jako powtórki."
      />

      <div className="flex flex-col gap-6 px-4 pb-8 sm:px-8">
        <StartTestCard
          icon={ClipboardList}
          title="Test z całego materiału"
          description="Pytania ze wszystkich rodzajów naraz: zaległe powtórki i nowe pytania."
          to={ROUTES.testAll}
        />

        <MistakesCard />

        <section aria-labelledby="test-kinds" className="flex flex-col gap-3">
          <h2 id="test-kinds" className="text-sm font-medium text-fg-muted">
            Rodzaj
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
                />
              ))}
            </TileGrid>
          )}
        </section>
      </div>
    </div>
  );
}
