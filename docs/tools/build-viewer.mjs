#!/usr/bin/env node
// Buduje docs/dokumentacja.html: jedną samodzielną stronę (bez internetu i serwera) z dokumentacją frontendu
// i backendu: spis treści, wyszukiwarka, diagramy Mermaid, tryb jasny i ciemny.
//
// Użycie (z katalogu głównego frontendu):
//   npm run docs:build
//   node docs/tools/build-viewer.mjs [--backend <katalog docs backendu>] [--frontend-only] [--out <plik.html>]
//
// Wymaga zainstalowanych zależności z docs/tools/package.json (marked, mermaid, czcionka); `npm run docs:build`
// instaluje je sam (npm --prefix docs/tools ci).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashMarkdown, headings as mdHeadings, listMarkdown, plainHeading, slugify } from "./lib/common.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(here, "..");
const ROOT = path.resolve(DOCS, "..");

// ---------- argumenty ----------
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
if (flag("--help")) {
  console.log("Użycie: node docs/tools/build-viewer.mjs [--backend <katalog docs backendu>] [--frontend-only] [--out <plik.html>]");
  process.exit(0);
}
const frontendOnly = flag("--frontend-only");
const backendDir = path.resolve(process.cwd(), value("--backend") ?? path.join(ROOT, "..", "port-be", "docs"));
const outFile = path.resolve(process.cwd(), value("--out") ?? path.join(DOCS, "dokumentacja.html"));

function die(message) {
  console.error(`\nBŁĄD: ${message}\n`);
  process.exit(1);
}

if (!frontendOnly && !fs.existsSync(path.join(backendDir, "README.md"))) {
  die(
    `Nie znaleziono dokumentacji backendu w: ${backendDir}\n` +
      "Połóż repozytorium backendu obok frontendu (katalog port-be obok port-fe), podaj katalog parametrem\n" +
      "  --backend <ścieżka/do/docs>\n" +
      "albo zbuduj podgląd tylko z dokumentacji frontendu:\n" +
      "  node docs/tools/build-viewer.mjs --frontend-only"
  );
}

// ---------- zależności narzędzia ----------
let Marked;
try {
  ({ Marked } = await import("marked"));
} catch {
  die("Brak zainstalowanych zależności narzędzia. Uruchom: npm --prefix docs/tools ci (albo po prostu npm run docs:build).");
}
const toolsDir = here;
const resolveDep = (p) => path.join(toolsDir, "node_modules", p);
const mermaidFile = resolveDep("mermaid/dist/mermaid.min.js");
const manropeCss = resolveDep("@fontsource-variable/manrope/index.css");
for (const f of [mermaidFile, manropeCss]) if (!fs.existsSync(f)) die(`Brakuje pliku ${path.relative(ROOT, f)}. Uruchom: npm --prefix docs/tools ci`);

// ---------- pomocnicze ----------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

const SETS = [
  {
    id: "fe",
    title: "Frontend",
    short: "Frontend",
    dir: DOCS,
    blurb: "Strona internetowa (React i TypeScript): ekrany, logowanie i sesja, nauka w aplikacji, warstwa API, wygląd, konfiguracja.",
  },
];
if (!frontendOnly) {
  SETS.push({
    id: "be",
    title: "Backend",
    short: "Backend",
    dir: backendDir,
    blurb: "Serwer (Spring Boot, PostgreSQL): architektura, baza danych, bezpieczeństwo, algorytm FSRS-6, konfiguracja i wszystkie endpointy REST.",
  });
}

const warnings = [];

// ---------- renderowanie Markdown ----------
function pageIdOf(set, file) {
  return `${set.id}/${path.relative(set.dir, file).split(path.sep).join("/").replace(/\.md$/, "")}`;
}

function buildPage(set, file, knownPages) {
  const md = read(file);
  const id = pageIdOf(set, file);
  const relDir = path.posix.dirname(id.slice(set.id.length + 1)); // "." albo "api"
  const seen = new Map();
  const collected = [];

  const resolveLink = (href) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return { kind: "external", href };
    const [p, a] = href.split("#");
    let decodedAnchor = a ?? "";
    try {
      decodedAnchor = decodeURIComponent(decodedAnchor);
    } catch {
      /* zostaje */
    }
    if (!p) return { kind: "internal", hash: `#/${id}${decodedAnchor ? `#${decodedAnchor}` : ""}` };
    const target = path.posix.normalize(path.posix.join(relDir, p)).replace(/\.md$/, "");
    const targetId = `${set.id}/${target}`;
    if (knownPages.has(targetId)) return { kind: "internal", hash: `#/${targetId}${decodedAnchor ? `#${decodedAnchor}` : ""}` };
    return { kind: "missing", href };
  };

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth, text }) {
        const base = slugify(text);
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        const hid = n === 0 ? base : `${base}-${n}`;
        collected.push({ id: hid, text: plainHeading(text), level: depth });
        const inner = this.parser.parseInline(tokens);
        const anchor = depth >= 2 ? `<a class="anchor" href="#/${id}#${esc(hid)}" aria-label="Odnośnik do tej sekcji">#</a>` : "";
        return `<h${depth} id="${esc(hid)}">${anchor}${inner}</h${depth}>\n`;
      },
      code({ text, lang }) {
        const l = (lang ?? "").trim().split(/\s+/)[0];
        if (l === "mermaid") return `<div class="mermaid-wrap" data-src="${esc(text)}"><p class="pending">Rysuję diagram…</p></div>\n`;
        return `<pre><code${l ? ` class="language-${esc(l)}"` : ""}>${esc(text)}</code></pre>\n`;
      },
      link({ href, title, tokens }) {
        const inner = this.parser.parseInline(tokens);
        const r = resolveLink(href);
        const t = title ? ` title="${esc(title)}"` : "";
        if (r.kind === "external") return `<a href="${esc(r.href)}"${t} target="_blank" rel="noopener noreferrer">${inner}</a>`;
        if (r.kind === "internal") return `<a href="${esc(r.hash)}"${t}>${inner}</a>`;
        if (!/dokumentacja\.html$/.test(href)) warnings.push(`${id}: odnośnik „${href}” nie prowadzi do dokumentu z podglądu`);
        return `<span class="nolink" title="Ten plik nie jest częścią podglądu: ${esc(href)}">${inner}</span>`;
      },
      html({ text }) {
        return esc(text);
      },
    },
  });

  let html = marked.parse(md);
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");
  const h1 = collected.find((h) => h.level === 1);
  const title = h1 ? h1.text : id;

  // spójność identyfikatorów z checkerem (te same reguły slugów)
  const expected = mdHeadings(md).map((h) => h.id).join("|");
  if (expected !== collected.map((h) => h.id).join("|")) warnings.push(`${id}: identyfikatory nagłówków różnią się od reguł sprawdzarki`);

  return { id, set: set.id, title, html, headings: collected };
}

function sectionsOf(page) {
  const chunks = page.html.split(/(?=<h[1-4] id=")/);
  const out = [];
  for (const chunk of chunks) {
    const m = /^<h([1-4]) id="([^"]+)"/.exec(chunk);
    if (!m) continue;
    const text = decode(
      chunk
        .replace(/<div class="mermaid-wrap"[^>]*>[\s\S]*?<\/div>/g, " ")
        .replace(/<a class="anchor"[^>]*>#<\/a>/g, "")
        .replace(/<[^>]+>/g, " ")
    )
      .replace(/\s+/g, " ")
      .trim();
    const heading = page.headings.find((h) => h.id === decode(m[2]));
    out.push({ p: page.id, i: decode(m[2]), h: heading ? heading.text : page.title, t: text });
  }
  return out;
}

// ---------- zbieranie dokumentów ----------
const pages = {};
const sections = [];
const knownByDir = new Map();
for (const set of SETS) {
  const files = listMarkdown(set.dir);
  knownByDir.set(set.id, files);
}
const allKnown = new Set(SETS.flatMap((set) => knownByDir.get(set.id).map((f) => pageIdOf(set, f))));

for (const set of SETS) {
  const files = knownByDir.get(set.id);
  // README na początku, potem pliki w katalogu głównym, potem podkatalogi (np. api/)
  const rank = (f) => {
    const r = path.relative(set.dir, f).split(path.sep);
    return [r.length > 1 ? 1 : 0, r.length > 1 ? r[0] : "", r[r.length - 1] === "README.md" ? 0 : 1, r[r.length - 1]];
  };
  files.sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    for (let i = 0; i < ra.length; i++) {
      if (ra[i] === rb[i]) continue;
      return typeof ra[i] === "number" ? ra[i] - rb[i] : String(ra[i]).localeCompare(String(rb[i]), "en");
    }
    return 0;
  });
  const groups = new Map();
  for (const file of files) {
    const page = buildPage(set, file, allKnown);
    const relParts = path.relative(set.dir, file).split(path.sep);
    const groupKey = relParts.length > 1 ? relParts[0] : "";
    if (relParts.length === 1 && relParts[0] === "README.md") page.navLabel = "Spis treści";
    pages[page.id] = page;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(page.id);
    sections.push(...sectionsOf(page));
  }
  set.nav = [...groups.entries()].map(([key, ids]) => ({ label: key === "" ? "" : key.toUpperCase(), pages: ids }));
}

// ---------- strona startowa ----------
const home = `
<h1>Dokumentacja Gradus iuris</h1>
<p class="lead">Wszystko o aplikacji Gradus iuris po polsku: jak jest zbudowana, co robi każdy ekran i endpoint, jak liczone są powtórki i gdzie w kodzie szukać konkretnej rzeczy.</p>
<div class="cards">
${SETS.map(
  (set) => `  <a class="card" href="#/${set.id}/README">
    <h2>${esc(set.title)}</h2>
    <p>${esc(set.blurb)}</p>
    <span class="go">Otwórz spis treści →</span>
  </a>`
).join("\n")}
</div>
<h2>Jak z tego korzystać</h2>
<dl>
  <dt>Szukaj</dt><dd>Naciśnij <kbd>/</kbd> albo <kbd>Ctrl</kbd> + <kbd>K</kbd> i wpisz słowo. Wyszukiwarka nie zwraca uwagi na polskie znaki ani wielkość liter i przeszukuje oba działy naraz.</dd>
  <dt>Przechodź</dt><dd>Spis dokumentów jest po lewej, a lista sekcji bieżącej strony po prawej (na szerokim ekranie). Na końcu każdej strony są odnośniki do poprzedniej i następnej.</dd>
  <dt>Motyw</dt><dd>Przycisk z księżycem lub słońcem w prawym górnym rogu przełącza tryb jasny i ciemny. Wybór jest zapamiętywany.</dd>
  <dt>Drukuj</dt><dd>Wydruk pomija menu i wyszukiwarkę, zostaje sama treść bieżącej strony.</dd>
</dl>
<p>${
  frontendOnly
    ? "Ten podgląd zbudowano <strong>tylko z dokumentacji frontendu</strong> (parametr <code>--frontend-only</code>)."
    : "Dokumentacja backendu jest <strong>kopią z chwili budowania</strong> tego pliku. Po zmianie dokumentacji któregokolwiek projektu zbuduj plik od nowa poleceniem <code>npm run docs:build</code>."
}</p>
`;

// ---------- czcionka Manrope (podzbiory latin i latin-ext, z polskimi znakami) w pliku ----------
function fontFaces() {
  const css = read(manropeCss);
  const dir = path.dirname(manropeCss);
  const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)].filter((m) => m[1] === "manrope-latin-wght-normal" || m[1] === "manrope-latin-ext-wght-normal");
  if (blocks.length !== 2) die("Nie udało się odczytać podzbiorów latin i latin-ext z czcionki Manrope.");
  return blocks
    .map((m) =>
      m[2].replace(/url\(([^)]+)\)/g, (_, u) => {
        const clean = u.replace(/["']/g, "");
        const file = path.resolve(dir, clean);
        if (!fs.existsSync(file)) die(`Brak pliku czcionki ${file}`);
        return `url(data:font/woff2;base64,${fs.readFileSync(file).toString("base64")})`;
      })
    )
    .join("\n");
}

// ---------- składanie pliku ----------
const jsonForScript = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

const data = {
  sets: SETS.map(({ id, title, short, nav }) => ({ id, title, short, nav })),
  pages,
  sections,
  home,
};

const template = read(path.join(here, "viewer", "template.html"));
const css = read(path.join(here, "viewer", "viewer.css"));
const js = read(path.join(here, "viewer", "viewer.js"));
if (/<\/script/i.test(js)) die("viewer.js zawiera </script, co zepsułoby osadzenie w HTML.");

const parts = {
  "@@HASH_FRONTEND@@": hashMarkdown(DOCS),
  "@@HASH_BACKEND@@": frontendOnly ? "" : hashMarkdown(backendDir),
  "@@FONTS@@": fontFaces(),
  "@@CSS@@": css,
  "@@DATA@@": jsonForScript(data),
  "@@MERMAID@@": jsonForScript(read(mermaidFile)),
  "@@JS@@": js,
};
for (const key of Object.keys(parts)) if (!template.includes(key)) die(`Szablon nie zawiera znacznika ${key}.`);
// jedno przejście po szablonie: wstawiane treści nie są ponownie przeszukiwane pod kątem znaczników
const html = template.replace(/@@[A-Z_]+@@/g, (key) => {
  if (!(key in parts)) die(`Szablon zawiera nieznany znacznik ${key}.`);
  return parts[key];
});

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html, "utf8");

const pageCount = Object.keys(pages).length;
const mb = (fs.statSync(outFile).size / 1024 / 1024).toFixed(1);
console.log(`Zbudowano ${path.relative(process.cwd(), outFile) || outFile}: ${pageCount} stron (${SETS.map((s) => s.title).join(" + ")}), ${sections.length} sekcji do wyszukiwania, ${mb} MB.`);
for (const w of warnings) console.warn(`  uwaga: ${w}`);
