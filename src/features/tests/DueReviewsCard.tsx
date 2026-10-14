import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { ROUTES } from "../../config/routes";
import { pluralizePl } from "../../lib/plural";
import { START_BUTTON } from "./StartButtons";

interface DueReviewsCardProps {
  /** Ile pytań testowych ma już minięty termin powtórki (ta sama liczba co na odznace „Testy" w menu). */
  count: number;
}

/**
 * „Zaległe powtórki": smukły pasek z liczbą i jedynym złotym przyciskiem na stronie. Sesja z samych pytań, którym
 * minął termin, bez nowych pytań. Tu prowadzi odznaka przy „Testy" w menu. Gdy nic nie zalega, paska nie ma.
 */
export function DueReviewsCard({ count }: DueReviewsCardProps) {
  if (count <= 0) return null;

  const questions = pluralizePl(count, { one: "pytanie", few: "pytania", many: "pytań" });

  return (
    <section
      aria-labelledby="due-reviews"
      className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 pl-4 sm:p-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <CalendarClock size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="due-reviews" className="text-sm">
            <span className="font-semibold tabular-nums">{count}</span> {questions} do powtórki
          </h2>
          <p className="hidden text-xs text-fg-muted sm:block">Sama powtórka, bez nowych pytań.</p>
        </div>
      </div>
      <Link to={ROUTES.testDue} className={`${START_BUTTON} shrink-0`}>
        Powtórz<span className="sr-only"> zaległe pytania</span>
      </Link>
    </section>
  );
}
