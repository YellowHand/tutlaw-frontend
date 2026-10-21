import { api } from "./axiosInstance";
import type { ActKind } from "./pool";
import type { SourceMode } from "../lib/sourceMode";

/**
 * Liczniki dotyczą pytań z puli użytkownika i wybranego źródła (wszystkie, Ministerstwo albo autorskie):
 * - questionCount: pytania, które może teraz rozwiązywać,
 * - solvedCount: ile z nich rozwiązał co najmniej raz w teście.
 */
export interface TestCounts {
  questionCount: number;
  solvedCount: number;
}

/** Rozdział aktu (np. „XIX. Przestępstwa przeciwko życiu i zdrowiu") z liczbą pytań z wybranego źródła. */
export interface TestSectionNode {
  id: number;
  name: string;
  questionCount: number;
}

export interface TestActNode extends TestCounts {
  id: number;
  name: string;
  shortName: string;
  slug: string;
  kind: ActKind;
  /**
   * Rozdziały aktu, w których jest co rozwiązywać (pusta lista, gdy akt nie ma rozdziałów). Pytania bez rozdziału są tylko
   * w akcie jako całości, więc suma rozdziałów może być mniejsza niż `questionCount`.
   */
  sections: TestSectionNode[];
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

export interface TestCatalog {
  /** Czy pula jest zawężona przez użytkownika (aplikacje: do aktów, Student: do wybranych przedmiotów). */
  narrowed: boolean;
  fields: TestFieldNode[];
  /** Przedmioty Studenta (wybrane albo wszystkie); u użytkownika aplikacji pusta lista. */
  courses: TestCourseNode[];
}

/**
 * Drzewo do kreatora Testów (dziedzina → akt prawny → rozdział) jednym wywołaniem. `source` to źródło pytań, które liczymy
 * (bez niego wszystkie).
 */
export async function getTestCatalog(source: SourceMode = "ALL"): Promise<TestCatalog> {
  const res = await api.get<TestCatalog>("/api/tests/catalog", { params: source === "ALL" ? undefined : { source } });
  const data = res.data;
  // Starszy serwer nie zna przedmiotów ani rozdziałów: braki to puste listy.
  const fields = (Array.isArray(data.fields) ? data.fields : []).map((field) => ({
    ...field,
    acts: field.acts.map((act) => ({ ...act, sections: Array.isArray(act.sections) ? act.sections : [] })),
  }));
  return { ...data, fields, courses: Array.isArray(data.courses) ? data.courses : [] };
}
