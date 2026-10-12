import type { InputHTMLAttributes } from "react";
import { AUTH_INPUT_CLASS } from "./styles";

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "className"> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}

/** Podpisane pole formularza w stylu stron logowania. */
export function AuthField({ id, label, value, onChange, hint, ...inputProps }: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-fg-muted">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={AUTH_INPUT_CLASS}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...inputProps}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-fg-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
