import { useId, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLearningSettings, type LearningSettings, type LearningSettingsUpdate } from "../../api/settings";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Field } from "../../components/ui/Field";
import { Skeleton } from "../../components/ui/Skeleton";
import { serverMessage } from "../../lib/errors";
import { pluralizePl } from "../../lib/plural";
import { toLocalDateKey, startOfToday, formatDatePl } from "../../lib/date";
import { invalidateReviewData } from "../review/hooks";
import { LEARNING_SETTINGS_KEY, useLearningSettings } from "./hooks";

const RETENTION_CHOICES = [
  { value: 0.8, label: "80%: mniej powtórek, więcej zapominania" },
  { value: 0.85, label: "85%" },
  { value: 0.9, label: "90%: zalecane" },
  { value: 0.95, label: "95%: więcej powtórek, pewniejsza pamięć" },
  { value: 0.97, label: "97%: najwięcej powtórek" },
];

const LIMITS = {
  newCardsPerDay: { min: 0, max: 200, label: "Nowe fiszki", errorName: "Nowe fiszki dziennie" },
  newTestQuestionsPerDay: { min: 0, max: 500, label: "Nowe pytania testowe", errorName: "Nowe pytania testowe dziennie" },
  maxReviewsPerDay: { min: 10, max: 1000, label: "Najwięcej powtórek", errorName: "Najwięcej powtórek dziennie" },
} as const;

interface FormState {
  newCardsPerDay: string;
  newTestQuestionsPerDay: string;
  maxReviewsPerDay: string;
  retention: string;
  examDate: string;
  shuffleOptions: boolean;
}

function toForm(s: LearningSettings): FormState {
  return {
    newCardsPerDay: String(s.newCardsPerDay),
    newTestQuestionsPerDay: String(s.newTestQuestionsPerDay),
    maxReviewsPerDay: String(s.maxReviewsPerDay),
    retention: String(s.desiredRetention),
    examDate: s.examDate ?? "",
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

/** Składa dane do wysłania albo zwraca komunikat o błędzie. Wartości równe domyślnym wysyłamy jako null („domyślne"). */
function buildUpdate(form: FormState, defaults: LearningSettings["defaults"]): LearningSettingsUpdate | string {
  const cards = parseLimit(form.newCardsPerDay, "newCardsPerDay");
  if (typeof cards === "string") return cards;
  const tests = parseLimit(form.newTestQuestionsPerDay, "newTestQuestionsPerDay");
  if (typeof tests === "string") return tests;
  const reviews = parseLimit(form.maxReviewsPerDay, "maxReviewsPerDay");
  if (typeof reviews === "string") return reviews;
  const retention = Number(form.retention);
  if (!Number.isFinite(retention) || retention < 0.7 || retention > 0.97) {
    return "Docelowa retencja musi mieścić się między 70% a 97%.";
  }

  return {
    newCardsPerDay: cards === defaults.newCardsPerDay ? null : cards,
    newTestQuestionsPerDay: tests === defaults.newTestQuestionsPerDay ? null : tests,
    maxReviewsPerDay: reviews === defaults.maxReviewsPerDay ? null : reviews,
    desiredRetention: retention === defaults.desiredRetention ? null : retention,
    examDate: form.examDate === "" ? null : form.examDate,
    shuffleOptions: form.shuffleOptions,
  };
}

/** Ustawienia nauki w Koncie: limity dzienne, docelowa retencja, data egzaminu i mieszanie odpowiedzi. */
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
  const examId = useId();
  const today = useMemo(() => toLocalDateKey(startOfToday()), []);

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
      newTestQuestionsPerDay: String(settings.defaults.newTestQuestionsPerDay),
      maxReviewsPerDay: String(settings.defaults.maxReviewsPerDay),
      retention: String(settings.defaults.desiredRetention),
      shuffleOptions: true,
    }));
    setSaved(false);
    setError(null);
  }

  const { plan } = settings;
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
        Ile nowego materiału i powtórek chcesz dziennie oraz do kiedy się uczysz. Zmiany działają od następnej sesji.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex max-w-xl flex-col gap-5">
        <fieldset className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
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
            label={LIMITS.newTestQuestionsPerDay.label}
            type="number"
            inputMode="numeric"
            min={LIMITS.newTestQuestionsPerDay.min}
            max={LIMITS.newTestQuestionsPerDay.max}
            value={form.newTestQuestionsPerDay}
            onChange={(e) => change("newTestQuestionsPerDay", e.target.value)}
            hint={`Domyślnie ${settings.defaults.newTestQuestionsPerDay}`}
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

        <div className="flex flex-col gap-1">
          <label htmlFor={examId} className="text-sm text-fg-muted">
            Data egzaminu (opcjonalnie)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={examId}
              type="date"
              min={today}
              value={form.examDate}
              onChange={(e) => change("examDate", e.target.value)}
              aria-describedby={`${examId}-hint`}
              className="min-h-11 rounded-xl border border-field bg-surface-2 px-3"
            />
            {form.examDate !== "" && (
              <Button type="button" variant="ghost" onClick={() => change("examDate", "")}>
                Usuń datę
              </Button>
            )}
          </div>
          <p id={`${examId}-hint`} className="text-xs text-fg-muted">
            Na 30 dni przed egzaminem włącza się tryb egzaminacyjny: docelowa retencja co najmniej 95%, a każda karta
            wraca najpóźniej dzień przed egzaminem.
          </p>
        </div>

        <ExamInfo settings={settings} />

        {plan && (
          <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm">
            <p className="font-medium text-fg">Plan do egzaminu</p>
            <p className="mt-1 text-fg-muted">
              Zostało {plan.newTestQuestionsLeft}{" "}
              {pluralizePl(plan.newTestQuestionsLeft, { one: "nowe pytanie testowe", few: "nowe pytania testowe", many: "nowych pytań testowych" })}{" "}
              i {plan.newFlashcardsLeft}{" "}
              {pluralizePl(plan.newFlashcardsLeft, { one: "nowa fiszka", few: "nowe fiszki", many: "nowych fiszek" })}. Ostatnie 7 dni
              zostawiamy na same powtórki, więc na zaczęcie wszystkiego masz {plan.planningDays}{" "}
              {pluralizePl(plan.planningDays, { one: "dzień", few: "dni", many: "dni" })}: ok.{" "}
              <span className="font-medium text-fg">{plan.suggestedTestQuestionsPerDay}</span> pytań testowych i{" "}
              <span className="font-medium text-fg">{plan.suggestedFlashcardsPerDay}</span> fiszek dziennie.
            </p>
            {(plan.suggestedTestQuestionsPerDay > 0 || plan.suggestedFlashcardsPerDay > 0) && (
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    newTestQuestionsPerDay: String(Math.min(LIMITS.newTestQuestionsPerDay.max, plan.suggestedTestQuestionsPerDay)),
                    newCardsPerDay: String(Math.min(LIMITS.newCardsPerDay.max, plan.suggestedFlashcardsPerDay)),
                  }));
                  setSaved(false);
                  setError(null);
                }}
              >
                Wstaw sugerowane limity
              </Button>
            )}
          </div>
        )}

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.shuffleOptions}
            onChange={(e) => change("shuffleOptions", e.target.checked)}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-accent"
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

/** Jednozdaniowy opis stanu egzaminu (ile dni, czy działa tryb egzaminacyjny, czy data już minęła). */
function ExamInfo({ settings }: { settings: LearningSettings }) {
  if (!settings.examDate) return null;

  if (settings.examPassed) {
    return (
      <p role="status" className="text-sm text-warning">
        Zapisana data egzaminu ({formatDatePl(settings.examDate)}) już minęła, więc tryb egzaminacyjny nie działa. Ustaw nową
        datę albo ją usuń.
      </p>
    );
  }

  const days = settings.daysToExam ?? 0;
  return (
    <p role="status" className="text-sm text-fg-muted">
      Do egzaminu ({formatDatePl(settings.examDate)}):{" "}
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
