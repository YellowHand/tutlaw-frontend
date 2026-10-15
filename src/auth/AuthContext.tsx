import { useState, type ReactNode } from "react";
import { postKeepalive } from "../api/keepalive";
import { clearSession } from "../features/auth/session";
import { getStoredRefreshToken, getStoredToken, storeTokens } from "../features/auth/tokenStorage";
import { AuthContext } from "./context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  function login(accessToken: string, refreshToken?: string | null) {
    storeTokens(accessToken, refreshToken);
    setToken(accessToken);
  }

  function logout() {
    // Serwer unieważnia sesję (token odświeżający) i od razu zapominamy wszystko lokalnie; nie czekamy na odpowiedź,
    // bo wylogowanie ma działać także bez sieci.
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      // fetch z keepalive: żądanie dojdzie do serwera także wtedy, gdy zaraz potem przeładujemy stronę.
      postKeepalive("/api/auth/logout", { refreshToken }, false);
    }
    clearSession();
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
