import { formatDatePl } from "./date";

/**
 * Zmiana w prawie zapisana przy pytaniu (backend: LawChangeInfo): od `changedAt` treść pytania uwzględnia zmianę, a pytanie
 * wraca do powtórki u tych, którzy odpowiadali na nie wcześniej. `note` to krótki opis od administratora (bywa pusty).
 */
export interface LawChange {
  /** Data RRRR-MM-DD: dzień wejścia zmiany w życie (albo późniejszej poprawki pytania). */
  changedAt: string;
  note: string | null;
}

/** „Zmiana w prawie: 1 października 2026". */
export function lawChangeLabel(change: LawChange): string {
  return `Zmiana w prawie: ${formatDatePl(change.changedAt)}`;
}

/** Opis zmiany bez białych znaków albo null, gdy go nie ma. */
export function lawChangeNote(change: LawChange): string | null {
  const note = change.note?.trim();
  return note ? note : null;
}
