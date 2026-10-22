import { useEffect, useRef, useState } from "react";
import {
  getTurnstileSiteKey,
  isTurnstileConfigured,
  loadTurnstile,
  type TurnstileApi,
} from "../lib/turnstile";

interface TurnstileWidgetProps {
  onToken: (token: string | null) => void;
  /** Zmiana tej liczby prosi Cloudflare o nowy token (poprzedni jest jednorazowy i po użyciu przestaje działać). */
  resetKey: number;
}

/** Pole „Potwierdź, że nie jesteś robotem” (Cloudflare Turnstile). Bez klucza strony niczego nie rysuje. */
export function TurnstileWidget({ onToken, resetKey }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<TurnstileApi | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [problem, setProblem] = useState<"load" | "run" | null>(null);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (apiRef.current && widgetIdRef.current) apiRef.current.reset(widgetIdRef.current);
  }, [resetKey]);

  useEffect(() => {
    if (!isTurnstileConfigured) return;
    let cancelled = false;

    loadTurnstile()
      .then((api) => {
        if (cancelled || !containerRef.current) return;
        apiRef.current = api;
        widgetIdRef.current = api.render(containerRef.current, {
          sitekey: getTurnstileSiteKey(),
          language: "pl",
          theme: "auto",
          size: "flexible",
          callback: (token) => {
            setProblem(null);
            onTokenRef.current(token);
          },
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => {
            onTokenRef.current(null);
            setProblem("run");
          },
        });
      })
      .catch(() => {
        if (!cancelled) setProblem("load");
      });

    return () => {
      cancelled = true;
      if (apiRef.current && widgetIdRef.current) apiRef.current.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, []);

  if (!isTurnstileConfigured) return null;

  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} className="min-h-[65px]" />
      {problem && (
        <p role="alert" className="text-sm text-danger">
          {problem === "load"
            ? "Nie udało się wczytać zabezpieczenia przed robotami. Wyłącz blokadę reklam dla tej strony i odśwież ją."
            : "Nie udało się sprawdzić zabezpieczenia. Odśwież stronę i spróbuj jeszcze raz."}
        </p>
      )}
    </div>
  );
}
