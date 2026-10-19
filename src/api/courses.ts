import { api } from "./axiosInstance";

/**
 * Przedmiot studenta: tylko podział aktów prawnych. Wybór przedmiotów zawęża pulę (aplikacja zamienia go na wybór
 * aktów), a pytania i tak należą do aktów.
 */
export interface Course {
  id: number;
  name: string;
  slug: string;
  /** Pytania przedmiotu ze wszystkich źródeł. */
  questionCount: number;
  actIds: number[];
}

export async function getCourses(): Promise<Course[]> {
  const res = await api.get<Course[]>("/api/courses");
  return res.data;
}
