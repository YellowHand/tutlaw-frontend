import { FolderOpen } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { PoolChip } from "../pool/PoolChip";
import { useDueCount } from "../review/hooks";
import { CatalogTile, TileGrid } from "./CatalogTile";
import { DueReviewsCard } from "./DueReviewsCard";
import { fieldIconFor } from "./fieldIcon";
import { describeActs } from "./format";
import { useTestCatalog } from "./hooks";
import { QuickStart } from "./QuickStart";
import { SourcesSection } from "./SourcesSection";

/**
 * Poziom 1: dziedziny prawa. Każdy widzi wszystkie dziedziny, ale w każdej tylko akty swojej puli (ścieżka, zawężenie
 * i filtr źródeł). Dziedzina bez aktów w puli jest wyszarzona. Pod dziedzinami: te same pytania według źródła.
 */
export function TestsPage() {
  const { data, isLoading, isError, refetch } = useTestCatalog();
  // To samo zapytanie co odznaka „Testy" w menu, więc nie kosztuje dodatkowego żądania. Błąd po prostu nic nie dopisuje.
  const { data: dueTests } = useDueCount("TEST");

  return (
    <div>
      <PageHeader title="Testy" actions={<PoolChip />} />

      <div className="flex flex-col gap-6 px-4 pb-8 sm:px-8">
        <DueReviewsCard count={dueTests ?? 0} />

        <QuickStart />

        <section aria-labelledby="test-fields" className="flex flex-col gap-3">
          <h2 id="test-fields" className="text-sm font-medium text-fg-muted">
            Wybierz dziedzinę
          </h2>

          {isLoading ? (
            <TileGrid>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-36 w-full" />
              ))}
            </TileGrid>
          ) : isError || !data ? (
            <ErrorState message="Nie udało się pobrać listy testów." onRetry={() => refetch()} />
          ) : data.fields.length === 0 ? (
            <EmptyState icon={FolderOpen} title="Brak testów" description="Wkrótce pojawią się tu pytania." />
          ) : (
            <TileGrid>
              {data.fields.map((field) => (
                <CatalogTile
                  key={field.id}
                  to={ROUTES.testsField(field.id)}
                  icon={fieldIconFor(field.slug)}
                  title={field.name}
                  subtitle={field.acts.length === 0 ? "Brak aktów w Twojej puli" : describeActs(field.acts)}
                  counts={field}
                  emptyLabel={field.acts.length === 0 ? "Poza pulą" : undefined}
                />
              ))}
            </TileGrid>
          )}
        </section>

        {data && <SourcesSection sources={data.sources} />}
      </div>
    </div>
  );
}
