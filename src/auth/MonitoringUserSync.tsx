import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "../features/account/api";
import { isMonitoringEnabled, setMonitoringUser } from "../lib/monitoring";
import { useAuth } from "./useAuth";

/**
 * Przekazuje do Sentry numer konta zalogowanego użytkownika (patrz setMonitoringUser). Nic nie renderuje.
 * Gdy Sentry jest wyłączony (brak VITE_SENTRY_DSN), nie wysyła nawet zapytania o konto.
 * Klucz zapytania zawiera token, więc po zalogowaniu na inne konto numer nigdy nie zostaje po poprzednim.
 */
export function MonitoringUserSync() {
  const { isAuthenticated, token } = useAuth();
  const { data } = useQuery({
    queryKey: ["monitoring-user", token],
    queryFn: fetchMe,
    enabled: isMonitoringEnabled && isAuthenticated,
    staleTime: Infinity,
    retry: false,
  });
  const userId = isAuthenticated ? (data?.id ?? null) : null;

  useEffect(() => {
    if (isMonitoringEnabled) setMonitoringUser(userId);
  }, [userId]);

  return null;
}
