# 看完再說 — 讀書／影評筆記

一部作品一頁的個人讀書＋觀影筆記網站。每讀完一本書、看完一部電影，就新增一篇。

- 網站：https://suis-coder.github.io/book-film-notes/
- 技術：純 HTML / CSS / JavaScript，部署在 GitHub Pages，不需要建置。

## 怎麼新增一篇筆記

開一個新的 AI 對話，說：

> 請先讀 AGENTS.md，幫我新增《作品名》，X 星，我的感想是……

AI 會依照 [AGENTS.md](AGENTS.md) 的規則：複製模板 → 寫固定四段 → 登記到 `data/notes.js` → 跑檢查。

自己動手的話，步驟也一樣，最後執行：

```bash
node scripts/check.js
```

## 本機預覽

直接用瀏覽器打開 `index.html` 即可。
