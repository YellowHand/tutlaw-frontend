import { api } from "./axiosInstance";

export interface Category {
  id: number;
  name: string;
  slug: string;
  /** Jak nazywać zawartość kategorii, np. „Przedmioty" albo „Akty prawne". */
  itemsLabel: string;
  sortOrder: number;
  /** Ile przedmiotów / aktów prawnych jest w kategorii (0 = pusta, można ukryć). */
  subjectCount: number;
}

export async function getCategories(): Promise<Category[]> {
  const res = await api.get<Category[]>("/api/categories");
  return res.data;
}