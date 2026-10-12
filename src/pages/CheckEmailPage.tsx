import { Link, useLocation } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "../components/layout/AuthLayout";
import { ResendVerification } from "../features/auth/ResendVerification";
import { ROUTES } from "../config/routes";

export function CheckEmailPage() {
  const email = (useLocation().state as { email?: string } | null)?.email ?? "";

  return (
    <AuthLayout
      title="Sprawdź skrzynkę"
      footer={
        <Link to={ROUTES.login} className="text-accent underline">
          Wróć do logowania
        </Link>
      }
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <MailCheck className="text-accent" size={32} aria-hidden="true" />
        <p className="text-sm text-fg-muted">
          Wysłaliśmy link aktywacyjny na Twój mail uczelniany. Kliknij go, żeby dokończyć rejestrację.
        </p>
      </div>

      <div className="mt-6">
        <ResendVerification initialEmail={email} />
      </div>
    </AuthLayout>
  );
}
