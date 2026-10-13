import { useId, useMemo, useState, type FormEvent } from "react";
import { Play, RotateCcw, Trash2 } from "lucide-react";
import { startExam, type ExamScope, type ExamStart } from "../../api/exam";
import type { TestCatalog } from "../../api/tests";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { serverMessage } from "../../lib/errors";
import { pluralizePl } from "../../lib/plural";
import { useTestCatalog } from "../tests/hooks";
import { OriginFilterBar } from "../tests/OriginFilterBar";
import { isFilterActive, useOriginFilter } from "../tests/originFilter";
import { formatClock } from "./format";
import { loadRememberedSettings, saveRememberedSettings, type ExamDraft } from "./examStorage";
import { ExamHistory } from "./ExamHistory";

export interface ExamConfig {
  scope: ExamScope;
  timeLimitMinutes: number | null;
  passThresholdPercent: number;
}

const DEFAULT_QUESTION_COUNT = 150;
const DEFAULT_THRESHOLD = 75;
const QUESTION_LIMITS = { min: 5, max: 200 };
const TIME_LIMITS = { min: 1, max: 600 };
const THRESHOLD_LIMITS = { min: 1, max: 100 };

interface ScopeOption {
  value: string;
  label: string;
  /** Ile pytań testowych użytkownik może tu rozwiązać (według katalogu Testów). */
  available: number;
  scope: ExamScope;
  group: string | null;
}

const questionsWord = (n: number) => pluralizePl(n, { one: "pytanie", few: "pytania", many: "pytań" });

/** Opcje zakresu: cały materiał, potem rodzaje z przedmiotami i (gdy jest ich kilka) źródłami. */
function buildScopeOptions(catalog: TestCatalog | undefined): ScopeOption[] {
  const categories = catalog?.categories ?? [];
  const total = categories.reduce((sum, c) => sum + c.questionCount, 0);
  const options: ScopeOption[] = [
    { value: "all", label: "Cały materiał", available: total, scope: {}, group: null },
  ];
  for (const category of categories) {
    options.push({
      value: `c:${category.id}`,
      label: `Cały rodzaj: ${category.name}`,
      available: category.questionCount,
      scope: { categoryId: category.id },
      group: category.name,
    });
    for (const subject of category.subjects) {
      options.push({
        value: `s:${subject.id}`,
        label: subject.name,
        available: subject.questionCount,
        scope: { subjectId: subject.id },
        group: category.name,
      });
      if (subject.sources.length > 1) {
        for (const source of subject.sources) {
          options.push({
            value: `r:${source.id}`,
            label: `${subject.name} → ${source.name}`,
            available: source.questionCount,
            scope: { sourceId: source.id },
            group: category.name,
          });
        }
      }
    }
  }
  return options;
}

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

/** Ekran przed egzaminem: ustawienia (zakres, liczba pytań, czas, próg), wznowienie niedokończonego i historia. */
export function ExamSetup({ draft, onResume, onDiscard, onStarted }: ExamSetupProps) {
  const catalogQuery = useTestCatalog();
  const filterActive = isFilterActive(useOriginFilter().data);
  const options = useMemo(() => buildScopeOptions(catalogQuery.data), [catalogQuery.data]);
  const remembered = useMemo(() => loadRememberedSettings(), []);

  const [scopeValue, setScopeValue] = useState(remembered?.scope ?? "all");
  const [countInput, setCountInput] = useState(String(remembered?.questionCount ?? DEFAULT_QUESTION_COUNT));
  const [unlimited, setUnlimited] = useState(remembered !== null && remembered.timeLimitMinutes === null);
  // null = czas liczony automatycznie (minuta na pytanie), dopóki użytkownik sam go nie zmieni.
  const [timeInput, setTimeInput] = useState<string | null>(
    remembered?.timeCustomised && remembered.timeLimitMinutes !== null ? String(remembered.timeLimitMinutes) : null
  );
  const [thresholdInput, setThresholdInput] = useState(String(remembered?.passThresholdPercent ?? DEFAULT_THRESHOLD));
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const scopeId = useId();
  const unlimitedId = useId();
  const formErrorId = useId();

  // Zapamiętany zakres, którego już nie ma w katalogu (np. źródło usunięto), wraca do całego materiału.
  const selected = options.find((o) => o.value === scopeValue) ?? options[0];
  const asked = parseInteger(countInput);
  const autoMinutes = Math.min(TIME_LIMITS.max, Math.max(TIME_LIMITS.min, asked ?? DEFAULT_QUESTION_COUNT));
  const timeShown = timeInput ?? String(autoMinutes);
  const catalogKnown = catalogQuery.data !== undefined;
  const nothingAvailable = catalogKnown && selected.available === 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (starting) return;

    const count = parseInteger(countInput);
    if (count === null || count < QUESTION_LIMITS.min || count > QUESTION_LIMITS.max) {
      setError(`Liczba pytań: wpisz liczbę całkowitą od ${QUESTION_LIMITS.min} do ${QUESTION_LIMITS.max}.`);
      return;
    }
    const minutes = unlimited ? null : parseInteger(timeShown);
    if (!unlimited && (minutes === null || minutes < TIME_LIMITS.min || minutes > TIME_LIMITS.max)) {
      setError(`Limit czasu: wpisz liczbę minut od ${TIME_LIMITS.min} do ${TIME_LIMITS.max} albo zaznacz „Bez limitu czasu".`);
      return;
    }
    const threshold = parseInteger(thresholdInput);
    if (threshold === null || threshold < THRESHOLD_LIMITS.min || threshold > THRESHOLD_LIMITS.max) {
      setError(`Próg zaliczenia: wpisz liczbę całkowitą od ${THRESHOLD_LIMITS.min} do ${THRESHOLD_LIMITS.max} procent.`);
      return;
    }
    if (nothingAvailable) {
      setError("W wybranym zakresie nie ma teraz pytań testowych. Wybierz inny zakres.");
      return;
    }

    setError(null);
    setStarting(true);
    try {
      const start = await startExam(selected.scope, count);
      saveRememberedSettings({
        scope: selected.value,
        questionCount: count,
        timeLimitMinutes: minutes,
        timeCustomised: timeInput !== null,
        passThresholdPercent: threshold,
      });
      onStarted(start, { scope: selected.scope, timeLimitMinutes: minutes, passThresholdPercent: threshold });
    } catch (err) {
      setError(serverMessage(err, "Nie udało się rozpocząć egzaminu. Spróbuj ponownie."));
      setStarting(false);
    }
  }

  const groups = Array.from(new Set(options.map((o) => o.group).filter((g): g is string => g !== null)));

  return (
    <div className="flex flex-col gap-6">
      {draft && <ResumeCard draft={draft} onResume={onResume} onDiscard={onDiscard} />}

      <Card className="p-5 sm:p-6">
        <h2 className="mb-1 text-base font-semibold">Nowy egzamin</h2>
        <p className="mb-4 text-sm text-fg-muted">
          Losowy zestaw pytań z wybranego zakresu, jak na prawdziwym egzaminie: odpowiedzi poznasz dopiero na końcu.
          Egzamin nie zmienia terminów Twoich powtórek ani statystyk nauki.
        </p>

        <OriginFilterBar className="mb-5 max-w-xl" />

        <form onSubmit={handleSubmit} noValidate className="flex max-w-xl flex-col gap-5" aria-describedby={error ? formErrorId : undefined}>
          <div className="flex flex-col gap-1">
            <label htmlFor={scopeId} className="text-sm text-fg-muted">
              Zakres pytań
            </label>
            <select
              id={scopeId}
              value={selected.value}
              onChange={(e) => {
                setScopeValue(e.target.value);
                setError(null);
              }}
              className="min-h-11 rounded-xl border border-field bg-surface-2 px-3"
            >
              <option value="all">
                {catalogKnown ? `Cały materiał (${options[0].available})` : "Cały materiał"}
              </option>
              {groups.map((group) => (
                <optgroup key={group} label={group}>
                  {options
                    .filter((o) => o.group === group)
                    .map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label} ({o.available})
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <p className="text-xs text-fg-muted">
              {catalogQuery.isError
                ? "Nie udało się pobrać listy zakresów, więc dostępny jest tylko cały materiał."
                : catalogKnown
                  ? nothingAvailable
                    ? filterActive
                      ? "W tym zakresie nie ma pytań z wybranych pochodzeń. Zmień filtr powyżej."
                      : "W tym zakresie nie ma teraz pytań testowych."
                    : `Do wylosowania: ${selected.available} ${questionsWord(selected.available)} (${
                        filterActive ? "z wybranych pochodzeń, " : ""
                      }bez zawieszonych i z nieodblokowanych rozdziałów).`
                  : "Pobieram listę zakresów…"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Liczba pytań"
              type="number"
              inputMode="numeric"
              min={QUESTION_LIMITS.min}
              max={QUESTION_LIMITS.max}
              value={countInput}
              onChange={(e) => {
                setCountInput(e.target.value);
                setError(null);
              }}
              hint={
                catalogKnown && asked !== null && asked > selected.available && selected.available > 0
                  ? `Dostępnych jest ${selected.available}, tyle będzie w egzaminie.`
                  : `Od ${QUESTION_LIMITS.min} do ${QUESTION_LIMITS.max}.`
              }
            />
            <div className="flex flex-col gap-1">
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
              <div className="flex min-h-11 items-center gap-2">
                <input
                  id={unlimitedId}
                  type="checkbox"
                  checked={unlimited}
                  onChange={(e) => {
                    setUnlimited(e.target.checked);
                    setError(null);
                  }}
                  className="size-5 accent-accent"
                />
                <label htmlFor={unlimitedId} className="text-sm text-fg-muted">
                  Bez limitu czasu
                </label>
              </div>
            </div>
            <Field
              label="Próg zaliczenia (%)"
              type="number"
              inputMode="numeric"
              min={THRESHOLD_LIMITS.min}
              max={THRESHOLD_LIMITS.max}
              value={thresholdInput}
              onChange={(e) => {
                setThresholdInput(e.target.value);
                setError(null);
              }}
              hint="Ile procent poprawnych odpowiedzi daje zaliczenie."
            />
          </div>

          <p className="rounded-xl border border-line bg-surface-2 p-3 text-xs text-fg-muted">
            Podane wartości ({DEFAULT_QUESTION_COUNT} pytań, czas 1 minuta na pytanie, próg {DEFAULT_THRESHOLD}%) to
            tylko propozycja, a nie oficjalne zasady egzaminu. Ustaw je według regulaminu swojego egzaminu. Odpowiedzi
            możesz zmieniać do końca, a pytania bez odpowiedzi liczą się jako błędne (bez punktów ujemnych).
          </p>

          {error && (
            <p id={formErrorId} role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <div>
            <Button type="submit" disabled={starting || nothingAvailable}>
              <Play size={16} aria-hidden="true" />
              {starting ? "Losuję pytania…" : "Rozpocznij egzamin"}
            </Button>
          </div>
        </form>
      </Card>

      <ExamHistory />
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
    <Card className="flex flex-col gap-4 border-accent/40 p-5 sm:flex-row sm:items-center sm:justify-between">
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
