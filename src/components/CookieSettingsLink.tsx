import { isAnalyticsConfigured } from "../lib/analytics";
import { openConsentSettings } from "../lib/consent";

/** Link „Ustawienia cookies”: otwiera baner zgody, żeby zmienić lub wycofać decyzję. Bez analityki nic nie pokazuje. */
export function CookieSettingsLink({ className }: { className?: string }) {
  if (!isAnalyticsConfigured) return null;
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      Ustawienia cookies
    </button>
  );
}
