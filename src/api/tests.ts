import { api } from "./axiosInstance";
import type { ActKind } from "./pool";
import type { SourceGroup, SourceKind } from "../lib/source";

/**
 * Liczniki dotyczą pytań z puli użytkownika i wybranych przez niego źródeł:
 * - questionCount: pytania, które może teraz rozwiązywać,
 * - solvedCount: ile z nich rozwiązał co najmniej raz w teście.
 */
export interface TestCounts {
  questionCount: number;
  solvedCount: number;
}

export interface TestActNode extends TestCounts {
  id: number;
  name: string;
  shortName: string;
  slug: string;
  kind: ActKind;
}

export interface TestFieldNode extends TestCounts {
  id: number;
  name: string;
  slug: string;
  /** Tylko akty z puli użytkownika; dziedzina bez nich jest pusta, ale nadal widoczna. */
  acts: TestActNode[];
}

export interface TestSourceNode extends TestCounts {
  id: number;
  name: string;
  kind: SourceKind;
  group: SourceGroup;
  /** Rok egzaminu; pytania autorskie go nie mają. */
  examYear: number | null;
}

export interface TestCatalog {
  /** Czy pula jest zawężona przez użytkownika do wybranych aktów. */
  narrowed: boolean;
  fields: TestFieldNode[];
  sources: TestSourceNode[];
}

/** Całe drzewo Testów (dziedzina → akt prawny) i źródła pytań jednym wywołaniem. */
export async function getTestCatalog(): Promise<TestCatalog> {
  const res = await api.get<TestCatalog>("/api/tests/catalog");
  return res.data;
}
