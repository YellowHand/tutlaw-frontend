import { Link } from "react-router-dom";
import { CalendarClock, Play } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { ROUTES } from "../../config/routes";
import { pluralizePl } from "../../lib/plural";
import { START_BUTTON } from "./StartTestCard";

interface DueReviewsCardProps {
  /** Ile pytań testowych ma już minięty termin powtórki (ta sama liczba co na odznace „Testy" w menu). */
  count: number;
}

/**
 * „Zaległe powtórki": sesja z samych pytań, którym minął termin powtórki, bez nowych pytań.
 * To miejsce, do którego prowadzi odznaka przy „Testy" w menu. Gdy nic nie zalega, karty nie ma (jak odznaki).
 */
export function DueReviewsCard({ count }: DueReviewsCardProps) {
  if (count <= 0) return null;

  const questions = pluralizePl(count, { one: "pytanie", few: "pytania", many: "pytań" });

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <CalendarClock size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold">Zaległe powtórki</h2>
          <p className="text-sm text-fg-muted">
            <span className="font-semibold tabular-nums text-fg">{count}</span> {questions} do powtórki. Sama powtórka,
            bez nowych pytań.
          </p>
        </div>
      </div>
      <Link to={ROUTES.testDue} className={`${START_BUTTON} shrink-0 whitespace-nowrap`}>
        <Play size={16} aria-hidden="true" />
        Powtórz zaległe
      </Link>
    </Card>
  );
}
