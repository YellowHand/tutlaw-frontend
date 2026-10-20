import type { TestActNode, TestCounts } from "../../api/tests";
import { pluralizePl } from "../../lib/plural";

/**
 * 3052 → „3 052" (twarda spacja jako separator tysięcy).
 * Intl dla pl-PL nie grupuje liczb czterocyfrowych (zapisałby „3052"), a u konkurencji i w całej aplikacji
 * chcemy jednolicie „3 052", więc grupujemy ręcznie.
 */
export function formatCount(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Nic do rozwiązania teraz: pusta pozycja (np. dziedzina bez aktów w puli albo akt bez pytań z wybranych źródeł). */
export function isEmpty(counts: TestCounts): boolean {
  return counts.questionCount === 0;
}

export function progressPercent(counts: TestCounts): number {
  if (counts.questionCount === 0) return 0;
  return Math.min(100, Math.round((counts.solvedCount / counts.questionCount) * 100));
}

/** „3 akty prawne" pod nazwą przedmiotu Studenta. */
export function describeCourseActs(count: number): string {
  return `${count} ${pluralizePl(count, { one: "akt prawny", few: "akty prawne", many: "aktów prawnych" })}`;
}

/**
 * „3 akty prawne", „1 akt prawny", „2 zagadnienia". Dziedzina złożona z samych zagadnień (paremie, prawoznawstwo)
 * mówi o zagadnieniach, a nie o aktach.
 */
export function describeActs(acts: readonly Pick<TestActNode, "kind">[]): string {
  const count = acts.length;
  if (count > 0 && acts.every((act) => act.kind === "TOPIC")) {
    return `${count} ${pluralizePl(count, { one: "zagadnienie", few: "zagadnienia", many: "zagadnień" })}`;
  }
  return `${count} ${pluralizePl(count, { one: "akt prawny", few: "akty prawne", many: "aktów prawnych" })}`;
}
