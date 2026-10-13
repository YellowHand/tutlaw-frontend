import type { ComponentPropsWithRef } from "react";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg hover:opacity-90",
  secondary: "bg-surface-2 text-fg hover:bg-line",
  ghost: "bg-transparent text-fg hover:bg-surface-2",
  danger: "bg-danger text-canvas hover:opacity-90",
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 min-h-11 text-sm font-medium transition-colors",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
}