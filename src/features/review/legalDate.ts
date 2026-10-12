/** "2026-10-01" → "1 października 2026". Bez przeliczania stref czasowych (data kalendarzowa, nie chwila). */
export function formatLegalDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return isoDate;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}
