import { SOURCE_GROUP_LABELS, SOURCE_GROUP_ORDER, type SourceGroup } from "../../lib/source";
import { pluralizePl } from "../../lib/plural";
import type { SourceGroupEntry, SourceMetrics, SourceStats } from "./types";

/** Nazwa grupy źródeł do list i nagłówków („Moje arkusze", „Pytania autorskie"). */
export function sourceGroupLabel(group: SourceGroup): string {
  return SOURCE_GROUP_LABELS[group];
}

/** Grupy w stałej kolejności (moje arkusze, arkusze innych ścieżek, autorskie). Brakujące w odpowiedzi są pomijane. */
export function orderedGroups(stats: SourceStats): SourceGroupEntry[] {
  const byGroup = new Map(stats.groups.map((entry) => [entry.group, entry]));
  return SOURCE_GROUP_ORDER.flatMap((group) => {
    const entry = byGroup.get(group);
    return entry ? [entry] : [];
  });
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

/** Zakres lat egzaminów w grupie: „2018–2024", pojedynczy rok albo null, gdy żadne źródło nie ma roku. */
export function yearsRange(entry: SourceGroupEntry): string | null {
  const years = entry.sources.flatMap((source) => (source.examYear === null ? [] : [source.examYear]));
  if (years.length === 0) return null;
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? String(min) : `${min}–${max}`;
}

/** Zakres widoku opanowania: jedna grupa źródeł albo cała pula. */
export type MasteryScope = SourceGroup | "ALL";

/** Sumuje liczby ze wszystkich grup. Skuteczność z 30 dni nie ma z czego się policzyć, więc jest pusta. */
export function sumMetrics(entries: SourceGroupEntry[]): SourceMetrics {
  const sum = entries.reduce(
    (acc, { stats }) => ({
      totalQuestions: acc.totalQuestions + stats.totalQuestions,
      solvedQuestions: acc.solvedQuestions + stats.solvedQuestions,
      matureQuestions: acc.matureQuestions + stats.matureQuestions,
      dueQuestions: acc.dueQuestions + stats.dueQuestions,
      answers: acc.answers + stats.answers,
      correctAnswers: acc.correctAnswers + stats.correctAnswers,
      answersLast30Days: acc.answersLast30Days + stats.answersLast30Days,
      confidentMistakesLast30Days: acc.confidentMistakesLast30Days + stats.confidentMistakesLast30Days,
    }),
    {
      totalQuestions: 0,
      solvedQuestions: 0,
      matureQuestions: 0,
      dueQuestions: 0,
      answers: 0,
      correctAnswers: 0,
      answersLast30Days: 0,
      confidentMistakesLast30Days: 0,
    }
  );
  return {
    ...sum,
    accuracyRate: sum.answers > 0 ? (sum.correctAnswers * 100) / sum.answers : null,
    accuracyLast30Days: null,
  };
}

/** Podział wszystkich pytań na opanowane, w nauce (rozwiązane, jeszcze nieopanowane) i nowe (jeszcze nierozwiązane). */
export interface MasterySplit {
  total: number;
  mastered: number;
  learning: number;
  fresh: number;
}

/** Liczby są obcinane do sensownych zakresów (opanowane ≤ rozwiązane ≤ wszystkie), żeby trzy części zawsze dawały całość. */
export function masterySplit(metrics: Pick<SourceMetrics, "totalQuestions" | "solvedQuestions" | "matureQuestions">): MasterySplit {
  const total = Math.max(0, metrics.totalQuestions);
  const solved = Math.min(Math.max(0, metrics.solvedQuestions), total);
  const mastered = Math.min(Math.max(0, metrics.matureQuestions), solved);
  return { total, mastered, learning: solved - mastered, fresh: total - solved };
}
