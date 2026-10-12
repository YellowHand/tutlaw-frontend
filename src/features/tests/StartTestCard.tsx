import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Play } from "lucide-react";
import { Card } from "../../components/ui/Card";

export const START_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-medium text-accent-fg hover:opacity-90";

interface StartTestCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
}

/** Duży pasek „Test z całego …" nad listą kafelków. */
export function StartTestCard({ icon: Icon, title, description, to }: StartTestCardProps) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-fg-muted">{description}</p>
        </div>
      </div>
      <Link to={to} className={START_BUTTON}>
        <Play size={16} aria-hidden="true" />
        Rozpocznij test
      </Link>
    </Card>
  );
}
