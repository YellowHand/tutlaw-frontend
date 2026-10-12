import { useState, type ReactNode } from "react";
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
    localStorage.removeItem("accessToken");
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
