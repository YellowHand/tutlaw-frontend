import { setFlashcardHidden, setQuestionHidden } from "../../api/flashcards";
import { useAdminMutation } from "./adminQueries";

/**
 * Ukrywanie i przywracanie pytania albo samej jego fiszki (istniejące `PUT /api/questions/{id}/hidden` i `/flashcard-hidden`).
 * Wspólne dla listy pytań i zgłoszeń, bo oba ekrany ukrywają pytania tak samo.
 */
export function useQuestionVisibility(onDone: (text: string) => void) {
  const hide = useAdminMutation(
    (v: { id: number; hidden: boolean }) => setQuestionHidden(v.id, v.hidden),
    (_r, v) => onDone(v.hidden ? `Ukryto pytanie nr ${v.id} przed wszystkimi użytkownikami.` : `Przywrócono pytanie nr ${v.id}.`)
  );
  const hideFlashcard = useAdminMutation(
    (v: { id: number; hidden: boolean }) => setFlashcardHidden(v.id, v.hidden),
    (_r, v) => onDone(v.hidden ? `Ukryto fiszkę pytania nr ${v.id}. Pytanie zostaje w testach.` : `Przywrócono fiszkę pytania nr ${v.id}.`)
  );
  return { hide, hideFlashcard };
}
