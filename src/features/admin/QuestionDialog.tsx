import { useState, type FormEvent } from "react";
import {
  createAdminQuestion,
  updateAdminQuestion,
  type AdminActOption,
  type AdminQuestion,
  type AdminSource,
  type QuestionInput,
} from "../../api/admin";
import { Dialog } from "../../components/ui/Dialog";
import { ErrorState } from "../../components/ui/ErrorState";
import { Field } from "../../components/ui/Field";
import { Skeleton } from "../../components/ui/Skeleton";
import { serverMessage } from "../../lib/errors";
import { useAdminActOptions, useAdminMutation, useAdminQuestion, useAdminSections, useAdminSources } from "./adminQueries";
import { FormActions, FormError, SelectField, TextAreaField } from "./adminUi";
import { emptyValue, fromQuestion, toInput, validate, type QuestionDefaults, type QuestionFormValue } from "./questionForm";

export type QuestionDialogProps = (
  | { mode: "create"; defaults: QuestionDefaults }
  | { mode: "edit"; questionId: number }
) & {
  onSaved: (question: AdminQuestion, mode: "create" | "edit") => void;
  onClose: () => void;
};

/**
 * Dodawanie i edycja pytania. Okno samo pobiera listy aktów i źródeł oraz (przy edycji) aktualną treść pytania, a po
 * zapisie woła {@code onSaved}. Błędy z serwera (np. powtórzone pytanie w źródle, rozdział z innego aktu) pokazuje przy formularzu.
 */
export function QuestionDialog(props: QuestionDialogProps) {
  const editingId = props.mode === "edit" ? props.questionId : null;
  const acts = useAdminActOptions();
  const sources = useAdminSources();
  const question = useAdminQuestion(editingId);

  const title = props.mode === "edit" ? `Edytuj pytanie nr ${props.questionId}` : "Dodaj pytanie";
  const loading = acts.isLoading || sources.isLoading || (editingId !== null && question.isLoading);
  const failed = acts.isError || sources.isError || (editingId !== null && question.isError);

  if (loading || failed || !acts.data || !sources.data || (editingId !== null && !question.data)) {
    return (
      <Dialog title={title} onClose={props.onClose}>
        {failed ? (
          <ErrorState
            message="Nie udało się wczytać danych do formularza."
            onRetry={() => {
              void acts.refetch();
              void sources.refetch();
              if (editingId !== null) void question.refetch();
            }}
          />
        ) : (
          <Skeleton className="h-64 w-full" />
        )}
      </Dialog>
    );
  }

  const initial: QuestionFormValue =
    props.mode === "edit" && question.data ? fromQuestion(question.data) : emptyValue(props.mode === "create" ? props.defaults : {}, sources.data);

  return (
    <QuestionForm
      key={editingId ?? "new"}
      title={title}
      editingId={editingId}
      initial={initial}
      acts={acts.data}
      sources={sources.data}
      onSaved={props.onSaved}
      onClose={props.onClose}
    />
  );
}

interface QuestionFormProps {
  title: string;
  editingId: number | null;
  initial: QuestionFormValue;
  acts: AdminActOption[];
  sources: AdminSource[];
  onSaved: QuestionDialogProps["onSaved"];
  onClose: () => void;
}

function QuestionForm({ title, editingId, initial, acts, sources, onSaved, onClose }: QuestionFormProps) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const sections = useAdminSections(value.actId ? Number(value.actId) : Number.NaN);

  const save = useAdminMutation(
    (input: QuestionInput) => (editingId === null ? createAdminQuestion(input) : updateAdminQuestion(editingId, input)),
    (saved) => onSaved(saved, editingId === null ? "create" : "edit")
  );

  const set = <K extends keyof QuestionFormValue>(key: K, next: QuestionFormValue[K]) => setValue((prev) => ({ ...prev, [key]: next }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const problem = validate(value);
    if (problem) return setError(problem);
    setError(null);
    save.mutate(toInput(value), { onError: (err) => setError(serverMessage(err, "Nie udało się zapisać pytania.")) });
  }

  const fields = new Map<string, AdminActOption[]>();
  for (const act of acts) {
    const list = fields.get(act.fieldName) ?? [];
    list.push(act);
    fields.set(act.fieldName, list);
  }

  return (
    <Dialog title={title} onClose={onClose} closeOnBackdrop={false}>
      <form onSubmit={submit} className="flex flex-col gap-4" data-testid="question-form">
        <SelectField
          label="Akt prawny"
          value={value.actId}
          onChange={(e) => setValue((prev) => ({ ...prev, actId: e.target.value, sectionId: "" }))}
          data-testid="q-act"
        >
          <option value="">Wybierz akt prawny</option>
          {[...fields.entries()].map(([fieldName, list]) => (
            <optgroup key={fieldName} label={fieldName}>
              {list.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.name}
                  {act.hidden ? " (ukryty)" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectField>
        <SelectField
          label="Rozdział"
          value={value.sectionId}
          onChange={(e) => set("sectionId", e.target.value)}
          disabled={!value.actId}
          data-testid="q-section"
        >
          <option value="">Bez rozdziału</option>
          {(sections.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Źródło pytania" value={value.sourceId} onChange={(e) => set("sourceId", e.target.value)} data-testid="q-source">
          <option value="">Wybierz źródło</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.hidden ? " (ukryty)" : ""}
            </option>
          ))}
        </SelectField>
        <TextAreaField label="Treść pytania" value={value.body} onChange={(e) => set("body", e.target.value)} rows={4} data-testid="q-body" />
        <TextAreaField label="Odpowiedź A" value={value.optionA} onChange={(e) => set("optionA", e.target.value)} rows={2} data-testid="q-option-A" />
        <TextAreaField label="Odpowiedź B" value={value.optionB} onChange={(e) => set("optionB", e.target.value)} rows={2} data-testid="q-option-B" />
        <TextAreaField label="Odpowiedź C" value={value.optionC} onChange={(e) => set("optionC", e.target.value)} rows={2} data-testid="q-option-C" />
        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm text-fg-muted">Poprawna odpowiedź</legend>
          <div className="flex gap-2">
            {(["A", "B", "C"] as const).map((letter) => (
              <label
                key={letter}
                className="inline-flex min-h-11 min-w-16 cursor-pointer items-center justify-center gap-2 rounded-xl border border-field bg-surface-2 px-4 has-checked:border-accent has-checked:bg-accent/10 has-checked:font-semibold"
              >
                <input
                  type="radio"
                  name="correct-option"
                  value={letter}
                  checked={value.correctOption === letter}
                  onChange={() => set("correctOption", letter)}
                  data-testid={`q-correct-${letter}`}
                />
                {letter}
              </label>
            ))}
          </div>
        </fieldset>
        <TextAreaField
          label="Wyjaśnienie"
          hint="Pokazywane po odpowiedzi i na tyle fiszki. Można zostawić puste."
          value={value.explanation}
          onChange={(e) => set("explanation", e.target.value)}
          rows={3}
        />
        <Field
          label="Podstawa prawna"
          hint="Np. „art. 187 KC”. Najwyżej 500 znaków."
          value={value.legalBasis}
          onChange={(e) => set("legalBasis", e.target.value)}
          maxLength={500}
          data-testid="q-basis"
        />
        <Field
          label="Stan prawny na dzień"
          hint="Data, według której sprawdzono pytanie. Można zostawić puste."
          type="date"
          value={value.validAsOf}
          onChange={(e) => set("validAsOf", e.target.value)}
        />
        <Field
          label="Zmiana w prawie od dnia"
          hint="Gdy przepis się zmienił: pytanie wróci do nauki w tym dniu, a przez rok trafia do testu „Zmiany w prawie”."
          type="date"
          value={value.lawChangedAt}
          onChange={(e) => set("lawChangedAt", e.target.value)}
          data-testid="q-law-date"
        />
        <Field
          label="Opis zmiany w prawie"
          hint="Krótka wskazówka przy pytaniu, np. „nowelizacja art. 415 KC”. Wymaga daty zmiany."
          value={value.lawChangeNote}
          onChange={(e) => set("lawChangeNote", e.target.value)}
          maxLength={500}
          data-testid="q-law-note"
        />
        {editingId !== null && (
          <p className="text-xs text-fg-muted">
            Po zmianie treści oznaczenia pytania zostają, jakie były. Uruchom automat w zakładce Oznaczenia, żeby ocenił nową treść.
          </p>
        )}
        <FormError message={error} />
        <FormActions pending={save.isPending} submitLabel={editingId === null ? "Dodaj pytanie" : "Zapisz zmiany"} onCancel={onClose} />
      </form>
    </Dialog>
  );
}
