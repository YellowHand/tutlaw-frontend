/**
 * Polska typografia: po jednoliterowych spójnikach i przyimkach (a, i, o, u, w, z) twarda spacja, żeby wiersz
 * nie kończył się na "w" albo "z". Tak samo w "art. 8 § 1" i "13 lat". "FSRS-6" nie łamie się po myślniku
 * (U+2060 to niewidoczny "łącznik słów", każdy krój go zna).
 */
const NBSP = " ";

export function nbsp(text: string): string {
  const singleLetter = /(^|[\s(„])([aiouwzAIOUWZ])\s+/g;
  // Dwa przebiegi, bo kolejne jednoliterowe słowa ("i w domu") dzielą jedną spację.
  return text
    .replace(singleLetter, `$1$2${NBSP}`)
    .replace(singleLetter, `$1$2${NBSP}`)
    .replace(/art\. (\d+) § (\d+)/g, `art.${NBSP}$1${NBSP}§${NBSP}$2`)
    .replace(/(\d+) (lat|dni)\b/g, `$1${NBSP}$2`)
    .replace(/FSRS-6/g, "FSRS-⁠6");
}

/** Przechodzi po całym obiekcie tekstów i stosuje nbsp() do każdego napisu. */
export function deepNbsp<T>(value: T): T {
  if (typeof value === "string") return nbsp(value) as T;
  if (Array.isArray(value)) return value.map((item) => deepNbsp(item)) as T;
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deepNbsp(item)])) as T;
  }
  return value;
}
