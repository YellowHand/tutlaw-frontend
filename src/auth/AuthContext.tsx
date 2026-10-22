import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { postKeepalive } from "../api/keepalive";
import { refreshSession } from "../api/refreshSession";
import { clearSession } from "../features/auth/session";
import {
  SESSION_HINT_KEY,
  getAccessToken,
  hasSessionHint,
  setAccessToken,
  setSessionHint,
  subscribeAccessToken,
} from "../features/auth/tokenStorage";
import { AuthContext } from "./context";

/** Po tylu milisekundach ponawiamy próbę odzyskania sesji, gdy serwer chwilowo nie odpowiedział (brak sieci, 5xx). */
const BOOT_RETRY_DELAY_MS = 1500;

export function AuthProvider({ children }: { children: ReactNode }) {
  // Token dostępu jest w pamięci (zob. tokenStorage), a React tylko go obserwuje.
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, () => null);

  // Po odświeżeniu strony nie mamy tokenu dostępu, ale znacznik mówi, że przeglądarka ma sesję: pytamy serwer (ciasteczko).
  const [needsBoot] = useState(() => hasSessionHint() && getAccessToken() === null);
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    if (!needsBoot) return;
    let cancelled = false;
    void (async () => {
      let outcome = await refreshSession(null);
      if (outcome === "unavailable") {
        await new Promise((resolve) => window.setTimeout(resolve, BOOT_RETRY_DELAY_MS));
        outcome = await refreshSession(null);
      }
      // Serwer odrzucił sesję (wygasła, wylogowano gdzie indziej): znacznik nie ma już sensu.
      if (outcome === "rejected") setSessionHint(false);
    })().finally(() => {
      if (!cancelled) setBootDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, [needsBoot]);

  // Logowanie i wylogowanie w innej karcie: zmiana znacznika dociera do wszystkich kart.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== null && event.key !== SESSION_HINT_KEY) return;
      if (!hasSessionHint()) {
        setAccessToken(null);
      } else if (getAccessToken() === null) {
        void refreshSession(null);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function login(accessToken: string) {
    setAccessToken(accessToken);
    setSessionHint(true);
  }

  function logout() {
    // Serwer unieważnia sesję (ciasteczko z tokenem odświeżającym dołącza przeglądarka) i od razu zapominamy wszystko lokalnie;
    // nie czekamy na odpowiedź, bo wylogowanie ma działać także bez sieci.
    if (hasSessionHint() || getAccessToken() !== null) {
      // fetch z keepalive: żądanie dojdzie do serwera także wtedy, gdy zaraz potem przeładujemy stronę.
      postKeepalive("/api/auth/logout", {}, false);
    }
    clearSession();
  }

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated: !!token, isInitializing: needsBoot && !bootDone, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
