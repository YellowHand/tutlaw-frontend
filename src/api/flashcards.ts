import { api } from "./axiosInstance";
import type { FlashcardStatus } from "./review";

/** „Dodaj do fiszek": fiszka tego pytania trafia do Fiszek jako nowa karta. */
export async function addToFlashcards(questionId: number): Promise<FlashcardStatus> {
  const res = await api.post<{ status: FlashcardStatus }>(`/api/questions/${questionId}/flashcard`);
  return res.data.status;
}

/** „Usuń z fiszek": cofnięcie ręcznego dodania. */
export async function removeFromFlashcards(questionId: number): Promise<FlashcardStatus> {
  const res = await api.delete<{ status: FlashcardStatus }>(`/api/questions/${questionId}/flashcard`);
  return res.data.status;
}

/** Tylko administrator: ukrywa kartę (pytanie albo fiszkę) wszystkim użytkownikom albo ją przywraca. */
export async function setCardHidden(cardId: number, hidden: boolean): Promise<void> {
  await api.put(`/api/cards/${cardId}/hidden`, { hidden });
}
