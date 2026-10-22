import { useSyncExternalStore } from "react";

/**
 * Zgoda na statystyki (Google Analytics). Zapisujemy tylko decyzję: tak, nie albo „jeszcze nie pytano”.
 * Sam zapis decyzji w pamięci przeglądarki jest niezbędny do działania banera (nie wymaga zgody) i NIE znika
 * po wylogowaniu (zob. KEPT_KEYS w features/auth/session.ts), bo to ustawienie urządzenia, a nie dane konta.
 */
export const CONSENT_STORAGE_KEY = "gradus.consent.v1";

/** Zwiększ przy istotnej zmianie celów przetwarzania: dotychczasowe zgody tracą ważność i baner pyta ponownie. */
const CONSENT_VERSION = 1;

export type AnalyticsChoice = "granted" | "denied" | "unset";

interface StoredConsent {
  analytics: boolean;
  version: number;
  /** Kiedy użytkownik zdecydował (do wykazania zgody). */
  at: string;
}

export interface ConsentState {
  choice: AnalyticsChoice;
  /** Użytkownik sam otworzył ustawienia (link „Ustawienia cookies”), więc pokazujemy baner mimo wcześniejszej decyzji. */
  reopened: boolean;
}

function readChoice(): AnalyticsChoice {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return "unset";
    const stored = JSON.parse(raw) as Partial<StoredConsent>;
    if (stored.version !== CONSENT_VERSION || typeof stored.analytics !== "boolean") return "unset";
    return stored.analytics ? "granted" : "denied";
  } catch {
    return "unset";
  }
}

let state: ConsentState = { choice: readChoice(), reopened: false };
const listeners = new Set<() => void>();

function update(next: ConsentState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Decyzja podjęta w innej karcie obowiązuje od razu we wszystkich.
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY || event.key === null) {
      update({ choice: readChoice(), reopened: false });
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getConsentState(): ConsentState {
  return state;
}

export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribe, getConsentState, getConsentState);
}

/** Zapisuje decyzję użytkownika i zamyka baner. */
export function setAnalyticsConsent(granted: boolean): void {
  const stored: StoredConsent = { analytics: granted, version: CONSENT_VERSION, at: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Brak dostępu do pamięci przeglądarki: decyzja obowiązuje do końca tej wizyty, potem baner zapyta ponownie.
  }
  update({ choice: granted ? "granted" : "denied", reopened: false });
}

/** Link „Ustawienia cookies”: pokazuje baner jeszcze raz, żeby można było zmienić decyzję. */
export function openConsentSettings(): void {
  update({ ...state, reopened: true });
}

export function closeConsentSettings(): void {
  update({ ...state, reopened: false });
}
