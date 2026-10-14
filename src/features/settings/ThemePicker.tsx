import { Check } from "lucide-react";
import { cn } from "../../lib/cn";
import { THEME_LABELS, THEMES, type Theme } from "../../lib/theme";

interface ThemePickerProps {
  value: Theme;
  onChange: (theme: Theme) => void;
  /** Nazwa grupy pól opcji (unikalna na stronie). */
  name: string;
  legend?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Próbki kolorów obu wyglądów. Mają stałe kolory (nie tokeny), bo każda próbka pokazuje swój wygląd niezależnie od tego,
 * który jest teraz włączony.
 */
const SWATCH: Record<Theme, { background: string; line: string; dot: string }> = {
  DARK: { background: "#121214", line: "#f2efe9", dot: "#d8b13a" },
  LIGHT: { background: "#fbfaf6", line: "#1b1a17", dot: "#d8b13a" },
};

const HINTS: Record<Theme, string> = {
  DARK: "Domyślny, łagodniejszy wieczorem",
  LIGHT: "Kolory papieru, jak w dokumentacji",
};

/** Wybór wyglądu: dwie duże opcje (Ciemny, Jasny) z próbką koloru. Zmiana działa od razu; zapis robi rodzic. */
export function ThemePicker({ value, onChange, name, legend = "Wygląd strony", disabled = false, className }: ThemePickerProps) {
  return (
    <fieldset className={cn("min-w-0", className)} disabled={disabled}>
      <legend className="mb-2 text-sm font-semibold text-fg">{legend}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {THEMES.map((theme) => {
          const swatch = SWATCH[theme];
          const selected = value === theme;
          return (
            <label key={theme} className="relative block cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
              <input
                type="radio"
                name={name}
                value={theme}
                checked={selected}
                onChange={() => onChange(theme)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl border bg-surface-2 px-3 py-2 transition-colors hover:bg-line",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-ink",
                  selected ? "border-accent-ink bg-accent/10" : "border-field"
                )}
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-11 shrink-0 flex-col justify-center gap-1 rounded-md border border-line px-1.5"
                  style={{ backgroundColor: swatch.background }}
                >
                  <span className="h-1 w-full rounded-full" style={{ backgroundColor: swatch.line }} />
                  <span className="h-1 w-1/2 rounded-full" style={{ backgroundColor: swatch.dot }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-fg">{THEME_LABELS[theme]}</span>
                  <span className="block text-xs text-fg-muted">{HINTS[theme]}</span>
                </span>
                {selected && <Check size={16} aria-hidden="true" className="shrink-0 text-accent-ink" />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
