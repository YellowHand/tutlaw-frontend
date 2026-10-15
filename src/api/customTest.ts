import { api } from "./axiosInstance";
import type { QuestionOrigin } from "../lib/origin";

/** Które pytania z wybranych działów mają wejść do własnego testu. */
export type CustomTestKind = "ALL" | "NEW" | "MISTAKES" | "DUE";

/**
 * Zakres własnego testu: suma wskazanych rodzajów (kategorii) i aktów prawnych (przedmiotów).
 * Bez żadnego z nich backend bierze cały dostępny materiał.
 */
export interface CustomTestScope {
  categoryIds: number[];
  subjectIds: number[];
}

/** Liczby pytań do wyboru. Własnej liczby nie ma (serwer przyjmuje tylko te, a przy małym zakresie „wszystkie"). */
export const COUNT_CHOICES: readonly number[] = [10, 20, 50, 100, 150];

/** Ile pytań ma każdy rodzaj w wybranym zakresie (rodzaje nakładają się, więc ich suma nie musi dawać `all`). */
export interface CustomTestCounts {
  all: number;
  newQuestions: number;
  mistakes: number;
  due: number;
}

export interface CustomTestSelection {
  /** Numery pytań w kolejności sesji. */
  cardIds: number[];
  /** Ile pytań spełniało warunki (z nich wylosowano `cardIds`). */
  available: number;
  requested: number;
  /** Numer zapisanego testu („Moje testy"): odpowiedzi w sesji wysyła się z tym numerem. */
  sessionId: number;
}

/** Krok 1: podgląd „Dostępnych: N" przy układaniu testu. */
export async function getCustomTestCounts(scope: CustomTestScope): Promise<CustomTestCounts> {
  const res = await api.get<CustomTestCounts>("/api/review/custom-test/counts", {
    // Spring przyjmuje listę po przecinku; axios domyślnie zapisałby tablicę jako categoryIds[]=1&categoryIds[]=2.
    params: {
      categoryIds: scope.categoryIds.length > 0 ? scope.categoryIds.join(",") : undefined,
      subjectIds: scope.subjectIds.length > 0 ? scope.subjectIds.join(",") : undefined,
    },
  });
  return res.data;
}

/**
 * Krok 2: losuje numery pytań i od razu zapisuje test („Moje testy", jako nieukończony do ostatniej odpowiedzi).
 * Sesję otwiera się potem zwykłą kolejką ćwiczeń (getPracticeQueue).
 */
export async function drawCustomTest(
  scope: CustomTestScope,
  kind: CustomTestKind,
  questionCount: number
): Promise<CustomTestSelection> {
  const res = await api.post<CustomTestSelection>("/api/review/custom-test", { ...scope, kind, questionCount });
  return res.data;
}

/** Zapisany własny test na liście „Moje testy": ustawienia z chwili układania i wynik do tej pory. */
export interface CustomTestSessionSummary {
  id: number;
  startedAt: string;
  /** Kiedy odpowiedziano na ostatnie pytanie; null = test nieukończony. */
  finishedAt: string | null;
  finished: boolean;
  /** Opis zakresu, np. „Kodeks karny i Kodeks cywilny" albo „Cały materiał". */
  scopeLabel: string;
  kind: CustomTestKind;
  categoryIds: number[];
  subjectIds: number[];
  /** Filtr pochodzenia pytań obowiązujący, gdy układano test; null = wszystkie pochodzenia. */
  origins: QuestionOrigin[] | null;
  requestedCount: number;
  questionCount: number;
  answeredCount: number;
  correctCount: number;
  guessedCount: number;
  /** Suma czasu odpowiadania w sekundach (pojedyncza odpowiedź najwyżej 120 s). */
  timeSeconds: number;
}

export interface CustomTestSessionQuestion {
  position: number;
  cardId: number;
  front: string;
  optionA: string;
  optionB: string;
  optionC: string;
  correctOption: "A" | "B" | "C";
  /** Odpowiedź użytkownika pod oryginalnym kluczem z bazy; null = nie odpowiedział. */
  selectedOption: "A" | "B" | "C" | null;
  correct: boolean | null;
  guessed: boolean;
  timeSeconds: number | null;
  explanation: string | null;
  legalBasis: string | null;
  validAsOf: string | null;
  sourceName: string | null;
  origin: QuestionOrigin;
  examYear: number | null;
}

export interface CustomTestSessionDetail {
  summary: CustomTestSessionSummary;
  questions: CustomTestSessionQuestion[];
}

/** Ostatnie 50 własnych testów, od najnowszego. */
export async function listCustomTestSessions(): Promise<CustomTestSessionSummary[]> {
  const res = await api.get<CustomTestSessionSummary[]>("/api/custom-tests/sessions");
  return res.data;
}

export async function getCustomTestSession(id: number): Promise<CustomTestSessionDetail> {
  const res = await api.get<CustomTestSessionDetail>(`/api/custom-tests/sessions/${id}`);
  return res.data;
}
