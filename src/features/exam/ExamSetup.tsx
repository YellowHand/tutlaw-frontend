import { useId, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Play, RotateCcw, Trash2 } from "lucide-react";
import { startExam, type ExamStart } from "../../api/exam";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { ROUTES } from "../../config/routes";
import { serverMessage } from "../../lib/errors";
import { pluralizePl } from "../../lib/plural";
import { PoolChip } from "../pool/PoolChip";
import { usePool } from "../pool/hooks";
import { hiddenGroups } from "../pool/summary";
import { EXAM_PASS_POINTS, EXAM_QUESTION_COUNT, formatClock } from "./format";
import { loadRememberedSettings, saveRememberedSettings, type ExamDraft } from "./examStorage";
import { ExamHistory } from "./ExamHistory";

/** Jedyne, co użytkownik ustawia przed egzaminem. Zakres, liczbę pytań i próg zaliczenia ustala format egzaminu. */
export interface ExamConfig {
  timeLimitMinutes: number | null;
}

const TIME_LIMITS = { min: 1, max: 600 };

const questionsWord = (n: number) => pluralizePl(n, { one: "pytanie", few: "pytania", many: "pytań" });

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
 * Ekran przed egzaminem. Format jest stały: 150 pytań z całej puli ścieżki, zaliczenie od 100 punktów (losuje i liczy
 * serwer), więc do ustawienia zostaje tylko limit czasu. Egzamin ignoruje zawężenie puli do wybranych aktów (losuje
 * z wszystkich aktów ścieżki), ale respektuje filtr źródeł. Ćwiczenie z wybranego działu to osobny „Własny test",
 * który niczego nie zalicza.
 */
export function ExamSetup({ draft, onResume, onDiscard, onStarted }: ExamSetupProps) {
  const poolQuery = usePool();
  const remembered = useMemo(() => loadRememberedSettings(), []);

  const [unlimited, setUnlimited] = useState(remembered !== null && remembered.timeLimitMinutes === null);
  // null = czas liczony automatycznie (minuta na pytanie), dopóki użytkownik sam go nie zmieni.
  const [timeInput, setTimeInput] = useState<string | null>(
    remembered?.timeCustomised && remembered.timeLimitMinutes !== null ? String(remembered.timeLimitMinutes) : null
  );
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const unlimitedId = useId();
  const formErrorId = useId();

  // Ile pytań jest do wylosowania. Znamy to dokładnie tylko bez zawężenia puli do aktów: z zawężeniem egzamin losuje
  // z większej puli, a serwer nie podaje jej liczby. Wtedy nie zgadujemy i niczego nie blokujemy.
  const pool = poolQuery.data;
  const narrowed = pool?.narrowed ?? false;
  const filterActive = pool !== undefined && hiddenGroups(pool).length > 0;
  const catalogKnown = pool !== undefined && !narrowed;
  const available = catalogKnown ? pool.questionCount : 0;
  const nothingAvailable = catalogKnown && available === 0;
  const shortExam = catalogKnown && available > 0 && available < EXAM_QUESTION_COUNT;

  // Propozycja czasu: minuta na pytanie (przy krótszym egzaminie tyle minut, ile pytań).
  const autoMinutes = Math.min(
    TIME_LIMITS.max,
    Math.max(TIME_LIMITS.min, catalogKnown && available > 0 ? Math.min(available, EXAM_QUESTION_COUNT) : EXAM_QUESTION_COUNT)
  );
  const timeShown = timeInput ?? String(autoMinutes);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (starting) return;

    const minutes = unlimited ? null : parseInteger(timeShown);
    if (!unlimited && (minutes === null || minutes < TIME_LIMITS.min || minutes > TIME_LIMITS.max)) {
      setError(`Limit czasu: wpisz liczbę minut od ${TIME_LIMITS.min} do ${TIME_LIMITS.max} albo zaznacz „Bez limitu czasu".`);
      return;
    }
    if (nothingAvailable) {
      setError("Nie ma teraz pytań testowych, z których można ułożyć egzamin.");
      return;
    }

    setError(null);
    setStarting(true);
    try {
      const start = await startExam();
      saveRememberedSettings({ timeLimitMinutes: minutes, timeCustomised: timeInput !== null });
      onStarted(start, { timeLimitMinutes: minutes });
    } catch (err) {
      setError(serverMessage(err, "Nie udało się rozpocząć egzaminu. Spróbuj ponownie."));
      setStarting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {draft && <ResumeCard draft={draft} onResume={onResume} onDiscard={onDiscard} />}

      <Card className="p-5 sm:p-6">
        <h2 className="mb-1 text-base font-semibold">Nowy egzamin</h2>
        <p className="mb-4 text-sm text-fg-muted">
          Stały format, jak na prawdziwym egzaminie: pytania z całej puli Twojej ścieżki, a odpowiedzi poznasz dopiero na końcu.
          Egzamin nie zmienia terminów Twoich powtórek ani statystyk nauki.
        </p>

        <ul className="mb-5 grid max-w-xl grid-cols-2 gap-3">
          <li className="rounded-xl border border-line bg-surface-2 px-4 py-3">
            <span className="block text-2xl font-bold tabular-nums">{EXAM_QUESTION_COUNT}</span>
            <span className="text-sm text-fg-muted">pytań z całej puli ścieżki</span>
          </li>
          <li className="rounded-xl border border-line bg-surface-2 px-4 py-3">
            <span className="block text-2xl font-bold tabular-nums">{EXAM_PASS_POINTS}</span>
            <span className="text-sm text-fg-muted">punktów do zaliczenia</span>
          </li>
        </ul>

        <PoolChip className="mb-2" />
        <p className="mb-5 max-w-xl text-xs text-fg-muted">
          {poolQuery.isError
            ? "Nie udało się sprawdzić, ile jest dostępnych pytań."
            : pool === undefined
              ? "Sprawdzam, ile jest dostępnych pytań…"
              : narrowed
                ? "Egzamin losuje z wszystkich aktów Twojej ścieżki, także tych, których nie masz zaznaczonych w puli. Źródła pytań zależą od filtra w oknie „Pula pytań”."
                : nothingAvailable
                  ? filterActive
                    ? "Nie ma pytań z wybranych źródeł. Zmień filtr w oknie „Pula pytań”."
                    : "Nie ma teraz pytań testowych."
                  : shortExam
                    ? `Do wylosowania jest tylko ${available} ${questionsWord(available)}${
                        filterActive ? " z wybranych źródeł" : ""
                      }, więc egzamin będzie krótszy, a próg zaliczenia proporcjonalnie niższy.`
                    : `Do wylosowania: ${available} ${questionsWord(available)}${
                        filterActive ? " z wybranych źródeł" : ""
                      } (bez pytań zawieszonych przez Ciebie w testach).`}
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex max-w-xl flex-col gap-5" aria-describedby={error ? formErrorId : undefined}>
          <div className="flex max-w-xs flex-col gap-1">
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
                className="size-5 accent-accent-ink"
              />
              <label htmlFor={unlimitedId} className="text-sm text-fg-muted">
                Bez limitu czasu
              </label>
            </div>
          </div>

          <p className="rounded-xl border border-line bg-surface-2 p-3 text-xs text-fg-muted">
            Odpowiedzi możesz zmieniać do końca, a pytania bez odpowiedzi liczą się jako błędne (bez punktów ujemnych).
            Liczbę pytań i próg zaliczenia ustala aplikacja, więc nie da się ich zmienić.
          </p>

          {error && (
            <p id={formErrorId} role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Button type="submit" disabled={starting || nothingAvailable}>
              <Play size={16} aria-hidden="true" />
              {starting ? "Losuję pytania…" : "Rozpocznij egzamin"}
            </Button>
            <Link
              to={ROUTES.customTest}
              className="inline-flex min-h-11 items-center rounded-lg px-1 text-sm text-fg-muted underline hover:text-fg"
            >
              Chcesz poćwiczyć jeden dział? Ułóż własny test
            </Link>
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
