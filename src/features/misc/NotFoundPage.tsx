import { Link } from "react-router-dom";
import { ROUTES } from "../../config/routes";

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-4xl font-bold">404</p>
      <p className="text-fg-muted">Nie znaleziono takiej strony.</p>
      <Link to={ROUTES.dashboard} className="text-accent underline">
        Wróć do Pulpitu
      </Link>
    </div>
  );
}