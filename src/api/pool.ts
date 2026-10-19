import { api } from "./axiosInstance";
import type { Track } from "./tracks";
import type { SourceGroup } from "../lib/source";

/** Rodzaj aktu: ACT to ustawa lub rozporządzenie, TOPIC to zagadnienie bez aktu (np. paremie, prawoznawstwo). */
export type ActKind = "ACT" | "TOPIC";

export interface PoolAct {
  id: number;
  name: string;
  shortName: string;
  kind: ActKind;
  /** Pytania aktu ze wszystkich źródeł. */
  questionCount: number;
  selected: boolean;
}

export interface PoolField {
  id: number;
  name: string;
  slug: string;
  /** Akty prawne ścieżki w tej dziedzinie; pusta lista, gdy ścieżka nie ma tu żadnego aktu. */
  acts: PoolAct[];
}

export interface PoolSourceGroup {
  code: SourceGroup;
  selected: boolean;
  /** Pytania grupy w aktach puli przed filtrem; 0 = grupa nic nie da. */
  questionCount: number;
}

/**
 * Pula pytań użytkownika: ścieżka, zawężenie do wybranych aktów i filtr źródeł. Każdy widzi wszystkie dziedziny,
 * ale tylko akty swojej ścieżki.
 */
export interface Pool {
  track: Track | null;
  /** Czy użytkownik zawęził pulę do wybranych aktów (bez tego obowiązują wszystkie akty ścieżki). */
  narrowed: boolean;
  /** Pytania w puli po zawężeniu i filtrze źródeł. */
  questionCount: number;
  fields: PoolField[];
  sourceGroups: PoolSourceGroup[];
}

export interface SourceFilterUpdate {
  ownSheets: boolean;
  otherSheets: boolean;
  authored: boolean;
}

export async function getPool(): Promise<Pool> {
  const res = await api.get<Pool>("/api/me/pool");
  return res.data;
}

/** Zawęża pulę do wybranych aktów; pusta lista (albo wszystkie akty ścieżki) zdejmuje zawężenie. */
export async function updatePoolActs(actIds: number[]): Promise<Pool> {
  const res = await api.put<Pool>("/api/me/pool/acts", { actIds });
  return res.data;
}

/** Filtr źródeł w Testach; co najmniej jedna grupa musi zostać włączona. */
export async function updateSourceFilter(filter: SourceFilterUpdate): Promise<Pool> {
  const res = await api.put<Pool>("/api/me/pool/source-filter", filter);
  return res.data;
}
