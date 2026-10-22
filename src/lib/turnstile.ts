/**
 * Cloudflare Turnstile: pole „Potwierdź, że nie jesteś robotem” na formularzach, które boty lubią (rejestracja, logowanie,
 * reset hasła, ponowna wysyłka maila). Widget daje jednorazowy token, który wysyłamy do serwera w nagłówku X-Turnstile-Token;
 * serwer sprawdza go w Cloudflare.
 *
 * Bez VITE_TURNSTILE_SITE_KEY (np. lokalnie) widgetu nie ma, formularze działają jak dawniej i nic nie jest pobierane z Cloudflare.
 * Skrypt Cloudflare ładujemy dopiero na ekranie, który pokazuje widget, nie na całej stronie. Klucz strony nie jest sekretem.
 */

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

export const isTurnstileConfigured = Boolean(SITE_KEY);

/** Nagłówek, w którym backend oczekuje tokenu (zob. TurnstileVerifier.HEADER). */
export const TURNSTILE_HEADER = "X-Turnstile-Token";

/** Konfiguracja żądania axios z tokenem; bez tokenu (Turnstile wyłączony) nic nie dodajemy. */
export function turnstileRequestConfig(token: string | null): { headers: Record<string, string> } | undefined {
  return token ? { headers: { [TURNSTILE_HEADER]: token } } : undefined;
}

export interface TurnstileRenderOptions {
  sitekey: string;
  language?: string;
  theme?: "auto" | "light" | "dark";
  size?: "normal" | "flexible" | "compact";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
}

export interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<TurnstileApi> | null = null;

/** Pobiera skrypt Cloudflare (raz na wizytę). Gdy się nie uda (np. blokada reklam), kolejne wywołanie spróbuje jeszcze raz. */
export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile niedostępny po załadowaniu skryptu"));
    };
    script.onerror = () => reject(new Error("Nie udało się pobrać skryptu Turnstile"));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    scriptPromise = null;
    document.querySelectorAll(`script[src="${SCRIPT_URL}"]`).forEach((node) => node.remove());
    throw error;
  });
  return scriptPromise;
}

export function getTurnstileSiteKey(): string {
  return SITE_KEY ?? "";
}
