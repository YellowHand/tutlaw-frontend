import { ClipboardList, FolderOpen, Timer } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { CatalogTile, TileGrid } from "./CatalogTile";
import { iconForCategory } from "./categoryIcons";
import { describeItems } from "./format";
import { pluralizePl } from "../../lib/plural";
import { useDueCount } from "../review/hooks";
import { useTestCatalog } from "./hooks";
import { MistakesCard } from "./MistakesCard";
import { StartTestCard } from "./StartTestCard";

/** Poziom 1: rodzaj (Student, Prawo karne i postępowanie karne, ...). */
export function TestsPage() {
  const { data, isLoading, isError, refetch } = useTestCatalog();
  // To samo zapytanie co odznaka „Testy" w menu, więc nie kosztuje dodatkowego żądania. Błąd po prostu nic nie dopisuje.
  const { data: dueTests } = useDueCount("TEST");

  const allTestsDescription = dueTests
    ? `Pytania ze wszystkich rodzajów naraz. Do powtórki: ${dueTests} ${pluralizePl(dueTests, {
        one: "pytanie",
        few: "pytania",
        many: "pytań",
      })}, a do tego nowe pytania.`
    : "Pytania ze wszystkich rodzajów naraz: zaległe powtórki i nowe pytania.";

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
          description={allTestsDescription}
          to={ROUTES.testAll}
        />

        <MistakesCard />

        <StartTestCard
          icon={Timer}
          title="Egzamin próbny"
          description="Losowy zestaw pytań z limitem czasu i progiem zaliczenia, a na końcu raport. Nie zmienia Twoich powtórek."
          to={ROUTES.exam}
          actionLabel="Przejdź do egzaminu"
        />

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
