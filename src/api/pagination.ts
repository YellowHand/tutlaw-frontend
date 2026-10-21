/**
 * Jedna strona listy z serwera (historia egzaminów, „Moje testy"). `page` liczy się od 0; `totalElements` to wszystkie
 * elementy listy, nie tylko te z tej strony.
 */
export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Ile pozycji ma jedna strona list „Moje testy" i historii egzaminów (serwer przyjmuje do 100). */
export const LIST_PAGE_SIZE = 20;
