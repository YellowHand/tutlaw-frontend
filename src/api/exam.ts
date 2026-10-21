import { api } from "./axiosInstance";
import type { TestQueueItem } from "./review";
import type { SourceKind } from "../lib/source";
import type { LawChange } from "../lib/lawChange";
import type { SourceMode } from "../lib/sourceMode";

export type OptionKey = "A" | "B" | "C";

/**
 * Egzamin ma stały format: zawsze 150 pytań z całej puli ścieżki, zaliczenie od 100 punktów. Losuje je i ocenia serwer;
 * użytkownik wybiera tylko źródło pytań (wszystkie, Ministerstwo Sprawiedliwości, autorskie) albo konkretny egzamin MS
 * z poprzedniego roku (cały arkusz) oraz czas, który liczy frontend.
 */
export interface ExamStart {
  scopeLabel: string;
  /** Ile pytań ma pełny egzamin (150); gdy w puli jest mniej, pytań jest tyle, ile dostępnych. */
  requestedCount: number;
  /** Ile punktów trzeba mieć, żeby zdać ten egzamin: 100, a przy krótszym zestawie proporcjonalnie. */
  passPoints: number;
  questions: TestQueueItem[];
}

export interface ExamAnswerPayload {
  questionId: number;
  /** null = pytanie bez odpowiedzi. */
  selectedOption: OptionKey | null;
}

/** Próg zaliczenia i zakres ustala serwer, więc w zgłoszeniu ich nie ma. */
export interface ExamSubmitPayload {
  /** null = egzamin bez limitu czasu. */
  timeLimitMinutes: number | null;
  durationSeconds: number;
  /** Czy egzamin zakończył się sam, bo skończył się czas. */
  timedOut: boolean;
  answers: ExamAnswerPayload[];
  /** Źródło, z którego losowano pytania (tylko do podpisu w historii); brak = wszystkie. */
  source?: SourceMode;
  /** Numer arkusza, gdy był to egzamin MS z wybranego roku (tylko do podpisu w historii); ma pierwszeństwo przed `source`. */
  sheetId?: number | null;
}

/** Ile pytań można teraz wylosować na egzamin z każdego źródła (bez zawężenia puli do aktów). */
export interface ExamAvailability {
  all: number;
  ministry: number;
  authored: number;
}

/** Jeden egzamin MS: arkusz jednej aplikacji z jednego roku. */
export interface ExamSheet {
  /** Numer arkusza; z nim startuje egzamin. */
  id: number;
  year: number;
  /** Ile pytań będzie na egzaminie (bez zawieszonych w testach, najwyżej 150). */
  questionCount: number;
}

/** Aplikacja z arkuszami egzaminów MS (od najnowszego roku). */
export interface ExamSheetApplication {
  trackId: number;
  slug: string;
  name: string;
  /** Skrót aplikacji, np. „Notarialna": taki jak w nazwach arkuszy. */
  shortName: string;
  /** Czy to aplikacja wybrana przez użytkownika (taka jest na liście pierwsza). */
  own: boolean;
  sheets: ExamSheet[];
}

/** Egzaminy MS do wyboru: tylko aplikacje i arkusze, z których da się teraz ułożyć egzamin. */
export interface ExamSheets {
  applications: ExamSheetApplication[];
}

export interface ExamAttempt {
  id: number;
  finishedAt: string;
  scopeLabel: string;
  questionCount: number;
  answeredCount: number;
  correctCount: number;
  /** Wynik w procentach, zaokrąglony do 0,1. */
  scorePercent: number;
  /** Próg w pełnych procentach (do wyświetlania liczy się `passPoints`, gdy jest). */
  passThresholdPercent: number;
  /**
   * Próg zaliczenia w punktach (100 z 150). null = podejście sprzed stałego formatu: miało własny próg w procentach
   * (`passThresholdPercent`) i własny zakres.
   */
  passPoints: number | null;
  passed: boolean;
  timeLimitMinutes: number | null;
  durationSeconds: number;
  timedOut: boolean;
}

export interface ExamSourceBreakdown {
  sourceName: string;
  total: number;
  correct: number;
}

export interface ExamQuestionResult {
  questionId: number;
  body: string;
  optionA: string;
  optionB: string;
  optionC: string;
  selectedOption: OptionKey | null;
  correctOption: OptionKey;
  correct: boolean;
  /** Wyjaśnienie bywa puste: nie każde pytanie ma już swoje wyjaśnienie. */
  explanation: string | null;
  legalBasis: string | null;
  validAsOf: string | null;
  sourceName: string | null;
  sourceKind: SourceKind | null;
  examYear: number | null;
  actName: string | null;
  actShortName: string | null;
  /** Zmiana w prawie dotykająca pytania (null: brak). */
  lawChange?: LawChange | null;
}

export interface ExamResult {
  attempt: ExamAttempt;
  /** Pytania, których nie dało się ocenić (usunięte albo już niedostępne); nie wliczają się do wyniku. */
  excludedCount: number;
  bySource: ExamSourceBreakdown[];
  questions: ExamQuestionResult[];
}

/**
 * Rozpoczyna egzamin. Z `sheetId` (numer arkusza z `getExamSheets`) to cały egzamin MS z wybranego roku, w oryginalnej
 * kolejności; wtedy źródło jest pomijane. Bez niego serwer losuje pytania z wybranego źródła.
 */
export async function startExam(source: SourceMode = "ALL", sheetId?: number): Promise<ExamStart> {
  const params = sheetId === undefined ? { source } : { source, sheetId };
  const res = await api.post<ExamStart>("/api/exams/start", null, { params });
  return res.data;
}

export async function getExamSheets(): Promise<ExamSheets> {
  const res = await api.get<ExamSheets>("/api/exams/sheets");
  return res.data;
}

export async function getExamAvailability(): Promise<ExamAvailability> {
  const res = await api.get<ExamAvailability>("/api/exams/availability");
  return res.data;
}

export async function submitExam(payload: ExamSubmitPayload): Promise<ExamResult> {
  const res = await api.post<ExamResult>("/api/exams/submit", payload);
  return res.data;
}

export async function getExamHistory(): Promise<ExamAttempt[]> {
  const res = await api.get<ExamAttempt[]>("/api/exams/history");
  return res.data;
}
