import { useId } from "react";
import { RESET_CONFIRMATION_WORD, isResetConfirmed, type StudyProgress } from "../../api/studyProgress";
import { progressLines } from "./lines";

/** Lista tego, co zniknie po wyzerowaniu (z liczbami). Przy braku postępów mówi, że nie ma czego zerować. */
export function ProgressLossList({ progress }: { progress: StudyProgress }) {
  const lines = progressLines(progress);
  if (lines.length === 0) {
    return (
      <p data-testid="progress-empty" className="text-sm text-fg-muted">
        Nie masz jeszcze żadnych postępów, więc nie ma czego zerować.
      </p>
    );
  }
  return (
    <dl data-testid="progress-loss" className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-xl border border-line bg-surface-2 p-3 text-sm">
      {lines.map((line) => (
        <div key={line.key} className="col-span-2 grid grid-cols-subgrid">
          <dt className="text-fg-muted">{line.label}</dt>
          <dd className="text-right font-medium tabular-nums text-fg">{line.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface ConfirmWordFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** Pole, w którym trzeba wpisać WYZERUJ. Zgodność sprawdza `isResetConfirmed` (bez spacji wokół i bez względu na wielkość liter). */
export function ConfirmWordField({ value, onChange, disabled }: ConfirmWordFieldProps) {
  const id = useId();
  return (
    <div className="flex max-w-xs flex-col gap-1">
      <label htmlFor={id} className="text-sm text-fg-muted">
        Wpisz <span className="font-semibold text-fg">{RESET_CONFIRMATION_WORD}</span>, żeby potwierdzić
      </label>
      <input
        id={id}
        type="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={32}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 rounded-xl border border-field bg-surface-2 px-3"
        aria-invalid={value.length > 0 && !isResetConfirmed(value)}
      />
    </div>
  );
}

/** Co zostaje po wyzerowaniu: jedno zdanie, wspólne dla okna zerowania i okna zmiany ścieżki. */
export const WHAT_STAYS =
  "Zostają: konto, ścieżka, wybrane przedmioty i akty, ustawienia nauki, Twoje zgłoszenia błędów i same pytania.";
