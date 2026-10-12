import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface DialogProps {
  title: string;
  /** Wywoływane po zamknięciu okna (Esc, kliknięcie tła, przycisk „Zamknij"). Rodzic ma wtedy odmontować okno. */
  onClose: () => void;
  /** Element, na który wraca fokus po zamknięciu (zwykle przycisk otwierający okno). */
  returnFocusTo?: RefObject<HTMLElement | null>;
  children: ReactNode;
}

/**
 * Okno modalne oparte na natywnym elemencie <dialog>: przeglądarka sama zamyka fokus w oknie, obsługuje Esc,
 * ukrywa resztę strony przed czytnikami ekranu i po zamknięciu przywraca fokus na przycisk, który je otworzył.
 * Okno jest montowane tylko wtedy, gdy ma być widoczne, więc jego stan zawsze zaczyna się od zera.
 * Trafia do <body> przez portal, żeby przekształcenia 3D fiszki nie zaburzały jego położenia.
 */
export function Dialog({ title, onClose, returnFocusTo, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    const opener = returnFocusTo?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    if (el && !el.open) el.showModal();
    // Natywne dialog.close() samo przywraca fokus, ale gdy rodzic po prostu odmontuje okno (np. przycisk „Zamknij"),
    // fokus przepadłby w <body>. Dlatego przywracamy go też tutaj.
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, [returnFocusTo]);

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // Kliknięcie w półprzezroczyste tło trafia w sam element <dialog>, a nie w jego zawartość.
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="m-auto w-[min(34rem,calc(100%-2rem))] rounded-2xl border border-line bg-surface p-0 text-fg shadow-xl backdrop:bg-black/60"
    >
      <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold text-fg">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Zamknij okno"
            className="-m-2 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>,
    document.body
  );
}
