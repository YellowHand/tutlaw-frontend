import { api } from "./axiosInstance";

export interface ReviewQueueItem {
  cardId: number;
  front: string;
  back: string;
  pageNumber: number | null;
  verbatimQuote: boolean;
  sourceName: string | null;
  /** Podstawa prawna, np. „art. 415 k.c." (opcjonalna). */
  legalBasis: string | null;
  /** Data RRRR-MM-DD, na którą sprawdzono stan prawny (opcjonalna). */
  validAsOf: string | null;
  /** Ile razy użytkownik pomylił się w tym pytaniu / go nie pamiętał (stan sprzed tej sesji). */
  lapses: number;
  /** Czy pytanie jest już „trudne" (liczba błędów osiągnęła próg), czyli warto zaproponować zawieszenie. */
  leech: boolean;
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
  /** Wyjaśnienie bywa puste (jeszcze nie napisane): wtedy nic nie pokazujemy. */
  explanation: string | null;
  legalBasis: string | null;
  validAsOf: string | null;
  /** Ile razy użytkownik pomylił się w tym pytaniu (łącznie z tą odpowiedzią). */
  lapses: number;
  leech: boolean;
}

/**
 * Zaległości w wybranym zakresie nauki.
 * - dueNow: ile kart ma teraz minięty termin powtórki,
 * - deferred: ile z nich nie zmieści się dziś w sesji (dzienny limit) i poczeka na kolejne dni,
 * - dailyLimit / doneToday: dzienny limit zaległych powtórek i ile zrobiono już dziś.
 */
export interface Backlog {
  dueNow: number;
  deferred: number;
  dailyLimit: number;
  doneToday: number;
}

export type SessionMode = "FLASHCARD" | "TEST";

export async function getBacklog(
  mode: SessionMode,
  subjectId?: number,
  sourceId?: number,
  categoryId?: number
): Promise<Backlog> {
  const res = await api.get<Backlog>("/api/review/queue/backlog", {
    params: { mode, categoryId, subjectId, sourceId },
  });
  return res.data;
}

/**
 * subjectId, sourceId i categoryId są opcjonalne (od najwęższego: źródło, przedmiot, kategoria).
 * Bez żadnego backend zwraca kolejkę z całego dostępnego materiału użytkownika (globalne „Powtórki na dziś").
 * Zaległe fiszki idą od tych, które najłatwiej zapomnieć, do dziennego limitu. extraNewCards dokłada nowe,
 * extraDueReviews dokłada kolejną porcję zaległych ponad limit („Powtórz jeszcze").
 */
export async function getReviewQueue(
  subjectId?: number,
  sourceId?: number,
  extraNewCards?: number,
  categoryId?: number,
  extraDueReviews?: number
): Promise<ReviewQueueItem[]> {
  const res = await api.get<ReviewQueueItem[]>("/api/review/queue", {
    params: { categoryId, subjectId, sourceId, extraNewCards, extraDueReviews },
  });
  return res.data;
}

export async function getTestQueue(
  subjectId?: number,
  sourceId?: number,
  extraNewCards?: number,
  categoryId?: number,
  extraDueReviews?: number
): Promise<TestQueueItem[]> {
  const res = await api.get<TestQueueItem[]>("/api/review/test-queue", {
    params: { categoryId, subjectId, sourceId, extraNewCards, extraDueReviews },
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