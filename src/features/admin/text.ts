/**
 * Tekst do porównań bez wielkości liter i bez polskich znaków (ł→l, ą→a...): tak samo jak backend porównuje nazwy,
 * więc „Łódź" i „lodz" to w panelu to samo słowo.
 */
export function fold(value: string): string {
  return value
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}
