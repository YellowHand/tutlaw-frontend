/**
 * Stoper jednego pytania. Liczy tylko czas, gdy działa (`resume`), więc chowanie karty przeglądarki, podgląd
 * poprzedniego pytania i czas po odpowiedzi nie wchodzą do czasu odpowiedzi.
 */
export class QuestionClock {
  private accumulatedMs = 0;
  private runningSince: number | null = null;

  private readonly now: () => number;

  constructor(now: () => number = () => Date.now()) {
    this.now = now;
  }

  reset(): void {
    this.accumulatedMs = 0;
    this.runningSince = null;
  }

  resume(): void {
    if (this.runningSince === null) this.runningSince = this.now();
  }

  pause(): void {
    if (this.runningSince !== null) {
      this.accumulatedMs += this.now() - this.runningSince;
      this.runningSince = null;
    }
  }

  get running(): boolean {
    return this.runningSince !== null;
  }

  /** Dotychczasowy czas w sekundach (ułamkowych). */
  seconds(): number {
    const live = this.runningSince !== null ? this.now() - this.runningSince : 0;
    return Math.max(0, (this.accumulatedMs + live) / 1000);
  }
}
