import { api } from "./axiosInstance";

export type SourceType = "TEXTBOOK" | "FLAT_POOL";

export interface Source {
  id: number;
  subjectId: number;
  name: string;
  author: string | null;
  edition: string | null;
  sourceType: SourceType;
}

export interface SourceProgress {
  sourceId: number;
  name: string;
  sourceType: SourceType;
  totalCards: number;
  cardsStarted: number;
  progressPercentage: number;
}

export async function getSourcesBySubject(subjectId: number): Promise<Source[]> {
  const res = await api.get<Source[]>(`/api/subjects/${subjectId}/sources`);
  return res.data;
}

export async function getSourceProgress(subjectId: number): Promise<SourceProgress[]> {
  const res = await api.get<SourceProgress[]>("/api/statistics/sources", { params: { subjectId } });
  return res.data;
}