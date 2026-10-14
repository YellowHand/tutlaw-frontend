const PERCENT_FORMATTER = new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** 74.7 → „74,7%", 75 → „75%". */
export function formatPercent(value: number): string {
  return `${PERCENT_FORMATTER.format(value)}%`;
}

/** Zegar egzaminu: „1:05:09" od godziny wzwyż, w przeciwnym razie „05:09". */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Czas słowami do raportu: „1 godz. 56 min", „12 min 5 s", „40 s". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return m > 0 ? `${h} godz. ${m} min` : `${h} godz.`;
  if (m > 0) return s > 0 && m < 10 ? `${m} min ${s} s` : `${m} min`;
  return `${s} s`;
}

/** „12 października 2026, 18:30" z daty i godziny zwróconej przez serwer (bez strefy). */
export function formatDateTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return Number.isNaN(date.getTime()) ? isoDateTime : DATE_TIME_FORMATTER.format(date);
}

/** Stały format egzaminu (zob. ExamStart): tyle pytań i tyle punktów do zaliczenia; liczy je serwer, tu tylko opisy. */
export const EXAM_QUESTION_COUNT = 150;
export const EXAM_PASS_POINTS = 100;

/**
 * Ile poprawnych odpowiedzi trzeba było mieć w podejściu sprzed stałego formatu, które miało próg w procentach
 * (przy dokładnym porównaniu, bez zaokrągleń).
 */
export function pointsNeeded(total: number, thresholdPercent: number): number {
  return Math.ceil((total * thresholdPercent) / 100);
}
