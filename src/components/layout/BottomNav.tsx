import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/cn";
import { NAV_ITEMS, type NavItem } from "../../config/navigation";

interface BottomNavProps {
  className?: string;
}

function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.end) return pathname === item.to;
  if (pathname === item.to || pathname.startsWith(`${item.to}/`)) return true;
  return item.activePrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ?? false;
}

export function BottomNav({ className }: BottomNavProps) {
  const location = useLocation();

  return (
    <nav
      aria-label="Nawigacja dolna"
      className={cn("fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface", className)}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(item, location.pathname);
          return (
            <Link key={item.to} to={item.to} className="flex flex-1 flex-col items-center gap-1 py-2 min-h-11">
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full transition-colors", active && "bg-accent text-accent-fg")}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className={cn("text-xs font-medium", active ? "text-accent" : "text-fg-muted")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}