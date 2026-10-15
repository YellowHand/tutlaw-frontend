import { useId, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLearningSettings, type ExamChoice, type LearningSettings, type LearningSettingsUpdate } from "../../api/settings";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Field } from "../../components/ui/Field";
import { Skeleton } from "../../components/ui/Skeleton";
import { serverMessage } from "../../lib/errors";
import { pluralizePl } from "../../lib/plural";
import { formatDatePl } from "../../lib/date";
import { EXAM_APPLICATIONS, ORIGIN_LABELS, type QuestionOrigin } from "../../lib/origin";
import { invalidateReviewData } from "../review/hooks";
import { useChooseExam } from "./examChoice";
import { LEARNING_SETTINGS_KEY, useExamTerms, useLearningSettings } from "./hooks";
import { LimitNotice } from "./LimitNotice";
import { limitIssue, maxPerDay } from "./newQuestionsLimit";

const RETENTION_CHOICES = [
  { value: 0.8, label: "80%: mniej powtórek, więcej zapominania" },
  { value: 0.85, label: "85%" },
  { value: 0.9, label: "90%: zalecane" },
  { value: 0.95, label: "95%: więcej powtórek, pewniejsza pamięć" },
  { value: 0.97, label: "97%: najwięcej powtórek" },
];

const LIMITS = {
  newCardsPerDay: { min: 0, max: 200, label: "Najwięcej nowych fiszek dziennie", errorName: "Najwięcej nowych fiszek dziennie" },
  newTestQuestionsPerDay: { min: 0, max: 500, label: "Najwięcej nowych pytań dziennie", errorName: "Najwięcej nowych pytań dziennie" },
  maxReviewsPerDay: { min: 10, max: 1000, label: "Najwięcej powtórek dziennie", errorName: "Najwięcej powtórek dziennie" },
} as const;

/** `auto`: limit nowych pytań idzie za planem do egzaminu (w żądaniu `null`); `manual`: wartość z pola. */
type NewQuestionsMode = "auto" | "manual";

interface FormState {
  newCardsPerDay: string;
  newTestQuestionsMode: NewQuestionsMode;
  newTestQuestionsPerDay: string;
  maxReviewsPerDay: string;
  retention: string;
  shuffleOptions: boolean;
}

function toForm(s: LearningSettings): FormState {
  return {
    newCardsPerDay: String(s.newCardsPerDay),
    newTestQuestionsMode: s.newTestQuestionsAuto === false ? "manual" : "auto",
    // Po przełączeniu na własny limit pole zaczyna od tego, co obowiązuje teraz.
    newTestQuestionsPerDay: String(s.newTestQuestionsPerDay),
    maxReviewsPerDay: String(s.maxReviewsPerDay),
    retention: String(s.desiredRetention),
    shuffleOptions: s.shuffleOptions,
  };
}

function parseLimit(raw: string, key: keyof typeof LIMITS): number | string {
  const { min, max, errorName } = LIMITS[key];
  const trimmed = raw.trim();
  const value = Number(trimmed);
  if (trimmed === "" || !Number.isInteger(value) || value < min || value > max) {
    return `${errorName}: wpisz liczbę całkowitą od ${min} do ${max}.`;
  }
  return value;
}

/**
 * Składa dane do wysłania albo zwraca komunikat o błędzie. Wartości równe domyślnym wysyłamy jako null („domyślne"),
 * a limit nowych pytań jako null tylko wtedy, gdy wybrano „Automatycznie": własny limit, także równy domyślnemu, jest własny.
 */
function buildUpdate(form: FormState, defaults: LearningSettings["defaults"]): LearningSettingsUpdate | string {
  const cards = parseLimit(form.newCardsPerDay, "newCardsPerDay");
  if (typeof cards === "string") return cards;
  let tests: number | null = null;
  if (form.newTestQuestionsMode === "manual") {
    const parsed = parseLimit(form.newTestQuestionsPerDay, "newTestQuestionsPerDay");
    if (typeof parsed === "string") return parsed;
    tests = parsed;
  }
  const reviews = parseLimit(form.maxReviewsPerDay, "maxReviewsPerDay");
  if (typeof reviews === "string") return reviews;
  const retention = Number(form.retention);
  if (!Number.isFinite(retention) || retention < 0.7 || retention > 0.97) {
    return "Docelowa retencja musi mieścić się między 70% a 97%.";
  }

  return {
    newCardsPerDay: cards === defaults.newCardsPerDay ? null : cards,
    newTestQuestionsPerDay: tests,
    maxReviewsPerDay: reviews === defaults.maxReviewsPerDay ? null : reviews,
    desiredRetention: retention === defaults.desiredRetention ? null : retention,
    shuffleOptions: form.shuffleOptions,
  };
}

/** Ustawienia nauki w Koncie: egzamin (aplikacja), limity dzienne, docelowa retencja i mieszanie odpowiedzi. */
export function LearningSettingsCard() {
  const { data, isLoading, isError, refetch } = useLearningSettings();

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }
  if (isError || !data) {
    return (
      <Card>
        <ErrorState message="Nie udało się pobrać ustawień nauki." onRetry={() => refetch()} />
      </Card>
    );
  }
  return <LearningSettingsForm settings={data} />;
}

function LearningSettingsForm({ settings }: { settings: LearningSettings }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => toForm(settings));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const retentionId = useId();

  const mutation = useMutation({
    mutationFn: (update: LearningSettingsUpdate) => updateLearningSettings(update),
    onSuccess: (updated) => {
      queryClient.setQueryData(LEARNING_SETTINGS_KEY, updated);
      // Zmiana limitów zmienia liczbę powtórek na dziś.
      invalidateReviewData(queryClient);
      setForm(toForm(updated));
      setSaved(true);
    },
    onError: (err) => setError(serverMessage(err, "Nie udało się zapisać ustawień. Spróbuj ponownie.")),
  });

  function change<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setError(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    const update = buildUpdate(form, settings.defaults);
    if (typeof update === "string") {
      setError(update);
      return;
    }
    setError(null);
    mutation.mutate(update);
  }

  function useDefaults() {
    setForm((prev) => ({
      ...prev,
      newCardsPerDay: String(settings.defaults.newCardsPerDay),
      newTestQuestionsMode: "auto",
      newTestQuestionsPerDay: String(settings.defaults.newTestQuestionsPerDay),
      maxReviewsPerDay: String(settings.defaults.maxReviewsPerDay),
      retention: String(settings.defaults.desiredRetention),
      shuffleOptions: true,
    }));
    setSaved(false);
    setError(null);
  }

  const { plan } = settings;
  const issue = limitIssue(settings);
  const retentionOptions = RETENTION_CHOICES.some((c) => String(c.value) === form.retention)
    ? RETENTION_CHOICES
    : [...RETENTION_CHOICES, { value: Number(form.retention), label: `${Math.round(Number(form.retention) * 100)}%` }].sort(
        (a, b) => a.value - b.value
      );

  return (
    <Card>
      <h2 id="learning-settings" className="mb-1 text-base font-semibold">
        Ustawienia nauki
      </h2>
      <p className="mb-4 text-sm text-fg-muted">
        Do jakiego egzaminu się uczysz oraz ile nowego materiału i powtórek chcesz dziennie. Zmiany działają od następnej
        sesji.
      </p>

      <ExamChoiceSettings settings={settings} />

      <form onSubmit={handleSubmit} noValidate className="flex max-w-xl flex-col gap-5">
        <fieldset className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-medium text-fg">Limity dzienne</legend>
          <Field
            label={LIMITS.newCardsPerDay.label}
            type="number"
            inputMode="numeric"
            min={LIMITS.newCardsPerDay.min}
            max={LIMITS.newCardsPerDay.max}
            value={form.newCardsPerDay}
            onChange={(e) => change("newCardsPerDay", e.target.value)}
            hint={`Domyślnie ${settings.defaults.newCardsPerDay}`}
          />
          <Field
            label={LIMITS.maxReviewsPerDay.label}
            type="number"
            inputMode="numeric"
            min={LIMITS.maxReviewsPerDay.min}
            max={LIMITS.maxReviewsPerDay.max}
            value={form.maxReviewsPerDay}
            onChange={(e) => change("maxReviewsPerDay", e.target.value)}
            hint={`Domyślnie ${settings.defaults.maxReviewsPerDay}, osobno dla fiszek i dla testów. Nadmiar czeka do jutra.`}
          />
        </fieldset>

        <NewQuestionsLimitField
          settings={settings}
          mode={form.newTestQuestionsMode}
          value={form.newTestQuestionsPerDay}
          onModeChange={(mode) => change("newTestQuestionsMode", mode)}
          onValueChange={(value) => change("newTestQuestionsPerDay", value)}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor={retentionId} className="text-sm text-fg-muted">
            Docelowa retencja
          </label>
          <select
            id={retentionId}
            value={form.retention}
            onChange={(e) => change("retention", e.target.value)}
            aria-describedby={`${retentionId}-hint`}
            className="min-h-11 rounded-xl border border-field bg-surface-2 px-3"
          >
            {retentionOptions.map((choice) => (
              <option key={choice.value} value={String(choice.value)}>
                {choice.label}
              </option>
            ))}
          </select>
          <p id={`${retentionId}-hint`} className="text-xs text-fg-muted">
            Szansa, że przypomnisz sobie kartę w dniu powtórki. Wyższa wartość to krótsze odstępy, czyli więcej powtórek.
          </p>
        </div>

        {plan && (
          <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm" data-testid="exam-plan">
            <p className="font-medium text-fg">Plan do egzaminu</p>
            {plan.planningDays > 0 ? (
              <p className="mt-1 text-fg-muted">
                Zostało {plan.newTestQuestionsLeft}{" "}
                {pluralizePl(plan.newTestQuestionsLeft, { one: "nowe pytanie testowe", few: "nowe pytania testowe", many: "nowych pytań testowych" })}{" "}
                i {plan.newFlashcardsLeft}{" "}
                {pluralizePl(plan.newFlashcardsLeft, { one: "nowa fiszka", few: "nowe fiszki", many: "nowych fiszek" })}. Ostatnie 14 dni
                zostawiamy na same powtórki, więc na zaczęcie wszystkiego masz {plan.planningDays}{" "}
                {pluralizePl(plan.planningDays, { one: "dzień", few: "dni", many: "dni" })}. Cel na dziś:{" "}
                <span className="font-medium text-fg">{plan.suggestedTestQuestionsPerDay}</span> nowych pytań testowych (zrobione:{" "}
                {Number.isFinite(plan.newTestQuestionsToday) ? plan.newTestQuestionsToday : 0}) i <span className="font-medium text-fg">{plan.suggestedFlashcardsPerDay}</span> nowych fiszek.
              </p>
            ) : (
              <p className="mt-1 text-fg-muted">
                Do egzaminu zostały mniej niż dwa tygodnie, więc nowych pytań już nie planujemy. Skup się na powtórkach.
              </p>
            )}
            {plan.planningDays > 0 && (
              <p className="mt-2 text-fg-muted" data-testid="plan-limit-line">
                Limit nowych pytań:{" "}
                {settings.newTestQuestionsAuto
                  ? `automatyczny, teraz ${settings.newTestQuestionsPerDay} dziennie.`
                  : `własny, ${settings.newTestQuestionsPerDay} dziennie.`}
              </p>
            )}
            {issue && <LimitNotice issue={issue} withSettingsLink={false} className="mt-2" />}
          </div>
        )}

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.shuffleOptions}
            onChange={(e) => change("shuffleOptions", e.target.checked)}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-accent-ink"
          />
          <span>
            <span className="font-medium text-fg">Mieszaj kolejność odpowiedzi w testach</span>
            <span className="block text-xs text-fg-muted">
              Dzięki temu nie uczysz się pozycji („zawsze B"), tylko treści. Pytania, w których odpowiedzi odwołują się do
              siebie nawzajem (np. „A i B"), zostają w oryginalnej kolejności.
            </span>
          </span>
        </label>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="text-sm text-success">
            Zapisano ustawienia nauki.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Zapisuję..." : "Zapisz ustawienia"}
          </Button>
          <Button type="button" variant="ghost" onClick={useDefaults}>
            Wstaw wartości domyślne
          </Button>
        </div>
      </form>
    </Card>
  );
}

/**
 * „Mój egzamin": aplikacja, do której użytkownik się przygotowuje. Z niej biorą się termin (ustawia go administrator),
 * odliczanie i plan. Zmiana jest osobną czynnością, bo przy okazji ustawia filtr pytań w Testach na wybraną aplikację i
 * pytania autorskie; dlatego ma własny przycisk i ostrzeżenie, a nie zapisuje się razem z limitami.
 */
function ExamChoiceSettings({ settings }: { settings: LearningSettings }) {
  const terms = useExamTerms();
  const choose = useChooseExam();
  const selectId = useId();
  // Student ma wybór zrobiony, ale bez aplikacji: w polu wyboru stoi „Jestem studentem".
  const isStudent = settings.examOrigin === null && settings.startChoiceMade === true;
  const current: ExamChoice | "" = settings.examOrigin ?? (isStudent ? "STUDENT" : "");
  const [picked, setPicked] = useState<ExamChoice | "">(current);
  const [saved, setSaved] = useState(false);
  const termList = Array.isArray(terms.data) ? terms.data : [];
  const termOf = (origin: QuestionOrigin) => termList.find((t) => t.origin === origin);
  const changed = picked !== "" && picked !== current;

  function optionLabel(origin: QuestionOrigin): string {
    const term = termOf(origin);
    if (terms.isError || !term) return ORIGIN_LABELS[origin];
    return `${ORIGIN_LABELS[origin]} (${term.examDate ? formatDatePl(term.examDate) : "termin nieogłoszony"})`;
  }

  return (
    <section aria-labelledby={`${selectId}-title`} className="mb-6 flex max-w-xl flex-col gap-3" data-testid="exam-choice-settings">
      <h3 id={`${selectId}-title`} className="text-sm font-medium text-fg">
        Mój egzamin
      </h3>
      <div className="flex flex-col gap-1">
        <label htmlFor={selectId} className="text-sm text-fg-muted">
          Aplikacja, do której się przygotowuję
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            id={selectId}
            value={picked}
            onChange={(e) => {
              setPicked(e.target.value as ExamChoice | "");
              setSaved(false);
              choose.reset();
            }}
            aria-describedby={`${selectId}-hint`}
            className="min-h-11 min-w-0 max-w-full flex-1 rounded-xl border border-field bg-surface-2 px-3 sm:min-w-72"
          >
            {current === "" && <option value="">Nie wybrano</option>}
            {EXAM_APPLICATIONS.map((origin) => (
              <option key={origin} value={origin}>
                {optionLabel(origin)}
              </option>
            ))}
            <option value="STUDENT">Jestem studentem / jeszcze nie wybrałem</option>
          </select>
          <Button
            type="button"
            variant="secondary"
            disabled={!changed || choose.isPending}
            onClick={() => {
              if (picked === "") return;
              choose.mutate(picked, { onSuccess: () => setSaved(true) });
            }}
          >
            {choose.isPending ? "Zapisuję..." : current === "" ? "Wybierz egzamin" : "Zmień egzamin"}
          </Button>
        </div>
        <p id={`${selectId}-hint`} className="text-xs text-fg-muted">
          Termin egzaminu ustawia administrator, więc tu go nie wpisujesz. Zmiana ustawia też filtr pytań w Testach: wybrana
          aplikacja i pytania autorskie, a przy opcji dla studentów wszystkie pytania (filtr możesz potem zmienić osobno).
        </p>
      </div>
      {choose.isError && (
        <p role="alert" className="text-sm text-danger">
          {serverMessage(choose.error, "Nie udało się zapisać wyboru. Spróbuj ponownie.")}
        </p>
      )}
      {saved && !choose.isPending && (
        <p role="status" className="text-sm text-success">
          Zapisano wybór egzaminu.
        </p>
      )}
      <ExamInfo settings={settings} />
    </section>
  );
}

/** Jednozdaniowy opis stanu egzaminu: ile dni, czy działa tryb egzaminacyjny, czy termin jest ogłoszony albo już minął. */
function ExamInfo({ settings }: { settings: LearningSettings }) {
  if (!settings.examOrigin) {
    return (
      <p className="text-sm text-fg-muted">
        {settings.startChoiceMade
          ? "Jako student nie masz odliczania ani dziennego planu. Gdy wybierzesz aplikację, pokażemy termin i plan."
          : "Bez wybranego egzaminu nie pokażemy odliczania ani dziennego planu."}
      </p>
    );
  }
  const application = ORIGIN_LABELS[settings.examOrigin];

  if (!settings.examDate) {
    return (
      <p role="status" className="text-sm text-fg-muted">
        {application}: termin nieogłoszony. Odliczanie, plan i tryb egzaminacyjny włączą się, gdy administrator ustawi datę.
      </p>
    );
  }

  if (settings.examPassed) {
    return (
      <p role="status" className="text-sm text-warning">
        Egzamin ({application}, {formatDatePl(settings.examDate)}) już się odbył, więc tryb egzaminacyjny nie działa. Poczekaj na nowy
        termin albo wybierz inną aplikację.
      </p>
    );
  }

  const days = settings.daysToExam ?? 0;
  return (
    <p role="status" className="text-sm text-fg-muted">
      Do egzaminu ({application}, {formatDatePl(settings.examDate)}):{" "}
      <span className="font-medium text-fg">
        {days} {pluralizePl(days, { one: "dzień", few: "dni", many: "dni" })}
      </span>
      .{" "}
      {settings.retentionBoosted
        ? `Tryb egzaminacyjny jest włączony: retencja wynosi ${Math.round(settings.effectiveRetention * 100)}%.`
        : "Tryb egzaminacyjny włączy się 30 dni przed egzaminem."}
    </p>
  );
}


interface NewQuestionsLimitFieldProps {
  settings: LearningSettings;
  mode: NewQuestionsMode;
  value: string;
  onModeChange: (mode: NewQuestionsMode) => void;
  onValueChange: (value: string) => void;
}

const MODE_ROW =
  "flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5 transition-colors hover:bg-line has-[:checked]:border-accent-ink has-[:checked]:bg-accent/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-ink";

/**
 * Limit nowych pytań dziennie: „Automatycznie" (zalecane) albo własny. Automatyczny nie wymaga niczego ustawiać: trzyma
 * domyślną wartość, a gdy wybrany egzamin ma termin, idzie za planem (tyle nowych pytań, ile trzeba, żeby zdążyć), do
 * rozsądnego maksimum. Własny limit obowiązuje wprost i może być wyższy.
 */
function NewQuestionsLimitField({ settings, mode, value, onModeChange, onValueChange }: NewQuestionsLimitFieldProps) {
  const name = useId();
  const max = maxPerDay(settings);

  return (
    <fieldset className="flex min-w-0 flex-col gap-2" data-testid="new-questions-limit">
      <legend className="mb-1 text-sm font-medium text-fg">Nowe pytania dziennie</legend>

      <label className={MODE_ROW}>
        <input
          type="radio"
          name={name}
          value="auto"
          checked={mode === "auto"}
          onChange={() => onModeChange("auto")}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-accent-ink"
        />
        <span>
          <span className="block text-sm font-medium text-fg">Automatycznie (zalecane)</span>
          <span className="block text-xs text-fg-muted">
            Co najmniej {settings.defaults.newTestQuestionsPerDay} dziennie. Gdy wybrany egzamin ma termin, limit idzie za planem: tyle
            nowych pytań, ile trzeba, żeby zdążyć, ale nie więcej niż {max}.
            {settings.newTestQuestionsAuto ? ` Teraz: ${settings.newTestQuestionsPerDay} dziennie.` : ""}
          </span>
        </span>
      </label>

      <label className={MODE_ROW}>
        <input
          type="radio"
          name={name}
          value="manual"
          checked={mode === "manual"}
          onChange={() => onModeChange("manual")}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-accent-ink"
        />
        <span>
          <span className="block text-sm font-medium text-fg">Własny limit</span>
          <span className="block text-xs text-fg-muted">Stała liczba nowych pytań dziennie, niezależnie od planu.</span>
        </span>
      </label>

      {mode === "manual" && (
        <Field
          label={LIMITS.newTestQuestionsPerDay.label}
          type="number"
          inputMode="numeric"
          min={LIMITS.newTestQuestionsPerDay.min}
          max={LIMITS.newTestQuestionsPerDay.max}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          hint={`Od ${LIMITS.newTestQuestionsPerDay.min} do ${LIMITS.newTestQuestionsPerDay.max}`}
          className="max-w-40"
        />
      )}
    </fieldset>
  );
}
