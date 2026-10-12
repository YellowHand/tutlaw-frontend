import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-8 text-center">
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-fg-muted">
          <Icon size={24} aria-hidden="true" />
        </span>
      )}
      <p className="font-semibold">{title}</p>
      {description && <p className="text-sm text-fg-muted">{description}</p>}
      {action}
    </div>
  );
}