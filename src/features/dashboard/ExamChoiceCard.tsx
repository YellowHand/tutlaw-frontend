import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";
import { formatDatePl } from "../../lib/date";
import { serverMessage } from "../../lib/errors";
import { EXAM_APPLICATIONS, ORIGIN_LABELS, type QuestionOrigin } from "../../lib/origin";
import { pluralizePl } from "../../lib/plural";
import { useChooseExam } from "../settings/examChoice";
import { useExamTerms } from "../settings/hooks";

interface ExamChoiceCardProps {
  onSkip: () => void;
}

/** „egzamin 15 marca 2027, za 154 dni", „termin nieogłoszony" albo null, gdy terminów nie udało się pobrać. */
function termLine(date: string | null | undefined, days: number | null | undefined, loaded: boolean): string | null {
  if (!loaded) return null;
  if (!date) return "termin nieogłoszony";
  if (days == null) return `egzamin ${formatDatePl(date)}`;
  if (days === 0) return `egzamin dzisiaj, ${formatDatePl(date)}`;
  return `egzamin ${formatDatePl(date)}, za ${days} ${pluralizePl(days, { one: "dzień", few: "dni", many: "dni" })}`;
}

/**
 * Pierwsze pytanie na Pulpicie: do jakiego egzaminu użytkownik się przygotowuje. Z wyboru biorą się termin, odliczanie
 * i plan dnia, a pytania w Testach zawężają się do tej aplikacji i pytań autorskich (potem filtr zmienia się osobno).
 * Kafelek znika po wyborze albo po „Wybiorę później"; wybór można zmienić w Koncie. Żaden z przycisków nie jest złoty:
 * jedyny złoty przycisk Pulpitu zostaje w „Na dziś".
 */
export function ExamChoiceCard({ onSkip }: ExamChoiceCardProps) {
  const terms = useExamTerms();
  const choose = useChooseExam();
  const termList = Array.isArray(terms.data) ? terms.data : null;
  const byOrigin = new Map((termList ?? []).map((term) => [term.origin, term]));

  function pick(origin: QuestionOrigin) {
    if (choose.isPending) return;
    choose.mutate(origin);
  }

  return (
    <section
      aria-labelledby="exam-choice-title"
      data-testid="exam-choice"
      className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6"
    >
      <div>
        <h2 id="exam-choice-title" className="text-lg font-semibold">
          Do jakiego egzaminu się przygotowujesz?
        </h2>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">
          Na tej podstawie pokażemy odliczanie i dzienny plan, a w Testach zostaną pytania z wybranej aplikacji i pytania
          autorskie. Wybór zmienisz w Koncie.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {EXAM_APPLICATIONS.map((origin) => {
          const term = byOrigin.get(origin);
          const line = termLine(term?.examDate, term?.daysToExam, termList !== null);
          const pending = choose.isPending && choose.variables === origin;
          return (
            <li key={origin}>
              <button
                type="button"
                onClick={() => pick(origin)}
                disabled={choose.isPending}
                aria-busy={pending}
                className={cn(
                  "flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-left transition-colors hover:bg-line",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-70"
                )}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-fg">{ORIGIN_LABELS[origin]}</span>
                  {line && <span className="block text-xs text-fg-muted">{line}</span>}
                </span>
                {pending && <Loader2 size={16} aria-hidden="true" className="shrink-0 animate-spin text-fg-muted" />}
              </button>
            </li>
          );
        })}
      </ul>

      {choose.isError && (
        <p role="alert" className="text-sm text-danger">
          {serverMessage(choose.error, "Nie udało się zapisać wyboru. Spróbuj ponownie.")}
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={onSkip}
          disabled={choose.isPending}
          className="inline-flex min-h-11 cursor-pointer items-center text-sm text-fg-muted underline underline-offset-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Wybiorę później
        </button>
      </div>
    </section>
  );
}
