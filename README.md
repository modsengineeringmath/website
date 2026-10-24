# modsengineeringmath.com

Static site served by Cloudflare Pages straight from this repo (no build step on Cloudflare).
The HTML in the repo root, `about/` and `learn/` is generated — edit `src/` and rebuild.

## Update the status feed (no build needed)
Edit `data/updates.json` (on GitHub web or the GitHub app is fine) and commit.
The home page box "มีอะไรใหม่บนเว็บไซต์" (`/#updates`, newest 6 entries), the changelog page `/updates/` and the profile page
all read this file live, so the change shows up after Cloudflare deploys (~1 min). Put the newest entry first.

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
- It also writes `search-index.json` for the search button in the header (`assets/site.js`, opens with the magnifier, `/` or Ctrl/⌘+K): title, description, keywords, FAQ questions and `h2`/`h3` headings with their `id` (results deep-link to the section) of every indexable page, plus the other English terms in the body. Give headings an `id` so they show up as section results. Pages with `noindex` are left out.
- Social share images: `python3 scripts/og.py && node build.mjs` renders `images/og/<page>.jpg` (1200×630) from `src/og-manifest.json`. Run it after adding a page or changing a title. A page can set `"og": {"title","sub","eyebrow","sym"}` in its meta block.
- `robots.txt` explicitly allows AI crawlers; `_headers` sets UTF-8 for text files and `noindex` on source files.
- Lesson pages get a share bar (LINE, Facebook, X, copy link) automatically.
- New pages are picked up by `sitemap.xml`, `llms.txt`, `llms-full.txt`, `search-index.json`, the Markdown copies and the RSS feed on the next `node build.mjs`; nothing is edited by hand. Latest additions (2026-10-19): `/learn/motor-control/star-delta-analysis/`, `/learn/en/motor-control/star-delta-analysis/`, `/blog/star-delta-timer-setting/`, `/en/blog/star-delta-timer-setting/` (short URLs `/star-delta-timer`, `/star-delta-research`, `/closed-transition`, `/wye-delta` … in `_redirects`).

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

## Power electronics (added 2026-10-13)
Series `power-electronics` in `TOPICS` (build.mjs), topic 13 (chapter 15 on the site), 4 parts × 22 sub-pages (17 original + the 5-page buck deep-dive below): DC-DC (buck-converter B, boost-converter U,
buck-boost-converter W, cuk-converter K), control (small-signal-model S, compensator-design C, analog-control A, digital-control Z,
observers O, ai-control), hardware (inductor-design L, test-power-sources V, controller-selection, switching-power-supply),
practice (engineering-techniques, troubleshooting, converter-lab). Formula cards use the same markup as the other series and appear
in the hub's formula index; the series is in `MD_SERIES` (Markdown copies for AI assistants).
- Engine `assets/pe-sim.js` (`window.PESim`; in Node copy it to `.cjs` because package.json is `"type": "module"`): switching-level
  simulator (fixed step ≈ Ts/120) of buck / boost / inverting buck-boost / Cuk with Rds(on), diode Vf, DCR, ESR, CCM/DCM; sources
  battery / 50 Hz mains through transformer + bridge + bulk C / PV single-diode model; loads R / constant current / step; control
  open loop, digital voltage-mode PI (anti-windup, soft-start), peak current mode + slope compensation, P&O MPPT (measures panel
  power, perturbs every 4 ms, step ≥ the simulator's PWM resolution); `designCalc` for L/C sizing. Checked against the textbook
  equations (buck 24→12 V, boost 24→48 V, PV MPP 96 W at 18.6 V).
- UI `assets/pe-lab.js`: `<div class="pe-lab" data-topo="buck|boost|buckboost|cuk" data-preset="<name>" [data-compact] [data-full-link] [data-hash]>`
  — 2-channel oscilloscope (min/max envelope), function generator into Vref or duty, sources, loads, controller, L/C + turns calculator.
  Presets are in `PRESETS` at the top of `pe-lab.js`; `<button data-pe-preset="<name>" [data-pe-target="<lab id>"]>` loads one;
  `/learn/power-electronics/converter-lab/#preset=<name>` opens the full lab with it. Styles: "POWER ELECTRONICS CONVERTER LAB" in site.css.
- Short URLs (`/power-electronics`, `/pe`, `/buck`, `/boost`, `/cuk`, `/compensator`, `/type-iii`, `/smps`, `/converter-lab` …) are in `_redirects`.
- Next topics planned on the hub: SEPIC/Zeta, synchronous & interleaved, rectifiers & PFC, LLC & soft switching, DAB, inverters, SiC/GaN, EV charger.

### Buck converter deep-dive (added 2026-10-15)
Five sub-pages inserted right after `buck-converter` in the `power-electronics` series (so the chapter numbers 15.2–15.6 follow it and every later page moved
up by five — the `// บทที่ 15.N` eyebrows of the older pages were renumbered; OG images regenerated with `python3 scripts/og.py --prefix learn-power-electronics`):
`buck-ccm-analysis` (formula prefix H), `buck-dcm-analysis` (J), `buck-averaged-model` (X), `buck-transfer-functions` (T), `buck-design-lab` (D).
- Engine `assets/buck-core.js` (`window.BuckCore`; copy to `.cjs` for Node because package.json is `"type": "module"`): closed-form CCM/DCM steady state and the
  required duty cycle (`dutyForVo`, with Rds(on)/DCR/Vf/Rd/synchronous), ideal waveforms, switched → averaged → small-signal state space (`ssModel`), the transfer function of
  any input (d, vg, ix) → output (vo, iL, iC, ig) pair via `C(sI−A)⁻¹B+E` (`tf`), first-order DCM model, Bode/step helpers, and a switching-level simulator (`simulate`:
  RK4 per switch interval with exact PWM edges, DCM/current-limit event detection, ESR/DCR/Ron/Vf+Rd, synchronous FET, inductor saturation, load/line program,
  open loop / PI / peak current mode, per-period loss accounting) plus a virtual network analyzer (`freqPoint`, `freqSweep`) and `designCalc`.
  **Verification done before publishing:** all 15 transfer functions at 3 operating points agree with an independent numpy Jacobian linearisation to 3·10⁻⁶; the six
  closed forms on the TF page (Gvd, Gvg, GiLd, GiLg, Zout, Zin with parasitics) match the matrices to 10⁻¹⁵; switching-sim steady state matches the formulas
  (CCM with parasitics, ideal DCM) to < 0.1 %; Pin − Pout = Σ losses to 10⁻⁵; the virtual network analyzer reproduces the theory to 0.00 dB at low frequency (CCM and DCM).
  Every number printed in the worked examples was computed by these tools.
- `assets/buck-parts.js` (`window.BuckParts`): 6 MOSFETs, 10 diodes, 22 inductors (hard/soft/no saturation), 10 capacitors — rounded datasheet-class values for teaching.
- `assets/buck-ui.js` (SVG charts with hover read-out that follow the theme, slider+number fields, matrix tables, worksheet-button API), `assets/buck-lab.js`
  (widgets `.bk-wave`, `.bk-duty`, `.bk-ss`, `.bk-avg`, `.bk-tf`), `assets/buck-design.js` (`.bk-design`). Styles: "BUCK CONVERTER DEEP-DIVE LABS" in site.css.
  Page scripts: `["/assets/lesson.js","/assets/buck-core.js","/assets/buck-ui.js","/assets/buck-lab.js"]`; the design page also loads `buck-parts.js` and `buck-design.js`.
- Worksheet buttons: `<button data-bk-preset="dcm" data-bk-target="<widget id>" data-bk-set="R=1000;L=0.0006">` loads a preset into a widget (state keys in SI units);
  `.bk-tf` also takes `data-bk-in`/`data-bk-out`; `.bk-design` takes `data-bk-prog` (std|light|over|line), `data-bk-ctrl` (pcmc|open), `data-bk-ind|dio|cap|fet`, `data-bk-n`.
- Figures: `python3 scripts/bk_figs.py` fills empty `<!--FIG:bk-…--><!--/FIG-->` blocks (circuits with the active current path, vL/iL waveforms, averaging concept,
  canonical small-signal circuit, annotated Gvd Bode); `--all` redraws.
- Short URLs: `/buck-ccm`, `/buck-duty-cycle`, `/buck-dcm`, `/state-space-averaging`, `/buck-averaged-model`, `/buck-transfer-function(s)`, `/gvd`, `/zout`, `/buck-design`, `/buck-load-test` (in `_redirects`).

## Solar PV system design (added 2026-10-13)
Series `solar-pv` in `TOPICS` (build.mjs), topic 14, 5 parts × 19 sub-pages: basics (pv-cell P, solar-resource R, panel-selection M),
system (system-types S, string-sizing D, wiring-protection W, battery-storage B), forecast (energy-yield E, load-sizing L, economics F,
forecasting-monitoring A), power electronics (mppt T, pv-inverter V, controller-selection C), applications (solar-air-conditioner H,
solar-farm G, solar-agriculture K, installation-maintenance I, design-lab). Formula cards use the same markup as the other series and
appear in the hub's formula index; the series is in `MD_SERIES`, and `src/md/solar-pv.md` is published as `/learn/solar-pv/guide.md`
(`MD_GUIDES` entries now carry their own `desc` for llms.txt). Worked-example numbers were checked with Python and against the
calculator engine in Node.
- Calculators `assets/pv-calc.js` (`window.PVCalc`; in Node copy it to `.cjs`): `<div class="fg-calc pv-calc" data-pv="string|yield|size|battery|ac|pump|cable|econ">`
  — any input can be preset with `data-<key>="value"` (keys are the first field of each entry in `CALC[...].ins`). I-V/P-V lab with partial
  shading: `<div class="pv-iv" [data-shade="100,100,25"] [data-g="1000"] [data-ta="30"] [data-stc]>` — 580 Wp module, single-diode model fitted
  to Voc/Isc/MPP, three bypass-diode substrings, shows the global MPP and where P&O started from Voc gets stuck. Thai site irradiance,
  monthly shape, orientation and mounting factors are the tables at the top of the file (rounded teaching values). Styles: "SOLAR PV DESIGN" in site.css.
- The MPPT page embeds the converter lab (`pe-lab`, preset `solar-mppt`).
- OG images: the solar pages set `"og": {"title": …}` (short title) because the full titles are long.
- Short URLs (`/solar`, `/pv`, `/mppt`, `/solar-calculator`, `/string-sizing`, `/solar-ac`, `/solar-pump`, `/lcoe` …) are in `_redirects`.

## Main menu (changed 2026-10-13)
`src/layout.html` groups the menu: `<div class="nav-grp"><button class="nav-tg" aria-controls>` + `<div class="nav-list [nav-list-r] [nav-list-wide]">`
(links and `<span class="nav-h">` headings). Below 1600 px the hamburger panel shows the groups as an accordion (the group of the
current page opens automatically, the current link is highlighted by `site.js` via `.nav-here`); from 1600 px they are dropdowns
(hover, focus or click; Esc closes). `data-nav` keys: home learn fn trig lim der int vec la lap fos sos sig fg fs cs pe pv watch tools about.
To add a page to the menu, add a link to the right group; to add a series, add a group.

## Vector algebra series (added 2026-10-13)
The original `/learn/vector-algebra/` URL is now a hub with 7 sub-pages: foundations (F), operations (V),
components-projection (P), dot-product (D), cross-product (C), engineering-applications (E), vector-lab.
Each formula has a citable ID; the hub builds the searchable index automatically.
- `assets/vector-lab.js`: `<div class="vec-lab" data-dim="2" data-operation="projection" data-a="3,4,0" data-b="2,1,0">`
  supports 2D/3D addition, subtraction, scalar scaling, dot/angle, signed scalar and vector projection, and cross.
  3D diagrams are isometric projections; use numeric results for true angles and lengths.
- `images/vector-algebra/*.svg` are topic illustrations used by the home page and social cards.
- Rebuild: `npm run build`; render only vector social cards: `python3 scripts/og.py --prefix learn-vector-algebra`;
  rebuild again so Open Graph tags point to the created JPGs. Python Playwright and Chromium are needed for OG generation.
- Vector pages are in `MD_SERIES`; `src/md/vector-algebra.md` publishes the guide.
  The build refreshes navigation, sitemap, RSS, llms.txt/full, Markdown copies and headers.
- Vector math regression checks: `node scripts/test-vectors.mjs` (known geometry and 1,000 deterministic identity checks).
- Cloudflare Pages serves the committed root files directly; commit generated outputs with source changes.

## Home EV charging · Power systems & protection · Power factor (added 2026-10-13)
Three series in `TOPICS` (build.mjs), topics 15–17, all in `MD_SERIES`; formula cards use the same markup as the other series.
- `ev-charging` (9 pages, prefixes C B M W H P T S): charging basics, battery & time, Mode 2 portable charger ("ชาร์จช้าด้วยไฟบ้าน"),
  wallbox & Control Pilot ("ชาร์จเร็วที่บ้าน"), home electrical (meter, load, cable), safety (RCD Type B, earthing), tariffs/TOU,
  solar + air conditioning + EV (home energy management), ev-lab.
- `power-systems` (11 pages, prefixes G A U L F S P R E D): preparation course for power system analysis and protection, power-lab.
- `power-factor` (8 pages, prefixes B W C K T H M): basics, waveforms, correction, capacitor banks, billing, harmonics, measurement, pf-lab.
- Shared toolkit `assets/ee-kit.js` (`window.EEKit`: parser, formatting, SVG `chart`, calculator builder). Load it before:
  - `assets/ev-calc.js`: `<div class="fg-calc ev-calc" data-ev="time|portable|cp|home|cable|cost|solar">`, Control Pilot lab `<div class="ev-cp" data-a="32" data-state="C">`,
    24-h home energy simulator `<div class="ev-sim" data-preset="now|offpeak|solar-commuter|wfh-solar|battery|small-meter">`; `<button data-ev-preset>` loads a preset.
  - `assets/ps-calc.js`: `<div class="fg-calc ps-calc" data-ps="pu|base|fault|ufault|seq|reg|pd|earth|diff|relay">`, TCC lab `<div class="ps-tcc" data-if="10000">`.
  - `assets/pf-lab.js`: simulator `<div class="pf-sim" data-preset="motor" [data-compact] [data-mini data-loads="motor"] [data-views="wave,phasor,tri,meter,cable"]>`
    (presets in `PRESETS`, `#preset=<name>` on the page URL), virtual capacitor bank `<div class="pf-bank" data-steps="6 × 25 kvar" data-target="0.95">`,
    calculators `<div class="fg-calc pf-calc" data-pf="qc|bill|twowatt|truepf|resonance|motor|avg">`.
  - Any calculator input can be preset with `data-<key>`; `<button data-ev-fill|data-ps-fill|data-pf-fill="key" data-vals='{"k":"v"}'>` refills one.
  - In Node, copy the files to `.cjs` and set `globalThis.EEKit = require("./ee-kit.cjs")` before requiring a calculator file.
- Thai tariffs (2025 rates, Ft as an input), cable ampacity and meter tables are rounded teaching values; worked-example numbers were checked against the engines in Node.
- Menu: one group "ไฟฟ้ากำลัง" (`data-nav` ev ps pf). Short URLs (`/ev`, `/wallbox`, `/tou`, `/per-unit`, `/tcc`, `/pf`, `/pf-lab` …) are in `_redirects`.

## Mathematics split into subjects · calculus track · Laplace series (added 2026-10-14)
- Menu: the old combined math dropdown is gone. Inside `<div class="nav-math">` each subject has its own group, in reading order:
  `fn` functions · `trig` trigonometry · `lim` limits · `der` derivatives · `int` integrals · `vec` vectors · `la` linear algebra · `lap` Laplace.
  From 1600 px `.nav-math` is a second tab row under the header; below that it is a "คณิตศาสตร์" heading in the hamburger panel
  (CSS "MATH TABS" block). `<span class="nav-sec">` headings separate math from electrical engineering.
- Chapters (TOPICS order): 1 functions, 2 trigonometry, 3 limits, 4 differential-calculus (+ `engineering-applications`, prefix A),
  5 integral-calculus (+ `calculus-basics`, + `engineering-applications`), 6 vector-algebra, 7 linear-algebra (+ `matrix-lab`,
  + `engineering-applications`, prefix G), 8 laplace-transform (series: `complex-analysis` Z, `pole-zero-roc` R, `properties` P,
  `differential-equations` Q, `inverse-laplace-transform` V; hub formulas prefix L). Everything after Laplace moved up by 2.
  `/learn/calculus-basics/` redirects to `/learn/integral-calculus/calculus-basics/`.
- `hubFx: true` + `hubShort`/`hubPrefix` on a topic adds the hub page's own formulas to the series formula index.
- New scripts: `assets/mathkit.js` (MK: rationals, nice numbers, TeX, SVG plot with draggable marks), `assets/lap-core.js`
  (LapCore: parse rational F(s) with e^(-Ts) delays, poles with multiplicity, residues, f(t) and step-by-step TeX; checked against sympy),
  `assets/lap-lab.js` (widgets `.lap-inv` `.lap-pz` `.lap-cplx` `.lap-map` `.lap-surf` `.lap-res` `.lap-prop` `.lap-ode`;
  `<button data-lap-f="...">` loads the calculator, `#f=` in the URL too; `data-lap-ode='{"order":2,"a":1,...}'`),
  `assets/calc-lab.js` (`.cl-fn` `.cl-limit` `.cl-tangent` `.cl-newton` `.cl-opt` `.cl-cap` `.cl-crank` `.cl-rms` `.cl-beam`),
  `assets/la-eng.js` (`.la-truss`, `.la-modes`). Matrix calculator links: `/learn/linear-algebra/matrix-lab/#calc=`.
- Static figures: `python3 scripts/math_figs.py` fills empty `<!--FIG:key--><!--/FIG-->` blocks (`--all` redraws). Classes `.mf-*` in site.css.
- Home: `#math` section (`.math-grid` of subject cards + Laplace feature `home-lap`). Short URLs: `/functions` `/limits`
  `/derivative` `/laplace` `/inverse-laplace` `/partial-fractions` `/matrix-lab` `/truss` `/beam-lab` in `_redirects`.

## Sensors & transducers (expanded 2026-10-14)
Series `sensors-transducers` in `TOPICS` (build.mjs), topic 20, 4 parts × 20 sub-pages, in `MD_SERIES`; guide `src/md/sensors-transducers.md`
→ `/learn/sensors-transducers/guide.md`. Parts: foundations (fundamentals F, history-technology H, units U, unit-lab C, measurement-standards M,
electrical-standards E), quantities (temperature-sensors T, pressure-sensors P, flow-measurement Q, level-measurement L, force-position R,
current-voltage-sensing V), signals (signal-conditioning-adc A, industrial-signals I, modbus D, fieldbus B, smart-sensors-iiot N),
practice (pid-symbols, installation-calibration K, instrumentation-lab). Hub formulas S1–S4 (`hubFx`).
- **Spelling decision (whole site):** เซนเซอร์ · ทรานส์ดิวเซอร์ · ทรานสมิตเตอร์ (Royal Institute transliteration rules). The variants
  เซ็นเซอร์ / ทรานสดิวเซอร์ appear only in descriptions, JSON-LD `alternateName` and llms.txt so search still matches them. Rationale: hub `#terms`.
- `assets/sx-calc.js` (`window.SXCalc`, needs ee-kit.js): engine (IEC 60751 CVD, NIST ITS-90 thermocouples B E J K N R S T, IEC 60584 tolerances,
  NTC, ISO 5167-2 Reader-Harris/Gallagher orifice with iteration, Modbus CRC-16, float32 byte orders) + 26 calculators
  `<div class="fg-calc sx-calc" data-sx="rtd|tc|cjc|ntc|ptx|reynolds|orifice|mag|ultra|vortex|hydro|dplevel|radar|usonic|tankvol|bridge|loadcell|encoder|shunt|ct|adc|loop|scale|fbseg|rs485|battery">`;
  `<button data-sx-fill="key" data-vals='{...}'>` refills one. Verified: NIST tables (K 100 °C = 4.096 mV), Pt100 138.5055 Ω, `fluids` library for ISO 5167, CRC `01 03 00 00 00 02` → `C4 0B`.
- `assets/sx-bus.js` (needs sx-calc.js): `.sx-loop` 4–20 mA loop simulator (faults; `button[data-sx-loop=fault][data-v]`), `.sx-hart`, `.sx-modbus`
  (frame builder + virtual transmitter), `.sx-crc`, `.sx-f32`, `.sx-tagdec` (ISA-5.1 decoder), `.sx-cal` (5-point calibration sheet).
- `assets/sx-plant.js`: `<div class="sx-plant" data-preset="level-pid" [data-compact]>` virtual plant (tank, VFD pump, valve, heater, LT/FT/PT/TT with NE 43,
  two PID loops, alarms, interlock, live Modbus map, 8 faults). Presets in `PRESETS`; `button[data-plant-preset]`, `button[data-plant-fault]`. Used on the home page too.
- `assets/sx-std.js` standards database (64 entries with country/city) + selector by sensor type.
- Figures: `python3 scripts/sx_figs.py` fills empty `<!--FIG:sx-…--><!--/FIG-->` blocks (`--all` redraws); styles `.xf-*` in site.css "SENSORS SERIES".
- Menu: own group `navg8` "เซนเซอร์ · วัดคุม" with a `nav-sec` heading "เครื่องมือวัด · วัดคุม" (hamburger). Home: section `#sensors` + hero badge.
- Short URLs (`/sensors`, `/pt100`, `/thermocouple`, `/orifice`, `/magmeter`, `/radar-level`, `/4-20ma`, `/hart`, `/ne43`, `/modbus`, `/profibus`,
  `/io-link`, `/p-and-id`, `/calibration`, `/sil`, `/instrument-lab` …) in `_redirects`.

## Motor control & PLC series + English editions (2026-10-14)
Topics in `src/topics-mc-plc.mjs` (`MC_PLC_TOPICS`, spread at the end of `TOPICS`): `motor-control` (topic 21, 15 pages: induction-motor M,
supply-systems S, motor-connections C, control-devices D, diagrams-symbols G, dol-starter L, forward-reverse R, star-delta Y, star-delta-analysis E (added 2026-10-19, see below), soft-starters T,
applied-circuits A, vfd V, vfd-applications P, design-installation K, motor-lab; hub H1–H4) and `plc` (topic 22, 11 pages: plc-fundamentals F,
io-wiring W, ladder-basics B, timers-counters T, iec-languages L, plc-motor-control M, sequential-control S, analog-pid-vfd P, commissioning-safety K, plc-lab).
All numbers are for 230/400 V 50 Hz (TH, LA, KH, VN, MM, MY, SG). Motor model: double-cage 7.5 kW 4-pole fit (In ≈ 14 A, Is/In ≈ 6.5, Ts/Tn ≈ 2.15, Tk/Tn ≈ 3).
- **i18n:** a topic with `lang: "en"` (`en/motor-control`, `en/plc`, pages in `src/pages/learn/en/<series>/` → `/learn/en/…`) is an English edition;
  `enSlug`/`thSlug` link the twins. `UI` dict in build.mjs localises TOC, series nav, pager, FAQ, formula index, share, dates. `<!--lang-switch-->`
  renders the TH/EN pill switch to the twin page (same sub slug, or `meta.alt` for stand-alone pages such as `/learn/en/`). `meta.lang` sets the
  language of a page without a lesson. hreflang/og:locale come from the layout vars. `EN_CHROME` translates header/footer strings on English pages;
  the subject menu stays Thai (menu group `navg9` + top-level "English" link). lesson.js / ee-kit.js switch UI strings when `<html lang="en">`.
- Figures: `python3 scripts/mc_figs.py [files]` fills empty `<!--FIG:mc-…-->` / `<!--FIG:plc-…-->` blocks (`--all` redraws, `--list`, `--preview out.html`);
  a key ending `-en` draws English labels. Control circuits use a small layout engine in the script (IEC 60617 symbols, IEC 81346 codes).
- `assets/mc-calc.js` calculators `data-mc="current|speed|stardelta|starting|cable|vf|energy|scale|scan"`; `assets/mc-lab.js` starting simulator
  `.mc-lab[data-mode=dol|fr|yd|soft|vfd][data-modes][data-load]`; `assets/plc-sim.js` ladder simulator `.plc-sim[data-preset=dol|fr|yd|flasher|traffic|tank|counter|setreset][data-edit]`
  (text program: coils, S/R, TON/TOF/TP, CTU, P()/N(); `module.exports {compile, PRESETS}` for Node tests). All bilingual.
- Home: section `#motor-plc`. Short URLs `/motor-control` `/dol` `/star-delta` `/vfd` `/plc` `/ladder` `/plc-lab` `/motor-lab` `/en` … in `_redirects`.

### Diagram update (2026-10-15)
- `scripts/mc_figs.py` IEC schematics now follow IEC 60617 / IEC 60204-1 more closely: fuse symbol with the conductor through it, thermal overload relay with dashed coupling and 95-96 link, breaker with I>> release, motor with terminal rings and PE bonded to the frame, column numbers + contact cross-reference box under every coil (`control(..., below=58, labels=…)`, `f.mains`), lamp colour codes, coils on the N rail. Reversing / star-delta power circuits route each tap at its own height (the old figures shorted L1-L2-L3 with one bus line).
- New NEMA/JIC figures (`mc-nema-symbols`, `mc-nema-dol`, `mc-nema-fr`, `mc-nema-yd`) built with the ladder engine `nema_ladder()` / `NE NS NP NRN` (rung numbers, wire numbers, underlined NC refs) and single-line diagrams `mc-sld-iec`, `mc-sld-nema`. Sections `#single` and `#nema` on the diagrams-symbols page, `#nema` on dol-starter, forward-reverse and star-delta (Thai + English).

## Blog / articles (added 2026-10-16)
`/blog/` holds short, search-oriented articles (one question each) that link into the lesson series. `/articles/` redirects to it.
- A post is `src/pages/blog/<slug>.html` with a meta block containing `"blog": true`, `"tag"` (label on the card), `"series"` (lesson slug(s), e.g. `["laplace-transform"]`), `"published"`, `"updated"`, `"keywords"`, `"faq"` and `"og"`. Copy an existing post as the template. Add `"draft": true` to hide a post (noindex, not listed, not in sitemap/llms.txt).
- Write the in-body links by hand (descriptive anchor text, at least 3 links into `/learn/`, plus a `post-next` box). The build adds the rest automatically: hub list (`<!--blog-list-->`), "more articles" and share bar at the bottom of each post (`<!--pager-->`), BlogPosting + BreadcrumbList + FAQPage JSON-LD, sitemap.xml, llms.txt and llms-full.txt.
- Reverse links: every page of a lesson series listed in a post's `"series"` shows an "บทความอ่านง่ายเกี่ยวกับหัวข้อนี้" box (`blogForTopic()` in build.mjs). The home page shows the 3 newest posts (`<!--blog-latest-->`).
- **English edition** (`/en/blog/`): every Thai post has a full translation (not a summary; formulas and worked numbers unchanged) at `src/pages/en/blog/<same slug>.html`, route `/en/blog/<slug>/`, and the hub is `src/pages/en/blog/index.html`. Use the same slug as the Thai post: the two are paired by slug, so the build adds the reciprocal `hreflang` (th ⇄ en, `x-default` = Thai), `og:locale` (`th_TH` / `en_US`) plus `og:locale:alternate` for the twin, and the TH/EN switch (put `<!--lang-switch-->` under the breadcrumb in both files). An English post needs `"lang": "en"` and its own English `title`, `description`, `ogTitle`, `keywords`, `tag`, `faq` and `og` (the Thai `tag` and `og` are not reused). In-body links go to `/en/blog/…` for other articles and to the Thai lessons under `/learn/…` marked "(in Thai)". Cards, "more articles", JSON-LD (`inLanguage`, breadcrumbs, `Blog`), sitemap.xml, llms.txt and llms-full.txt are language-aware. The English social images are `images/og/en-blog-*.jpg` (`python3 scripts/og.py --prefix en-blog`).
- **YouTube Shorts in a post** (added 2026-10-17, first used in `3-phase-motor-delta-connection`): `<div class="screen short" data-yt-id="VIDEO_ID" data-yt-title="…">` with the usual `.facade` and `.play` button gives a 9:16 click-to-load player (`assets/site.js`); add a `VideoObject` to the meta `"jsonld"` array (name, description, thumbnailUrl `https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg`, uploadDate, duration, embedUrl). Paired figures that stack on phones: `<figure class="post-fig"><div class="fig-pair"><svg class="xf">…</svg><svg class="xf">…</svg></div>`; `xf-big`, `xf-lbl`, `xf-note` are larger text classes for small viewBoxes.
- `"keywords"` in a page's meta block is also written as `<meta name="keywords">` (`{{keywords}}` in `src/layout.html`); Google ignores it, other engines may read it. `"ogDescription"` overrides the description for og:/twitter: tags.
- `"featured": true` pins a post first in the hub list and the home-page strip (used for the long-form guide).
- **Long-form guide** `pid-tuning-guide` ("PID Academy", `/blog/pid-tuning-guide/` and `/en/blog/pid-tuning-guide/`): full-length instead of a short answer. Its four figures and every simulated number in the comparison table are generated by `python3 scripts/pid_guide_figs.py` (FOPDT plant K=2, L=2 s, T=10 s; rewrites the `<!--FIG:…-->` blocks in both editions; `--table` prints the numbers used in the text, including gain/phase margin). Re-run it if you change a tuning rule or the plant, and update the tables by hand.
- Check after building: `node build.mjs && node scripts/test-blog.mjs` (title/description length, one h1, canonical, JSON-LD, KaTeX errors, broken links, sitemap/llms.txt, reverse links; for both languages also the TH⇄EN pairing: hreflang, og:locale, language switch, no Thai text in the English pages).
- Social images: `python3 scripts/og.py` renders every card; it also re-renders old ones, so `git checkout -- images/og` for files you did not mean to change and keep the new `blog-*.jpg`.

## Limits series: sequences & series · mathematical induction (added 2026-10-17)
`limits` in `TOPICS` (build.mjs) is now a series (chapter 3, `hubFx` prefix L): the hub moved to `src/pages/learn/limits/index.html`
(same URL `/learn/limits/`) and gained the series nav, cards and formula index. Sub-pages: `sequences-series` (3.1, formula prefix S,
S1–S28) and `mathematical-induction` (3.2, prefix I, I1–I14). Chosen over a new chapter so every later chapter number stays the same.
- `assets/seq-lab.js` (`window.SQ`; works in Node with `require`): safe expression language (variables n, a, k, x; implicit
  multiplication, `n!`), exact Taylor coefficients by Taylor-mode automatic differentiation (jets), numerical analysis of sequences
  and partial sums (checkpoints 10³…10⁶, Aitken extrapolation, snapping to fractions / e / π² / 6 / ln 2 / φ). Widgets:
  - `<div class="sq-lab" data-mode="explicit|recursive" data-f="…" data-g="…" data-a1="…" data-n="30" data-eps="0.05" data-view="terms|sums|cobweb">`
    sequence explorer (ε–N band and N(ε), partial sums, cobweb diagram with g′(L), arithmetic/geometric detection);
  - `<div class="sq-test" data-preset="harmonic">` series tester (14 presets with exact reasoning: geo harmonic pseries n2n nth comp alt factn
    nlogn exp2 root tele sin sqrtn, plus a custom aₙ with numeric diagnostics clearly labelled as evidence, not proof);
  - `<div class="sq-taylor" data-f="sin(x)" data-a="0" data-n="5" data-x="2">` Taylor polynomial, true error, Lagrange bound, radius of convergence;
  - `<div class="in-domino">` (base case / inductive step / strong induction with one or two base cases),
    `<div class="in-check" data-preset="sum-k2">` (table of P(n), the step P(k) ⇒ P(k+1) with numbers, custom Σ f(k) = g(n) with a
    polynomial proof certificate when both are written as polynomials), `<div class="in-flaw" data-preset="horses">` (find the wrong line).
  - Page buttons: `data-sq-set='{…}'`, `data-sqt="<preset>"`, `data-ty-set='{…}'`, `data-in-preset="<id>"`, `data-flaw="<id>"`.
- Figures: keys `sq-terms sq-geo-square sq-integral-test sq-taylor-sin sq-ladder in-staircase in-chain` in `scripts/math_figs.py`.
  Styles: "SEQUENCES · SERIES · INDUCTION" in site.css.
- Every worked-example number was checked with sympy (and the engine with Node) before publishing.
- Short URLs: `/sequences` `/series` `/geometric-series` `/convergence-tests` `/ratio-test` `/power-series` `/taylor-series` `/maclaurin`
  `/induction` `/mathematical-induction` `/proof-by-induction` `/strong-induction` (in `_redirects`).

## AC induction motors — complete guide (added 2026-10-17)
Stand-alone topic `ac-induction-motor` (chapter 23, appended after the PLC topic in `TOPICS` so no chapter number moved), one long page
`src/pages/learn/ac-induction-motor.html` → `/learn/ac-induction-motor/`. Sections: Thai grid (EGAT/MEA/PEA voltage levels), factory vs house supply,
principle (formula prefix P), single-phase motors (S), rotor types incl. deep bar, double cage, wound rotor and new tech (R), connections,
torque–speed curves against load curves (L: loads, operating point, stability, acceleration, voltage), transients (T), star–delta in depth (Y),
starting methods (M), cable and breaker design (D, Thai EIT 125 % / 250 % rules), control overview, checklist. Menu: first link of group `navg9` (`data-nav="acm"`).
- Models: `scripts/acm_model.py` — the 7.5 kW double-cage motor of the motor-control series plus rotor variants (single cage low/high R, wound rotor +
  R_ext), loads, operating point, quasi-static run-up, an αβ dynamic model (checked against the equivalent circuit to 1e-6) used for the DOL and
  star–delta changeover transients, a two-winding single-phase capacitor-motor model and the deep-bar skin-effect formulas.
  `python3 scripts/acm_model.py` prints every number quoted in the worked examples.
- Figures: `python3 scripts/acm_figs.py` fills empty `<!--FIG:acm-…--><!--/FIG-->` blocks (`--all` redraws, `--preview out.html`); curves are
  simplified in pixel space (RDP) so the dynamic traces stay small. The page also reuses `mc-` figures (rotating field, equivalent circuit, terminal box,
  voltage choice, supply phasor, star–delta control/timing, DOL control) — fill those with `python3 scripts/mc_figs.py src/pages/learn/ac-induction-motor.html`.
- `assets/acm-lab.js` (needs ee-kit.js; `module.exports` for Node): `.acm-lab` torque–speed lab (rotor, start method DOL/Y-Δ/soft/autotransformer/VFD,
  voltage, load type, load level, inertia → operating point, accelerating area, run-up in time, verdict); `<button data-acm-set='{…}'>` loads a scenario.
  Calculators `<div class="fg-calc acm-calc" data-acm="branch|feeder|accel">`. Styles: "AC INDUCTION MOTOR GUIDE" in site.css.
- Star–delta phase order: the simulation and manufacturer guidance favour KM3 pairing U1–V2 · V1–W2 · W1–U2 (L3→U2) for a lower changeover transient.
- Short URLs `/ac-motor`, `/torque-speed`, `/speed-torque-curve`, `/single-phase-motor`, `/double-cage`, `/wound-rotor`, `/motor-cable-size`, `/motor-breaker` … in `_redirects`.

## Multivariable & vector calculus (added 2026-10-17)
Chapter 24 `multivariable-calculus` (appended to `TOPICS`, no chapter renumbered): hub `/learn/multivariable-calculus/` + 12 content pages and the lab
bench, 13 sub-pages in 6 parts. Menu group "หลายตัวแปร" (`data-nav="mvc"`, list `navmvc`) in `src/layout.html`. Formula prefixes: F functions, P partial
derivatives, G gradient, O optimisation, M multiple integrals, R vector functions, D vector fields, L line integrals, S surface integrals,
E electrical, K mechanical, C civil. Pages: `functions-of-several-variables`, `partial-derivatives`, `gradient-directional-derivative`, `optimization`,
`multiple-integrals`, `vector-functions`, `vector-fields`, `line-integrals`, `surface-integrals`, `electrical-engineering`, `mechanical-engineering`,
`civil-engineering`, `multivariable-lab`. SEO pattern on every page: Thai-first title/H1 + (English term) + search words, meta description with Thai and
English main terms, first technical term as "ไทย (English)", FAQ ×4–5, English URLs, English terms in figure `aria-label`s.
- `assets/mvc-core.js` — dependency-free engine (`window.MVC`, Node-importable): expression parser (implicit products, `^`, `ln`, no `eval`),
  symbolic ∂ with simplification and TeX output, vector operators (grad, div, curl, curl2, lap, hessian, jacobian), Gauss–Legendre quadrature with a
  cosine map (`quad`, `quad2`, `quad3`), marching-squares contours, critical points (Newton + second-derivative test), gradient descent,
  space curves (T N B κ τ, arc length), line integrals and parametric surfaces (area, flux). Checked by `node scripts/test-mvc.mjs`
  (sympy/closed-form references: helix κ = τ = ½, sphere flux 4π, Stokes π, ball volume, polar Gaussian disc, …).
- Labs (all take their state from `data-*` attributes; a page button with `data-mv-target="<id>" data-mv-set='{…}'` reloads a widget through `box._set`):
  `assets/mvc-lab.js` (Scene3D canvas orbit viewer, Map2D SVG plan view; `.mv-surf` `.mv-grad` `.mv-limit` `.mv-err`), `assets/mvc-opt.js`
  (`.mv-opt` data-mode crit | lagrange | lsq, `.mv-int` rect | typeI | polar with mass/centroid/inertia, `.mv-tri` rect | cyl | sph, `.mv-jac`),
  `assets/mvc-vec.js` (`.mv-curve` `.mv-field` `.mv-flux` data-mode gauss | stokes, `.mv-work`), `assets/mvc-eng.js` (`.mv-charge` `.mv-heat`
  `.mv-terrain` `.mv-sect`). Each file calls `MVL.boot()` at its end (idempotent), so any subset can be loaded; list the files in the page meta
  `scripts` after `/assets/mathkit.js` and `/assets/mvc-core.js`. Styles: "MULTIVARIABLE CALCULUS LABS" block in `assets/site.css`.
- Figures: `python3 scripts/mv_figs.py` fills empty `<!--FIG:mv-…--><!--/FIG-->` blocks (`--all` redraws, `--preview out.html`); surfaces and curves are
  computed from their equations with a small oblique projection; classes `.mf-*`.
- Social cards: `python3 scripts/og.py --prefix learn-multivariable-calculus --chromium /opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
- `src/md/multivariable-calculus.md` publishes `/learn/multivariable-calculus/guide.md`; the series is in `MD_SERIES`.
- Short URLs (`/multivariable`, `/calculus-3`, `/vector-calculus`, `/partial-derivatives`, `/gradient`, `/lagrange-multiplier`, `/double-integral`,
  `/greens-theorem`, `/stokes-theorem`, `/divergence-theorem`, `/cut-and-fill`, …) are in `_redirects`.
- Every worked-example number was checked with sympy/numpy before publishing.

## About page photos (added 2026-10-18)
Photos live in `images/about/` as WebP in several widths (no metadata, licence plates blurred) and are used with `srcset`/`sizes`
in `src/pages/about.html`: profile photo `teerawut-savangboon-160/320.webp`, classroom strip `teaching-*-480/800/1200.webp`,
field trip `egat-lamtakhong-*-360/640.webp`. `teerawut-savangboon-ajarn-mod.jpg` (800×800) is the Person `image` in the
JSON-LD of the about and home pages. The About page's share card is the hand-made `images/about/og-about.jpg`
(set with `"ogImage"` in its meta block), so `scripts/og.py` no longer decides that page's preview.
Credentials (education, position, ORCID, Scopus, Google Scholar) are the `#credentials` section of `src/pages/about.html`;
the same facts are in the Person JSON-LD (`alumniOf`, `hasCredential`, `identifier`, `sameAs`) on the about and home pages — update both together.

## DC circuit analysis (added 2026-10-18)
Topic 25 `dc-circuits` in `TOPICS` (build.mjs): one long lesson page `src/pages/learn/dc-circuits.html` with 8 sections
(formula cards B basics, E elements, K Kirchhoff, S series/parallel/Δ–Y, N nodal/mesh/MNA, T theorems, R transients, H technology),
a full-width virtual lab between the two lesson columns, and a problem bank (26 problems, 4 levels) with unlimited random practice.
- `assets/dc-core.js` — MNA engine (`DCE`: R L C V I, ammeter/voltmeter, E/G/H/F dependent sources, DC operating point and
  trapezoidal transient with consistent t = 0⁺ start), circuit builders and presets (`CK`), canvas schematic renderer (`RND`).
- `assets/dc-lab.js` — the grid editor (place, wire, drag, rotate, undo, presets, JSON share), results table with power balance,
  MNA matrix view, transient plots with a time scrubber. The board is kept in `localStorage` (`dc-lab-v1`).
- `assets/dc-lesson.js` — lesson widgets (colour code, loaded divider, max power, RC/RL, ζ shape, HV loss table), schematic figures
  (`<canvas data-fig="key">`), `data-open="key"` buttons that load a circuit into the lab, the problem bank (`PB.LIST`) and practice
  generators (answers computed by the same solver). Progress is kept in `localStorage` (`dc-prog-v1`).
- Styles are in `site.css` under `.dcx` (all class names prefixed `dc-` where they could collide).
- Every worked-example and problem answer was checked against the solver in Node before publishing.
- Short URLs: `/dc`, `/dc-circuits`, `/circuit-lab`, `/circuit-simulator`, `/kcl`, `/kvl`, `/nodal-analysis`, `/mesh-analysis`, `/thevenin`, `/circuit-problems`.

## Star–delta analysis & research (added 2026-10-19)
Sub-page `star-delta-analysis` of the `motor-control` series (chapter 21.9, inserted right after `star-delta`, formula prefix E, E1–E24), Thai
`src/pages/learn/motor-control/star-delta-analysis.html` and English `src/pages/learn/en/motor-control/star-delta-analysis.html`. The later
chapters moved up by one (soft-starters 21.10 … motor-lab 21.15; eyebrows renumbered in both languages, OG images re-rendered). Sections: research
questions and key results, choosing Y / Δ / Y-Δ from the nameplate (wye = star), star-stage mathematics, timer setting (t = c·τm, τm = J·ωs/Tn,
c table, current/speed relays, on-site method, calculator), changeover physics (residual voltage, phase drift δ, |V_Δ − e|, peak estimate, dead time,
KM3 standard vs lagging order, closed transition), current/energy/heat (I²t, rotor heat, overload budget, voltage dip on transformers and gensets),
permanent star running at light load, dynamic lab + sweep + worksheet, 8 simulated case studies, past/present/future timeline, research summary
(abstract, findings, limitations, further research, how to reproduce), checklist and references. The research write-up is the article
`src/pages/blog/star-delta-timer-setting.html` + `src/pages/en/blog/star-delta-timer-setting.html` (IMRaD structure; `series` motor-control + ac-induction-motor).
- Engine `assets/yd-core.js` (`window.YDCore`; copy to `.cjs` for Node): the 7.5 kW double-cage motor of `scripts/acm_model.py`; steady state
  (`motor`, `opPoint`, `breakdown`, `runupQS` with Y/Δ/soft/VFD, `state` = running in Y or Δ at a shaft power, `breakEven`, `recommend` = timer rule),
  and `run(o)` — αβ dynamic model in winding quantities, fixed-step RK4 (0.1 ms research, 0.2 ms lab), modes Y / open / Δ (lagging −30° or standard +30°) /
  closed transition through Rt / DOL, triggers time / current / speed, metrics (peaks, time above 3·In, torque, residual voltage and angle, I²t, energies).
- Labs `assets/yd-lab.js` (needs ee-kit.js + yd-core.js, bilingual): `<div class="yd-lab" data-preset="pump|fan|conv|mix" …>` (dynamic start + zoom on the
  changeover; `<button data-yd-set='{"preset":"fan","ty":8}' data-yd-target="id">`), `<div class="yd-sweep" data-preset data-param="ty|td|rt">` (runs a
  sweep, CSV export), `<div class="yd-run" data-x="25">` (Y vs Δ running, savings), `<div class="fg-calc yd-calc" data-yd="timer">` (timer calculator).
  Styles: "STAR–DELTA ANALYSIS" block at the end of site.css (`.yd-*`, usable outside `.mc`).
- Numerical experiments: `node scripts/yd_research.mjs` runs E1–E14 (+ traces T), prints every table quoted in the pages and writes `scripts/yd_results.json`;
  `node scripts/yd_research.mjs E3 E5` runs a subset without rewriting the JSON. Verification: `python3 scripts/yd_check.py` (steady state vs the
  equivalent circuit to 1e-16, changeover transient vs scipy LSODA within 0.3 %; exits 1 on failure).
- Figures: `python3 scripts/yd_figs.py` fills empty `<!--FIG:yd-…-->` blocks from `yd_results.json` (`-en` keys draw English labels, `--all`, `--preview`):
  yd-runup, yd-timer, yd-trace, yd-voltage, yd-phasor, yd-deadtime, yd-zoom, yd-closed, yd-energy, yd-dip, yd-yvd. The pages also reuse `mc-voltage-choice`.
- Wording: KM3 "standard" order L1→W2 L2→U2 L3→V2 (as the terminal links, leads 30°) vs "lagging" order L1→V2 L2→W2 L3→U2 (recommended); case studies are
  labelled as simulated cases, not plant data. Home page: hero "ใหม่" badge, chip + lab button in `#motor-plc`, newest-article strip; status feed entries in `data/updates.json` (rendered on /about/ and in feed.xml).
- Short URLs: `/star-delta-analysis`, `/star-delta-timer`, `/wye-delta-timer`, `/star-delta-dead-time`, `/closed-transition`, `/star-delta-energy`,
  `/star-delta-saving`, `/star-delta-research`, `/star-delta-lab`, `/wye-delta`, `/en/star-delta-analysis`, `/en/star-delta-timer` (in `_redirects`).

## Sequences & series — chapter 26 (added 2026-10-24)
`sequences-and-series` in `TOPICS` (build.mjs), 10 sub-pages under `src/pages/learn/sequences-and-series/`:
sequences (Q1–Q22), infinite-series (S1–S16), convergence-tests (T1–T12), alternating-series (A1–A11), power-series (P1–P14),
taylor-series (Y1–Y23), laurent-series (L1–L13), engineering-applications (E1–E11), exam-practice (60 problems, sets A/B/C) and
series-lab (12 tools). The one-page overview `/learn/limits/sequences-series/` (3.1) stays as the short version and links here.
Markdown guide for AI tools: `src/md/sequences-and-series.md` → `/learn/sequences-and-series/guide.md` (MD_GUIDES).
- `assets/series-lab.js` (`window.SRLab`; also `require`-able): widgets `sr-sums`, `sr-integral`, `sr-alt` (error bound / Riemann
  rearrangement), `sr-quiz` (40 series, 3 levels), `sr-power` (real interval + complex disc; `_set` takes preset, n, c, a), `sr-need`
  (terms needed), `sr-laurent` (annulus regions by partial fractions, draggable z, coefficient stems, Z-transform view), `sr-drill`
  (9 random problem types, score in localStorage `sr-drill-v1`), `sr-approx` (pendulum, MCU sine with Horner C code, diode).
  Page buttons: `data-sr-set='{…}' data-sr-target="<id>"`. Uses `assets/mathkit.js` and `assets/seq-lab.js` (sequence explorer,
  tester, Taylor). Both lab scripts size plots to their box (`plotIn`) so graphs stay readable on phones.
- Figures: `scripts/sr_figs.py` (keys `sr-*`, each with an `-en` twin for English posts); run `python3 scripts/sr_figs.py` after editing
  a `<!--FIG:sr-…-->` marker, `--all` to redraw everything. Styles: "SEQUENCES & SERIES CHAPTER" in site.css.
- Articles (TH `/blog/<slug>/`, EN `/en/blog/<slug>/`): sequences-and-series-roadmap, convergence-test-flowchart,
  radius-of-convergence, laurent-series-vs-taylor-series.
- Every worked-example number was checked with sympy/mpmath (Laurent coefficients also in Node) before publishing.
- Short URLs (`_redirects`): `/series` `/sequences` `/sequences-and-series` `/convergence-tests` `/ratio-test` `/power-series`
  `/taylor-series` `/maclaurin` now point to chapter 26, plus `/series-lab` `/series-exam` `/integral-test` `/comparison-test`
  `/root-test` `/alternating-series` `/radius-of-convergence` `/taylor-table` `/laurent` `/laurent-series` `/residues` `/z-transform-roc`.

## Home page "what's new" box and /updates/ (added 2026-10-24)
Before this change the home page had no list of updates — `data/updates.json` was only shown on `/about/` and in `feed.xml`, so edits
never appeared on the home page. Now `<!--home-updates-->` (build.mjs `homeUpdatesHtml`, newest 6, icons per tag, "ใหม่" badge on the
newest date) is pre-rendered into `src/pages/index.html` and `assets/home.js` refreshes it live from `/data/updates.json`.
`/updates/` (`src/pages/updates.html`) lists every entry with tag filters (15 per page, `data-page` on `#feed`, handled by about.js).
Short URLs `/whats-new` `/changelog` `/news` → `/updates/`.

