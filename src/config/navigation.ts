import type { LucideIcon } from "lucide-react";
import { BarChart3, ClipboardList, LayoutDashboard, Layers } from "lucide-react";
import { ROUTES } from "./routes";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  activePrefixes?: string[];
  /** Odznaka z liczbą w menu. "due" = fiszki do powtórki. */
  badge?: "due";
}

export const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.dashboard, label: "Pulpit", icon: LayoutDashboard, end: true },
  { to: ROUTES.tests, label: "Testy", icon: ClipboardList, activePrefixes: ["/app/test"] },
  { to: ROUTES.flashcards, label: "Fiszki", icon: Layers, activePrefixes: ["/app/study"], badge: "due" },
  { to: ROUTES.statistics, label: "Statystyki", icon: BarChart3 },
];