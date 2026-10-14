import { Button } from "../../components/ui/Button";

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
}

/** Mały komunikat o błędzie do wnętrza karty pulpitu (zwykły ErrorState jest za duży na jeden blok). */
export function InlineError({ message, onRetry }: InlineErrorProps) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 text-sm text-fg-muted">
      <p>{message}</p>
      {onRetry && (
        <Button type="button" variant="secondary" onClick={onRetry}>
          Spróbuj ponownie
        </Button>
      )}
    </div>
  );
}
