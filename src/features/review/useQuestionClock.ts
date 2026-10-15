import { useCallback, useEffect, useState } from "react";
import { QuestionClock } from "./questionClock";

interface Options {
  /** Identyfikuje pytanie: po zmianie stoper startuje od zera. */
  questionKey: string | number | null;
  /** Nowa porcja pytań (np. „Powtórz teraz") zaczyna od zera nawet przy tym samym numerze pytania. */
  batch: unknown;
  /** Czy pytanie czeka na odpowiedź. Po odpowiedzi, w podglądzie i na ekranie końcowym stoper stoi. */
  running: boolean;
  /** false: nie odświeżamy widocznej liczby co pół sekundy (wystarczy `read`). */
  display?: boolean;
}

interface Shown {
  questionKey: string | number | null;
  batch: unknown;
  seconds: number;
}

/**
 * Stoper pytania liczący tylko wtedy, gdy karta przeglądarki jest widoczna (nie liczymy czasu, gdy użytkownik
 * przełączył się gdzie indziej). Zwraca pełne sekundy do wyświetlenia oraz `read` z dokładnym czasem do wysłania na serwer.
 */
export function useQuestionClock({ questionKey, batch, running, display = true }: Options) {
  const [clock] = useState(() => new QuestionClock());
  const [shown, setShown] = useState<Shown>({ questionKey, batch, seconds: 0 });

  useEffect(() => {
    clock.reset();
  }, [clock, questionKey, batch]);

  useEffect(() => {
    const sync = () => {
      if (running && !document.hidden) clock.resume();
      else clock.pause();
      if (display) setShown({ questionKey, batch, seconds: Math.floor(clock.seconds()) });
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    const timer = running && display ? window.setInterval(sync, 500) : undefined;
    return () => {
      document.removeEventListener("visibilitychange", sync);
      if (timer !== undefined) window.clearInterval(timer);
      clock.pause();
    };
  }, [clock, running, display, questionKey, batch]);

  const read = useCallback(() => clock.seconds(), [clock]);
  // Zapamiętana liczba dotyczy innego pytania (właśnie się zmieniło): do czasu kolejnego tyknięcia pokazujemy 0.
  const seconds = shown.questionKey === questionKey && shown.batch === batch ? shown.seconds : 0;
  return { seconds, read };
}
