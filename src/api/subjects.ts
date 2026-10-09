import { api } from "./axiosInstance";

export interface Subject {
  id: number;
  name: string;
  slug: string;
}

export async function getSubjects(): Promise<Subject[]> {
  const res = await api.get<Subject[]>("/api/subjects");
  return res.data;
}