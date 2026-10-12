import { api } from "./axiosInstance";

export interface Chapter {
  id: number;
  sourceId: number;
  parentChapterId: number | null;
  title: string;
  orderIndex: number;
  isRead: boolean;
}

export interface ChapterMastery {
  chapterId: number;
  chapterTitle: string;
  totalCards: number;
  cardsStarted: number;
  matureCards: number;
  masteryPercentage: number;
}

export async function getChaptersBySource(sourceId: number): Promise<Chapter[]> {
  const res = await api.get<Chapter[]>(`/api/sources/${sourceId}/chapters`);
  return res.data;
}

export async function getChapterMastery(sourceId: number): Promise<ChapterMastery[]> {
  const res = await api.get<ChapterMastery[]>("/api/statistics/chapters", { params: { sourceId } });
  return res.data;
}

export async function setChapterProgress(chapterId: number, isRead: boolean): Promise<void> {
  await api.put(`/api/chapters/${chapterId}/progress`, { isRead });
}