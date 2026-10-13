import { api } from "./axiosInstance";
import type { QuestionOrigin } from "../lib/origin";

export interface OriginFilterOption {
  origin: QuestionOrigin;
  /** Ile pytań testowych (bez ukrytych) ma to pochodzenie. */
  questionCount: number;
}

export interface OriginFilter {
  /** Wybrane pochodzenia, zawsze co najmniej jedno. */
  selected: QuestionOrigin[];
  /** Czy wybrane są wszystkie (stan domyślny, filtr niczego nie zawęża). */
  all: boolean;
  options: OriginFilterOption[];
}

/** Filtr pochodzenia pytań w Testach, zapisany na koncie. */
export async function getOriginFilter(): Promise<OriginFilter> {
  const res = await api.get<OriginFilter>("/api/me/origin-filter");
  return res.data;
}

export async function saveOriginFilter(origins: QuestionOrigin[]): Promise<OriginFilter> {
  const res = await api.put<OriginFilter>("/api/me/origin-filter", { origins });
  return res.data;
}
