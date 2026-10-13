import { useAuth } from "../../auth/useAuth";

/**
 * Rola zapisana w tokenie (claim „role", np. „ADMIN" albo „STUDENT"). Token odczytujemy tylko po to, żeby pokazać
 * lub ukryć przyciski dla administratora: prawdziwa kontrola jest w backendzie przy każdym żądaniu.
 */
export function roleFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const claims = JSON.parse(atob(padded)) as { role?: unknown };
    return typeof claims.role === "string" ? claims.role : null;
  } catch {
    return null;
  }
}

export function useIsAdmin(): boolean {
  const { token } = useAuth();
  return roleFromToken(token) === "ADMIN";
}
