import type { LucideIcon } from "lucide-react";
import { AppWindow, CalendarDays, CircleHelp, FileUp, Flag, GraduationCap, LayoutDashboard, ScrollText, Scale, Tags } from "lucide-react";
import { ROUTES } from "../../config/routes";

export interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

/** Działy panelu administratora (menu po lewej na komputerze, przewijany pasek u góry na telefonie). */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { to: ROUTES.adminOverview, label: "Przegląd", icon: LayoutDashboard },
  { to: ROUTES.adminTracks, label: "Aplikacje", icon: AppWindow },
  { to: ROUTES.adminCourses, label: "Przedmioty Studenta", icon: GraduationCap },
  { to: ROUTES.adminActs, label: "Akty prawne", icon: Scale },
  { to: ROUTES.adminSheets, label: "Arkusze egzaminów", icon: ScrollText },
  { to: ROUTES.adminTerms, label: "Terminy egzaminów", icon: CalendarDays },
  { to: ROUTES.adminQuestions, label: "Pytania", icon: CircleHelp },
  { to: ROUTES.adminImport, label: "Import pytań", icon: FileUp },
  { to: ROUTES.adminMarks, label: "Oznaczenia", icon: Tags },
  { to: ROUTES.adminReports, label: "Zgłoszenia", icon: Flag },
];

export function isAdminNavActive(item: AdminNavItem, pathname: string): boolean {
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
