/**
 * Demo pytania na stronie głównej. Reguły są takie same jak w prawdziwej aplikacji
 * (backend: ReviewPolicy.testRating i odblokowanie fiszki po "pewnej pomyłce"):
 *   poprawna i pewna      -> "Znam", pytanie wraca po dłuższej przerwie
 *   poprawna, ale niepewna -> "Nie pamiętam", szybki powrót
 *   błędna i pewna        -> "Nie pamiętam" + fiszka
 *   błędna i niepewna     -> "Nie pamiętam", bez fiszki
 */
export type DemoAnswer = "a" | "b" | "c";

export const DEMO_CORRECT: DemoAnswer = "b";

export type DemoOutcomeId = "ok-sure" | "ok-unsure" | "bad-sure" | "bad-unsure";
export type DemoTone = "ok" | "warn" | "bad";

export const DEMO_TONE: Record<DemoOutcomeId, DemoTone> = {
  "ok-sure": "ok",
  "ok-unsure": "warn",
  "bad-sure": "bad",
  "bad-unsure": "warn",
};

export function demoOutcomeId(answer: DemoAnswer, unsure: boolean): DemoOutcomeId {
  if (answer === DEMO_CORRECT) return unsure ? "ok-unsure" : "ok-sure";
  return unsure ? "bad-unsure" : "bad-sure";
}
