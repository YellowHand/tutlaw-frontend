import axios from "axios";
import { getStoredRefreshToken, getStoredToken, storeTokens } from "../features/auth/tokenStorage";

/**
 * Odświeżanie sesji bez wylogowania. Token dostępu żyje krótko (ok. 30 minut), a token odświeżający 30 dni.
 * Serwer przy każdym odświeżeniu wydaje NOWY token odświeżający, a stary przestaje działać, więc dwa równoległe
 * odświeżenia tym samym tokenem skończyłyby się wylogowaniem (serwer uznałby to za kradzież). Dlatego:
 *  - w obrębie jednej karty wszystkie żądania, które dostały 401, czekają na jedno wspólne odświeżenie,
 *  - między kartami pilnuje tego blokada Web Locks: kto wejdzie drugi, widzi już nowe tokeny w localStorage i ich używa.
 */

const LOCK_NAME = "gradus.refresh-session";

export type RefreshOutcome = "refreshed" | "rejected" | "unavailable";

let inFlight: Promise<RefreshOutcome> | null = null;

/** Osobny klient bez interceptorów, żeby odświeżanie nie wpadło w pętlę przy własnym 401. */
const bare = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

async function callServer(refreshToken: string): Promise<RefreshOutcome> {
  try {
    const { data } = await bare.post<{ accessToken: string; refreshToken: string }>("/api/auth/refresh", {
      refreshToken,
    });
    storeTokens(data.accessToken, data.refreshToken);
    return "refreshed";
  } catch (error) {
    // 401 = serwer uznał token za nieważny (wygasł, wylogowano, zmieniono hasło). Brak sieci, 5xx i 429 to nie jest
    // powód do wylogowania: sesja jest w porządku, tylko teraz nie da się jej odświeżyć.
    if (axios.isAxiosError(error) && error.response?.status === 401) return "rejected";
    return "unavailable";
  }
}

async function refreshOnce(staleAccessToken: string | null): Promise<RefreshOutcome> {
  const run = async (): Promise<RefreshOutcome> => {
    // Inna karta mogła odświeżyć sesję, zanim dostaliśmy blokadę: wtedy bierzemy jej wynik zamiast zużywać token drugi raz.
    const current = getStoredToken();
    if (current !== null && staleAccessToken !== null && current !== staleAccessToken) return "refreshed";
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return "rejected";
    return callServer(refreshToken);
  };

  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (locks && typeof locks.request === "function") {
    return locks.request(LOCK_NAME, run);
  }
  return run();
}

/**
 * Odświeża sesję (jedno wspólne odświeżenie dla wszystkich czekających żądań).
 * @param staleAccessToken token dostępu, z którym żądanie dostało 401
 */
export function refreshSession(staleAccessToken: string | null): Promise<RefreshOutcome> {
  if (!inFlight) {
    inFlight = refreshOnce(staleAccessToken).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
