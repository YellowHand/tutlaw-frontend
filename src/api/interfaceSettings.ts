import { api } from "./axiosInstance";

/** Ustawienia interfejsu zapisane na koncie (podpowiedzi klawiszy, licznik czasu przy pytaniu). */
export interface InterfaceSettings {
  /** Podpowiedź skrótów klawiszowych w testach jest stale ukryta (przycisk „×"). */
  testHintHidden: boolean;
  /** To samo w fiszkach. */
  flashcardHintHidden: boolean;
  /** Licznik czasu przy pytaniu jest ukryty. */
  questionTimerHidden: boolean;
  /** Ile odpowiedzi w testach użytkownik już dał, liczone do 10: po 10 podpowiedź znika sama. */
  testAnswers: number;
  /** Ile ocen fiszek użytkownik już dał, liczone do 10. */
  flashcardReviews: number;
}

/** Zmiana ustawień interfejsu: pole pominięte zostaje bez zmian. */
export type InterfaceSettingsUpdate = Partial<Pick<InterfaceSettings, "testHintHidden" | "flashcardHintHidden" | "questionTimerHidden">>;

/** Nieoczekiwana odpowiedź (np. strona zamiast JSON) to błąd: ekrany wtedy nic nie ukrywają. */
function parse(data: unknown): InterfaceSettings {
  if (typeof data !== "object" || data === null) throw new Error("Nieprawidłowa odpowiedź ustawień interfejsu");
  const d = data as Partial<InterfaceSettings>;
  return {
    testHintHidden: d.testHintHidden === true,
    flashcardHintHidden: d.flashcardHintHidden === true,
    questionTimerHidden: d.questionTimerHidden === true,
    testAnswers: typeof d.testAnswers === "number" ? d.testAnswers : 0,
    flashcardReviews: typeof d.flashcardReviews === "number" ? d.flashcardReviews : 0,
  };
}

export async function getInterfaceSettings(): Promise<InterfaceSettings> {
  const res = await api.get<unknown>("/api/me/interface");
  return parse(res.data);
}

export async function updateInterfaceSettings(update: InterfaceSettingsUpdate): Promise<InterfaceSettings> {
  const res = await api.put<unknown>("/api/me/interface", update);
  return parse(res.data);
}
