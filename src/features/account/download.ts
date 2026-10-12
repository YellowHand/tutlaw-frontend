/** Zapisuje tekst jako plik na dysku użytkownika (bez wysyłania go gdziekolwiek indziej). */
export function saveTextFile(filename: string, content: string, mimeType = "application/json"): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${mimeType};charset=utf-8` }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Przeglądarka potrzebuje chwili, żeby rozpocząć pobieranie, zanim zwolnimy adres.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Nazwa pliku z kopią danych, np. tutlaw-moje-dane-2026-10-12.json. */
export function exportFilename(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `tutlaw-moje-dane-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}
