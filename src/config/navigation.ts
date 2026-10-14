import type { LucideIcon } from "lucide-react";
import { BarChart3, ClipboardList, LayoutDashboard, Layers, UserRound } from "lucide-react";
import type { SessionMode } from "../api/review";
import { ROUTES } from "./routes";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** Dodatkowe adresy (przedrostki), na których pozycja też świeci jako aktywna. */
  activePrefixes?: string[];
  /** Odznaka z liczbą powtórek w menu: "FLASHCARD" = fiszki do powtórki, "TEST" = pytania testowe do powtórki. */
  badge?: SessionMode;
}

export const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.dashboard, label: "Pulpit", icon: LayoutDashboard, end: true },
  // Egzamin próbny jest częścią Testów (wchodzi się do niego z ekranu Testy), więc też zapala tę pozycję.
  { to: ROUTES.tests, label: "Testy", icon: ClipboardList, activePrefixes: [ROUTES.exam], badge: "TEST" },
  { to: ROUTES.flashcards, label: "Fiszki", icon: Layers, badge: "FLASHCARD" },
  { to: ROUTES.statistics, label: "Statystyki", icon: BarChart3 },
  { to: ROUTES.account, label: "Konto", icon: UserRound },
];

/**
 * Pozycje paska bocznego (komputer i tablet): wszystkie poza Kontem. Konto jest w bloku użytkownika na dole paska,
 * razem z wylogowaniem. Dolna belka na telefonie pokazuje pełną listę {@link NAV_ITEMS}.
 */
export const SIDE_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter((item) => item.to !== ROUTES.account);

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Czy pozycja menu jest aktywna dla bieżącego adresu. Jedno miejsce dla paska bocznego i dolnej belki. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.end) return pathname === item.to;
  return matchesPrefix(pathname, item.to) || (item.activePrefixes?.some((prefix) => matchesPrefix(pathname, prefix)) ?? false);
}

/**
 * Sesje nauki (fiszki i testy) wypełniają cały ekran: menu znika, żeby nic nie odciągało od pytania.
 * Zwraca adres, do którego prowadzi przycisk „Zakończ sesję”, albo null dla zwykłych ekranów z menu.
 * Listy (`/app/tests`, `/app/flashcards`) zostają z menu: porównujemy całe segmenty adresu, a nie sam początek.
 */
export function sessionExitRoute(pathname: string): string | null {
  if (matchesPrefix(pathname, ROUTES.studyAll)) return ROUTES.flashcards;
  if (matchesPrefix(pathname, ROUTES.testAll)) return ROUTES.tests;
  return null;
}
