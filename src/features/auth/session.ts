import { CONSENT_STORAGE_KEY } from "../../lib/consent";
import { THEME_STORAGE_KEY } from "../../lib/theme";
import { clearStoredToken } from "./tokenStorage";

/** Wszystkie klucze localStorage zapisywane przez aplikację (poza tokenem) zaczynają się od tego przedrostka. */
const APP_KEY_PREFIX = "gradus.";

/**
 * Klucze, które przeżywają wylogowanie. Kopia wyglądu (ciemny/jasny) nie jest daną osobową, a po ponownym zalogowaniu na
 * tym samym urządzeniu pozwala od pierwszej klatki mieć właściwy kolor. Wygląd z konta i tak ma pierwszeństwo.
 * Decyzja o zgodzie na statystyki też zostaje: to ustawienie urządzenia, a po wylogowaniu baner nie ma pytać od nowa.
 */
const KEPT_KEYS: readonly string[] = [THEME_STORAGE_KEY, CONSENT_STORAGE_KEY];

/**
 * Pełne czyszczenie po wylogowaniu z własnej woli albo po usunięciu konta: token sesji (z pamięci) i znacznik sesji oraz wszystko, co aplikacja
 * zapisała w przeglądarce (szkic i ustawienia egzaminu próbnego, w szkicu jest adres e-mail właściciela), poza kopią wyglądu.
 * Dzięki temu na cudzym komputerze nie zostają ślady po poprzednim użytkowniku.
 *
 * Przy wygaśnięciu sesji (401) kasujemy tylko token i znacznik sesji, patrz {@link clearStoredToken}: po ponownym zalogowaniu
 * na to samo konto użytkownik nie traci rozpoczętego egzaminu.
 */
export function clearSession(): void {
  clearStoredToken();
  try {
    const appKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null && key.startsWith(APP_KEY_PREFIX) && !KEPT_KEYS.includes(key)) appKeys.push(key);
    }
    // Najpierw zbieramy klucze, potem kasujemy: usuwanie w trakcie pętli przesuwałoby indeksy.
    appKeys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Magazyn niedostępny (np. tryb prywatny): nie ma czego czyścić.
  }
}
