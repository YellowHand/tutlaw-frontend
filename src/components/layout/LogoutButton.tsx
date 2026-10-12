import { LogOut } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";

interface LogoutButtonProps {
  variant?: "full" | "compact";
  className?: string;
}

export function LogoutButton({ variant = "full", className }: LogoutButtonProps) {
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    window.location.href = ROUTES.landing;
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        title="Wyloguj się"
        className={cn(
          "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg",
          className
        )}
      >
        <LogOut size={18} aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-full px-3 min-h-11 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg",
        className
      )}
    >
      <LogOut size={18} aria-hidden="true" />
      Wyloguj się
    </button>
  );
}