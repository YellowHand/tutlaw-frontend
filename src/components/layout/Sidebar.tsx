import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/cn";
import { NAV_ITEMS, type NavItem } from "../../config/navigation";
import { LogoutButton } from "./LogoutButton";
import { Logo } from "./Logo";

interface SidebarProps {
  className?: string;
}

function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.end) return pathname === item.to;
  if (pathname === item.to || pathname.startsWith(`${item.to}/`)) return true;
  return item.activePrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ?? false;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={cn("w-64 shrink-0 flex-col border-r border-line bg-surface p-4", className)}>
      <div className="mb-6 px-2">
        <Logo variant="wordmark" />
      </div>

      <nav aria-label="Główna nawigacja" className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(item, location.pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 min-h-11 text-sm font-medium transition-colors",
                active ? "bg-accent text-accent-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg"
              )}
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <LogoutButton variant="full" className="mt-4" />
    </aside>
  );
}