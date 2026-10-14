import type { LearningSettings } from "../../api/settings";

/** Sufit limitu automatycznego, gdyby serwer nie podał go w planie (starsza odpowiedź). Taki sam jak na serwerze. */
export const FALLBACK_MAX_NEW_PER_DAY = 100;

/**
 * Czego brakuje do tego, żeby zdążyć z nowymi pytaniami przed ostatnimi dwoma tygodniami:
 * - `raise`: użytkownik ma własny limit niższy niż potrzeba, a potrzeba mieści się w rozsądnym maksimum, więc wystarczy go podnieść;
 * - `unreachable`: potrzeba więcej niż rozsądne maksimum (powyżej niego powtórki rosną szybciej, niż da się je robić),
 *   więc podniesienie limitu niczego nie załatwi i trzeba to powiedzieć wprost.
 */
export type LimitIssue =
  | { kind: "raise"; required: number; limit: number }
  | { kind: "unreachable"; required: number; max: number; limit: number; auto: boolean };

function finitePositive(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

/** Ile nowych pytań dziennie trzeba, żeby zdążyć (0, gdy nie ma planu albo jesteśmy w rezerwie na powtórki). */
export function requiredPerDay(settings: LearningSettings): number {
  const plan = settings.plan;
  if (!plan || plan.planningDays <= 0) return 0;
  return finitePositive(plan.requiredTestQuestionsPerDay) ?? finitePositive(plan.suggestedTestQuestionsPerDay) ?? 0;
}

/** Sufit limitu automatycznego z planu (albo domyślny, gdy serwer go nie podał). */
export function maxPerDay(settings: LearningSettings): number {
  return finitePositive(settings.plan?.maxTestQuestionsPerDay) ?? FALLBACK_MAX_NEW_PER_DAY;
}

/**
 * Ocena limitu nowych pytań względem planu. Przy limicie automatycznym podniesienie niczego nie da, więc jedyny problem
 * to „nie zdążysz mimo sufitu". Własny limit niższy niż potrzeba to `raise` albo, gdy nawet maksimum by nie wystarczyło,
 * `unreachable`. Własny limit, który wystarcza, nie jest problemem.
 */
export function limitIssue(settings: LearningSettings): LimitIssue | null {
  const required = requiredPerDay(settings);
  if (required <= 0) return null;

  const max = maxPerDay(settings);
  const limit = settings.newTestQuestionsPerDay;
  const auto = settings.newTestQuestionsAuto !== false;

  if (!auto && limit >= required) return null;
  if (required > max) return { kind: "unreachable", required, max, limit, auto };
  if (!auto) return { kind: "raise", required, limit };
  return null;
}
