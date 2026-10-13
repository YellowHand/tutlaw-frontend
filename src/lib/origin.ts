/**
 * Skąd pochodzi pytanie albo fiszka. Kody takie same jak w backendzie (enum QuestionOrigin),
 * polskie etykiety tylko tutaj.
 */
export type QuestionOrigin =
  | "AUTHORED"
  | "ADVOCATE_LEGAL_ADVISER"
  | "JUDGE_PROSECUTOR"
  | "NOTARY"
  | "SUPPLEMENTARY_JUDGE"
  | "BAILIFF";

export const ORIGIN_LABELS: Record<QuestionOrigin, string> = {
  AUTHORED: "Pytanie autorskie",
  ADVOCATE_LEGAL_ADVISER: "Aplikacja adwokacka i radcowska",
  JUDGE_PROSECUTOR: "Aplikacja sędziowska i prokuratorska",
  NOTARY: "Aplikacja notarialna",
  SUPPLEMENTARY_JUDGE: "Aplikacja uzupełniająca sędziowska",
  BAILIFF: "Aplikacja komornicza",
};

/** Kolejność na listach wyboru (np. filtr): autorskie na końcu. */
export const ORIGIN_ORDER: QuestionOrigin[] = [
  "ADVOCATE_LEGAL_ADVISER",
  "JUDGE_PROSECUTOR",
  "NOTARY",
  "SUPPLEMENTARY_JUDGE",
  "BAILIFF",
  "AUTHORED",
];

/**
 * Podpis pod pytaniem: „Aplikacja notarialna, 2021" albo samo „Pytanie autorskie" (autorskie nie ma roku).
 * Gdy backend nie podał pochodzenia (nieznany kod albo brak), zwraca null i nic się nie pokazuje.
 */
export function originLabel(origin: string | null | undefined, examYear: number | null | undefined): string | null {
  if (!origin || !(origin in ORIGIN_LABELS)) return null;
  const label = ORIGIN_LABELS[origin as QuestionOrigin];
  if (origin === "AUTHORED" || examYear == null) return label;
  return `${label}, ${examYear}`;
}
