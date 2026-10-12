/**
 * Czy zdarzenie klawiatury pochodzi z pola do pisania albo z obszaru oznaczonego data-no-shortcuts
 * (np. formularz zgłoszenia błędu). Skróty sesji nauki wtedy nie działają, żeby pisanie komentarza
 * nie wybierało odpowiedzi ani nie przeskakiwało do następnego pytania.
 */
export function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return true;
  return typeof el.closest === "function" && el.closest("[data-no-shortcuts]") !== null;
}
