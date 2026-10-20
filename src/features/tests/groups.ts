import type { TestActNode, TestCatalog } from "../../api/tests";

/** Akty prawne pod jednym nagłówkiem listy wyboru: dziedzina (aplikacje) albo przedmiot (Student). */
export interface ActGroup {
  id: number;
  name: string;
  acts: TestActNode[];
}

/**
 * Akty z puli użytkownika pogrupowane tak, jak je zna jego ścieżka: aplikacje po dziedzinach, Student po przedmiotach.
 * Akt, który należy do dwóch przedmiotów, pojawia się pod każdym z nich. Grupy bez aktów pomijamy.
 */
export function actGroups(catalog: TestCatalog | undefined): ActGroup[] {
  if (!catalog) return [];
  const fields = Array.isArray(catalog.fields) ? catalog.fields : [];
  if (catalog.courses.length > 0) {
    const byId = new Map(fields.flatMap((field) => field.acts).map((act) => [act.id, act] as const));
    return catalog.courses
      .map((course) => ({
        id: course.id,
        name: course.name,
        acts: course.actIds.flatMap((id) => {
          const act = byId.get(id);
          return act ? [act] : [];
        }),
      }))
      .filter((group) => group.acts.length > 0);
  }
  return fields.filter((field) => field.acts.length > 0).map((field) => ({ id: field.id, name: field.name, acts: field.acts }));
}
