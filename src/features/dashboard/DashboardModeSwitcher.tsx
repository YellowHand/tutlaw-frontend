import { cn } from "../../lib/cn";

export type DashboardMode = "flashcards" | "tests";

interface DashboardModeSwitcherProps {
  value: DashboardMode;
  onChange: (mode: DashboardMode) => void;
}

export function DashboardModeSwitcher({ value, onChange }: DashboardModeSwitcherProps) {
  return (
    <div role="tablist" aria-label="Wybór widoku pulpitu" className="flex rounded-full border border-line bg-surface-2 p-1">
      <button
        type="button"
        role="tab"
        aria-selected={value === "flashcards"}
        onClick={() => onChange("flashcards")}
        className={cn(
          "flex-1 rounded-full px-4 min-h-11 text-sm font-medium transition-colors",
          value === "flashcards" ? "bg-accent text-accent-fg" : "text-fg-muted hover:text-fg"
        )}
      >
        Fiszki
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "tests"}
        onClick={() => onChange("tests")}
        className={cn(
          "flex-1 rounded-full px-4 min-h-11 text-sm font-medium transition-colors",
          value === "tests" ? "bg-accent text-accent-fg" : "text-fg-muted hover:text-fg"
        )}
      >
        Testy
      </button>
    </div>
  );
}