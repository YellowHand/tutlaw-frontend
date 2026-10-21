import { useId, useState, type FormEvent } from "react";
import { Dialog } from "../../components/ui/Dialog";
import { Field } from "../../components/ui/Field";
import { FormActions, FormError } from "./adminUi";

interface NameDialogProps {
  title: string;
  label: string;
  initial: string;
  submitLabel: string;
  pending: boolean;
  error: string | null;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

/** Okno z jednym polem nazwy (zmiana nazwy rozdziału). */
export function NameDialog({ title, label, initial, submitLabel, pending, error, onSubmit, onClose }: NameDialogProps) {
  const [name, setName] = useState(initial);
  const [localError, setLocalError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setLocalError("Nazwa nie może być pusta.");
    setLocalError(null);
    onSubmit(name.trim());
  }

  return (
    <Dialog title={title} onClose={onClose} closeOnBackdrop={false}>
      <form onSubmit={submit} className="flex flex-col gap-4" data-testid="name-form">
        <Field label={label} value={name} onChange={(e) => setName(e.target.value)} maxLength={300} autoFocus />
        <FormError message={localError ?? error} />
        <FormActions pending={pending} submitLabel={submitLabel} onCancel={onClose} />
      </form>
    </Dialog>
  );
}

interface BulkDialogProps {
  title: string;
  description: string;
  submitLabel: string;
  pending: boolean;
  error: string | null;
  onSubmit: (lines: string[]) => void;
  onClose: () => void;
}

/** Okno z polem tekstowym na wiele pozycji: każdy niepusty wiersz to jedna pozycja (wklejony spis rozdziałów). */
export function BulkDialog({ title, description, submitLabel, pending, error, onSubmit, onClose }: BulkDialogProps) {
  const id = useId();
  const [text, setText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return setLocalError("Wklej co najmniej jeden wiersz.");
    setLocalError(null);
    onSubmit(lines);
  }

  return (
    <Dialog title={title} onClose={onClose} closeOnBackdrop={false}>
      <form onSubmit={submit} className="flex flex-col gap-3" data-testid="bulk-form">
        <p id={`${id}-hint`} className="text-sm text-fg-muted">
          {description}
        </p>
        <div className="flex flex-col gap-1">
          <label htmlFor={id} className="text-sm text-fg-muted">
            Rozdziały, jeden w wierszu
          </label>
          <textarea
            id={id}
            aria-describedby={`${id}-hint`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="min-h-40 rounded-xl border border-field bg-surface-2 px-3 py-2 font-[inherit]"
            autoFocus
          />
          <p className="text-xs text-fg-muted" aria-live="polite" data-testid="bulk-count">
            Wierszy do dodania: {lines.length}
          </p>
        </div>
        <FormError message={localError ?? error} />
        <FormActions pending={pending} submitLabel={submitLabel} onCancel={onClose} />
      </form>
    </Dialog>
  );
}
