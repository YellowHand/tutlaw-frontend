export interface ShortcutHint {
  keys: string[];
  label: string;
}

/** Podpowiedź skrótów klawiszowych sesji. Tylko na szerokich ekranach (na telefonie klawiatury nie ma). */
export function KeyboardHint({ hints }: { hints: ShortcutHint[] }) {
  return (
    <p
      data-testid="keyboard-hint"
      aria-hidden="true"
      className="hidden flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-fg-muted md:flex"
    >
      {hints.map((hint) => (
        <span key={hint.label} className="inline-flex items-center gap-1.5">
          {hint.keys.map((key) => (
            <kbd
              key={key}
              className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-sans text-[11px] font-medium text-fg"
            >
              {key}
            </kbd>
          ))}
          {hint.label}
        </span>
      ))}
    </p>
  );
}
