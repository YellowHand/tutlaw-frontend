import { createContext } from "react";

export interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  /** Trwa odzyskiwanie sesji po odświeżeniu strony (pytamy serwer o nowy token dostępu). Ekrany chronione czekają. */
  isInitializing: boolean;
  /** Zapisuje token dostępu po zalogowaniu i zmianie hasła; token odświeżający serwer ustawia sam w ciasteczku. */
  login: (accessToken: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
