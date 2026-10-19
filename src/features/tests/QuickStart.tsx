import { Link } from "react-router-dom";
import { ClipboardList, RotateCcw, SlidersHorizontal, Timer } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { pluralizePl } from "../../lib/plural";
import { useMistakesCount } from "../review/hooks";

const TILE =
  "relative flex min-h-11 flex-col items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-3 text-center text-sm font-medium leading-tight text-fg transition-colors hover:bg-surface-2 sm:flex-row sm:gap-2.5 sm:px-5 sm:py-0";
const ICON = "shrink-0 text-fg-muted";

/**
 * „Szybki start": ciche przyciski w jednym rzędzie zamiast dużych kart: „Cała pula", „Własny test", „Moje błędy"
 * i „Egzamin próbny". „Moje błędy" jest tylko wtedy, gdy są błędy do powtórki; gdy nie uda się pobrać liczby,
 * po prostu go nie ma (to dodatek, nie powód do komunikatu).
 * Opisy, np. że egzamin nie zmienia powtórek, są na ekranach, które się po kliknięciu otwierają.
 */
export function QuickStart() {
  const { data, isLoading } = useMistakesCount();
  const mistakes = data?.count ?? 0;
  const showMistakes = mistakes > 0;
  // Dawny opis z karty „Powtórz moje błędy" mieści się teraz w podpowiedzi i w nazwie dla czytnika ekranu.
  const mistakesHint = data
    ? `${mistakes} ${pluralizePl(mistakes, { one: "pytanie", few: "pytania", many: "pytań" })}, w których ostatnia odpowiedź była błędna (z ostatnich ${data.lookbackDays} dni).${
        mistakes > data.sessionSize ? ` Jedna sesja to ${data.sessionSize} najświeższych.` : ""
      }`
    : "";
  // Na telefonie cztery przyciski układają się w 2×2, a trzy (bez „Moich błędów") w jednym rzędzie.
  const columns = isLoading || showMistakes ? "grid-cols-2" : "grid-cols-3";

  return (
    <section aria-labelledby="quick-start" className="flex flex-col gap-3">
      <h2 id="quick-start" className="text-sm font-medium text-fg-muted">
        Szybki start
      </h2>

      <div className={cn("grid gap-2 sm:flex sm:flex-wrap sm:gap-3", columns)}>
        <Link to={ROUTES.testAll} className={TILE}>
          <ClipboardList size={18} aria-hidden="true" className={ICON} />
          Cała pula
        </Link>

        <Link to={ROUTES.customTest} className={TILE}>
          <SlidersHorizontal size={18} aria-hidden="true" className={ICON} />
          Własny test
        </Link>

        {isLoading ? (
          <Skeleton className="min-h-[76px] sm:h-11 sm:min-h-0 sm:w-44" />
        ) : (
          showMistakes && (
            <Link to={ROUTES.testMistakes} title={mistakesHint} aria-label={`Moje błędy: ${mistakesHint}`} className={TILE}>
              <RotateCcw size={18} aria-hidden="true" className={ICON} />
              Moje błędy
              <span className="absolute right-1.5 top-1.5 rounded-full bg-surface-2 px-1.5 text-xs tabular-nums text-fg-muted sm:static">
                {mistakes}
              </span>
            </Link>
          )
        )}

        <Link to={ROUTES.exam} className={TILE}>
          <Timer size={18} aria-hidden="true" className={ICON} />
          Egzamin próbny
        </Link>
      </div>
    </section>
  );
}
