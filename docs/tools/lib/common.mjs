// Wspólne funkcje dla check-docs.mjs i build-viewer.mjs (bez zależności, sam Node.js).
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/** Wszystkie pliki .md w katalogu (rekurencyjnie), posortowane. Pomija tools/ i node_modules/. */
export function listMarkdown(dir) {
  const out = [];
  (function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "tools" || entry.name.startsWith(".")) continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".md")) out.push(full);
    }
  })(dir);
  return out.sort((a, b) => a.localeCompare(b, "en"));
}

/** Skrót SHA-256 z listy plików (nazwa względem katalogu + treść). Zmienia się przy każdej zmianie w .md. */
export function hashMarkdown(dir) {
  const h = crypto.createHash("sha256");
  for (const file of listMarkdown(dir)) {
    h.update(path.relative(dir, file).split(path.sep).join("/"));
    h.update("\0");
    h.update(fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n"));
    h.update("\0");
  }
  return h.digest("hex");
}

/** Zastępuje bloki kodu (``` … ```) pustymi liniami, zachowując numery linii. */
export function stripFences(md) {
  const lines = md.split("\n");
  let inFence = false;
  return lines
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return "";
      }
      return inFence ? "" : line;
    })
    .join("\n");
}

/** Bloki kodu: [{ lang, body, line }]. */
export function fencedBlocks(md) {
  const blocks = [];
  const lines = md.split("\n");
  let cur = null;
  lines.forEach((line, i) => {
    const m = /^\s*```(\w*)\s*$/.exec(line);
    if (m && cur === null) cur = { lang: m[1], body: [], line: i + 1 };
    else if (/^\s*```\s*$/.test(line) && cur !== null) {
      blocks.push({ lang: cur.lang, body: cur.body.join("\n"), line: cur.line });
      cur = null;
    } else if (cur !== null) cur.body.push(line);
  });
  return { blocks, unclosed: cur !== null };
}

/** Tekst nagłówka bez formatowania (kod, pogrubienia, odnośniki). */
export function plainHeading(text) {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*]/g, "")
    .trim();
}

/** Anchor w stylu GitHub: małe litery, bez znaków specjalnych, spacje na myślniki, polskie litery zostają. */
export function slugify(text) {
  return plainHeading(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

/** Nagłówki dokumentu: [{ level, text, id }] z unikalnymi id (powtórzenia dostają -1, -2…). */
export function headings(md) {
  const seen = new Map();
  const out = [];
  stripFences(md)
    .split("\n")
    .forEach((line, i) => {
      const m = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
      if (!m) return;
      const base = slugify(m[2]);
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      out.push({ level: m[1].length, text: plainHeading(m[2]), id: n === 0 ? base : `${base}-${n}`, line: i + 1 });
    });
  return out;
}

/** Wiersze tabel Markdown (bez nagłówka i separatora): [{ cells, line }]. */
export function tableRows(md) {
  const rows = [];
  const lines = stripFences(md).split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("|")) continue;
    if (/^\|[\s:|-]+\|?$/.test(line)) continue; // separator
    const cells = line
      .replace(/^\|/, "")
      .replace(/\|\s*$/, "")
      .split("|")
      .map((c) => c.trim());
    // pomijamy wiersz nagłówkowy: następna linia to separator
    if (lines[i + 1] && /^\|[\s:|-]+\|?$/.test(lines[i + 1])) continue;
    rows.push({ cells, line: i + 1 });
  }
  return rows;
}

/** Pierwszy fragment w znakach `kod` w komórce, albo null. */
export function codeIn(cell) {
  const m = /`([^`]+)`/.exec(cell);
  return m ? m[1] : null;
}

export function codeAll(cell) {
  return [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
}
