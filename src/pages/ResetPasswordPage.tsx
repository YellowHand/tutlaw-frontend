import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "../api/axiosInstance";
import { serverMessage } from "../lib/errors";
import { AuthLayout } from "../components/layout/AuthLayout";
import { AuthField } from "../features/auth/AuthField";
import { AUTH_PRIMARY_BUTTON_CLASS } from "../features/auth/styles";
import { ROUTES } from "../config/routes";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== repeat) {
      setError("Hasła nie są takie same.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/api/auth/reset-password", { token, newPassword });
      setDone(true);
    } catch (err) {
      setError(serverMessage(err, "Nie udało się zmienić hasła. Spróbuj ponownie."));
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Nowe hasło">
        <div className="flex flex-col items-center gap-3 text-center">
          <XCircle className="text-danger" size={32} aria-hidden="true" />
          <p className="text-sm text-fg-muted">Brakuje linku do zmiany hasła. Poproś o nowy.</p>
          <Link to={ROUTES.forgotPassword} className="text-sm text-accent-ink underline">
            Wyślij nowy link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Nowe hasło">
        <div className="flex flex-col items-center gap-3 text-center" role="status">
          <CheckCircle2 className="text-success" size={32} aria-hidden="true" />
          <p className="text-sm text-fg-muted">Hasło zostało zmienione. Możesz się zalogować.</p>
          <Link to={ROUTES.login} className={AUTH_PRIMARY_BUTTON_CLASS}>
            Przejdź do logowania
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Nowe hasło">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          id="newPassword"
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
          id="repeatPassword"
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

        <button type="submit" disabled={submitting} className={AUTH_PRIMARY_BUTTON_CLASS}>
          {submitting ? "Zapisuję..." : "Zmień hasło"}
        </button>

        <Link to={ROUTES.forgotPassword} className="text-center text-sm text-fg-muted underline">
          Link wygasł? Poproś o nowy
        </Link>
      </form>
    </AuthLayout>
  );
}
