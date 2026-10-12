// Uses the same key as the existing AuthContext/axiosInstance so both
// mechanisms stay in sync without any migration.
const TOKEN_KEY = "accessToken";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore storage errors (e.g. private browsing mode).
  }
}