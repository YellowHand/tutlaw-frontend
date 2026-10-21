/**
 * Losowa kolejność odpowiedzi A/B/C w pytaniu testowym.
 *
 * Odpowiedź na pytanie zawsze jest jedna poprawna, więc samo wymieszanie opcji nic nie psuje, o ile pytanie
 * nie odwołuje się do innych opcji ("Tylko A i B", "Żadna z powyższych", "Obie odpowiedzi są poprawne").
 * Takim pytaniom zostawiamy kolejność z bazy. Wykrywanie jest ostrożne: lepiej raz nie wymieszać niż
 * wymieszać pytanie, które przestaje mieć sens.
 */
export type OptionKey = "A" | "B" | "C";

export const OPTION_KEYS: readonly OptionKey[] = ["A", "B", "C"];

/** Kolejność wyświetlania: order[i] to oryginalny klucz odpowiedzi pokazywanej na pozycji i (A, B, C od góry). */
export type OptionOrder = readonly [OptionKey, OptionKey, OptionKey];

const IDENTITY: OptionOrder = ["A", "B", "C"];

// \b w JavaScript zna tylko litery ASCII ("ż", "ą" i "ł" nie są dla niego literami), więc granice słów i
// końcówki wyrazów zapisujemy własnymi wyrażeniami opartymi o \p{L}.
// Początek wyrazu bez lookbehind (starsze przeglądarki go nie znają): początek tekstu albo znak niebędący literą.
const START = "(?:^|[^\\p{L}\\p{N}_])";
const END = "(?![\\p{L}\\p{N}_])";
const REST = "\\p{L}*";

function pattern(source: string, flags = "iu"): RegExp {
  return new RegExp(source.replaceAll("<", START).replaceAll(">", END).replaceAll("~", REST), flags);
}

// W zapisie: "<" początek wyrazu, ">" koniec wyrazu, "~" dowolna końcówka (litery).
const REFERENCE_PATTERNS: RegExp[] = [
  // "Żadna z powyższych", "wszystkie wymienione", "pozostałe odpowiedzi", "poprzednie"
  pattern("powyższ|wyżej|poprzedni|pozostał|wymienion|następując"),
  // "Wszystkie odpowiedzi są prawidłowe", "Obie odpowiedzi", "Żadne ze stwierdzeń"
  pattern(
    "<(wszystk~|żadn~|obie|oba|obydwie|obydwa|każd~)>[^.]{0,30}<(odpowied~|opcj~|stwierdzeni~|twierdzeni~|zdani~|wariant~|propozycj~)"
  ),
  // "Żadna z tych", "Wszystkie z wymienionych", "Żaden ze"
  pattern("<(żadn~|wszystk~)\\s+(z|ze)>"),
  // "Brak prawidłowej odpowiedzi", "Nie ma poprawnej odpowiedzi", "Inna odpowiedź"
  pattern("<brak\\s+(prawidłow|poprawn)~\\s+odpowied"),
  pattern("<nie\\s+ma\\s+(prawidłow|poprawn)~\\s+odpowied"),
  pattern("<inn~\\s+odpowied"),
  pattern("^\\s*(inn[aey]|pozostał~|żadn~)\\s*\\.?\\s*$"),
  // "odpowiedź B", "opcja C", "wariant A", "stwierdzenie 2", "punkt 1"
  pattern("<(odpowied~|opcj~|wariant~|stwierdzeni~|twierdzeni~|zdani~|punkt~|pkt\\.?)\\s*\\(?[A-Ca-c1-3]>"),
  // wielka litera jako odnośnik: "A i B", "Tylko A", "B)", "A, B"
  pattern("(^|[\\s(,;])[ABC]\\s*(\\)|\\.|,|;|$|\\s+(i|oraz|lub|albo|jak|są|jest)>)", "u"),
  // "a)", "b)"
  pattern("(^|[\\s(,;])[abc]\\)", "u"),
  pattern("<(tylko|wyłącznie|jedynie)\\s+[ABC]>"),
];

/** Czy któraś z odpowiedzi odwołuje się do innych odpowiedzi (wtedy kolejności nie wolno zmieniać). */
export function referencesOtherOptions(texts: readonly string[]): boolean {
  return texts.some((text) => REFERENCE_PATTERNS.some((pattern) => pattern.test(text)));
}

/**
 * Kolejność odpowiedzi dla jednego pytania. Pytania odwołujące się do innych odpowiedzi dostają kolejność z bazy,
 * pozostałe losową (Fisher-Yates). {@code random} można podmienić w testach.
 */
export function pickOptionOrder(texts: readonly [string, string, string], random: () => number = Math.random): OptionOrder {
  if (referencesOtherOptions(texts)) return IDENTITY;

  const order: OptionKey[] = [...OPTION_KEYS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order as unknown as OptionOrder;
}

/** Litera, pod którą oryginalna odpowiedź jest teraz wyświetlana. */
export function displayKeyOf(order: OptionOrder, originalKey: OptionKey): OptionKey {
  return OPTION_KEYS[order.indexOf(originalKey)];
}

/** Oryginalny klucz odpowiedzi, którą użytkownik zobaczył pod daną literą. */
export function originalKeyOf(order: OptionOrder, displayedKey: OptionKey): OptionKey {
  return order[OPTION_KEYS.indexOf(displayedKey)];
}
