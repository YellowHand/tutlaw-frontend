import type { CustomTestKind } from "../../api/customTest";
import type { SourceGroup } from "../../lib/source";

/**
 * Ustawienia zapisanego testu przekazywane do ekranu „Własny test" (stan nawigacji), gdy użytkownik wybiera
 * „Ułóż ponownie z tymi ustawieniami".
 */
export interface CustomTestPrefill {
  fieldIds: number[];
  actIds: number[];
  /** Przedmioty Studenta (puste, gdy test układał użytkownik aplikacji albo wybrał akty). */
  courseIds: number[];
  /** Grupy źródeł, które obowiązywały przy układaniu tamtego testu (do uwagi, gdy filtr jest teraz inny). */
  sourceGroups: SourceGroup[];
  kind: CustomTestKind;
  /** O ile pytań prosił użytkownik (10, 20, 50, 100, 150 albo liczba pytań małego zakresu). */
  requestedCount: number;
}
