/* Op-amp circuits lesson: lesson widgets, schematic figures, problem bank with answer checking and unlimited practice.
   Needs oa-core.js + oa-draw.js + oa-lab.js. */
const UI = (() => {
  const { fmtSI } = OAE; const P = OK.P;
  const $ = (id) => document.getElementById(id);
  const css = (n) => getComputedStyle(DCROOT()).getPropertyValue(n).trim();
  const math = (el) => { if (typeof renderMathInElement === 'function') { try { renderMathInElement(el, { delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false, strict: 'ignore' }); } catch (e) { } } };
  const fmt = (v, d = 3) => Number((+v).toPrecision(d)).toString();
  const tex = (t, display) => { try { return window.katex ? window.katex.renderToString(t, { displayMode: !!display, throwOnError: false, strict: 'ignore' }) : t; } catch (e) { return t; } };

  /* ---------- figures & open-in-lab ---------- */
  const FIGS = {};
  for (const k of ['inverting', 'noninverting', 'follower', 'summer', 'diffamp', 'inamp', 'integrator', 'differentiator', 'lpf1', 'hpf1', 'pi', 'tia', 'sallen', 'butter4', 'mfb', 'tow', 'comparator', 'schmitt', 'rectifier']) FIGS[k] = () => P[k]();
  FIGS.osc = () => P.tow({ rq: null, ic2: -1, w: 'dc', amp: 0 });
  function drawFigures() { document.querySelectorAll('canvas[data-fig]').forEach((cv) => { const f = FIGS[cv.dataset.fig]; if (f) OAR.figure(cv, f(), { maxCell: cv.dataset.big ? 28 : 22 }); }); }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]'); if (!b) return; const k = b.dataset.open;
    if (OK.PRESETS.some((p) => p.k === k)) { LAB.openPreset(k); return; }
    const f = FIGS[k]; if (!f) return; LAB.open(f(), { mode: b.dataset.mode || 'tran' });
  });

  /* ---------- generic line plot with crosshair ---------- */
  function linePlot(cv, tipEl, cfg) {
    const box = cv.parentElement; if (!cv._h) cv._h = +cv.dataset.h || 230;
    const W = Math.max(240, box.clientWidth), H = cv._h, dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const L = 58, R = 18, T = 14, B = 32, pw = W - L - R, ph = H - T - B;
    const { x0, x1, y0, y1, xLog } = cfg;
    const fx = (x) => L + (xLog ? (Math.log10(x) - Math.log10(x0)) / (Math.log10(x1) - Math.log10(x0)) : (x - x0) / (x1 - x0)) * pw;
    const fy = (y) => T + ph - ((y - y0) / (y1 - y0)) * ph;
    g.font = '11px "IBM Plex Mono",monospace'; g.lineWidth = 1;
    g.strokeStyle = css('--grid-2'); g.fillStyle = css('--ink-3'); g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const y of cfg.yTicks) { const yy = Math.round(fy(y)) + 0.5; g.beginPath(); g.moveTo(L, yy); g.lineTo(L + pw, yy); g.stroke(); g.fillText(cfg.yFmt(y), L - 6, yy); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const x of cfg.xTicks) { const xx = Math.round(fx(x)) + 0.5; g.strokeStyle = css('--grid-2'); g.beginPath(); g.moveTo(xx, T); g.lineTo(xx, T + ph); g.stroke(); g.fillStyle = css('--ink-3'); g.fillText(cfg.xFmt(x), xx, T + ph + 7); }
    g.strokeStyle = css('--ink-3'); g.beginPath(); g.moveTo(L + 0.5, T); g.lineTo(L + 0.5, T + ph + 0.5); g.lineTo(L + pw, T + ph + 0.5); g.stroke();
    for (const v of cfg.vlines || []) { if (v.x < x0 || v.x > x1) continue; g.strokeStyle = css('--rule'); g.setLineDash([3, 3]); g.beginPath(); g.moveTo(fx(v.x) + 0.5, T); g.lineTo(fx(v.x) + 0.5, T + ph); g.stroke(); g.setLineDash([]); if (v.label) { g.fillStyle = css('--ink-3'); g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(v.label, fx(v.x) + 4, T + 2); } }
    for (const v of cfg.hlines || []) { if (v.y < y0 || v.y > y1) continue; g.strokeStyle = css('--rule'); g.setLineDash([3, 3]); g.beginPath(); g.moveTo(L, fy(v.y) + 0.5); g.lineTo(L + pw, fy(v.y) + 0.5); g.stroke(); g.setLineDash([]); if (v.label) { g.fillStyle = css('--ink-3'); g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(v.label, L + pw - 4, fy(v.y) - 2); } }
    g.save(); g.beginPath(); g.rect(L, T - 2, pw, ph + 4); g.clip();
    for (const s of cfg.series) { g.strokeStyle = css(s.color); g.lineWidth = s.w || 2; g.setLineDash(s.dash || []); g.beginPath(); s.xs.forEach((x, i) => { const X = fx(x), Y = fy(s.ys[i]); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke(); g.setLineDash([]); }
    g.restore();
    for (const m of cfg.markers || []) { g.fillStyle = css(m.color); g.strokeStyle = css('--sheet'); g.lineWidth = 2; g.beginPath(); g.arc(fx(m.x), fy(m.y), 5, 0, 7); g.fill(); g.stroke(); }
    cv._plot = { fx, L, pw, cfg };
    if (!cv._bound) {
      cv._bound = true;
      const move = (e) => {
        const p = cv._plot; if (!p) return; const r = cv.getBoundingClientRect(); const px = e.clientX - r.left; if (px < p.L || px > p.L + p.pw) { tipEl.hidden = true; return; }
        const s0 = p.cfg.series[0]; let best = 0, bd = Infinity; s0.xs.forEach((x, i) => { const d = Math.abs(p.fx(x) - px); if (d < bd) { bd = d; best = i; } });
        tipEl.innerHTML = p.cfg.tip(best); tipEl.hidden = false; tipEl.style.left = Math.min(r.width - 170, px + 12) + 'px'; tipEl.style.top = Math.max(0, e.clientY - r.top - 40) + 'px';
      };
      cv.addEventListener('pointermove', move); cv.addEventListener('pointerdown', move); cv.addEventListener('pointerleave', () => tipEl.hidden = true);
    }
  }
  const logSpace = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a * Math.pow(b / a, i / n));
  const decTicks = (a, b) => { const o = []; for (let e = Math.ceil(Math.log10(a) - 1e-9); e <= Math.floor(Math.log10(b) + 1e-9); e++) o.push(Math.pow(10, e)); return o; };
  const lin = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);

  /* ---------- 1) open-loop transfer characteristic ---------- */
  function initVtc() {
    const a = $('vt-a'), v = $('vt-v'), h = $('vt-h');
    const up = () => {
      const A = Math.pow(10, +a.value), V = +v.value, H = +h.value; const Vs = V - H;
      $('vt-ao').textContent = fmtSI(A, '', 3) + ' V/V (' + (20 * Math.log10(A)).toFixed(0) + ' dB)'; $('vt-vo').textContent = '±' + V + ' V'; $('vt-ho').textContent = H + ' V';
      const w = Vs / A; $('vt-w').textContent = '± ' + fmtSI(w, 'V', 3); $('vt-sat').textContent = '±' + fmt(Vs, 4) + ' V';
      const span = Math.max(w * 4, 1e-9); const xs = lin(-span, span, 240), ys = xs.map((x) => Math.max(-Vs, Math.min(Vs, A * x)));
      const xt = [-span, -span / 2, 0, span / 2, span];
      const yt = [-Vs, -Vs / 2, 0, Vs / 2, Vs];
      linePlot($('vt-plot'), $('vt-tip'), { x0: -span, x1: span, y0: -V - 1, y1: V + 1, xTicks: xt, yTicks: yt, xFmt: (x) => fmtSI(x, 'V', 2), yFmt: (y) => fmt(y, 3) + ' V',
        series: [{ xs, ys, color: '--s1' }], hlines: [{ y: Vs }, { y: -Vs }], vlines: [{ x: w }, { x: -w }],
        tip: (i) => 'v₊ − v₋ = ' + fmtSI(xs[i], 'V', 3) + '<br>v<sub>o</sub> = ' + fmtSI(ys[i], 'V', 4) + (Math.abs(ys[i]) >= Vs - 1e-9 ? '<br>อิ่มตัว' : '') });
    };
    [a, v, h].forEach((s) => s.oninput = up); up(); return up;
  }

  /* ---------- 2) closed-loop gain calculator ---------- */
  function initAmp() {
    let kind = 'inv'; const r1 = $('am-r1'), rf = $('am-rf'), vin = $('am-vin'), rail = $('am-v');
    document.querySelectorAll('#am-kind button').forEach((b) => b.onclick = () => { kind = b.dataset.k; document.querySelectorAll('#am-kind button').forEach((q) => q.classList.toggle('on', q === b)); up(); });
    const up = () => {
      const R1 = Math.pow(10, +r1.value), Rf = Math.pow(10, +rf.value), Vi = +vin.value, Vr = +rail.value;
      $('am-r1o').textContent = fmtSI(R1, 'Ω'); $('am-rfo').textContent = fmtSI(Rf, 'Ω'); $('am-vino').textContent = fmtSI(Vi, 'V', 3); $('am-vo2').textContent = '±' + Vr + ' V';
      $('am-l1').innerHTML = kind === 'inv' ? 'R<sub>in</sub>' : 'R<sub>g</sub>';
      const G = kind === 'inv' ? -Rf / R1 : kind === 'non' ? 1 + Rf / R1 : 1; const ideal = G * Vi; const out = Math.max(-Vr, Math.min(Vr, ideal));
      $('am-g').textContent = fmt(G, 4) + ' เท่า (' + (G === 0 ? '—' : (20 * Math.log10(Math.abs(G))).toFixed(1) + ' dB') + ')'; $('am-vo').textContent = fmtSI(out, 'V', 4);
      $('am-ng').textContent = fmt(kind === 'follower' ? 1 : 1 + Rf / R1, 4); $('am-rin').textContent = kind === 'inv' ? fmtSI(R1, 'Ω') : 'สูงมาก (ขั้ว + ของออปแอมป์)';
      $('am-sat').innerHTML = Math.abs(ideal) > Vr ? '<span class="pill warn">อิ่มตัว</span> ควรได้ ' + fmtSI(ideal, 'V', 3) + ' แต่ถูกตัดที่แรงดันแหล่งจ่าย' : '<span class="pill ok">เชิงเส้น</span> เอาต์พุตอยู่ในช่วงแหล่งจ่าย';
      $('am-sw').style.display = kind === 'follower' ? 'none' : '';
    };
    [r1, rf, vin, rail].forEach((s) => s.oninput = up); up();
  }

  /* ---------- 3) GBW / slew calculator ---------- */
  function initGbw() {
    const gb = $('gb-gbw'), gn = $('gb-g'), sr = $('gb-sr'), vp = $('gb-vp');
    const up = () => {
      const GBW = Math.pow(10, +gb.value), G = Math.pow(10, +gn.value), SR = Math.pow(10, +sr.value) * 1e6, Vp = +vp.value;
      $('gb-gbwo').textContent = fmtSI(GBW, 'Hz'); $('gb-go').textContent = fmt(G, 3) + ' เท่า (' + (20 * Math.log10(G)).toFixed(1) + ' dB)'; $('gb-sro').textContent = fmt(SR / 1e6, 3) + ' V/µs'; $('gb-vpo').textContent = Vp + ' V';
      const bw = GBW / G, tr = 0.35 / bw, fp = SR / (2 * Math.PI * Vp), fmax = Math.min(bw, fp);
      $('gb-bw').textContent = fmtSI(bw, 'Hz', 3); $('gb-tr').textContent = fmtSI(tr, 's', 3); $('gb-fp').textContent = fmtSI(fp, 'Hz', 3);
      $('gb-lim').innerHTML = fp < bw ? '<span class="pill warn">Slew rate เป็นตัวจำกัด</span> ที่แอมพลิจูด ' + Vp + ' V ใช้ได้ถึง ' + fmtSI(fp, 'Hz', 3) : '<span class="pill ok">GBW เป็นตัวจำกัด</span> แบนด์วิดท์ −3 dB ' + fmtSI(bw, 'Hz', 3) + ' (ที่ Vp ' + Vp + ' V ยังไม่ติด slew)';
      const f0 = 1, f1 = 1e9; const fs = logSpace(f0, f1, 200); const A0 = 2e5, fp0 = GBW / A0;
      const open = fs.map((f) => 20 * Math.log10(A0 / Math.hypot(1, f / fp0)));
      // exact one-pole closed loop: Acl = A/(1+Aβ) with A = A0/(1+jf/fp0) and β = 1/G
      const acl = fs.map((f) => { const den = [1 + A0 / G, f / fp0]; const m = A0 / Math.hypot(den[0], den[1]); return 20 * Math.log10(m); });
      linePlot($('gb-plot'), $('gb-tip'), { x0: f0, x1: f1, xLog: true, y0: -20, y1: 120, xTicks: decTicks(f0, f1), yTicks: [-20, 0, 20, 40, 60, 80, 100, 120], xFmt: (x) => fmtSI(x, 'Hz', 1).replace(' ', ''), yFmt: (y) => y + ' dB',
        series: [{ xs: fs, ys: open, color: '--s2', dash: [6, 4] }, { xs: fs, ys: acl, color: '--s1' }], vlines: [{ x: bw, label: 'f₋₃dB' }, { x: GBW, label: 'GBW' }], hlines: [{ y: 20 * Math.log10(G) }],
        markers: [{ x: bw, y: 20 * Math.log10(G) - 3.01, color: '--s1' }],
        tip: (i) => 'f = ' + fmtSI(fs[i], 'Hz', 3) + '<br>วงเปิด ' + open[i].toFixed(1) + ' dB<br>วงปิด ' + acl[i].toFixed(1) + ' dB' });
      $('gb-leg').innerHTML = '<span><i style="background:var(--s2)"></i>อัตราขยายวงเปิด A(jω) (A₀ = 100 dB)</span><span><i style="background:var(--s1)"></i>อัตราขยายวงปิดแบบไม่กลับเฟส</span>';
    };
    [gb, gn, sr, vp].forEach((s) => s.oninput = up); up(); return up;
  }

  /* ---------- 4) Sallen–Key designer ---------- */
  const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
  const nearE12 = (x) => { const e = Math.floor(Math.log10(x)); let best = 0, bd = Infinity; for (const m of E12.concat([10])) { const v = m * Math.pow(10, e); const d = Math.abs(Math.log(v / x)); if (d < bd) { bd = d; best = v; } } return best; };
  function skResp(R, C1, C2, f) { const w = 2 * Math.PI * f; const re = 1 - w * w * R * R * C1 * C2, im = w * C2 * 2 * R; return 1 / Math.hypot(re, im); }
  function initFlt() {
    const fc = $('fl-f'), q = $('fl-q'), r = $('fl-r'); let cur = null;
    const up = () => {
      const f0 = Math.pow(10, +fc.value), Q = Math.pow(10, +q.value), R = Math.pow(10, +r.value), w0 = 2 * Math.PI * f0;
      $('fl-fo').textContent = fmtSI(f0, 'Hz', 3); $('fl-qo').textContent = fmt(Q, 3); $('fl-ro').textContent = fmtSI(R, 'Ω');
      const C1 = 2 * Q / (w0 * R), C2 = 1 / (2 * Q * w0 * R); const c1 = nearE12(C1 * 1e9) * 1e-9, c2 = nearE12(C2 * 1e9) * 1e-9;
      // values below 1 nF or above 10 µF: still E12 mantissa, just note
      const fn = 1 / (2 * Math.PI * R * Math.sqrt(c1 * c2)), Qn = 0.5 * Math.sqrt(c1 / c2);
      $('fl-c1').textContent = fmtSI(C1, 'F', 4); $('fl-c2').textContent = fmtSI(C2, 'F', 4); $('fl-c1e').textContent = fmtSI(c1, 'F', 3); $('fl-c2e').textContent = fmtSI(c2, 'F', 3);
      $('fl-fn').textContent = fmtSI(fn, 'Hz', 4) + ' · Q = ' + fmt(Qn, 3);
      $('fl-kind').textContent = Math.abs(Q - Math.SQRT1_2) < 0.03 ? 'Butterworth (แบนที่สุดในแถบผ่าน)' : Math.abs(Q - 0.5774) < 0.03 ? 'Bessel (หน่วงเวลาเรียบ)' : Q < Math.SQRT1_2 ? 'หน่วงมาก ไม่มียอด' : 'มียอดที่ ' + (20 * Math.log10(Q / Math.sqrt(1 - 1 / (4 * Q * Q)) * 1)).toFixed(1) + ' dB ใกล้ f₀ (แบบ Chebyshev)';
      const fs = logSpace(f0 / 30, f0 * 30, 160);
      const ideal = fs.map((f) => { const x = f / f0; const re = 1 - x * x, im = x / Q; return 20 * Math.log10(1 / Math.hypot(re, im)); });
      const real = fs.map((f) => 20 * Math.log10(skResp(R, c1, c2, f)));
      linePlot($('fl-plot'), $('fl-tip'), { x0: fs[0], x1: fs[fs.length - 1], xLog: true, y0: -60, y1: 20, xTicks: decTicks(fs[0], fs[fs.length - 1]), yTicks: [-60, -40, -20, 0, 20], xFmt: (x) => fmtSI(x, 'Hz', 1).replace(' ', ''), yFmt: (y) => y + ' dB',
        series: [{ xs: fs, ys: ideal, color: '--s3', dash: [5, 4], w: 1.6 }, { xs: fs, ys: real, color: '--s1' }], vlines: [{ x: f0, label: 'f₀' }], hlines: [{ y: -3.01 }],
        tip: (i) => 'f = ' + fmtSI(fs[i], 'Hz', 3) + '<br>ออกแบบ ' + ideal[i].toFixed(2) + ' dB<br>E12 จริง ' + real[i].toFixed(2) + ' dB' });
      cur = { R, c1, c2, f0 };
    };
    $('fl-open').onclick = () => { if (!cur) return; LAB.open(P.sallen({ r1: cur.R, r2: cur.R, c1: cur.c1, c2: cur.c2, f: cur.f0 / 2 }), { mode: 'ac', fmin: cur.f0 / 30, fmax: cur.f0 * 30 }); };
    [fc, q, r].forEach((s) => s.oninput = up); up(); return up;
  }

  /* ---------- 5) analog-computer scaling ---------- */
  function initAcomp() {
    const w0 = $('ac-w'), z = $('ac-z'), b = $('ac-b'), cc = $('ac-c'); let cur = null;
    const up = () => {
      const W = Math.pow(10, +w0.value), Z = +z.value, B = Math.pow(10, +b.value), C = +cc.value * 1e-9;
      $('ac-wo').textContent = fmt(W, 3) + ' rad/s'; $('ac-zo').textContent = Z.toFixed(2); $('ac-bo').textContent = '×' + fmt(B, 3); $('ac-co').textContent = fmtSI(C, 'F', 3);
      const Wm = W * B; const R = 1 / (Wm * C), Q = 1 / (2 * Z), Rq = Q * R;
      $('ac-wm').textContent = fmt(Wm, 4) + ' rad/s (' + fmtSI(Wm / 2 / Math.PI, 'Hz', 3) + ')'; $('ac-r').textContent = fmtSI(R, 'Ω', 4); $('ac-rq').textContent = Z >= 1000 ? 'ไม่ต้องมี' : fmtSI(Rq, 'Ω', 4);
      const os = Z < 1 ? 100 * Math.exp(-Math.PI * Z / Math.sqrt(1 - Z * Z)) : 0; const tp = Z < 1 ? Math.PI / (W * Math.sqrt(1 - Z * Z)) : null;
      $('ac-os').textContent = fmt(os, 3) + ' %'; $('ac-tp').textContent = tp ? fmtSI(tp, 's', 3) + ' จริง → ' + fmtSI(tp / B, 's', 3) + ' บนเครื่อง' : 'ไม่มี';
      const bad = R < 1e3 || R > 1e6;
      $('ac-warn').innerHTML = bad ? '<span class="pill warn">ปรับ C หรือ ×เวลา</span> R = ' + fmtSI(R, 'Ω', 3) + ' อยู่นอกช่วงปฏิบัติ 1 kΩ – 1 MΩ' : '<span class="pill ok">R อยู่ในช่วงปฏิบัติ</span> เลือกค่าใกล้เคียงอนุกรม E24 แล้วเปิดในแล็บเพื่อตรวจ';
      cur = { R, C, Rq, Wm, Z };
    };
    $('ac-open').onclick = () => { if (!cur) return; const { R, C, Rq, Wm, Z } = cur; const tEnd = Z < 1 ? Math.min(6 / (Z * Wm), 14 * Math.PI / Wm) : 8 / Wm; LAB.open(P.tow({ r: R, c: C, rq: Rq, w: 'step', amp: 1 }), { mode: 'tran', tEnd }); };
    [w0, z, b, cc].forEach((s) => s.oninput = up); up();
  }

  /* ---------- 6) transfer-function explorer ---------- */
  const polyEv = (c, s) => { let r = [0, 0]; for (const a of c) { r = [r[0] * s[0] - r[1] * s[1] + a, r[0] * s[1] + r[1] * s[0]]; } return r; }; // descending coefficients
  const cdivv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  function stepResp(num, den, tEnd, n = 600) {
    // controllable canonical state space on descending coefficients, RK4
    const a0 = den[0]; const d = den.map((v) => v / a0); const nn = num.map((v) => v / a0); const N = d.length - 1;
    if (N < 1) return { t: [0, tEnd], y: [nn[nn.length - 1] / d[0], nn[nn.length - 1] / d[0]] };
    const nz = new Array(N + 1).fill(0); nn.forEach((v, i) => { nz[N - (nn.length - 1 - i)] = v; });
    const Dd = nz[0]; const cvec = []; for (let i = 1; i <= N; i++) cvec.push(nz[i] - Dd * d[i]);
    const x = new Array(N).fill(0); const t = [], y = []; const h = tEnd / n;
    const f = (xx) => { const o = new Array(N).fill(0); for (let i = 0; i < N - 1; i++) o[i] = xx[i + 1]; let s = 1; for (let i = 0; i < N; i++) s -= d[N - i] * xx[i]; o[N - 1] = s; return o; };
    const out = (xx) => { let s = Dd; for (let i = 0; i < N; i++) s += cvec[N - 1 - i] * xx[i]; return s; };
    // state ordering: x[0] = y-like; output uses reversed coefficients
    for (let k = 0; k <= n; k++) {
      t.push(k * h); y.push(out(x));
      const k1 = f(x), k2 = f(x.map((v, i) => v + h / 2 * k1[i])), k3 = f(x.map((v, i) => v + h / 2 * k2[i])), k4 = f(x.map((v, i) => v + h * k3[i]));
      for (let i = 0; i < N; i++) x[i] += h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    }
    return { t, y };
  }
  const parseCoef = (s) => s.trim().split(/[\s,;]+/).filter(Boolean).map((v) => OAE.parseSI(v.replace(/e\+?/i, 'e'))).map((v, i, a) => (isFinite(v) ? v : NaN));
  function initTfx() {
    const nI = $('tx-n'), dI = $('tx-d'); let cur = null;
    const PR = { lp1: ['10000', '1 10000'], lp2: ['39.48e6', '1 8886 39.48e6'], bp: ['1257 0', '1 1257 39.48e6'], hp2: ['1 0 0', '1 8886 39.48e6'], notch: ['1 0 39.48e6', '1 1257 39.48e6'], int: ['-1000', '1 0'], pi: ['-2 -1000', '1 0'], unst: ['1', '1 -100'] };
    document.querySelectorAll('#tx-pre button').forEach((b) => b.onclick = () => { const p = PR[b.dataset.k]; nI.value = p[0]; dI.value = p[1]; document.querySelectorAll('#tx-pre button').forEach((q) => q.classList.toggle('on', q === b)); up(); });
    const up = () => {
      let num = parseCoef(nI.value), den = parseCoef(dI.value);
      const bad = !num.length || !den.length || num.some((v) => !isFinite(v)) || den.some((v) => !isFinite(v)) || den.every((v) => v === 0) || num.length > den.length;
      if (bad) { $('tx-msg').innerHTML = '<span class="pill bad">อ่านสัมประสิทธิ์ไม่ได้</span> พิมพ์เรียงจากกำลังสูงไปต่ำ เช่น <code>1 8886 39.48e6</code> และตัวเศษต้องมีอันดับไม่เกินตัวส่วน'; return; }
      while (den[0] === 0 && den.length > 1) den.shift(); while (num.length > 1 && num[0] === 0) num.shift();
      const rev = (c) => c.slice().reverse();
      const zr = OAE.polyRoots(rev(num)).map((r) => r), pl = OAE.polyRoots(rev(den));
      const stable = pl.every((p) => p[0] < -1e-9 * Math.max(1, Math.hypot(...p))); const marg = !stable && pl.every((p) => p[0] <= 1e-9 * Math.max(1, Math.hypot(...p)));
      $('tx-msg').innerHTML = '<span class="pill ' + (stable ? 'ok' : marg ? 'warn' : 'bad') + '">' + (stable ? 'เสถียร' : marg ? 'เสถียรแบบขอบ / มีขั้วที่ 0' : 'ไม่เสถียร') + '</span> ' + tex('H(s) = \\dfrac{' + OAE.polyTeX(rev(num), 4, 1e3) + '}{' + OAE.polyTeX(rev(den), 4, 1e3) + '}');
      const rs = pl.concat(zr).map((r) => Math.hypot(r[0], r[1])).filter((v) => v > 1e-9); const wref = rs.length ? Math.exp(rs.reduce((a, v) => a + Math.log(v), 0) / rs.length) : 1000;
      const fs = logSpace(wref / 2 / Math.PI / 100, wref / 2 / Math.PI * 100, 240);
      const Hs = fs.map((f) => cdivv(polyEv(num, [0, 2 * Math.PI * f]), polyEv(den, [0, 2 * Math.PI * f])));
      const db = Hs.map((h) => 20 * Math.log10(Math.max(Math.hypot(h[0], h[1]), 1e-12))); let ph = []; let pv = null; Hs.forEach((h) => { let p = Math.atan2(h[1], h[0]) * 180 / Math.PI; if (pv !== null) { while (p - pv > 180) p -= 360; while (p - pv < -180) p += 360; } pv = p; ph.push(p); });
      const hi = Math.ceil((Math.max(...db) + 5) / 20) * 20, lo = hi - 100;
      linePlot($('tx-mag'), $('tx-tip1'), { x0: fs[0], x1: fs[fs.length - 1], xLog: true, y0: lo, y1: hi, xTicks: decTicks(fs[0], fs[fs.length - 1]), yTicks: lin(lo, hi, 5), xFmt: (x) => fmtSI(x, 'Hz', 1).replace(' ', ''), yFmt: (y) => Math.round(y) + ' dB',
        series: [{ xs: fs, ys: db, color: '--s1' }], vlines: pl.concat(zr).filter((r) => r[1] >= 0 && Math.hypot(...r) > 1e-9).map((r) => ({ x: Math.hypot(...r) / 2 / Math.PI })), tip: (i) => 'f = ' + fmtSI(fs[i], 'Hz', 3) + '<br>|H| = ' + db[i].toFixed(2) + ' dB<br>∠H = ' + ph[i].toFixed(1) + '°' });
      const pmin = Math.floor(Math.min(...ph) / 45) * 45, pmax = Math.ceil(Math.max(...ph) / 45) * 45;
      linePlot($('tx-ph'), $('tx-tip2'), { x0: fs[0], x1: fs[fs.length - 1], xLog: true, y0: pmin - (pmax === pmin ? 45 : 0), y1: pmax, xTicks: decTicks(fs[0], fs[fs.length - 1]), yTicks: lin(pmin, pmax, Math.max(1, Math.round((pmax - pmin) / 45))), xFmt: (x) => fmtSI(x, 'Hz', 1).replace(' ', ''), yFmt: (y) => Math.round(y) + '°',
        series: [{ xs: fs, ys: ph, color: '--s2' }], tip: (i) => 'f = ' + fmtSI(fs[i], 'Hz', 3) + '<br>∠H = ' + ph[i].toFixed(1) + '°' });
      // step response horizon: slowest stable pole, else 10 / fastest
      const re = pl.map((p) => Math.abs(p[0])).filter((v) => v > 1e-9 * wref); let tEnd = re.length ? 6 / Math.min(...re) : 8 / wref; const wd = pl.map((p) => Math.abs(p[1])).filter((v) => v > 1e-9); if (wd.length) tEnd = Math.min(tEnd, 14 * Math.PI / Math.min(...wd) * 1); if (!stable) tEnd = Math.min(tEnd, 12 / wref); if (!isFinite(tEnd) || tEnd <= 0) tEnd = 8 / wref;
      const sr = stepResp(num, den, tEnd); const ymax = Math.max(...sr.y.map(Math.abs), 1e-9);
      const lim = Math.max(...sr.y, 0), limn = Math.min(...sr.y, 0); const span = (lim - limn) || 1; const y1 = lim + 0.1 * span, y0 = limn - 0.1 * span;
      linePlot($('tx-step'), $('tx-tip3'), { x0: 0, x1: tEnd, y0: y0, y1: y1, xTicks: lin(0, tEnd, 5), yTicks: lin(y0, y1, 4), xFmt: (x) => fmtSI(x, 's', 2).replace(' ', ''), yFmt: (y) => fmt(y, 3),
        series: [{ xs: sr.t, ys: sr.y, color: '--s3' }], tip: (i) => 't = ' + fmtSI(sr.t[i], 's', 3) + '<br>y = ' + fmt(sr.y[i], 4) });
      const dc = Math.abs(den[den.length - 1]) > 1e-12 * Math.max(...den.map(Math.abs)) ? num[num.length - 1] / den[den.length - 1] : Infinity;
      const row = (arr, s) => arr.map((r) => '<tr><td>' + s + '</td><td class="dc-num">' + fmtSI(r[0], '', 4) + (r[1] ? (r[1] > 0 ? ' + j' : ' − j') + fmtSI(Math.abs(r[1]), '', 4) : '') + '</td><td class="dc-num">' + (Math.hypot(...r) < 1e-9 ? '0' : fmtSI(Math.hypot(...r) / 2 / Math.PI, 'Hz', 4)) + '</td></tr>').join('');
      $('tx-pz').innerHTML = '<div class="dc-readout"><div><small>อัตราขยาย DC H(0)</small><b>' + (isFinite(dc) ? fmt(dc, 4) + ' (' + (dc ? (20 * Math.log10(Math.abs(dc))).toFixed(1) : '−∞') + ' dB)' : '∞ (มีอินทิเกรเตอร์)') + '</b></div><div><small>อันดับระบบ</small><b>' + pl.length + '</b></div><div><small>ค่าสุดท้ายของสเต็ป</small><b>' + (stable ? fmt(dc, 4) : 'ไม่ลู่เข้า') + '</b></div></div><div class="dc-tbl-wrap"><table class="dc-tbl"><thead><tr><th></th><th class="dc-num">s (rad/s)</th><th class="dc-num">|s|/2π</th></tr></thead><tbody>' + row(pl, 'ขั้ว ×') + row(zr, 'ศูนย์ ○') + '</tbody></table></div>';
      cur = { num, den, pl };
    };
    [nI, dI].forEach((i) => i.oninput = () => { document.querySelectorAll('#tx-pre button').forEach((q) => q.classList.remove('on')); up(); });
    $('tx-real').onclick = () => {
      if (!cur) return; const { num, den } = cur; const a = den.map((v) => v / den[0]);
      if (den.length === 3 && num.length === 1 && a[2] > 0 && a[1] > 0) { const w0 = Math.sqrt(a[2]), Q = w0 / a[1]; const R = 10e3; const C1 = 2 * Q / (w0 * R), C2 = 1 / (2 * Q * w0 * R); const K = num[0] / a[2]; if (Math.abs(K - 1) < 1e-6) { LAB.open(P.sallen({ r1: R, r2: R, c1: C1, c2: C2, f: w0 / 2 / Math.PI / 2 }), { mode: 'ac', fmin: w0 / 2 / Math.PI / 30, fmax: w0 / 2 / Math.PI * 30 }); return; } }
      if (den.length === 2 && num.length === 1 && a[1] > 0) { const wc = a[1]; const K = Math.abs(num[0] / a[1]); const Rf = 10e3, Rin = Rf / K, Cf = 1 / (wc * Rf); LAB.open(P.lpf1({ rin: Rin, rf: Rf, cf: Cf, f: wc / 2 / Math.PI / 2 }), { mode: 'ac', fmin: wc / 2 / Math.PI / 100, fmax: wc / 2 / Math.PI * 100 }); return; }
      $('tx-msg').insertAdjacentHTML('beforeend', '<br><span class="pill warn">สร้างอัตโนมัติไม่ได้</span> ปุ่มนี้สร้างให้เฉพาะ H(s) แบบผ่านต่ำอันดับ 1 (ตัวเศษคงที่) และอันดับ 2 แบบอัตราขยาย 1 ที่ขั้วเป็นค่าเชิงซ้อน/เสถียร ใช้แบบอื่นด้วยการต่อเองในแล็บ');
    };
    document.querySelector('#tx-pre button[data-k=lp2]').click(); return up;
  }

  const redrawers = [];
  function init() {
    redrawers.push(initVtc(), initGbw(), initFlt()); initAmp(); initAcomp(); redrawers.push(initTfx());
    drawFigures();
    let rt = null; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { drawFigures(); redrawers.forEach((f) => f && f()); }, 150); });
    const retheme = () => { OAR.readColors(); drawFigures(); redrawers.forEach((f) => f && f()); window.dispatchEvent(new Event('dc-redraw')); };
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', retheme);
    new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('dc-redraw', drawFigures);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { drawFigures(); window.dispatchEvent(new Event('dc-redraw')); });
  }
  function addFig(k, f) { FIGS[k] = f; }
  return { init, math, linePlot, fmt, addFig, drawFigures };
})();

/* ===== Problem bank + unlimited practice ===== */
const PB = (() => {
  const { fmtSI } = OAE; const P = OK.P; const $ = (id) => document.getElementById(id); const R = String.raw;
  const LV = { 1: ['พื้นฐาน', '#7a4a26'], 2: ['มหาวิทยาลัย', '#c62828'], 3: ['ระดับประเทศ', '#ef6c00'], 4: ['ระดับโลก', '#f5c400'] };
  const badge = (l) => '<span class="lvl"><svg viewBox="0 0 34 12" aria-hidden="true"><line x1="0" y1="6" x2="34" y2="6" stroke="var(--ink-3)" stroke-width="1.5"/><rect x="6" y="1" width="22" height="10" rx="4" fill="#d9c29b" stroke="#a38a5f" stroke-width=".8"/><rect x="11" y="1" width="4" height="10" fill="' + LV[l][1] + '"/><rect x="19" y="1" width="3" height="10" fill="#c9a227"/></svg>ระดับ ' + l + ' · ' + LV[l][0] + '</span>';
  const n4 = (x) => Number((+x).toPrecision(4)).toString();
  const tfOf = (c, lab) => { const o = c.find((q) => q.lab === lab); return OAE.transferFunctions(c, o.id).tfs; };
  const ACC = (c, lab, f) => { const t = tfOf(c, lab)[0]; return OAE.evalTF(t, f); };

  const LIST = [
    { id: 'p1', l: 1, topic: 'กฎทอง', title: 'วงจรกลับเฟสพื้นฐาน', fig: () => P.inverting({ rin: 2.2e3, rf: 22e3, w: 'dc', amp: 0.25 }),
      q: R`ในวงจรนี้ \(R_{in} = 2.2\ \text{k}\Omega\), \(R_f = 22\ \text{k}\Omega\), \(V_{in} = +0.25\ \text{V}\) (ออปแอมป์อุดมคติ ไม่อิ่มตัว) จงหาอัตราขยายและแรงดันเอาต์พุต`,
      ans: [{ t: R`\(A_v\)`, u: 'เท่า', v: -10 }, { t: R`\(V_o\)`, u: 'V', v: -2.5 }], hint: 'v₋ = 0 (ลัดเสมือน) จึงได้กระแส v_in/R_in ไหลผ่าน R_f ทั้งหมด',
      sol: R`<p>\(i = V_{in}/R_{in}\) และ \(V_o = -R_f i\) ได้ \(A_v = -R_f/R_{in} = -22/2.2 = -10\) และ \(V_o = -10(0.25) = -2.5\ \text{V}\)</p>`, lab: 'inverting' },
    { id: 'p2', l: 1, topic: 'ไม่กลับเฟส', title: 'อัตราขยายแบบไม่กลับเฟส', fig: () => P.noninverting({ rg: 1e3, rf: 4.7e3, w: 'dc', amp: 0.5 }),
      q: R`วงจรไม่กลับเฟส \(R_g = 1\ \text{k}\Omega\), \(R_f = 4.7\ \text{k}\Omega\) รับ \(V_{in} = 0.5\ \text{V}\) จงหา \(V_o\) และกระแสที่ไหลใน \(R_g\)`,
      ans: [{ t: R`\(V_o\)`, u: 'V', v: 2.85 }, { t: R`\(I_{Rg}\)`, u: 'mA', v: 0.5 }], hint: 'v₋ = V_in จึงมีกระแส V_in/R_g ไหลใน R_g และต่อเนื่องเข้า R_f',
      sol: R`<p>\(V_o = V_{in}(1 + R_f/R_g) = 0.5(1+4.7) = 2.85\ \text{V}\) และ \(I = V_{in}/R_g = 0.5\ \text{mA}\)</p>`, lab: 'noninverting' },
    { id: 'p3', l: 1, topic: 'วงจรบวก', title: 'บวกสามสัญญาณ', fig: () => P.summer({ r1: 10e3, r2: 20e3, rf: 20e3 }),
      q: R`วงจรบวกแบบกลับเฟส \(R_f = 20\ \text{k}\Omega\) รับ \(V_1 = 2\ \text{V}\) ผ่าน \(10\ \text{k}\Omega\), \(V_2 = -1\ \text{V}\) ผ่าน \(20\ \text{k}\Omega\) และ \(V_3 = 0.5\ \text{V}\) ผ่าน \(5\ \text{k}\Omega\) จงหา \(V_o\)`,
      ans: [{ t: R`\(V_o\)`, u: 'V', v: -5 }], hint: 'V_o = −R_f(V₁/R₁ + V₂/R₂ + V₃/R₃) ทุกอินพุตเห็นโหนดที่ 0 V',
      sol: R`<p>\(V_o = -20\left(\dfrac{2}{10}+\dfrac{-1}{20}+\dfrac{0.5}{5}\right) = -(4 - 1 + 2) = -5\ \text{V}\)</p>` },
    { id: 'p4', l: 2, topic: 'ลบสัญญาณ', title: 'ขยายผลต่างด้วยออปแอมป์ตัวเดียว', fig: () => P.diffamp({ r1: 10e3, r3: 10e3, rf: 47e3, r4: 47e3 }),
      q: R`วงจรขยายผลต่าง \(R_1 = R_3 = 10\ \text{k}\Omega\), \(R_f = R_4 = 47\ \text{k}\Omega\) ถ้า \(V_1 = 1.2\ \text{V}\) และ \(V_2 = 1.5\ \text{V}\) จงหาอัตราขยายผลต่างและ \(V_o\)`,
      ans: [{ t: R`\(A_d\)`, u: 'เท่า', v: 4.7 }, { t: R`\(V_o\)`, u: 'V', v: 1.41 }], hint: 'เมื่อ R₄/R₃ = R_f/R₁ จะได้ V_o = (R_f/R₁)(V₂ − V₁)',
      sol: R`<p>\(A_d = R_f/R_1 = 4.7\) และ \(V_o = 4.7(1.5 - 1.2) = 1.41\ \text{V}\) ตรวจในแล็บ: แท็บ H(s) ให้ −4.7 สำหรับ \(V_1\) และ +4.7 สำหรับ \(V_2\)</p>`, lab: 'diffamp' },
    { id: 'p5', l: 2, topic: 'อินทิเกรเตอร์', title: 'เวลาที่อินทิเกรเตอร์ใช้ไปถึงแรงดันเป้าหมาย', fig: () => P.integrator({ rin: 20e3, cf: 50e-9, w: 'step', amp: 0.5 }),
      q: R`อินทิเกรเตอร์ \(R = 20\ \text{k}\Omega\), \(C = 50\ \text{nF}\) เริ่มจาก \(v_C(0) = 0\) รับสเต็ป \(+0.5\ \text{V}\) ที่ \(t = 0\) จงหาความชันของ \(V_o\) และเวลาที่ \(V_o\) ถึง \(-5\ \text{V}\)`,
      ans: [{ t: R`\(dV_o/dt\)`, u: 'V/s', v: -500 }, { t: R`\(t\)`, u: 'ms', v: 10 }], hint: 'V_o(t) = −(1/RC)∫v_in dt และ RC = 1 ms',
      sol: R`<p>\(RC = 20\text{k}\cdot50\text{n} = 1\ \text{ms}\) ความชัน \(= -V_{in}/RC = -500\ \text{V/s}\) ถึง \(-5\ \text{V}\) ที่ \(t = 5/500 = 10\ \text{ms}\) (ต้องไม่เกินแรงดันแหล่งจ่ายของออปแอมป์)</p>`, lab: 'integrator' },
    { id: 'p6', l: 2, topic: 'H(s)', title: 'ตัวกรองผ่านต่ำแบบแอคทีฟ', fig: () => P.lpf1({ rin: 4.7e3, rf: 47e3, cf: 3.3e-9 }),
      q: R`วงจรกลับเฟสที่ \(R_f\) ขนานกับ \(C_f\): \(R_{in} = 4.7\ \text{k}\Omega\), \(R_f = 47\ \text{k}\Omega\), \(C_f = 3.3\ \text{nF}\) จงหาอัตราขยาย DC (ตัวเลขพร้อมเครื่องหมาย) และความถี่ตัด −3 dB`,
      ans: [{ t: R`\(H(0)\)`, u: 'เท่า', v: -10 }, { t: R`\(f_c\)`, u: 'Hz', v: 1026.1 }], hint: 'H(s) = −(R_f/R_in)/(1 + sR_fC_f) ที่ DC ตัวเก็บประจุเปิดวงจร',
      sol: R`<p>\(H(s) = -\dfrac{R_f/R_{in}}{1 + sR_fC_f}\) ได้ \(H(0) = -10\) และ \(f_c = \dfrac{1}{2\pi R_fC_f} = \dfrac{1}{2\pi(47\text{k})(3.3\text{n})} = 1026\ \text{Hz}\)</p><p>แท็บ H(s) ในแล็บแสดง \(H(s) = -6.447\times10^{4}/(s + 6447)\) และ f<sub>−3dB</sub> = 1026 Hz</p>`, lab: 'lpf1' },
    { id: 'p7', l: 2, topic: 'GBW', title: 'แบนด์วิดท์วงปิดจาก GBW', fig: () => P.noninverting({ m: 'tl072', rg: 1e3, rf: 29e3 }),
      q: R`ใช้ TL072 (GBW ≈ 3 MHz) ต่อแบบไม่กลับเฟสเกน 30 เท่า \(R_g = 1\ \text{k}\Omega\), \(R_f = 29\ \text{k}\Omega\) จงหาแบนด์วิดท์ −3 dB และเวลาขึ้น 10–90%`,
      ans: [{ t: R`\(f_{-3dB}\)`, u: 'kHz', v: 100 }, { t: R`\(t_r\)`, u: 'µs', v: 3.5 }], hint: 'f₋₃dB ≈ GBW/(1 + R_f/R_g) และ t_r ≈ 0.35/f₋₃dB',
      sol: R`<p>\(f_{-3dB} \approx \dfrac{3\text{ MHz}}{30} = 100\ \text{kHz}\) \(t_r \approx 0.35/10^5 = 3.5\ \mu\text{s}\) เปิดพรีเซต GBW ในแล็บแล้วเปลี่ยนรุ่นเป็น TL072 เพื่อเห็น −3 dB ใกล้ 100 kHz</p>`, lab: 'gbw' },
    { id: 'p8', l: 3, topic: 'Slew rate', title: 'ความถี่สูงสุดของสัญญาณใหญ่', fig: () => P.follower({ m: 'tl072', amp: 8, f: 200e3 }),
      q: R`บัฟเฟอร์ TL072 (slew rate \(13\ \text{V}/\mu\text{s}\)) ต้องส่งไซน์แอมพลิจูด \(8\ \text{V}\) โดยไม่เพี้ยน จงหาความถี่สูงสุด (full-power bandwidth) และความชันสูงสุดของสัญญาณที่ 100 kHz`,
      ans: [{ t: R`\(f_{max}\)`, u: 'kHz', v: 258.6 }, { t: R`\(\max|dv/dt|\)`, u: 'V/µs', v: 5.027 }], hint: 'v = V_p sin(2πft) มี |dv/dt| สูงสุด = 2πfV_p ต้องไม่เกิน SR',
      sol: R`<p>\(f_{max} = \dfrac{SR}{2\pi V_p} = \dfrac{13\times10^{6}}{2\pi(8)} = 258.6\ \text{kHz}\) ที่ 100 kHz \(2\pi f V_p = 2\pi(10^5)(8) = 5.03\ \text{V}/\mu\text{s}\) ยังต่ำกว่า SR</p>`, lab: 'slew' },
    { id: 'p9', l: 3, topic: 'Sallen–Key', title: 'อ่าน f₀ และ Q ของ Sallen–Key', fig: () => P.sallen({ r1: 10e3, r2: 10e3, c1: 47e-9, c2: 22e-9 }),
      q: R`Sallen–Key ผ่านต่ำอัตราขยาย 1: \(R_1 = R_2 = 10\ \text{k}\Omega\), \(C_1 = 47\ \text{nF}\) (ตัวที่ป้อนกลับ) และ \(C_2 = 22\ \text{nF}\) (ลงกราวด์) จงหาความถี่ธรรมชาติ \(f_0\) และ \(Q\)`,
      ans: [{ t: R`\(f_0\)`, u: 'Hz', v: 494.9 }, { t: R`\(Q\)`, u: '', v: 0.7308 }], hint: 'ω₀ = 1/(R√(C₁C₂)) และ Q = ½√(C₁/C₂) เมื่อ R เท่ากัน',
      sol: R`<p>\(\sqrt{C_1C_2} = \sqrt{47\cdot22}\ \text{nF} = 32.16\ \text{nF}\) \(f_0 = \dfrac{1}{2\pi(10\text{k})(32.16\text{n})} = 494.9\ \text{Hz}\) และ \(Q = \tfrac12\sqrt{47/22} = 0.731\) (ยอดเล็กน้อยกว่า Butterworth 0.707)</p>`, lab: () => P.sallen({ r1: 10e3, r2: 10e3, c1: 47e-9, c2: 22e-9 }), labMode: 'ac' },
    { id: 'p10', l: 3, topic: 'Tow–Thomas', title: 'ไบควอดสามออปแอมป์', fig: () => P.tow({ r: 10e3, c: 47e-9, rq: 33e3 }),
      q: R`วงจรอนาล็อกคอมพิวเตอร์แบบ Tow–Thomas ใช้ \(R = 10\ \text{k}\Omega\) ทุกตัว \(C = 47\ \text{nF}\) ทั้งสองตัวและ \(R_q = 33\ \text{k}\Omega\) จงหาความถี่ธรรมชาติ \(f_0\) และ \(Q = R_q/R\)`,
      ans: [{ t: R`\(f_0\)`, u: 'Hz', v: 338.6 }, { t: R`\(Q\)`, u: '', v: 3.3 }], hint: 'ω₀ = 1/(RC) และ Q = R_q/R ตรวจด้วยแท็บ H(s) ที่เอาต์พุต Vb',
      sol: R`<p>\(\omega_0 = \dfrac{1}{RC} = \dfrac{1}{10^4\cdot47\times10^{-9}} = 2128\ \text{rad/s}\) \(f_0 = 338.6\ \text{Hz}\) \(Q = 33/10 = 3.3\) ฟังก์ชันถ่ายโอนที่ Vb คือ \(+\omega_0^2/(s^2 + (\omega_0/Q)s + \omega_0^2)\) และ Vc เป็นค่าลบของมัน</p>`, lab: () => P.tow({ r: 10e3, c: 47e-9, rq: 33e3 }) },
    { id: 'p11', l: 3, topic: 'Schmitt', title: 'เกณฑ์สวิตช์ของ Schmitt trigger', fig: () => P.schmitt({ r1: 47e3, r2: 10e3, m: 'ideal' }),
      q: R`Schmitt trigger แบบกลับเฟส \(R_1 = 47\ \text{k}\Omega\) (จากเอาต์พุต) และ \(R_2 = 10\ \text{k}\Omega\) (ลงกราวด์) ที่ขั้ว + เอาต์พุตอิ่มตัวที่ \(\pm13\ \text{V}\) จงหาเกณฑ์บน \(V_{UTP}\) และความกว้างของฮิสเทอรีซิส`,
      ans: [{ t: R`\(V_{UTP}\)`, u: 'V', v: 2.2807 }, { t: R`\(V_H\)`, u: 'V', v: 4.5614 }], hint: 'v₊ = V_sat·R₂/(R₁+R₂) เมื่อเอาต์พุตอยู่ที่ขอบบน และ V_H = V_UTP − V_LTP',
      sol: R`<p>\(\beta = \dfrac{R_2}{R_1+R_2} = \dfrac{10}{57} = 0.1754\) \(V_{UTP} = 13\beta = 2.281\ \text{V}\) \(V_{LTP} = -2.281\ \text{V}\) \(V_H = 4.561\ \text{V}\)</p>`, lab: () => P.schmitt({ r1: 47e3, r2: 10e3, m: 'ideal', amp: 4 }) },
    { id: 'p12', l: 4, topic: 'อนาล็อกคอมพิวเตอร์', title: 'สเกลเวลาให้สมการเชิงอนุพันธ์', fig: () => P.tow({ r: 10e3, c: 100e-9, rq: 16.67e3 }),
      q: R`ต้องการแก้ \(\ddot{x} + 6\dot{x} + 100x = 100u\) บนวงจร Tow–Thomas ให้เร็วขึ้น \(\beta = 100\) เท่า ใช้ \(C = 100\ \text{nF}\) จงหา \(R\) (สำหรับ R ทุกตัวยกเว้น \(R_q\)) และ \(R_q\)`,
      ans: [{ t: R`\(R\)`, u: 'kΩ', v: 10 }, { t: R`\(R_q\)`, u: 'kΩ', v: 16.667 }], hint: 'หา ω₀ และ ζ ก่อน ω_เครื่อง = βω₀ แล้ว R = 1/(ω_เครื่อง C) และ R_q = Q·R = R/(2ζ)',
      sol: R`<p>\(\omega_0 = 10\ \text{rad/s}\) และ \(2\zeta\omega_0 = 6\) ได้ \(\zeta = 0.3\), \(Q = 1/(2\zeta) = 1.667\) เครื่องเร็วขึ้น 100 เท่า: \(\omega_m = 1000\ \text{rad/s}\) \(R = 1/(\omega_m C) = 1/(10^3\cdot10^{-7}) = 10\ \text{k}\Omega\) \(R_q = QR = 16.67\ \text{k}\Omega\)</p><p>เวลาบนเครื่องสั้นลง 100 เท่า: ยอดแรกของสเต็ปที่ \(t_p = \pi/(\omega_0\sqrt{1-\zeta^2}) = 0.329\ \text{s}\) จริง = 3.29 ms บนเครื่อง และ overshoot \(= e^{-\pi\zeta/\sqrt{1-\zeta^2}} = 37\%\)</p>`, lab: () => P.tow({ r: 10e3, c: 100e-9, rq: 16.67e3 }) },
    { id: 'p13', l: 4, topic: 'ขยายสัญญาณเครื่องมือวัด', title: 'ออกแบบอัตราขยายของ Instrumentation amplifier', fig: () => P.inamp({ r1: 24e3, rg: 500, r2: 10e3, r3: 20e3 }),
      q: R`In-amp สามออปแอมป์ \(R_1 = 24\ \text{k}\Omega\) (สองตัว) \(R_g = 500\ \Omega\) ภาคผลต่าง \(R_2 = 10\ \text{k}\Omega\), \(R_3 = 20\ \text{k}\Omega\) จงหาอัตราขยายผลต่างรวม และ \(V_o\) เมื่อ \(V_2 - V_1 = 12\ \text{mV}\) บนแรงดันร่วม \(1\ \text{V}\)`,
      ans: [{ t: R`\(G\)`, u: 'เท่า', v: 194 }, { t: R`\(V_o\)`, u: 'V', v: 2.328 }], hint: 'G = (1 + 2R₁/R_g)(R₃/R₂) และภาคแรกมีอัตราขยายแรงดันร่วม 1',
      sol: R`<p>ภาคแรก \(1 + 2(24\text{k})/500 = 97\) ภาคสอง \(R_3/R_2 = 2\) \(G = 194\) \(V_o = 194(12\ \text{mV}) = 2.328\ \text{V}\) แรงดันร่วม 1 V ถูกลดโดยภาคสองอัตราขยายสมมาตรเมื่อตัวต้านทานตรงกัน</p>`, lab: () => P.inamp({ r1: 24e3, rg: 500, r2: 10e3, r3: 20e3 }) }
  ];

  const KEY = 'oa-prog-v1'; let prog = { solved: {}, best: 0 };
  try { prog = Object.assign(prog, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch (e) { } };
  function renderProgress() {
    const n = LIST.filter((p) => prog.solved[p.id]).length;
    $('prog-pill').innerHTML = 'ทำได้ <b>' + n + '</b> / ' + LIST.length + ' ข้อ';
    $('lvlbars').innerHTML = [1, 2, 3, 4].map((l) => { const all = LIST.filter((p) => p.l === l), d = all.filter((p) => prog.solved[p.id]).length; return '<div class="lvlbar">' + badge(l) + '<div class="dc-mono" style="margin-top:.3rem">' + d + ' / ' + all.length + '</div><div class="bar"><i style="width:' + (all.length ? d / all.length * 100 : 0) + '%"></i></div></div>'; }).join('');
  }
  function parseAns(s) {
    s = String(s).trim().replace(/−/g, '-').replace(/,/g, '.').replace(/\s+/g, '');
    if (!s) return NaN; const m = s.match(/^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\/([-+]?\d*\.?\d+)$/i);
    if (m) return parseFloat(m[1]) / parseFloat(m[2]);
    return /^[-+]?\d*\.?\d+(?:e[-+]?\d+)?$/i.test(s) ? parseFloat(s) : NaN;
  }
  const ok = (x, v, tol = 0.01) => isFinite(x) && (Math.abs(v) < 1e-12 ? Math.abs(x) < 1e-9 : Math.abs(x - v) <= Math.abs(v) * tol + 1e-12);
  function ansRows(prefix, ans) {
    return ans.map((a, i) => '<div class="ans-row"><label for="' + prefix + '-' + i + '">' + a.t + '</label><input id="' + prefix + '-' + i + '" type="text" inputmode="decimal" autocomplete="off" placeholder="ตัวเลข"><span class="u">' + (a.u || '') + '</span><span class="fb" id="' + prefix + '-fb' + i + '" aria-live="polite"></span></div>').join('');
  }
  function check(prefix, ans) {
    let all = true;
    ans.forEach((a, i) => {
      const x = parseAns($(prefix + '-' + i).value); const fb = $(prefix + '-fb' + i); const good = ok(x, a.v, a.tol);
      if (!isFinite(x)) { fb.className = 'fb no'; fb.textContent = 'พิมพ์เป็นตัวเลข เช่น 4.8 หรือ 7/12'; all = false; return; }
      fb.className = 'fb ' + (good ? 'ok' : 'no'); fb.textContent = good ? '✓ ถูกต้อง' : (Math.abs(x - a.v) <= Math.abs(a.v) * 0.1 ? '✗ ใกล้แล้ว ตรวจการปัดเศษหรือหน่วย' : (Math.abs(x + a.v) <= Math.abs(a.v) * 0.01 ? '✗ ตรวจเครื่องหมาย (กลับเฟสหรือไม่)' : '✗ ยังไม่ถูก ลองใช้คำใบ้'));
      if (!good) all = false;
    });
    return all;
  }
  let filter = 0;
  function render() {
    const box = $('pb-list');
    box.innerHTML = LIST.map((p) => {
      const pre = 'a-' + p.id;
      let h = '<article class="prob" id="pb-' + p.id + '" data-l="' + p.l + '"><header>' + badge(p.l) + '<h4>' + p.title + '</h4><span class="topic">' + p.topic + '</span><span class="done"' + (prog.solved[p.id] ? '' : ' hidden') + '>ทำได้แล้ว ✓</span></header>';
      h += '<p>' + p.q + '</p>';
      if (p.fig) h += '<figure class="dc-fig"><canvas data-fig="pb-' + p.id + '"></canvas></figure>';
      h += '<div class="ans">' + ansRows(pre, p.ans) + '</div>';
      h += '<div class="dc-btnrow"><button class="dc-btn pri" data-chk="' + p.id + '">ตรวจคำตอบ</button><button class="dc-btn" data-hint="' + p.id + '" aria-expanded="false">คำใบ้</button>' + (p.lab ? '<button class="dc-btn ghost" data-open="pbl-' + p.id + '" data-mode="' + (p.labMode || 'tran') + '">เปิดในแล็บ</button>' : '') + '</div>';
      h += '<p class="small" id="hint-' + p.id + '" hidden><b class="dc-tag">คำใบ้</b>' + p.hint + '</p>';
      h += '<details class="sol"><summary>เฉลยละเอียด</summary><div>' + p.sol + '</div></details></article>';
      return h;
    }).join('');
    for (const p of LIST) { if (p.fig) UI.addFig('pb-' + p.id, p.fig); if (p.lab) UI.addFig('pbl-' + p.id, typeof p.lab === 'function' ? p.lab : p.fig); }
    box.addEventListener('click', (e) => {
      const c = e.target.closest('[data-chk]'), hb = e.target.closest('[data-hint]');
      if (c) { const p = LIST.find((q) => q.id === c.dataset.chk); if (check('a-' + p.id, p.ans)) { prog.solved[p.id] = true; save(); document.querySelector('#pb-' + p.id + ' .done').hidden = false; renderProgress(); } }
      if (hb) { const el = $('hint-' + hb.dataset.hint); el.hidden = !el.hidden; hb.setAttribute('aria-expanded', String(!el.hidden)); }
    });
    box.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.ans-row input')) e.target.closest('.prob').querySelector('[data-chk]').click(); });
    UI.math(box); UI.drawFigures(); applyFilter();
  }
  function applyFilter() { document.querySelectorAll('#pb-list .prob').forEach((a) => a.hidden = filter && +a.dataset.l !== filter); }
  document.querySelectorAll('#pb-filter button').forEach((b) => b.onclick = () => { filter = +b.dataset.l; document.querySelectorAll('#pb-filter button').forEach((q) => q.classList.toggle('on', q === b)); applyFilter(); });

  /* ---------- unlimited practice (answers come from the lab's own solver) ---------- */
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const RV = [1, 2.2, 4.7, 10, 22, 47, 100];
  const GENS = {
    inv: { name: 'อัตราขยายกลับเฟส', make() {
      const rin = pick(RV) * 1e3, rf = pick(RV) * 1e3, vin = pick([0.1, 0.2, 0.25, 0.5, -0.3, -0.5]); const c = P.inverting({ rin, rf, w: 'dc', amp: vin, rl: null }); const vo = OAE.solveDC(c); const Vo = vo.probe[c.find((q) => q.lab === 'Vo').id]; const sat = Math.abs(Vo) > 15;
      return { fig: () => P.inverting({ rin, rf, w: 'dc', amp: vin, rl: null }), lab: () => P.inverting({ rin, rf, w: 'dc', amp: vin, rl: null }), q: R`ออปแอมป์อุดมคติ แหล่งจ่าย \(\pm15\ \text{V}\) \(R_{in} = ${fmtSI(rin, '').replace(' ', '')}\ \Omega\), \(R_f = ${fmtSI(rf, '').replace(' ', '')}\ \Omega\), \(V_{in} = ${vin}\ \text{V}\) จงหา \(V_o\) (ถ้าเกินแหล่งจ่าย ให้ตอบค่าที่ถูกตัด)`, ans: [{ t: R`\(V_o\)`, u: 'V', v: sat ? 15 * Math.sign(Vo) : -rf / rin * vin }],
        sol: R`<p>\(V_o = -\dfrac{R_f}{R_{in}}V_{in} = -${n4(rf / rin)}(${vin}) = ${n4(-rf / rin * vin)}\ \text{V}\)${sat ? R` ซึ่งเกินแหล่งจ่าย ออปแอมป์อิ่มตัวที่ประมาณ \(\pm15\ \text{V}\) (ในแล็บอุดมคติตัดที่ ±15 V พอดี)` : ''}</p>` };
    } },
    non: { name: 'อัตราขยายไม่กลับเฟส', make() {
      const rg = pick(RV) * 1e3, rf = pick(RV) * 1e3, vin = pick([0.1, 0.2, 0.5, 1, -0.4]); const G = 1 + rf / rg; const Vo = G * vin; const sat = Math.abs(Vo) > 15;
      return { fig: () => P.noninverting({ rg, rf, w: 'dc', amp: vin, rl: null }), lab: () => P.noninverting({ rg, rf, w: 'dc', amp: vin, rl: null }), q: R`ออปแอมป์อุดมคติ ±15 V \(R_g = ${fmtSI(rg, '').replace(' ', '')}\ \Omega\), \(R_f = ${fmtSI(rf, '').replace(' ', '')}\ \Omega\), \(V_{in} = ${vin}\ \text{V}\) จงหา \(V_o\) (ถ้าอิ่มตัวให้ตอบค่าที่ถูกตัด)`, ans: [{ t: R`\(V_o\)`, u: 'V', v: sat ? 15 * Math.sign(Vo) : Vo }],
        sol: R`<p>\(V_o = (1 + R_f/R_g)V_{in} = ${n4(G)}(${vin}) = ${n4(Vo)}\ \text{V}\)${sat ? R` เกินแหล่งจ่ายจึงถูกตัดที่ \(\pm15\ \text{V}\)` : ''}</p>` };
    } },
    sum: { name: 'วงจรบวก', make() {
      const r1 = pick([10, 20, 47]) * 1e3, r2 = pick([10, 20, 47]) * 1e3, rf = pick([10, 20, 47]) * 1e3, v1 = pick([0.5, 1, 2, -1]), v2 = pick([0.5, 1, -0.5, 1.5]); const Vo = -rf * (v1 / r1 + v2 / r2);
      const mk = () => { const c = P.summer({ r1, r2, rf, rl: null }); c.find((q) => q.lab === 'V1').v = v1; const b = c.find((q) => q.lab === 'V2'); b.w = 'dc'; b.v = v2; return c; };
      return { fig: mk, lab: mk, q: R`วงจรบวกกลับเฟส \(R_1 = ${r1 / 1e3}\ \text{k}\Omega\), \(R_2 = ${r2 / 1e3}\ \text{k}\Omega\), \(R_f = ${rf / 1e3}\ \text{k}\Omega\) \(V_1 = ${v1}\ \text{V}\), \(V_2 = ${v2}\ \text{V}\) จงหา \(V_o\)`, ans: [{ t: R`\(V_o\)`, u: 'V', v: Vo }],
        sol: R`<p>\(V_o = -R_f\left(\dfrac{V_1}{R_1} + \dfrac{V_2}{R_2}\right) = ${n4(Vo)}\ \text{V}\)</p>` };
    } },
    int: { name: 'อินทิเกรเตอร์', make() {
      const r = pick([10, 22, 47, 100]) * 1e3, c = pick([10, 22, 47, 100]) * 1e-9, vin = pick([0.5, 1, 2]), t = pick([0.5, 1, 2, 3]) * 1e-3; const Vo = -vin * t / (r * c); const sat = Math.abs(Vo) > 15;
      return { fig: () => P.integrator({ rin: r, cf: c, w: 'step', amp: vin }), lab: () => P.integrator({ rin: r, cf: c, w: 'step', amp: vin }), q: R`อินทิเกรเตอร์ \(R = ${r / 1e3}\ \text{k}\Omega\), \(C = ${c * 1e9}\ \text{nF}\) เริ่มที่ \(v_C(0) = 0\) รับสเต็ป \(${vin}\ \text{V}\) ที่ \(t=0\) จงหา \(V_o\) ที่ \(t = ${t * 1e3}\ \text{ms}\) (ถ้าเกิน ±15 V ให้ตอบค่าที่ถูกตัด)`, ans: [{ t: R`\(V_o\)`, u: 'V', v: sat ? -15 : Vo }],
        sol: R`<p>\(RC = ${n4(r * c * 1e3)}\ \text{ms}\) \(V_o = -\dfrac{V_{in}t}{RC} = ${n4(Vo)}\ \text{V}\)${sat ? ' ซึ่งต่ำกว่า −15 V จึงอิ่มตัวที่ −15 V' : ''}</p>` };
    } },
    flt: { name: 'ความถี่ตัดตัวกรอง', make() {
      const rf = pick([4.7, 10, 22, 47]) * 1e3, cf = pick([1, 2.2, 4.7, 10]) * 1e-9, rin = pick([1, 2.2, 4.7, 10]) * 1e3; const fc = 1 / (2 * Math.PI * rf * cf); const dc = -rf / rin; const askDc = Math.random() < 0.5;
      return { fig: () => P.lpf1({ rin, rf, cf }), lab: () => P.lpf1({ rin, rf, cf }), mode: 'ac', q: R`ตัวกรองผ่านต่ำแบบกลับเฟส \(R_{in} = ${rin / 1e3}\ \text{k}\Omega\), \(R_f = ${rf / 1e3}\ \text{k}\Omega\), \(C_f = ${cf * 1e9}\ \text{nF}\) จงหา${askDc ? 'อัตราขยาย DC (พร้อมเครื่องหมาย)' : 'ความถี่ตัด −3 dB'}`, ans: [askDc ? { t: R`\(H(0)\)`, u: 'เท่า', v: dc } : { t: R`\(f_c\)`, u: 'Hz', v: fc }],
        sol: R`<p>\(H(s) = -\dfrac{R_f/R_{in}}{1 + sR_fC_f}\) ได้ \(H(0) = ${n4(dc)}\) และ \(f_c = \dfrac{1}{2\pi R_fC_f} = ${n4(fc)}\ \text{Hz}\)</p>` };
    } }
  };
  let gkind = 'inv', cur = null, streak = 0, gcount = 0;
  function genNew() {
    cur = GENS[gkind].make(); gcount++;
    const key = 'g-fig-' + gcount, keyL = 'g-lab-' + gcount; UI.addFig(key, cur.fig); if (cur.lab) UI.addFig(keyL, cur.lab);
    $('g-body').innerHTML = '<p>' + cur.q + '</p><figure class="dc-fig"><canvas data-fig="' + key + '"></canvas></figure><div class="ans">' + ansRows('g', cur.ans) + '</div><div class="dc-btnrow"><button class="dc-btn pri" id="g-chk">ตรวจคำตอบ</button><button class="dc-btn" id="g-new">ข้อใหม่</button>' + (cur.lab ? '<button class="dc-btn ghost" data-open="' + keyL + '" data-mode="' + (cur.mode || 'tran') + '">เปิดในแล็บ</button>' : '') + '</div><details class="sol" id="g-sol"><summary>ดูเฉลย (นับเป็นข้อที่ทำไม่ได้)</summary><div>' + cur.sol + '</div></details>';
    UI.math($('g-body')); UI.drawFigures(); cur.done = false;
    $('g-chk').onclick = () => { if (cur.done) return; const good = check('g', cur.ans); if (good) { cur.done = true; streak++; prog.best = Math.max(prog.best || 0, streak); save(); updStreak(); } };
    $('g-new').onclick = genNew; $('g-sol').addEventListener('toggle', () => { if ($('g-sol').open && !cur.done) { streak = 0; cur.done = true; updStreak(); } });
    $('g-0').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('g-chk').click(); });
  }
  function updStreak() { $('g-streak').textContent = streak; $('g-best').textContent = prog.best || 0; }
  function initGen() {
    $('g-kind').innerHTML = Object.entries(GENS).map(([k, g]) => '<button data-k="' + k + '"' + (k === gkind ? ' class="on"' : '') + '>' + g.name + '</button>').join('');
    $('g-kind').querySelectorAll('button').forEach((b) => b.onclick = () => { gkind = b.dataset.k; $('g-kind').querySelectorAll('button').forEach((q) => q.classList.toggle('on', q === b)); genNew(); });
    updStreak(); genNew();
  }
  function init() { render(); renderProgress(); initGen(); }
  return { init, LIST, GENS };
})();

UI.init(); PB.init();
