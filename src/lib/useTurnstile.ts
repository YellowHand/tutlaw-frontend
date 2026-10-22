import { useCallback, useState } from "react";
import { isTurnstileConfigured, turnstileRequestConfig } from "./turnstile";

/**
 * Stan pola „nie jestem robotem” dla jednego formularza. Użycie:
 *   const botCheck = useTurnstile();
 *   <TurnstileWidget resetKey={botCheck.resetKey} onToken={botCheck.setToken} />
 *   api.post(url, body, botCheck.requestConfig);  // po każdej próbie wysłania: botCheck.reset()
 */
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  /** Token jest jednorazowy: po każdej próbie wysłania (udanej czy nie) trzeba poprosić o nowy. */
  const reset = useCallback(() => {
    setToken(null);
    setResetKey((key) => key + 1);
  }, []);

  return {
    token,
    setToken,
    resetKey,
    reset,
    /** Czy można wysłać formularz: bez Turnstile zawsze, z Turnstile dopiero po rozwiązaniu pola. */
    ready: !isTurnstileConfigured || token !== null,
    requestConfig: turnstileRequestConfig(token),
  };
}
