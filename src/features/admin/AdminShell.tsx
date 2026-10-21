import { Suspense } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { RouteFallback } from "../../components/RouteFallback";
import { Logo } from "../../components/layout/Logo";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { ThemeSync } from "../settings/ThemeSync";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "./adminNav";

/**
 * Szkielet panelu administratora: osobny od szkieletu aplikacji, żeby nie mieszać narzędzi z nauką. Na komputerze menu
 * po lewej, na telefonie przewijany pasek zakładek pod nagłówkiem. „Wróć do aplikacji" jest zawsze pod ręką.
 */
export function AdminShell() {
  const { pathname } = useLocation();

  return (
    <div data-admin-shell className="relative flex h-dvh flex-col overflow-hidden bg-canvas text-fg md:flex-row">
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-line bg-surface px-3 py-4 md:flex">
        <div className="mb-2 pl-2">
          <Logo variant="wordmark" />
        </div>
        <p className="mb-5 flex items-center gap-2 pl-2 text-xs font-medium text-fg-muted">
          <ShieldCheck size={14} aria-hidden="true" />
          Panel administratora
        </p>
        <nav aria-label="Panel administratora" className="flex flex-1 flex-col gap-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isAdminNavActive(item, pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                  active ? "bg-surface-2 text-fg" : "text-fg-muted hover:bg-surface-2/60 hover:text-fg"
                )}
              >
                <Icon size={19} aria-hidden="true" className={active ? "text-accent-ink" : undefined} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          to={ROUTES.dashboard}
          className="mt-4 flex min-h-11 items-center gap-3 rounded-xl border-t border-line px-3 pt-3 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
          data-testid="admin-back-to-app"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Wróć do aplikacji
        </Link>
      </aside>

      <header className="shrink-0 border-b border-line bg-surface md:hidden">
        <div className="flex items-center justify-between gap-2 px-4 pt-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck size={16} aria-hidden="true" className="text-accent-ink" />
            Panel administratora
          </p>
          <Link
            to={ROUTES.dashboard}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-medium text-fg-muted hover:text-fg"
            data-testid="admin-back-to-app-mobile"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Wróć do aplikacji
          </Link>
        </div>
        <nav aria-label="Panel administratora" className="flex gap-1 overflow-x-auto px-3 pb-2">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isAdminNavActive(item, pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
                  active ? "bg-surface-2 text-fg ring-1 ring-line" : "text-fg-muted hover:bg-surface-2/60 hover:text-fg"
                )}
              >
                <Icon size={16} aria-hidden="true" className={active ? "text-accent-ink" : undefined} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="min-w-0 flex-1 overflow-y-auto overscroll-none">
        <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      <ThemeSync />
    </div>
  );
}
