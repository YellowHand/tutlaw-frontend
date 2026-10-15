import { api } from "../../api/axiosInstance";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

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

/**
 * Zmienia hasło zalogowanego użytkownika (bez zmiany adresu e-mail). Odpowiedź zawiera nową parę tokenów:
 * dotychczasowe sesje przestają działać, więc aplikacja podmienia tokeny w tej przeglądarce.
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<TokenPair> {
  const { data } = await api.put<TokenPair>("/api/users/me/password", { currentPassword, newPassword });
  return data;
}

/** Usuwa konto razem z całą historią nauki. Wymaga hasła. */
export async function deleteAccount(password: string): Promise<void> {
  await api.delete("/api/users/me", { data: { password } });
}
