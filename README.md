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

## Lecture-style math markup (integral page and future lessons)
Inside `\( \)` / `\[ \]` you can use: `\hlF{..}` formula used (amber), `\hlP{..}` property used (blue), `\hlU{..}` u-substitution (green), `\hlC{..}` constant C (purple), `\rc{..}` red strike-through, `\carry{2}{6}` strike 6 and write 2 above in red. Worked examples use `<div class="wx">` with `<ol class="steps">`; formula cards use ids (F2, P1, Q11…) so `<a class="tag tf" href="#F2">` links back to them. Polynomial long division uses the `.ldiv` grid (see `src/pages/learn/integral-calculus.html`).

## Linear algebra series (added 2026-10-12)
A topic can have sub-pages. `linear-algebra` in `TOPICS` (build.mjs) has a `sub` list; the hub is
`src/pages/learn/linear-algebra/index.html` and each sub-page is `src/pages/learn/linear-algebra/<sub>.html`
with `"lesson": "linear-algebra", "sub": "<sub>"` in its meta block. The build adds the series strip
(`<!--series-nav-->`), prev/next within the series, breadcrumbs and llms.txt entries.
- Formula cards: `<div class="tf" id="M10" data-k="keywords"><p class="tf-n"><b><span class="fid">M10</span> English</b> ไทย</p> \[ … \]`.
  IDs are permanent and citable (M matrices, D determinants, L systems, I inverse, C Cramer, E eigen, A applications).
  Every card is collected into the searchable index on the hub (`<!--formula-index:linear-algebra-->`).
- Level badge in a heading: `<span class="lv lv-b">พื้นฐาน</span>` (`lv-i` กลาง, `lv-a` ขั้นสูง).
- Interactive parts live in `assets/linalg.js`: `<div class="mx-calc" data-modes="solve,det,inv,eig" data-mode="det" data-n="3" data-a="1,2;3,4" data-b="5,6">`
  (exact-fraction calculator with steps), `<div class="la-lab" data-mode="det|eig" data-m="a,b;c,d">` (2×2 lab),
  `<div class="mx-prod" data-a=… data-b=…>` (product explainer). A button `<button class="wx-btn calc-go" data-calc="mode=inv&amp;A=…">`
  inside a worked example fills the page's calculator.
- Old URL `/learn/matrix-determinant/` redirects to `/learn/linear-algebra/` (`_redirects`).

## Function generator & oscilloscope lab (added 2026-10-12)
Series `function-generator` in `TOPICS` (build.mjs): hub `src/pages/learn/function-generator/index.html` + 9 sub-pages
(waveforms W, generator V, oscilloscope O, simulator, measurements B, rc-rlc R, op-amp U, build K, applications X).
Formula cards use the same markup as linear algebra, so every card appears in the hub's formula index automatically.
- Virtual bench: `assets/fgs-core.js` (generator + circuit engine), `fgs-scope.js` (probe, ADC, trigger, measurements, FFT),
  `fgs-ui.js` (knobs, generator panel, circuit board), `fgs-app.js` (bench, embedded scopes, presets, share links).
  Full bench: `<div class="fgs-bench" data-preset="sine-basic">`. Embedded scope in a lesson:
  `<div class="fgs-mini" data-preset="rc-tau" data-ch="1" data-ctl="R,C,tdiv" data-meas="vpp,rise" data-theory>`
  (controls: wave freq amp offset duty sym phase load term noise tdiv vdiv1 vdiv2 pos1 level slope tmode tsrc coup1 coup2
  comp1 probe2 xy math avg R C L Cf RL Rf op out; ranges via data-fmin/fmax, data-rmin/rmax, data-cmin/cmax).
  Presets live in `P` at the top of `fgs-app.js`; any page can link `/learn/function-generator/simulator/#preset=<name>`,
  and on the simulator page `<button data-fgs-preset="<name>">` loads one in place.
- Calculators: `<div class="fg-calc" data-calc="vconv|load|scope|rc|rlc|opamp|schmitt|ripple|relax|555|wien|dds">` (`assets/fgcalc.js`).
- DDS phase-accumulator visualiser: `<div class="dds-lab" data-n="5" data-m="3" data-b="4">` (`assets/fgdds.js`).
- Figures are generated, not hand-drawn: `python3 scripts/fg_figs.py` rewrites every `<!--FIG:key-->…<!--/FIG-->` block in
  the series pages and the home page from the functions in `scripts/fg_figs.py` (helpers in `scripts/svglib.py`).
  Run it before `node build.mjs` after editing a figure.
- Short URLs (`/oscilloscope`, `/simulator`, `/op-amp`, `/bode`, `/ad9833` …) are in `_redirects`.
