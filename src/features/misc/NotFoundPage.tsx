import { Link } from "react-router-dom";
import { ROUTES } from "../../config/routes";

/** Treść strony 404. Sama nie jest landmarkiem <main>: wewnątrz aplikacji ten element daje AppShell. */
export function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-4xl font-bold" aria-hidden="true">
        404
      </p>
      <h1 className="text-fg-muted">
        <span className="sr-only">Błąd 404. </span>Nie znaleziono takiej strony.
      </h1>
      <Link to={ROUTES.dashboard} className="text-accent underline">
        Wróć do Pulpitu
      </Link>
    </div>
  );
}

/** Ta sama strona 404 poza aplikacją (adres nieznany, użytkownik bez AppShell), więc sama dostarcza <main>. */
export function PublicNotFoundPage() {
  return (
    <main className="h-dvh bg-canvas text-fg">
      <NotFoundPage />
    </main>
  );
}
