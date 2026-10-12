const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("pl-PL", { weekday: "long" });
const DAY_MONTH_FORMATTER = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });
const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("pl", { numeric: "auto" });

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" });

/** „RRRR-MM-DD" jako „12 października 2026" (data kalendarzowa, bez przesunięć strefy czasowej). */
export function formatDatePl(isoDate: string): string {
  return FULL_DATE_FORMATTER.format(parseLocalDate(isoDate));
}

export function formatFullDatePl(date: Date): string {
  return `${WEEKDAY_FORMATTER.format(date)}, ${DAY_MONTH_FORMATTER.format(date)}`;
}

// Parses "YYYY-MM-DD" as a local calendar date (not UTC midnight).
export function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Formats a full ISO date-time (e.g. lastReviewAt) as a relative Polish
// phrase: "przed chwilą", "wczoraj", "3 dni temu", etc.
export function formatRelativeTimePl(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (Math.abs(diffMinutes) < 1) return "przed chwilą";
  if (Math.abs(diffMinutes) < 60) return RELATIVE_TIME_FORMATTER.format(diffMinutes, "minute");

  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (Math.abs(diffHours) < 24) return RELATIVE_TIME_FORMATTER.format(diffHours, "hour");

  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return RELATIVE_TIME_FORMATTER.format(diffDays, "day");
}