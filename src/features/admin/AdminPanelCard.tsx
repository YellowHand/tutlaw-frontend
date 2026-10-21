import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { ROUTES } from "../../config/routes";
import { useIsAdmin } from "../auth/role";

/** Wejście do panelu administratora z Konta (na telefonie to jedyne miejsce, bo dolna belka go nie ma). Tylko dla administratora. */
export function AdminPanelCard() {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;
  return (
    <Card data-testid="admin-panel-card">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold">
        <ShieldCheck size={18} aria-hidden="true" />
        Panel administratora
      </h2>
      <p className="mb-3 max-w-prose text-sm text-fg-muted">
        Aplikacje, przedmioty Studenta, akty prawne z rozdziałami, arkusze i terminy egzaminów.
      </p>
      <Link
        to={ROUTES.admin}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-accent-fg hover:opacity-90"
        data-testid="admin-panel-link"
      >
        Otwórz panel
      </Link>
    </Card>
  );
}
