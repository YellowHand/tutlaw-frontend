import { ORIGIN_LABELS, ORIGIN_ORDER, type QuestionOrigin } from "../../lib/origin";
import { pluralizePl } from "../../lib/plural";
import type { OriginMetrics, OriginStats, OriginStatsEntry } from "./types";

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

/** Zakres widoku opanowania: jedna aplikacja albo wszystkie razem. */
export type MasteryScope = QuestionOrigin | "ALL";

/** Sumuje liczby ze wszystkich pochodzeń. Skuteczność z 30 dni nie ma z czego się policzyć, więc jest pusta. */
export function sumMetrics(entries: OriginStatsEntry[]): OriginMetrics {
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
export function masterySplit(metrics: Pick<OriginMetrics, "totalQuestions" | "solvedQuestions" | "matureQuestions">): MasterySplit {
  const total = Math.max(0, metrics.totalQuestions);
  const solved = Math.min(Math.max(0, metrics.solvedQuestions), total);
  const mastered = Math.min(Math.max(0, metrics.matureQuestions), solved);
  return { total, mastered, learning: solved - mastered, fresh: total - solved };
}
