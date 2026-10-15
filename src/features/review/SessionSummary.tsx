import { useQuery } from "@tanstack/react-query";
import { getDueByTomorrow, type SessionMode } from "../../api/review";
import { pluralizePl } from "../../lib/plural";

interface SessionSummaryProps {
  mode: SessionMode;
  /** Ile pozycji z tej sesji użytkownik zobaczył po raz pierwszy w życiu. */
  newCount: number;
  /** Nazwa tych pozycji w dopełniaczu liczby mnogiej, np. „pytania" albo „fiszki": „Nowe pytania w tej sesji". */
  newLabel: string;
}

/**
 * Dwa zdania o tym, co dalej, na ekranie „Brawo!": ile nowych pozycji zaczęło się w tej sesji i ile powtórek wróci
 * do końca jutra. Błąd pobrania liczby powtórek nie psuje ekranu: ten wiersz po prostu się nie pokazuje.
 */
export function SessionSummary({ mode, newCount, newLabel }: SessionSummaryProps) {
  const tomorrow = useQuery({
    queryKey: ["review", "due-tomorrow", mode],
    queryFn: () => getDueByTomorrow(mode),
    staleTime: 0,
    retry: false,
  });

  if (newCount <= 0 && tomorrow.data === undefined) return null;

  return (
    <div data-testid="session-summary" className="flex flex-col gap-1 text-sm tabular-nums text-fg-muted">
      {newCount > 0 && (
        <p>
          {newLabel}: <span className="font-semibold text-fg">{newCount}</span>
        </p>
      )}
      {tomorrow.data !== undefined && (
        <p>
          {tomorrow.data === 0
            ? "Na jutro nie masz żadnych powtórek."
            : `Jutro wróci ${tomorrow.data} ${pluralizePl(tomorrow.data, { one: "powtórka", few: "powtórki", many: "powtórek" })}.`}
        </p>
      )}
    </div>
  );
}
