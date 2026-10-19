import type { LucideIcon } from "lucide-react";
import { Building2, Coins, Folder, Gavel, GraduationCap, Globe2, Landmark, Library, ScrollText, ShieldAlert, TrendingUp, Users } from "lucide-react";

const ICONS_BY_SLUG: Record<string, LucideIcon> = {
  "prawo-cywilne": Gavel,
  "prawo-karne": ShieldAlert,
  administracja: Building2,
  "prawo-handlowe": TrendingUp,
  "prawo-pracy": Users,
  "konstytucja-i-ustroj": Landmark,
  "zawody-i-ustroj-sadow": ScrollText,
  "prawo-ue-i-miedzynarodowe": Globe2,
  "podatki-i-oplaty": Coins,
  student: GraduationCap,
  pozostale: Library,
};

/** Ikona dziedziny po slugu; nieznane (dodane później w bazie) dostają neutralny folder. */
export function fieldIconFor(slug: string): LucideIcon {
  return ICONS_BY_SLUG[slug] ?? Folder;
}
