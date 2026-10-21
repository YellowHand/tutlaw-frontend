import type { Pool } from "../../api/pool";
import { pluralizePl } from "../../lib/plural";

export function questionsWord(count: number): string {
  return pluralizePl(count, { one: "pytanie", few: "pytania", many: "pytań" });
}

/** Czy zakres nauki jest zawężony przez użytkownika: wybranymi aktami (Student: przedmiotami). */
export function isPoolRestricted(pool: Pool): boolean {
  return pool.narrowed;
}

/** Czy użytkownik jest na ścieżce Student: uczy się z przedmiotów, a nie z listy aktów. */
export function isStudentPool(pool: Pool): boolean {
  return pool.track?.kind === "STUDENT";
}

/** Wszystkie przedmioty do wyboru (Student). */
export function allCourseIds(pool: Pool): number[] {
  return pool.courses.map((course) => course.id);
}

/** Numery przedmiotów aktualnie w puli (bez własnego wyboru: wszystkie). */
export function selectedCourseIds(pool: Pool): number[] {
  return pool.courses.filter((course) => course.selected).map((course) => course.id);
}

/** Wszystkie akty ścieżki w jednym zbiorze (do zaznaczania w oknie). */
export function allActIds(pool: Pool): number[] {
  return pool.fields.flatMap((field) => field.acts.map((act) => act.id));
}

/** Numery aktów aktualnie zaznaczonych w puli. */
export function selectedActIds(pool: Pool): number[] {
  return pool.fields.flatMap((field) => field.acts.filter((act) => act.selected).map((act) => act.id));
}

/** Krótki opis zakresu nauki: „Notarialna", „Notarialna, wybrane akty", „Student, wybrane przedmioty". */
export function describePool(pool: Pool): string {
  const parts: string[] = [pool.track?.shortName ?? "bez ścieżki"];
  if (pool.narrowed) parts.push(isStudentPool(pool) ? "wybrane przedmioty" : "wybrane akty");
  return parts.join(", ");
}
