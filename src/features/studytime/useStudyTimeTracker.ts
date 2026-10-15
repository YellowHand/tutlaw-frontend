import { useEffect } from "react";
import { api } from "../../api/axiosInstance";
import { postKeepalive } from "../../api/keepalive";
import { StudyTimeMeter } from "./studyTimeMeter";

/** Co ile wysyłamy zebrany czas na serwer. */
const FLUSH_EVERY_MS = 30_000;
/** Serwer przyjmuje najwyżej tyle sekund w jednym zgłoszeniu. */
const MAX_REPORT_SECONDS = 300;

const INPUT_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"] as const;

function sendToServer(seconds: number): Promise<void> {
  return api.post("/api/me/study-time", { seconds }).then(() => undefined);
}

/**
 * Mierzy czas nauki na ekranach sesji (testy, powtórki, błędy, własny test, fiszki, egzamin), razem z czytaniem
 * wyjaśnień. Liczy tylko przy widocznej karcie przeglądarki i przerywa po 3 minutach bez ruchu. Wysyła co ok. 30 s
 * oraz przy wyjściu z ekranu i ze strony. To osobna miara od czasu odpowiedzi na pojedyncze pytanie.
 *
 * @param active czy bieżący ekran jest ekranem nauki
 */
export function useStudyTimeTracker(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const meter = new StudyTimeMeter(Date.now());
    meter.input(Date.now());
    let sending = false;

    const onInput = () => meter.input(Date.now());
    const tick = () => meter.tick(Date.now(), document.visibilityState === "visible");

    async function flush() {
      tick();
      if (sending) return;
      const seconds = meter.take(MAX_REPORT_SECONDS);
      if (seconds <= 0) return;
      sending = true;
      try {
        await sendToServer(seconds);
      } catch {
        // Nie udało się (brak sieci, błąd serwera): próbujemy ponownie przy następnym zgłoszeniu.
        meter.giveBack(seconds);
      } finally {
        sending = false;
      }
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        void flush();
      } else {
        // Powrót do karty to ślad aktywności: czas liczymy od razu, bez czekania na pierwszy ruch myszy.
        meter.tick(Date.now(), false);
        meter.input(Date.now());
      }
    }

    // Zamknięcie karty: zwykłe żądanie mogłoby zostać przerwane, więc wysyłamy resztę przez fetch z `keepalive`.
    function onPageHide() {
      tick();
      let seconds = meter.take(MAX_REPORT_SECONDS);
      while (seconds > 0) {
        postKeepalive("/api/me/study-time", { seconds }, true);
        seconds = meter.take(MAX_REPORT_SECONDS);
      }
    }

    const tickTimer = window.setInterval(tick, 1000);
    const flushTimer = window.setInterval(() => void flush(), FLUSH_EVERY_MS);
    INPUT_EVENTS.forEach((name) => window.addEventListener(name, onInput, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(tickTimer);
      window.clearInterval(flushTimer);
      INPUT_EVENTS.forEach((name) => window.removeEventListener(name, onInput, { capture: true }));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      // Wyjście z ekranu nauki: wysyłamy to, co zostało.
      void flush();
    };
  }, [active]);
}
