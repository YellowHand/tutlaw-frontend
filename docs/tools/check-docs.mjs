#!/usr/bin/env node
// Sprawdza, czy dokumentacja frontendu (docs/*.md) zgadza się z kodem (src/, package.json, .env*).
// Bez żadnych zależności: sam Node.js. Uruchomienie: npm run docs:check
//
// Opcje:
//   --backend <katalog>   katalog docs/ backendu (domyślnie ../port-be/docs obok tego projektu); gdy go nie ma,
//                         sprawdzenia względem backendu są pomijane
//   --help                krótka pomoc
//
// Kod wyjścia: 0 = wszystko się zgadza, 1 = są rozbieżności, 2 = błąd uruchomienia.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  codeAll,
  codeIn,
  fencedBlocks,
  hashMarkdown,
  headings,
  listMarkdown,
  stripFences,
  tableRows,
} from "./lib/common.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(here, "..");
const ROOT = path.resolve(DOCS, "..");
const SRC = path.join(ROOT, "src");

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log("Użycie: node docs/tools/check-docs.mjs [--backend <katalog docs backendu>]");
  process.exit(0);
}
const backendArgIndex = args.indexOf("--backend");
const BACKEND_DOCS =
  backendArgIndex >= 0 ? path.resolve(process.cwd(), args[backendArgIndex + 1] ?? "") : path.resolve(ROOT, "../port-be/docs");
const hasBackend = fs.existsSync(path.join(BACKEND_DOCS, "api", "README.md"));

// ---------- pomocnicze ----------

const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const rel = (file) => path.relative(ROOT, file).split(path.sep).join("/");

function walk(dir, filter = () => true) {
  const out = [];
  (function go(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) go(full);
      else if (filter(full)) out.push(full);
    }
  })(dir);
  return out.sort();
}

const srcFiles = walk(SRC);
const codeFiles = srcFiles.filter((f) => /\.(ts|tsx)$/.test(f));
const codeText = new Map(codeFiles.map((f) => [f, read(f)]));

const docFiles = fs
  .readdirSync(DOCS)
  .filter((f) => f.endsWith(".md"))
  .sort()
  .map((f) => path.join(DOCS, f));
const docText = new Map(docFiles.map((f) => [f, read(f)]));
const doc = (name) => {
  const file = path.join(DOCS, name);
  if (!docText.has(file)) throw new Error(`Brak pliku dokumentacji: docs/${name}`);
  return docText.get(file);
};

const results = [];
function check(name, fn) {
  let errors = [];
  let info = "";
  try {
    const r = fn();
    errors = r.errors ?? [];
    info = r.info ?? "";
  } catch (e) {
    errors = [`Wyjątek w sprawdzeniu: ${e.message}`];
  }
  results.push({ name, errors, info });
}

const setDiff = (a, b) => [...a].filter((x) => !b.has(x)).sort();

// ---------- 1. struktura dokumentacji, odnośniki, bloki kodu ----------

check("struktura i spis treści", () => {
  const errors = [];
  const readme = doc("README.md");
  const numbered = docFiles.map((f) => path.basename(f)).filter((f) => /^\d\d-.*\.md$/.test(f));
  for (const f of numbered) {
    if (!readme.includes(`(${f})`)) errors.push(`README.md nie ma odnośnika do ${f} w spisie treści.`);
    const text = docText.get(path.join(DOCS, f));
    if (!/^# \S/.test(text)) errors.push(`${f}: pierwsza linia powinna być nagłówkiem „# …”.`);
    if (!text.includes("[← Spis treści](README.md)")) errors.push(`${f}: brak odnośnika „← Spis treści”.`);
    const num = f.slice(0, 2);
    if (!new RegExp(`^# ${num}\\. `).test(text)) errors.push(`${f}: tytuł powinien zaczynać się od „${num}. ”.`);
  }
  const expected = Array.from({ length: numbered.length }, (_, i) => String(i + 1).padStart(2, "0"));
  const have = numbered.map((f) => f.slice(0, 2));
  if (expected.join() !== have.join()) errors.push(`Numeracja plików jest nieciągła: ${have.join(", ")}.`);
  return { errors, info: `${numbered.length} dokumentów numerowanych + README` };
});

check("bloki kodu i diagramy Mermaid", () => {
  const errors = [];
  let mermaid = 0;
  const known = /^(flowchart|graph|sequenceDiagram|stateDiagram(-v2)?|classDiagram|erDiagram|gantt|pie|journey|mindmap|timeline)\b/;
  for (const [file, text] of docText) {
    const { blocks, unclosed } = fencedBlocks(text);
    if (unclosed) errors.push(`${path.basename(file)}: niezamknięty blok kodu (brak zamykającego \`\`\`).`);
    for (const b of blocks) {
      if (b.lang === "mermaid") {
        mermaid++;
        if (!known.test(b.body.trim())) errors.push(`${path.basename(file)}:${b.line}: diagram Mermaid zaczyna się od nieznanego słowa.`);
        // Średnik w treści komunikatu diagramu sekwencji kończy instrukcję i psuje cały diagram.
        if (/^sequenceDiagram\b/.test(b.body.trim())) {
          b.body.split("\n").forEach((line, i) => {
            if (line.includes(":") && line.slice(line.indexOf(":") + 1).includes(";")) {
              errors.push(`${path.basename(file)}:${b.line + 1 + i}: średnik w treści komunikatu diagramu sekwencji (Mermaid nie narysuje diagramu); użyj przecinka.`);
            }
          });
        }
      }
    }
  }
  return { errors, info: `${mermaid} diagramów` };
});

check("odnośniki i kotwice", () => {
  const errors = [];
  let count = 0;
  const headingCache = new Map();
  const idsOf = (file) => {
    if (!headingCache.has(file)) headingCache.set(file, new Set(headings(read(file)).map((h) => h.id)));
    return headingCache.get(file);
  };
  for (const [file, text] of docText) {
    const lines = stripFences(text).split("\n");
    lines.forEach((line, i) => {
      const noCode = line.replace(/`[^`]*`/g, "");
      for (const m of noCode.matchAll(/\[([^\]]*)\]\(([^)\s]+)\)/g)) {
        const target = m[2];
        if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
        count++;
        const [p, a] = target.split("#");
        const where = `${path.basename(file)}:${i + 1}`;
        let targetFile = file;
        if (p) {
          targetFile = path.resolve(path.dirname(file), decodeURIComponent(p));
          // dokumentacja.html jest wynikiem budowania i sprawdzamy ją osobno (świeżość)
          if (path.basename(targetFile) === "dokumentacja.html") continue;
          if (!fs.existsSync(targetFile)) {
            errors.push(`${where}: odnośnik do nieistniejącego pliku „${p}”.`);
            continue;
          }
        }
        if (a) {
          if (!targetFile.endsWith(".md")) continue;
          let anchor = a;
          try {
            anchor = decodeURIComponent(a);
          } catch {
            /* zostaje jak jest */
          }
          if (!idsOf(targetFile).has(anchor)) errors.push(`${where}: brak nagłówka dla kotwicy „#${anchor}” w ${path.basename(targetFile)}.`);
        }
      }
    });
  }
  return { errors, info: `${count} odnośników` };
});

// ---------- 2. trasy ----------

/** Zwraca { leaves: adresy ekranów, redirects: [{ from, to }] dla tras index z <Navigate>. Trasy z dziećmi (układy) nie są ekranami. */
function parseRoutes(code) {
  const routes = [];
  const layouts = [];
  const redirects = [];
  const stack = [];
  const re = /<Route\b|<\/Route>/g;
  let m;
  while ((m = re.exec(code))) {
    if (m[0] === "</Route>") {
      stack.pop();
      continue;
    }
    let i = m.index + 6;
    let depth = 0;
    let outside = "";
    let selfClosing = false;
    for (; i < code.length; i++) {
      const c = code[i];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) {
        selfClosing = code[i - 1] === "/";
        break;
      } else if (depth === 0) outside += c;
    }
    const pathMatch = /\bpath="([^"]*)"/.exec(outside);
    const isIndex = /(^|\s)index(\s|$)/.test(outside);
    const parent = stack.length ? stack[stack.length - 1] : "";
    let full = parent;
    if (pathMatch) {
      const p = pathMatch[1];
      if (p.startsWith("/")) full = p;
      else if (p === "*") full = parent ? `${parent}/*` : "*";
      else full = `${parent.replace(/\/$/, "")}/${p}`;
    }
    if (pathMatch && !isIndex) (selfClosing ? routes : layouts).push(full);
    if (isIndex) {
      const nav = /<Navigate\s+to="([^"]+)"/.exec(code.slice(m.index, i + 120));
      if (nav) redirects.push({ from: parent, to: nav[1].startsWith("/") ? nav[1] : `${parent}/${nav[1]}` });
    }
    if (!selfClosing) stack.push(full);
  }
  return { routes, layouts, redirects };
}

check("trasy (router.tsx ↔ 02-routing-i-strony.md)", () => {
  const errors = [];
  const routerCode = codeText.get(path.join(SRC, "app", "router.tsx"));
  const parsed = parseRoutes(routerCode);
  const codeRoutes = new Set(parsed.routes);
  const t02 = doc("02-routing-i-strony.md");
  for (const r of parsed.redirects) {
    if (!t02.includes(`Adres \`${r.from}\` przekierowuje na \`${r.to}\``)) errors.push(`02: brak zdania „Adres \`${r.from}\` przekierowuje na \`${r.to}\`” (przekierowanie jest w router.tsx).`);
  }
  const docRoutes = new Set();
  for (const row of tableRows(t02)) {
    const c = codeIn(row.cells[0] ?? "");
    if (c && (c.startsWith("/") || c === "*")) docRoutes.add(c);
  }
  for (const r of setDiff(codeRoutes, docRoutes)) errors.push(`Trasa ${r} jest w router.tsx, ale nie ma jej w tabelach 02.`);
  for (const r of setDiff(docRoutes, codeRoutes)) errors.push(`Trasa ${r} jest opisana w 02, ale nie ma jej w router.tsx.`);

  // Stałe adresy z config/routes.ts muszą mieć odpowiednik w routerze
  const routesTs = codeText.get(path.join(SRC, "config", "routes.ts"));
  const toPattern = (r) => r.replace(/:[A-Za-z]+/g, ":p");
  const patterns = new Set([...codeRoutes, ...parsed.layouts].map(toPattern));
  for (const m of routesTs.matchAll(/^\s+(\w+):\s*"(\/[^"]*)"/gm)) {
    if (!patterns.has(toPattern(m[2]))) errors.push(`ROUTES.${m[1]} = "${m[2]}" nie ma trasy w router.tsx.`);
  }
  return { errors, info: `${codeRoutes.size} tras` };
});

check("menu (navigation.ts ↔ dokumentacja)", () => {
  const errors = [];
  const nav = codeText.get(path.join(SRC, "config", "navigation.ts"));
  const labels = [...nav.matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]);
  const joined = labels.join(", ");
  if (!doc("06-wyglad-i-komponenty.md").includes(joined)) errors.push(`06 nie wymienia pozycji menu w kolejności z kodu: ${joined}.`);
  return { errors, info: joined };
});

// ---------- 3. wywołania serwera ----------

function normEndpoint(method, p) {
  const noQuery = p.split("?")[0].replace(/\$\{[^}]*\}/g, "{}").replace(/\{[A-Za-z]+\}/g, "{}");
  return `${method.toUpperCase()} ${noQuery}`;
}

// Poza wspólnym klientem `api` są dwa dozwolone miejsca (opisane w 05): `bare` w refreshSession.ts (odświeżanie sesji bez
// interceptorów, żeby własne 401 nie wpadło w pętlę) i `postKeepalive` (fetch z `keepalive` przy zamykaniu karty).
const OUTSIDE_API_CLIENT_FILES = new Set(["src/api/keepalive.ts"]);

function collectApiCalls() {
  const calls = [];
  const re = /\b(?:api|bare)\s*\.\s*(get|post|put|delete|patch)\s*(?:<[^()]*?>)?\s*\(\s*(`[^`]*`|"[^"]*"|'[^']*')/g;
  const keepaliveRe = /\bpostKeepalive\s*\(\s*(`[^`]*`|"[^"]*"|'[^']*')/g;
  for (const [file, text] of codeText) {
    for (const m of text.matchAll(re)) calls.push({ file, endpoint: normEndpoint(m[1], m[2].slice(1, -1)) });
    if (OUTSIDE_API_CLIENT_FILES.has(rel(file))) continue;
    for (const m of text.matchAll(keepaliveRe)) calls.push({ file, endpoint: normEndpoint("post", m[1].slice(1, -1)) });
  }
  return calls;
}

function backendEndpoints() {
  const text = read(path.join(BACKEND_DOCS, "api", "README.md"));
  const set = new Set();
  for (const row of tableRows(text)) {
    const method = row.cells[0];
    const p = codeIn(row.cells[1] ?? "");
    if (/^(GET|POST|PUT|DELETE|PATCH)$/.test(method) && p && p.startsWith("/api/")) set.add(normEndpoint(method, p));
  }
  return set;
}

check("wywołania serwera (kod ↔ 05-warstwa-api-i-dane.md)", () => {
  const errors = [];
  const text = doc("05-warstwa-api-i-dane.md");
  const calls = collectApiCalls();
  const used = new Set(calls.map((c) => c.endpoint));

  // Całe żądania muszą iść przez wspólnego klienta
  for (const [file, src] of codeText) {
    if (OUTSIDE_API_CLIENT_FILES.has(rel(file))) continue;
    if (/\bfetch\s*\(/.test(src) || /\baxios\s*\.\s*(get|post|put|delete|request)\s*\(/.test(src)) {
      errors.push(`${rel(file)}: żądanie HTTP poza wspólnym klientem api (fetch albo axios.*).`);
    }
  }

  const unusedHeading = text.indexOf("### Endpointy, których frontend nie używa");
  if (unusedHeading < 0) errors.push("05: brak sekcji „Endpointy, których frontend nie używa”.");
  const usedPart = unusedHeading >= 0 ? text.slice(0, unusedHeading) : text;
  const unusedPart = unusedHeading >= 0 ? text.slice(unusedHeading) : "";

  const docUsed = new Set();
  for (const row of tableRows(usedPart)) {
    const c = codeIn(row.cells[0] ?? "");
    const m = c && /^(GET|POST|PUT|DELETE|PATCH) (\/api\/\S+)$/.exec(c);
    if (m) {
      docUsed.add(normEndpoint(m[1], m[2]));
      // funkcje z drugiej kolumny muszą istnieć w kodzie
      for (const token of codeAll(row.cells[1] ?? "")) {
        if (/^[a-z][A-Za-z0-9]*$/.test(token)) {
          const exists = [...codeText.values()].some((src) => new RegExp(`function\\s+${token}\\b`).test(src));
          if (!exists) errors.push(`05: funkcja ${token} (wiersz ${m[1]} ${m[2]}) nie istnieje w kodzie.`);
        }
      }
    }
  }
  for (const e of setDiff(used, docUsed)) errors.push(`Wywołanie ${e} jest w kodzie, ale nie ma go w tabelach 05.`);
  for (const e of setDiff(docUsed, used)) errors.push(`Wywołanie ${e} jest opisane w 05, ale nie ma go w kodzie.`);

  const docUnused = new Set();
  for (const row of tableRows(unusedPart)) {
    const c = codeIn(row.cells[0] ?? "");
    const m = c && /^(GET|POST|PUT|DELETE|PATCH) (\/api\/\S+)$/.exec(c);
    if (m) docUnused.add(normEndpoint(m[1], m[2]));
  }
  for (const e of docUnused) if (used.has(e)) errors.push(`05 uznaje ${e} za nieużywany, a kod go wywołuje.`);

  // Liczby w tekście
  const counts = /używa \*\*(\d+) z (\d+)\*\* endpointów backendu \(łącznie (\d+) wywołań/.exec(text);
  if (!counts) errors.push("05: nie znaleziono zdania „używa **N z M** endpointów backendu (łącznie K wywołań”.");
  else {
    if (Number(counts[1]) !== used.size) errors.push(`05 mówi o ${counts[1]} używanych endpointach, kod ma ${used.size}.`);
    if (Number(counts[3]) !== calls.length) errors.push(`05 mówi o ${counts[3]} wywołaniach, kod ma ${calls.length}.`);
  }
  const unusedCount = /Endpointów, których frontend nie używa, jest (\d+)/.exec(text);
  if (!unusedCount) errors.push("05: nie znaleziono zdania „Endpointów, których frontend nie używa, jest N”.");
  else if (Number(unusedCount[1]) !== docUnused.size) errors.push(`05: liczba nieużywanych (${unusedCount[1]}) różni się od wierszy tabeli (${docUnused.size}).`);

  // Zgodność z dokumentacją backendu
  let info = `${used.size} endpointów, ${calls.length} wywołań`;
  if (hasBackend) {
    const backend = backendEndpoints();
    for (const e of setDiff(used, backend)) errors.push(`Frontend woła ${e}, a backend nie ma takiego endpointu (według jego docs/api/README.md).`);
    const reallyUnused = new Set(setDiff(backend, used));
    for (const e of setDiff(reallyUnused, docUnused)) errors.push(`Backend ma ${e}, którego frontend nie używa, a 05 go nie wymienia.`);
    for (const e of setDiff(docUnused, reallyUnused)) errors.push(`05 wymienia ${e} jako nieużywany, ale backend go nie ma albo frontend go woła.`);
    if (counts && Number(counts[2]) !== backend.size) errors.push(`05 mówi o ${counts[2]} endpointach backendu, jego dokumentacja ma ${backend.size}.`);
    info += `; backend: ${backend.size} endpointów`;
  } else {
    info += "; porównanie z backendem pominięte (brak katalogu docs backendu)";
  }
  return { errors, info };
});

// ---------- 4. pamięć przeglądarki ----------

check("pamięć przeglądarki (localStorage ↔ 03-logowanie-i-sesja.md)", () => {
  const errors = [];
  const keys = new Set();
  for (const [file, src] of codeText) {
    for (const m of src.matchAll(/\bconst\s+[A-Z_]*KEY\s*=\s*"([^"]+)"/g)) keys.add(m[1]);
    for (const m of src.matchAll(/\blocalStorage\s*\.\s*(?:get|set|remove)Item\(\s*"([^"]+)"/g)) keys.add(m[1]);
    if (/\b(sessionStorage|indexedDB)\b/.test(src) || /document\.cookie/.test(src)) {
      errors.push(`${rel(file)}: użycie sessionStorage, indexedDB albo ciasteczek; dokumentacja 03 mówi, że ich nie ma.`);
    }
  }
  // klucze z przedrostkiem gradus. zapisywane przez stałą APP_KEY_PREFIX nie są kluczami samymi w sobie
  keys.delete("gradus.");
  const docKeys = new Set();
  for (const row of tableRows(doc("03-logowanie-i-sesja.md"))) {
    if (row.cells[0] === "`localStorage`") {
      const k = codeIn(row.cells[1] ?? "");
      if (k) docKeys.add(k);
    }
  }
  for (const k of setDiff(keys, docKeys)) errors.push(`Klucz localStorage „${k}” jest w kodzie, ale nie ma go w tabeli 03.`);
  for (const k of setDiff(docKeys, keys)) errors.push(`Klucz localStorage „${k}” jest w tabeli 03, ale nie ma go w kodzie.`);
  return { errors, info: [...keys].join(", ") };
});

// ---------- 5. package.json, polecenia, zmienne środowiskowe ----------

check("wersje bibliotek i polecenia (package.json ↔ 01, 08)", () => {
  const errors = [];
  const pkg = JSON.parse(read(path.join(ROOT, "package.json")));
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  const t01 = doc("01-architektura.md");
  const rows = tableRows(t01);
  const find = (needle) => rows.find((r) => r.cells[0]?.toLowerCase().includes(needle.toLowerCase()));
  const expect = [
    ["React", "react"],
    ["TypeScript", "typescript"],
    ["Vite", "vite"],
    ["Tailwind CSS", "tailwindcss"],
    ["react-router-dom", "react-router-dom"],
    ["@tanstack/react-query", "@tanstack/react-query"],
    ["axios", "axios"],
    ["lucide-react", "lucide-react"],
    ["clsx", "clsx"],
    ["@fontsource-variable/manrope", "@fontsource-variable/manrope"],
    ["@fontsource/newsreader", "@fontsource/newsreader"],
  ];
  for (const [label, name] of expect) {
    const row = find(label);
    if (!row) {
      errors.push(`01: w tabeli technologii nie ma wiersza „${label}”.`);
      continue;
    }
    const version = all[name];
    if (!version) errors.push(`package.json nie ma pakietu ${name}.`);
    else if (!(row.cells[1] ?? "").includes(version)) errors.push(`01: wersja ${name} w dokumentacji (${row.cells[1]}) nie zawiera ${version} z package.json.`);
  }

  // polecenia npm
  const scripts = Object.keys(pkg.scripts);
  const cmdRowsFor = (name) => tableRows(doc(name)).map((r) => codeIn(r.cells[0] ?? "")).filter(Boolean);
  for (const file of ["01-architektura.md", "08-konfiguracja-i-uruchomienie.md"]) {
    const documented = new Set(cmdRowsFor(file).map((c) => /^npm run (\S+)$/.exec(c)?.[1]).filter(Boolean));
    for (const s of scripts.filter((s) => s !== "test")) if (!documented.has(s)) errors.push(`${file}: brak polecenia „npm run ${s}” w tabeli poleceń.`);
    for (const s of documented) if (!scripts.includes(s)) errors.push(`${file}: tabela opisuje „npm run ${s}”, a package.json nie ma takiego skryptu.`);
  }
  const text = [...docText.values()].join("\n");
  for (const m of stripFences(text).matchAll(/npm run ([a-z:-]+)/g)) {
    if (!scripts.includes(m[1])) errors.push(`W dokumentacji jest „npm run ${m[1]}”, a package.json nie ma takiego skryptu.`);
  }
  if (pkg.scripts["docs:check"] !== "node docs/tools/check-docs.mjs") errors.push("package.json: skrypt docs:check powinien uruchamiać node docs/tools/check-docs.mjs.");
  return { errors, info: `${expect.length} bibliotek, ${scripts.length} skryptów` };
});

check("zmienna środowiskowa VITE_API_BASE_URL", () => {
  const errors = [];
  const used = new Set();
  for (const [file, src] of codeText) {
    for (const m of src.matchAll(/import\.meta\.env\.(\w+)/g)) if (m[1].startsWith("VITE_")) used.add(m[1]);
    void file;
  }
  const t08 = doc("08-konfiguracja-i-uruchomienie.md");
  for (const v of used) if (!t08.includes(`\`${v}\``)) errors.push(`08 nie opisuje zmiennej ${v}, którą czyta kod.`);
  for (const f of [".env", ".env.example", ".env.production"]) {
    const file = path.join(ROOT, f);
    if (!fs.existsSync(file)) {
      errors.push(`Brak pliku ${f}, opisanego w 08.`);
      continue;
    }
    const defined = [...read(file).matchAll(/^([A-Z_]+)=/gm)].map((m) => m[1]);
    for (const v of defined) if (!used.has(v)) errors.push(`${f} definiuje ${v}, której kod nie czyta.`);
    for (const v of used) if (!defined.includes(v)) errors.push(`${f} nie definiuje ${v}.`);
  }
  for (const v of new Set([...t08.matchAll(/`(VITE_[A-Z_]+)`/g)].map((m) => m[1]))) if (!used.has(v)) errors.push(`08 opisuje ${v}, której kod nie czyta.`);
  return { errors, info: [...used].join(", ") };
});

// ---------- 6. paleta, liczby plików, odwołania do plików ----------

check("paleta kolorów (index.css ↔ 06-wyglad-i-komponenty.md)", () => {
  const errors = [];
  const css = read(path.join(SRC, "index.css"));
  const theme = css.slice(css.indexOf("@theme"));
  const marker = theme.indexOf("/* Strona główna");
  if (marker < 0) return { errors: ["index.css: brak komentarza „/* Strona główna” dzielącego paletę aplikacji od strony głównej."] };
  const appPart = theme.slice(0, marker);
  const landingPart = theme.slice(marker);
  const colors = (part) => new Map([...part.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})/g)].map((m) => [m[1], m[2].toLowerCase()]));
  const appColors = colors(appPart);
  const docColors = new Map();
  for (const row of tableRows(doc("06-wyglad-i-komponenty.md"))) {
    const name = codeIn(row.cells[0] ?? "");
    const hex = codeIn(row.cells[1] ?? "");
    if (name && hex && /^#[0-9a-f]{6}$/i.test(hex)) docColors.set(name, hex.toLowerCase());
  }
  for (const [n, h] of appColors) {
    if (!docColors.has(n)) errors.push(`06: brak koloru ${n} (${h}) w tabeli palety.`);
    else if (docColors.get(n) !== h) errors.push(`06: kolor ${n} ma w dokumentacji ${docColors.get(n)}, a w index.css ${h}.`);
  }
  for (const n of docColors.keys()) if (!appColors.has(n)) errors.push(`06: kolor ${n} jest w tabeli, ale nie ma go w palecie aplikacji w index.css.`);
  // Tailwind 4 sam szuka klas w całym projekcie; bez tej linii zawartość docs/ trafiałaby do zbudowanego CSS.
  if (!css.includes('@source not "../docs"')) errors.push('index.css: brak linii @source not "../docs" (Tailwind zacząłby czytać klasy z dokumentacji).');
  if (!doc("06-wyglad-i-komponenty.md").includes('@source not "../docs"')) errors.push('06 nie opisuje linii @source not "../docs" z index.css.');
  const fonts = [...css.matchAll(/^\s*--font-([a-z]+):/gm)].map((m) => m[1]);
  for (const f of fonts) if (!doc("06-wyglad-i-komponenty.md").includes(`--font-${f}`)) errors.push(`06 nie opisuje zmiennej --font-${f}.`);
  return { errors, info: `${appColors.size} kolorów aplikacji, ${colors(landingPart).size} kolorów strony głównej` };
});

check("liczby plików w src/ (01-architektura.md)", () => {
  const errors = [];
  const t01 = doc("01-architektura.md");
  const total = /łącznie (\d+) (?:plik|pliki|plików) w `src\/`/.exec(t01);
  if (!total) errors.push("01: nie znaleziono zdania „łącznie N plików (albo plik, pliki) w `src/`”.");
  else if (Number(total[1]) !== srcFiles.length) errors.push(`01 mówi o ${total[1]} plikach w src/, jest ich ${srcFiles.length}.`);
  const featuresDir = path.join(SRC, "features");
  const dirs = fs.readdirSync(featuresDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const docCounts = new Map();
  for (const row of tableRows(t01)) {
    const name = codeIn(row.cells[0] ?? "");
    if (name && /^\d+$/.test(row.cells[1] ?? "") && dirs.includes(name)) docCounts.set(name, Number(row.cells[1]));
  }
  for (const d of dirs) {
    const n = walk(path.join(featuresDir, d)).length;
    if (!docCounts.has(d)) errors.push(`01: brak katalogu features/${d} w tabeli.`);
    else if (docCounts.get(d) !== n) errors.push(`01: features/${d} ma w dokumentacji ${docCounts.get(d)} plików, w kodzie ${n}.`);
  }
  for (const d of docCounts.keys()) if (!dirs.includes(d)) errors.push(`01: tabela wymienia features/${d}, którego nie ma.`);
  return { errors, info: `${srcFiles.length} plików w src/, ${dirs.length} katalogów w features/` };
});

check("ścieżki plików wymienione w dokumentacji", () => {
  const errors = [];
  const ext = "ts|tsx|css|json|md|mjs|js|html|svg|png|ico|woff2";
  const re = new RegExp(`^(?:[A-Za-z0-9_.-]+/)*[A-Za-z0-9_.-]+\\.(?:${ext})$`);
  const baseIndex = new Map();
  const addBase = (f) => baseIndex.set(path.basename(f), f);
  srcFiles.forEach(addBase);
  walk(DOCS).forEach(addBase);
  walk(path.join(ROOT, "public")).forEach(addBase);
  fs.readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isFile()).forEach((d) => addBase(path.join(ROOT, d.name)));
  const backendRoot = path.dirname(BACKEND_DOCS);
  let count = 0;
  for (const [file, text] of docText) {
    const lines = stripFences(text).split("\n");
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/`([^`\n]+)`/g)) {
        const tok = m[1].replace(/\/$/, "");
        // .env.local i podobne to pliki osobiste, których nie ma w repozytorium; RRRR-MM-DD to wzór nazwy, nie plik
        if (/\.local$/.test(tok) || tok.includes("RRRR")) continue;
        const isEnv = /^\.env(\.[a-z]+)?$/.test(tok);
        if (!isEnv && (!re.test(tok) || tok.startsWith("@"))) continue;
        count++;
        const where = `${path.basename(file)}:${i + 1}`;
        if (isEnv) {
          if (!fs.existsSync(path.join(ROOT, tok))) errors.push(`${where}: plik „${tok}” nie istnieje.`);
          continue;
        }
        const candidates = [path.join(SRC, tok), path.join(ROOT, tok), path.join(DOCS, tok), path.join(ROOT, "public", tok)];
        if (candidates.some((c) => fs.existsSync(c))) continue;
        if (!tok.includes("/") && baseIndex.has(tok)) continue;
        // odwołania do dokumentacji backendu: docs/07-… albo docs/api/…
        if (/^docs\/(\d\d-|api\/)/.test(tok)) {
          if (!hasBackend) continue;
          if (fs.existsSync(path.join(backendRoot, tok))) continue;
        }
        errors.push(`${where}: plik „${tok}” nie istnieje.`);
      }
    });
  }
  return { errors, info: `${count} odwołań` };
});

// ---------- 7. świeżość dokumentacja.html ----------

check("podgląd dokumentacja.html jest aktualny", () => {
  const errors = [];
  const file = path.join(DOCS, "dokumentacja.html");
  if (!fs.existsSync(file)) return { errors: ["Brak docs/dokumentacja.html. Zbuduj go poleceniem: npm run docs:build"] };
  const html = read(file);
  const get = (name) => new RegExp(`<meta name="${name}" content="([^"]*)"`).exec(html)?.[1];
  const fe = get("docs-hash-frontend");
  if (!fe) errors.push("dokumentacja.html nie ma znacznika docs-hash-frontend (zbuduj od nowa: npm run docs:build).");
  else if (fe !== hashMarkdown(DOCS)) errors.push("dokumentacja.html jest nieaktualny względem plików .md frontendu. Zbuduj od nowa: npm run docs:build");
  let info = "frontend zgodny";
  if (hasBackend) {
    const be = get("docs-hash-backend");
    if (!be) info += "; podgląd zbudowany bez backendu (--frontend-only)";
    else if (be !== hashMarkdown(BACKEND_DOCS)) {
      errors.push("dokumentacja.html zawiera starszą kopię dokumentacji backendu. Zbuduj od nowa: npm run docs:build");
    } else info += ", backend zgodny";
  }
  return { errors, info };
});

// ---------- raport ----------

console.log(`Sprawdzam dokumentację frontendu (docs/) względem kodu${hasBackend ? " i dokumentacji backendu" : ""}…\n`);
let total = 0;
for (const r of results) {
  if (r.errors.length === 0) console.log(`  ✓ ${r.name}${r.info ? ` (${r.info})` : ""}`);
  else {
    console.log(`  ✗ ${r.name}`);
    for (const e of r.errors) console.log(`      - ${e}`);
  }
  total += r.errors.length;
}
console.log("");
if (!hasBackend) console.log("Uwaga: nie znaleziono dokumentacji backendu (../port-be/docs), więc pominięto porównanie z nią.\n");
if (total === 0) {
  console.log(`Wszystko się zgadza (${results.length} sprawdzeń).`);
  process.exit(0);
}
console.log(`Znaleziono rozbieżności: ${total}. Popraw dokumentację (albo kod) i uruchom ponownie.`);
process.exit(1);
