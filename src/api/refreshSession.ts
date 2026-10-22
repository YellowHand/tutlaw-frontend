import axios from "axios";
import { getAccessToken, setAccessToken, setSessionHint } from "../features/auth/tokenStorage";

/**
 * Odświeżanie sesji bez wylogowania. Token dostępu żyje krótko (ok. 30 minut) i tylko w pamięci karty, a token odświeżający
 * (30 dni) leży w ciasteczku HttpOnly, które przeglądarka dołącza sama. Serwer przy każdym odświeżeniu wydaje NOWY token
 * odświeżający (ciasteczko jest wspólne dla wszystkich kart) i zużywa stary, więc dwa równoległe odświeżenia tym samym
 * ciasteczkiem mogłyby skończyć się wylogowaniem. Dlatego:
 *  - w obrębie jednej karty wszystkie żądania, które dostały 401, czekają na jedno wspólne odświeżenie,
 *  - między kartami pilnuje tego blokada Web Locks: kto wejdzie drugi, wysyła już nowe ciasteczko. (Serwer toleruje też
 *    ponowne użycie w ciągu 10 sekund, gdyby blokady nie było.)
 */

const LOCK_NAME = "gradus.refresh-session";

export type RefreshOutcome = "refreshed" | "rejected" | "unavailable";

let inFlight: Promise<RefreshOutcome> | null = null;

/** Osobny klient bez interceptorów, żeby odświeżanie nie wpadło w pętlę przy własnym 401. */
const bare = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15_000,
  // Bez tego przeglądarka nie dołączy ciasteczka z tokenem odświeżającym ani nie zapisze nowego.
  withCredentials: true,
});

async function callServer(): Promise<RefreshOutcome> {
  try {
    const { data } = await bare.post<{ accessToken: string }>("/api/auth/refresh");
    setAccessToken(data.accessToken);
    setSessionHint(true);
    return "refreshed";
  } catch (error) {
    // 401 = serwer uznał sesję za nieważną (brak ciasteczka, wygasła, wylogowano, zmieniono hasło). Brak sieci, 5xx i 429 to
    // nie jest powód do wylogowania: sesja jest w porządku, tylko teraz nie da się jej odświeżyć.
    if (axios.isAxiosError(error) && error.response?.status === 401) return "rejected";
    return "unavailable";
  }
}

async function refreshOnce(staleAccessToken: string | null): Promise<RefreshOutcome> {
  const run = async (): Promise<RefreshOutcome> => {
    // Inne żądanie w tej karcie mogło odświeżyć sesję, zanim dostaliśmy blokadę: bierzemy jego wynik zamiast zużywać ciasteczko drugi raz.
    const current = getAccessToken();
    if (current !== null && staleAccessToken !== null && current !== staleAccessToken) return "refreshed";
    return callServer();
  };

  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (locks && typeof locks.request === "function") {
    return locks.request(LOCK_NAME, run);
  }
  return run();
}

/**
 * Odświeża sesję (jedno wspólne odświeżenie dla wszystkich czekających żądań).
 * @param staleAccessToken token dostępu, z którym żądanie dostało 401 (null przy starcie aplikacji, gdy nie mamy żadnego)
 */
export function refreshSession(staleAccessToken: string | null): Promise<RefreshOutcome> {
  if (!inFlight) {
    inFlight = refreshOnce(staleAccessToken).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
