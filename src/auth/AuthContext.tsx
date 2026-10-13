import { useState, type ReactNode } from "react";
import { clearSession } from "../features/auth/session";
import { AuthContext } from "./context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("accessToken")
  );

  function login(newToken: string) {
    localStorage.setItem("accessToken", newToken);
    setToken(newToken);
  }

  function logout() {
    clearSession();
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
