import { useState } from "react";
import { Play, Shuffle } from "lucide-react";
import { EMPTY_SCOPE } from "../../api/customTest";
import { cn } from "../../lib/cn";
import { pluralizePl } from "../../lib/plural";
import { useCustomTestCounts, useStartCustomTest } from "../customTest/hooks";
import { DEFAULT_COUNT, hubCountOptions, pickCountOption } from "../customTest/selection";
import { formatCount } from "./format";
import { START_BUTTON } from "./StartButtons";

/**
 * „Losuj z całej puli": najkrótsza droga do testu. Losowe pytania ze wszystkich przepisów i obu źródeł, bez ustawień:
 * użytkownik wybiera tylko liczbę i klika Start. Karta jest bez obwódki (jedyny wyróżniony pasek to „do powtórki" wyżej);
 * wyróżnia ją złoty przycisk Start.
 */
export function DrawFromPoolCard() {
  const counts = useCustomTestCounts(EMPTY_SCOPE, "ALL");
  const available = counts.data?.all ?? 0;
  const options = hubCountOptions(available);
  const [picked, setPicked] = useState<string | null>(null);
  const chosen = (picked !== null ? options.find((o) => o.key === picked) : undefined) ?? pickCountOption(options, DEFAULT_COUNT);
  const { start, starting, error } = useStartCustomTest();
  const canStart = chosen !== null && !starting;

  return (
    <section
      aria-labelledby="draw-pool"
      data-testid="draw-card"
      className="flex flex-col gap-5 rounded-[20px] border border-line bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6 sm:p-6"
    >
      <div className="flex min-w-0 flex-1 items-start gap-4 sm:basis-96 sm:gap-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent-ink sm:size-14">
          <Shuffle size={26} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <h2 id="draw-pool" className="text-lg font-bold sm:text-xl">
              Losuj z całej puli
            </h2>
            <p className="text-sm text-fg-muted">Losowe pytania ze wszystkich przepisów i obu źródeł. Bez ustawień.</p>
          </div>

          {counts.isLoading ? (
            <p className="text-sm text-fg-muted">Liczę pytania…</p>
          ) : options.length === 0 ? (
            <p className="text-sm text-fg-muted">
              {counts.isError ? "Nie udało się sprawdzić, ile jest pytań." : "Nie ma jeszcze pytań, z których dałoby się ułożyć test."}
            </p>
          ) : (
            <div role="group" aria-label="Liczba pytań" className="flex flex-wrap items-center gap-2" data-testid="draw-count-options">
              <span className="mr-1 text-[13px] text-fg-muted">Ile pytań?</span>
              {options.map((option) => {
                const active = chosen?.key === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPicked(option.key)}
                    className={cn(
                      "inline-flex min-h-11 min-w-14 cursor-pointer items-center justify-center rounded-full border px-4 text-sm tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink",
                      active ? "border-accent bg-accent/10 font-bold text-accent-ink" : "border-line bg-surface font-medium text-fg hover:bg-surface-2"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={!canStart}
        data-testid="draw-start"
        onClick={() =>
          chosen &&
          void start({ scope: EMPTY_SCOPE, source: "ALL", kind: "ALL", questionCount: chosen.sends })
        }
        className={cn(START_BUTTON, "min-h-13 cursor-pointer text-base font-bold disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-40 sm:shrink-0")}
      >
        <Play size={18} aria-hidden="true" />
        {starting ? "Losuję…" : "Start"}
        {chosen && !starting && (
          <span className="sr-only">
            : {chosen.all ? "wszystkie" : chosen.count} {pluralizePl(chosen.count, { one: "pytanie", few: "pytania", many: "pytań" })} z {formatCount(available)}
          </span>
        )}
      </button>
    </section>
  );
}
