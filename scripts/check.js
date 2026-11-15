// 完成檢查：node scripts/check.js
// 依照 AGENTS.md 的規則檢查所有筆記，全部通過才算完成。只用 Node 內建模組。

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const TYPES = { book: "books", film: "films" };
const COVERS = ["sage", "ink", "wine", "ochre", "plum", "slate"];
const SECTIONS = ["one-liner", "summary", "thoughts", "recommend"];
const errors = [];
const err = (where, msg) => errors.push(`✗ [${where}] ${msg}`);

// 讀 data/notes.js
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "data/notes.js"), "utf8"), sandbox);
const notes = sandbox.window.NOTES || [];
const seen = new Set();

for (const n of notes) {
  const id = n.slug || "(沒有 slug)";

  // 欄位檢查
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(n.slug || "")) err(id, "slug 只能是小寫英文、數字、連字號");
  if (seen.has(n.slug)) err(id, "slug 重複");
  seen.add(n.slug);
  if (!TYPES[n.type]) err(id, `type 必須是 book 或 film，目前是 ${n.type}`);
  for (const k of ["title", "original", "creator", "oneLiner"]) if (!n[k]) err(id, `缺少 ${k}`);
  if (!Number.isInteger(n.year)) err(id, "year 必須是數字");
  if (!Array.isArray(n.genre) || n.genre.length < 1 || n.genre.length > 3) err(id, "genre 要有 1–3 個");
  if (!(n.rating >= 1 && n.rating <= 5 && (n.rating * 2) % 1 === 0)) err(id, "rating 要在 1–5，最小單位 0.5");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(n.finished || "")) err(id, "finished 格式要是 YYYY-MM-DD");
  if (n.oneLiner && [...n.oneLiner].length > 30) err(id, "oneLiner 超過 30 字");
  if (!COVERS.includes(n.cover)) err(id, `cover 只能是 ${COVERS.join("/")}`);

  // 對應的頁面檢查
  if (!TYPES[n.type]) continue;
  const rel = `notes/${TYPES[n.type]}/${n.slug}.html`;
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { err(id, `找不到 ${rel}`); continue; }
  const html = fs.readFileSync(file, "utf8");

  if (!html.includes(`data-slug="${n.slug}"`)) err(rel, "<body data-slug> 跟檔名不一致");
  if (html.includes("{{")) err(rel, "還有沒替換的 {{ }} 佔位符");
  if (/<img\b/i.test(html)) err(rel, "不可以放圖片");
  if (/\sstyle="/i.test(html)) err(rel, "不可以寫行內樣式 style=\"...\"");
  if (/href="\//.test(html) || /localhost|127\.0\.0\.1/.test(html)) err(rel, "連結要用相對路徑");

  const order = SECTIONS.map((s) => html.indexOf(`<section id="${s}">`));
  order.forEach((pos, i) => { if (pos < 0) err(rel, `缺少段落 <section id="${SECTIONS[i]}">`); });
  if (order.every((p) => p >= 0) && order.some((p, i) => i > 0 && p < order[i - 1])) err(rel, "四個段落順序錯了");

  const quote = (html.match(/<blockquote>([\s\S]*?)<\/blockquote>/) || [])[1];
  if (quote && quote.trim() !== n.oneLiner) err(rel, "一句話心得跟 notes.js 的 oneLiner 不一致");

  const spoiler = html.indexOf('class="spoiler"');
  if (spoiler >= 0 && (spoiler < order[2] || spoiler > order[3])) err(rel, "有雷區只能放在「我的想法」段落裡");
}

// 反向檢查：notes/ 裡每個 html 都要有登記
for (const [type, dir] of Object.entries(TYPES)) {
  const folder = path.join(ROOT, "notes", dir);
  if (!fs.existsSync(folder)) continue;
  for (const f of fs.readdirSync(folder).filter((x) => x.endsWith(".html"))) {
    const slug = f.replace(/\.html$/, "");
    if (!notes.some((n) => n.slug === slug && n.type === type)) err(`notes/${dir}/${f}`, "沒有登記在 data/notes.js");
  }
}

if (errors.length) {
  console.log(errors.join("\n"));
  console.log(`\n共 ${errors.length} 個問題，請修正後再跑一次。`);
  process.exit(1);
}
console.log(`✓ 全部通過：${notes.length} 篇筆記（書 ${notes.filter((n) => n.type === "book").length}、影 ${notes.filter((n) => n.type === "film").length}）`);
