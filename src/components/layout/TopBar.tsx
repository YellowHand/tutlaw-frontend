import { cn } from "../../lib/cn";
import { Logo } from "./Logo";

interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  return (
    <header className={cn("items-center justify-between border-b border-line bg-surface px-4 py-3", className)}>
      <Logo variant="wordmark" />
      <div className="flex items-center gap-2">
      </div>
    </header>
  );
}