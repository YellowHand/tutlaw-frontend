import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { ROUTES } from "../config/routes";
import { clearStoredToken, getAccessToken } from "../features/auth/tokenStorage";
import { refreshSession } from "./refreshSession";

/**
 * Limit czasu zwykłego żądania. Bez niego (domyślnie axios czeka w nieskończoność) zawieszony serwer zostawiłby
 * użytkownika z wiecznym kółkiem ładowania. Po przekroczeniu żądanie kończy się błędem sieciowym i ekran pokazuje
 * swój komunikat o błędzie. Dłuższe operacje (np. import pytań) podają własny, większy limit.
 */
export const REQUEST_TIMEOUT_MS = 30_000;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  // Dołączamy ciasteczka: w jednym z nich serwer trzyma token odświeżający (HttpOnly, widoczny tylko dla przeglądarki) i bez tej
  // flagi przeglądarka nie zapisałaby go po zalogowaniu ani nie wysłałaby przy odświeżaniu sesji.
  withCredentials: true,
});

/** Strony dostępne bez logowania: tu nie przekierowujemy na /login, bo użytkownik i tak już tam jest. */
const PUBLIC_PATHS: string[] = [
  ROUTES.landing,
  ROUTES.login,
  ROUTES.register,
  ROUTES.checkEmail,
  ROUTES.verify,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
  ROUTES.terms,
  ROUTES.privacy,
];

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Znacznik „to żądanie było już ponowione po odświeżeniu sesji", żeby nie wpaść w pętlę. */
interface RetriableConfig extends InternalAxiosRequestConfig {
  _afterRefresh?: boolean;
}

function sendToLogin(): void {
  // Wygasła sesja: kasujemy tylko tokeny. Szkic egzaminu zostaje na ponowne zalogowanie na to samo konto.
  clearStoredToken();
  if (!PUBLIC_PATHS.includes(window.location.pathname)) {
    window.location.href = ROUTES.login;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const config = error.config as RetriableConfig | undefined;
    const url = config?.url ?? "";

    // Reagujemy tylko na 401 (sesja wygasła lub token jest zły). 403 to „brak uprawnień do tej czynności" i nie może
    // kasować sesji. Błędy logowania, rejestracji i odświeżenia (/api/auth/...) pokazują własny komunikat.
    if (status !== 401 || !config || url.startsWith("/api/auth/")) {
      return Promise.reject(error);
    }

    const sentAuthorization = String(config.headers?.Authorization ?? "");
    const sentToken = sentAuthorization.startsWith("Bearer ") ? sentAuthorization.slice("Bearer ".length) : null;

    // To żądanie już raz ponowiliśmy z nowym tokenem i nadal 401: sesji nie da się uratować.
    if (config._afterRefresh) {
      sendToLogin();
      return Promise.reject(error);
    }

    const outcome = await refreshSession(sentToken);

    if (outcome === "refreshed") {
      config._afterRefresh = true;
      config.headers.Authorization = `Bearer ${getAccessToken() ?? ""}`;
      return api.request(config);
    }

    // Brak sieci albo błąd serwera przy odświeżaniu: sesja może być w porządku, więc nie wylogowujemy.
    if (outcome === "unavailable") return Promise.reject(error);

    // Serwer odrzucił token odświeżający. Jeśli w międzyczasie ta przeglądarka dostała nowe tokeny (np. zmiana hasła
    // w tej karcie), to 401 dotyczy starej sesji i nowej nie wylogowujemy.
    const currentToken = getAccessToken();
    if (currentToken !== null && currentToken !== sentToken) {
      config._afterRefresh = true;
      config.headers.Authorization = `Bearer ${currentToken}`;
      return api.request(config);
    }
    sendToLogin();
    return Promise.reject(error);
  }
);
