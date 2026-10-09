import { api } from "./axiosInstance";

export interface Chapter {
  id: number;
  subjectId: number;
  parentChapterId: number | null;
  title: string;
  orderIndex: number;
  isRead: boolean;
}

export async function getChaptersBySubject(subjectId: number): Promise<Chapter[]> {
  const res = await api.get<Chapter[]>(`/api/subjects/${subjectId}/chapters`);
  return res.data;
}

export async function setChapterProgress(chapterId: number, isRead: boolean): Promise<void> {
  await api.put(`/api/chapters/${chapterId}/progress`, { isRead });
}