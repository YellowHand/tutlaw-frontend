import { LogOut } from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";

interface LogoutButtonProps {
  /** `icon`: sama ikona (pasek boczny). `text`: ikona z napisem (ekran Konto, tam gdzie nie ma paska bocznego). */
  variant?: "icon" | "text";
  className?: string;
}

/** Wylogowuje i przeładowuje stronę główną (pełne przeładowanie czyści pamięć podręczną zapytań). */
export function LogoutButton({ variant = "icon", className }: LogoutButtonProps) {
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    window.location.href = ROUTES.landing;
  }

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className={cn(
          "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line px-5 text-sm font-medium transition-colors hover:bg-surface-2",
          className
        )}
      >
        <LogOut size={18} aria-hidden="true" />
        Wyloguj się
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      title="Wyloguj się"
      aria-label="Wyloguj się"
      className={cn(
        "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg",
        className
      )}
    >
      <LogOut size={18} aria-hidden="true" />
    </button>
  );
}
