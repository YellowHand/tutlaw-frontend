import type { Pool, PoolSourceGroup } from "../../api/pool";
import { pluralizePl } from "../../lib/plural";

export function questionsWord(count: number): string {
  return pluralizePl(count, { one: "pytanie", few: "pytania", many: "pytań" });
}

/** Grupy źródeł, które mają pytania w puli, a są wyłączone w filtrze (grupa bez pytań niczego nie zmienia). */
export function hiddenGroups(pool: Pool): PoolSourceGroup[] {
  return pool.sourceGroups.filter((group) => !group.selected && group.questionCount > 0);
}

/** Czy pula jest czymś zawężona: wybranymi aktami albo wyłączoną grupą źródeł. */
export function isPoolRestricted(pool: Pool): boolean {
  return pool.narrowed || hiddenGroups(pool).length > 0;
}

/** Wszystkie akty ścieżki w jednym zbiorze (do zaznaczania w oknie). */
export function allActIds(pool: Pool): number[] {
  return pool.fields.flatMap((field) => field.acts.map((act) => act.id));
}

/** Numery aktów aktualnie zaznaczonych w puli. */
export function selectedActIds(pool: Pool): number[] {
  return pool.fields.flatMap((field) => field.acts.filter((act) => act.selected).map((act) => act.id));
}

/** Krótki opis puli do znacznika: „Notarialna", „Notarialna, wybrane akty", „Student, 2 grupy źródeł". */
export function describePool(pool: Pool): string {
  const parts: string[] = [pool.track?.shortName ?? "bez ścieżki"];
  if (pool.narrowed) parts.push("wybrane akty");
  const hidden = hiddenGroups(pool).length;
  if (hidden > 0) parts.push("filtr źródeł");
  return parts.join(", ");
}
