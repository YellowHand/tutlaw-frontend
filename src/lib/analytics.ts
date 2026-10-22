/**
 * Google Analytics 4, ładowany WYŁĄCZNIE po zgodzie użytkownika (zob. consent.ts i AnalyticsController).
 * Bez VITE_GA_MEASUREMENT_ID (np. lokalnie) analityka nie istnieje: nie ma banera ani żadnych połączeń z Google.
 *
 * Zasady:
 *  - skrypt Google nie jest pobierany, dopóki użytkownik nie kliknie „Akceptuję”,
 *  - funkcje reklamowe wyłączone (brak sygnałów Google, brak personalizacji reklam),
 *  - do Google trafia adres strony BEZ zapytania i fragmentu (w linkach z maili jest token potwierdzenia konta i resetu hasła),
 *  - po wycofaniu zgody kasujemy ciasteczka _ga* i zatrzymujemy wysyłanie.
 */

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

export const isAnalyticsConfigured = Boolean(GA_ID);

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let active = false;
let scriptRequested = false;

function gtag(...args: unknown[]): void {
  window.gtag?.(...args);
}

/** Adres bieżącej strony bez zapytania i fragmentu: /reset-password?token=abc daje https://gradusiuris.pl/reset-password. */
function safeLocation(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

function setDisabledFlag(disabled: boolean): void {
  if (!GA_ID) return;
  // Oficjalny przełącznik Google: ustawiony na true zatrzymuje wysyłanie danych z tej strony.
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = disabled;
}

/** Włącza analitykę (po zgodzie). Wywołanie kolejny raz niczego nie psuje. */
export function enableAnalytics(): void {
  if (!GA_ID || active) return;
  active = true;
  setDisabledFlag(false);

  if (scriptRequested) {
    // Zgoda była wycofana i udzielona ponownie w tej samej wizycie: skrypt już jest, wystarczy go znów odblokować.
    gtag("consent", "update", { analytics_storage: "granted" });
    return;
  }
  scriptRequested = true;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtagShim() {
    // Google wymaga obiektu „arguments”, nie zwykłej tablicy.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };

  gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  gtag("js", new Date());
  gtag("set", { page_location: safeLocation() });
  gtag("config", GA_ID, {
    send_page_view: false, // odsłony wysyłamy sami (trackPageView), z adresem bez zapytania
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
}

/** Zgłasza wyświetlenie strony (aplikacja jednostronicowa nie przeładowuje się przy zmianie adresu). */
export function trackPageView(): void {
  if (!active) return;
  const location = safeLocation();
  // „set” sprawia, że także zdarzenia automatyczne (przewijanie, kliknięcia) niosą adres bez zapytania.
  gtag("set", { page_location: location });
  gtag("event", "page_view", {
    page_location: location,
    page_path: window.location.pathname,
    page_title: document.title,
  });
}

/** Nazwy ciasteczek Google Analytics: _ga, _ga_<ID>, _gid i _gat*. */
function isGaCookie(name: string): boolean {
  return name === "_ga" || name.startsWith("_ga_") || name === "_gid" || name.startsWith("_gat");
}

/** Kasuje ciasteczka GA na wszystkich domenach, na których Google mógł je ustawić (pełna nazwa hosta i domeny nadrzędne). */
function clearGaCookies(): void {
  const labels = window.location.hostname.split(".");
  const domains: (string | null)[] = [null];
  for (let i = 0; i <= labels.length - 2; i++) {
    const domain = labels.slice(i).join(".");
    domains.push(domain, `.${domain}`);
  }
  const names = document.cookie
    .split(";")
    .map((pair) => pair.split("=")[0].trim())
    .filter(isGaCookie);
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

/** Wycofanie (lub odrzucenie) zgody: zatrzymuje wysyłanie i usuwa ciasteczka. */
export function disableAnalytics(): void {
  if (!GA_ID) return;
  if (active) {
    gtag("consent", "update", { analytics_storage: "denied" });
  }
  active = false;
  setDisabledFlag(true);
  clearGaCookies();
}
