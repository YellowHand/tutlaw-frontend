import { api } from "./axiosInstance";

export interface Subject {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
}

export async function getSubjects(): Promise<Subject[]> {
  const res = await api.get<Subject[]>("/api/subjects");
  return res.data;
}

export async function getSubjectsByCategory(categoryId: number): Promise<Subject[]> {
  const res = await api.get<Subject[]>(`/api/categories/${categoryId}/subjects`);
  return res.data;
}