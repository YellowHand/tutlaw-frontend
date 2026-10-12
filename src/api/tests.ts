import { api } from "./axiosInstance";
import type { SourceType } from "./sources";

/**
 * Liczniki dotyczą pytań testowych (kart z trzema odpowiedziami) i są liczone dla zalogowanego użytkownika:
 * - questionCount: pytania, które może teraz rozwiązywać (pule płaskie i przeczytane rozdziały),
 * - solvedCount: ile z nich rozwiązał co najmniej raz w teście,
 * - lockedCount: pytania z nieprzeczytanych rozdziałów podręczników (odblokują się po przeczytaniu).
 */
export interface TestCounts {
  questionCount: number;
  solvedCount: number;
  lockedCount: number;
}

export interface TestSourceNode extends TestCounts {
  id: number;
  name: string;
  sourceType: SourceType;
}

export interface TestSubjectNode extends TestCounts {
  id: number;
  name: string;
  slug: string;
  sources: TestSourceNode[];
}

export interface TestCategoryNode extends TestCounts {
  id: number;
  name: string;
  slug: string;
  itemsLabel: string;
  sortOrder: number;
  subjects: TestSubjectNode[];
}

export interface TestCatalog {
  categories: TestCategoryNode[];
}

/** Całe drzewo Testów (rodzaj → przedmiot/akt prawny → źródło) jednym wywołaniem. */
export async function getTestCatalog(): Promise<TestCatalog> {
  const res = await api.get<TestCatalog>("/api/tests/catalog");
  return res.data;
}
