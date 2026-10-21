import { Link } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { formatCount } from "../tests/format";
import { useAdminOverview } from "./adminQueries";

/** Przegląd: ile jest czego w bazie (z odnośnikami do działów) i czy czekają nowe zgłoszenia błędów. */
export function AdminOverviewPage() {
  const { data, isLoading, isError, refetch } = useAdminOverview();

  return (
    <div>
      <PageHeader title="Panel administratora" subtitle="Aplikacje, przedmioty, akty prawne, arkusze, terminy, pytania, oznaczenia i zgłoszenia błędów" />
      <div className="flex max-w-5xl flex-col gap-6 px-4 pb-8 sm:px-8">
        {isLoading && <Skeleton className="h-56 w-full" />}
        {isError && <ErrorState message="Nie udało się pobrać przeglądu." onRetry={() => refetch()} />}
        {data && (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="admin-overview">
              <Tile to={ROUTES.adminTracks} label="Aplikacje" value={data.applications} note="z egzaminem i terminem" />
              <Tile to={ROUTES.adminCourses} label="Przedmioty Studenta" value={data.courses} note="w ścieżce Student" />
              <Tile
                to={ROUTES.adminActs}
                label="Akty prawne"
                value={data.acts}
                note={data.hiddenActs > 0 ? `w tym ukrytych: ${formatCount(data.hiddenActs)}` : "żaden nie jest ukryty"}
              />
              <Tile to={ROUTES.adminActs} label="Rozdziały" value={data.sections} note={`w ${formatCount(data.fields)} dziedzinach`} />
              <Tile
                to={ROUTES.adminSheets}
                label="Arkusze egzaminów"
                value={data.sheets}
                note={data.hiddenSheets > 0 ? `w tym ukrytych: ${formatCount(data.hiddenSheets)}` : "żaden nie jest ukryty"}
              />
              <Tile
                to={ROUTES.adminQuestions}
                label="Pytania"
                value={data.questions}
                note={data.hiddenQuestions > 0 ? `w tym ukrytych: ${formatCount(data.hiddenQuestions)}` : "żadne nie jest ukryte"}
              />
            </ul>
            <Card>
              <h2 className="text-base font-semibold">Zgłoszenia błędów w pytaniach</h2>
              <p className="mt-1 text-sm text-fg-muted" data-testid="admin-new-reports">
                {data.newReports === 0 ? "Nie ma nowych zgłoszeń." : `Nowych zgłoszeń: ${formatCount(data.newReports)}.`}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-5">
                <Link to={ROUTES.adminReports} className={LINK} data-testid="admin-link-reports">
                  Przejrzyj zgłoszenia
                </Link>
                <Link to={ROUTES.adminMarks} className={LINK} data-testid="admin-link-marks">
                  Oznaczenia pytań
                </Link>
                <Link to={ROUTES.adminImport} className={LINK} data-testid="admin-link-import">
                  Importuj pytania
                </Link>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

const LINK =
  "inline-flex min-h-11 items-center text-sm font-medium text-accent-ink underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink";

function Tile({ to, label, value, note }: { to?: string; label: string; value: number; note: string }) {
  const body = (
    <>
      <span className="text-sm text-fg-muted">{label}</span>
      <span className="text-3xl font-bold tabular-nums">{formatCount(value)}</span>
      <span className="text-xs text-fg-muted">{note}</span>
    </>
  );
  const base = "flex h-full flex-col gap-1 rounded-2xl border border-line bg-surface p-5";
  return (
    <li>
      {to ? (
        <Link to={to} className={`${base} transition-colors hover:bg-surface-2`}>
          {body}
        </Link>
      ) : (
        <div className={base}>{body}</div>
      )}
    </li>
  );
}
