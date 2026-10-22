import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/axiosInstance";
import { serverMessage } from "../../lib/errors";
import { TurnstileWidget } from "../../components/TurnstileWidget";
import { useTurnstile } from "../../lib/useTurnstile";
import { AuthField } from "./AuthField";
import { AUTH_SECONDARY_BUTTON_CLASS } from "./styles";

/** Po tylu milisekundach od wysłania przycisk znowu działa (żeby nie wysyłać maili seriami). */
const COOLDOWN_MS = 60_000;

interface ResendVerificationProps {
  initialEmail?: string;
}

/** "Nie dotarł link aktywacyjny? Wyślij ponownie." Odpowiedź serwera jest zawsze taka sama, więc nie zdradza, czy konto istnieje. */
export function ResendVerification({ initialEmail = "" }: ResendVerificationProps) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const botCheck = useTurnstile();

  useEffect(() => {
    if (status !== "sent") return;
    const timer = window.setTimeout(() => setStatus("idle"), COOLDOWN_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("sending");
    try {
      await api.post("/api/auth/resend-verification", { privateEmail: email }, botCheck.requestConfig);
      setStatus("sent");
    } catch (err) {
      setStatus("idle");
      setError(serverMessage(err, "Nie udało się wysłać wiadomości. Spróbuj ponownie."));
    } finally {
      botCheck.reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-line bg-surface-2/40 p-4">
      <p className="text-sm font-semibold">Nie dotarł link aktywacyjny?</p>
      <AuthField
        id="resend-email"
        label="Mail prywatny, którym się rejestrowałeś"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        required
      />
      <TurnstileWidget resetKey={botCheck.resetKey} onToken={botCheck.setToken} />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {status === "sent" && (
        <p role="status" className="text-sm text-success">
          Jeśli konto czeka na aktywację, wysłaliśmy nowy link na Twój mail uczelniany. Sprawdź też folder ze spamem.
        </p>
      )}
      <button type="submit" disabled={status !== "idle" || !botCheck.ready} className={AUTH_SECONDARY_BUTTON_CLASS}>
        {status === "sending" ? "Wysyłam..." : status === "sent" ? "Wysłano" : "Wyślij link ponownie"}
      </button>
    </form>
  );
}
