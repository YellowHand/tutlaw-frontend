import { cn } from "../../lib/cn";
import type { Flash } from "./useFlash";

/** Pasek z wynikiem czynności. Błędy czytnik ekranu odczytuje od razu (alert), potwierdzenia grzecznie (status). */
export function FlashMessage({ flash }: { flash: Flash | null }) {
  if (!flash) return null;
  const error = flash.kind === "error";
  return (
    <p
      role={error ? "alert" : "status"}
      data-testid={error ? "admin-flash-error" : "admin-flash-ok"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        error ? "border-danger/40 bg-danger/10 text-fg" : "border-line bg-surface-2 text-fg"
      )}
    >
      {flash.text}
    </p>
  );
}
