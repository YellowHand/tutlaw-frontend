const pluralRules = new Intl.PluralRules("pl");

interface PluralForms {
  one: string;
  few: string;
  many: string;
}

// Used by statistics widgets from Etap 2 onwards, e.g.
// pluralizePl(count, { one: "fiszka", few: "fiszki", many: "fiszek" })
export function pluralizePl(count: number, forms: PluralForms): string {
  const category = pluralRules.select(count);
  if (category === "one") return forms.one;
  if (category === "few") return forms.few;
  return forms.many;
}