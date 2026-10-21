import { api } from "./axiosInstance";
import type { SourceKind } from "../lib/source";
import type { SourceMode } from "../lib/sourceMode";
import type { LawChange } from "../lib/lawChange";

/**
 * Które pytania z wybranego zakresu mają wejść do własnego testu. LAW_CHANGE to pytania ze zmianą w prawie z ostatniego
 * roku (próg ustawia backend).
 */
export type CustomTestKind = "ALL" | "NEW" | "MISTAKES" | "DUE" | "LAW_CHANGE";

export const CUSTOM_TEST_KINDS: readonly CustomTestKind[] = ["ALL", "NEW", "MISTAKES", "DUE", "LAW_CHANGE"];

/**
 * Zakres własnego testu: suma wskazanych dziedzin, aktów prawnych, rozdziałów aktów i (Student) przedmiotów z puli
 * użytkownika. Bez żadnego z nich backend bierze całą pulę. Przedmiot zastępuje wszystkie swoje akty, a rozdział tylko
 * swoje pytania (akt wybrany w całości obejmuje też pytania bez rozdziału).
 */
export interface CustomTestScope {
  fieldIds: number[];
  actIds: number[];
  /** Przedmioty Studenta; u użytkownika aplikacji zawsze pusta lista. */
  courseIds: number[];
  /** Wybrane rozdziały aktów (np. „XIX. Przestępstwa przeciwko życiu i zdrowiu" w Kodeksie karnym). */
  sectionIds: number[];
}

export const EMPTY_SCOPE: CustomTestScope = { fieldIds: [], actIds: [], courseIds: [], sectionIds: [] };

/** Liczby pytań do wyboru. Własnej liczby nie ma (serwer przyjmuje tylko te, a przy małym zakresie „wszystkie"). */
export const COUNT_CHOICES: readonly number[] = [10, 20, 50, 100, 150];

/** Ile pytań ma każdy rodzaj w wybranym zakresie (rodzaje nakładają się, więc ich suma nie musi dawać `all`). */
export interface CustomTestCounts {
  all: number;
  newQuestions: number;
  mistakes: number;
  due: number;
  /** Pytania ze zmianą w prawie z ostatniego roku. */
  lawChanges: number;
}

export interface CustomTestSelection {
  /** Numery pytań w kolejności sesji. */
  questionIds: number[];
  /** Ile pytań spełniało warunki (z nich wylosowano `questionIds`). */
  available: number;
  requested: number;
  /** Numer zapisanego testu („Moje testy"): odpowiedzi w sesji wysyła się z tym numerem. */
  sessionId: number;
}

/**
 * Ile pytań każdego rodzaju jest w zakresie i źródle (kreator Testów, kafelki szybkich zestawów i „Losuj z całej puli";
 * bez zakresu to cała pula).
 */
export async function getCustomTestCounts(scope: CustomTestScope, source: SourceMode = "ALL"): Promise<CustomTestCounts> {
  const list = (ids: number[]) => (ids.length > 0 ? ids.join(",") : undefined);
  const res = await api.get<CustomTestCounts>("/api/review/custom-test/counts", {
    // Spring przyjmuje listę po przecinku; axios domyślnie zapisałby tablicę jako fieldIds[]=1&fieldIds[]=2.
    params: {
      fieldIds: list(scope.fieldIds),
      actIds: list(scope.actIds),
      courseIds: list(scope.courseIds),
      sectionIds: list(scope.sectionIds),
      source: source === "ALL" ? undefined : source,
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
  source: SourceMode,
  kind: CustomTestKind,
  questionCount: number
): Promise<CustomTestSelection> {
  const res = await api.post<CustomTestSelection>("/api/review/custom-test", { ...scope, source, kind, questionCount });
  return res.data;
}

/** Zapisany własny test na liście „Moje testy": ustawienia z chwili układania i wynik do tej pory. */
export interface CustomTestSessionSummary {
  id: number;
  startedAt: string;
  /** Kiedy odpowiedziano na ostatnie pytanie; null = test nieukończony. */
  finishedAt: string | null;
  finished: boolean;
  /** Opis zakresu, np. „Kodeks karny i Kodeks cywilny" albo „Cała pula". */
  scopeLabel: string;
  kind: CustomTestKind;
  fieldIds: number[];
  /** Akty wybrane wprost oraz akty wybranych przedmiotów. */
  actIds: number[];
  /** Wybrane przedmioty (Student); puste, gdy test układał użytkownik aplikacji albo wybrał akty. */
  courseIds: number[];
  /** Wybrane rozdziały aktów (puste, gdy test układano bez rozdziałów). */
  sectionIds: number[];
  /** Źródło pytań wybrane przy układaniu testu. */
  source: SourceMode;
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
  questionId: number;
  body: string;
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
  actName: string | null;
  sourceName: string | null;
  sourceKind: SourceKind | null;
  examYear: number | null;
  /** Zmiana w prawie dotykająca pytania (null: brak). */
  lawChange?: LawChange | null;
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
