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

/**
 * subjectId, sourceId i categoryId są opcjonalne (od najwęższego: źródło, przedmiot, kategoria).
 * Bez żadnego backend zwraca kolejkę z całego dostępnego materiału użytkownika (globalne „Powtórki na dziś").
 */
export async function getReviewQueue(
  subjectId?: number,
  sourceId?: number,
  extraNewCards?: number,
  categoryId?: number
): Promise<ReviewQueueItem[]> {
  const res = await api.get<ReviewQueueItem[]>("/api/review/queue", {
    params: { categoryId, subjectId, sourceId, extraNewCards },
  });
  return res.data;
}

export async function getTestQueue(
  subjectId?: number,
  sourceId?: number,
  extraNewCards?: number,
  categoryId?: number
): Promise<TestQueueItem[]> {
  const res = await api.get<TestQueueItem[]>("/api/review/test-queue", {
    params: { categoryId, subjectId, sourceId, extraNewCards },
  });
  return res.data;
}

export async function getAvailableNewCardsCount(
  subjectId?: number,
  sourceId?: number,
  categoryId?: number
): Promise<number> {
  const res = await api.get<{ availableCount: number }>("/api/review/queue/new-cards-available", {
    params: { categoryId, subjectId, sourceId },
  });
  return res.data.availableCount;
}

/** Ile fiszek ma już minięty termin powtórki (bez nowych kart). */
export async function getDueCount(): Promise<number> {
  const res = await api.get<{ dueCount: number }>("/api/review/due-count");
  return res.data.dueCount;
}

export async function submitReview(cardId: number, rating: number, timeSpentSeconds: number): Promise<void> {
  await api.post("/api/review", { cardId, rating, timeSpentSeconds });
}

/**
 * guessed = true: użytkownik zaznaczył „nie jestem pewien". Poprawna, ale zgadywana
 * odpowiedź wraca wcześniej niż pewna (backend ocenia ją jako „trudną").
 */
export async function submitTestAnswer(
  cardId: number,
  selectedOption: "A" | "B" | "C",
  timeSpentSeconds: number,
  guessed = false
): Promise<TestAnswerResult> {
  const res = await api.post<TestAnswerResult>("/api/review/test-answer", {
    cardId,
    selectedOption,
    timeSpentSeconds,
    guessed,
  });
  return res.data;
}