import { api } from "./axiosInstance";
import type { FlashcardStatus } from "./review";

/** „Dodaj do fiszek": fiszka tego pytania trafia do Fiszek jako nowa. */
export async function addToFlashcards(questionId: number): Promise<FlashcardStatus> {
  const res = await api.post<{ status: FlashcardStatus }>(`/api/questions/${questionId}/flashcard`);
  return res.data.status;
}

/** „Usuń z fiszek": cofnięcie ręcznego dodania. */
export async function removeFromFlashcards(questionId: number): Promise<FlashcardStatus> {
  const res = await api.delete<{ status: FlashcardStatus }>(`/api/questions/${questionId}/flashcard`);
  return res.data.status;
}

/** Tylko administrator: ukrywa całe pytanie (test i fiszkę) wszystkim użytkownikom albo je przywraca. */
export async function setQuestionHidden(questionId: number, hidden: boolean): Promise<void> {
  await api.put(`/api/questions/${questionId}/hidden`, { hidden });
}

/** Tylko administrator: ukrywa samą fiszkę pytania (test zostaje) wszystkim użytkownikom albo ją przywraca. */
export async function setFlashcardHidden(questionId: number, hidden: boolean): Promise<void> {
  await api.put(`/api/questions/${questionId}/flashcard-hidden`, { hidden });
}
