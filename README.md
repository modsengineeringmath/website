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

## Power electronics (added 2026-10-13)
Series `power-electronics` in `TOPICS` (build.mjs), topic 13, 4 parts × 17 sub-pages: DC-DC (buck-converter B, boost-converter U,
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
  (frame builder + virtual transmitter), `.sx-crc`, `.sx-f32`, `.sx-tag` (ISA-5.1 decoder), `.sx-cal` (5-point calibration sheet).
- `assets/sx-plant.js`: `<div class="sx-plant" data-preset="level-pid" [data-compact]>` virtual plant (tank, VFD pump, valve, heater, LT/FT/PT/TT with NE 43,
  two PID loops, alarms, interlock, live Modbus map, 8 faults). Presets in `PRESETS`; `button[data-plant-preset]`, `button[data-plant-fault]`. Used on the home page too.
- `assets/sx-std.js` standards database (64 entries with country/city) + selector by sensor type.
- Figures: `python3 scripts/sx_figs.py` fills empty `<!--FIG:sx-…--><!--/FIG-->` blocks (`--all` redraws); styles `.xf-*` in site.css "SENSORS SERIES".
- Menu: own group `navg8` "เซนเซอร์ · วัดคุม" with a `nav-sec` heading "เครื่องมือวัด · วัดคุม" (hamburger). Home: section `#sensors` + hero badge.
- Short URLs (`/sensors`, `/pt100`, `/thermocouple`, `/orifice`, `/magmeter`, `/radar-level`, `/4-20ma`, `/hart`, `/ne43`, `/modbus`, `/profibus`,
  `/io-link`, `/p-and-id`, `/calibration`, `/sil`, `/instrument-lab` …) in `_redirects`.
