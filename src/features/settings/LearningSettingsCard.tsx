import { useId, useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLearningSettings, type LearningSettings, type LearningSettingsUpdate } from "../../api/settings";
import type { Track } from "../../api/tracks";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Field } from "../../components/ui/Field";
import { Skeleton } from "../../components/ui/Skeleton";
import { serverMessage } from "../../lib/errors";
import { pluralizePl } from "../../lib/plural";
import { formatDatePl } from "../../lib/date";
import { invalidateReviewData } from "../review/hooks";
import { LEARNING_SETTINGS_KEY, useExamTerms, useLearningSettings, useTracks } from "./hooks";
import { LimitNotice } from "./LimitNotice";
import { limitIssue, maxPerDay } from "./newQuestionsLimit";
import { TrackChangeDialog } from "./TrackChangeDialog";
import { useChooseTrack } from "./trackChoice";

const RETENTION_CHOICES = [
  { value: 0.8, label: "80%: mniej powtórek, więcej zapominania" },
  { value: 0.85, label: "85%" },
  { value: 0.9, label: "90%: zalecane" },
  { value: 0.95, label: "95%: więcej powtórek, pewniejsza pamięć" },
  { value: 0.97, label: "97%: najwięcej powtórek" },
];

const LIMITS = {
  newFlashcardsPerDay: { min: 0, max: 200, label: "Najwięcej nowych fiszek dziennie", errorName: "Najwięcej nowych fiszek dziennie" },
  newTestQuestionsPerDay: { min: 0, max: 500, label: "Najwięcej nowych pytań dziennie", errorName: "Najwięcej nowych pytań dziennie" },
  maxReviewsPerDay: { min: 10, max: 1000, label: "Najwięcej powtórek dziennie", errorName: "Najwięcej powtórek dziennie" },
} as const;

/** `auto`: limit nowych pytań idzie za planem do egzaminu (w żądaniu `null`); `manual`: wartość z pola. */
type NewQuestionsMode = "auto" | "manual";

interface FormState {
  newFlashcardsPerDay: string;
  newTestQuestionsMode: NewQuestionsMode;
  newTestQuestionsPerDay: string;
  maxReviewsPerDay: string;
  retention: string;
}

function toForm(s: LearningSettings): FormState {
  return {
    newFlashcardsPerDay: String(s.newFlashcardsPerDay),
    newTestQuestionsMode: s.newTestQuestionsAuto === false ? "manual" : "auto",
    // Po przełączeniu na własny limit pole zaczyna od tego, co obowiązuje teraz.
    newTestQuestionsPerDay: String(s.newTestQuestionsPerDay),
    maxReviewsPerDay: String(s.maxReviewsPerDay),
    retention: String(s.desiredRetention),
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
  const cards = parseLimit(form.newFlashcardsPerDay, "newFlashcardsPerDay");
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
    newFlashcardsPerDay: cards === defaults.newFlashcardsPerDay ? null : cards,
    newTestQuestionsPerDay: tests,
    maxReviewsPerDay: reviews === defaults.maxReviewsPerDay ? null : reviews,
    desiredRetention: retention === defaults.desiredRetention ? null : retention,
  };
}

/** Ustawienia nauki w Koncie: ścieżka (aplikacja albo Student), limity dzienne i docelowa retencja. */
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
      newFlashcardsPerDay: String(settings.defaults.newFlashcardsPerDay),
      newTestQuestionsMode: "auto",
      newTestQuestionsPerDay: String(settings.defaults.newTestQuestionsPerDay),
      maxReviewsPerDay: String(settings.defaults.maxReviewsPerDay),
      retention: String(settings.defaults.desiredRetention),
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
        Do czego się uczysz oraz ile nowych pytań, fiszek i powtórek chcesz dziennie. Zmiany działają od następnej
        sesji.
      </p>

      <TrackChoiceSettings settings={settings} />

      <form onSubmit={handleSubmit} noValidate className="flex max-w-xl flex-col gap-5">
        <fieldset className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-medium text-fg">Limity dzienne</legend>
          <Field
            label={LIMITS.newFlashcardsPerDay.label}
            type="number"
            inputMode="numeric"
            min={LIMITS.newFlashcardsPerDay.min}
            max={LIMITS.newFlashcardsPerDay.max}
            value={form.newFlashcardsPerDay}
            onChange={(e) => change("newFlashcardsPerDay", e.target.value)}
            hint={`Domyślnie ${settings.defaults.newFlashcardsPerDay}`}
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
            Szansa, że przypomnisz sobie pytanie w dniu powtórki. Wyższa wartość to krótsze odstępy, czyli więcej powtórek.
          </p>
        </div>

        {plan && (
          <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm" data-testid="exam-plan">
            <p className="font-medium text-fg">Plan do egzaminu</p>
            {plan.planningDays > 0 ? (
              <p className="mt-1 text-fg-muted">
                Zostało {plan.newTestQuestionsLeft}{" "}
                {pluralizePl(plan.newTestQuestionsLeft, { one: "nowe pytanie testowe", few: "nowe pytania testowe", many: "nowych pytań testowych" })}.
                Ostatnie 14 dni zostawiamy na same powtórki, więc na zaczęcie wszystkiego masz {plan.planningDays}{" "}
                {pluralizePl(plan.planningDays, { one: "dzień", few: "dni", many: "dni" })}. Cel na dziś:{" "}
                <span className="font-medium text-fg">{plan.suggestedTestQuestionsPerDay}</span> nowych pytań testowych (zrobione:{" "}
                {Number.isFinite(plan.newTestQuestionsToday) ? plan.newTestQuestionsToday : 0}).
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
 * „Moja ścieżka": aplikacja, do której użytkownik się przygotowuje, albo Student. Od ścieżki zależy pula pytań (własne
 * arkusze i akty prawne ścieżki), a w aplikacjach także termin egzaminu (ustawia go administrator), odliczanie i plan.
 * Zmiana jest osobną czynnością, bo przy okazji zdejmuje zawężenie puli do aktów;
 * dlatego ma własny przycisk i objaśnienie, a nie zapisuje się razem z limitami.
 */
function TrackChoiceSettings({ settings }: { settings: LearningSettings }) {
  const tracksQuery = useTracks();
  const terms = useExamTerms();
  const choose = useChooseTrack();
  const selectId = useId();
  const current = settings.track?.id ?? null;
  const [picked, setPicked] = useState<number | null>(current);
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const changeButton = useRef<HTMLButtonElement>(null);
  const tracks = tracksQuery.data ?? [];
  const termList = Array.isArray(terms.data) ? terms.data : [];
  const changed = picked !== null && picked !== current;
  const pickedTrack = tracks.find((track) => track.id === picked) ?? null;

  function optionLabel(track: Track): string {
    if (track.kind !== "EXAM") return track.name;
    const term = termList.find((t) => t.track.id === track.id);
    if (terms.isError || !term) return track.name;
    return `${track.name} (${term.examDate ? formatDatePl(term.examDate) : "termin nieogłoszony"})`;
  }

  return (
    <section aria-labelledby={`${selectId}-title`} className="mb-6 flex max-w-xl flex-col gap-3" data-testid="track-choice-settings">
      <h3 id={`${selectId}-title`} className="text-sm font-medium text-fg">
        Moja ścieżka
      </h3>
      <div className="flex flex-col gap-1">
        <label htmlFor={selectId} className="text-sm text-fg-muted">
          Do czego się przygotowuję
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            id={selectId}
            value={picked ?? ""}
            onChange={(e) => {
              setPicked(e.target.value === "" ? null : Number(e.target.value));
              setSaved(false);
              choose.reset();
            }}
            disabled={tracksQuery.isLoading || tracks.length === 0}
            aria-describedby={`${selectId}-hint`}
            className="min-h-11 min-w-0 max-w-full flex-1 rounded-xl border border-field bg-surface-2 px-3 sm:min-w-72"
          >
            {current === null && <option value="">Nie wybrano</option>}
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {optionLabel(track)}
              </option>
            ))}
          </select>
          <Button
            ref={changeButton}
            type="button"
            variant="secondary"
            disabled={!changed || choose.isPending}
            onClick={() => {
              if (picked === null) return;
              // Pierwszy wybór nie ma czego zachowywać ani zerować, więc zapisuje się od razu. Zmiana idzie przez okno.
              if (current === null) choose.mutate(picked, { onSuccess: () => setSaved(true) });
              else setConfirming(true);
            }}
          >
            {choose.isPending ? "Zapisuję..." : current === null ? "Wybierz ścieżkę" : "Zmień ścieżkę"}
          </Button>
        </div>
        <p id={`${selectId}-hint`} className="text-xs text-fg-muted">
          Termin egzaminu ustawia administrator, więc tu go nie wpisujesz. Zmiana ścieżki zmienia pulę pytań, ale Twoje postępy
          zostają (chyba że sam zaznaczysz „Zacznij od zera”). Wybrane przedmioty Studenta też zostają, więc powrót na tę ścieżkę
          nie wymaga ponownego wyboru.
        </p>
      </div>
      {tracksQuery.isError && (
        <p role="alert" className="text-sm text-danger">
          Nie udało się pobrać listy ścieżek.{" "}
          <button type="button" onClick={() => void tracksQuery.refetch()} className="underline underline-offset-2">
            Spróbuj ponownie
          </button>
        </p>
      )}
      {choose.isError && (
        <p role="alert" className="text-sm text-danger">
          {serverMessage(choose.error, "Nie udało się zapisać wyboru. Spróbuj ponownie.")}
        </p>
      )}
      {saved && !choose.isPending && (
        <p role="status" className="text-sm text-success">
          Zapisano wybór ścieżki.
        </p>
      )}
      <ExamInfo settings={settings} />
      {confirming && pickedTrack && (
        <TrackChangeDialog
          from={settings.track}
          to={pickedTrack}
          returnFocusTo={changeButton}
          onClose={() => setConfirming(false)}
          onDone={() => {
            setConfirming(false);
            setSaved(true);
          }}
        />
      )}
    </section>
  );
}

/** Jednozdaniowy opis stanu egzaminu: ile dni, czy działa tryb egzaminacyjny, czy termin jest ogłoszony albo już minął. */
function ExamInfo({ settings }: { settings: LearningSettings }) {
  const { track } = settings;
  if (!track) {
    return <p className="text-sm text-fg-muted">Bez wybranej ścieżki nie pokażemy odliczania ani dziennego planu.</p>;
  }
  if (track.kind === "STUDENT") {
    return (
      <p className="text-sm text-fg-muted">
        Jako Student nie masz odliczania ani dziennego planu. Gdy wybierzesz aplikację, pokażemy termin i plan.
      </p>
    );
  }
  const application = track.shortName;

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
        termin albo wybierz inną ścieżkę.
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
