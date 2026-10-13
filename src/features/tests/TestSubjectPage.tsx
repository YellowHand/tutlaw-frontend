import { Link, useParams } from "react-router-dom";
import { BookOpen, ClipboardList, FolderOpen, Layers, Play } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import type { TestSourceNode } from "../../api/tests";
import { ROUTES } from "../../config/routes";
import { Breadcrumbs } from "./Breadcrumbs";
import { ProgressLine, TileGrid } from "./CatalogTile";
import { isEmpty } from "./format";
import { useTestCatalog } from "./hooks";
import { OriginFilterBar } from "./OriginFilterBar";
import { isFilterActive, useOriginFilter } from "./originFilter";
import { START_BUTTON, StartTestCard } from "./StartTestCard";

function SourceCard({ subjectId, source }: { subjectId: number; source: TestSourceNode }) {
  const isTextbook = source.sourceType === "TEXTBOOK";
  const hasQuestions = source.questionCount > 0;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          {isTextbook ? <BookOpen size={20} aria-hidden="true" /> : <Layers size={20} aria-hidden="true" />}
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold">{source.name}</h2>
          <p className="text-xs text-fg-muted">
            {isTextbook ? "Podręcznik: test obejmuje rozdziały oznaczone jako przeczytane" : "Pula pytań"}
          </p>
        </div>
      </div>

      <ProgressLine counts={source} />

      {isTextbook && source.lockedCount > 0 && !hasQuestions && (
        <p className="text-sm text-fg-muted">Zaznacz przeczytane rozdziały, żeby odblokować pytania do testu.</p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-3">
        {hasQuestions ? (
          <Link to={ROUTES.test(subjectId, source.id)} className={START_BUTTON}>
            <Play size={16} aria-hidden="true" />
            Rozpocznij test
          </Link>
        ) : null}
        {isTextbook && (
          <Link to={ROUTES.flashcardsChapters(subjectId, source.id)} className="text-sm text-accent underline">
            Wybierz rozdziały
          </Link>
        )}
      </div>
    </Card>
  );
}

/** Poziom 3: źródła (pule pytań, podręczniki) wybranego przedmiotu / aktu prawnego. */
export function TestSubjectPage() {
  const { categoryId, subjectId } = useParams();
  const { data, isLoading, isError, refetch } = useTestCatalog();
  const category = data?.categories.find((c) => String(c.id) === categoryId);
  const subject = category?.subjects.find((s) => String(s.id) === subjectId);
  const filterActive = isFilterActive(useOriginFilter().data);

  if (isLoading) {
    return (
      <div className="px-4 pt-6 sm:px-8">
        <Skeleton className="mb-6 h-8 w-64" />
        <TileGrid>
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
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

  if (!category || !subject) {
    return (
      <div className="px-4 pt-6 sm:px-8">
        <EmptyState
          icon={FolderOpen}
          title="Nie znaleziono tej pozycji"
          description="Mogła zostać przeniesiona albo adres jest nieprawidłowy."
          action={
            <Link to={ROUTES.tests} className="text-sm text-accent underline">
              Wróć do Testów
            </Link>
          }
        />
      </div>
    );
  }

  // Testy pokazują tylko źródła, w których są pytania testowe (także jeszcze zablokowane). Źródło złożone wyłącznie
  // z fiszek (np. podręcznik bez pytań ABC) należy do Fiszek i tu tylko zaśmiecałoby ekran.
  const sources = subject.sources.filter((source) => !isEmpty(source));

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Testy", to: ROUTES.tests },
          { label: category.name, to: ROUTES.testsCategory(category.id) },
          { label: subject.name },
        ]}
      />
      <PageHeader title={subject.name} subtitle="Wybierz źródło pytań." />

      <div className="flex flex-col gap-6 px-4 pb-8 sm:px-8">
        <OriginFilterBar />

        {sources.length > 1 && subject.questionCount > 0 && (
          <StartTestCard
            icon={ClipboardList}
            title={`Test z całego: ${subject.name}`}
            description="Pytania ze wszystkich źródeł poniżej naraz."
            to={ROUTES.test(subject.id)}
          />
        )}

        {sources.length === 0 ? (
          filterActive ? (
            <EmptyState
              icon={BookOpen}
              title="Brak w filtrze"
              description="W wybranych pochodzeniach nie ma pytań z tej pozycji. Zmień filtr powyżej."
            />
          ) : (
            <EmptyState icon={BookOpen} title="Wkrótce" description="Do tej pozycji nie dodano jeszcze pytań testowych." />
          )
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {sources.map((source) => (
              <SourceCard key={source.id} subjectId={subject.id} source={source} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
