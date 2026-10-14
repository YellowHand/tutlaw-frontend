import { api } from "./axiosInstance";

/** Które pytania z wybranych działów mają wejść do własnego testu. */
export type CustomTestKind = "ALL" | "NEW" | "MISTAKES" | "DUE";

/**
 * Zakres własnego testu: suma wskazanych rodzajów (kategorii) i aktów prawnych (przedmiotów).
 * Bez żadnego z nich backend bierze cały dostępny materiał. Lata egzaminu są opcjonalne.
 */
export interface CustomTestScope {
  categoryIds: number[];
  subjectIds: number[];
  yearFrom: number | null;
  yearTo: number | null;
}

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
}

/** Krok 1: podgląd „Dostępnych: N" przy układaniu testu. */
export async function getCustomTestCounts(scope: CustomTestScope): Promise<CustomTestCounts> {
  const res = await api.get<CustomTestCounts>("/api/review/custom-test/counts", {
    // Spring przyjmuje listę po przecinku; axios domyślnie zapisałby tablicę jako categoryIds[]=1&categoryIds[]=2.
    params: {
      categoryIds: scope.categoryIds.length > 0 ? scope.categoryIds.join(",") : undefined,
      subjectIds: scope.subjectIds.length > 0 ? scope.subjectIds.join(",") : undefined,
      yearFrom: scope.yearFrom ?? undefined,
      yearTo: scope.yearTo ?? undefined,
    },
  });
  return res.data;
}

/** Krok 2: losuje numery pytań. Sesję otwiera się potem zwykłą kolejką ćwiczeń (getPracticeQueue). */
export async function drawCustomTest(
  scope: CustomTestScope,
  kind: CustomTestKind,
  questionCount: number
): Promise<CustomTestSelection> {
  const res = await api.post<CustomTestSelection>("/api/review/custom-test", { ...scope, kind, questionCount });
  return res.data;
}
