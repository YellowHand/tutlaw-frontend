import { useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { cn } from "../../lib/cn";

/** Pole wyboru z etykietą (natywny <select>, ten sam wygląd co pola tekstowe aplikacji). */
export function SelectField({
  label,
  className,
  children,
  ...props
}: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-fg-muted">
        {label}
      </label>
      <select id={id} className={cn("min-h-11 rounded-xl border border-field bg-surface-2 px-3", className)} {...props}>
        {children}
      </select>
    </div>
  );
}

/** Mała etykieta (stan, rodzaj): tekst, nie tylko kolor. */
export function Badge({ children, tone = "neutral", ...rest }: { children: ReactNode; tone?: "neutral" | "warn" } & { "data-testid"?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "warn" ? "bg-danger/10 text-fg ring-1 ring-danger/40" : "bg-surface-2 text-fg-muted ring-1 ring-line"
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/** Okno potwierdzenia czynności, której nie widać od razu (usunięcie, ukrycie przed wszystkimi użytkownikami). */
export function ConfirmDialog({ title, children, confirmLabel, danger, pending, error, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Dialog title={title} onClose={onClose}>
      <div className="flex flex-col gap-3 text-sm text-fg-muted">{children}</div>
      {error && (
        <p role="alert" className="text-sm text-danger" data-testid="confirm-error">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Anuluj
        </Button>
        <Button type="button" variant={danger ? "danger" : "primary"} disabled={pending} onClick={onConfirm} data-testid="confirm-ok">
          {pending ? "Chwileczkę..." : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

/** Stopka formularza w oknie: Anuluj i przycisk zapisu. */
export function FormActions({ pending, submitLabel, onCancel }: { pending: boolean; submitLabel: string; onCancel: () => void }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" variant="ghost" onClick={onCancel}>
        Anuluj
      </Button>
      <Button type="submit" disabled={pending} data-testid="form-submit">
        {pending ? "Zapisuję..." : submitLabel}
      </Button>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-danger" data-testid="form-error">
      {message}
    </p>
  );
}
