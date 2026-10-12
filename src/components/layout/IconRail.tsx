import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/cn";
import { NAV_ITEMS, type NavItem } from "../../config/navigation";
import { LogoutButton } from "./LogoutButton";
import { Logo } from "./Logo";

interface IconRailProps {
  className?: string;
}

function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.end) return pathname === item.to;
  if (pathname === item.to || pathname.startsWith(`${item.to}/`)) return true;
  return item.activePrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ?? false;
}

export function IconRail({ className }: IconRailProps) {
  const location = useLocation();

  return (
    <aside className={cn("w-[72px] shrink-0 flex-col items-center border-r border-line bg-surface py-4", className)}>
      <Logo variant="monogram" />

      <nav aria-label="Główna nawigacja" className="mt-6 flex flex-1 flex-col items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(item, location.pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              className={cn(
                "group relative flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                active ? "bg-accent text-accent-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg"
              )}
            >
              <Icon size={20} aria-hidden="true" />
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-full bg-surface-2 px-3 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <LogoutButton variant="compact" className="mt-4" />
    </aside>
  );
}