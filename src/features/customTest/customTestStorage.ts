import type { CustomTestKind } from "../../api/customTest";

/**
 * Ostatnio ułożony własny test, żeby formularz pamiętał wybór (wygoda, jak przy ustawieniach egzaminu).
 * Wszystkie operacje są w try/catch: bez dostępu do pamięci przeglądarki ekran działa, tylko od zera.
 * Klucz zaczyna się od „gradus.", więc znika przy wylogowaniu (zob. clearSession).
 */
// v3: zakres to akty prawne (aplikacje) albo przedmioty (Student); `mode` mówi, który z nich, bo numery się pokrywają.
const SETTINGS_KEY = "gradus.customTest.v3";

/** Z czego składa się zapamiętany wybór: akty prawne użytkownika aplikacji albo przedmioty Studenta. */
export type RememberedMode = "acts" | "courses";

export interface RememberedCustomTest {
  version: 3;
  mode: RememberedMode;
  /** Zaznaczono wszystko: wtedy nowe pozycje też są zaznaczone, zamiast ginąć z listą numerów. */
  all: boolean;
  /** Numery zaznaczonych aktów prawnych albo przedmiotów (zależnie od `mode`); przy `all` pusta. */
  ids: number[];
  kind: CustomTestKind;
  /** Wybrana liczba pytań (10, 20, 50, 100, 150) albo „all" dla „Wszystkie". */
  questionCount: number | "all";
}

export const KINDS: readonly CustomTestKind[] = ["ALL", "NEW", "MISTAKES", "DUE", "LAW_CHANGE"];

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
      v.version === 3 &&
      (v.mode === "acts" || v.mode === "courses") &&
      typeof v.all === "boolean" &&
      Array.isArray(v.ids) &&
      v.ids.every((id) => typeof id === "number") &&
      typeof v.kind === "string" &&
      (KINDS as readonly string[]).includes(v.kind) &&
      (typeof v.questionCount === "number" || v.questionCount === "all")
    ) {
      return {
        version: 3,
        mode: v.mode,
        all: v.all,
        ids: v.ids as number[],
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
