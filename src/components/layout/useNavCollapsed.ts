import { useState } from "react";

/** Wybór „panel zwinięty” zapamiętany w przeglądarce. Klucz ma przedrostek `tutlaw.`, więc wylogowanie go czyści. */
const COLLAPSED_KEY = "tutlaw.nav.collapsed.v1";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Czy szeroki pasek boczny jest zwinięty do wąskiego paska z ikonami, oraz przełącznik. Bez dostępu do pamięci działa, ale nie pamięta wyboru. */
export function useNavCollapsed(): [collapsed: boolean, toggle: () => void] {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // Tryb prywatny albo brak miejsca: zwinięcie działa do końca tej wizyty.
    }
  }

  return [collapsed, toggle];
}
