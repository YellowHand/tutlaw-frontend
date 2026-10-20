import { Link, useNavigate, useParams } from "react-router-dom";
import { FolderOpen, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { parseId } from "../../lib/ids";
import type { CustomTestPrefill } from "../customTest/prefill";
import { PoolChip } from "../pool/PoolChip";
import { Breadcrumbs } from "./Breadcrumbs";
import { CatalogTile, TileGrid } from "./CatalogTile";
import { fieldIconFor } from "./fieldIcon";
import { isEmpty } from "./format";
import { useTestCatalog } from "./hooks";
import { QUIET_BUTTON } from "./StartButtons";

/**
 * Student, poziom 2: akty prawne jednego przedmiotu. Akt jest liściem katalogu (kafelek otwiera test z jego pytań),
 * a test z całego przedmiotu układa się na ekranie „Własny test", gdzie przedmiot jest już zaznaczony.
 */
export function TestCoursePage() {
  const { courseId } = useParams();
  const id = parseId(courseId);
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useTestCatalog();
  const course = data?.courses.find((c) => c.id === id);

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

  if (!course) {
    return (
      <div className="px-4 pt-6 sm:px-8">
        <EmptyState
          icon={FolderOpen}
          title="Nie ma takiego przedmiotu"
          description="Wróć do listy Testów i wybierz przedmiot. Przedmioty zmienisz w oknie „Pula pytań”."
        />
        <p className="mt-4 text-center">
          <Link to={ROUTES.tests} className="text-accent-ink underline">
            Wróć do Testów
          </Link>
        </p>
      </div>
    );
  }

  // Akty przedmiotu z licznikami: katalog podaje je w dziedzinach, a przedmiot wskazuje tylko ich numery.
  const inCourse = new Set(course.actIds);
  const acts = data.fields.flatMap((field) =>
    field.acts.filter((act) => inCourse.has(act.id)).map((act) => ({ act, slug: field.slug }))
  );

  function startCustomTest() {
    if (!course) return;
    const prefill: CustomTestPrefill = {
      fieldIds: [],
      actIds: [],
      courseIds: [course.id],
      sourceGroups: [],
      kind: "ALL",
      requestedCount: 20,
    };
    navigate(ROUTES.customTest, { state: { prefill } });
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "Testy", to: ROUTES.tests }, { label: course.name }]} />
      <PageHeader
        title={course.name}
        actions={
          <>
            <PoolChip />
            {!isEmpty(course) && (
              <button type="button" onClick={startCustomTest} className={QUIET_BUTTON}>
                <SlidersHorizontal size={16} aria-hidden="true" />
                Własny test z przedmiotu
              </button>
            )}
          </>
        }
      />

      <div className="px-4 pb-8 sm:px-8">
        {acts.length === 0 ? (
          <EmptyState icon={FolderOpen} title="Brak pytań w tym przedmiocie" description="Wkrótce pojawią się tu pytania." />
        ) : (
          <TileGrid>
            {acts.map(({ act, slug }) => (
              <CatalogTile
                key={act.id}
                to={ROUTES.testScope({ actId: act.id })}
                icon={fieldIconFor(slug)}
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
