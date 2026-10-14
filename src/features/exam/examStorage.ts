import type { OptionKey } from "../../api/exam";
import type { TestQueueItem } from "../../api/review";

/**
 * Niedokończony egzamin zapisany w przeglądarce, żeby odświeżenie strony albo zamknięta karta nie kasowały
 * kilkudziesięciu minut pracy. Czas egzaminu płynie dalej (jak na prawdziwym), więc po powrocie liczy się
 * pierwotny termin zakończenia. Wszystkie operacje są w try/catch: bez dostępu do pamięci egzamin działa,
 * tylko bez wznawiania.
 */
const DRAFT_KEY = "tutlaw.exam.draft.v1";
const SETTINGS_KEY = "tutlaw.exam.settings.v1";

export interface ExamDraft {
  version: 2;
  /** Adres konta, żeby cudzy niedokończony egzamin nie pojawił się po zmianie użytkownika w tej samej przeglądarce. */
  owner: string;
  scopeLabel: string;
  requestedCount: number;
  /** Próg zaliczenia w punktach z serwera; null przy zapisie sprzed stałego formatu egzaminu (wtedy go nie pokazujemy). */
  passPoints: number | null;
  timeLimitMinutes: number | null;
  questions: TestQueueItem[];
  /** cardId → wybrana odpowiedź (klucz z bazy). */
  answers: Record<string, OptionKey>;
  flagged: number[];
  currentIndex: number;
  startedAtMs: number;
  /** Moment końca czasu (ms od 1970) albo null przy egzaminie bez limitu. */
  deadlineMs: number | null;
}

const OPTION_KEYS: readonly string[] = ["A", "B", "C"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isQuestion(value: unknown): value is TestQueueItem {
  return (
    isRecord(value) &&
    typeof value.cardId === "number" &&
    typeof value.front === "string" &&
    typeof value.optionA === "string" &&
    typeof value.optionB === "string" &&
    typeof value.optionC === "string"
  );
}

/**
 * Sprawdza kształt zapisanych danych: uszkodzony zapis jest po prostu pomijany. Zapis w wersji 1 (z czasów, gdy
 * egzamin miał własny zakres i próg) da się wznowić: serwer i tak sam ocenia i ustala próg, więc te pola są odrzucane.
 */
function parseDraft(raw: string, owner: string): ExamDraft | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(value) || (value.version !== 1 && value.version !== 2) || value.owner !== owner) return null;
  if (!Array.isArray(value.questions) || value.questions.length === 0 || !value.questions.every(isQuestion)) return null;
  if (!isRecord(value.answers) || !Object.values(value.answers).every((o) => typeof o === "string" && OPTION_KEYS.includes(o))) {
    return null;
  }
  if (!Array.isArray(value.flagged) || !value.flagged.every((id) => typeof id === "number")) return null;
  if (typeof value.scopeLabel !== "string" || typeof value.requestedCount !== "number") return null;
  if (value.timeLimitMinutes !== null && typeof value.timeLimitMinutes !== "number") return null;
  if (typeof value.currentIndex !== "number" || typeof value.startedAtMs !== "number") return null;
  if (value.deadlineMs !== null && typeof value.deadlineMs !== "number") return null;
  const index = Math.min(Math.max(0, Math.trunc(value.currentIndex)), value.questions.length - 1);
  return {
    version: 2,
    owner,
    scopeLabel: value.scopeLabel,
    requestedCount: value.requestedCount,
    passPoints: value.version === 2 && typeof value.passPoints === "number" ? value.passPoints : null,
    timeLimitMinutes: value.timeLimitMinutes,
    questions: value.questions,
    answers: value.answers as Record<string, OptionKey>,
    flagged: value.flagged,
    currentIndex: index,
    startedAtMs: value.startedAtMs,
    deadlineMs: value.deadlineMs,
  };
}

export function loadDraft(owner: string): ExamDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw === null ? null : parseDraft(raw, owner);
  } catch {
    return null;
  }
}

export function saveDraft(draft: ExamDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Brak miejsca albo tryb prywatny: egzamin działa dalej, tylko bez wznawiania.
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Ignorujemy błędy pamięci przeglądarki.
  }
}

/**
 * Ostatnio użyty limit czasu egzaminu (wygoda: formularz pamięta wybór). Zakres, liczbę pytań i próg zaliczenia
 * ustala od Etapu 28 format egzaminu, więc nie są pamiętane; zapis ze starszych wersji ma je jeszcze w sobie i są pomijane.
 */
export interface RememberedExamSettings {
  /** null = bez limitu czasu. */
  timeLimitMinutes: number | null;
  /** Czy użytkownik sam ustawił czas; gdy nie, czas jest równy liczbie pytań w minutach (minuta na pytanie). */
  timeCustomised: boolean;
}

export function loadRememberedSettings(): RememberedExamSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw === null) return null;
    const v: unknown = JSON.parse(raw);
    if (
      isRecord(v) &&
      (v.timeLimitMinutes === null || typeof v.timeLimitMinutes === "number") &&
      typeof v.timeCustomised === "boolean"
    ) {
      return { timeLimitMinutes: v.timeLimitMinutes, timeCustomised: v.timeCustomised };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveRememberedSettings(settings: RememberedExamSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignorujemy błędy pamięci przeglądarki.
  }
}
