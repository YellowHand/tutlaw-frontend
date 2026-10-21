import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface ChoiceCardProps {
  /** Wspólna nazwa grupy przycisków opcji. */
  name: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Karta z przyciskiem opcji (radio) w kreatorze Testów: cała karta jest klikalna, wybrana ma złotą ramkę i tło, a fokus z
 * klawiatury widać na całej karcie. Natywne pole opcji zostaje, więc strzałki i czytnik ekranu działają jak zwykle.
 */
export function ChoiceCard({ name, checked, onChange, disabled, className, children }: ChoiceCardProps) {
  return (
    <label
      className={cn(
        "flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 border-line px-4 py-3 transition-colors hover:bg-surface-2",
        "has-checked:border-accent has-checked:bg-accent/10",
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-ink",
        "has-disabled:cursor-not-allowed has-disabled:opacity-50 has-disabled:hover:bg-transparent",
        className
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="size-[18px] shrink-0 cursor-[inherit] accent-accent-ink"
      />
      {children}
    </label>
  );
}
