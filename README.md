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

## Control systems engineering (added 2026-10-12)
Series `control-systems` in `TOPICS` (build.mjs), topic 11. It is the first series with `parts`: 9 parts × 26 sub-pages
(introduction F, modeling M, block-diagrams B, time-response T, steady-state-error E, stability S, routh-hurwitz R,
root-locus L, root-locus-sketching W, root-locus-design J, frequency-response Q, bode-plot D, margins G, nyquist N,
compensators C, pid P, pid-tuning Z, state-space X, controllability-observability O, state-feedback V, digital-control Y,
nonlinear-robust U, mechatronics K, robotics A, power-electronics-control H, examples gallery).
- A sub-page goes live as soon as `src/pages/learn/control-systems/<slug>.html` exists; until then the hub shows its card
  as "เร็วๆ นี้" and it is left out of the pager, sitemap and llms.txt (`live()` in build.mjs). Numbering never shifts.
- The series nav groups pages by part (`<details class="sn-all">`); the hub groups cards with `.cs-part`.
- Interactive tools (all plain JS, no dependencies):
  - `assets/cs-core.js` — math engine: TF parser (`1/(s(s+1)(s+2))`, `e^(-0.5s)/(s+1)`), roots, Bode, margins, root locus
    with all sketching-rule quantities, Nyquist counting, step response, state space, ZOH. Verified against python-control.
  - `assets/cs-ui.js` — `<div class="cs-lab" data-tf="…" data-views="rl,bode,nyq,step" data-k="2" data-kmax="12"
    data-zeta="0.5,0.7" data-rules data-neg data-edit="false" data-presets='[{"n":"…","tf":"…","k":1}]'>`.
  - `assets/cs-routh.js` — `<div class="rh-calc" data-p="1+K/(s(s+1)(s+2))" data-presets='[{"n":"…","p":"…"}]'>`;
    a `<button class="wx-btn" data-rh="s^3+3s^2+2s+K">` in a worked example fills it.
  - `assets/cs-pid.js` (needs cs-ui.js) — `<div class="pid-lab" data-presets='[{"n":"…","plant":"…","kp":1,"ki":0,"kd":0,"tend":20,"umax":2}]'>`.
- Figures: `python3 scripts/cs_figs.py` fills empty `<!--FIG:key--><!--/FIG-->` blocks in the series pages from
  `scripts/cs_figs.py` (root loci, Bode, Nyquist, step responses, block diagrams); `--all` redraws every figure.
- Every worked-example number was checked with python-control / sympy before publishing.
- Short URLs (`/control`, `/routh`, `/root-locus`, `/bode-plot`, `/pid`, `/robotics` …) are in `_redirects`.

## Fourier series & harmonic analysis (added 2026-10-12)
Series `fourier-series` in `TOPICS` (build.mjs), topic 12, 4 parts × 14 sub-pages: introduction F, coefficients T,
symmetry S, complex-spectrum C, convergence-parseval P, waveform-table W, circuit-analysis A, power-harmonics H,
rectifiers R, inverters-pwm V, dc-dc-converters B, mitigation M, dft-fft D, analyzer-lab (the full lab page).
Formula cards use the same markup as the other series; in the waveform table a thumbnail may sit between the title and
the formula (`<div class="wtfig"><!--FIG:fs-wt-…--><!--/FIG--></div>`) and the formula index still picks the formula up.
- Engine `assets/fs-core.js` (UMD, `window.FSCore` / `require`): complex helpers, exact piecewise Fourier coefficients
  (`coefSegs`), the waveform library `WAVES` (13 shapes + typed `x(t)` via `sigexpr.js`), symmetry detection,
  `waveStats` (RMS, THD, Parseval, Gibbs), circuits `CIRCUITS` with per-harmonic `circuitHarmonics` and the exact periodic
  ODE solution `circuitExact`, load models `LOADS`/`loadModel` (R, RL, SMPS bridge + C, bridge + choke, TRIAC, PFC,
  6/12-pulse with α and overlap, VFD, custom spectrum), the network solver `solveNetwork` (source Isc/IL and X/R, line
  reactor, plain/detuned/tuned capacitor, active filter, damping branch) and `metrics` (P Q1 S D PF DPF THD TDD K In),
  plus IEEE 519-2022 / IEC 61000-3-2 limit tables.
- UI `assets/fs-lab.js`: `<div class="fs-lab" data-tabs="synth,circuit,power" data-tab="power" data-preset="smps"
  data-compact data-open="steps" data-full-link data-waves="square,pulse" data-hash>` — tabs ① Fourier synthesis/analysis
  with step-by-step working, ② circuit harmonic by harmonic, ③ oscilloscope + power analyzer with automatic diagnosis.
  `<button data-fs-preset="<name>" [data-fs-target="<lab id>"]>` loads a preset into a lab on the page (or opens the
  full lab). Presets are in `PRESETS` near the top of `fs-lab.js`; links `/learn/fourier-series/analyzer-lab/#preset=<name>`
  and the share link `#lab=<state>` open a configured lab.
- Figures: `python3 scripts/fs_figs.py` fills empty `<!--FIG:key--><!--/FIG-->` blocks in the series pages and the two
  Fourier figures on the home page (`fs-home`, `fs-home-lab`); `--all` redraws every figure. Unknown keys owned by
  `fg_figs.py` / `cs_figs.py` are left alone, and vice versa.
- Markdown for AI assistants (llmstxt.org convention): every page in `MD_SERIES` (build.mjs) also gets
  `<page>/index.html.md` and a `<link rel="alternate" type="text/markdown">`; the hand-written guide
  `src/md/fourier-series.md` is published as `/learn/fourier-series/guide.md` (`MD_GUIDES`, `{{updated}}` is filled from the
  hub's meta). Both are listed in llms.txt, and build.mjs regenerates the block between `# BEGIN generated: markdown copies`
  and `# END generated` in `_headers` (text/markdown + `Link: rel="canonical"` to the HTML page). Add a series to
  `MD_SERIES` to give it Markdown copies too.
- Worked-example numbers were checked with numpy/scipy/sympy and against the lab engine (Node) before publishing.
- Short URLs (`/fourier`, `/harmonics`, `/thd`, `/ieee519`, `/harmonic-analyzer`, `/power-analyzer`, `/parseval`, `/gibbs`,
  `/spwm`, `/fft` …) are in `_redirects`.
