import { Link, useLocation } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "../components/layout/AuthLayout";
import { ResendVerification } from "../features/auth/ResendVerification";
import { ROUTES } from "../config/routes";

export function CheckEmailPage() {
  const email = (useLocation().state as { email?: string } | null)?.email ?? "";

  return (
    <AuthLayout title="Sprawdź skrzynkę">
      <div className="flex flex-col items-center gap-3 text-center">
        <MailCheck className="text-accent-ink" size={32} aria-hidden="true" />
        {/* Ten sam tekst dla każdego adresu: nie zdradzamy, czy konto już istniało. */}
        <p className="text-sm text-fg-muted">
          Jeśli ten adres nie miał jeszcze konta, wysłaliśmy link aktywacyjny na Twój mail uczelniany. Kliknij go, żeby
          dokończyć rejestrację.
        </p>
        <p className="text-sm text-fg-muted">
          Masz już konto?{" "}
          <Link to={ROUTES.login} className="text-accent-ink underline">
            Zaloguj się
          </Link>{" "}
          albo{" "}
          <Link to={ROUTES.forgotPassword} className="text-accent-ink underline">
            ustaw nowe hasło
          </Link>
          , jeśli go nie pamiętasz.
        </p>
      </div>

      <div className="mt-6">
        <ResendVerification initialEmail={email} />
      </div>
    </AuthLayout>
  );
}
