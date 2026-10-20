import { api } from "./axiosInstance";
import type { SourceKind } from "../lib/source";
import type { LawChange } from "../lib/lawChange";

/**
 * Zakres sesji, od najwęższego: źródło (arkusz), akt prawny, dziedzina. Bez żadnego z nich serwer bierze całą pulę
 * użytkownika. Zakres liczy się razem z pulą (ścieżka, zawężenie do aktów, filtr źródeł).
 */
export interface ReviewScope {
  fieldId?: number;
  actId?: number;
  sourceId?: number;
}

/** Fiszka to tryb pytania: ta sama treść, osobny harmonogram powtórek niż w teście. */
export interface FlashcardQueueItem {
  questionId: number;
  front: string;
  back: string;
  /** Wyjaśnienie (bywa puste: nie każde pytanie je ma). */
  explanation: string | null;
  /** Podstawa prawna, np. „art. 415 k.c." (opcjonalna). */
  legalBasis: string | null;
  /** Data RRRR-MM-DD, na którą sprawdzono stan prawny (opcjonalna). */
  validAsOf: string | null;
  actName: string | null;
  actShortName: string | null;
  sourceName: string | null;
  sourceKind: SourceKind | null;
  examYear: number | null;
  /** Ile razy użytkownik pomylił się w tej fiszce / jej nie pamiętał (stan sprzed tej sesji). */
  lapses: number;
  /** Czy fiszka jest już „trudna" (liczba błędów osiągnęła próg), czyli warto zaproponować zawieszenie. */
  leech: boolean;
  /** Zmiana w prawie dotykająca pytania (null: brak). */
  lawChange?: LawChange | null;
}

export interface TestQueueItem {
  questionId: number;
  body: string;
  optionA: string;
  optionB: string;
  optionC: string;
  actName: string | null;
  actShortName: string | null;
  sourceName: string | null;
  sourceKind: SourceKind | null;
  examYear: number | null;
  /** Zmiana w prawie dotykająca pytania (null: brak). */
  lawChange?: LawChange | null;
}

/**
 * Stan fiszki pytania dla użytkownika:
 * - UNAVAILABLE: pytanie nie ma widocznej fiszki (nic nie pokazujemy),
 * - AVAILABLE: można ją dodać przyciskiem „Dodaj do fiszek",
 * - ADDED_MANUALLY: użytkownik sam ją dodał, może ją usunąć („Usuń z fiszek"),
 * - ADDED_BY_MISTAKE: trafiła do Fiszek po pewnym błędzie w tym pytaniu (bez przycisku).
 */
export type FlashcardStatus = "UNAVAILABLE" | "AVAILABLE" | "ADDED_MANUALLY" | "ADDED_BY_MISTAKE";

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
  /**
   * Ta błędna odpowiedź (bez „Nie jestem pewien") sama dodała fiszkę tego pytania do Fiszek:
   * od teraz czeka tam jako nowa. Prawda tylko przy pierwszym takim błędzie.
   */
  flashcardUnlocked: boolean;
  /** Stan fiszki tego pytania po tej odpowiedzi: czy pokazać „Dodaj do fiszek", „W fiszkach" albo nic. */
  flashcard: FlashcardStatus;
  /** To była pierwsza odpowiedź na to pytanie, czyli użytkownik zaczął się go uczyć właśnie teraz. */
  newQuestion: boolean;
  /** Zmiana w prawie dotykająca pytania (null: brak). */
  lawChange?: LawChange | null;
}

/**
 * Zaległości w wybranym zakresie nauki.
 * - dueNow: ile pytań ma teraz minięty termin powtórki,
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

export async function getBacklog(mode: SessionMode, scope: ReviewScope = {}): Promise<Backlog> {
  const res = await api.get<Backlog>("/api/review/queue/backlog", { params: { mode, ...scope } });
  return res.data;
}

/**
 * Kolejka fiszek z podanego zakresu (bez zakresu: z całej puli). Zaległe fiszki idą od tych, które najłatwiej
 * zapomnieć, do dziennego limitu. extraNewCards dokłada nowe, extraDueReviews dokłada kolejną porcję zaległych
 * ponad limit („Powtórz jeszcze").
 */
export async function getFlashcardQueue(
  scope: ReviewScope = {},
  extraNewCards?: number,
  extraDueReviews?: number
): Promise<FlashcardQueueItem[]> {
  const res = await api.get<FlashcardQueueItem[]>("/api/review/flashcard-queue", {
    params: { ...scope, extraNewCards, extraDueReviews },
  });
  return res.data;
}

/**
 * Kolejka pytań testowych z podanego zakresu. extraNewCards = 0 to sesja bez nowych pytań (same zaległe powtórki).
 */
export async function getTestQueue(
  scope: ReviewScope = {},
  extraNewCards?: number,
  extraDueReviews?: number
): Promise<TestQueueItem[]> {
  const res = await api.get<TestQueueItem[]>("/api/review/test-queue", {
    params: { ...scope, extraNewCards, extraDueReviews },
  });
  return res.data;
}

/** Ile pytań czeka w „Powtórz moje błędy" i jak duża jest jedna sesja. */
export interface MistakesCount {
  /** Pytania, w których ostatnia odpowiedź w teście (z ostatnich dni) była błędna, a które nadal można ćwiczyć. */
  count: number;
  lookbackDays: number;
  /** Maksymalna liczba pytań w jednej sesji. */
  sessionSize: number;
}

export async function getMistakesCount(): Promise<MistakesCount> {
  const res = await api.get<MistakesCount>("/api/review/mistakes-count");
  return res.data;
}

/** Sesja z błędów: do kilkudziesięciu najświeższych pytań z błędną ostatnią odpowiedzią, w losowej kolejności. */
export async function getMistakesQueue(): Promise<TestQueueItem[]> {
  const res = await api.get<TestQueueItem[]>("/api/review/mistakes-queue");
  return res.data;
}

/**
 * Ile nowych pytań można jeszcze dołożyć w danym trybie. Fiszki i Testy liczą osobno: bez trybu backend
 * liczy fiszki, więc sesja testowa musi podać "TEST".
 */
export async function getAvailableNewQuestionsCount(
  scope: ReviewScope = {},
  mode: SessionMode = "FLASHCARD"
): Promise<number> {
  const res = await api.get<{ availableCount: number }>("/api/review/queue/new-available", {
    params: { ...scope, mode },
  });
  return res.data.availableCount;
}

/** Ile pytań w danym trybie (fiszki albo testy) ma już minięty termin powtórki, bez nowych. */
export async function getDueCount(mode: SessionMode = "FLASHCARD"): Promise<number> {
  const res = await api.get<{ dueCount: number }>("/api/review/due-count", { params: { mode } });
  return res.data.dueCount;
}

/** Wynik oceny fiszki: `firstReview` = to była pierwsza ocena tej fiszki (zaczęła się uczyć właśnie teraz). */
export interface ReviewResult {
  firstReview: boolean;
}

export async function submitReview(questionId: number, rating: number, timeSpentSeconds: number): Promise<ReviewResult> {
  const res = await api.post<Partial<ReviewResult> | undefined>("/api/review", { questionId, rating, timeSpentSeconds });
  return { firstReview: res.data?.firstReview === true };
}

/** Ile pytań danego trybu wróci na powtórkę do końca jutra (razem z tymi, które czekają już teraz). */
export async function getDueByTomorrow(mode: SessionMode): Promise<number> {
  const res = await api.get<{ dueCount: number }>("/api/review/due-tomorrow", { params: { mode } });
  return res.data.dueCount;
}

/**
 * guessed = true: użytkownik zaznaczył „nie jestem pewien". Poprawna, ale zgadywana
 * odpowiedź wraca wcześniej niż pewna (backend ocenia ją jako „trudną").
 * sessionId: numer zapisanego własnego testu, do którego należy odpowiedź (tylko w „Własny test").
 */
export async function submitTestAnswer(
  questionId: number,
  selectedOption: "A" | "B" | "C",
  timeSpentSeconds: number,
  guessed = false,
  sessionId?: number
): Promise<TestAnswerResult> {
  const res = await api.post<TestAnswerResult>("/api/review/test-answer", {
    questionId,
    selectedOption,
    timeSpentSeconds,
    guessed,
    sessionId,
  });
  return res.data;
}

/** Sesja testowa z podanych pytań (np. błędy z egzaminu, własny test), w podanej kolejności. */
export async function getPracticeQueue(questionIds: number[]): Promise<TestQueueItem[]> {
  const res = await api.get<TestQueueItem[]>("/api/review/practice-queue", {
    // Spring przyjmuje listę po przecinku; axios domyślnie zapisałby tablicę jako questionIds[]=1&questionIds[]=2.
    params: { questionIds: questionIds.join(",") },
  });
  return res.data;
}
