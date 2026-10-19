import { Link } from "react-router-dom";
import { CalendarClock, CheckCircle2, Play } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { formatDatePl } from "../../lib/date";
import { pluralizePl } from "../../lib/plural";
import { useDueCount, useMistakesCount } from "../review/hooks";
import { useLearningSettings } from "../settings/hooks";
import { LimitNotice } from "../settings/LimitNotice";
import { limitIssue } from "../settings/newQuestionsLimit";
import { useActivity, useTestStats } from "../statistics/hooks";
import { getStreak, getThisWeekTotal } from "../statistics/selectors";
import { QUIET_BUTTON, START_BUTTON } from "../tests/StartButtons";
import { InlineError } from "./InlineError";
import { pickTodayAction } from "./selectors";

const TEXT_LINK =
  "inline-flex min-h-11 items-center text-sm text-fg-muted underline underline-offset-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink";

interface TodayCardProps {
  className?: string;
}

/**
 * „Na dziś": jedno miejsce, które mówi, co zrobić teraz. Główny przycisk (jedyny złoty na pulpicie) sam wybiera
 * następny krok: zaległe pytania, potem zaległe fiszki, potem nowe pytania. Jest podpisany tym, co się po nim stanie,
 * a testy i fiszki nie mieszają się w jednej sesji. Na górze karty jest egzamin (termin i wybrana aplikacja; Student go nie ma), pod
 * przyciskiem cel dnia i cicha seria nauki. Reszta (fiszki do powtórki, poprawa błędów) to ciche linki.
 */
export function TodayCard({ className }: TodayCardProps) {
  const dueTests = useDueCount("TEST");
  const dueFlashcards = useDueCount("FLASHCARD");
  const stats = useTestStats();

  if (dueTests.isLoading || dueFlashcards.isLoading || stats.isLoading) {
    return <Skeleton className={cn("h-56 w-full", className)} />;
  }

  // Górny odstęp mniejszy, bo pierwszy wiersz (link do egzaminu) ma 44 px wysokości z samego celu dotykowego.
  const frame = cn("flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 pt-3 sm:p-6 sm:pt-4", className);

  // Bez obu liczników nie wiadomo, co zalega: pokazujemy błąd. Jeden brakujący licznik liczymy jako zero.
  if (dueTests.isError && dueFlashcards.isError) {
    return (
      <section aria-labelledby="today-title" className={frame}>
        <h2 id="today-title" className="text-sm font-medium text-fg-muted">
          Na dziś
        </h2>
        <InlineError
          message="Nie udało się sprawdzić, co zalega."
          onRetry={() => {
            void dueTests.refetch();
            void dueFlashcards.refetch();
          }}
        />
      </section>
    );
  }

  // Gdy nie uda się pobrać statystyk, zakładamy, że są nowe pytania: sesja i tak sama pokaże, że ich nie ma.
  const newQuestionsLeft = stats.data ? stats.data.totalQuestions > stats.data.solvedQuestions : true;
  const action = pickTodayAction({ dueTests: dueTests.data ?? 0, dueFlashcards: dueFlashcards.data ?? 0, newQuestionsLeft });

  return (
    <section aria-labelledby="today-title" className={frame}>
      <ExamLine />

      <div>
        <h2 id="today-title" className="text-sm font-medium text-fg-muted">
          Na dziś
        </h2>

        {action.kind === "due-tests" && (
          <>
            <p className="mt-1 text-3xl font-bold">
              {action.count} {pluralizePl(action.count, { one: "pytanie", few: "pytania", many: "pytań" })}{" "}
              <span className="font-semibold">do powtórki</span>
            </p>
            <p className="mt-1 text-sm text-fg-muted">Sama powtórka, bez nowych pytań.</p>
          </>
        )}
        {action.kind === "due-flashcards" && (
          <>
            <p className="mt-1 text-3xl font-bold">
              {action.count} {pluralizePl(action.count, { one: "fiszka", few: "fiszki", many: "fiszek" })}{" "}
              <span className="font-semibold">do powtórki</span>
            </p>
            <p className="mt-1 text-sm text-fg-muted">Pytania testowe nie zalegają.</p>
          </>
        )}
        {action.kind === "new-questions" && (
          <>
            <p className="mt-1 text-3xl font-bold">Nic nie zalega</p>
            <p className="mt-1 text-sm text-fg-muted">Możesz wziąć nową porcję pytań z całej puli.</p>
          </>
        )}
        {action.kind === "all-done" && (
          <>
            <p className="mt-1 inline-flex items-center gap-2 text-3xl font-bold">
              <CheckCircle2 size={28} aria-hidden="true" className="text-success" />
              Na dziś gotowe
            </p>
            <p className="mt-1 text-sm text-fg-muted">Nic nie zalega i wszystkie dostępne pytania są już rozwiązane.</p>
          </>
        )}
      </div>

      <TodayActions action={action} />
      <DailyGoal />
      <StreakLine />
    </section>
  );
}

/** Główny przycisk i ciche linki obok niego. Ostatni krok kolejki (wszystko zrobione) ma cichy przycisk zamiast złotego. */
function TodayActions({ action }: { action: ReturnType<typeof pickTodayAction> }) {
  const mistakes = useMistakesCount();
  const mistakesCount = typeof mistakes.data?.count === "number" ? mistakes.data.count : 0;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
      {action.kind === "due-tests" && (
        <Link to={ROUTES.testDue} className={START_BUTTON}>
          <Play size={16} aria-hidden="true" />
          Zacznij powtórkę pytań
        </Link>
      )}
      {action.kind === "due-flashcards" && (
        <Link to={ROUTES.studyAll} className={START_BUTTON}>
          <Play size={16} aria-hidden="true" />
          Zacznij powtórkę fiszek
        </Link>
      )}
      {action.kind === "new-questions" && (
        <Link to={ROUTES.testAll} className={START_BUTTON}>
          <Play size={16} aria-hidden="true" />
          Ucz się nowych pytań
        </Link>
      )}
      {action.kind === "all-done" && (
        <Link to={ROUTES.customTest} className={QUIET_BUTTON}>
          Ułóż własny test
        </Link>
      )}

      {action.kind === "due-tests" && action.flashcards > 0 && (
        <Link to={ROUTES.studyAll} className={TEXT_LINK}>
          Fiszki do powtórki: {action.flashcards}
        </Link>
      )}
      {mistakesCount > 0 && (
        <Link to={ROUTES.testMistakes} className={TEXT_LINK}>
          Popraw moje błędy: {mistakesCount}
        </Link>
      )}
    </div>
  );
}

/**
 * Termin egzaminu i wybrana aplikacja. Bez wyboru (nowy użytkownik widzi wtedy okno startowe) i dla Studenta, który nie ma
 * terminu, nic nie pokazujemy.
 */
function ExamLine() {
  const { data } = useLearningSettings();
  if (!data?.track || data.track.kind !== "EXAM") return null;

  const application = data.track.shortName;
  const frame = (children: React.ReactNode) => (
    <div className="flex flex-col">
      <Link to={ROUTES.account} className={cn(TEXT_LINK, "w-fit gap-2")}>
        <CalendarClock aria-hidden size={16} className="shrink-0 text-accent-ink" />
        <span>{children}</span>
      </Link>
      {data.plan && data.plan.planningDays === 0 && (
        <p className="text-sm text-fg-muted">Ostatnie dwa tygodnie: skup się na powtórkach.</p>
      )}
    </div>
  );

  if (!data.examDate) {
    return frame(
      <>
        <span className="font-medium text-fg">{application}:</span> termin nieogłoszony
      </>
    );
  }
  if (data.examPassed || data.daysToExam == null) {
    return frame(
      <>
        <span className="font-medium text-fg">{application}:</span> egzamin z {formatDatePl(data.examDate)} już się odbył
      </>
    );
  }

  const days = data.daysToExam;
  const when =
    days === 0
      ? "egzamin jest dzisiaj"
      : days === 1
        ? "egzamin jutro"
        : `do egzaminu ${days} ${pluralizePl(days, { one: "dzień", few: "dni", many: "dni" })}`;

  return frame(
    <>
      <span className="font-medium text-fg">{application}:</span> {when} ({formatDatePl(data.examDate)})
      {data.retentionBoosted ? ", tryb egzaminacyjny włączony" : ""}
    </>
  );
}

/**
 * Cel dnia: ile nowych pytań zaczęto dzisiaj z tylu, ile trzeba, żeby zdążyć przed ostatnimi dwoma tygodniami (ale nie
 * więcej niż rozsądne maksimum dzienne). Cel liczy serwer od stanu z początku dnia, więc nie maleje w miarę nauki.
 * Gdy własny limit jest za niski, prowadzimy do Ustawień; gdy nawet maksimum nie wystarcza, mówimy to wprost.
 */
function DailyGoal() {
  const { data } = useLearningSettings();
  const goal = data?.plan?.suggestedTestQuestionsPerDay;
  if (!data?.plan || data.plan.planningDays <= 0 || typeof goal !== "number" || !Number.isFinite(goal) || goal <= 0) return null;

  // Starszy serwer mógłby nie podać liczby zaczętych dziś: wtedy liczymy 0, zamiast pokazać NaN.
  const done = Number.isFinite(data.plan.newTestQuestionsToday) ? data.plan.newTestQuestionsToday : 0;
  const reached = done >= goal;
  const issue = limitIssue(data);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm text-fg-muted">
        Nowe pytania dziś:{" "}
        <span className="font-semibold tabular-nums text-fg">
          {done} z {goal}
        </span>
        {reached && <span className="text-success">, cel na dziś zrobiony</span>}
      </p>
      <div
        role="progressbar"
        aria-label="Nowe pytania dziś"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.min(done, goal)}
        className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-2"
      >
        <div
          className={cn("h-full rounded-full", reached ? "bg-success" : "bg-accent")}
          style={{ width: `${Math.min(100, Math.round((done / goal) * 100))}%` }}
        />
      </div>
      {issue && <LimitNotice issue={issue} />}
    </div>
  );
}

/** Cicha seria nauki: bez nagród i kar. Brak serii mówi tylko „Zacznij serię dziś". */
function StreakLine() {
  const { data, isError } = useActivity(28);
  if (isError || !Array.isArray(data)) return null;

  const streak = getStreak(data);
  const week = getThisWeekTotal(data);
  const answers = (n: number) => pluralizePl(n, { one: "odpowiedź", few: "odpowiedzi", many: "odpowiedzi" });

  return (
    <p className="border-t border-line pt-3 text-sm text-fg-muted" data-testid="streak-line">
      {streak === 0 ? (
        "Zacznij serię dziś"
      ) : (
        <>
          Seria: <span className="font-medium text-fg">{streak} {pluralizePl(streak, { one: "dzień", few: "dni", many: "dni" })}</span>
        </>
      )}
      <span className="ml-4">
        W tym tygodniu: <span className="font-medium text-fg">{week} {answers(week)}</span>
      </span>
    </p>
  );
}
