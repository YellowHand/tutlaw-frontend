import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { api } from "../api/axiosInstance";
import { useAuth } from "../auth/useAuth";
import { serverMessage } from "../lib/errors";
import { AuthLayout } from "../components/layout/AuthLayout";
import { AuthField } from "../features/auth/AuthField";
import { ResendVerification } from "../features/auth/ResendVerification";
import { AUTH_PRIMARY_BUTTON_CLASS } from "../features/auth/styles";
import { ROUTES } from "../config/routes";

export function LoginPage() {
  const [privateEmail, setPrivateEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Serwer odpowiada 409, gdy hasło jest dobre, ale konto nie zostało jeszcze aktywowane linkiem z maila.
  const [needsActivation, setNeedsActivation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.dashboard;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsActivation(false);
    setSubmitting(true);
    try {
      const res = await api.post("/api/auth/login", { privateEmail, password });
      login(res.data.accessToken, res.data.refreshToken);
      navigate(from, { replace: true });
    } catch (err) {
      setNeedsActivation(isAxiosError(err) && err.response?.status === 409);
      setError(serverMessage(err, "Logowanie nie powiodło się"));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Zaloguj się"
      footer={
        <>
          Nie masz konta?{" "}
          <Link to={ROUTES.register} className="text-accent-ink underline">
            Zarejestruj się
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
          required
        />

        <AuthField
          id="password"
          label="Hasło"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          required
        />

        <Link to={ROUTES.forgotPassword} className="-mt-2 self-end text-sm text-accent-ink underline">
          Nie pamiętasz hasła?
        </Link>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className={AUTH_PRIMARY_BUTTON_CLASS}>
          {submitting ? "Loguję..." : "Zaloguj się"}
        </button>
      </form>

      {needsActivation && (
        <div className="mt-6">
          <ResendVerification initialEmail={privateEmail} />
        </div>
      )}
    </AuthLayout>
  );
}
