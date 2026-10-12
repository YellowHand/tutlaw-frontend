import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/axiosInstance";
import { serverMessage } from "../lib/errors";
import { AuthLayout } from "../components/layout/AuthLayout";
import { AuthField } from "../features/auth/AuthField";
import { AUTH_PRIMARY_BUTTON_CLASS } from "../features/auth/styles";
import { ROUTES } from "../config/routes";

export function RegisterPage() {
  const [privateEmail, setPrivateEmail] = useState("");
  const [universityEmail, setUniversityEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/api/auth/register", { privateEmail, universityEmail, password, acceptedTerms });
      navigate(ROUTES.checkEmail, { state: { email: privateEmail } });
    } catch (err) {
      setError(serverMessage(err, "Rejestracja nie powiodła się"));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Załóż konto"
      footer={
        <>
          Masz już konto?{" "}
          <Link to={ROUTES.login} className="text-accent underline">
            Zaloguj się
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          id="privateEmail"
          label="Mail prywatny"
          type="email"
          autoComplete="email"
          value={privateEmail}
          onChange={setPrivateEmail}
          hint="Tym adresem będziesz się logować."
          required
        />

        <AuthField
          id="universityEmail"
          label="Mail uczelniany"
          type="email"
          autoComplete="off"
          value={universityEmail}
          onChange={setUniversityEmail}
          hint="Wyślemy na niego link aktywacyjny i ewentualny link do zmiany hasła."
          required
        />

        <AuthField
          id="password"
          label="Hasło (min. 8 znaków)"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          required
          minLength={8}
          maxLength={72}
        />

        <label className="flex items-start gap-2 text-sm text-fg-muted">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
            required
          />
          <span>
            Akceptuję{" "}
            <Link to={ROUTES.terms} target="_blank" rel="noreferrer" className="text-accent underline">
              regulamin
            </Link>{" "}
            i{" "}
            <Link to={ROUTES.privacy} target="_blank" rel="noreferrer" className="text-accent underline">
              politykę prywatności
            </Link>
            .
          </span>
        </label>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className={AUTH_PRIMARY_BUTTON_CLASS}>
          {submitting ? "Zakładam konto..." : "Zarejestruj się"}
        </button>
      </form>
    </AuthLayout>
  );
}
