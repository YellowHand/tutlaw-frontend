import type { CustomTestKind } from "../../api/customTest";

/**
 * Ostatnio ułożony własny test, żeby formularz pamiętał wybór (wygoda, jak przy ustawieniach egzaminu).
 * Wszystkie operacje są w try/catch: bez dostępu do pamięci przeglądarki ekran działa, tylko od zera.
 * Klucz zaczyna się od „gradus.", więc znika przy wylogowaniu (zob. clearSession).
 */
// v2: zakres to akty prawne z nowej bazy (v1 zapamiętywało przedmioty, których numery już nic nie znaczą).
const SETTINGS_KEY = "gradus.customTest.v2";

export interface RememberedCustomTest {
  version: 2;
  /** Zaznaczono wszystko: wtedy nowe akty też są zaznaczone, zamiast ginąć z listą numerów. */
  all: boolean;
  /** Zaznaczone akty prawne; przy `all` pusta. */
  actIds: number[];
  kind: CustomTestKind;
  /** Wybrana liczba pytań (10, 20, 50, 100, 150) albo „all" dla „Wszystkie". */
  questionCount: number | "all";
}

export const KINDS: readonly CustomTestKind[] = ["ALL", "NEW", "MISTAKES", "DUE"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function loadRemembered(): RememberedCustomTest | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw === null) return null;
    const v: unknown = JSON.parse(raw);
    if (
      isRecord(v) &&
      v.version === 2 &&
      typeof v.all === "boolean" &&
      Array.isArray(v.actIds) &&
      v.actIds.every((id) => typeof id === "number") &&
      typeof v.kind === "string" &&
      (KINDS as readonly string[]).includes(v.kind) &&
      (typeof v.questionCount === "number" || v.questionCount === "all")
    ) {
      return {
        version: 2,
        all: v.all,
        actIds: v.actIds as number[],
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
    // Brak miejsca albo tryb prywatny: ekran działa dalej, tylko bez zapamiętywania wyboru.
  }
}
