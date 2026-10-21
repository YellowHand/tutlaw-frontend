import { isSourceMode, type SourceMode } from "../../lib/sourceMode";
import { CUSTOM_TEST_KINDS, type CustomTestKind, type CustomTestScope } from "../../api/customTest";

/**
 * Ustawienia przekazywane do kreatora Testów w stanie nawigacji: „Ułóż ponownie z tymi ustawieniami" z Moich testów
 * i skróty z Pulpitu (np. kliknięcie dziedziny w „Postępie"). Kreator otwiera się wtedy od razu na kroku „Pytania i start".
 */
export interface CustomTestPrefill extends CustomTestScope {
  source: SourceMode;
  kind: CustomTestKind;
  /** O ile pytań prosił użytkownik (10, 20, 50, 100, 150 albo liczba pytań małego zakresu). */
  requestedCount: number;
}

/** Stan nawigacji do `/app/tests`: otwórz kreator z tymi ustawieniami. */
export interface WizardLaunchState {
  prefill: CustomTestPrefill;
}

function isIdList(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((id) => typeof id === "number");
}

/** Odczyt stanu nawigacji z kontrolą kształtu (stan z historii przeglądarki może pochodzić z innej wersji aplikacji). */
export function readPrefill(state: unknown): CustomTestPrefill | null {
  if (typeof state !== "object" || state === null) return null;
  const raw = (state as { prefill?: unknown }).prefill;
  if (typeof raw !== "object" || raw === null) return null;
  const p = raw as Record<string, unknown>;
  if (
    !isIdList(p.fieldIds) ||
    !isIdList(p.actIds) ||
    !isIdList(p.courseIds) ||
    !isIdList(p.sectionIds) ||
    !isSourceMode(p.source) ||
    typeof p.kind !== "string" ||
    !(CUSTOM_TEST_KINDS as readonly string[]).includes(p.kind) ||
    typeof p.requestedCount !== "number"
  ) {
    return null;
  }
  return {
    fieldIds: p.fieldIds,
    actIds: p.actIds,
    courseIds: p.courseIds,
    sectionIds: p.sectionIds,
    source: p.source,
    kind: p.kind as CustomTestKind,
    requestedCount: p.requestedCount,
  };
}

export function scopeOf(prefill: CustomTestPrefill): CustomTestScope {
  return {
    fieldIds: prefill.fieldIds,
    actIds: prefill.actIds,
    courseIds: prefill.courseIds,
    sectionIds: prefill.sectionIds,
  };
}
