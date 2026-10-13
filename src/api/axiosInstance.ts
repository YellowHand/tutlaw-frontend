import axios from "axios";
import { ROUTES } from "../config/routes";
import { clearStoredToken, getStoredToken } from "../features/auth/tokenStorage";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error.response?.status;
    const url: string = error.config?.url ?? "";

    // Wylogowujemy tylko, gdy serwer mówi, że sesja wygasła lub token jest zły (401).
    // 403 to „brak uprawnień do tej czynności" i nie może kasować sesji. Błędy logowania
    // i rejestracji (/api/auth/...) pokazują własny komunikat na formularzu.
    if (status === 401 && !url.startsWith("/api/auth/")) {
      // Odpowiedź 401 na żądanie wysłane ze starym tokenem (np. tuż przed zmianą hasła, która dała nowy token)
      // nie może wylogować już nowej sesji.
      const sentAuthorization = String(error.config?.headers?.Authorization ?? "");
      const currentToken = getStoredToken();
      if (currentToken !== null && sentAuthorization !== `Bearer ${currentToken}`) {
        return Promise.reject(error);
      }
      // Wygasła sesja: kasujemy tylko token. Szkic egzaminu zostaje na ponowne zalogowanie na to samo konto.
      clearStoredToken();
      if (!PUBLIC_PATHS.includes(window.location.pathname)) {
        window.location.href = ROUTES.login;
      }
    }
    return Promise.reject(error);
  }
);
