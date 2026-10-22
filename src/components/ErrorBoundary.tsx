import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { reportRenderError } from "../lib/monitoring";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Gdy ta wartość się zmieni (np. adres strony), błąd jest zapominany i dzieci próbują wyrenderować się od nowa. */
  resetKey?: string;
  /** Pełny ekran (cała aplikacja) albo wypełnienie obszaru treści (menu zostaje). */
  fullScreen?: boolean;
}

interface ErrorBoundaryState {
  failed: boolean;
}

/**
 * Łapie nieoczekiwany błąd w wyświetlaniu ekranu (także nieudane pobranie fragmentu aplikacji po wydaniu nowej wersji)
 * i pokazuje zwykły komunikat zamiast pustej strony. Odświeżenie przeładowuje aplikację do aktualnej wersji.
 * Błędy zapytań do serwera tu nie trafiają: mają własne komunikaty na ekranach.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Błąd ekranu", error, info.componentStack);
    reportRenderError(error, info);
  }

  componentDidUpdate(prev: ErrorBoundaryProps): void {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;

    return (
      <div
        role="alert"
        data-testid="error-boundary"
        className={
          this.props.fullScreen
            ? "flex h-dvh flex-col items-center justify-center gap-4 bg-canvas px-4 text-center text-fg"
            : "flex h-full min-h-64 flex-col items-center justify-center gap-4 px-4 text-center"
        }
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
          <AlertTriangle size={24} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold">Coś poszło nie tak</h1>
          <p className="mt-1 max-w-md text-sm text-fg-muted">
            Odśwież stronę. Twoje odpowiedzi, które już poszły do serwera, są zapisane.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-accent px-6 text-sm font-medium text-accent-fg hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
        >
          Odśwież stronę
        </button>
      </div>
    );
  }
}
