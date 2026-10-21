import { Link, useLocation } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "../../lib/cn";
import { ROUTES } from "../../config/routes";
import { SIDE_NAV_ITEMS, isNavItemActive } from "../../config/navigation";
import { useMe } from "../../features/account/hooks";
import { useIsAdmin } from "../../features/auth/role";
import { Logo } from "./Logo";
import { LogoutButton } from "./LogoutButton";
import { NavBadge } from "./NavBadge";

interface SideNavProps {
  /** `full`: szeroki panel z podpisami. `rail`: wąski pasek, ikona z krótkim podpisem pod spodem. */
  variant: "full" | "rail";
  /** Zwijanie i rozwijanie panelu. Przekazujemy tylko tam, gdzie użytkownik może wybrać (komputer). */
  onToggle?: () => void;
  className?: string;
}

/** Kółko z pierwszą literą adresu e-mail; zanim adres się wczyta, ikona osoby. */
function Avatar({ email }: { email: string | undefined }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-accent-ink ring-1 ring-line"
    >
      {email ? email[0].toUpperCase() : <UserRound size={16} />}
    </span>
  );
}

/** Znacznik aktywnej pozycji: złota kreska przy lewej krawędzi paska. */
function ActiveMark({ edge }: { edge: "-left-3" | "-left-2" }) {
  return <span aria-hidden="true" className={cn("absolute bottom-2.5 top-2.5 w-[3px] rounded-r-full bg-accent", edge)} />;
}

/**
 * Pasek boczny aplikacji (komputer i tablet). Cztery pozycje z odznakami powtórek u góry, a na dole blok konta
 * z wylogowaniem. Aktywna pozycja to ciemna płytka ze złotym znacznikiem: złoto zostaje dla przycisków na ekranach.
 */
export function SideNav({ variant, onToggle, className }: SideNavProps) {
  const { pathname } = useLocation();
  const { data: me } = useMe();
  const isAdmin = useIsAdmin();
  const email = me?.email;
  const accountActive = pathname === ROUTES.account || pathname.startsWith(`${ROUTES.account}/`);

  if (variant === "rail") {
    return (
      <aside className={cn("w-[84px] shrink-0 flex-col items-center border-r border-line bg-surface py-4", className)}>
        <Link to={ROUTES.dashboard} aria-label="Gradus iuris: pulpit" className="rounded-xl p-2">
          <Logo variant="monogram" />
        </Link>

        <nav aria-label="Główna nawigacja" className="mt-6 flex flex-1 flex-col items-center gap-1">
          {SIDE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item, pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex w-[68px] flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors",
                  active ? "bg-surface-2 text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg"
                )}
              >
                {active && <ActiveMark edge="-left-2" />}
                <span className="relative">
                  <Icon size={20} aria-hidden="true" className={active ? "text-accent-ink" : undefined} />
                  {item.badge && (
                    <NavBadge mode={item.badge} solid className="absolute -right-4 -top-2 h-4 min-w-4 px-1 text-[10px] ring-2 ring-surface" />
                  )}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-1">
          {isAdmin && (
            <Link
              to={ROUTES.admin}
              title="Panel administratora"
              aria-label="Panel administratora"
              data-testid="nav-admin"
              className="flex size-11 items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <ShieldCheck size={18} aria-hidden="true" />
            </Link>
          )}
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              title="Rozwiń menu"
              aria-label="Rozwiń menu"
              className="flex size-11 cursor-pointer items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <ChevronsRight size={18} aria-hidden="true" />
            </button>
          )}
          <Link
            to={ROUTES.account}
            title={email ? `Konto: ${email}` : "Konto"}
            aria-label="Konto"
            aria-current={accountActive ? "page" : undefined}
            className={cn("rounded-full p-1", accountActive && "ring-2 ring-accent-ink")}
          >
            <Avatar email={email} />
          </Link>
          <LogoutButton />
        </div>
      </aside>
    );
  }

  return (
    <aside className={cn("w-[248px] shrink-0 flex-col border-r border-line bg-surface px-3 py-4", className)}>
      <div className="mb-6 flex items-center justify-between pl-2">
        <Link to={ROUTES.dashboard} aria-label="Gradus iuris: pulpit" className="flex min-h-11 items-center rounded-lg">
          <Logo variant="wordmark" />
        </Link>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            title="Zwiń menu"
            aria-label="Zwiń menu"
            className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <ChevronsLeft size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Główna nawigacja" className="flex flex-1 flex-col gap-1">
        {SIDE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                active ? "bg-surface-2 text-fg" : "text-fg-muted hover:bg-surface-2/60 hover:text-fg"
              )}
            >
              {active && <ActiveMark edge="-left-3" />}
              <Icon size={19} aria-hidden="true" className={active ? "text-accent-ink" : undefined} />
              {item.label}
              {item.badge && <NavBadge mode={item.badge} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {isAdmin && (
        <Link
          to={ROUTES.admin}
          data-testid="nav-admin"
          className="mt-2 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2/60 hover:text-fg"
        >
          <ShieldCheck size={19} aria-hidden="true" />
          Panel administratora
        </Link>
      )}

      <div className="mt-4 flex items-center gap-1 border-t border-line pt-3">
        <Link
          to={ROUTES.account}
          title={email}
          aria-current={accountActive ? "page" : undefined}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2",
            accountActive && "bg-surface-2"
          )}
        >
          <Avatar email={email} />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium">{email ?? "Konto"}</span>
            <span className="text-xs text-fg-muted">Konto i ustawienia</span>
          </span>
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
