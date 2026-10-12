import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { Logo } from "../components/layout/Logo";
import { ROUTES } from "../config/routes";

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-fg">
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <Logo variant="wordmark" />
        {isAuthenticated ? (
          <Link
            to={ROUTES.dashboard}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 min-h-11 text-sm font-medium text-accent-fg hover:opacity-90"
          >
            Przejdź do aplikacji
          </Link>
        ) : (
          <Link to="/login" className="text-sm font-medium text-fg-muted hover:text-fg">
            Zaloguj się
          </Link>
        )}
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl">Ucz się prawa w sposób, który naprawdę działa</h1>
        <p className="mt-4 max-w-xl text-fg-muted">
          Fiszki z algorytmem powtórek interwałowych, statystyki postępów i wkrótce testy na aplikacje prawnicze —
          wszystko w jednym miejscu.
        </p>

        {!isAuthenticated && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-6 min-h-11 text-sm font-semibold text-accent-fg hover:opacity-90"
            >
              Załóż konto
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-line px-6 min-h-11 text-sm font-semibold hover:bg-surface-2"
            >
              Zaloguj się
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}