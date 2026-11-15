/* 看完再說 — 全站腳本
   1. 首頁（body[data-page="index"]）：讀 window.NOTES 產生書架／片櫃、篩選與搜尋
   2. 筆記頁（body[data-slug]）：依 slug 從 window.NOTES 填入作品資料區
   作品資料的唯一來源是 data/notes.js。詳見 AGENTS.md §4

   封面優先順序（只限書）：
   coverImage（站長自己拍的照片，assets/covers/）→ isbn（Open Library）→ CSS 字卡封面 */

(function () {
  const NOTES = window.NOTES || [];
  const KIND = { book: "書", film: "影" };
  const FOLDER = { book: "books", film: "films" };
  const SHELF = { book: "書架", film: "片櫃" };
  const BASE = document.body.dataset.page === "index" ? "" : "../../";

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const stars = (r) =>
    `<span class="stars" aria-label="${r} 顆星"><span style="width:${(r / 5) * 100}%"></span></span><span class="rating-num">${r.toFixed(1)}</span>`;

  function coverSrc(n) {
    if (n.type !== "book") return "";
    if (n.coverImage) return `${BASE}assets/covers/${n.coverImage}`;
    if (n.isbn) return `https://covers.openlibrary.org/b/isbn/${n.isbn}-L.jpg?default=false`;
    return "";
  }

  const cover = (n) => {
    const src = coverSrc(n);
    return `
    <div class="cover" data-cover="${esc(n.cover)}" data-type="${esc(n.type)}">
      <div class="cover-kind">${KIND[n.type]}・${n.year}</div>
      <div>
        <div class="cover-title">${esc(n.title)}</div>
        <div class="cover-original">${esc(n.original)}</div>
      </div>
      <div class="cover-foot">${esc(n.creator)}</div>
      ${src ? `<img class="cover-img" src="${esc(src)}" alt="${esc(n.title)} 封面" loading="lazy">` : ""}
    </div>`;
  };

  // 封面圖載入失敗（沒有照片、Open Library 沒這本）→ 移除圖片，露出字卡封面
  function bindCoverFallback(root) {
    root.querySelectorAll(".cover-img").forEach((img) => {
      const fail = () => img.remove();
      if (img.complete && img.naturalWidth === 0) fail();
      else {
        img.addEventListener("error", fail);
        img.addEventListener("load", () => { if (img.naturalWidth < 10) fail(); });
      }
    });
  }

  function renderIndex() {
    const sorted = [...NOTES].sort((a, b) => b.finished.localeCompare(a.finished));
    const shelves = document.getElementById("shelves");
    const search = document.getElementById("search");
    const count = (t) => NOTES.filter((n) => n.type === t).length;
    let filter = "all";

    document.getElementById("stats").innerHTML =
      `<span><b>${NOTES.length}</b>篇筆記</span><span><b>${count("book")}</b>本書</span><span><b>${count("film")}</b>部影</span>`;

    const haystack = (n) => [n.title, n.original, n.creator, n.year, n.oneLiner, ...n.genre].join(" ").toLowerCase();

    function draw() {
      const q = search.value.trim().toLowerCase();
      const hit = sorted.filter((n) => !q || haystack(n).includes(q));
      const types = filter === "all" ? ["book", "film"] : [filter];

      const html = types.map((t) => {
        const items = hit.filter((n) => n.type === t);
        if (!items.length) return "";
        return `
          <section class="shelf">
            <h2 class="shelf-label">${SHELF[t]}<span>${items.length}</span></h2>
            <div class="shelf-row">
              ${items.map((n) => `
                <a class="slot" href="notes/${FOLDER[n.type]}/${n.slug}.html">
                  <div class="stand">${cover(n)}</div>
                  <h3 class="card-title">${esc(n.title)}</h3>
                  <p class="card-meta">${esc(n.creator)}・${n.year}</p>
                  ${stars(n.rating)}
                  <p class="card-line">${esc(n.oneLiner)}</p>
                </a>`).join("")}
            </div>
          </section>`;
      }).join("");

      shelves.innerHTML = html || `<p class="empty">找不到符合「${esc(search.value)}」的作品。</p>`;
      bindCoverFallback(shelves);
    }

    document.querySelectorAll(".filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filter").forEach((b) => b.setAttribute("aria-pressed", "false"));
        btn.setAttribute("aria-pressed", "true");
        filter = btn.dataset.filter;
        draw();
      });
    });
    search.addEventListener("input", draw);
    draw();
  }

  function renderNoteHead(slug) {
    const n = NOTES.find((x) => x.slug === slug);
    const head = document.getElementById("note-head");
    if (!n) {
      head.innerHTML = `<p>找不到這篇作品的資料（slug：${esc(slug)}），請確認 data/notes.js 有登記。</p>`;
      return;
    }
    document.title = `${n.title}｜看完再說`;
    head.innerHTML = `
      ${cover(n)}
      <div>
        <span class="tag tag-${n.type}">${KIND[n.type]}</span>
        <h1 class="note-title">${esc(n.title)}</h1>
        <p class="note-original">${esc(n.original)}</p>
        <p class="note-meta">${n.type === "book" ? "作者" : "導演"}：${esc(n.creator)}　｜　${n.year}　｜　看完於 ${n.finished}</p>
        <p>${n.genre.map((g) => `<span class="chip">${esc(g)}</span>`).join("")}</p>
        ${stars(n.rating)}
      </div>`;
    bindCoverFallback(head);

    document.querySelectorAll(".note h2").forEach((h, i) => h.setAttribute("data-no", String(i + 1).padStart(2, "0")));
  }

  const body = document.body;
  if (body.dataset.page === "index") renderIndex();
  else if (body.dataset.slug) renderNoteHead(body.dataset.slug);
})();
