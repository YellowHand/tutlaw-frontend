/** „2026-10-01” → „1.10.2026” (bez przeliczania stref czasowych: data bez godziny to po prostu dzień). */
export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day}.${month}.${year}`;
}

/** „2026-10-21T10:15:00” → „21.10.2026, 10:15”. */
export function formatIsoDateTime(iso: string): string {
  const time = iso.length >= 16 ? iso.slice(11, 16) : "";
  return time ? `${formatIsoDate(iso)}, ${time}` : formatIsoDate(iso);
}
