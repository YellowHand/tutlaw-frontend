import { useId, useMemo, useState, type FormEvent } from "react";
import { Landmark, Layers, PenLine, Play, RotateCcw, ScrollText, Trash2 } from "lucide-react";
import { startExam, type ExamAvailability, type ExamStart } from "../../api/exam";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { SectionCard, SummaryRow } from "../../components/ui/SectionCard";
import { Skeleton } from "../../components/ui/Skeleton";
import { cn } from "../../lib/cn";
import { serverMessage } from "../../lib/errors";
import { pluralizePl } from "../../lib/plural";
import { SOURCE_MODE_LABELS, SOURCE_MODE_ORDER, type SourceMode } from "../../lib/sourceMode";
import { ChoiceCard } from "../customTest/ChoiceCard";
import { usePool } from "../pool/hooks";
import { START_BUTTON } from "../tests/StartButtons";
import { EXAM_PASS_POINTS, EXAM_QUESTION_COUNT, formatClock } from "./format";
import { loadRememberedSettings, saveRememberedSettings, type ExamDraft, type ExamSourceChoice } from "./examStorage";
import { ExamSheetPicker } from "./ExamSheetPicker";
import { useExamAvailability, useExamSheets } from "./hooks";

/** To, co użytkownik ustawia przed egzaminem. Zakres, liczbę pytań i próg zaliczenia ustala format egzaminu. */
export interface ExamConfig {
  timeLimitMinutes: number | null;
  /** Źródło pytań egzaminu (te same trzy co w kreatorze testu); przy egzaminie MS z wybranego roku „MINISTRY". */
  source: SourceMode;
  /** Numer arkusza, gdy to egzamin MS z wybranego roku (w pozostałych null). */
  sheetId: number | null;
}

const TIME_LIMITS = { min: 1, max: 600 };

/** Cztery wybory: trzy źródła pytań do losowania i konkretny egzamin MS z poprzedniego roku. */
const EXAM_SOURCE_ORDER: readonly ExamSourceChoice[] = [...SOURCE_MODE_ORDER, "SHEETS"];
const EXAM_SOURCE_LABELS: Record<ExamSourceChoice, string> = { ...SOURCE_MODE_LABELS, SHEETS: "Egzaminy MS" };
/** Opis pod nazwą źródła. Dwa „ministerialne" wybory różnią się tym: losowe pytania z arkuszy albo jeden cały egzamin. */
const EXAM_SOURCE_HINTS: Record<ExamSourceChoice, string> = {
  ALL: "Ministerstwo i autorskie, losowo.",
  MINISTRY: "Losowe pytania ze wszystkich arkuszy.",
  AUTHORED: "Pytania dodane w aplikacji.",
  SHEETS: "Cały egzamin z wybranego roku.",
};
const SOURCE_ICONS: Record<ExamSourceChoice, typeof Layers> = { ALL: Layers, MINISTRY: Landmark, AUTHORED: PenLine, SHEETS: ScrollText };
const SOURCE_FIELD: Record<SourceMode, keyof ExamAvailability> = { ALL: "all", MINISTRY: "ministry", AUTHORED: "authored" };

const questionsWord = (n: number) => pluralizePl(n, { one: "pytanie", few: "pytania", many: "pytań" });
const examsWord = (n: number) => pluralizePl(n, { one: "egzamin", few: "egzaminy", many: "egzaminów" });

/** Próg zaliczenia krótszego egzaminu: ta sama część (100 ze 150), w górę do całego punktu (tak liczy serwer). */
const passPointsFor = (total: number) => Math.ceil((total * EXAM_PASS_POINTS) / EXAM_QUESTION_COUNT);

function parseInteger(raw: string): number | null {
  const trimmed = raw.trim();
  const value = Number(trimmed);
  return trimmed !== "" && Number.isInteger(value) ? value : null;
}

interface ExamSetupProps {
  /** Niedokończony egzamin z tej przeglądarki (jeśli jest). */
  draft: ExamDraft | null;
  onResume: () => void;
  onDiscard: () => void;
  onStarted: (start: ExamStart, config: ExamConfig) => void;
}

/**
 * Ekran przed egzaminem. Format jest stały: 150 pytań, zaliczenie od 100 punktów (liczy serwer), więc do ustawienia zostają
 * dwie rzeczy: źródło pytań i limit czasu. Źródło to albo losowanie z całej puli ścieżki (wszystkie, Ministerstwo
 * Sprawiedliwości, autorskie), albo konkretny egzamin MS z poprzedniego roku („Egzaminy MS": aplikacja i rok, cały arkusz
 * w oryginalnej kolejności). Po lewej wybór, po prawej przyklejony panel „Twój egzamin" z przyciskiem startu. Egzamin
 * ignoruje zawężenie zakresu nauki do wybranych aktów (losuje z wszystkich aktów ścieżki). Ćwiczenie z wybranego działu to
 * osobny test „Nauka" w Testach, który niczego nie zalicza.
 */
export function ExamSetup({ draft, onResume, onDiscard, onStarted }: ExamSetupProps) {
  const poolQuery = usePool();
  const availabilityQuery = useExamAvailability();
  const sheetsQuery = useExamSheets();
  const remembered = useMemo(() => loadRememberedSettings(), []);

  const [source, setSource] = useState<ExamSourceChoice>(remembered?.source ?? "ALL");
  // Wybór egzaminu MS (aplikacja i rok). Dopóki użytkownik niczego nie wybierze albo wybrane już nie istnieje, pokazujemy
  // jego aplikację (serwer daje ją pierwszą) i jej najnowszy egzamin.
  const [sheetTrackId, setSheetTrackId] = useState<number | null>(remembered?.sheetTrackId ?? null);
  const [sheetYear, setSheetYear] = useState<number | null>(remembered?.sheetYear ?? null);
  const [unlimited, setUnlimited] = useState(remembered !== null && remembered.timeLimitMinutes === null);
  // null = czas liczony automatycznie (minuta na pytanie), dopóki użytkownik sam go nie zmieni.
  const [timeInput, setTimeInput] = useState<string | null>(
    remembered?.timeCustomised && remembered.timeLimitMinutes !== null ? String(remembered.timeLimitMinutes) : null
  );
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const unlimitedId = useId();
  const formErrorId = useId();
  const sourceGroup = useId();

  // Ile pytań jest do wylosowania z wybranego źródła (serwer liczy to bez zawężenia puli do aktów i bez pytań
  // zawieszonych w testach). Gdy nie uda się tego sprawdzić, niczego nie zgadujemy i niczego nie blokujemy.
  const availability = availabilityQuery.data;
  const narrowed = poolQuery.data?.narrowed ?? false;
  const totalFor = (mode: SourceMode): number | null => (availability ? availability[SOURCE_FIELD[mode]] : null);

  const applications = sheetsQuery.data?.applications ?? [];
  const examCount = applications.reduce((n, app) => n + app.sheets.length, 0);
  const sheetApp = applications.find((app) => app.trackId === sheetTrackId) ?? applications[0] ?? null;
  const sheet = sheetApp?.sheets.find((s) => s.year === sheetYear) ?? sheetApp?.sheets[0] ?? null;
  const sheetName = sheetApp && sheet ? `${sheetApp.shortName} ${sheet.year}` : null;
  const onSheets = source === "SHEETS";

  // Liczba pytań wybranego źródła; przy egzaminie MS to pytania wybranego arkusza (null: jeszcze nie wiadomo).
  const available = onSheets ? (sheetsQuery.isSuccess ? (sheet?.questionCount ?? 0) : null) : totalFor(source);
  const nothingAvailable = available === 0;
  const shortExam = available !== null && available > 0 && available < EXAM_QUESTION_COUNT;
  const questionCount = available !== null && available > 0 ? Math.min(available, EXAM_QUESTION_COUNT) : EXAM_QUESTION_COUNT;
  const passPoints = shortExam ? passPointsFor(questionCount) : EXAM_PASS_POINTS;

  // Propozycja czasu: minuta na pytanie (przy krótszym egzaminie tyle minut, ile pytań).
  const autoMinutes = Math.min(TIME_LIMITS.max, Math.max(TIME_LIMITS.min, questionCount));
  const timeShown = timeInput ?? String(autoMinutes);
  const minutesNow = unlimited ? null : parseInteger(timeShown);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (starting) return;

    const minutes = unlimited ? null : parseInteger(timeShown);
    if (!unlimited && (minutes === null || minutes < TIME_LIMITS.min || minutes > TIME_LIMITS.max)) {
      setError(`Limit czasu: wpisz liczbę minut od ${TIME_LIMITS.min} do ${TIME_LIMITS.max} albo zaznacz „Bez limitu czasu".`);
      return;
    }
    if (onSheets && !sheet) {
      setError(
        sheetsQuery.isError
          ? "Nie udało się pobrać listy egzaminów MS. Spróbuj ponownie albo wybierz inne źródło."
          : "Nie ma jeszcze egzaminów MS do wyboru. Wybierz inne źródło."
      );
      return;
    }
    if (nothingAvailable) {
      setError(
        source === "ALL"
          ? "Nie ma teraz pytań testowych, z których można ułożyć egzamin."
          : onSheets
            ? "Z tego egzaminu MS nie ma teraz pytań. Wybierz inny egzamin."
            : "Z tego źródła nie ma teraz pytań na egzamin. Wybierz inne źródło."
      );
      return;
    }

    setError(null);
    setStarting(true);
    try {
      // Egzamin MS z wybranego roku to cały arkusz (serwer nie losuje, a źródło pomija); pozostałe wybory losują z źródła.
      const mode: SourceMode = source === "SHEETS" ? "MINISTRY" : source;
      const sheetId = onSheets && sheet ? sheet.id : null;
      const start = sheetId === null ? await startExam(mode) : await startExam(mode, sheetId);
      saveRememberedSettings({ source, sheetTrackId, sheetYear, timeLimitMinutes: minutes, timeCustomised: timeInput !== null });
      onStarted(start, { timeLimitMinutes: minutes, source: mode, sheetId });
    } catch (err) {
      setError(serverMessage(err, "Nie udało się rozpocząć egzaminu. Spróbuj ponownie."));
      setStarting(false);
    }
  }

  let availabilityNote: string;
  if (onSheets) {
    if (sheetsQuery.isError) availabilityNote = "Nie udało się pobrać listy egzaminów MS.";
    else if (available === null) availabilityNote = "Sprawdzam, które egzaminy MS są dostępne…";
    else if (!sheet) availabilityNote = "Nie ma jeszcze egzaminów MS do wyboru.";
    else if (shortExam) {
      availabilityNote = `W tym egzaminie jest ${available} ${questionsWord(available)}, więc będzie krótszy, a próg zaliczenia proporcjonalnie niższy.`;
    } else availabilityNote = `Cały egzamin w oryginalnej kolejności, ${available} ${questionsWord(available)} (bez pytań zawieszonych przez Ciebie w testach).`;
  } else if (availabilityQuery.isError) availabilityNote = "Nie udało się sprawdzić, ile jest dostępnych pytań.";
  else if (available === null) availabilityNote = "Sprawdzam, ile jest dostępnych pytań…";
  else if (nothingAvailable) availabilityNote = source === "ALL" ? "Nie ma teraz pytań testowych." : "Z tego źródła nie ma teraz pytań. Wybierz inne.";
  else if (shortExam) {
    availabilityNote = `Do wylosowania jest tylko ${available} ${questionsWord(available)}, więc egzamin będzie krótszy, a próg zaliczenia proporcjonalnie niższy.`;
  } else availabilityNote = `Do wylosowania: ${available} ${questionsWord(available ?? 0)} (bez pytań zawieszonych przez Ciebie w testach).`;

  return (
    <div className="flex flex-col gap-6">
      {draft && <ResumeCard draft={draft} onResume={onResume} onDiscard={onDiscard} />}

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-describedby={error ? formErrorId : undefined}
        className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:items-start lg:gap-6"
        data-testid="exam-form"
      >
        <div className="flex min-w-0 flex-col gap-5">
          <SectionCard title="Źródło pytań" data-testid="exam-source">
            {/* Cztery karty obok siebie dopiero, gdy jest na nie miejsce (szerokość tej kolumny, nie ekranu). */}
            <div className="@container">
              <div role="radiogroup" aria-label="Źródło pytań egzaminu" className="grid grid-cols-1 gap-3 @md:grid-cols-2 @4xl:grid-cols-4">
                {EXAM_SOURCE_ORDER.map((choice) => {
                  const Icon = SOURCE_ICONS[choice];
                  // Liczba pytań (źródła do losowania) albo liczba egzaminów MS do wyboru.
                  const total = choice === "SHEETS" ? (sheetsQuery.isSuccess ? examCount : null) : totalFor(choice);
                  const countText =
                    total === null
                      ? ""
                      : choice === "SHEETS"
                        ? `${total} ${examsWord(total)}. `
                        : `${total} ${questionsWord(total)}. `;
                  return (
                    <ChoiceCard
                      key={choice}
                      name={`${sourceGroup}-source`}
                      checked={source === choice}
                      onChange={() => {
                        setSource(choice);
                        setError(null);
                      }}
                      disabled={total === 0 && source !== choice}
                      className="@md:items-start"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-3 @md:flex-col @md:items-start @md:gap-2.5">
                        <span
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
                            source === choice ? "bg-accent/15 text-accent-ink" : "bg-surface-2 text-fg-muted"
                          )}
                        >
                          <Icon size={18} aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold">{EXAM_SOURCE_LABELS[choice]}</span>
                          <span className="block text-xs text-fg-muted">
                            {total === 0 ? (choice === "SHEETS" ? "Brak egzaminów." : "Brak pytań.") : `${countText}${EXAM_SOURCE_HINTS[choice]}`}
                          </span>
                        </span>
                      </span>
                    </ChoiceCard>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-fg-muted" data-testid="exam-availability">
              {narrowed && !onSheets && !availabilityQuery.isError
                ? "Egzamin losuje ze wszystkich aktów Twojej ścieżki, także tych, które masz wyłączone w zakresie nauki (Konto). "
                : ""}
              {availabilityNote}
            </p>
          </SectionCard>

          {onSheets && (
            <SectionCard title="Wybierz egzamin MS" data-testid="exam-sheets">
              {sheetsQuery.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : sheetsQuery.isError ? (
                <div className="flex flex-col items-start gap-3 text-sm" role="alert">
                  <p className="text-danger">Nie udało się pobrać listy egzaminów MS.</p>
                  <Button type="button" variant="ghost" onClick={() => void sheetsQuery.refetch()}>
                    Spróbuj ponownie
                  </Button>
                </div>
              ) : sheetApp === null ? (
                <p className="text-sm text-fg-muted" data-testid="exam-sheets-empty">
                  Nie ma jeszcze egzaminów MS do wyboru. Wybierz inne źródło pytań.
                </p>
              ) : (
                <>
                  <p className="max-w-3xl text-sm text-fg-muted">
                    Wybierz aplikację i rok, a dostaniesz cały egzamin z tamtego roku, w kolejności z arkusza. Możesz wybrać egzamin
                    dowolnej aplikacji, nie tylko swojej.
                  </p>
                  <ExamSheetPicker
                    applications={applications}
                    trackId={sheetApp.trackId}
                    year={sheet?.year ?? null}
                    onPick={(trackId, year) => {
                      setSheetTrackId(trackId);
                      setSheetYear(year);
                      setError(null);
                    }}
                  />
                </>
              )}
            </SectionCard>
          )}

          <SectionCard title="Czas" data-testid="exam-time">
            <div className="flex flex-wrap items-start gap-x-8 gap-y-1">
              <div className="w-full max-w-xs">
                <Field
                  label="Limit czasu (minuty)"
                  type="number"
                  inputMode="numeric"
                  min={TIME_LIMITS.min}
                  max={TIME_LIMITS.max}
                  value={unlimited ? "" : timeShown}
                  disabled={unlimited}
                  onChange={(e) => {
                    setTimeInput(e.target.value);
                    setError(null);
                  }}
                  hint={timeInput === null && !unlimited ? "Minuta na pytanie, możesz zmienić." : undefined}
                />
              </div>
              <div className="flex min-h-11 items-center gap-2 sm:mt-6">
                <input
                  id={unlimitedId}
                  type="checkbox"
                  checked={unlimited}
                  onChange={(e) => {
                    setUnlimited(e.target.checked);
                    setError(null);
                  }}
                  className="size-5 accent-accent-ink"
                />
                <label htmlFor={unlimitedId} className="text-sm text-fg-muted">
                  Bez limitu czasu
                </label>
              </div>
            </div>
            <p className="max-w-2xl rounded-xl border border-line bg-surface-2 p-3 text-xs text-fg-muted">
              Odpowiedzi możesz zmieniać do końca, a pytania bez odpowiedzi liczą się jako błędne (bez punktów ujemnych). Liczbę
              pytań i próg zaliczenia ustala aplikacja, więc nie da się ich zmienić. Egzamin nie zmienia terminów Twoich powtórek
              ani statystyk nauki.
            </p>
          </SectionCard>
        </div>

        <aside aria-labelledby={`${sourceGroup}-summary`} className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6" data-testid="exam-summary">
          <Card className="flex flex-col gap-4 p-5">
            <h2 id={`${sourceGroup}-summary`} className="text-base font-semibold">
              Twój egzamin
            </h2>
            <ul className="grid grid-cols-2 gap-3">
              <li className="rounded-xl border border-line bg-surface-2 px-4 py-3">
                <span className="block text-2xl font-bold tabular-nums">{questionCount}</span>
                <span className="text-sm text-fg-muted">{questionsWord(questionCount)}</span>
              </li>
              <li className="rounded-xl border border-line bg-surface-2 px-4 py-3">
                <span className="block text-2xl font-bold tabular-nums">{passPoints}</span>
                <span className="text-sm text-fg-muted">pkt do zaliczenia</span>
              </li>
            </ul>
            <dl className="flex flex-col gap-3.5 text-sm">
              <SummaryRow label="Źródło">{EXAM_SOURCE_LABELS[source]}</SummaryRow>
              {onSheets && <SummaryRow label="Egzamin">{sheetName ?? "Wybierz aplikację i rok"}</SummaryRow>}
              <SummaryRow label="Czas">
                {unlimited ? "Bez limitu" : minutesNow !== null && minutesNow >= TIME_LIMITS.min && minutesNow <= TIME_LIMITS.max ? `${minutesNow} min` : "Wpisz liczbę minut"}
              </SummaryRow>
            </dl>

            {error && (
              <p id={formErrorId} role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={starting || nothingAvailable || (onSheets && !sheet)}
                data-testid="exam-start"
                className={cn(START_BUTTON, "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50")}
              >
                <Play size={16} aria-hidden="true" />
                {starting ? "Losuję pytania…" : "Rozpocznij egzamin"}
              </button>
            </div>
          </Card>
        </aside>
      </form>
    </div>
  );
}

function ResumeCard({ draft, onResume, onDiscard }: { draft: ExamDraft; onResume: () => void; onDiscard: () => void }) {
  // Chwila wejścia na ekran; potrzebna tylko do pokazania, ile czasu zostało.
  const [openedAtMs] = useState(() => Date.now());
  const answered = Object.keys(draft.answers).length;
  const remainingSeconds = draft.deadlineMs === null ? null : Math.max(0, (draft.deadlineMs - openedAtMs) / 1000);
  const timeUp = remainingSeconds !== null && remainingSeconds <= 0;

  return (
    <Card className="flex flex-col gap-4 border-accent-ink/40 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-semibold">Masz niedokończony egzamin</h2>
        <p className="text-sm text-fg-muted">
          {draft.scopeLabel}: odpowiedziano na {answered} z {draft.questions.length} pytań.{" "}
          {remainingSeconds === null
            ? "Egzamin jest bez limitu czasu."
            : timeUp
              ? "Czas już minął: egzamin zostanie od razu zakończony i oceniony."
              : `Zostało ${formatClock(remainingSeconds)}. Czas płynie także wtedy, gdy nie ma Cię na tej stronie.`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={onResume}>
          <RotateCcw size={16} aria-hidden="true" />
          {timeUp ? "Zakończ i sprawdź" : "Wznów egzamin"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDiscard}>
          <Trash2 size={16} aria-hidden="true" />
          Porzuć
        </Button>
      </div>
    </Card>
  );
}
