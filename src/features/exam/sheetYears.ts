import type { ExamSheetApplication } from "../../api/exam";

/**
 * Lata do pokazania w siatce: od najnowszego do najstarszego roku, który ma arkusz w którejkolwiek aplikacji, bez dziur.
 * Dzięki temu siatka wygląda tak samo po przełączeniu aplikacji, a rok bez arkusza w wybranej aplikacji widać jako „brak".
 */
export function sheetYears(applications: readonly ExamSheetApplication[]): number[] {
  const years = applications.flatMap((app) => app.sheets.map((sheet) => sheet.year));
  if (years.length === 0) return [];
  const newest = Math.max(...years);
  const oldest = Math.min(...years);
  return Array.from({ length: newest - oldest + 1 }, (_, i) => newest - i);
}
