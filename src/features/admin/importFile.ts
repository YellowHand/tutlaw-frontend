import type { ImportFormat } from "../../api/admin";

/** Serwer przyjmuje do 4 MB tekstu i 5000 pytań w jednym pliku. */
export const MAX_IMPORT_BYTES = 4_000_000;
export const MAX_IMPORT_QUESTIONS = 5000;

/**
 * Tekst pliku. Zwykle UTF-8, ale polski Excel zapisuje „CSV” w stronie kodowej Windows-1250: gdy plik nie jest poprawnym
 * UTF-8, czytamy go jako Windows-1250, żeby polskie litery nie zamieniły się w krzaczki.
 */
export function decodeImportBytes(buffer: ArrayBuffer): { text: string; encoding: "utf-8" | "windows-1250" } {
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(buffer), encoding: "utf-8" };
  } catch {
    return { text: new TextDecoder("windows-1250").decode(buffer), encoding: "windows-1250" };
  }
}

/** Format z rozszerzenia pliku, a gdy to nie rozstrzyga, z pierwszego znaku treści (`[` albo `{` to JSON). */
export function guessImportFormat(fileName: string, text: string): ImportFormat {
  const name = fileName.toLowerCase();
  if (name.endsWith(".json")) return "JSON";
  if (name.endsWith(".csv") || name.endsWith(".tsv")) return "CSV";
  const first = text.trimStart().charAt(0);
  return first === "[" || first === "{" ? "JSON" : "CSV";
}

export const SAMPLE_CSV = [
  "akt;zrodlo;rozdzial;tresc;a;b;c;poprawna;wyjasnienie;podstawa;zmiana w prawie;opis zmiany",
  'paremie-lacinskie;autorskie;;Co oznacza paremia „pacta sunt servanda”?;Umów należy dotrzymywać;Umowę można wypowiedzieć w każdej chwili;Umowa wiąże tylko świadków;A;Zasada wiążącej mocy umów.;;;',
  'paremie-lacinskie;autorskie;;Co oznacza paremia „nemo iudex in causa sua”?;Nikt nie powinien być sędzią we własnej sprawie;Sędzia zawsze rozstrzyga według własnego uznania;Strony wybierają sędziego;A;;;;',
  "",
].join("\r\n");

export const SAMPLE_JSON = JSON.stringify(
  {
    akt: "paremie-lacinskie",
    zrodlo: "autorskie",
    pytania: [
      {
        tresc: "Co oznacza paremia „pacta sunt servanda”?",
        a: "Umów należy dotrzymywać",
        b: "Umowę można wypowiedzieć w każdej chwili",
        c: "Umowa wiąże tylko świadków",
        poprawna: "A",
        wyjasnienie: "Zasada wiążącej mocy umów.",
      },
      {
        tresc: "Co oznacza paremia „nemo iudex in causa sua”?",
        odpowiedzi: ["Nikt nie powinien być sędzią we własnej sprawie", "Sędzia zawsze rozstrzyga według własnego uznania", "Strony wybierają sędziego"],
        poprawna: "A",
      },
    ],
  },
  null,
  2
);

/** Zapisuje tekst jako plik do pobrania (wzory plików importu). CSV dostaje BOM, żeby Excel rozpoznał UTF-8. */
export function downloadTextFile(fileName: string, text: string, mime: string): void {
  const bom = fileName.endsWith(".csv") ? "﻿" : "";
  const url = URL.createObjectURL(new Blob([bom, text], { type: `${mime};charset=utf-8` }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
