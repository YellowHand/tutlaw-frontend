import { useState, type FormEvent } from "react";
import { Dialog } from "../../components/ui/Dialog";
import { Field } from "../../components/ui/Field";
import { FormActions, FormError } from "./adminUi";

export interface NamedFormValue {
  name: string;
  shortName: string;
  sortOrder: string;
}

interface TrackFormDialogProps {
  title: string;
  initial: NamedFormValue;
  pending: boolean;
  error: string | null;
  onSubmit: (value: { name: string; shortName: string; sortOrder?: number }) => void;
  onClose: () => void;
}

/** Dodawanie i edycja aplikacji: nazwa, krótka nazwa (na etykiety) i miejsce na liście. Adres (slug) powstaje raz z nazwy. */
export function TrackFormDialog({ title, initial, pending, error, onSubmit, onClose }: TrackFormDialogProps) {
  const [name, setName] = useState(initial.name);
  const [shortName, setShortName] = useState(initial.shortName);
  const [sortOrder, setSortOrder] = useState(initial.sortOrder);
  const [localError, setLocalError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setLocalError("Podaj nazwę aplikacji.");
    if (!shortName.trim()) return setLocalError("Podaj krótką nazwę aplikacji.");
    setLocalError(null);
    onSubmit({ name: name.trim(), shortName: shortName.trim(), sortOrder: sortOrder.trim() === "" ? undefined : Number(sortOrder) });
  }

  return (
    <Dialog title={title} onClose={onClose} closeOnBackdrop={false}>
      <form onSubmit={submit} className="flex flex-col gap-4" data-testid="track-form">
        <Field label="Nazwa" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoFocus />
        <Field
          label="Krótka nazwa"
          hint="Pokazuje się na etykietach i w wyborze aplikacji, np. „Adwokacka i radcowska”."
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          maxLength={80}
        />
        <Field
          label="Miejsce na liście"
          hint="Liczba: mniejsza oznacza wyżej. Puste pole dopisuje aplikację na koniec."
          type="number"
          inputMode="numeric"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        />
        <FormError message={localError ?? error} />
        <FormActions pending={pending} submitLabel="Zapisz" onCancel={onClose} />
      </form>
    </Dialog>
  );
}
