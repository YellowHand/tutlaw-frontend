import { api } from "./axiosInstance";

export interface ReviewQueueItem {
  cardId: number;
  front: string;
  back: string;
  pageNumber: number | null;
  verbatimQuote: boolean;
  sourceName: string | null;
}

export interface TestQueueItem {
  cardId: number;
  front: string;
  optionA: string;
  optionB: string;
  optionC: string;
  sourceName: string | null;
}

export interface TestAnswerResult {
  correct: boolean;
  correctOption: "A" | "B" | "C";
  explanation: string | null;
}

export async function getReviewQueue(
  subjectId: number,
  sourceId?: number,
  extraNewCards?: number
): Promise<ReviewQueueItem[]> {
  const res = await api.get<ReviewQueueItem[]>("/api/review/queue", {
    params: { subjectId, sourceId, extraNewCards },
  });
  return res.data;
}

export async function getTestQueue(
  subjectId: number,
  sourceId?: number,
  extraNewCards?: number
): Promise<TestQueueItem[]> {
  const res = await api.get<TestQueueItem[]>("/api/review/test-queue", {
    params: { subjectId, sourceId, extraNewCards },
  });
  return res.data;
}

export async function getAvailableNewCardsCount(subjectId: number, sourceId?: number): Promise<number> {
  const res = await api.get<{ availableCount: number }>("/api/review/queue/new-cards-available", {
    params: { subjectId, sourceId },
  });
  return res.data.availableCount;
}

export async function submitReview(cardId: number, rating: number, timeSpentSeconds: number): Promise<void> {
  await api.post("/api/review", { cardId, rating, timeSpentSeconds });
}

export async function submitTestAnswer(
  cardId: number,
  selectedOption: "A" | "B" | "C",
  timeSpentSeconds: number
): Promise<TestAnswerResult> {
  const res = await api.post<TestAnswerResult>("/api/review/test-answer", { cardId, selectedOption, timeSpentSeconds });
  return res.data;
}