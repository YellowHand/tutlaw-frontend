import { api } from "./axiosInstance";

/** EXAM: aplikacja z własnymi arkuszami i terminem egzaminu. STUDENT: ścieżka bez terminu, oparta na przedmiotach. */
export type TrackKind = "EXAM" | "STUDENT";

/** Ścieżka nauki: jedna z pięciu aplikacji albo Student. */
export interface Track {
  id: number;
  slug: string;
  name: string;
  /** Krótka nazwa na etykiety i chipy, np. „Adwokacka i radcowska". */
  shortName: string;
  kind: TrackKind;
}

/** Wszystkie ścieżki do wyboru, w kolejności z bazy. */
export async function getTracks(): Promise<Track[]> {
  const res = await api.get<Track[]>("/api/tracks");
  return res.data;
}
