import { useState } from "react";

/**
 * „Wybiorę później" przy wyborze egzaminu na Pulpicie, zapamiętane w przeglądarce. Klucz ma przedrostek `tutlaw.`,
 * więc wylogowanie go czyści. Bez dostępu do pamięci pytanie wraca przy następnej wizycie, ale działa.
 */
const SKIPPED_KEY = "tutlaw.examPrompt.skipped.v1";

function readSkipped(): boolean {
  try {
    return localStorage.getItem(SKIPPED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Czy użytkownik odłożył wybór egzaminu, oraz funkcja, która to zapamiętuje. */
export function useExamPromptSkipped(): [skipped: boolean, skip: () => void] {
  const [skipped, setSkipped] = useState(readSkipped);

  function skip() {
    setSkipped(true);
    try {
      localStorage.setItem(SKIPPED_KEY, "1");
    } catch {
      // Tryb prywatny albo brak miejsca: pytanie wróci przy następnej wizycie.
    }
  }

  return [skipped, skip];
}
