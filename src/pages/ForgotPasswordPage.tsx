import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { api } from "../api/axiosInstance";
import { serverMessage } from "../lib/errors";
import { TurnstileWidget } from "../components/TurnstileWidget";
import { useTurnstile } from "../lib/useTurnstile";
import { AuthLayout } from "../components/layout/AuthLayout";
import { AuthField } from "../features/auth/AuthField";
import { AUTH_PRIMARY_BUTTON_CLASS } from "../features/auth/styles";
import { ROUTES } from "../config/routes";

export function ForgotPasswordPage() {
  const [privateEmail, setPrivateEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const botCheck = useTurnstile();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/api/auth/forgot-password", { privateEmail }, botCheck.requestConfig);
      setSent(true);
    } catch (err) {
      setError(serverMessage(err, "Nie udało się wysłać wiadomości. Spróbuj ponownie."));
    } finally {
      setSubmitting(false);
      botCheck.reset();
    }
  }

  return (
    <AuthLayout
      title="Nie pamiętasz hasła?"
      footer={
        <Link to={ROUTES.login} className="text-accent-ink underline">
          Wróć do logowania
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 text-center" role="status">
          <MailCheck className="text-accent-ink" size={32} aria-hidden="true" />
          <p className="text-sm text-fg-muted">
            Jeśli konto o tym adresie istnieje i jest aktywne, wysłaliśmy link do zmiany hasła na mail uczelniany podany
            przy rejestracji. Link jest ważny przez godzinę. Sprawdź też folder ze spamem.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-fg-muted">
            Podaj mail prywatny, którym się logujesz. Link do ustawienia nowego hasła wyślemy na Twój mail uczelniany.
          </p>
          <AuthField
            id="privateEmail"
            label="Mail prywatny"
            type="email"
            autoComplete="email"
            value={privateEmail}
            onChange={setPrivateEmail}
            required
          />

          <TurnstileWidget resetKey={botCheck.resetKey} onToken={botCheck.setToken} />

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting || !botCheck.ready} className={AUTH_PRIMARY_BUTTON_CLASS}>
            {submitting ? "Wysyłam..." : "Wyślij link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
