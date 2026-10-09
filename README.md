# modsengineeringmath.com

Static site served by Cloudflare Pages straight from this repo (no build step on Cloudflare).
The HTML in the repo root, `about/` and `learn/` is generated — edit `src/` and rebuild.

## Update the status feed (no build needed)
Edit `data/updates.json` (on GitHub web or the GitHub app is fine) and commit.
The profile page reads this file live, so the change shows up after Cloudflare deploys (~1 min).

```json
{ "date": "2026-10-08", "tag": "งานสอน", "text": "ข้อความสเตตัส", "link": "/learn/", "linkText": "ดูเพิ่มเติม" }
```
`link` and `linkText` are optional. `now` holds the "ตอนนี้กำลังทำ" list.
Run the build occasionally so the pre-rendered copy (for search engines) matches.

## Add a lesson
1. Add an entry to `TOPICS` in `build.mjs` (slug, title, en, sym, summary, optional playlist).
2. Copy an existing file in `src/pages/learn/` to `src/pages/learn/<slug>.html` and write the content.
   Math: `\( inline \)` and `\[ display \]` — pre-rendered with KaTeX at build time.
3. `npm install` (first time) then `node build.mjs`, commit everything, push.

The new page appears in the library, on the home page, in the prev/next links, sitemap.xml and llms.txt automatically.

## SEO and AI visibility (added 2026-10-09)
- `node build.mjs` also writes `llms.txt`, `llms-full.txt` (plain text of every page for AI assistants), `feed.xml` (RSS from `data/updates.json`), `sitemap.xml` and `404.html`.
- Social share images: `python3 scripts/og.py && node build.mjs` renders `images/og/<page>.jpg` (1200×630) from `src/og-manifest.json`. Run it after adding a page or changing a title. A page can set `"og": {"title","sub","eyebrow","sym"}` in its meta block.
- `robots.txt` explicitly allows AI crawlers; `_headers` sets UTF-8 for text files and `noindex` on source files.
- Lesson pages get a share bar (LINE, Facebook, X, copy link) automatically.
