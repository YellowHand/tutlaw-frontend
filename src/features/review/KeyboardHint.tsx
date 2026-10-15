import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { isHintRetired, useInterfaceSettings, useUpdateInterfaceSettings, type StudyKind } from "../interface/hooks";
import { isTyping } from "./keyboard";

export interface ShortcutHint {
  keys: string[];
  label: string;
}

interface KeyboardHintProps {
  /** Podpowiedź ukrywa się osobno w testach i w fiszkach (po 10 odpowiedziach albo „×"). */
  kind: StudyKind;
  hints: ShortcutHint[];
}

const SMALL_BUTTON =
  "-my-3 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink";

/**
 * Podpowiedź skrótów klawiszowych sesji. Tylko na szerokich ekranach (na telefonie klawiatury nie ma).
 *
 * Znika sama po 10 odpowiedziach (osobno w testach i w fiszkach, liczone na koncie), a przycisk „×" ukrywa ją na stałe
 * w danym trybie. Klawisz „?" (albo mały przycisk „?") pokazuje ją z powrotem na chwilę. Same skróty działają zawsze.
 */
export function KeyboardHint({ kind, hints }: KeyboardHintProps) {
  const settings = useInterfaceSettings();
  const update = useUpdateInterfaceSettings();
  // „×" w tej wizycie na ekranie: ukrywa od razu, nawet gdyby zapis na koncie się nie udał.
  const [dismissed, setDismissed] = useState(false);
  // Chwilowy powrót podpowiedzi po „?".
  const [peek, setPeek] = useState(false);

  const retired = dismissed || isHintRetired(settings.data, kind);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "?" || e.metaKey || e.ctrlKey || e.altKey || e.repeat || isTyping(e.target)) return;
      e.preventDefault();
      setPeek((value) => !value);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Dopóki nie wiemy, czy podpowiedź jest ukryta, nie pokazujemy jej, żeby nie mignęła osobom, które już ją zamknęły.
  if (settings.isPending) return null;

  const visible = !retired || peek;

  function hideForGood() {
    setDismissed(true);
    setPeek(false);
    update.mutate(kind === "test" ? { testHintHidden: true } : { flashcardHintHidden: true });
  }

  if (!visible) {
    return (
      <div className="hidden justify-center md:flex">
        <button
          type="button"
          onClick={() => setPeek(true)}
          aria-label="Pokaż skróty klawiszowe"
          title="Skróty klawiszowe (?)"
          data-testid="keyboard-hint-show"
          className={SMALL_BUTTON}
        >
          <span
            aria-hidden="true"
            className="flex size-5 items-center justify-center rounded-full border border-line text-[11px] font-medium"
          >
            ?
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="hidden items-center justify-center gap-1 md:flex">
      <p
        data-testid="keyboard-hint"
        aria-hidden="true"
        className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-fg-muted"
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
      {retired ? (
        <button
          type="button"
          onClick={() => setPeek(false)}
          aria-label="Zamknij podpowiedź"
          title="Zamknij"
          data-testid="keyboard-hint-close"
          className={SMALL_BUTTON}
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          onClick={hideForGood}
          aria-label="Nie pokazuj więcej tej podpowiedzi"
          title="Nie pokazuj więcej"
          data-testid="keyboard-hint-hide"
          className={SMALL_BUTTON}
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
