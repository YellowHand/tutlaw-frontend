import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "../components/layout/AuthLayout";

export function CheckEmailPage() {
  return (
    <AuthLayout
      title="Sprawdź skrzynkę"
      footer={
        <Link to="/login" className="text-accent underline">
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
    </AuthLayout>
  );
}