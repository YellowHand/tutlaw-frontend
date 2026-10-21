import { useCallback, useState } from "react";
import { serverMessage } from "../../lib/errors";

export interface Flash {
  kind: "ok" | "error";
  text: string;
}

/** Komunikat o wyniku ostatniej czynności na ekranie panelu (zapisano / nie udało się). Znika przy kolejnej czynności. */
export function useFlash() {
  const [flash, setFlash] = useState<Flash | null>(null);
  const ok = useCallback((text: string) => setFlash({ kind: "ok", text }), []);
  const fail = useCallback((error: unknown, fallback: string) => setFlash({ kind: "error", text: serverMessage(error, fallback) }), []);
  const clear = useCallback(() => setFlash(null), []);
  return { flash, ok, fail, clear };
}
