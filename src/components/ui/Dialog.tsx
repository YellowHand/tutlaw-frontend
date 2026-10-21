import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface DialogProps {
  title: string;
  /** Wywoływane po zamknięciu okna (Esc, kliknięcie tła, przycisk „Zamknij"). Rodzic ma wtedy odmontować okno. */
  onClose: () => void;
  /** Element, na który wraca fokus po zamknięciu (zwykle przycisk otwierający okno). */
  returnFocusTo?: RefObject<HTMLElement | null>;
  /** Czy kliknięcie w tło zamyka okno (domyślnie tak). Wyłącz przy oknach z wypełnianym formularzem albo ważnym wyborem. */
  closeOnBackdrop?: boolean;
  /**
   * Czy okno można zamknąć bez wyboru (domyślnie tak). Przy `false` nie ma przycisku „Zamknij okno", Esc i tło nie działają,
   * a okno znika dopiero, gdy rodzic je odmontuje (np. po zapisaniu obowiązkowego wyboru). Rodzic musi dać w środku wyjście,
   * np. wylogowanie.
   */
  dismissible?: boolean;
  /**
   * Układ okna. „default": wąskie okno z przewijaną zawartością. „wizard": szerokie okno ze stałą wysokością i własnym
   * przewijaniem w środku (dla kreatora z dolnym paskiem przycisków); na telefonie zajmuje cały ekran.
   */
  layout?: "default" | "wizard";
  /** Podtytuł pod tytułem (tylko układ „wizard"). */
  description?: string;
  children: ReactNode;
}

/**
 * Okno modalne oparte na natywnym elemencie <dialog>: przeglądarka sama zamyka fokus w oknie, obsługuje Esc,
 * ukrywa resztę strony przed czytnikami ekranu i po zamknięciu przywraca fokus na przycisk, który je otworzył.
 * Okno jest montowane tylko wtedy, gdy ma być widoczne, więc jego stan zawsze zaczyna się od zera.
 * Trafia do <body> przez portal, żeby przekształcenia 3D fiszki nie zaburzały jego położenia.
 * Ma `data-no-shortcuts`: skróty klawiszowe sesji nauki (A/B/C, Enter, strzałki) nie działają, gdy okno jest otwarte.
 */
export function Dialog({
  title,
  onClose,
  returnFocusTo,
  closeOnBackdrop = true,
  dismissible = true,
  layout = "default",
  description,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const wizard = layout === "wizard";

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
      data-no-shortcuts
      // Esc: przy oknie obowiązkowym blokujemy zamknięcie.
      onCancel={(e) => {
        if (!dismissible) e.preventDefault();
      }}
      onClose={() => {
        if (dismissible) {
          onClose();
          return;
        }
        // Część przeglądarek zamyka okno przy drugim Esc mimo preventDefault: otwieramy je z powrotem.
        const el = ref.current;
        if (el?.isConnected && !el.open) el.showModal();
      }}
      onClick={(e) => {
        // Kliknięcie w półprzezroczyste tło trafia w sam element <dialog>, a nie w jego zawartość.
        if (dismissible && closeOnBackdrop && e.target === e.currentTarget) e.currentTarget.close();
      }}
      className={
        wizard
          ? "m-0 h-dvh max-h-none w-dvw max-w-none rounded-none border-0 border-line bg-surface p-0 text-fg shadow-xl backdrop:bg-black/60 sm:m-auto sm:h-[min(46rem,calc(100dvh-2rem))] sm:w-[min(60rem,calc(100%-2rem))] sm:rounded-2xl sm:border"
          : "m-auto w-[min(34rem,calc(100%-2rem))] rounded-2xl border border-line bg-surface p-0 text-fg shadow-xl backdrop:bg-black/60"
      }
    >
      <div
        className={
          wizard ? "flex h-full flex-col overflow-hidden" : "flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-5 sm:p-6"
        }
      >
        <div className={wizard ? "flex items-start justify-between gap-4 px-5 pt-5 pb-3 sm:px-6" : "flex items-start justify-between gap-4"}>
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-fg">
              {title}
            </h2>
            {wizard && description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Zamknij okno"
              className="-m-2 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>
        {children}
      </div>
    </dialog>,
    document.body
  );
}
