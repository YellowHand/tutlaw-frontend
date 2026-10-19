/**
 * Źródło pytania: arkusz egzaminu wstępnego jednej aplikacji w danym roku albo pytania autorskie. Kody takie same jak
 * w backendzie (enum SourceKind i grupy filtra źródeł), polskie etykiety tylko tutaj.
 */
export type SourceKind = "EXAM_SHEET" | "AUTHORED";

/**
 * Trzy grupy filtra źródeł w Testach:
 * - OWN_SHEETS: arkusze wybranej ścieżki,
 * - OTHER_SHEETS: arkusze innych ścieżek (pytania z tych samych aktów, tylko z cudzego egzaminu),
 * - AUTHORED: pytania autorskie.
 */
export type SourceGroup = "OWN_SHEETS" | "OTHER_SHEETS" | "AUTHORED";

export const SOURCE_GROUP_ORDER: readonly SourceGroup[] = ["OWN_SHEETS", "OTHER_SHEETS", "AUTHORED"];

export const SOURCE_GROUP_LABELS: Record<SourceGroup, string> = {
  OWN_SHEETS: "Moje arkusze",
  OTHER_SHEETS: "Arkusze innych ścieżek",
  AUTHORED: "Pytania autorskie",
};

/** Dłuższy opis grupy do okna „Pula pytań". */
export const SOURCE_GROUP_HINTS: Record<SourceGroup, string> = {
  OWN_SHEETS: "Pytania z egzaminów wstępnych Twojej ścieżki.",
  OTHER_SHEETS: "Pytania z egzaminów innych aplikacji, z aktów prawnych Twojej puli.",
  AUTHORED: "Pytania napisane w Gradus iuris, w tym paremie łacińskie.",
};

/**
 * Podpis pod pytaniem: „Notarialna 2021" albo „Pytania autorskie". Nazwa arkusza zawiera już rok; rok dopisujemy tylko
 * wtedy, gdy nazwa go nie ma (np. po ręcznej zmianie nazwy w bazie). Brak nazwy: nic się nie pokazuje.
 */
export function sourceLabel(name: string | null | undefined, examYear?: number | null): string | null {
  if (!name) return null;
  if (examYear == null || name.includes(String(examYear))) return name;
  return `${name} ${examYear}`;
}
