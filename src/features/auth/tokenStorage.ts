/**
 * Sesja w przeglądarce.
 *
 * Token dostępu (JWT, 30 minut) żyje WYŁĄCZNIE w pamięci aplikacji (zmienna poniżej): znika po zamknięciu karty i nie leży w
 * localStorage, więc skrypt wstrzyknięty na stronę nie znajdzie go w magazynie. Token odświeżający jest w ciasteczku HttpOnly
 * ustawianym przez serwer, którego JavaScript w ogóle nie widzi; przeglądarka dołącza je sama do /api/auth/*.
 *
 * W localStorage zostaje tylko jawny znacznik „ta przeglądarka ma sesję” (bez żadnego sekretu). Dzięki niemu po odświeżeniu
 * strony wiemy, że warto zapytać serwer o nowy token dostępu, a odwiedzający bez konta nie wysyłają zbędnych zapytań.
 * Znacznik służy też do powiadamiania innych kart: wylogowanie w jednej wylogowuje wszystkie.
 */

/** Klucz znacznika sesji. Zaczyna się od „gradus.”, więc pełne czyszczenie po wylogowaniu (clearSession) też go usuwa. */
export const SESSION_HINT_KEY = "gradus.session.v1";

/** Klucze z czasów, gdy tokeny leżały w localStorage. Kasujemy je przy starcie, żeby nie zostały po nich ślady. */
const LEGACY_TOKEN_KEYS = ["accessToken", "refreshToken"];

let accessToken: string | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  if (token === accessToken) return;
  accessToken = token;
  emit();
}

/** Dla useSyncExternalStore: stan Reacta i klient HTTP zawsze widzą ten sam token. */
export function subscribeAccessToken(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSessionHint(present: boolean): void {
  try {
    if (present) localStorage.setItem(SESSION_HINT_KEY, "1");
    else localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // Magazyn niedostępny (np. tryb prywatny): sesja zadziała do przeładowania strony.
  }
}

/** Kończy sesję w tej przeglądarce: zapomina token dostępu i znacznik (inne karty zrobią to samo). */
export function clearStoredToken(): void {
  setAccessToken(null);
  setSessionHint(false);
}

/** Usuwa tokeny zapisane w localStorage przez wcześniejsze wersje aplikacji. Wywołaj raz, przed wyrenderowaniem. */
export function purgeLegacyTokens(): void {
  try {
    LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore storage errors (e.g. private browsing mode).
  }
}
