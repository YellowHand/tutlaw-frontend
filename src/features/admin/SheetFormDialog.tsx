import { useState, type FormEvent } from "react";
import type { AdminTrack } from "../../api/admin";
import { Dialog } from "../../components/ui/Dialog";
import { Field } from "../../components/ui/Field";
import { FormActions, FormError, SelectField } from "./adminUi";

interface SheetFormDialogProps {
  mode: "create" | "edit";
  /** Aplikacje z egzaminem (bez Studenta). */
  tracks: AdminTrack[];
  initial: { trackId: string; examYear: string; name: string };
  /** Krótka nazwa aplikacji arkusza (edycja): z niej i z roku backend wyprowadza domyślną nazwę „Notarialna 2024". */
  trackShortName?: string;
  pending: boolean;
  error: string | null;
  onSubmit: (value: { trackId: number; examYear: number; name: string }) => void;
  onClose: () => void;
}

/**
 * Dodawanie arkusza (aplikacja i rok; nazwa i adres powstają z nich) oraz edycja (rok i nazwa). Aplikacji arkusza nie da się
 * zmienić: pytania wczytane do arkusza należą do jej egzaminu.
 */
export function SheetFormDialog({ mode, tracks, initial, trackShortName, pending, error, onSubmit, onClose }: SheetFormDialogProps) {
  const [trackId, setTrackId] = useState(initial.trackId);
  const [examYear, setExamYear] = useState(initial.examYear);
  const [name, setName] = useState(initial.name);
  const [localError, setLocalError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const year = Number(examYear);
    if (mode === "create" && !trackId) return setLocalError("Wybierz aplikację.");
    if (!Number.isInteger(year) || year < 1990 || year > 2100) return setLocalError("Podaj rok egzaminu, np. 2024.");
    setLocalError(null);
    // Nazwa wyprowadzona z dawnego roku (nietknięta w polu) wraca do domyślnej, żeby poszła za nowym rokiem.
    const stillDerived = trackShortName !== undefined && name.trim() === `${trackShortName} ${initial.examYear}`;
    onSubmit({ trackId: Number(trackId), examYear: year, name: stillDerived ? "" : name });
  }

  return (
    <Dialog title={mode === "create" ? "Dodaj arkusz egzaminu" : "Edytuj arkusz"} onClose={onClose} closeOnBackdrop={false}>
      <form onSubmit={submit} className="flex flex-col gap-4" data-testid="sheet-form">
        {mode === "create" && (
          <SelectField label="Aplikacja" value={trackId} onChange={(e) => setTrackId(e.target.value)} data-testid="sheet-form-track">
            <option value="">Wybierz aplikację</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </SelectField>
        )}
        <Field
          label="Rok egzaminu"
          type="number"
          inputMode="numeric"
          value={examYear}
          onChange={(e) => setExamYear(e.target.value)}
          autoFocus={mode === "edit"}
          data-testid="sheet-form-year"
        />
        {mode === "edit" && (
          <Field
            label="Nazwa"
            hint="Nazwa z aplikacji i roku idzie za rokiem. Wpisz własną, żeby ją zachować; puste pole wraca do nazwy z roku."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
          />
        )}
        <FormError message={localError ?? error} />
        <FormActions pending={pending} submitLabel="Zapisz" onCancel={onClose} />
      </form>
    </Dialog>
  );
}
