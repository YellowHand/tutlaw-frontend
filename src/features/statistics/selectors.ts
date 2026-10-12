import { parseLocalDate, startOfToday, toLocalDateKey } from "../../lib/date";
import type { ActivityItem, DailyCount } from "./types";

// Backend already returns a 0-100 percentage; defensively handle a 0-1
// fraction too in case this ever changes upstream.
export function normalizeRetentionRate(value: number): number {
  return value > 1 ? value : value * 100;
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

export interface HeatmapCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  isFuture: boolean;
}

export type HeatmapWeek = HeatmapCell[];

const WEEKS_IN_HEATMAP = 4;
const DAYS_IN_WEEK = 7;

function startOfWeekMonday(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diffToMonday);
  result.setHours(0, 0, 0, 0);
  return result;
}

// Builds a 4-week x 7-day grid (Mon..Sun), oldest week first, current week
// last. `activity` should cover at least the last 28 days.
export function buildHeatmap(activity: ActivityItem[]): HeatmapWeek[] {
  const countByDate = new Map(activity.map((item) => [item.date, item.reviewCount]));
  const today = startOfToday();
  const currentWeekStart = startOfWeekMonday(today);
  const gridStart = new Date(currentWeekStart);
  gridStart.setDate(gridStart.getDate() - (WEEKS_IN_HEATMAP - 1) * DAYS_IN_WEEK);

  const maxCount = Math.max(1, ...activity.map((item) => item.reviewCount), 0);

  const weeks: HeatmapWeek[] = [];
  for (let week = 0; week < WEEKS_IN_HEATMAP; week++) {
    const days: HeatmapCell[] = [];
    for (let day = 0; day < DAYS_IN_WEEK; day++) {
      const cellDate = new Date(gridStart);
      cellDate.setDate(cellDate.getDate() + week * DAYS_IN_WEEK + day);
      const dateKey = toLocalDateKey(cellDate);
      const isFuture = cellDate.getTime() > today.getTime();
      const count = isFuture ? 0 : countByDate.get(dateKey) ?? 0;
      const level = (isFuture || count === 0 ? 0 : Math.ceil((4 * count) / maxCount)) as HeatmapCell["level"];
      days.push({ date: dateKey, count, level, isFuture });
    }
    weeks.push(days);
  }
  return weeks;
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