import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "../../config/routes";
import { useIsAdmin } from "../auth/role";

/**
 * Strażnik panelu administratora: wpuszcza tylko rolę ADMIN (odczytaną z tokenu), reszta wraca na Pulpit. To tylko wygoda:
 * prawdziwa kontrola jest w backendzie, który odrzuca każde żądanie `/api/admin/**` od zwykłego użytkownika (403).
 */
export function AdminRoute() {
  const isAdmin = useIsAdmin();
  return isAdmin ? <Outlet /> : <Navigate to={ROUTES.dashboard} replace />;
}
