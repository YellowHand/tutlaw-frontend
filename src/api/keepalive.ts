import { getStoredToken } from "../features/auth/tokenStorage";

/**
 * Wysyła żądanie POST, które przeglądarka dokończy nawet po zamknięciu karty albo przejściu na inną stronę
 * (fetch z `keepalive`). Potrzebne do wylogowania i do zapisania ostatnich sekund czasu nauki przy zamykaniu karty.
 * `navigator.sendBeacon` odpada, bo nie potrafi wysłać nagłówka Authorization.
 * Błędy są pomijane: to zapis „na ostatnią chwilę", którego nie da się ponowić.
 */
export function postKeepalive(path: string, body: unknown, withAuthorization: boolean): void {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (withAuthorization) {
      const token = getStoredToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    void fetch(`${import.meta.env.VITE_API_BASE_URL ?? ""}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Brak fetch albo zbyt duże ciało: nic nie robimy.
  }
}
