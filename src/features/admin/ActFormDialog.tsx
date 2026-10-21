import { useState, type FormEvent } from "react";
import type { ActInput, ActKind, AdminField } from "../../api/admin";
import { Dialog } from "../../components/ui/Dialog";
import { Field } from "../../components/ui/Field";
import { FormActions, FormError, SelectField } from "./adminUi";

export interface ActFormValue {
  fieldId: string;
  name: string;
  shortName: string;
  kind: ActKind;
  sortOrder: string;
}

interface ActFormDialogProps {
  title: string;
  fields: AdminField[];
  initial: ActFormValue;
  pending: boolean;
  error: string | null;
  onSubmit: (input: ActInput) => void;
  onClose: () => void;
}

/** Dodawanie i edycja aktu prawnego albo tematu: dziedzina, nazwa, krótka nazwa, rodzaj i miejsce na liście. */
export function ActFormDialog({ title, fields, initial, pending, error, onSubmit, onClose }: ActFormDialogProps) {
  const [value, setValue] = useState(initial);
  const [localError, setLocalError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!value.fieldId) return setLocalError("Wybierz dziedzinę.");
    if (!value.name.trim()) return setLocalError("Podaj nazwę aktu.");
    setLocalError(null);
    onSubmit({
      fieldId: Number(value.fieldId),
      name: value.name.trim(),
      shortName: value.shortName.trim() || undefined,
      kind: value.kind,
      sortOrder: value.sortOrder.trim() === "" ? undefined : Number(value.sortOrder),
    });
  }

  const set = <K extends keyof ActFormValue>(key: K, next: ActFormValue[K]) => setValue((prev) => ({ ...prev, [key]: next }));

  return (
    <Dialog title={title} onClose={onClose} closeOnBackdrop={false}>
      <form onSubmit={submit} className="flex flex-col gap-4" data-testid="act-form">
        <SelectField label="Dziedzina" value={value.fieldId} onChange={(e) => set("fieldId", e.target.value)} data-testid="act-form-field">
          <option value="">Wybierz dziedzinę</option>
          {fields.map((field) => (
            <option key={field.id} value={field.id}>
              {field.name}
            </option>
          ))}
        </SelectField>
        <Field label="Nazwa" value={value.name} onChange={(e) => set("name", e.target.value)} maxLength={300} autoFocus />
        <Field
          label="Krótka nazwa"
          hint="Np. „KPC” albo „KK”. Puste pole zostawia nazwę pełną."
          value={value.shortName}
          onChange={(e) => set("shortName", e.target.value)}
          maxLength={80}
        />
        <SelectField label="Rodzaj" value={value.kind} onChange={(e) => set("kind", e.target.value as ActKind)}>
          <option value="ACT">Akt prawny</option>
          <option value="TOPIC">Temat (np. orzecznictwo)</option>
        </SelectField>
        <Field
          label="Miejsce na liście"
          hint="Liczba: mniejsza oznacza wyżej. Puste pole dopisuje akt na koniec dziedziny."
          type="number"
          inputMode="numeric"
          value={value.sortOrder}
          onChange={(e) => set("sortOrder", e.target.value)}
        />
        <FormError message={localError ?? error} />
        <FormActions pending={pending} submitLabel="Zapisz" onCancel={onClose} />
      </form>
    </Dialog>
  );
}
