import type { LucideIcon } from "lucide-react";
import { BarChart3, ClipboardList, LayoutDashboard, Layers, UserRound } from "lucide-react";
import type { SessionMode } from "../api/review";
import { ROUTES } from "./routes";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  activePrefixes?: string[];
  /** Odznaka z liczbą powtórek w menu: "FLASHCARD" = fiszki do powtórki, "TEST" = pytania testowe do powtórki. */
  badge?: SessionMode;
}

export const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.dashboard, label: "Pulpit", icon: LayoutDashboard, end: true },
  { to: ROUTES.tests, label: "Testy", icon: ClipboardList, activePrefixes: ["/app/test"], badge: "TEST" },
  { to: ROUTES.flashcards, label: "Fiszki", icon: Layers, activePrefixes: ["/app/study"], badge: "FLASHCARD" },
  { to: ROUTES.statistics, label: "Statystyki", icon: BarChart3 },
  { to: ROUTES.account, label: "Konto", icon: UserRound },
];