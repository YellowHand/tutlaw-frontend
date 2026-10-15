import type { CustomTestKind } from "../../api/customTest";

/** Nazwy rodzajów pytań we własnym teście (te same na ekranie układania i w „Moich testach"). */
export const KIND_LABELS: Record<CustomTestKind, string> = {
  ALL: "Wszystkie",
  NEW: "Nowe",
  MISTAKES: "Moje błędy",
  DUE: "Zaległe",
};
