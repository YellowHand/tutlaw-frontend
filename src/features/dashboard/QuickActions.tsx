import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, Layers, type LucideIcon } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { ROUTES } from "../../config/routes";

interface QuickAction {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const ACTIONS: QuickAction[] = [
  { to: ROUTES.flashcards, label: "Fiszki", description: "Wróć do powtórek", icon: Layers },
  { to: ROUTES.tests, label: "Testy", description: "Sprawdź się w teście", icon: ClipboardList },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.to} to={action.to} className="group block">
            <Card className="flex items-center gap-2.5 p-2.5 transition-colors hover:bg-surface-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icon size={15} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{action.label}</span>
                <span className="block truncate text-xs text-fg-muted">{action.description}</span>
              </span>
              <ArrowRight size={14} aria-hidden="true" className="shrink-0 text-fg-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </Card>
          </Link>
        );
      })}
    </div>
  );
}