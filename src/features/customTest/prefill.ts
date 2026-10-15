import type { CustomTestKind } from "../../api/customTest";
import type { QuestionOrigin } from "../../lib/origin";

/**
 * Ustawienia zapisanego testu przekazywane do ekranu „Własny test" (stan nawigacji), gdy użytkownik wybiera
 * „Ułóż ponownie z tymi ustawieniami".
 */
export interface CustomTestPrefill {
  categoryIds: number[];
  subjectIds: number[];
  kind: CustomTestKind;
  /** O ile pytań prosił użytkownik (10, 20, 50, 100, 150 albo liczba pytań małego zakresu). */
  requestedCount: number;
  /** Filtr pochodzenia pytań z chwili układania; null = wszystkie pochodzenia. */
  origins: QuestionOrigin[] | null;
}
