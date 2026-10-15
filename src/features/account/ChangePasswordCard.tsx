import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { Card } from "../../components/ui/Card";
import { serverMessage } from "../../lib/errors";
import { AuthField } from "../auth/AuthField";
import { AUTH_PRIMARY_BUTTON_CLASS } from "../auth/styles";
import { changePassword } from "./api";

/** Zmiana hasła bez zmiany adresu e-mail. Wymaga obecnego hasła; pozostałe zalogowane urządzenia zostają wylogowane. */
export function ChangePasswordCard() {
  const { login } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => changePassword(currentPassword, newPassword),
    onSuccess: (tokens) => {
      // Serwer unieważnił stare sesje, więc ta przeglądarka dostaje nową parę tokenów, żeby zostać zalogowana.
      login(tokens.accessToken, tokens.refreshToken);
      setCurrentPassword("");
      setNewPassword("");
      setRepeat("");
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== repeat) {
      setFormError("Hasła nie są takie same.");
      return;
    }
    if (newPassword === currentPassword) {
      setFormError("Nowe hasło musi być inne niż obecne.");
      return;
    }
    setFormError(null);
    mutation.mutate();
  }

  const error = formError ?? (mutation.isError ? serverMessage(mutation.error, "Nie udało się zmienić hasła. Spróbuj ponownie.") : null);

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Zmień hasło</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Po zmianie hasła pozostałe zalogowane urządzenia zostaną wylogowane. Ta przeglądarka zostaje zalogowana.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
        <AuthField
          id="current-password"
          label="Obecne hasło"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={setCurrentPassword}
          required
          maxLength={256}
        />
        <AuthField
          id="new-password"
          label="Nowe hasło (min. 8 znaków)"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={setNewPassword}
          required
          minLength={8}
          maxLength={72}
        />
        <AuthField
          id="repeat-new-password"
          label="Powtórz nowe hasło"
          type="password"
          autoComplete="new-password"
          value={repeat}
          onChange={setRepeat}
          required
          minLength={8}
          maxLength={72}
        />

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {mutation.isSuccess && !error && (
          <p role="status" className="flex items-start gap-2 text-sm text-fg-muted">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
            <span>Hasło zostało zmienione. Pozostałe zalogowane urządzenia zostały wylogowane.</span>
          </p>
        )}

        <div>
          <button type="submit" disabled={mutation.isPending} className={AUTH_PRIMARY_BUTTON_CLASS}>
            {mutation.isPending ? "Zapisuję..." : "Zmień hasło"}
          </button>
        </div>
      </form>
    </Card>
  );
}
