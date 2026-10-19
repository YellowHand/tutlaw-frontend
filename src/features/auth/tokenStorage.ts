// Klucz tokenu dostępu jest ten sam co zawsze (bez przedrostka „gradus."), żeby nie było żadnej migracji.
const TOKEN_KEY = "accessToken";
// Token odświeżający (ważny 30 dni, jednorazowy: każde użycie wydaje nowy). Na razie w localStorage, tak jak token dostępu.
const REFRESH_KEY = "refreshToken";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  return read(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return read(REFRESH_KEY);
}

/** Zapisuje parę tokenów po zalogowaniu, zmianie hasła i odświeżeniu sesji. */
export function storeTokens(accessToken: string, refreshToken: string | null | undefined): void {
  try {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  } catch {
    // Magazyn niedostępny (np. tryb prywatny): sesja zadziała do przeładowania strony.
  }
}

/** Kasuje oba tokeny. */
export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // Ignore storage errors (e.g. private browsing mode).
  }
}
