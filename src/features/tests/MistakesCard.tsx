import { Link } from "react-router-dom";
import { RotateCcw, Play } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { pluralizePl } from "../../lib/plural";
import { useMistakesCount } from "../review/hooks";
import { START_BUTTON } from "./StartTestCard";

/**
 * „Powtórz moje błędy": osobna sesja z pytań, w których ostatnia odpowiedź w teście była błędna.
 * Gdy nie uda się pobrać liczby, karta po prostu się nie pokazuje (to dodatek, nie powód do komunikatu o błędzie).
 */
export function MistakesCard() {
  const { data, isLoading, isError } = useMistakesCount();

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (isError || !data) return null;

  const { count, lookbackDays, sessionSize } = data;
  const hasMistakes = count > 0;

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <RotateCcw size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold">Powtórz moje błędy</h2>
          {hasMistakes ? (
            <p className="text-sm text-fg-muted">
              <span className="font-semibold tabular-nums text-fg">{count}</span>{" "}
              {pluralizePl(count, { one: "pytanie", few: "pytania", many: "pytań" })}, w których ostatnia odpowiedź
              była błędna (z ostatnich {lookbackDays} dni).
              {count > sessionSize && ` Jedna sesja to ${sessionSize} najświeższych.`}
            </p>
          ) : (
            <p className="text-sm text-fg-muted">
              Nie masz teraz błędów do powtórzenia. Pytania, w których pomylisz się w teście, pojawią się tutaj, aż
              odpowiesz na nie poprawnie.
            </p>
          )}
        </div>
      </div>
      {hasMistakes && (
        <Link to={ROUTES.testMistakes} className={START_BUTTON}>
          <Play size={16} aria-hidden="true" />
          Powtórz błędy
        </Link>
      )}
    </Card>
  );
}
