import type { MarkOrigin, MarkStatus, MarkType } from "../../api/admin";

/** Rodzaje oznaczeń w kolejności wyświetlania, z nazwą i krótkim wyjaśnieniem dla administratora. */
export const MARK_TYPES: { type: MarkType; label: string; hint: string }[] = [
  { type: "TIME_LIMIT", label: "Pytanie z terminem", hint: "W pytaniu pada termin, a odpowiedzi różnią się terminami albo liczbą dni. Trafia do testu „Pytania z terminów”." },
  { type: "TRAP_NEGATION", label: "Pułapka: przeczenie", hint: "Przeczenie albo wyjątek („nie jest”, „nieprawidłowe”, „z wyjątkiem”)." },
  { type: "TRAP_ABSOLUTE", label: "Pułapka: słowo bezwzględne", hint: "W odpowiedzi jest „zawsze”, „nigdy”, „wyłącznie” albo „jedynie”." },
  { type: "TRAP_NUMBERS", label: "Pułapka: zbliżone liczby", hint: "Odpowiedzi różnią się zbliżonymi liczbami albo terminami (7 / 14 / 30 dni)." },
  { type: "TRAP_CONJUNCTION", label: "Pułapka: spójnik", hint: "Odpowiedzi różnią się spójnikiem („i” zamiast „lub”)." },
  { type: "TRAP_OUTDATED_LAW", label: "Pułapka: nieaktualny stan prawny", hint: "Poprawna jest odpowiedź według dawnego stanu prawnego. Automat tego nie rozpoznaje: tylko ręcznie." },
];

export function markLabel(type: MarkType): string {
  return MARK_TYPES.find((m) => m.type === type)?.label ?? type;
}

export const MARK_STATUS_LABELS: Record<MarkStatus, string> = {
  SUGGESTED: "Propozycje",
  CONFIRMED: "Zatwierdzone",
  REJECTED: "Odrzucone",
};

export const MARK_ORIGIN_LABELS: Record<MarkOrigin, string> = {
  AUTO: "zaproponował automat",
  MANUAL: "nadane ręcznie",
};

export function isMarkType(value: string): value is MarkType {
  return MARK_TYPES.some((m) => m.type === value);
}

export function isMarkStatus(value: string): value is MarkStatus {
  return value === "SUGGESTED" || value === "CONFIRMED" || value === "REJECTED";
}
