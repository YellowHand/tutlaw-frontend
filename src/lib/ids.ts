/** Parametr z adresu na liczbę; zły albo brakujący parametr to undefined (zapytanie się wtedy nie wysyła). */
export function parseId(value: string | null | undefined): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}
