import { api } from "./axiosInstance";

export interface ReviewQueueItem {
  cardId: number;
  front: string;
  back: string;
  pageNumber: number | null;
  verbatimQuote: boolean;
  sourceName: string | null;
}

export async function getReviewQueue(subjectId: number): Promise<ReviewQueueItem[]> {
  const res = await api.get<ReviewQueueItem[]>("/api/review/queue", {
    params: { subjectId },
  });
  return res.data;
}

export async function submitReview(
  cardId: number, rating: number, timeSpentSeconds: number
): Promise<void> {
  await api.post("/api/review", { cardId, rating, timeSpentSeconds });
}