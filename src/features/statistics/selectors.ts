import { parseLocalDate, startOfToday, toLocalDateKey } from "../../lib/date";
import type { ActivityItem, DailyCount } from "./types";

// Backend zwraca procent w skali 0–100 (albo null = brak danych). Wcześniej wartości do 1 były mnożone przez 100
// "na wszelki wypadek", przez co np. 1% pokazywało się jako 100%; backend jest jedynym źródłem, więc tego już nie robimy.
export function normalizeRetentionRate(value: number | null): number | null {
  if (value === null) return null;
  return Math.max(0, Math.min(100, value));
}

// Assumes the backend forecast already folds overdue cards into "today"
// (see StatisticsService.calculateForecast) — if that ever changes, this
// would need a separate "overdue" field from the API.
export function getDueToday(upcomingReviews: DailyCount[]): number {
  const todayKey = toLocalDateKey(new Date());
  return upcomingReviews.find((item) => item.date === todayKey)?.count ?? 0;
}

const WEEKDAY_SHORT_PL = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

export interface ForecastBar {
  date: string;
  count: number;
  dayLabel: string;
}

// NOTE: the backend forecast window is 7 days including today, so "from
// tomorrow" can only show the remaining 6 days here. Extend the backend
// window to 8 days if you want a full 7 bars strictly after today.
export function getNextDaysForecast(upcomingReviews: DailyCount[]): ForecastBar[] {
  return upcomingReviews.slice(1).map((item) => {
    const date = parseLocalDate(item.date);
    return { date: item.date, count: item.count, dayLabel: WEEKDAY_SHORT_PL[date.getDay()] };
  });
}

const DAYS_IN_WEEK = 7;

function startOfWeekMonday(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diffToMonday);
  result.setHours(0, 0, 0, 0);
  return result;
}

export interface ActivityDay {
  date: string;
  count: number;
  /** Czy to dzisiaj (dzień jeszcze trwa, więc jego słupek może urosnąć). */
  isToday: boolean;
}

/**
 * Ostatnie `days` dni (najstarszy pierwszy, dzisiaj ostatni) z liczbą odpowiedzi. Dni bez wpisu w odpowiedzi serwera
 * to zero odpowiedzi, więc wykres nie ma dziur i zawsze pokazuje pełne okno.
 */
export function lastDays(activity: ActivityItem[], days = 28): ActivityDay[] {
  const countByDate = new Map(activity.map((item) => [item.date, item.reviewCount]));
  const today = startOfToday();
  const result: ActivityDay[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const day = new Date(today);
    day.setDate(day.getDate() - offset);
    const key = toLocalDateKey(day);
    result.push({ date: key, count: countByDate.get(key) ?? 0, isToday: offset === 0 });
  }
  return result;
}

/** Suma odpowiedzi z dni `from`..`to` (włącznie) licząc wstecz od dzisiaj: 0 = dzisiaj, 1 = wczoraj. */
export function sumDaysAgo(days: ActivityDay[], from: number, to: number): number {
  let total = 0;
  for (let i = from; i <= to; i++) {
    total += days[days.length - 1 - i]?.count ?? 0;
  }
  return total;
}

// Consecutive days with reviewCount > 0, counted backwards from today. If
// today has no reviews yet, start from yesterday so the streak doesn't look
// broken before the day is over.
export function getStreak(activity: ActivityItem[]): number {
  const countByDate = new Map(activity.map((item) => [item.date, item.reviewCount]));
  const today = startOfToday();
  const todayCount = countByDate.get(toLocalDateKey(today)) ?? 0;

  const cursor = new Date(today);
  if (todayCount === 0) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (true) {
    const count = countByDate.get(toLocalDateKey(cursor)) ?? 0;
    if (count <= 0) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getThisWeekTotal(activity: ActivityItem[]): number {
  const countByDate = new Map(activity.map((item) => [item.date, item.reviewCount]));
  const today = startOfToday();
  const weekStart = startOfWeekMonday(today);

  let total = 0;
  for (let i = 0; i < DAYS_IN_WEEK; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    if (day.getTime() > today.getTime()) break;
    total += countByDate.get(toLocalDateKey(day)) ?? 0;
  }
  return total;
}