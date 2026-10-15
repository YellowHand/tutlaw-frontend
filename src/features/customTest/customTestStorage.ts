import type { CustomTestKind } from "../../api/customTest";

/**
 * Ostatnio ułożony własny test, żeby formularz pamiętał wybór (wygoda, jak przy ustawieniach egzaminu).
 * Wszystkie operacje są w try/catch: bez dostępu do pamięci przeglądarki ekran działa, tylko od zera.
 * Klucz zaczyna się od „tutlaw.", więc znika przy wylogowaniu (zob. clearSession).
 */
const SETTINGS_KEY = "tutlaw.customTest.v1";

export interface RememberedCustomTest {
  version: 1;
  /** Zaznaczono wszystko: wtedy nowe działy też są zaznaczone, zamiast ginąć z listą numerów. */
  all: boolean;
  /** Zaznaczone akty prawne (przedmioty); przy `all` pusta. */
  subjectIds: number[];
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
      v.version === 1 &&
      typeof v.all === "boolean" &&
      Array.isArray(v.subjectIds) &&
      v.subjectIds.every((id) => typeof id === "number") &&
      typeof v.kind === "string" &&
      (KINDS as readonly string[]).includes(v.kind) &&
      (typeof v.questionCount === "number" || v.questionCount === "all")
    ) {
      // Pola z latami z wcześniejszej wersji ekranu są ignorowane: lat egzaminu już się nie wybiera.
      return {
        version: 1,
        all: v.all,
        subjectIds: v.subjectIds as number[],
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
