import { useState } from "react";
import { Link } from "react-router-dom";
import type { ImportFormat, ImportReport, ImportRowStatus } from "../../api/admin";
import { Card } from "../../components/ui/Card";
import { cn } from "../../lib/cn";
import { ROUTES } from "../../config/routes";
import { formatCount } from "../tests/format";
import { Badge } from "./adminUi";

const STATUS_TEXT: Record<ImportRowStatus, string> = { OK: "Poprawne", DUPLICATE: "Powtórzenie", ERROR: "Błąd" };

interface ImportReportViewProps {
  report: ImportReport;
  format: ImportFormat;
  /** Raport jest sprzed ostatniej zmiany pliku albo ustawień: zapis jest wtedy zablokowany. */
  stale: boolean;
}

/** Raport z importu: liczniki, uwagi i lista wierszy (domyślnie tylko problemy, gdy jakieś są). */
export function ImportReportView({ report, format, stale }: ImportReportViewProps) {
  const problems = report.errors + report.duplicates;
  const [onlyProblems, setOnlyProblems] = useState(problems > 0);
  const rows = onlyProblems ? report.rows.filter((r) => r.status !== "OK") : report.rows;
  const unit = format === "CSV" ? "Wiersz" : "Pozycja";

  return (
    <Card className="flex flex-col gap-3" data-testid="import-report">
      {report.saved ? (
        <div role="status" className="flex flex-col gap-1" data-testid="import-saved">
          <h3 className="text-base font-semibold">Zapisano pytań: {formatCount(report.created)}</h3>
          <p className="text-sm text-fg-muted">
            Pytania są już w bazie i widoczne dla użytkowników.{" "}
            <Link to={ROUTES.adminQuestions} className="underline underline-offset-4">
              Zobacz pytania
            </Link>
            . Żeby automat ocenił nowe pytania, uruchom go w zakładce{" "}
            <Link to={ROUTES.adminMarks} className="underline underline-offset-4">
              Oznaczenia
            </Link>
            .
          </p>
        </div>
      ) : (
        <h3 className="text-base font-semibold">Wynik sprawdzenia pliku</h3>
      )}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Counter label="Pytań w pliku" value={report.total} testId="import-total" />
        <Counter label="Poprawne" value={report.ok} testId="import-ok" />
        <Counter label="Powtórzenia (pominięte)" value={report.duplicates} testId="import-duplicates" />
        <Counter label="Błędy" value={report.errors} testId="import-errors" tone={report.errors > 0 ? "warn" : "neutral"} />
      </dl>
      {!report.saved && report.errors > 0 && (
        <p role="alert" className="text-sm" data-testid="import-blocked">
          W pliku są błędy, więc <strong>nic nie zostanie zapisane</strong>. Popraw wiersze z błędami i sprawdź plik jeszcze raz.
        </p>
      )}
      {!report.saved && report.errors === 0 && report.ok > 0 && !stale && (
        <p className="text-sm text-fg-muted" data-testid="import-ready">
          Plik jest poprawny. Zapis doda {formatCount(report.ok)} {report.ok === 1 ? "pytanie" : "pytań"}
          {report.duplicates > 0 ? ` i pominie powtórzenia (${formatCount(report.duplicates)})` : ""}.
        </p>
      )}
      {!report.saved && report.errors === 0 && report.ok === 0 && (
        <p className="text-sm text-fg-muted">Nie ma nic do zapisania: wszystkie pytania z pliku już są w bazie.</p>
      )}
      {report.newSheets.length > 0 && (
        <p className="text-sm" data-testid="import-new-sheets">
          {report.saved ? "Założono arkusze" : "Zostaną założone arkusze"}: {report.newSheets.join(", ")}.
        </p>
      )}
      {report.ignoredColumns.length > 0 && (
        <p className="text-sm text-fg-muted" data-testid="import-ignored">
          Pominięto nieznane pola: {report.ignoredColumns.join(", ")}.
        </p>
      )}
      {stale && !report.saved && (
        <p role="status" className="text-sm text-fg-muted" data-testid="import-stale">
          Plik albo ustawienia zmieniły się od ostatniego sprawdzenia. Sprawdź plik ponownie, żeby móc go zapisać.
        </p>
      )}
      {report.rows.length > 0 && (
        <div className="flex flex-col gap-2">
          {problems > 0 && (
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} data-testid="import-only-problems" />
              Pokaż tylko błędy i powtórzenia
            </label>
          )}
          <ul className="flex flex-col gap-2" data-testid="import-rows">
            {rows.map((row) => (
              <li
                key={`${row.row}-${row.status}`}
                className={cn("flex flex-col gap-1 rounded-xl border p-3 text-sm", row.status === "ERROR" ? "border-danger/40 bg-danger/10" : "border-line")}
                data-testid={`import-row-${row.row}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium tabular-nums">
                    {unit} {row.row}
                  </span>
                  <Badge tone={row.status === "ERROR" ? "warn" : "neutral"}>{STATUS_TEXT[row.status]}</Badge>
                </div>
                {row.message && <p>{row.message}</p>}
                {row.preview && <p className="text-fg-muted break-words">{row.preview}</p>}
              </li>
            ))}
          </ul>
          {report.rowsTruncated && (
            <p className="text-xs text-fg-muted" data-testid="import-truncated">
              Lista pokazuje tylko część wierszy (najpierw błędy). Liczniki dotyczą całego pliku.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function Counter({ label, value, testId, tone = "neutral" }: { label: string; value: number; testId: string; tone?: "neutral" | "warn" }) {
  return (
    <div className={cn("rounded-xl p-3", tone === "warn" ? "bg-danger/10 ring-1 ring-danger/40" : "bg-surface-2")}>
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="text-2xl font-bold tabular-nums" data-testid={testId}>
        {formatCount(value)}
      </dd>
    </div>
  );
}
