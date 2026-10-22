import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../config/routes";
import { isAnalyticsConfigured } from "../lib/analytics";
import { closeConsentSettings, setAnalyticsConsent, useConsent } from "../lib/consent";
import { Button } from "./ui/Button";

/** Obie decyzje wyglądają tak samo (ten sam rozmiar i styl): odmowa ma być tak łatwa jak zgoda. */
const CHOICE_BUTTON = "min-w-32 border border-field";

/**
 * Pasek na dole ekranu z prośbą o zgodę na statystyki. Nie blokuje strony (można czytać i korzystać z serwisu bez decyzji),
 * a dopóki użytkownik nie kliknie „Akceptuję”, nic nie jest zapisywane ani wysyłane do Google.
 * Pokazuje się też po kliknięciu „Ustawienia cookies” (stopka, Konto), żeby zmienić decyzję.
 * Nie istnieje, gdy build nie ma VITE_GA_MEASUREMENT_ID.
 */
export function ConsentBanner() {
  const { choice, reopened } = useConsent();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Gdy użytkownik sam otworzył ustawienia, przenosimy fokus na pasek (czytnik ekranu odczyta jego treść).
    if (reopened) headingRef.current?.focus();
  }, [reopened]);

  if (!isAnalyticsConfigured) return null;
  if (choice !== "unset" && !reopened) return null;

  return (
    <section
      aria-labelledby="consent-title"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-surface px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-fg"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="max-w-[68ch]">
          <h2 id="consent-title" ref={headingRef} tabIndex={-1} className="text-base font-semibold outline-none">
            Statystyki odwiedzin
          </h2>
          <p className="mt-1 text-sm leading-normal text-fg-muted">
            Chcemy wiedzieć, które części serwisu są używane, żeby go ulepszać. Służy do tego Google Analytics, który
            zapisuje na Twoim urządzeniu plik cookie. Bez Twojej zgody niczego nie zapisujemy i nic nie wysyłamy do Google.
            Decyzję zmienisz w każdej chwili w „Ustawieniach cookies” w stopce.{" "}
            <Link to={ROUTES.privacy} className="text-accent-ink underline">
              Polityka prywatności
            </Link>
            {choice !== "unset" && (
              <>
                {" "}
                Obecnie: {choice === "granted" ? "zgoda udzielona" : "zgoda nieudzielona"}.
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" className={CHOICE_BUTTON} onClick={() => setAnalyticsConsent(false)}>
            Odrzucam
          </Button>
          <Button variant="secondary" className={CHOICE_BUTTON} onClick={() => setAnalyticsConsent(true)}>
            Akceptuję
          </Button>
          {choice !== "unset" && (
            <Button variant="ghost" onClick={closeConsentSettings}>
              Zamknij
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
