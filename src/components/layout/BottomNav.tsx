import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/cn";
import { NAV_ITEMS, isNavItemActive } from "../../config/navigation";
import { NavBadge } from "./NavBadge";

interface BottomNavProps {
  className?: string;
}

/**
 * Dolna belka na telefonie: pięć celów w zasięgu kciuka, z podpisami i odznakami powtórek.
 * Od szerokości `md` zastępuje ją pasek boczny ({@link SideNav}). Dopełnienie `safe-area-inset-bottom` omija
 * pasek gestów w telefonach, które go mają.
 */
export function BottomNav({ className }: BottomNavProps) {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Główna nawigacja"
      className={cn("fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]", className)}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(item, pathname);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium"
              >
                <span
                  className={cn(
                    "relative flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active ? "bg-accent/15 text-accent-ink" : "text-fg-muted"
                  )}
                >
                  <Icon size={21} aria-hidden="true" />
                  {item.badge && (
                    <NavBadge mode={item.badge} solid className="absolute right-0.5 -top-1 h-4 min-w-4 px-1 text-[10px] ring-2 ring-surface" />
                  )}
                </span>
                <span className={active ? "text-fg" : "text-fg-muted"}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
