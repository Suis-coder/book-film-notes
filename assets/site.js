/* 看完再說 — 全站腳本
   1. 首頁（body[data-page="index"]）：讀 window.NOTES 產生卡片牆與篩選
   2. 筆記頁（body[data-slug]）：依 slug 從 window.NOTES 填入作品資料區
   作品資料的唯一來源是 data/notes.js。詳見 AGENTS.md §4 */

(function () {
  const NOTES = window.NOTES || [];
  const KIND = { book: "書", film: "影" };
  const FOLDER = { book: "books", film: "films" };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const stars = (r) =>
    `<span class="stars" aria-label="${r} 顆星"><span style="width:${(r / 5) * 100}%"></span></span><span class="rating-num">${r.toFixed(1)}</span>`;

  const cover = (n) => `
    <div class="cover" data-cover="${esc(n.cover)}" data-type="${esc(n.type)}">
      <div class="cover-kind">${KIND[n.type]}・${n.year}</div>
      <div>
        <div class="cover-title">${esc(n.title)}</div>
        <div class="cover-original">${esc(n.original)}</div>
      </div>
      <div class="cover-foot">${esc(n.creator)}</div>
    </div>`;

  function renderIndex() {
    const sorted = [...NOTES].sort((a, b) => b.finished.localeCompare(a.finished));
    const grid = document.getElementById("grid");
    const count = (t) => NOTES.filter((n) => n.type === t).length;

    document.getElementById("stats").innerHTML =
      `<span><b>${NOTES.length}</b>篇筆記</span><span><b>${count("book")}</b>本書</span><span><b>${count("film")}</b>部影</span>`;

    function draw(filter) {
      grid.innerHTML = sorted
        .filter((n) => filter === "all" || n.type === filter)
        .map((n) => `
          <a class="card" href="notes/${FOLDER[n.type]}/${n.slug}.html">
            ${cover(n)}
            <h3 class="card-title">${esc(n.title)}</h3>
            <p class="card-meta">${esc(n.creator)}・${n.year}</p>
            ${stars(n.rating)}
            <p class="card-line">${esc(n.oneLiner)}</p>
          </a>`)
        .join("");
    }

    document.querySelectorAll(".filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filter").forEach((b) => b.setAttribute("aria-pressed", "false"));
        btn.setAttribute("aria-pressed", "true");
        draw(btn.dataset.filter);
      });
    });
    draw("all");
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

    document.querySelectorAll(".note h2").forEach((h, i) => h.setAttribute("data-no", String(i + 1).padStart(2, "0")));
  }

  const body = document.body;
  if (body.dataset.page === "index") renderIndex();
  else if (body.dataset.slug) renderNoteHead(body.dataset.slug);
})();
