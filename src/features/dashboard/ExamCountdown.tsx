import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { ROUTES } from "../../config/routes";
import { pluralizePl } from "../../lib/plural";
import { formatDatePl } from "../../lib/date";
import { useLearningSettings } from "../settings/hooks";

/**
 * Odliczanie do egzaminu pod nagłówkiem pulpitu. Pokazuje się tylko wtedy, gdy użytkownik ustawił datę egzaminu,
 * która jeszcze nie minęła. To dodatek, więc przy błędzie albo ładowaniu nie zajmuje miejsca.
 */
export function ExamCountdown() {
  const { data } = useLearningSettings();
  if (!data || !data.examDate || data.examPassed || data.daysToExam == null) return null;

  const days = data.daysToExam;
  const when =
    days === 0
      ? "Egzamin jest dzisiaj"
      : days === 1
        ? "Egzamin jutro"
        : `Do egzaminu ${days} ${pluralizePl(days, { one: "dzień", few: "dni", many: "dni" })}`;

  return (
    <Link
      to={ROUTES.account}
      className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <CalendarClock aria-hidden className="size-4 text-accent" />
      <span>
        <span className="font-medium text-fg">{when}</span> ({formatDatePl(data.examDate)})
        {data.retentionBoosted ? ", tryb egzaminacyjny włączony" : ""}
      </span>
    </Link>
  );
}
