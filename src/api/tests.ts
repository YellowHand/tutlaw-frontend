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
  /** Tylko akty z puli użytkownika (dziedziny bez żadnego aktu w puli backend pomija). */
  acts: TestActNode[];
}

/**
 * Przedmiot Studenta z licznikami. Przedmioty się nakładają (ten sam akt w dwóch przedmiotach liczy się w obu), więc ich
 * liczniki nie sumują się do puli.
 */
export interface TestCourseNode extends TestCounts {
  id: number;
  name: string;
  slug: string;
  /** Akty prawne przedmiotu (z nich składa się jego strona w Testach). */
  actIds: number[];
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
  /** Czy pula jest zawężona przez użytkownika (aplikacje: do aktów, Student: do wybranych przedmiotów). */
  narrowed: boolean;
  fields: TestFieldNode[];
  /** Przedmioty Studenta (wybrane albo wszystkie); u użytkownika aplikacji pusta lista. */
  courses: TestCourseNode[];
  sources: TestSourceNode[];
}

/** Całe drzewo Testów (dziedzina → akt prawny) i źródła pytań jednym wywołaniem. */
export async function getTestCatalog(): Promise<TestCatalog> {
  const res = await api.get<TestCatalog>("/api/tests/catalog");
  // Starszy serwer nie zna przedmiotów: brak `courses` to to samo co pusta lista (ścieżka aplikacji).
  return res.data.courses ? res.data : { ...res.data, courses: [] };
}
