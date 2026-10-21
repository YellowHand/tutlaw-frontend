import { CUSTOM_TEST_KINDS, type CustomTestKind } from "../../api/customTest";
import { isSourceMode, type SourceMode } from "../../lib/sourceMode";

/**
 * Ostatnio ułożony test „Nauka", żeby kreator pamiętał wybór (wygoda, jak przy ustawieniach egzaminu).
 * Wszystkie operacje są w try/catch: bez dostępu do pamięci przeglądarki kreator działa, tylko od zera.
 * Klucz zaczyna się od „gradus.", więc znika przy wylogowaniu (zob. clearSession).
 */
// v4: źródło pytań wybiera się przy każdym teście, a zakres to akty i rozdziały (też u Studenta, który widzi je w przedmiotach).
const SETTINGS_KEY = "gradus.customTest.v4";

export interface RememberedCustomTest {
  version: 4;
  source: SourceMode;
  /** Wybrano całą pulę (bez wskazywania przepisów): nowe akty też wchodzą do testu, zamiast ginąć z listą numerów. */
  all: boolean;
  /** Numery aktów zaznaczonych w całości; przy `all` pusta. */
  actIds: number[];
  /** Numery rozdziałów zaznaczonych osobno; przy `all` pusta. */
  sectionIds: number[];
  kind: CustomTestKind;
  /** Wybrana liczba pytań (10, 20, 50, 100, 150) albo „all" dla „Wszystkie". */
  questionCount: number | "all";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIdList(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((id) => typeof id === "number");
}

export function loadRemembered(): RememberedCustomTest | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw === null) return null;
    const v: unknown = JSON.parse(raw);
    if (
      isRecord(v) &&
      v.version === 4 &&
      isSourceMode(v.source) &&
      typeof v.all === "boolean" &&
      isIdList(v.actIds) &&
      isIdList(v.sectionIds) &&
      typeof v.kind === "string" &&
      (CUSTOM_TEST_KINDS as readonly string[]).includes(v.kind) &&
      (typeof v.questionCount === "number" || v.questionCount === "all")
    ) {
      return {
        version: 4,
        source: v.source,
        all: v.all,
        actIds: v.actIds,
        sectionIds: v.sectionIds,
        kind: v.kind as CustomTestKind,
        questionCount: v.questionCount as number | "all",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveRemembered(settings: RememberedCustomTest): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Brak miejsca albo tryb prywatny: kreator działa dalej, tylko bez zapamiętywania wyboru.
  }
}
