import type { TestCounts } from "../../api/tests";
import { pluralizePl } from "../../lib/plural";

/**
 * 3052 → „3 052" (twarda spacja jako separator tysięcy).
 * Intl dla pl-PL nie grupuje liczb czterocyfrowych (zapisałby „3052"), a u konkurencji i w całej aplikacji
 * chcemy jednolicie „3 052", więc grupujemy ręcznie.
 */
export function formatCount(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

/** Nic do rozwiązania teraz i nic do odblokowania: pusta pozycja (np. dział, który jeszcze nie ma pytań). */
export function isEmpty(counts: TestCounts): boolean {
  return counts.questionCount === 0 && counts.lockedCount === 0;
}

export function progressPercent(counts: TestCounts): number {
  if (counts.questionCount === 0) return 0;
  return Math.min(100, Math.round((counts.solvedCount / counts.questionCount) * 100));
}

/**
 * „3 akty prawne", „1 przedmiot". Dla nieznanej etykiety (dodanej później w bazie) bez odmiany: „Ustawy: 3".
 */
export function describeItems(count: number, itemsLabel: string): string {
  const label = itemsLabel.trim().toLowerCase();
  if (label === "akty prawne") {
    return `${count} ${pluralizePl(count, { one: "akt prawny", few: "akty prawne", many: "aktów prawnych" })}`;
  }
  if (label === "przedmioty") {
    return `${count} ${pluralizePl(count, { one: "przedmiot", few: "przedmioty", many: "przedmiotów" })}`;
  }
  return `${itemsLabel.trim()}: ${count}`;
}
