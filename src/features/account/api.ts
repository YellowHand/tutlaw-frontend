import { api } from "../../api/axiosInstance";

/** Odpowiedź serwera po zalogowaniu i zmianie hasła. Token odświeżający przychodzi w ciasteczku HttpOnly, nie w treści. */
export interface AccessTokenResponse {
  accessToken: string;
}

export interface MeResponse {
  email: string;
  /** Numer konta (ten sam, co w dziennikach serwera). Starszy backend mógł go nie zwracać. */
  id?: number | null;
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
 * Zmienia hasło zalogowanego użytkownika (bez zmiany adresu e-mail). Odpowiedź zawiera nowy token dostępu
 * (nowe ciasteczko sesji przeglądarka zapisuje sama): dotychczasowe sesje przestają działać, więc aplikacja podmienia token.
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<AccessTokenResponse> {
  const { data } = await api.put<AccessTokenResponse>("/api/users/me/password", { currentPassword, newPassword });
  return data;
}

/** Usuwa konto razem z całą historią nauki. Wymaga hasła. */
export async function deleteAccount(password: string): Promise<void> {
  await api.delete("/api/users/me", { data: { password } });
}
