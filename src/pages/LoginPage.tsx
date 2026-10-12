import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/axiosInstance";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/layout/AuthLayout";
import { ROUTES } from "../config/routes";

export function LoginPage() {
  const [privateEmail, setPrivateEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.dashboard;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post("/api/auth/login", { privateEmail, password });
      login(res.data.accessToken);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Logowanie nie powiodło się");
    }
  }

  return (
    <AuthLayout
      title="Zaloguj się"
      footer={
        <>
          Nie masz konta?{" "}
          <Link to="/register" className="text-accent underline">
            Zarejestruj się
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="privateEmail" className="text-sm text-fg-muted">
            Mail prywatny
          </label>
          <input
            id="privateEmail"
            type="email"
            value={privateEmail}
            onChange={(e) => setPrivateEmail(e.target.value)}
            className="min-h-11 rounded-xl border border-line bg-surface-2 px-3"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm text-fg-muted">
            Hasło
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-11 rounded-xl border border-line bg-surface-2 px-3"
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-accent px-4 min-h-11 text-sm font-semibold text-accent-fg hover:opacity-90"
        >
          Zaloguj się
        </button>
      </form>
    </AuthLayout>
  );
}