import { Link, useParams } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { parseId } from "../../lib/ids";
import { PoolChip } from "../pool/PoolChip";
import { Breadcrumbs } from "./Breadcrumbs";
import { CatalogTile, TileGrid } from "./CatalogTile";
import { fieldIconFor } from "./fieldIcon";
import { isEmpty } from "./format";
import { useTestCatalog } from "./hooks";
import { StartAllButton } from "./StartButtons";

/**
 * Poziom 2: akty prawne jednej dziedziny (tylko te z puli użytkownika). Akt jest liściem katalogu: kafelek od razu
 * otwiera test z jego pytań. Przycisk przy tytule zaczyna test z całej dziedziny.
 */
export function TestFieldPage() {
  const { fieldId } = useParams();
  const id = parseId(fieldId);
  const { data, isLoading, isError, refetch } = useTestCatalog();
  const field = data?.fields.find((f) => f.id === id);

  if (isLoading) {
    return (
      <div>
        <Breadcrumbs items={[{ label: "Testy", to: ROUTES.tests }, { label: "…" }]} />
        <PageHeader title="Ładowanie…" />
        <div className="px-4 pb-8 sm:px-8">
          <TileGrid>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </TileGrid>
        </div>
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

  if (!field) {
    return (
      <div className="px-4 pt-6 sm:px-8">
        <EmptyState icon={FolderOpen} title="Nie ma takiej dziedziny" description="Wróć do listy Testów i wybierz dziedzinę." />
        <p className="mt-4 text-center">
          <Link to={ROUTES.tests} className="text-accent-ink underline">
            Wróć do Testów
          </Link>
        </p>
      </div>
    );
  }

  const Icon = fieldIconFor(field.slug);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Testy", to: ROUTES.tests }, { label: field.name }]} />
      <PageHeader
        title={field.name}
        actions={
          <>
            <PoolChip />
            {!isEmpty(field) && <StartAllButton to={ROUTES.testScope({ fieldId: field.id })} label="Test z całej dziedziny" />}
          </>
        }
      />

      <div className="px-4 pb-8 sm:px-8">
        {field.acts.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Brak aktów w Twojej puli"
            description="Twoja ścieżka nie obejmuje aktów z tej dziedziny. Możesz to zmienić w oknie „Pula pytań”."
          />
        ) : (
          <TileGrid>
            {field.acts.map((act) => (
              <CatalogTile
                key={act.id}
                to={ROUTES.testScope({ actId: act.id })}
                icon={Icon}
                title={act.name}
                subtitle={act.kind === "TOPIC" ? "Zagadnienie" : undefined}
                counts={act}
              />
            ))}
          </TileGrid>
        )}
      </div>
    </div>
  );
}
