import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { RouteFallback } from "./RouteFallback";

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  // Po odświeżeniu strony token dostępu trzeba najpierw odzyskać z ciasteczka sesji; do tego czasu nie odsyłamy na logowanie.
  if (isInitializing) return <RouteFallback />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
}
