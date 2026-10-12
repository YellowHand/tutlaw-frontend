import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  Folder,
  Gavel,
  GraduationCap,
  Landmark,
  Library,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";

const ICONS_BY_SLUG: Record<string, LucideIcon> = {
  student: GraduationCap,
  "prawo-konstytucyjne-i-ue": Landmark,
  "prawo-cywilne-i-postepowanie-cywilne": Gavel,
  "prawo-karne-i-postepowanie-karne": ShieldAlert,
  "prawo-administracyjne": Building2,
  "prawo-gospodarcze-i-handlowe": TrendingUp,
  "prawo-pracy-i-ubezpieczen-spolecznych": Users,
  "prawo-korporacyjne": Briefcase,
  inne: Library,
};

/** Ikona rodzaju po slugu; nieznane (dodane później) dostają neutralny folder. */
export function iconForCategory(slug: string): LucideIcon {
  return ICONS_BY_SLUG[slug] ?? Folder;
}
