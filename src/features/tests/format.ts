/**
 * 3052 → „3 052" (twarda spacja jako separator tysięcy).
 * Intl dla pl-PL nie grupuje liczb czterocyfrowych (zapisałby „3052"), a u konkurencji i w całej aplikacji
 * chcemy jednolicie „3 052", więc grupujemy ręcznie.
 */
export function formatCount(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
