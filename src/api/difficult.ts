import { api } from "./axiosInstance";
import type { SessionMode } from "./review";

export interface DifficultQuestionItem {
  questionId: number;
  /** Tryb, w którym pytanie jest trudne albo zawieszone: test i fiszka tego samego pytania zawieszają się osobno. */
  mode: SessionMode;
  body: string;
  actName: string | null;
  /** Ile razy użytkownik pomylił się w tym pytaniu albo go nie pamiętał. */
  lapses: number;
  /** Tylko dla zawieszonych (RRRR-MM-DDTGG:MM:SS). */
  suspendedAt: string | null;
}

export interface DifficultQuestions {
  /** Od ilu błędów pytanie uchodzi za trudne. */
  leechThreshold: number;
  suspended: DifficultQuestionItem[];
  /** Trudne pytania, które nadal są w nauce. */
  leeches: DifficultQuestionItem[];
}

/** Ile pozycji maksymalnie zwraca serwer w każdej z list. */
export const DIFFICULT_LIST_LIMIT = 200;

export async function getDifficultQuestions(): Promise<DifficultQuestions> {
  const res = await api.get<DifficultQuestions>("/api/me/difficult-questions");
  return res.data;
}

/** Zawiesza pytanie w jednym trybie (idempotentnie): przestaje wracać w powtórkach tego trybu, postęp zostaje. */
export async function suspendQuestion(questionId: number, mode: SessionMode): Promise<void> {
  await api.put(`/api/me/suspended-questions/${questionId}`, null, { params: { mode } });
}

export async function unsuspendQuestion(questionId: number, mode: SessionMode): Promise<void> {
  await api.delete(`/api/me/suspended-questions/${questionId}`, { params: { mode } });
}
