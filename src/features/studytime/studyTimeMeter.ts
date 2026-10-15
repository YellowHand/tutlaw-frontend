/** Po tylu minutach bez żadnego ruchu myszy, klawisza ani dotyku przestajemy liczyć czas nauki (do następnego ruchu). */
export const IDLE_LIMIT_MS = 3 * 60 * 1000;

/** Jeden odstęp między tyknięciami nie może policzyć więcej: po uśpieniu komputera nie dopisujemy godzin. */
const MAX_TICK_MS = 2000;

/**
 * Licznik czasu nauki. Dodaje czas tylko wtedy, gdy ekran jest ekranem nauki, karta przeglądarki jest widoczna
 * i w ciągu ostatnich 3 minut był jakiś ruch użytkownika. Zebrane sekundy odbiera `take` i wysyła na serwer.
 * Czysta klasa bez dostępu do przeglądarki, żeby dało się ją sprawdzić na zmyślonym zegarze.
 */
export class StudyTimeMeter {
  private pendingMs = 0;
  private lastTickAt: number;
  private lastInputAt: number;

  constructor(now: number) {
    this.lastTickAt = now;
    this.lastInputAt = now;
  }

  /** Ruch myszy, klawisz, dotyk, powrót do karty albo wejście na ekran nauki. */
  input(now: number): void {
    this.lastInputAt = now;
  }

  /** @param counting czy teraz wolno liczyć czas (ekran nauki i widoczna karta) */
  tick(now: number, counting: boolean): void {
    const delta = Math.min(Math.max(0, now - this.lastTickAt), MAX_TICK_MS);
    this.lastTickAt = now;
    if (counting && now - this.lastInputAt <= IDLE_LIMIT_MS) this.pendingMs += delta;
  }

  /** Pełne sekundy czekające na wysłanie. */
  get pendingSeconds(): number {
    return Math.floor(this.pendingMs / 1000);
  }

  /** Odbiera do `max` pełnych sekund (ułamek zostaje na następny raz). */
  take(max: number): number {
    const seconds = Math.min(this.pendingSeconds, max);
    this.pendingMs -= seconds * 1000;
    return seconds;
  }

  /** Zwraca sekundy, których nie udało się wysłać. Nie trzymamy więcej niż godzinę. */
  giveBack(seconds: number): void {
    this.pendingMs = Math.min(this.pendingMs + seconds * 1000, 60 * 60 * 1000);
  }
}
