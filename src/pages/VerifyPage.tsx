import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api/axiosInstance";

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
    api.get(`/api/auth/verify?token=${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [searchParams]);

  if (status === "loading") return <p className="p-10">Weryfikuję...</p>;
  if (status === "error") return <p className="p-10 text-red-600">Link nieprawidłowy lub wygasł.</p>;

  return (
    <div className="p-10 text-center">
      <p className="text-green-600 mb-4">Konto zweryfikowane!</p>
      <Link to="/login" className="text-blue-600 underline">Przejdź do logowania</Link>
    </div>
  );
}