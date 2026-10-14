/**
 * Wygląd aplikacji: ciemny (domyślny) albo jasny. Źródłem prawdy jest konto (serwer), a w przeglądarce zostaje tylko
 * kopia, dzięki której strona od pierwszej klatki ma dobry kolor (skrypt w index.html czyta ten sam klucz) i nie
 * mignie ciemnością przed odpowiedzią serwera. Wygląd obowiązuje tylko wewnątrz /app; strona główna i logowanie są ciemne.
 */
export type Theme = "DARK" | "LIGHT";

export const THEMES: readonly Theme[] = ["DARK", "LIGHT"];

export const THEME_LABELS: Record<Theme, string> = {
  DARK: "Ciemny",
  LIGHT: "Jasny",
};

/** Klucz kopii wyglądu. Ma przedrostek `tutlaw.`, ale wylogowanie go zostawia (zob. session.ts): to nie są dane osobowe. */
export const THEME_STORAGE_KEY = "tutlaw.theme.v1";

/** Kolor paska przeglądarki na telefonie (meta theme-color): tło strony w danym wyglądzie. */
const THEME_COLOR: Record<Theme, string> = {
  DARK: "#121214",
  LIGHT: "#fbfaf6",
};

export function isTheme(value: unknown): value is Theme {
  return value === "DARK" || value === "LIGHT";
}

/** Ostatni znany wygląd z tej przeglądarki; bez dostępu do pamięci albo bez zapisu: ciemny. */
export function readStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : "DARK";
  } catch {
    return "DARK";
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Tryb prywatny albo brak miejsca: przy następnym wejściu strona mignie ciemnością, ale wygląd z konta i tak wygra.
  }
}

/** Ustawia wygląd na stronie (atrybut `data-theme` na <html> i kolor paska przeglądarki). Niczego nie zapisuje. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "LIGHT") root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
}

/** Wraca do ciemnego wyglądu strony (po wyjściu z /app: strona główna, logowanie). */
export function resetTheme(): void {
  applyTheme("DARK");
}
