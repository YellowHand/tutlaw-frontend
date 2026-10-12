import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "../api/axiosInstance";
import { AuthLayout } from "../components/layout/AuthLayout";
import { ResendVerification } from "../features/auth/ResendVerification";

export function VerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  // Bez tokenu w adresie nie ma czego weryfikować, więc od razu pokazujemy błąd.
  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const hasRequested = useRef(false);

  useEffect(() => {
    if (!token || hasRequested.current) return;
    hasRequested.current = true;

    api
      .get("/api/auth/verify", { params: { token } })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <AuthLayout title="Weryfikacja konta">
      {status === "loading" && <p className="text-sm text-fg-muted">Weryfikuję...</p>}

      {status === "error" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <XCircle className="text-danger" size={32} aria-hidden="true" />
          <p className="text-sm text-fg-muted">Link nieprawidłowy lub wygasł.</p>
          <div className="mt-3 w-full text-left">
            <ResendVerification />
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="text-success" size={32} aria-hidden="true" />
          <p className="text-sm text-fg-muted">Konto zweryfikowane!</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 min-h-11 text-sm font-semibold text-accent-fg hover:opacity-90"
          >
            Przejdź do logowania
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}