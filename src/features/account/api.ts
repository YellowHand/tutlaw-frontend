import { api } from "../../api/axiosInstance";

export interface MeResponse {
  email: string;
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>("/api/me");
  return data;
}

/** Pobiera kopię danych użytkownika i zwraca ją jako sformatowany tekst JSON. */
export async function fetchAccountExport(): Promise<string> {
  const { data } = await api.get<unknown>("/api/users/me/export");
  return JSON.stringify(data, null, 2);
}

/** Usuwa konto razem z całą historią nauki. Wymaga hasła. */
export async function deleteAccount(password: string): Promise<void> {
  await api.delete("/api/users/me", { data: { password } });
}
