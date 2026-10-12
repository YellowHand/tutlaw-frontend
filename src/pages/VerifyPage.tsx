import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "../api/axiosInstance";
import { AuthLayout } from "../components/layout/AuthLayout";

export function VerifyPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const hasRequested = useRef(false);

  useEffect(() => {
    if (hasRequested.current) return;
    hasRequested.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    api
      .get(`/api/auth/verify?token=${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [searchParams]);

  return (
    <AuthLayout title="Weryfikacja konta">
      {status === "loading" && <p className="text-sm text-fg-muted">Weryfikuję...</p>}

      {status === "error" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <XCircle className="text-danger" size={32} aria-hidden="true" />
          <p className="text-sm text-fg-muted">Link nieprawidłowy lub wygasł.</p>
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