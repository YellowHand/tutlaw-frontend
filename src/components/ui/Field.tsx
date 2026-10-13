import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  hint?: ReactNode;
}

/** Pole formularza z etykietą powiązaną z inputem i opcjonalną podpowiedzią czytaną przez czytniki ekranu. */
export function Field({ label, hint, className, ...props }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-fg-muted">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hint ? hintId : undefined}
        className={cn("min-h-11 rounded-xl border border-field bg-surface-2 px-3", className)}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-xs text-fg-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
