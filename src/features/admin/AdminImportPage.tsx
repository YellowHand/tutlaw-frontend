import { useRef, useState, type ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, FileSearch, Save } from "lucide-react";
import { importQuestions, type ImportFormat, type ImportReport } from "../../api/admin";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { serverMessage } from "../../lib/errors";
import { formatCount } from "../tests/format";
import { ImportReportView } from "./ImportReportView";
import { useAdminActOptions, useAdminMutation, useAdminSources } from "./adminQueries";
import { FormError, SelectField, TextAreaField } from "./adminUi";
import {
  decodeImportBytes,
  downloadTextFile,
  guessImportFormat,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_QUESTIONS,
  SAMPLE_CSV,
  SAMPLE_JSON,
} from "./importFile";

/** Powyżej tej długości nie pokazujemy treści pliku w polu tekstowym (przeglądarka zwalnia przy wielkich polach). */
const EDITABLE_LIMIT = 100_000;

/**
 * Import pytań z pliku CSV albo JSON w trzech krokach: wybór pliku, (opcjonalnie) domyślny akt i źródło, sprawdzenie i
 * zapis. Sprawdzenie niczego nie zapisuje i pokazuje, co się stanie z każdym wierszem; zapis jest możliwy dopiero dla
 * pliku bez błędów i dla treści dokładnie takiej, jaką sprawdzono.
 */
export function AdminImportPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const [format, setFormat] = useState<ImportFormat>("CSV");
  const [defaultAct, setDefaultAct] = useState("");
  const [defaultSource, setDefaultSource] = useState("");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [checkedKey, setCheckedKey] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const acts = useAdminActOptions();
  const sources = useAdminSources();

  const currentKey = JSON.stringify([format, content, defaultAct, defaultSource]);
  const stale = report !== null && checkedKey !== currentKey;
  const large = content.length > EDITABLE_LIMIT;

  const request = (dryRun: boolean) => ({
    format,
    content,
    dryRun,
    defaultAct: defaultAct || undefined,
    defaultSource: defaultSource || undefined,
  });

  const check = useMutation({
    mutationFn: () => importQuestions(request(true)),
    onSuccess: (result) => {
      setReport(result);
      setCheckedKey(currentKey);
      setError(null);
    },
    onError: (e) => {
      setReport(null);
      setError(serverMessage(e, "Nie udało się sprawdzić pliku."));
    },
  });

  const save = useAdminMutation(
    () => importQuestions(request(false)),
    (result) => {
      setReport(result);
      setCheckedKey(currentKey);
      setError(null);
    }
  );

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setReport(null);
    setError(null);
    setNotice(null);
    if (file.size > MAX_IMPORT_BYTES) {
      setError(`Plik jest za duży (${formatCount(Math.round(file.size / 1000))} kB). Najwięcej to ${formatCount(MAX_IMPORT_BYTES / 1000)} kB; podziel go na części.`);
      return;
    }
    const { text, encoding } = decodeImportBytes(await file.arrayBuffer());
    setFileName(file.name);
    setContent(text);
    setFormat(guessImportFormat(file.name, text));
    if (encoding === "windows-1250") {
      setNotice("Plik nie był w UTF-8, więc odczytano go jako Windows-1250 (tak zapisuje polski Excel). Sprawdź w raporcie, czy polskie litery się zgadzają.");
    }
  }

  const empty = content.trim() === "";
  const canSave = report !== null && !stale && !report.saved && report.errors === 0 && report.ok > 0 && !save.isPending;
  const pending = check.isPending || save.isPending;

  return (
    <div>
      <PageHeader title="Import pytań" subtitle="Wczytaj pytania z pliku CSV albo JSON: najpierw sprawdzenie, potem zapis" />
      <div className="flex max-w-4xl flex-col gap-4 px-4 pb-8 sm:px-8">
        <Card className="flex flex-col gap-4" data-testid="import-step-file">
          <h2 className="text-base font-semibold">1. Plik z pytaniami</h2>
          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileInput} type="file" accept=".csv,.tsv,.json,.txt,text/csv,application/json,text/plain" onChange={onFile} className="sr-only" id="import-file" aria-label="Plik z pytaniami" tabIndex={-1} data-testid="import-file" />
            <Button type="button" variant="secondary" onClick={() => fileInput.current?.click()} data-testid="import-pick">
              Wybierz plik
            </Button>
            <span className="text-sm text-fg-muted" data-testid="import-file-name">
              {fileName ? `${fileName} (${formatCount(content.length)} znaków)` : "Nie wybrano pliku. Możesz też wkleić treść poniżej."}
            </span>
          </div>
          {notice && (
            <p role="status" className="text-sm" data-testid="import-notice">
              {notice}
            </p>
          )}
          <SelectField label="Format" value={format} onChange={(e) => setFormat(e.target.value as ImportFormat)} data-testid="import-format">
            <option value="CSV">CSV (arkusz; średnik, przecinek albo tabulator)</option>
            <option value="JSON">JSON</option>
          </SelectField>
          {large ? (
            <p className="text-sm text-fg-muted">Plik jest duży, więc jego treści nie pokazujemy. Wybierz inny plik, żeby go podmienić.</p>
          ) : (
            <TextAreaField
              label="Treść pliku"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              spellCheck={false}
              className="font-mono text-xs"
              data-testid="import-content"
            />
          )}
        </Card>

        <Card className="flex flex-col gap-4" data-testid="import-step-defaults">
          <div>
            <h2 className="text-base font-semibold">2. Domyślny akt i źródło (nie musisz)</h2>
            <p className="text-sm text-fg-muted">Uzupełniają wiersze, w których pola „akt” albo „zrodlo” są puste. Wartość z pliku zawsze ma pierwszeństwo.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Akt domyślny" value={defaultAct} onChange={(e) => setDefaultAct(e.target.value)} data-testid="import-default-act">
              <option value="">Brak (akt z pliku)</option>
              {(acts.data ?? []).map((act) => (
                <option key={act.id} value={act.slug}>
                  {act.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Źródło domyślne" value={defaultSource} onChange={(e) => setDefaultSource(e.target.value)} data-testid="import-default-source">
              <option value="">Brak (źródło z pliku)</option>
              {(sources.data ?? []).map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </SelectField>
          </div>
        </Card>

        <Card className="flex flex-col gap-3" data-testid="import-step-check">
          <h2 className="text-base font-semibold">3. Sprawdź i zapisz</h2>
          <p className="text-sm text-fg-muted">
            Sprawdzenie niczego nie zapisuje. Zapis dodaje wszystkie poprawne pytania naraz, ale tylko wtedy, gdy w pliku nie ma żadnego błędu. Powtórzenia (to samo pytanie w
            tym samym źródle) są pomijane, więc ten sam plik można wczytać ponownie.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={empty || pending}
              onClick={() => {
                setNotice(null);
                check.mutate();
              }}
              data-testid="import-check"
            >
              <FileSearch size={16} aria-hidden="true" />
              {check.isPending ? "Sprawdzam..." : "Sprawdź plik"}
            </Button>
            <Button
              type="button"
              disabled={!canSave}
              onClick={() => save.mutate(undefined, { onError: (e) => setError(serverMessage(e, "Nie udało się zapisać pytań.")) })}
              data-testid="import-save"
            >
              <Save size={16} aria-hidden="true" />
              {save.isPending ? "Zapisuję..." : report && report.errors === 0 && report.ok > 0 && !report.saved ? `Zapisz ${formatCount(report.ok)} pytań` : "Zapisz pytania"}
            </Button>
          </div>
          <FormError message={error} />
        </Card>

        {report && <ImportReportView report={report} format={format} stale={stale} />}

        <Card className="flex flex-col gap-3" data-testid="import-help">
          <h2 className="text-base font-semibold">Jak przygotować plik</h2>
          <details className="text-sm">
            <summary className="min-h-11 cursor-pointer py-2 font-medium">Kolumny CSV i pola JSON</summary>
            <div className="flex flex-col gap-2 pb-2 text-fg-muted">
              <p>
                W CSV pierwszy wiersz to nazwy kolumn. Nazwy mogą być polskie albo angielskie, wielkość liter i polskie znaki nie mają znaczenia. W JSON jest lista obiektów
                (albo obiekt z listą „pytania” i polami „akt” oraz „zrodlo” dla całej listy); odpowiedzi to pola a, b, c albo lista „odpowiedzi” z trzema elementami.
              </p>
              <ul className="list-disc pl-5">
                <li>
                  <strong className="text-fg">tresc, a, b, c, poprawna</strong>: wymagane. Poprawna to A, B albo C. Odpowiedzi muszą się różnić.
                </li>
                <li>
                  <strong className="text-fg">akt</strong>: adres (slug) albo nazwa aktu z zakładki Akty prawne.
                </li>
                <li>
                  <strong className="text-fg">zrodlo</strong>: adres albo nazwa arkusza, „autorskie” albo zapis „Aplikacja rok”, np. „Notarialna 2025”. Brakujący arkusz zostanie
                  założony przy zapisie.
                </li>
                <li>
                  <strong className="text-fg">rozdzial</strong>: nazwa rozdziału tego aktu (dokładnie jak w panelu; nieznana nazwa to błąd).
                </li>
                <li>
                  <strong className="text-fg">wyjasnienie, podstawa</strong>: opcjonalne. <strong className="text-fg">zmiana w prawie</strong> (data RRRR-MM-DD albo D.M.RRRR) i{" "}
                  <strong className="text-fg">opis zmiany</strong>: opcjonalne, opis wymaga daty.
                </li>
              </ul>
              <p>W jednym pliku może być najwyżej {formatCount(MAX_IMPORT_QUESTIONS)} pytań i {formatCount(MAX_IMPORT_BYTES / 1_000_000)} MB.</p>
            </div>
          </details>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => downloadTextFile("wzor-pytania.csv", SAMPLE_CSV, "text/csv")} data-testid="import-sample-csv">
              <Download size={16} aria-hidden="true" />
              Pobierz wzór CSV
            </Button>
            <Button type="button" variant="secondary" onClick={() => downloadTextFile("wzor-pytania.json", SAMPLE_JSON, "application/json")} data-testid="import-sample-json">
              <Download size={16} aria-hidden="true" />
              Pobierz wzór JSON
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
