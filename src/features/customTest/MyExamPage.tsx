import { Link, useParams } from "react-router-dom";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { ExamResultView } from "../exam/ExamResultView";
import { useExamAttempt } from "../exam/hooks";
import { Breadcrumbs } from "../tests/Breadcrumbs";

/**
 * Raport zapisanego podejścia do egzaminu próbnego, otwierany z „Moich testów" → Egzaminy. Ten sam raport co zaraz po
 * egzaminie (werdykt, wyniki wg źródeł, przegląd pytań), tylko bez „Nowy egzamin" i z powrotem do listy.
 */
export function MyExamPage() {
  const { id } = useParams();
  const attemptId = id !== undefined && /^\d+$/.test(id) ? Number(id) : null;
  const { data, isLoading, isError, refetch } = useExamAttempt(attemptId);

  if (attemptId === null || isError) {
    return (
      <div>
        <Breadcrumbs
          items={[{ label: "Testy", to: ROUTES.tests }, { label: "Moje testy", to: ROUTES.myExams }, { label: "Egzamin" }]}
        />
        <div className="px-4 pt-6 sm:px-8">
          <ErrorState
            message={
              attemptId === null
                ? "Nie ma takiego egzaminu."
                : "Nie udało się pobrać raportu tego egzaminu. Starsze podejścia mają zapisany tylko wynik."
            }
            onRetry={attemptId === null ? undefined : () => refetch()}
          />
          <Link to={ROUTES.myExams} className="mt-4 inline-flex min-h-11 items-center text-sm text-accent-ink underline">
            Wróć do listy egzaminów
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 sm:p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return <ExamResultView result={data} saved />;
}
