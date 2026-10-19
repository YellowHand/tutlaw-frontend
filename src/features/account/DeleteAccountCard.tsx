import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { LEGAL } from "../../config/legal";
import { clearSession } from "../auth/session";
import { serverMessage } from "../../lib/errors";
import { deleteAccount } from "./api";
import { ACCOUNT_DELETED_URL } from "./constants";

const DANGER_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-full bg-danger px-4 min-h-11 text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

/** Usunięcie konta (prawo do usunięcia danych). Wymaga hasła i jawnego potwierdzenia. */
export function DeleteAccountCard() {
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      // Pełne przeładowanie strony czyści też dane trzymane w pamięci aplikacji.
      clearSession();
      window.location.href = ACCOUNT_DELETED_URL;
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!confirmed || !password) return;
    deleteMutation.mutate(password);
  }

  const canSubmit = confirmed && password.length > 0 && !deleteMutation.isPending && !deleteMutation.isSuccess;

  return (
    <Card className="flex flex-col gap-4 border-danger/40">
      <div>
        <h2 className="text-lg font-semibold text-danger">Usuń konto</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Usuniemy na stałe Twoje konto i wszystko, co z nim związane: adresy e-mail, wybraną ścieżkę i pulę pytań, stan
          pytań w testach i fiszkach, terminy powtórek i historię odpowiedzi. Tego nie da się cofnąć. Jeśli chcesz zachować swoje dane,
          najpierw pobierz je powyżej. Kopie zapasowe wygasają w ciągu {LEGAL.backupRetention}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex max-w-sm flex-col gap-1">
          <label htmlFor="delete-password" className="text-sm text-fg-muted">
            Twoje hasło
          </label>
          <input
            id="delete-password"
            type="password"
            autoComplete="current-password"
            maxLength={256}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-11 rounded-xl border border-field bg-surface-2 px-3"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-danger)]"
          />
          <span>Rozumiem, że usunięcia konta i danych nie można cofnąć.</span>
        </label>

        {deleteMutation.isError && (
          <p role="alert" className="text-sm text-danger">
            {serverMessage(deleteMutation.error, "Nie udało się usunąć konta. Spróbuj ponownie.")}
          </p>
        )}

        <div>
          <button type="submit" disabled={!canSubmit} className={DANGER_BUTTON_CLASS}>
            <Trash2 size={16} aria-hidden="true" />
            {deleteMutation.isPending || deleteMutation.isSuccess ? "Usuwam..." : "Usuń konto na stałe"}
          </button>
        </div>
      </form>
    </Card>
  );
}
