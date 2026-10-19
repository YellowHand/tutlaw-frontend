/* Podgląd dokumentacji Gradus iuris: routing po haszu, spis treści, wyszukiwarka, diagramy Mermaid, motyw. Bez zależności. */
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const DATA = JSON.parse($("#docs-data").textContent);
  const content = $("#content");
  const nav = $("#nav");
  const tocBox = $("#toc");
  const tocList = $("#toc-list");
  const input = $("#q");
  const resultsBox = $("#results");
  const THEME_KEY = "gradus-docs-theme";

  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const safe = (fn) => {
    try {
      return fn();
    } catch {
      return null;
    }
  };

  /* ---------- motyw ---------- */
  function currentTheme() {
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
  }
  function applyTheme(theme, persist) {
    document.documentElement.dataset.theme = theme;
    const btn = $("#theme-btn");
    if (btn) {
      btn.setAttribute("aria-label", theme === "light" ? "Przełącz na ciemny motyw" : "Przełącz na jasny motyw");
      btn.setAttribute("title", btn.getAttribute("aria-label"));
      $("#icon-sun").style.display = theme === "light" ? "none" : "";
      $("#icon-moon").style.display = theme === "light" ? "" : "none";
    }
    if (persist) safe(() => localStorage.setItem(THEME_KEY, theme));
  }

  /* ---------- normalizacja do wyszukiwania (bez polskich znaków, ta sama długość tekstu) ---------- */
  function norm(text) {
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const base = ch.normalize("NFD")[0] || ch;
      out += base === "ł" || base === "Ł" ? "l" : base.toLowerCase()[0] || base;
    }
    return out;
  }

  const pageList = Object.values(DATA.pages);
  const titleOf = (id) => DATA.pages[id].title;
  const setOf = (id) => DATA.sets.find((s) => s.id === DATA.pages[id].set);
  for (const sec of DATA.sections) {
    sec.n = norm(sec.t);
    sec.hn = norm(sec.h);
    sec.pn = norm(titleOf(sec.p));
  }

  /* ---------- nawigacja boczna ---------- */
  function buildNav() {
    let html = `<ul><li><a href="#/" data-page="home">Strona startowa</a></li></ul>`;
    for (const set of DATA.sets) {
      html += `<h2>${esc(set.title)}</h2>`;
      for (const group of set.nav) {
        if (group.label) html += `<p class="sub">${esc(group.label)}</p>`;
        html += "<ul>";
        for (const id of group.pages) {
          const p = DATA.pages[id];
          html += `<li><a href="#/${id}" data-page="${id}">${esc(p.navLabel || p.title)}</a></li>`;
        }
        html += "</ul>";
      }
    }
    nav.innerHTML = html;
  }
  function markNav(pageId) {
    let active = null;
    for (const a of nav.querySelectorAll("a[data-page]")) {
      const on = a.dataset.page === pageId;
      if (on) {
        a.setAttribute("aria-current", "page");
        active = a;
      } else a.removeAttribute("aria-current");
    }
    if (active) active.scrollIntoView({ block: "nearest" });
  }

  /* ---------- strona i trasa ---------- */
  let currentPage = null;
  let renderToken = 0;

  function parseHash() {
    let h = location.hash.slice(1);
    try {
      h = decodeURIComponent(h);
    } catch {
      /* zostaje jak jest */
    }
    const idx = h.indexOf("#");
    const path = (idx >= 0 ? h.slice(0, idx) : h).replace(/^\/+/, "");
    const anchor = idx >= 0 ? h.slice(idx + 1) : "";
    if (path === "") return { page: "home", anchor };
    return { page: DATA.pages[path] ? path : null, anchor, requested: path };
  }

  function pagerHtml(id) {
    const set = setOf(id);
    const order = set.nav.flatMap((g) => g.pages);
    const i = order.indexOf(id);
    const prev = order[i - 1];
    const next = order[i + 1];
    if (!prev && !next) return "";
    const link = (pid, cls, label) =>
      `<a class="${cls}" href="#/${pid}"><small>${label}</small><b>${esc(DATA.pages[pid].navLabel || titleOf(pid))}</b></a>`;
    return `<nav class="pager" aria-label="Poprzednia i następna strona">${prev ? link(prev, "prev", "← Poprzednia") : ""}${next ? link(next, "next", "Następna →") : ""}</nav>`;
  }

  function renderPage(id) {
    if (id === "home") {
      content.innerHTML = `<article class="doc home">${DATA.home}</article>`;
      document.title = "Dokumentacja Gradus iuris";
      buildToc(null);
    } else if (id === null) {
      content.innerHTML = `<article class="doc"><h1>Nie ma takiej strony</h1><p>Adres nie prowadzi do żadnego dokumentu. <a href="#/">Wróć na stronę startową</a>.</p></article>`;
      document.title = "Nie znaleziono · Dokumentacja Gradus iuris";
      buildToc(null);
    } else {
      const p = DATA.pages[id];
      content.innerHTML = `<article class="doc" data-page="${id}">${p.html}${pagerHtml(id)}</article>`;
      document.title = `${p.title} · Dokumentacja Gradus iuris`;
      buildToc(p, id);
    }
    markNav(id === null ? "" : id);
    renderDiagrams();
  }

  function route() {
    const r = parseHash();
    const pageKey = r.page;
    const changed = currentPage !== pageKey;
    closeResults();
    document.body.classList.remove("nav-open");
    $("#menu-btn").setAttribute("aria-expanded", "false");
    if (changed) {
      currentPage = pageKey;
      renderPage(pageKey);
    }
    if (r.anchor) {
      const el = content.querySelector(`[id="${CSS.escape(r.anchor)}"]`);
      if (el) {
        el.scrollIntoView();
        el.classList.remove("flash");
        void el.offsetWidth;
        el.classList.add("flash");
      }
    } else if (changed) {
      window.scrollTo(0, 0);
    }
    if (changed) content.focus({ preventScroll: true });
    updateSpy();
  }

  /* ---------- "Na tej stronie" ---------- */
  let spyItems = [];
  function buildToc(page, id) {
    spyItems = [];
    if (!page) {
      tocBox.hidden = true;
      return;
    }
    const hs = page.headings.filter((h) => h.level === 2 || h.level === 3);
    if (hs.length < 2) {
      tocBox.hidden = true;
      return;
    }
    tocBox.hidden = false;
    tocList.innerHTML = hs
      .map((h) => `<li><a class="l${h.level}" href="#/${id}#${esc(h.id)}" data-id="${esc(h.id)}">${esc(h.text)}</a></li>`)
      .join("");
    queueMicrotask(() => {
      spyItems = hs
        .map((h) => ({ link: tocList.querySelector(`a[data-id="${CSS.escape(h.id)}"]`), el: content.querySelector(`[id="${CSS.escape(h.id)}"]`) }))
        .filter((x) => x.link && x.el);
      updateSpy();
    });
  }
  let spyQueued = false;
  function updateSpy() {
    if (spyQueued) return;
    spyQueued = true;
    requestAnimationFrame(() => {
      spyQueued = false;
      if (!spyItems.length) return;
      const limit = 56 + 40;
      let active = spyItems[0];
      for (const item of spyItems) {
        if (item.el.getBoundingClientRect().top <= limit) active = item;
        else break;
      }
      for (const item of spyItems) item.link.classList.toggle("on", item === active);
    });
  }

  /* ---------- diagramy Mermaid (ładowane dopiero, gdy strona ma diagram) ---------- */
  let mermaidPromise = null;
  function loadMermaid() {
    if (window.mermaid) return Promise.resolve(window.mermaid);
    if (!mermaidPromise) {
      mermaidPromise = new Promise((resolve, reject) => {
        try {
          const code = JSON.parse($("#mermaid-src").textContent);
          const script = document.createElement("script");
          script.textContent = code;
          document.head.appendChild(script);
          if (window.mermaid) resolve(window.mermaid);
          else reject(new Error("Biblioteka Mermaid nie udostępniła obiektu mermaid."));
        } catch (e) {
          reject(e);
        }
      });
    }
    return mermaidPromise;
  }
  function mermaidTheme() {
    const light = currentTheme() === "light";
    const c = light
      ? { bg: "#fbfaf6", node: "#f2efe9", border: "#7a5c00", text: "#1b1a17", line: "#5b574f", alt: "#e9e4d8", note: "#fbf0cf" }
      : { bg: "#1a1a1d", node: "#242428", border: "#d8b13a", text: "#f2efe9", line: "#a6a5ab", alt: "#313136", note: "#3b2c06" };
    return {
      background: "transparent",
      fontFamily: '"Manrope Variable", "Manrope", system-ui, sans-serif',
      fontSize: "14px",
      primaryColor: c.node,
      primaryTextColor: c.text,
      primaryBorderColor: c.border,
      lineColor: c.line,
      secondaryColor: c.alt,
      secondaryTextColor: c.text,
      tertiaryColor: c.bg,
      tertiaryTextColor: c.text,
      textColor: c.text,
      mainBkg: c.node,
      nodeBorder: c.border,
      clusterBkg: c.bg,
      clusterBorder: c.line,
      edgeLabelBackground: c.bg,
      titleColor: c.text,
      actorBkg: c.node,
      actorBorder: c.border,
      actorTextColor: c.text,
      actorLineColor: c.line,
      signalColor: c.text,
      signalTextColor: c.text,
      labelBoxBkgColor: c.alt,
      labelBoxBorderColor: c.line,
      labelTextColor: c.text,
      loopTextColor: c.text,
      noteBkgColor: c.note,
      noteTextColor: light ? "#1b1a17" : "#f2efe9",
      noteBorderColor: c.border,
      activationBkgColor: c.alt,
      activationBorderColor: c.border,
      sequenceNumberColor: c.text,
    };
  }
  function failDiagram(node, error) {
    node.classList.add("failed");
    const message = error && error.message ? error.message : String(error);
    node.innerHTML = `<p><strong>Nie udało się narysować diagramu.</strong> ${esc(message)}</p><pre><code>${esc(node.dataset.src || "")}</code></pre>`;
  }
  async function renderDiagrams() {
    const nodes = [...content.querySelectorAll(".mermaid-wrap")];
    if (!nodes.length) return;
    const token = ++renderToken;
    let mermaid;
    try {
      mermaid = await loadMermaid();
    } catch (e) {
      nodes.forEach((n) => failDiagram(n, e));
      return;
    }
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: mermaidTheme(),
      flowchart: { useMaxWidth: true, htmlLabels: true },
      sequence: { useMaxWidth: true },
      state: { useMaxWidth: true },
    });
    for (let i = 0; i < nodes.length; i++) {
      if (token !== renderToken) return;
      const node = nodes[i];
      const id = `mmd-${token}-${i}`;
      try {
        const { svg } = await mermaid.render(id, node.dataset.src);
        if (token !== renderToken) return;
        node.classList.remove("failed");
        node.innerHTML = svg;
        node.classList.add("done");
      } catch (e) {
        document.getElementById(`d${id}`)?.remove();
        failDiagram(node, e);
      }
    }
    document.body.dataset.diagrams = "done";
  }

  /* ---------- wyszukiwarka ---------- */
  let hits = [];
  let activeHit = -1;

  function search(query) {
    const tokens = norm(query.trim()).split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    const found = [];
    for (const sec of DATA.sections) {
      let score = 0;
      let ok = true;
      for (const t of tokens) {
        const inHead = sec.hn.includes(t);
        const inTitle = sec.pn.includes(t);
        const inText = sec.n.includes(t);
        if (!inHead && !inTitle && !inText) {
          ok = false;
          break;
        }
        if (inHead) score += 8;
        if (inTitle) score += 2;
        if (inText) {
          let count = 0;
          let pos = sec.n.indexOf(t);
          while (pos >= 0 && count < 5) {
            count++;
            pos = sec.n.indexOf(t, pos + t.length);
          }
          score += count;
          if (new RegExp(`(^|[^\\p{L}\\p{N}])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "u").test(sec.n)) score += 2;
        }
      }
      if (ok) found.push({ sec, score });
    }
    found.sort((a, b) => b.score - a.score || a.sec.p.localeCompare(b.sec.p));
    return found.slice(0, 40).map((f) => ({ ...f, tokens }));
  }

  function snippet(sec, tokens) {
    const text = sec.t;
    let at = -1;
    for (const t of tokens) {
      at = sec.n.indexOf(t);
      if (at >= 0) break;
    }
    if (at < 0) return esc(text.slice(0, 140)) + (text.length > 140 ? "…" : "");
    const from = Math.max(0, at - 50);
    const to = Math.min(text.length, at + 130);
    const piece = text.slice(from, to);
    const pieceNorm = sec.n.slice(from, to);
    const marks = new Array(piece.length).fill(false);
    for (const t of tokens) {
      let pos = pieceNorm.indexOf(t);
      while (pos >= 0) {
        for (let k = pos; k < pos + t.length; k++) marks[k] = true;
        pos = pieceNorm.indexOf(t, pos + t.length);
      }
    }
    let html = "";
    let open = false;
    for (let i = 0; i < piece.length; i++) {
      if (marks[i] && !open) {
        html += "<mark>";
        open = true;
      }
      if (!marks[i] && open) {
        html += "</mark>";
        open = false;
      }
      html += esc(piece[i]);
    }
    if (open) html += "</mark>";
    return (from > 0 ? "…" : "") + html + (to < text.length ? "…" : "");
  }

  function renderResults() {
    const q = input.value;
    if (!q.trim()) {
      closeResults();
      return;
    }
    hits = search(q);
    activeHit = hits.length ? 0 : -1;
    if (!hits.length) {
      resultsBox.innerHTML = `<p class="empty">Brak wyników dla „${esc(q.trim())}”. Spróbuj krótszego słowa albo innej odmiany.</p>`;
    } else {
      resultsBox.innerHTML =
        `<p class="count" role="status">Wyniki: ${hits.length}${hits.length === 40 ? " (pokazano 40 najlepszych)" : ""}</p>` +
        hits
          .map((h, i) => {
            const p = DATA.pages[h.sec.p];
            const set = DATA.sets.find((s) => s.id === p.set);
            const heading = h.sec.h === p.title ? "" : ` <span aria-hidden="true">›</span> <span>${esc(h.sec.h)}</span>`;
            return `<a class="hit" id="hit-${i}" role="option" aria-selected="${i === 0}" href="#/${h.sec.p}#${esc(h.sec.i)}"><span class="where"><span class="set">${esc(set.short)}</span><span>${esc(p.navLabel || p.title)}</span>${heading}</span><span class="snip">${snippet(h.sec, h.tokens)}</span></a>`;
          })
          .join("");
    }
    resultsBox.hidden = false;
    input.setAttribute("aria-expanded", "true");
    input.setAttribute("aria-activedescendant", activeHit >= 0 ? `hit-${activeHit}` : "");
  }
  function closeResults() {
    resultsBox.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }
  function moveHit(delta) {
    if (!hits.length) return;
    activeHit = (activeHit + delta + hits.length) % hits.length;
    resultsBox.querySelectorAll(".hit").forEach((el, i) => el.setAttribute("aria-selected", String(i === activeHit)));
    const el = $(`#hit-${activeHit}`, resultsBox);
    el.scrollIntoView({ block: "nearest" });
    input.setAttribute("aria-activedescendant", `hit-${activeHit}`);
  }

  input.addEventListener("input", renderResults);
  input.addEventListener("focus", () => {
    if (input.value.trim()) renderResults();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHit(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHit(-1);
    } else if (e.key === "Enter") {
      if (activeHit >= 0 && hits[activeHit]) {
        e.preventDefault();
        const { sec } = hits[activeHit];
        location.hash = `#/${sec.p}#${sec.i}`;
        closeResults();
        input.blur();
      }
    } else if (e.key === "Escape") {
      if (!resultsBox.hidden) closeResults();
      else input.blur();
    }
  });
  resultsBox.addEventListener("mousedown", (e) => e.preventDefault());
  resultsBox.addEventListener("click", (e) => {
    if (e.target.closest("a.hit")) {
      closeResults();
      input.blur();
    }
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search")) closeResults();
  });

  const isTyping = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      input.focus();
      input.select();
    } else if (e.key === "/" && !isTyping(e.target) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      input.focus();
      input.select();
    } else if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
      document.body.classList.remove("nav-open");
      $("#menu-btn").setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- sterowanie ---------- */
  $("#theme-btn").addEventListener("click", () => {
    applyTheme(currentTheme() === "light" ? "dark" : "light", true);
    renderDiagrams();
  });
  $("#menu-btn").addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    $("#menu-btn").setAttribute("aria-expanded", String(open));
  });
  document.body.addEventListener("click", (e) => {
    if (document.body.classList.contains("nav-open") && !e.target.closest("#nav") && !e.target.closest("#menu-btn")) {
      document.body.classList.remove("nav-open");
      $("#menu-btn").setAttribute("aria-expanded", "false");
    }
  });
  window.addEventListener("scroll", updateSpy, { passive: true });
  window.addEventListener("hashchange", route);

  /* ---------- start ---------- */
  applyTheme(currentTheme(), false);
  buildNav();
  route();
  document.documentElement.dataset.ready = "true";
})();
