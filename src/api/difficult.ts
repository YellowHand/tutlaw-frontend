import { api } from "./axiosInstance";

export interface DifficultCardItem {
  cardId: number;
  front: string;
  sourceName: string | null;
  /** Ile razy użytkownik pomylił się w tym pytaniu albo go nie pamiętał. */
  lapses: number;
  /** Tylko dla zawieszonych (RRRR-MM-DDTGG:MM:SS). */
  suspendedAt: string | null;
}

export interface DifficultCards {
  /** Od ilu błędów pytanie uchodzi za trudne. */
  leechThreshold: number;
  suspended: DifficultCardItem[];
  /** Trudne pytania, które nadal są w nauce. */
  leeches: DifficultCardItem[];
}

/** Ile pozycji maksymalnie zwraca serwer w każdej z list. */
export const DIFFICULT_LIST_LIMIT = 200;

export async function getDifficultCards(): Promise<DifficultCards> {
  const res = await api.get<DifficultCards>("/api/me/difficult-cards");
  return res.data;
}

/** Zawiesza pytanie (idempotentnie): przestaje wracać w powtórkach i testach, postęp zostaje. */
export async function suspendCard(cardId: number): Promise<void> {
  await api.put(`/api/me/suspended-cards/${cardId}`);
}

export async function unsuspendCard(cardId: number): Promise<void> {
  await api.delete(`/api/me/suspended-cards/${cardId}`);
}
