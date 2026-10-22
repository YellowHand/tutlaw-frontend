import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { disableAnalytics, enableAnalytics, isAnalyticsConfigured, trackPageView } from "../lib/analytics";
import { useConsent } from "../lib/consent";

/**
 * Łączy zgodę ze statystykami: „granted” włącza Google Analytics, każda inna decyzja go zatrzymuje i czyści ciasteczka.
 * Zgłasza też zmiany adresu (aplikacja jednostronicowa). Nic nie renderuje. Bez VITE_GA_MEASUREMENT_ID nic nie robi.
 * Musi być wewnątrz BrowserRouter.
 */
export function AnalyticsController() {
  const { choice } = useConsent();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isAnalyticsConfigured) return;
    if (choice === "granted") enableAnalytics();
    else disableAnalytics();
  }, [choice]);

  useEffect(() => {
    if (isAnalyticsConfigured && choice === "granted") trackPageView();
  }, [pathname, choice]);

  return null;
}
