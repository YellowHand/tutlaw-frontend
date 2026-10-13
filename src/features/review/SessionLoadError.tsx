import { Link } from "react-router-dom";
import { ErrorState } from "../../components/ui/ErrorState";

interface SessionLoadErrorProps {
  /** Tytuł sesji do nagłówka h1 widocznego tylko dla czytnika ekranu. */
  title: string;
  message: string;
  onRetry: () => void;
  backTo: string;
  backLabel: string;
}

/** Ekran sesji (fiszki / test), gdy nie udało się pobrać pytań: komunikat, ponowna próba i wyjście. */
export function SessionLoadError({ title, message, onRetry, backTo, backLabel }: SessionLoadErrorProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 pt-6 sm:p-6 sm:pt-[8vh]">
      <h1 className="sr-only">{title}</h1>
      <ErrorState message={message} onRetry={onRetry} />
      <Link to={backTo} className="self-center text-sm text-fg-muted underline hover:text-fg">
        {backLabel}
      </Link>
    </div>
  );
}
