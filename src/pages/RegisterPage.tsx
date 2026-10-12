import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/axiosInstance";
import { AuthLayout } from "../components/layout/AuthLayout";

export function RegisterPage() {
  const [privateEmail, setPrivateEmail] = useState("");
  const [universityEmail, setUniversityEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/api/auth/register", { privateEmail, universityEmail, password });
      navigate("/check-email");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Rejestracja nie powiodła się");
    }
  }

  return (
    <AuthLayout
      title="Załóż konto"
      footer={
        <>
          Masz już konto?{" "}
          <Link to="/login" className="text-accent underline">
            Zaloguj się
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
          <label htmlFor="universityEmail" className="text-sm text-fg-muted">
            Mail uczelniany
          </label>
          <input
            id="universityEmail"
            type="email"
            value={universityEmail}
            onChange={(e) => setUniversityEmail(e.target.value)}
            className="min-h-11 rounded-xl border border-line bg-surface-2 px-3"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm text-fg-muted">
            Hasło (min. 8 znaków)
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-11 rounded-xl border border-line bg-surface-2 px-3"
            required
            minLength={8}
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
          Zarejestruj się
        </button>
      </form>
    </AuthLayout>
  );
}