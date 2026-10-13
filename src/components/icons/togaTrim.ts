import type { QuestionOrigin } from "../../lib/origin";

/**
 * Kolory żabotów w polskich togach (źródła: Rzeczpospolita, Bezprawnik): adwokat zielony, radca prawny
 * niebieski, sędzia fioletowy, prokurator czerwony. Odcienie są rozjaśnione pod ciemne tło aplikacji
 * (kontrast co najmniej 3:1 na canvas, surface i surface-2).
 * Notarialna i komornicza: w źródłach, które sprawdziłem, nie ma koloru togi, więc to kolory dobrane
 * przeze mnie (srebrny i miedziany). "Autorskie" ma złoto aplikacji.
 */
export const TOGA_COLORS = {
  advocate: "#35b36b",
  legalAdviser: "#4f8df0",
  judge: "#a77bf0",
  prosecutor: "#e5484d",
  authored: "#d8b13a",
  notary: "#b4b2ba",
  bailiff: "#cf8a4b",
} as const;

/** Jeden kolor = pełny żabot, dwa kolory = żabot podzielony na pół (lewa i prawa strona). */
export type TogaTrim = readonly [string] | readonly [string, string];

export const ORIGIN_TOGA_TRIM: Record<QuestionOrigin, TogaTrim> = {
  ADVOCATE_LEGAL_ADVISER: [TOGA_COLORS.advocate, TOGA_COLORS.legalAdviser],
  JUDGE_PROSECUTOR: [TOGA_COLORS.judge, TOGA_COLORS.prosecutor],
  NOTARY: [TOGA_COLORS.notary],
  SUPPLEMENTARY_JUDGE: [TOGA_COLORS.judge],
  BAILIFF: [TOGA_COLORS.bailiff],
  AUTHORED: [TOGA_COLORS.authored],
};
