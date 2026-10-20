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
  /** Akty prawne ścieżki w tej dziedzinie (dziedziny bez aktów w puli backend pomija). */
  acts: PoolAct[];
}

/** Przedmiot do wyboru na ścieżce Student (pytania jego aktów ze wszystkich źródeł). */
export interface PoolCourse {
  id: number;
  name: string;
  slug: string;
  questionCount: number;
  /** Czy przedmiot jest w puli: bez własnego wyboru studenta w puli są wszystkie przedmioty. */
  selected: boolean;
}

export interface PoolSourceGroup {
  code: SourceGroup;
  selected: boolean;
  /** Pytania grupy w aktach puli przed filtrem; 0 = grupa nic nie da. */
  questionCount: number;
}

/**
 * Pula pytań użytkownika: ścieżka, zawężenie i filtr źródeł. Aplikacja zawęża pulę do aktów (dziedziny z aktami
 * ścieżki), Student do przedmiotów (`courses`; `fields` jest u niego puste).
 */
export interface Pool {
  track: Track | null;
  /** Czy użytkownik zawęził pulę do wybranych aktów albo, jako Student, przedmiotów (bez tego obowiązuje wszystko). */
  narrowed: boolean;
  /** Pytania w puli po zawężeniu i filtrze źródeł. */
  questionCount: number;
  fields: PoolField[];
  /** Przedmioty do wyboru; tylko na ścieżce Student, na pozostałych pusta lista. */
  courses: PoolCourse[];
  sourceGroups: PoolSourceGroup[];
}

export interface SourceFilterUpdate {
  ownSheets: boolean;
  otherSheets: boolean;
  authored: boolean;
}

/** Odpowiedź starszego serwera nie ma `courses`: traktujemy to jak brak przedmiotów (ścieżka aplikacji). */
function withCourses(pool: Pool): Pool {
  return pool.courses ? pool : { ...pool, courses: [] };
}

export async function getPool(): Promise<Pool> {
  const res = await api.get<Pool>("/api/me/pool");
  return withCourses(res.data);
}

/** Zawęża pulę do wybranych aktów; pusta lista (albo wszystkie akty ścieżki) zdejmuje zawężenie. */
export async function updatePoolActs(actIds: number[]): Promise<Pool> {
  const res = await api.put<Pool>("/api/me/pool/acts", { actIds });
  return withCourses(res.data);
}

/** Student wybiera przedmioty; pusta lista (albo wszystkie przedmioty) zdejmuje wybór, czyli w puli są wszystkie. */
export async function updatePoolCourses(courseIds: number[]): Promise<Pool> {
  const res = await api.put<Pool>("/api/me/pool/courses", { courseIds });
  return withCourses(res.data);
}

/** Filtr źródeł w Testach; co najmniej jedna grupa musi zostać włączona. */
export async function updateSourceFilter(filter: SourceFilterUpdate): Promise<Pool> {
  const res = await api.put<Pool>("/api/me/pool/source-filter", filter);
  return withCourses(res.data);
}
