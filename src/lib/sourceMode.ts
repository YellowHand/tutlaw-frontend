/**
 * Z jakiego źródła mają pochodzić pytania jednego testu. Wybór jest osobny przy każdym teście (nie ma już trwałego filtra
 * źródeł w puli). Kody takie same jak w backendzie (enum SourceMode).
 * - ALL: wszystkie źródła razem,
 * - MINISTRY: arkusze egzaminacyjne Ministerstwa Sprawiedliwości (własne arkusze ścieżki i arkusze innych aplikacji),
 * - AUTHORED: pytania napisane w Gradus iuris (w tym paremie łacińskie).
 */
export type SourceMode = "ALL" | "MINISTRY" | "AUTHORED";

export const SOURCE_MODE_ORDER: readonly SourceMode[] = ["ALL", "MINISTRY", "AUTHORED"];

export const SOURCE_MODE_LABELS: Record<SourceMode, string> = {
  ALL: "Wszystkie źródła",
  MINISTRY: "Ministerstwo Sprawiedliwości",
  AUTHORED: "Autorskie",
};

/** Krótki opis pod nazwą źródła w kreatorze (bez liczby pytań, tę dopisuje kreator). */
export const SOURCE_MODE_HINTS: Record<SourceMode, string> = {
  ALL: "Ministerstwo i autorskie razem.",
  MINISTRY: "Pytania z arkuszy egzaminacyjnych.",
  AUTHORED: "Pytania dodane w aplikacji.",
};

export function isSourceMode(value: unknown): value is SourceMode {
  return value === "ALL" || value === "MINISTRY" || value === "AUTHORED";
}
