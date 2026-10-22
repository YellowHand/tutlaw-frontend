import * as Sentry from "@sentry/react";
import { isAxiosError } from "axios";
import type { ErrorInfo } from "react";

/**
 * Raportowanie błędów do Sentry (serwer w UE, Niemcy). Włącza się TYLKO wtedy, gdy build ma VITE_SENTRY_DSN:
 * lokalnie (npm run dev) i bez DSN nic nie jest wysyłane, a wywołania Sentry są pustymi funkcjami.
 *
 * Zasada: wysyłamy błędy, nie ludzi. Brak śledzenia sesji, nagrywania ekranu i śledzenia wydajności; brak danych
 * osobowych (dataCollection wyłączone); z adresów usuwamy zapytanie i fragment (#), bo w linkach z maili jest token
 * potwierdzenia konta i resetu hasła. DSN nie jest sekretem (trafia do przeglądarki), dlatego może być w .env.production.
 */

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

/** Adres bez zapytania i fragmentu: /verify?token=abc#x zamienia się w /verify. */
function stripQuery(url: string): string {
  return url.split(/[?#]/)[0];
}

function scrubString(value: unknown): unknown {
  return typeof value === "string" ? stripQuery(value) : value;
}

/** Zdarzenie przed wysłaniem: czyścimy adresy i odrzucamy szum, który nic nie mówi o błędach w naszym kodzie. */
function beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint): Sentry.ErrorEvent | null {
  // Błędy zapytań do serwera (brak sieci, 4xx) są normalne i mają własne komunikaty na ekranach. Awarie po stronie serwera
  // (5xx) zgłasza sam backend. Przy okazji nie wysyłamy konfiguracji żądania, w której mogłoby być hasło.
  if (isAxiosError(hint.originalException)) return null;

  if (event.request) {
    if (event.request.url) event.request.url = stripQuery(event.request.url);
    delete event.request.query_string;
    delete event.request.cookies;
  }
  if (event.breadcrumbs) {
    for (const crumb of event.breadcrumbs) scrubBreadcrumb(crumb);
  }
  return event;
}

function scrubBreadcrumb(crumb: Sentry.Breadcrumb): void {
  if (!crumb.data) return;
  for (const key of ["url", "from", "to"]) {
    if (key in crumb.data) crumb.data[key] = scrubString(crumb.data[key]);
  }
}

function beforeBreadcrumb(crumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
  // Wpisy z konsoli mogłyby zawierać cokolwiek, co ktoś kiedyś wypisze, więc ich nie zbieramy.
  if (crumb.category === "console") return null;
  scrubBreadcrumb(crumb);
  return crumb;
}

/** Czy monitoring jest włączony w tym buildzie (jest DSN). Bez tego nie robimy żadnych dodatkowych zapytań ani zgłoszeń. */
export const isMonitoringEnabled = Boolean(DSN);

/**
 * Zalogowany użytkownik w zgłoszeniach: wyłącznie numer konta (np. „5”), nigdy adres e-mail, nazwa ani IP. Pozwala
 * zobaczyć, że ten sam użytkownik trafił na błąd kilka razy. Po wylogowaniu: null.
 */
export function setMonitoringUser(id: number | null): void {
  Sentry.setUser(id == null ? null : { id: String(id) });
}

/** Wywołaj raz, przed wyrenderowaniem aplikacji. */
export function initMonitoring(): void {
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE as string | undefined,
    // Sentry 11 domyślnie zbiera wszystko (nagłówki, ciasteczka, treści żądań, parametry adresu, dane użytkownika).
    // Wyłączamy to jawnie: wysyłamy sam błąd, ślad stosu i adres strony bez zapytania.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    },
    // Bez śledzenia wydajności (tracesSampleRate nie ustawiamy) i bez nagrywania sesji (Replay nie jest dołączony).
    // Sesje wydań (BrowserSession) też wyłączamy: nie potrzebujemy liczyć „zdrowia wydania" i nie chcemy identyfikatora sesji.
    integrations: (defaults) => defaults.filter((integration) => integration.name !== "BrowserSession"),
    beforeSend,
    beforeBreadcrumb,
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications.",
      // Zerwane połączenie użytkownika to nie błąd aplikacji.
      "Network Error",
      "Failed to fetch",
      "Load failed",
    ],
    // Błędy z rozszerzeń przeglądarki nie są nasze.
    denyUrls: [/^chrome-extension:\/\//i, /^moz-extension:\/\//i, /^safari-(web-)?extension:\/\//i],
  });
}

/** Błąd wyświetlania ekranu złapany przez ErrorBoundary. */
export function reportRenderError(error: unknown, info: ErrorInfo): void {
  Sentry.captureReactException(error, info);
}

/**
 * Błędy React poza ErrorBoundary (np. w dostawcach) i błędy, z których React sam się podniósł. Zastępują domyślne
 * zgłaszanie (window.reportError), więc nie dojdzie do dubla; dalej wypisujemy je w konsoli, żeby były widoczne przy pracy.
 */
export const reactRootErrorOptions = {
  onUncaughtError: Sentry.reactErrorHandler((error) => console.error("Nieobsłużony błąd ekranu", error)),
  onRecoverableError: Sentry.reactErrorHandler((error) => console.error("Błąd ekranu, z którego aplikacja się podniosła", error)),
};
