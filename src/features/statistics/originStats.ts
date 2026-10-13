import { ORIGIN_LABELS, ORIGIN_ORDER, type QuestionOrigin } from "../../lib/origin";
import { pluralizePl } from "../../lib/plural";
import type { OriginStats, OriginStatsEntry } from "./types";

/** Nazwa w liczbie mnogiej tam, gdzie mówimy o całej grupie pytań („Pytania autorskie"), reszta jak w etykietach. */
export function originGroupLabel(origin: QuestionOrigin): string {
  return origin === "AUTHORED" ? "Pytania autorskie" : ORIGIN_LABELS[origin];
}

/** Pochodzenia w kolejności z listy wyboru (aplikacje, autorskie na końcu). Brakujące w odpowiedzi są pomijane. */
export function orderedEntries(stats: OriginStats): OriginStatsEntry[] {
  const byOrigin = new Map(stats.origins.map((entry) => [entry.origin, entry]));
  return ORIGIN_ORDER.flatMap((origin) => {
    const entry = byOrigin.get(origin);
    return entry ? [entry] : [];
  });
}

/** Pierwsza aplikacja, w której są pytania (a gdy nigdzie ich nie ma, pierwsza z listy). */
export function defaultOrigin(entries: OriginStatsEntry[]): QuestionOrigin | undefined {
  return (entries.find((entry) => entry.stats.totalQuestions > 0) ?? entries[0])?.origin;
}

export function questionsWord(count: number): string {
  return pluralizePl(count, { one: "pytanie", few: "pytania", many: "pytań" });
}

export function answersWord(count: number): string {
  return pluralizePl(count, { one: "odpowiedź", few: "odpowiedzi", many: "odpowiedzi" });
}

/** „73%" albo „—", gdy nie ma z czego liczyć (brak odpowiedzi to nie 0%). */
export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${Math.round(Math.max(0, Math.min(100, value)))}%`;
}

/** Zakres lat egzaminów: „2018–2024", pojedynczy rok albo null, gdy rok nie dotyczy. */
export function yearsRange(entry: OriginStatsEntry): string | null {
  if (entry.years.length === 0) return null;
  const years = entry.years.map((y) => y.year);
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? String(min) : `${min}–${max}`;
}

/** Procent rozwiązanych pytań do paska postępu (0–100). */
export function solvedPercent(solved: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (solved * 100) / total));
}
