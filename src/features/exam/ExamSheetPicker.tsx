import { useId, useMemo } from "react";
import type { ExamSheetApplication } from "../../api/exam";
import { cn } from "../../lib/cn";
import { pluralizePl } from "../../lib/plural";
import { sheetYears } from "./sheetYears";

const questionsWord = (n: number) => pluralizePl(n, { one: "pytanie", few: "pytania", many: "pytań" });
const examsWord = (n: number) => pluralizePl(n, { one: "egzamin", few: "egzaminy", many: "egzaminów" });

// `relative`: ukryte pole opcji (sr-only) jest położone względem etykiety. Bez tego fokus na nim przewijałby całą stronę,
// a nie tylko kontener z treścią, i po kliknięciu roku ekran „uciekałby" w górę.
const OPTION =
  "relative cursor-pointer rounded-2xl border-2 border-line transition-colors hover:bg-surface-2 " +
  "has-checked:border-accent has-checked:bg-accent/10 " +
  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-ink " +
  "has-disabled:cursor-not-allowed has-disabled:opacity-45 has-disabled:hover:bg-transparent";

interface ExamSheetPickerProps {
  applications: readonly ExamSheetApplication[];
  /** Wybrana aplikacja. */
  trackId: number;
  /** Wybrany rok (null: żaden arkusz nie jest wybrany). */
  year: number | null;
  /** Wybór aplikacji albo roku; zawsze podaje obie wartości (przy zmianie aplikacji rok zostaje, jeśli ma tam arkusz). */
  onPick: (trackId: number, year: number | null) => void;
}

/**
 * Wybór egzaminu MS z poprzednich lat: najpierw aplikacja (przyciski, aplikacja użytkownika pierwsza i oznaczona), potem
 * rok (kafelki od najnowszego, z liczbą pytań). Obie części to grupy przycisków opcji, więc strzałki, Tab i czytnik
 * ekranu działają jak zwykle, a rok bez arkusza w wybranej aplikacji jest wyłączony.
 */
export function ExamSheetPicker({ applications, trackId, year, onPick }: ExamSheetPickerProps) {
  const appGroup = useId();
  const yearGroup = useId();
  const years = useMemo(() => sheetYears(applications), [applications]);
  const app = applications.find((a) => a.trackId === trackId) ?? applications[0];
  if (!app) return null;

  return (
    <div className="flex flex-col gap-5" data-testid="exam-sheet-picker">
      <fieldset className="flex min-w-0 flex-col gap-2.5">
        <legend className="mb-2.5 text-sm font-semibold">Aplikacja</legend>
        <div role="radiogroup" aria-label="Aplikacja egzaminu MS" className="flex flex-wrap gap-2.5">
          {applications.map((item) => (
            <label
              key={item.trackId}
              data-testid={`sheet-app-${item.slug}`}
              className={cn(OPTION, "inline-flex min-h-12 items-center gap-2.5 px-4 py-2 text-sm font-semibold")}
            >
              <input
                type="radio"
                name={`${appGroup}-app`}
                checked={item.trackId === app.trackId}
                onChange={() => onPick(item.trackId, item.sheets.some((s) => s.year === year) ? year : null)}
                className="sr-only"
              />
              <span>{item.shortName}</span>
              {item.own && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-ink">Twoja</span>}
              <span className="text-xs font-normal tabular-nums text-fg-muted">
                {item.sheets.length} {examsWord(item.sheets.length)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-2.5">
        <legend className="mb-2.5 text-sm font-semibold">Rok egzaminu</legend>
        <div
          role="radiogroup"
          aria-label={`Rok egzaminu MS: ${app.shortName}`}
          className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2.5"
        >
          {years.map((y) => {
            const sheet = app.sheets.find((s) => s.year === y);
            return (
              <label
                key={y}
                data-testid={`sheet-year-${y}`}
                className={cn(OPTION, "flex min-h-[4.75rem] flex-col items-center justify-center gap-0.5 px-2 py-2.5 text-center")}
              >
                <input
                  type="radio"
                  name={`${yearGroup}-year`}
                  checked={sheet !== undefined && sheet.year === year}
                  disabled={sheet === undefined}
                  onChange={() => onPick(app.trackId, y)}
                  className="sr-only"
                />
                <span className="text-xl font-bold tabular-nums">{y}</span>
                <span className="text-xs text-fg-muted">{sheet ? `${sheet.questionCount} ${questionsWord(sheet.questionCount)}` : "brak"}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
