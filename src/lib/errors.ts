import { isAxiosError } from "axios";

/**
 * Komunikat dla użytkownika, gdy nie udało się pobrać danych.
 * Brak odpowiedzi serwera (zerwane połączenie, serwer wyłączony) opisujemy inaczej niż błąd po stronie serwera.
 */
export function loadErrorMessage(error: unknown, what: string): string {
  if (isAxiosError(error) && !error.response) {
    return "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.";
  }
  return `Nie udało się wczytać: ${what}. Spróbuj ponownie.`;
}

/**
 * Tekst błędu z odpowiedzi serwera (pole message), a gdy go nie ma, podany komunikat zastępczy.
 * Brak odpowiedzi serwera (wyłączony backend, brak internetu) dostaje osobny, zrozumiały komunikat.
 */
export function serverMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    if (!error.response) {
      return "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.";
    }
    const message = (error.response.data as { message?: unknown } | undefined)?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}
