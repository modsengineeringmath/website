/* DC circuits lesson: lesson widgets, schematic figures, problem bank with answer checking and unlimited practice. Needs dc-core.js + dc-lab.js. */
/* ===== Lesson widgets, figures, math rendering ===== */
const UI = (() => {
  const { fmtSI } = DCE; const P = CK.P;
  const $ = (id) => document.getElementById(id);
  const css = (n) => getComputedStyle(DCROOT()).getPropertyValue(n).trim();
  const math = (el) => { if (typeof renderMathInElement === 'function') { try { renderMathInElement(el, { delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false, strict: 'ignore' }); } catch (e) { } } };

  /* ---------- figures & open-in-lab ---------- */
  const FIGS = {
    kcl: () => P.kcl(), nodal: () => P.twoNode(), mesh: () => P.mesh(7, 1, 2, 3, 1), thev: () => P.thevenin(24, 4, 12, 1, 4, false),
    thevL: () => P.thevenin(24, 4, 12, 1, 4, true), wheat: () => P.wheatstone(), divider: () => P.divider(), rc: () => P.rc(), rlc: () => P.rlc(), ladder: () => P.ladder(6)
  };
  const TRAN = new Set(['rc', 'rlc']);
  function drawFigures() { document.querySelectorAll('canvas[data-fig]').forEach((cv) => { const f = FIGS[cv.dataset.fig]; if (f) RND.figure(cv, f()); }); }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]'); if (!b) return; const k = b.dataset.open; const f = FIGS[k]; if (!f) return;
    LAB.open(f(), { mode: TRAN.has(k) ? 'tran' : 'dc' });
  });

  /* ---------- generic line plot with crosshair ---------- */
  function linePlot(cv, tipEl, cfg) {
    const box = cv.parentElement; if (!cv._h) cv._h = +cv.dataset.h || +cv.getAttribute('height') || 210; // keep the CSS height: cv.height below is in device pixels
    const W = Math.max(240, box.clientWidth), H = cv._h, dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const L = 54, R = 26, T = 12, B = 30, pw = W - L - R, ph = H - T - B;
    const { x0, x1, y0, y1, xLog } = cfg;
    const fx = (x) => L + (xLog ? (Math.log10(x) - Math.log10(x0)) / (Math.log10(x1) - Math.log10(x0)) : (x - x0) / (x1 - x0)) * pw;
    const fy = (y) => T + ph - ((y - y0) / (y1 - y0)) * ph;
    g.font = '11px "IBM Plex Mono",monospace'; g.lineWidth = 1;
    g.strokeStyle = css('--grid-2'); g.fillStyle = css('--ink-3'); g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const y of cfg.yTicks) { const yy = Math.round(fy(y)) + 0.5; g.beginPath(); g.moveTo(L, yy); g.lineTo(L + pw, yy); g.stroke(); g.fillText(cfg.yFmt(y), L - 6, yy); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const x of cfg.xTicks) { const xx = Math.round(fx(x)) + 0.5; g.beginPath(); g.moveTo(xx, T + ph); g.lineTo(xx, T + ph + 4); g.stroke(); g.fillText(cfg.xFmt(x), xx, T + ph + 7); }
    g.strokeStyle = css('--ink-3'); g.beginPath(); g.moveTo(L + 0.5, T); g.lineTo(L + 0.5, T + ph + 0.5); g.lineTo(L + pw, T + ph + 0.5); g.stroke();
    for (const v of cfg.vlines || []) { g.strokeStyle = css('--rule'); g.setLineDash([3, 3]); g.beginPath(); g.moveTo(fx(v.x) + 0.5, T); g.lineTo(fx(v.x) + 0.5, T + ph); g.stroke(); g.setLineDash([]); if (v.label) { g.fillStyle = css('--ink-3'); g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(v.label, fx(v.x) + 4, T + 2); } }
    for (const s of cfg.series) {
      g.strokeStyle = css(s.color); g.lineWidth = 2; g.beginPath();
      s.xs.forEach((x, i) => { const X = fx(x), Y = fy(s.ys[i]); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke();
    }
    for (const m of cfg.markers || []) { g.fillStyle = css(m.color); g.strokeStyle = css('--sheet'); g.lineWidth = 2; g.beginPath(); g.arc(fx(m.x), fy(m.y), 5, 0, 7); g.fill(); g.stroke(); }
    cv._plot = { fx, L, pw, cfg };
    if (!cv._bound) {
      cv._bound = true;
      const move = (e) => {
        const p = cv._plot; if (!p) return; const r = cv.getBoundingClientRect(); const px = e.clientX - r.left; if (px < p.L || px > p.L + p.pw) { tipEl.hidden = true; return; }
        const s0 = p.cfg.series[0]; let best = 0, bd = Infinity; s0.xs.forEach((x, i) => { const d = Math.abs(p.fx(x) - px); if (d < bd) { bd = d; best = i; } });
        tipEl.innerHTML = p.cfg.tip(best); tipEl.hidden = false;
        tipEl.style.left = Math.min(r.width - 150, px + 12) + 'px'; tipEl.style.top = Math.max(0, e.clientY - r.top - 40) + 'px';
      };
      cv.addEventListener('pointermove', move); cv.addEventListener('pointerdown', move); cv.addEventListener('pointerleave', () => tipEl.hidden = true);
    }
  }
  const ticks = (a, b, n) => { const out = [], st = (b - a) / n; for (let i = 0; i <= n; i++) out.push(a + i * st); return out; };
  const fmt = (v, d = 3) => Number((+v).toPrecision(d)).toString();

  /* ---------- color code ---------- */
  const CC = [['ดำ', '#1b1b1b'], ['น้ำตาล', '#7a4a26'], ['แดง', '#c62828'], ['ส้ม', '#ef6c00'], ['เหลือง', '#f5c400'], ['เขียว', '#2e7d32'], ['น้ำเงิน', '#1565c0'], ['ม่วง', '#6a1b9a'], ['เทา', '#8a8a8a'], ['ขาว', '#f4f4f4']];
  const MUL = CC.slice(0, 8).map((c, i) => [c[0] + ' ×' + fmtSI(Math.pow(10, i), ''), c[1], Math.pow(10, i)]).concat([['ทอง ×0.1', '#c9a227', 0.1], ['เงิน ×0.01', '#b8bcc2', 0.01]]);
  const TOL = [['ทอง ±5%', '#c9a227', 5], ['เงิน ±10%', '#b8bcc2', 10], ['น้ำตาล ±1%', '#7a4a26', 1], ['แดง ±2%', '#c62828', 2], ['เขียว ±0.5%', '#2e7d32', 0.5], ['น้ำเงิน ±0.25%', '#1565c0', 0.25], ['ม่วง ±0.1%', '#6a1b9a', 0.1]];
  const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82], E24 = E12.concat([11, 13, 16, 20, 24, 30, 36, 43, 51, 62, 75, 91]);
  function initCC() {
    const s1 = $('cc1'), s2 = $('cc2'), s3 = $('cc3'), s4 = $('cc4');
    s1.innerHTML = CC.slice(1).map((c, i) => '<option value="' + (i + 1) + '">' + c[0] + ' (' + (i + 1) + ')</option>').join('');
    s2.innerHTML = CC.map((c, i) => '<option value="' + i + '">' + c[0] + ' (' + i + ')</option>').join('');
    s3.innerHTML = MUL.map((c, i) => '<option value="' + i + '">' + c[0] + '</option>').join('');
    s4.innerHTML = TOL.map((c, i) => '<option value="' + i + '">' + c[0] + '</option>').join('');
    s1.value = 1; s2.value = 0; s3.value = 2; s4.value = 0;
    const up = () => {
      const d1 = +s1.value, d2 = +s2.value, m = MUL[+s3.value], t = TOL[+s4.value];
      const R = (d1 * 10 + d2) * m[2]; const tol = t[2];
      $('cc-val').textContent = fmtSI(R, 'Ω', 3) + ' ±' + tol + '%';
      $('cc-rng').textContent = fmtSI(R * (1 - tol / 100), 'Ω', 4) + ' – ' + fmtSI(R * (1 + tol / 100), 'Ω', 4);
      const two = d1 * 10 + d2; $('cc-e').textContent = E12.includes(two) ? 'E12 (และ E24)' : E24.includes(two) ? 'E24' : 'ไม่อยู่ใน E12/E24';
      const cols = [CC[d1][1], CC[d2][1], m[1], t[1]];
      $('cc-svg').innerHTML = '<line x1="8" y1="40" x2="352" y2="40" stroke="var(--ink-3)" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M92 18 q-14 0 -14 22 q0 22 14 22 h176 q14 0 14 -22 q0 -22 -14 -22 z" fill="#d9c29b" stroke="#a38a5f" stroke-width="1.5"/>' +
        [118, 146, 174, 244].map((x, i) => '<rect x="' + x + '" y="' + (i === 3 ? 20 : 18) + '" width="16" height="' + (i === 3 ? 40 : 44) + '" fill="' + cols[i] + '" stroke="rgba(0,0,0,.25)"/>').join('');
    };
    [s1, s2, s3, s4].forEach((s) => s.onchange = up); up();
  }

  /* ---------- loaded divider ---------- */
  function initDiv() {
    const r1 = $('dv-r1'), r2 = $('dv-r2'), rl = $('dv-rl');
    const up = () => {
      const R1 = Math.pow(10, +r1.value), R2 = Math.pow(10, +r2.value), RL = Math.pow(10, +rl.value);
      $('dv-r1o').textContent = fmtSI(R1, 'Ω'); $('dv-r2o').textContent = fmtSI(R2, 'Ω'); $('dv-rlo').textContent = fmtSI(RL, 'Ω');
      const v0 = 10 * R2 / (R1 + R2), Rp = R2 * RL / (R2 + RL), v1 = 10 * Rp / (R1 + Rp);
      $('dv-v0').textContent = fmtSI(v0, 'V', 4); $('dv-v1').textContent = fmtSI(v1, 'V', 4);
      $('dv-err').textContent = fmt((1 - v1 / v0) * 100, 3) + ' %'; $('dv-ratio').textContent = fmt(RL / (R1 * R2 / (R1 + R2)), 3) + ' เท่า';
    };
    [r1, r2, rl].forEach((s) => s.oninput = up); up();
  }

  /* ---------- max power transfer ---------- */
  function initMPT() {
    const v = $('mp-v'), r = $('mp-r'), l = $('mp-l');
    const up = () => {
      const V = +v.value, Rt = Math.pow(10, +r.value), RL = Rt * Math.pow(10, +l.value - 1);
      $('mp-vo').textContent = V + ' V'; $('mp-ro').textContent = fmtSI(Rt, 'Ω'); $('mp-lo').textContent = fmtSI(RL, 'Ω');
      const P = (x) => V * V * x / Math.pow(Rt + x, 2); const Pm = V * V / (4 * Rt);
      $('mp-p').textContent = fmtSI(P(RL), 'W', 4); $('mp-pm').textContent = fmtSI(Pm, 'W', 4); $('mp-eta').textContent = fmt(RL / (Rt + RL) * 100, 3) + ' %';
      const X = []; for (let k = 0; k <= 240; k++) X.push(Rt * Math.pow(10, -2 + 4 * k / 240));
      linePlot($('mp-plot'), $('mp-tip'), {
        x0: X[0], x1: X[X.length - 1], xLog: true, y0: 0, y1: 1.05,
        xTicks: [-2, -1, 0, 1, 2].map((e) => Rt * Math.pow(10, e)),
        yTicks: [0, 0.25, 0.5, 0.75, 1], xFmt: (x) => fmtSI(x, 'Ω', 2), yFmt: (y) => Math.round(y * 100) + '%',
        series: [{ xs: X, ys: X.map((x) => P(x) / Pm), color: '--s1' }, { xs: X, ys: X.map((x) => x / (Rt + x)), color: '--s2' }],
        vlines: [{ x: Rt, label: 'RL = Rth' }], markers: [{ x: RL, y: P(RL) / Pm, color: '--s1' }, { x: RL, y: RL / (Rt + RL), color: '--s2' }],
        tip: (i) => 'RL = ' + fmtSI(X[i], 'Ω') + '<br>P/Pmax = ' + fmt(P(X[i]) / Pm * 100, 3) + '%<br>η = ' + fmt(X[i] / (Rt + X[i]) * 100, 3) + '%'
      });
    };
    [v, r, l].forEach((s) => s.oninput = up); up(); return up;
  }

  /* ---------- first-order step ---------- */
  function initRC() {
    let kind = 'rc'; const r = $('rc-r'), c = $('rc-c');
    document.querySelectorAll('#rc-kind button').forEach((b) => b.onclick = () => { kind = b.dataset.k; document.querySelectorAll('#rc-kind button').forEach((q) => q.classList.toggle('on', q === b)); if (kind === 'rl') { r.min = 0; r.max = 3; r.value = 1; c.min = -3; c.max = 0; c.value = -1; } else { r.min = 1; r.max = 5; r.value = 4; c.min = -7; c.max = -3; c.value = -4; } up(); });
    const up = () => {
      const R = Math.pow(10, +r.value), X = Math.pow(10, +c.value);
      $('rc-ro').textContent = fmtSI(R, 'Ω'); $('rc-co').textContent = fmtSI(X, kind === 'rc' ? 'F' : 'H'); $('rc-cl').textContent = kind === 'rc' ? 'C' : 'L';
      const tau = kind === 'rc' ? R * X : X / R; const fin = kind === 'rc' ? 10 : 10 / R;
      $('rc-tau').textContent = fmtSI(tau, 's', 3); $('rc-99').textContent = fmtSI(tau * Math.log(100), 's', 3); $('rc-fin').innerHTML = kind === 'rc' ? 'v<sub>C</sub> = 10 V' : 'i<sub>L</sub> = ' + fmtSI(fin, 'A', 3);
      const xs = []; for (let k = 0; k <= 200; k++) xs.push(5 * tau * k / 200);
      const y = xs.map((t) => 1 - Math.exp(-t / tau)), y2 = xs.map((t) => Math.exp(-t / tau));
      linePlot($('rc-plot'), $('rc-tip'), {
        x0: 0, x1: 5 * tau, y0: 0, y1: 1.05, xTicks: [0, 1, 2, 3, 4, 5].map((k) => k * tau), yTicks: [0, 0.25, 0.5, 0.632, 0.75, 1],
        xFmt: (x) => (x === 0 ? '0' : fmt(x / tau, 2) + 'τ'), yFmt: (v) => Math.round(v * 1000) / 10 + '%',
        series: [{ xs, ys: y, color: '--s1' }, { xs, ys: y2, color: '--s2' }],
        vlines: [{ x: tau, label: 'τ = ' + fmtSI(tau, 's', 3) }], markers: [{ x: tau, y: 1 - Math.exp(-1), color: '--s1' }],
        tip: (i) => 't = ' + fmtSI(xs[i], 's', 3) + '<br>' + (kind === 'rc' ? 'v<sub>C</sub> = ' + fmtSI(10 * y[i], 'V', 3) + '<br>i = ' + fmtSI(10 / R * y2[i], 'A', 3) : 'i<sub>L</sub> = ' + fmtSI(fin * y[i], 'A', 3) + '<br>v<sub>L</sub> = ' + fmtSI(10 * y2[i], 'V', 3))
      });
      $('rc-leg').innerHTML = kind === 'rc' ? '<span><i style="background:var(--s1)"></i>v<sub>C</sub>/V<sub>s</sub> (ชาร์จขึ้น)</span><span><i style="background:var(--s2)"></i>i/i(0⁺) (กระแสลดลง)</span>' : '<span><i style="background:var(--s1)"></i>i<sub>L</sub>/i(∞) (กระแสเพิ่มขึ้น)</span><span><i style="background:var(--s2)"></i>v<sub>L</sub>/V<sub>s</sub> (แรงดันลดลง)</span>';
    };
    [r, c].forEach((s) => s.oninput = up); up(); return up;
  }

  /* ---------- normalised second-order ---------- */
  function step2(z, tn) {
    if (Math.abs(z - 1) < 1e-6) return 1 - Math.exp(-tn) * (1 + tn);
    if (z < 1) { const wd = Math.sqrt(1 - z * z); return 1 - Math.exp(-z * tn) * (Math.cos(wd * tn) + z / wd * Math.sin(wd * tn)); }
    const s = Math.sqrt(z * z - 1), p1 = -z + s, p2 = -z - s; return 1 + (p2 * Math.exp(p1 * tn) - p1 * Math.exp(p2 * tn)) / (p1 - p2);
  }
  function initZeta() {
    const zz = $('z-z');
    const up = () => {
      const z = +zz.value; $('z-zo').textContent = z.toFixed(2);
      $('z-kind').textContent = z < 0.995 ? 'หน่วงต่ำ' : z <= 1.005 ? 'หน่วงวิกฤต' : 'หน่วงเกิน';
      $('z-os').textContent = z < 1 ? fmt(100 * Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)), 3) + ' %' : '0 %';
      $('z-tp').textContent = z < 1 ? fmt(Math.PI / Math.sqrt(1 - z * z), 3) : 'ไม่มี';
      const xs = []; for (let k = 0; k <= 300; k++) xs.push(20 * k / 300);
      const y = xs.map((t) => step2(z, t)), yc = xs.map((t) => step2(1, t));
      const ymax = Math.max(1.05, Math.ceil(Math.max(...y) * 10) / 10 + 0.05);
      linePlot($('z-plot'), $('z-tip'), {
        x0: 0, x1: 20, y0: 0, y1: ymax, xTicks: [0, 4, 8, 12, 16, 20], yTicks: ticks(0, Math.floor(ymax * 4) / 4, Math.round(Math.floor(ymax * 4))).filter((v) => v <= ymax),
        xFmt: (x) => String(x), yFmt: (v) => fmt(v, 3), series: [{ xs, ys: y, color: '--s1' }, { xs, ys: yc, color: '--s3' }],
        markers: z < 1 ? [{ x: Math.PI / Math.sqrt(1 - z * z), y: step2(z, Math.PI / Math.sqrt(1 - z * z)), color: '--s1' }] : [],
        tip: (i) => 'ω₀t = ' + fmt(xs[i], 3) + '<br>ζ = ' + z.toFixed(2) + ': ' + fmt(y[i], 4) + '<br>ζ = 1: ' + fmt(yc[i], 4)
      });
    };
    zz.oninput = up; up(); return up;
  }

  /* ---------- HV loss table ---------- */
  function initHV() {
    const p = $('hv-p'), r = $('hv-r');
    const up = () => {
      const P = +p.value * 1e3, R = +r.value * 1e-3; $('hv-po').textContent = fmtSI(P, 'W'); $('hv-ro').textContent = fmtSI(R, 'Ω');
      const Vs = [12, 48, 54, 400, 800]; const ref = Math.pow(P / 54, 2) * R;
      let h = '<thead><tr><th>แรงดันระบบ</th><th class="dc-num">กระแส I = P/V</th><th class="dc-num">สูญเสีย I²R</th><th class="dc-num">% ของกำลังที่ส่ง</th><th class="dc-num">เทียบกับ 54 V</th></tr></thead><tbody>';
      for (const V of Vs) { const I = P / V, L = I * I * R; h += '<tr><td><b>' + V + ' V</b></td><td class="dc-num">' + fmtSI(I, 'A') + '</td><td class="dc-num">' + fmtSI(L, 'W') + '</td><td class="dc-num">' + (L / P * 100 >= 100 ? 'เกิน 100% (ส่งไม่ได้)' : fmt(L / P * 100, 3) + ' %') + '</td><td class="dc-num">' + (V === 54 ? '1×' : (L > ref ? '×' + fmt(L / ref, 3) : '÷' + fmt(ref / L, 3))) + '</td></tr>'; }
      $('hv-tbl').innerHTML = h + '</tbody>';
    };
    [p, r].forEach((s) => s.oninput = up); up();
  }

  const redrawers = [];
  function init() {
    initCC(); initDiv(); redrawers.push(initMPT(), initRC(), initZeta()); initHV();
    drawFigures();
    let rt = null; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { drawFigures(); redrawers.forEach((f) => f()); }, 150); });
    const retheme = () => { RND.readColors(); drawFigures(); redrawers.forEach((f) => f()); window.dispatchEvent(new Event('dc-redraw')); };
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', retheme);
    new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('dc-redraw', drawFigures);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { drawFigures(); window.dispatchEvent(new Event('dc-redraw')); });
  }
  function addFig(k, f, tran) { FIGS[k] = f; if (tran) TRAN.add(k); }
  return { init, math, linePlot, fmt, addFig, drawFigures };
})();

/* ===== Problem bank + unlimited practice ===== */
const PB = (() => {
  const { fmtSI } = DCE; const P = CK.P; const $ = (id) => document.getElementById(id); const R = String.raw;
  const LV = { 1: ['พื้นฐาน', '#7a4a26'], 2: ['มหาวิทยาลัย', '#c62828'], 3: ['ระดับประเทศ', '#ef6c00'], 4: ['ระดับโลก', '#f5c400'] };
  const badge = (l) => '<span class="lvl"><svg viewBox="0 0 34 12" aria-hidden="true"><line x1="0" y1="6" x2="34" y2="6" stroke="var(--ink-3)" stroke-width="1.5"/><rect x="6" y="1" width="22" height="10" rx="4" fill="#d9c29b" stroke="#a38a5f" stroke-width=".8"/><rect x="11" y="1" width="4" height="10" fill="' + LV[l][1] + '"/><rect x="19" y="1" width="3" height="10" fill="#c9a227"/></svg>ระดับ ' + l + ' · ' + LV[l][0] + '</span>';

  /* ---------- static SVG figures ---------- */
  const SVG_CUBE = (() => {
    const V = { A: [40, 150], B: [140, 150], C: [140, 50], D: [40, 50], E: [92, 112], F: [192, 112], G: [192, 12], H: [92, 12] };
    const E = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['F', 'G'], ['G', 'H'], ['B', 'F'], ['C', 'G'], ['D', 'H'], ['A', 'E', 1], ['E', 'F', 1], ['E', 'H', 1]];
    let s = '<svg viewBox="0 0 232 172" width="232" height="172" role="img" aria-label="ลูกบาศก์ตัวต้านทาน 12 ตัว">';
    for (const [a, b, h] of E) s += '<line x1="' + V[a][0] + '" y1="' + V[a][1] + '" x2="' + V[b][0] + '" y2="' + V[b][1] + '" stroke="var(--ink)" stroke-width="2"' + (h ? ' stroke-dasharray="5 4" opacity=".55"' : '') + '/>';
    for (const k in V) { const hl = k === 'A' || k === 'G' || k === 'B'; s += '<circle cx="' + V[k][0] + '" cy="' + V[k][1] + '" r="' + (hl ? 5 : 3.5) + '" fill="' + (hl ? 'var(--copper)' : 'var(--ink)') + '"/>'; }
    s += '<text x="26" y="166" font-family="Trirong,serif" font-style="italic" font-weight="600" font-size="15" fill="var(--ink)">A</text><text x="146" y="166" font-family="Trirong,serif" font-style="italic" font-weight="600" font-size="15" fill="var(--ink)">B</text><text x="200" y="16" font-family="Trirong,serif" font-style="italic" font-weight="600" font-size="15" fill="var(--ink)">G</text></svg>';
    return s;
  })();
  const SVG_GRID = (() => {
    let s = '<svg viewBox="0 0 260 180" width="260" height="180" role="img" aria-label="ตารางตัวต้านทานอนันต์">'; const x0 = 20, y0 = 20, d = 36;
    for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) {
      const x = x0 + i * d, y = y0 + j * d; const edge = i === 0 || i === 6 || j === 0 || j === 4;
      if (i < 6) s += '<line x1="' + x + '" y1="' + y + '" x2="' + (x + d) + '" y2="' + y + '" stroke="var(--ink)" stroke-width="1.6" opacity="' + (edge ? 0.35 : 1) + '"/>';
      if (j < 4) s += '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y + d) + '" stroke="var(--ink)" stroke-width="1.6" opacity="' + (edge ? 0.35 : 1) + '"/>';
    }
    s += '<line x1="128" y1="92" x2="164" y2="92" stroke="var(--copper)" stroke-width="4"/><circle cx="128" cy="92" r="5" fill="var(--copper)"/><circle cx="164" cy="92" r="5" fill="var(--copper)"/>';
    s += '<text x="116" y="86" font-family="Trirong,serif" font-style="italic" font-weight="600" font-size="15" fill="var(--ink)">A</text><text x="168" y="86" font-family="Trirong,serif" font-style="italic" font-weight="600" font-size="15" fill="var(--ink)">B</text></svg>';
    return s;
  })();
  const SVG_PORT = '<svg viewBox="0 0 300 120" width="300" height="120" role="img" aria-label="เครือข่ายสองพอร์ต"><rect x="95" y="20" width="110" height="80" rx="4" fill="var(--sheet)" stroke="var(--ink)" stroke-width="2"/><text x="150" y="56" text-anchor="middle" font-size="12" fill="var(--ink-2)" font-family="IBM Plex Sans Thai,sans-serif">เครือข่าย</text><text x="150" y="74" text-anchor="middle" font-size="12" fill="var(--ink-2)" font-family="IBM Plex Sans Thai,sans-serif">ตัวต้านทานล้วน</text>' +
    '<path d="M95 35 H40 V48 M40 72 V85 H95" stroke="var(--ink)" stroke-width="2" fill="none"/><circle cx="40" cy="60" r="12" fill="var(--sheet)" stroke="var(--ink)" stroke-width="2"/><text x="40" y="57" text-anchor="middle" font-size="11" font-family="IBM Plex Mono,monospace" fill="var(--ink)">+</text><text x="40" y="69" text-anchor="middle" font-size="11" font-family="IBM Plex Mono,monospace" fill="var(--ink)">−</text><text x="12" y="64" font-size="12" font-family="IBM Plex Mono,monospace" fill="var(--ink)">10V</text>' +
    '<path d="M205 35 H260 V48 M260 72 V85 H205" stroke="var(--ink)" stroke-width="2" fill="none"/><circle cx="260" cy="60" r="12" fill="var(--sheet)" stroke="var(--ink)" stroke-width="2"/><text x="260" y="64" text-anchor="middle" font-size="12" font-weight="600" font-family="IBM Plex Mono,monospace" fill="var(--ink)">A</text><text x="278" y="64" font-size="12" font-family="IBM Plex Mono,monospace" fill="var(--copper)">2A</text>' +
    '<text x="62" y="112" font-size="11" fill="var(--ink-3)" font-family="IBM Plex Sans Thai,sans-serif">พอร์ต 1</text><text x="210" y="112" font-size="11" fill="var(--ink-3)" font-family="IBM Plex Sans Thai,sans-serif">พอร์ต 2</text></svg>';

  /* ---------- curated problems ---------- */
  const hid = (c, lab, txt) => { const e = c.find((q) => q.lab === lab); if (e) e.hideVal = txt || true; return c; };
  const LIST = [
    { id: 'p1', l: 1, topic: 'รหัสสี', title: 'อ่านค่าตัวต้านทาน 4 แถบ', q: R`ตัวต้านทานมีแถบสีเรียงเป็น <b>เหลือง ม่วง ส้ม ทอง</b> จงหาค่าความต้านทานระบุ และค่าสูงสุดที่ยังอยู่ในพิกัดความคลาดเคลื่อน`,
      ans: [{ t: R`\(R\)`, u: 'kΩ', v: 47 }, { t: R`\(R_{max}\)`, u: 'kΩ', v: 49.35 }], hint: 'เหลือง = 4 ม่วง = 7 แถบที่สามสีส้มคือคูณ 10³ และแถบทองคือ ±5%',
      sol: R`<p>\(R = 47 \times 10^3 = 47\ \text{k}\Omega\) ค่าสูงสุด \(R_{max} = 47(1.05) = 49.35\ \text{k}\Omega\) ค่าต่ำสุด \(44.65\ \text{k}\Omega\)</p><p>ลองตรวจด้วยเครื่องมือถอดรหัสแถบสีในบทที่ 1 ค่า 47 อยู่ในอนุกรม E12 ซึ่งเป็นชุดค่าที่ผลิตขายทั่วไป</p>` },
    { id: 'p2', l: 1, topic: 'อนุกรม–ขนาน', title: 'กระแสรวมและแรงดันคร่อม R3', fig: () => P.seriesPar(12, 2, 6, 3), lab: () => P.seriesPar(12, 2, 6, 3),
      q: R`จงหากระแสที่แหล่งจ่ายจ่ายออกมา และแรงดันคร่อม R3`, ans: [{ t: R`\(I\)`, u: 'A', v: 3 }, { t: R`\(V_{R3}\)`, u: 'V', v: 6 }], hint: 'R2 กับ R3 ขนานกัน รวมเป็นตัวเดียวก่อน แล้วอนุกรมกับ R1',
      sol: R`<p>\(R_2\parallel R_3 = \dfrac{6\cdot 3}{6+3} = 2\ \Omega\) จึงได้ \(R_{eq} = 2 + 2 = 4\ \Omega\) และ \(I = 12/4 = 3\ \text{A}\)</p><p>\(V_{R3} = I\,(R_2\parallel R_3) = 3(2) = 6\ \text{V}\) ตรวจ: \(I_{R2} = 1\ \text{A},\ I_{R3} = 2\ \text{A}\) รวมกัน 3 A ตาม KCL</p>` },
    { id: 'p3', l: 1, topic: 'กำลังและประจุ', title: 'หลอดไส้ 12 V 24 W', q: R`หลอดไส้ระบุพิกัด 12 V 24 W ใช้งานที่แรงดันพิกัดนาน 3 ชั่วโมง จงหาความต้านทานของไส้หลอดขณะทำงาน และประจุทั้งหมดที่ไหลผ่านหลอด`,
      ans: [{ t: R`\(R\)`, u: 'Ω', v: 6 }, { t: R`\(Q\)`, u: 'C', v: 21600 }], hint: 'หากระแสจาก P = VI ก่อน แล้วใช้ Q = I·t โดย t เป็นวินาที',
      sol: R`<p>\(I = P/V = 24/12 = 2\ \text{A}\) และ \(R = V/I = 6\ \Omega\)</p><p>\(Q = It = 2 \times (3 \times 3600) = 21\,600\ \text{C}\) พลังงานที่ใช้ \(W = Pt = 72\ \text{Wh} = 259.2\ \text{kJ}\)</p><p class="muted">ไส้ทังสเตนขณะเย็นมีความต้านทานต่ำกว่าค่านี้มาก กระแสตอนเปิดสวิตช์จึงพุ่งสูงชั่วขณะ</p>` },
    { id: 'p4', l: 1, topic: 'แหล่งจ่ายจริง', title: 'ความต้านทานภายในของแบตเตอรี่', fig: () => P.battery(), lab: () => P.battery(),
      q: R`แบตเตอรี่มีแรงเคลื่อน \(E = 12\ \text{V}\) และความต้านทานภายใน \(r = 0.5\ \Omega\) ต่อกับโหลด \(R_L = 5.5\ \Omega\) จงหากระแส และแรงดันที่ขั้วแบตเตอรี่`,
      ans: [{ t: R`\(I\)`, u: 'A', v: 2 }, { t: R`\(V_{\text{ขั้ว}}\)`, u: 'V', v: 11 }], hint: 'r อนุกรมกับ RL เสมอ แรงดันที่ขั้วคือ E ลบแรงดันตกใน r',
      sol: R`<p>\(I = \dfrac{E}{r + R_L} = \dfrac{12}{6} = 2\ \text{A}\) แรงดันขั้ว \(V = E - Ir = 12 - 1 = 11\ \text{V}\)</p><p>แบตเตอรี่เสื่อมจะมี \(r\) สูงขึ้น แรงดันขณะไม่มีโหลดอาจยังดูปกติ แต่ตกลงมากเมื่อจ่ายกระแส</p>` },
    { id: 'p5', l: 1, topic: 'แบ่งแรงดัน', title: 'โวลต์มิเตอร์อ่านได้เท่าใด', fig: () => P.divider(10, 10e3, 10e3, 10e3), lab: () => P.divider(10, 10e3, 10e3, 10e3),
      q: R`โวลต์มิเตอร์ VM1 เป็นแบบอุดมคติ (ความต้านทานภายในเป็นอนันต์) จงหาค่าที่อ่านได้`, ans: [{ t: R`\(V_{VM1}\)`, u: 'V', v: 10 / 3 }], hint: 'RL ขนานกับ R2 ก่อน แล้วจึงแบ่งแรงดัน',
      sol: R`<p>\(R_2\parallel R_L = 5\ \text{k}\Omega\) จึงได้ \(V = 10\cdot\dfrac{5}{10+5} = 3.333\ \text{V}\)</p><p>ถ้าไม่มี RL จะได้ 5 V โหลดที่มีค่าเท่ากับตัวแบ่งแรงดันทำให้แรงดันตกไปหนึ่งในสาม ดูเครื่องมือในบทที่ 4</p>` },
    { id: 'p6', l: 1, topic: 'สัมประสิทธิ์อุณหภูมิ', title: 'วัดอุณหภูมิขดลวดด้วยความต้านทาน', q: R`ขดลวดทองแดงมีความต้านทาน 10.0 Ω ที่ 20 °C ให้ \(\alpha = 0.00393\ /^\circ\text{C}\) จงหาความต้านทานที่ 75 °C และถ้าวัดได้ 11.0 Ω ขดลวดมีอุณหภูมิเท่าใด`,
      ans: [{ t: R`\(R_{75}\)`, u: 'Ω', v: 12.1615 }, { t: R`\(T\)`, u: '°C', v: 20 + 0.1 / 0.00393 }], hint: 'ใช้ R(T) = R₀[1 + α(T − T₀)] แล้วแก้หา T ในข้อหลัง',
      sol: R`<p>\(R_{75} = 10\left[1 + 0.00393(55)\right] = 12.16\ \Omega\)</p><p>\(11 = 10\left[1 + 0.00393(T-20)\right] \Rightarrow T = 20 + \dfrac{0.1}{0.00393} = 45.4\ ^\circ\text{C}\)</p><p>วิธีนี้คือ resistance method ที่ใช้ทดสอบอุณหภูมิที่เพิ่มขึ้นของขดลวดมอเตอร์และหม้อแปลงจริง</p>` },

    { id: 'p7', l: 2, topic: 'วิธีโหนด', title: 'แรงดันโหนดสองโหนด', fig: () => P.twoNode(20, 2, 6, 2, 2, 2), lab: () => P.twoNode(20, 2, 6, 2, 2, 2),
      q: R`จงหาแรงดันโหนด \(V_1\) และ \(V_2\) เทียบกับกราวด์`, ans: [{ t: R`\(V_1\)`, u: 'V', v: 12 }, { t: R`\(V_2\)`, u: 'V', v: 8 }], hint: 'แปลง Vs กับ R1 เป็นแหล่งจ่ายกระแส 10 A ขนาน 2 Ω แล้วเขียนเมทริกซ์โดยการสังเกต',
      sol: R`\[\begin{bmatrix} \tfrac12+\tfrac16+\tfrac12 & -\tfrac12\\[2pt] -\tfrac12 & \tfrac12+\tfrac12\end{bmatrix}\begin{bmatrix}V_1\\V_2\end{bmatrix}=\begin{bmatrix}10\\2\end{bmatrix}\]<p>จากแถวที่สอง \(V_2 = 2 + V_1/2\) แทนในแถวแรก \(\tfrac{7}{6}V_1 - 1 - \tfrac14 V_1 = 10 \Rightarrow \tfrac{11}{12}V_1 = 11\) ได้ \(V_1 = 12\ \text{V}\) และ \(V_2 = 8\ \text{V}\)</p>` },
    { id: 'p8', l: 2, topic: 'วิธีเมช', title: 'กระแสเมชสองเมช', fig: () => P.mesh(8, 2, 4, 2, 2), lab: () => P.mesh(8, 2, 4, 2, 2),
      q: R`กำหนดกระแสเมช \(I_1, I_2\) วนตามเข็มนาฬิกา จงหาค่าทั้งสอง`, ans: [{ t: R`\(I_1\)`, u: 'A', v: 2 }, { t: R`\(I_2\)`, u: 'A', v: 1 }], hint: 'R3 ใช้ร่วมกันสองเมช แนวทแยงของเมทริกซ์คือผลรวม R ในแต่ละเมช นอกแนวทแยงคือ −R3',
      sol: R`\[\begin{bmatrix}6 & -4\\ -4 & 6\end{bmatrix}\begin{bmatrix}I_1\\I_2\end{bmatrix}=\begin{bmatrix}8\\-2\end{bmatrix},\qquad \Delta = 36-16 = 20\]<p>\(I_1 = \dfrac{8(6) - (-4)(-2)}{20} = 2\ \text{A}\) และ \(I_2 = \dfrac{6(-2) - (-4)(8)}{20} = 1\ \text{A}\) กระแสลงผ่าน R3 คือ 1 A</p>` },
    { id: 'p9', l: 2, topic: 'ซูเปอร์โหนด', title: 'แหล่งจ่ายแรงดันลอยระหว่างสองโหนด', fig: () => P.supernode(), lab: () => P.supernode(),
      q: R`แหล่งจ่ายกระแส \(I_s = 4.5\ \text{A}\) และแหล่งจ่ายแรงดัน 6 V ต่อระหว่างโหนด \(V_1\) กับ \(V_2\) จงหา \(V_2\) และกำลังที่แหล่งจ่ายแรงดันดูดกลืน (ตอบติดลบถ้าเป็นการจ่ายกำลัง)`,
      ans: [{ t: R`\(V_2\)`, u: 'V', v: 2 }, { t: R`\(p_{V_s}\)`, u: 'W', v: 3 }], hint: 'ครอบ V₁ และ V₂ เป็นซูเปอร์โหนดเดียว เขียน KCL หนึ่งสมการ และสมการข้อจำกัด V₁ − V₂ = 6',
      sol: R`<p>KCL รอบซูเปอร์โหนด: \(4.5 = \dfrac{V_1}{2} + \dfrac{V_2}{4}\) และ \(V_1 - V_2 = 6\) ได้ \(V_1 = 8\ \text{V},\ V_2 = 2\ \text{V}\)</p><p>กระแสที่ไหลจากโหนด 1 เข้าขั้ว + ของ Vs แล้วออกที่โหนด 2 เท่ากับกระแสลง R2 คือ 0.5 A จึงได้ \(p = 6(0.5) = +3\ \text{W}\) แหล่งจ่ายแรงดันนี้<b>ดูดกลืน</b>กำลัง เหมือนแบตเตอรี่ที่กำลังถูกชาร์จ</p><p>ตรวจสมดุล: Is จ่าย \(8 \times 4.5 = 36\ \text{W}\) = R1 32 W + R2 1 W + Vs 3 W</p>` },
    { id: 'p10', l: 2, topic: 'การซ้อนทับ', title: 'แยกผลของแหล่งจ่ายทีละตัว', fig: () => P.superpos(), lab: () => P.superpos(),
      q: R`ใช้การซ้อนทับหากระแสใน R2 (ทิศลง) เมื่อมีเฉพาะแหล่งจ่ายกระแส \(I_s\) ทำงาน และกระแสรวมใน R2 เมื่อทั้งสองแหล่งทำงาน`, ans: [{ t: R`\(I''_{R2}\)`, u: 'A', v: 1 }, { t: R`\(I_{R2}\)`, u: 'A', v: 2.5 }], hint: 'ดับ Vs ด้วยการลัดวงจร แล้ว Is จะแบ่งกระแสระหว่าง R1 กับ R2',
      sol: R`<p>เฉพาะ Vs (Is เปิดวงจร): \(I' = 12/(4+4) = 1.5\ \text{A}\)</p><p>เฉพาะ Is (Vs ลัดวงจร): \(I'' = 2\cdot\dfrac{4}{4+4} = 1\ \text{A}\) รวม \(I = 2.5\ \text{A}\)</p><p>กำลังใน R2 จริงคือ \(2.5^2(4) = 25\ \text{W}\) แต่ผลรวมกำลังแยกกัน \(1.5^2(4) + 1^2(4) = 13\ \text{W}\) ซ้อนทับกำลังไม่ได้</p>` },
    { id: 'p11', l: 2, topic: 'เทวินิน', title: 'เทวินินและกำลังสูงสุด', fig: () => P.thevenin(12, 6, 3, 2, 4, false), lab: () => P.thevenin(12, 6, 3, 2, 4, true),
      q: R`จงหา \(V_{th}\) และ \(R_{th}\) ที่ขั้ว a–b และกำลังสูงสุดที่ส่งให้โหลดที่ต่อกับ a–b ได้`, ans: [{ t: R`\(V_{th}\)`, u: 'V', v: 4 }, { t: R`\(R_{th}\)`, u: 'Ω', v: 4 }, { t: R`\(P_{max}\)`, u: 'W', v: 1 }], hint: 'ขั้วเปิดอยู่ ไม่มีกระแสใน R3 ส่วน R_th หาได้จากการลัดวงจร Vs',
      sol: R`<p>\(V_{th} = 12\cdot\dfrac{3}{6+3} = 4\ \text{V}\) และ \(R_{th} = (6\parallel 3) + 2 = 4\ \Omega\)</p><p>\(P_{max} = \dfrac{V_{th}^2}{4R_{th}} = \dfrac{16}{16} = 1\ \text{W}\) เมื่อ \(R_L = 4\ \Omega\) เปิดในแล็บจะเห็น RL = 4 Ω ได้ 1 W พอดี</p>` },
    { id: 'p12', l: 2, topic: 'บริดจ์', title: 'บริดจ์วีตสโตน', fig: () => hid(P.wheatstone(10, 100, 200, 150, 330), 'Rx'), lab: () => P.wheatstone(10, 100, 200, 150, 330),
      q: R`(ก) จงหาค่า \(R_x\) ที่ทำให้บริดจ์สมดุล (VM1 อ่านได้ 0) (ข) ถ้าใส่ \(R_x = 330\ \Omega\) โวลต์มิเตอร์อ่านได้เท่าใด (VM1 อ่าน \(V_a - V_b\))`, ans: [{ t: R`\(R_x\)`, u: 'Ω', v: 300 }, { t: R`\(V_{ab}\)`, u: 'V', v: 10 * 200 / 300 - 10 * 330 / 480 }], hint: 'สมดุลเมื่อสองฝั่งแบ่งแรงดันได้เท่ากัน',
      sol: R`<p>(ก) \(\dfrac{R_1}{R_2} = \dfrac{R_3}{R_x} \Rightarrow R_x = \dfrac{R_2R_3}{R_1} = \dfrac{200(150)}{100} = 300\ \Omega\)</p><p>(ข) \(V_a = 10\cdot\dfrac{200}{300} = 6.667\ \text{V},\ V_b = 10\cdot\dfrac{330}{480} = 6.875\ \text{V}\) จึงอ่านได้ \(-0.208\ \text{V}\) เครื่องหมายลบบอกว่า b มีศักย์สูงกว่า a</p>` },
    { id: 'p13', l: 2, topic: 'ทรานเซียนต์ RC', title: 'ชาร์จตัวเก็บประจุ', fig: () => P.rc(), lab: () => P.rc(), tran: true,
      q: R`ตัวเก็บประจุเริ่มที่ 0 V แหล่งจ่ายเริ่มทำงานที่ \(t = 0\) จงหา \(v_C\) ที่ \(t = 2\ \text{s}\) และเวลาที่ \(v_C = 5\ \text{V}\)`, ans: [{ t: R`\(v_C(2\,\text{s})\)`, u: 'V', v: 10 * (1 - Math.exp(-2)) }, { t: R`\(t_{5V}\)`, u: 's', v: Math.log(2) }], hint: 'τ = RC = 1 s และ v(t) = 10(1 − e^(−t/τ))',
      sol: R`<p>\(\tau = (10\times10^3)(100\times10^{-6}) = 1\ \text{s}\) ได้ \(v_C(2) = 10(1-e^{-2}) = 8.647\ \text{V}\)</p><p>\(5 = 10(1-e^{-t}) \Rightarrow t = \ln 2 = 0.693\ \text{s}\) เวลาครึ่งทางคือ \(0.693\tau\) เสมอสำหรับวงจรอันดับหนึ่ง</p>` },
    { id: 'p14', l: 2, topic: 'ทรานเซียนต์ RL', title: 'กระแสในตัวเหนี่ยวนำ', fig: () => P.rl(), lab: () => P.rl(), tran: true,
      q: R`กระแสในตัวเหนี่ยวนำเริ่มที่ 0 A จงหา \(i_L\) ที่ \(t = 0.1\ \text{s}\) และพลังงานที่ตัวเหนี่ยวนำสะสมเมื่อเข้าสภาวะคงตัว`, ans: [{ t: R`\(i_L(0.1\,\text{s})\)`, u: 'A', v: 2 * (1 - Math.exp(-2)) }, { t: R`\(W_L\)`, u: 'J', v: 1.2 }], hint: 'τ = L/R และในสภาวะคงตัว L ลัดวงจร',
      sol: R`<p>\(\tau = 0.6/12 = 0.05\ \text{s}\) และ \(i(\infty) = 24/12 = 2\ \text{A}\) ได้ \(i_L(0.1) = 2(1-e^{-2}) = 1.729\ \text{A}\)</p><p>\(W = \tfrac12 L i^2 = \tfrac12(0.6)(2^2) = 1.2\ \text{J}\)</p>` },
    { id: 'p15', l: 2, topic: 'การวัด', title: 'วัดตัวต้านทานค่าต่ำแบบ 2 สาย', q: R`ต้องการวัดตัวต้านทานชันต์ 0.100 Ω ด้วยโอห์มมิเตอร์แบบ 2 สาย สายวัดแต่ละเส้นรวมหน้าสัมผัสมีความต้านทาน 0.20 Ω จงหาค่าที่มิเตอร์อ่านได้ และความคลาดเคลื่อนเป็นเปอร์เซ็นต์`,
      ans: [{ t: R`\(R_{\text{อ่าน}}\)`, u: 'Ω', v: 0.5 }, { t: 'ความคลาดเคลื่อน', u: '%', v: 400 }], hint: 'มิเตอร์ 2 สายวัดทุกอย่างที่อยู่ในเส้นทางของกระแส รวมทั้งสายวัดทั้งสองเส้น',
      sol: R`<p>\(R_{\text{อ่าน}} = 0.1 + 2(0.2) = 0.5\ \Omega\) คลาดเคลื่อน \(\dfrac{0.5-0.1}{0.1}\times100 = 400\%\)</p><p>การวัดแบบ 4 สาย (Kelvin) ส่งกระแสผ่านสายคู่หนึ่ง และวัดแรงดันด้วยอีกคู่ที่แตะตัวต้านทานโดยตรง สายวัดแรงดันแทบไม่มีกระแส จึงไม่มีแรงดันตกในสาย ค่าที่อ่านได้จึงเป็น 0.100 Ω งานวัดความต้านทานต่ำจริงทุกงาน (ชันต์ ขดลวดมอเตอร์ บัสบาร์) ใช้วิธีนี้</p>` },

    { id: 'p16', l: 3, topic: 'แหล่งจ่ายไม่อิสระ', title: 'แหล่งจ่ายกระแสควบคุมด้วยแรงดัน', fig: () => P.vccs(), lab: () => P.vccs(),
      q: R`G1 เป็นแหล่งจ่ายกระแสไม่อิสระ ไหลลงด้วยค่า \(0.5\,v_x\) (A) โดย \(v_x\) คือแรงดันคร่อม R2 (ขั้ว + อยู่ด้านบน) จงหา \(v_x\) และกำลังที่ G1 ดูดกลืน`, ans: [{ t: R`\(v_x\)`, u: 'V', v: 4.8 }, { t: R`\(p_{G1}\)`, u: 'W', v: 11.52 }], hint: 'เขียน KCL ที่โหนดบน แทนกระแสของ G1 ด้วย 0.5vₓ แล้วแก้สมการเดียว',
      sol: R`<p>KCL: \(\dfrac{v_x - 12}{2} + \dfrac{v_x}{4} + 0.5v_x = 0 \Rightarrow 2v_x - 24 + v_x + 2v_x = 0 \Rightarrow v_x = 4.8\ \text{V}\)</p><p>\(p_{G1} = v_x(0.5v_x) = 11.52\ \text{W}\) เพราะกระแสของ G1 แปรตามแรงดันคร่อมตัวเอง G1 จึงทำตัวเหมือนตัวต้านทาน \(1/0.5 = 2\ \Omega\)</p>` },
    { id: 'p17', l: 3, topic: 'บริดจ์ไม่สมดุล', title: 'ความต้านทานสมมูลของบริดจ์ห้าตัว', fig: () => P.bridge5(false), lab: () => P.bridge5(true),
      q: R`จงหาความต้านทานสมมูลระหว่างขั้ว a และ b (ค่าทั้งหมดเป็นโอห์ม)`, ans: [{ t: R`\(R_{ab}\)`, u: 'Ω', v: 1.4 }], hint: 'บริดจ์ไม่สมดุล ลองแปลงสามเหลี่ยม a–c–d เป็นดาว หรือป้อนกระแส 1 A แล้วสังเกตว่าวงจรสมมาตรเมื่อหมุน 180° ทำให้ V_c + V_d = V_a',
      sol: R`<p><b>วิธี Δ–Y</b>: สามเหลี่ยม a–c–d มี \(R_{ac} = 1, R_{ad} = 2, R_{cd} = 1\) รวม 4 Ω แปลงเป็นดาว \(R_a = \tfrac{1\cdot 2}{4} = 0.5,\ R_c = \tfrac{1\cdot 1}{4} = 0.25,\ R_d = \tfrac{2\cdot1}{4} = 0.5\)</p>\[R_{ab} = 0.5 + (0.25+2)\parallel(0.5+1) = 0.5 + \frac{2.25(1.5)}{3.75} = 1.4\ \Omega\]<p><b>วิธีสมมาตร</b>: ป้อน 1 A ที่ a ให้ b เป็นกราวด์ การหมุน 180° สลับ a↔b และ c↔d จึงได้ \(V_c = V_a - V_d\) จาก KCL ที่ c ได้ \(V_c = \tfrac47 V_a\) และจาก KCL ที่ a ได้ \(\tfrac57 V_a = 1\) ดังนั้น \(R_{ab} = 7/5\ \Omega\)</p>` },
    { id: 'p18', l: 3, topic: 'ตัวเก็บประจุใน DC', title: 'ประจุที่จุดต่อของตัวเก็บประจุ', fig: () => P.capdiv(), lab: () => P.capdiv(),
      q: R`วงจรอยู่ในสภาวะคงตัวมานานแล้ว จงหาประจุบน C1 และ C2 และประจุสุทธิที่จุด P (แผ่นล่างของ C1 รวมกับแผ่นบนของ C2)`, ans: [{ t: R`\(Q_1\)`, u: 'µC', v: 8 }, { t: R`\(Q_2\)`, u: 'µC', v: 32 }, { t: R`\(Q_P\)`, u: 'µC', v: 24 }], hint: 'ในสภาวะคงตัว C เปิดวงจร จุด P จึงมีศักย์เท่ากับจุดกลางของ R1–R2',
      sol: R`<p>\(V_P = 12\cdot\dfrac{2k}{3k} = 8\ \text{V}\) ดังนั้น \(V_{C1} = 4\ \text{V},\ V_{C2} = 8\ \text{V}\) ได้ \(Q_1 = 2\mu(4) = 8\ \mu\text{C}\) และ \(Q_2 = 4\mu(8) = 32\ \mu\text{C}\)</p><p>แผ่นล่างของ C1 มีประจุ \(-8\ \mu\text{C}\) แผ่นบนของ C2 มี \(+32\ \mu\text{C}\) ประจุสุทธิที่ P คือ \(+24\ \mu\text{C}\) ซึ่งไหลมาทางสายที่ต่อกับจุดกลางของตัวต้านทาน</p><p>ถ้าไม่มีสายเส้นนั้น ประจุสุทธิที่ P ต้องเป็นศูนย์ ตัวเก็บประจุจะแบ่งแรงดันตามส่วนกลับของความจุแทน คือ \(V_{C1} = 8\ \text{V},\ V_{C2} = 4\ \text{V}\)</p>` },
    { id: 'p19', l: 3, topic: 'วิธีแหล่งทดสอบ', title: 'เทวินินที่มีความต้านทานติดลบซ่อนอยู่', fig: () => P.negres(12, 4, 4, 0.25, 4, false), lab: () => P.negres(12, 4, 4, 0.25, 4, true),
      q: R`G1 ฉีดกระแส \(0.25\,v_x\) (A) ขึ้นเข้าโหนด a โดย \(v_x\) คือแรงดันคร่อม R2 (ขั้ว + ด้านบน) จงหา \(V_{th}\), \(R_{th}\) ที่ขั้ว a–b และกำลังสูงสุดที่ส่งให้โหลดได้`, ans: [{ t: R`\(V_{th}\)`, u: 'V', v: 12 }, { t: R`\(R_{th}\)`, u: 'Ω', v: 4 }, { t: R`\(P_{max}\)`, u: 'W', v: 9 }], hint: 'มีแหล่งจ่ายไม่อิสระ ห้ามดับ G1 ใช้ v_oc กับ i_sc หรือป้อนแหล่งทดสอบ',
      sol: R`<p>\(v_{oc}\): KCL ที่ a \(\dfrac{V-12}{4} + \dfrac{V}{4} - 0.25V = 0 \Rightarrow V = 12\ \text{V}\)</p><p>\(i_{sc}\): ลัดวงจร a–b ทำให้ \(v_x = 0\) G1 จึงเป็นศูนย์ \(i_{sc} = 12/4 = 3\ \text{A}\) ได้ \(R_{th} = 12/3 = 4\ \Omega\)</p><p>ตรวจด้วยแหล่งทดสอบ: \(i_t = \tfrac{v_t}{4} + \tfrac{v_t}{4} - 0.25v_t = \tfrac{v_t}{4}\) G1 ทำตัวเป็นความต้านทาน \(-4\ \Omega\) หักล้าง R2 พอดี \(P_{max} = \dfrac{12^2}{4(4)} = 9\ \text{W}\)</p>` },
    { id: 'p20', l: 3, topic: 'อันดับสอง', title: 'RLC อนุกรมแกว่งเกินเท่าใด', fig: () => P.rlc(), lab: () => P.rlc(), tran: true,
      q: R`วงจรเริ่มจากสภาวะเริ่มต้นเป็นศูนย์ จงหาอัตราส่วนการหน่วง \(\zeta\), เปอร์เซ็นต์การพุ่งเกินของ \(v_C\) และเวลาถึงยอด \(t_p\)`, ans: [{ t: R`\(\zeta\)`, u: '', v: 5 * Math.sqrt(1e-3) }, { t: R`\(\%OS\)`, u: '%', v: 100 * Math.exp(-Math.PI * 0.158113883 / Math.sqrt(1 - 0.025)) }, { t: R`\(t_p\)`, u: 'ms', v: 1000 * Math.PI / (3162.2777 * Math.sqrt(0.975)) }], hint: 'ζ = (R/2)√(C/L) และ %OS = 100·exp(−πζ/√(1−ζ²))',
      sol: R`<p>\(\omega_0 = 1/\sqrt{LC} = 1/\sqrt{10^{-7}} = 3162\ \text{rad/s}\) และ \(\zeta = \tfrac{10}{2}\sqrt{\tfrac{10^{-5}}{10^{-2}}} = 0.158\)</p><p>\(\%OS = 100\,e^{-\pi(0.158)/\sqrt{1-0.025}} = 60.5\%\) และ \(\omega_d = 3162\sqrt{0.975} = 3122\ \text{rad/s}\) ได้ \(t_p = \pi/\omega_d = 1.006\ \text{ms}\)</p><p>เปิดในแล็บแล้วเลื่อนเวลาไปที่ราว 1 ms จะเห็น v(C1) ขึ้นถึงประมาณ 16.05 V</p>` },
    { id: 'p21', l: 3, topic: 'ส่วนกลับ', title: 'สลับแหล่งจ่ายกับแอมมิเตอร์', svg: SVG_PORT,
      q: R`เครือข่ายตัวต้านทานล้วนที่ไม่ทราบโครงสร้างภายใน ต่อแหล่งจ่าย 10 V ที่พอร์ต 1 และลัดวงจรพอร์ต 2 ด้วยแอมมิเตอร์ อ่านได้ 2 A (ก) ถ้าย้ายแหล่งจ่าย 10 V ไปพอร์ต 2 และใช้แอมมิเตอร์ลัดวงจรพอร์ต 1 จะอ่านได้เท่าใด (ข) ถ้าแหล่งจ่ายในข้อ (ก) เป็น 25 V`, ans: [{ t: '(ก)', u: 'A', v: 2 }, { t: '(ข)', u: 'A', v: 5 }], hint: 'ทฤษฎีบทส่วนกลับใช้ได้กับเครือข่ายตัวต้านทานล้วน และวงจรเชิงเส้นตอบสนองแปรตามแหล่งจ่าย',
      sol: R`<p>(ก) ตามทฤษฎีบทส่วนกลับ ค่าความนำถ่ายโอน \(I_2/V_1 = I_1/V_2 = 0.2\ \text{S}\) จึงอ่านได้ 2 A โดยไม่ต้องรู้โครงสร้างภายในเลย</p><p>(ข) วงจรเชิงเส้น \(I_1 = 0.2(25) = 5\ \text{A}\)</p><p>ทฤษฎีบทนี้ไม่จริงสำหรับวงจรที่มีแหล่งจ่ายไม่อิสระ เช่น วงจรขยายทรานซิสเตอร์ ซึ่งส่งสัญญาณทางเดียว</p>` },

    { id: 'p22', l: 4, topic: 'สมมาตร', title: 'ลูกบาศก์ตัวต้านทาน', svg: SVG_CUBE,
      q: R`ตัวต้านทาน 1 Ω จำนวน 12 ตัวต่อเป็นขอบของลูกบาศก์ จงหาความต้านทานสมมูลระหว่างมุมตรงข้ามทแยงลูกบาศก์ A–G และระหว่างมุมที่ติดกัน A–B`, ans: [{ t: R`\(R_{AG}\)`, u: 'Ω', v: 5 / 6 }, { t: R`\(R_{AB}\)`, u: 'Ω', v: 7 / 12 }], hint: 'A–G: ป้อนกระแส I ที่ A แล้วดูว่ากระแสแยกกี่ทางในแต่ละชั้นตามสมมาตร A–B: ลองใช้ผลรวม R_eff ของทุกขอบ (ทฤษฎีบทของฟอสเตอร์)',
      sol: R`<p><b>A–G</b>: ป้อน \(I\) ที่ A กระแสแยกเท่ากันสามทาง \(I/3\) จุดยอดชั้นที่สองแต่ละจุดแยกต่ออีกสองทาง \(I/6\) แล้วรวมเข้า G สามทาง \(I/3\) เดินตามเส้นทางใดก็ได้ \(V_{AG} = \tfrac{I}{3} + \tfrac{I}{6} + \tfrac{I}{3} = \tfrac56 I\) จึงได้ \(R_{AG} = 5/6\ \Omega\)</p><p><b>A–B</b>: ทฤษฎีบทของฟอสเตอร์บอกว่า สำหรับเครือข่ายที่ต่อถึงกันซึ่งมี \(n\) จุดยอด ผลรวมของ \(R_{eff}/R\) ของทุกขอบเท่ากับ \(n-1\) ลูกบาศก์มี 8 จุดยอดและทุกขอบสมมาตรกัน \(12\,R_{AB} = 7\) ได้ \(R_{AB} = 7/12\ \Omega\)</p>` },
    { id: 'p23', l: 4, topic: 'เครือข่ายอนันต์', title: 'บันไดอนันต์', fig: () => P.ladderOpen(4, 1, 1), lab: () => P.ladder(6),
      q: R`บันไดยาวไม่สิ้นสุด ตัวต้านทานอนุกรมทุกตัวเป็น 1 Ω (ก) ถ้าตัวต้านทานขนาน \(R_p\) ทุกตัวเป็น 1 Ω จงหาความต้านทานขาเข้าที่ a–b (ข) ถ้า \(R_p\) ทุกตัวเป็น 2 Ω`, ans: [{ t: '(ก)', u: 'Ω', v: (1 + Math.sqrt(5)) / 2 }, { t: '(ข)', u: 'Ω', v: 2 }], hint: 'ตัดชั้นแรกออก ส่วนที่เหลือยังเป็นบันไดอนันต์แบบเดิม จึงมีความต้านทานขาเข้าเท่าเดิม',
      sol: R`\[R_{in} = R + \left(R_p \parallel R_{in}\right) \ \Rightarrow\ R_{in}^2 - R\,R_{in} - R\,R_p = 0 \ \Rightarrow\ R_{in} = \frac{R + \sqrt{R^2 + 4RR_p}}{2}\]<p>(ก) \(R_{in} = \tfrac{1+\sqrt5}{2} = 1.618\ \Omega\) คืออัตราส่วนทองคำ (ข) \(R_{in} = \tfrac{1+3}{2} = 2\ \Omega\) ในแล็บ บันได 6 ชั้นให้ 1.61806 Ω ลู่เข้าเร็วมาก</p>` },
    { id: 'p24', l: 4, topic: 'การซ้อนทับในเครือข่ายอนันต์', title: 'ตารางตัวต้านทานอนันต์', svg: SVG_GRID,
      q: R`ตารางสี่เหลี่ยมอนันต์สองมิติ ทุกเส้นเป็นตัวต้านทาน 1 Ω (ก) จงหาความต้านทานสมมูลระหว่างสองโหนดที่ติดกัน A–B (ข) ถ้าตัดตัวต้านทานที่ต่อตรงระหว่าง A กับ B ออก ความต้านทานระหว่าง A–B เป็นเท่าใด`, ans: [{ t: '(ก)', u: 'Ω', v: 0.5 }, { t: '(ข)', u: 'Ω', v: 1 }], hint: 'ป้อนกระแส I ที่ A ให้ไหลออกไปที่อนันต์ แล้วดึงกระแส I ออกที่ B จากอนันต์ แต่ละกรณีหาง่ายด้วยสมมาตร จากนั้นซ้อนทับ',
      sol: R`<p>ป้อน \(I\) ที่ A ให้ไหลไปอนันต์ สมมาตรสี่ทางทำให้ขอบ AB มีกระแส \(I/4\) ดึง \(I\) ออกที่ B จากอนันต์ ขอบ AB มีกระแส \(I/4\) ในทิศเดียวกันอีก ซ้อนทับได้ \(I/2\) ดังนั้น \(V_{AB} = \tfrac{I}{2}(1)\) และ \(R_{AB} = 0.5\ \Omega\)</p><p>(ข) \(0.5 = 1 \parallel R_{\text{ส่วนที่เหลือ}} \Rightarrow R_{\text{ส่วนที่เหลือ}} = 1\ \Omega\)</p>` },
    { id: 'p25', l: 4, topic: 'พลังงาน', title: 'ชาร์จตัวเก็บประจุให้เสียพลังงานน้อยลง',
      q: R`ชาร์จตัวเก็บประจุ 100 µF จาก 0 ถึง 10 V ผ่านตัวต้านทานค่าหนึ่ง (ก) ถ้าต่อแหล่งจ่าย 10 V โดยตรง พลังงานที่สูญเสียในตัวต้านทานเท่าใด (ข) ถ้าเพิ่มแรงดันแหล่งจ่ายเป็นขั้น 2, 4, 6, 8, 10 V และรอให้ชาร์จเต็มทุกขั้น พลังงานที่สูญเสียรวมเท่าใด`, ans: [{ t: '(ก)', u: 'mJ', v: 5 }, { t: '(ข)', u: 'mJ', v: 1 }], hint: 'แหล่งจ่ายส่งประจุ Q ที่แรงดันคงที่ จึงให้พลังงาน QV ทั้งหมด เทียบกับพลังงานที่ C เก็บได้',
      sol: R`<p>(ก) แหล่งจ่ายให้พลังงาน \(QV = CV^2 = 10\ \text{mJ}\) ตัวเก็บประจุเก็บได้ \(\tfrac12 CV^2 = 5\ \text{mJ}\) ส่วนที่เหลือ 5 mJ สูญเสียในตัวต้านทาน <b>ไม่ว่า R จะมีค่าเท่าใด</b></p><p>(ข) แต่ละขั้นเพิ่มแรงดัน \(\Delta V = V/N\) สูญเสีย \(\tfrac12 C(\Delta V)^2\) รวม \(N\cdot\tfrac12 C\left(\tfrac{V}{N}\right)^2 = \dfrac{\tfrac12 CV^2}{N} = 1\ \text{mJ}\) เมื่อ \(N\to\infty\) การสูญเสียเข้าใกล้ศูนย์ เป็นหลักของวงจรแบบ adiabatic charging</p>` },
    { id: 'p26', l: 4, topic: 'ทฤษฎีบทของฟอสเตอร์', title: 'ทรงสิบสองหน้าตัวต้านทาน',
      q: R`ตัวต้านทาน 1 Ω ต่อเป็นขอบของทรงสิบสองหน้าปกติ (20 จุดยอด 30 ขอบ) จงหาความต้านทานสมมูลระหว่างจุดยอดสองจุดที่ติดกัน`, ans: [{ t: R`\(R_{adj}\)`, u: 'Ω', v: 19 / 30 }], hint: 'ทฤษฎีบทของฟอสเตอร์: ผลรวม R_eff/R ของทุกขอบในเครือข่ายที่ต่อถึงกันเท่ากับ (จำนวนจุดยอด − 1)',
      sol: R`<p>ทุกขอบของทรงสิบสองหน้าเทียบเท่ากันโดยสมมาตร \(30\,R_{adj} = (20-1)(1\ \Omega)\) ได้ \(R_{adj} = 19/30 = 0.633\ \Omega\)</p><p>ตรวจสูตรเดียวกันกับรูปทรงที่รู้คำตอบ: ทรงสี่หน้า \(3/6 = 1/2\) ลูกบาศก์ \(7/12\) ทรงแปดหน้า \(5/12\) สูตรบรรทัดเดียวนี้แทนการแก้ระบบสมการ 19 ตัวแปร</p>` }
  ];

  /* ---------- progress ---------- */
  const KEY = 'dc-prog-v1';
  let prog = { solved: {}, best: 0 };
  try { prog = Object.assign(prog, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch (e) { } };
  function renderProgress() {
    const n = LIST.filter((p) => prog.solved[p.id]).length;
    $('prog-pill').innerHTML = 'ทำได้ <b>' + n + '</b> / ' + LIST.length + ' ข้อ';
    $('lvlbars').innerHTML = [1, 2, 3, 4].map((l) => { const all = LIST.filter((p) => p.l === l), d = all.filter((p) => prog.solved[p.id]).length; return '<div class="lvlbar">' + badge(l) + '<div class="dc-mono" style="margin-top:.3rem">' + d + ' / ' + all.length + '</div><div class="bar"><i style="width:' + (d / all.length * 100) + '%"></i></div></div>'; }).join('');
  }

  /* ---------- answer checking ---------- */
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
      fb.className = 'fb ' + (good ? 'ok' : 'no'); fb.textContent = good ? '✓ ถูกต้อง' : (Math.abs(x - a.v) <= Math.abs(a.v) * 0.1 ? '✗ ใกล้แล้ว ตรวจการปัดเศษหรือหน่วย' : (Math.abs(x + a.v) <= Math.abs(a.v) * 0.01 ? '✗ ค่าถูกแต่เครื่องหมายผิด' : '✗ ยังไม่ถูก')); if (!good) all = false;
    });
    return all;
  }

  /* ---------- render curated list ---------- */
  let filter = 0;
  function render() {
    const box = $('pb-list');
    box.innerHTML = LIST.map((p) => {
      const pre = 'a-' + p.id;
      let h = '<article class="prob" id="pb-' + p.id + '" data-l="' + p.l + '"><header>' + badge(p.l) + '<h4>' + p.title + '</h4><span class="topic">' + p.topic + '</span><span class="done"' + (prog.solved[p.id] ? '' : ' hidden') + '>ทำได้แล้ว</span></header><div class="bd">';
      h += '<p>' + p.q + '</p>';
      if (p.fig) h += '<figure class="dc-fig"><canvas data-fig="pb-' + p.id + '"></canvas></figure>';
      if (p.svg) h += '<figure class="dc-fig">' + p.svg + '</figure>';
      h += '<div class="ans">' + ansRows(pre, p.ans) + '</div>';
      h += '<div class="dc-btnrow"><button class="dc-btn pri" data-chk="' + p.id + '">ตรวจคำตอบ</button><button class="dc-btn" data-hint="' + p.id + '" aria-expanded="false">คำใบ้</button>' + (p.lab ? '<button class="dc-btn ghost" data-open="pbl-' + p.id + '">เปิดในแล็บ</button>' : '') + '</div>';
      h += '<p class="small" id="hint-' + p.id + '" hidden><b class="dc-tag">คำใบ้</b>' + p.hint + '</p>';
      h += '<details class="sol"><summary>เฉลยละเอียด</summary><div>' + p.sol + '</div></details></div></article>';
      return h;
    }).join('');
    for (const p of LIST) { if (p.fig) UI.addFig('pb-' + p.id, p.fig); if (p.lab) UI.addFig('pbl-' + p.id, p.lab, p.tran); }
    box.addEventListener('click', (e) => {
      const c = e.target.closest('[data-chk]'), hb = e.target.closest('[data-hint]');
      if (c) { const p = LIST.find((q) => q.id === c.dataset.chk); if (check('a-' + p.id, p.ans)) { prog.solved[p.id] = true; save(); document.querySelector('#pb-' + p.id + ' .done').hidden = false; renderProgress(); } }
      if (hb) { const el = $('hint-' + hb.dataset.hint); el.hidden = !el.hidden; hb.setAttribute('aria-expanded', String(!el.hidden)); }
    });
    box.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.ans-row input')) { const art = e.target.closest('.prob'); art.querySelector('[data-chk]').click(); } });
    UI.math(box); UI.drawFigures(); applyFilter();
  }
  function applyFilter() { document.querySelectorAll('#pb-list .prob').forEach((a) => a.hidden = filter && +a.dataset.l !== filter); }
  document.querySelectorAll('#pb-filter button').forEach((b) => b.onclick = () => { filter = +b.dataset.l; document.querySelectorAll('#pb-filter button').forEach((q) => q.classList.toggle('on', q === b)); applyFilter(); });

  /* ---------- unlimited practice ---------- */
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const RV = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];
  const n4 = (x) => Number((+x).toPrecision(4)).toString();
  const GENS = {
    sp: { name: 'อนุกรม–ขนาน', make() {
      const Vs = pick([6, 9, 12, 15, 24]), r1 = pick(RV), r2 = pick(RV), r3 = pick(RV); const rp = r2 * r3 / (r2 + r3), I = Vs / (r1 + rp), V3 = I * rp; const askI = Math.random() < 0.5;
      return { fig: () => P.seriesPar(Vs, r1, r2, r3), q: askI ? R`จงหากระแสที่แหล่งจ่ายจ่ายออกมา` : R`จงหาแรงดันคร่อม R3`, ans: [askI ? { t: R`\(I\)`, u: 'A', v: I } : { t: R`\(V_{R3}\)`, u: 'V', v: V3 }],
        sol: R`<p>\(R_2\parallel R_3 = \dfrac{${r2}\cdot${r3}}{${r2}+${r3}} = ${n4(rp)}\ \Omega\), \(R_{eq} = ${r1} + ${n4(rp)} = ${n4(r1 + rp)}\ \Omega\)</p><p>\(I = ${Vs}/${n4(r1 + rp)} = ${n4(I)}\ \text{A}\) และ \(V_{R3} = I\,(R_2\parallel R_3) = ${n4(V3)}\ \text{V}\)</p>` };
    } },
    node: { name: 'วิธีโหนด', make() {
      const Vs = pick([10, 12, 18, 20, 24]), a = pick(RV), b = pick(RV), c = pick(RV), d = pick(RV), Is = pick([0.5, 1, 1.5, 2, 3]);
      const circ = P.twoNode(Vs, a, b, c, d, Is); const r = DCE.solveDC(circ); const E = (l) => r.elem[circ.find((q) => q.lab === l).id];
      const V1 = E('R2').v, V2 = E('R4').v; const ask1 = Math.random() < 0.5;
      return { fig: () => P.twoNode(Vs, a, b, c, d, Is), lab: () => P.twoNode(Vs, a, b, c, d, Is), q: R`จงหาแรงดันโหนด ${ask1 ? R`\(V_1\)` : R`\(V_2\)`} เทียบกับกราวด์`, ans: [ask1 ? { t: R`\(V_1\)`, u: 'V', v: V1 } : { t: R`\(V_2\)`, u: 'V', v: V2 }],
        sol: R`\[\begin{bmatrix} \tfrac1{${a}}+\tfrac1{${b}}+\tfrac1{${c}} & -\tfrac1{${c}}\\[2pt] -\tfrac1{${c}} & \tfrac1{${c}}+\tfrac1{${d}}\end{bmatrix}\begin{bmatrix}V_1\\V_2\end{bmatrix} = \begin{bmatrix}${n4(Vs / a)}\\ ${Is}\end{bmatrix}\]<p>แก้ได้ \(V_1 = ${n4(V1)}\ \text{V}\) และ \(V_2 = ${n4(V2)}\ \text{V}\)</p>` };
    } },
    mesh: { name: 'วิธีเมช', make() {
      const V1 = pick([6, 8, 10, 12, 15, 20]), V2 = pick([2, 3, 4, 5, 6, 9]), r1 = pick(RV), r3 = pick(RV), r2 = pick(RV);
      const A = r1 + r3, B = -r3, D = r2 + r3, det = A * D - B * B; const I1 = (V1 * D - B * -V2) / det, I2 = (A * -V2 - B * V1) / det;
      return { fig: () => P.mesh(V1, r1, r3, r2, V2), lab: () => P.mesh(V1, r1, r3, r2, V2), q: R`กำหนดกระแสเมชตามเข็มนาฬิกา จงหากระแสที่ไหลลงผ่าน R3`, ans: [{ t: R`\(I_{R3}\)`, u: 'A', v: I1 - I2 }],
        sol: R`\[\begin{bmatrix}${A} & ${B}\\ ${B} & ${D}\end{bmatrix}\begin{bmatrix}I_1\\I_2\end{bmatrix} = \begin{bmatrix}${V1}\\ ${-V2}\end{bmatrix},\quad \Delta = ${det}\]<p>\(I_1 = ${n4(I1)}\ \text{A},\ I_2 = ${n4(I2)}\ \text{A}\) กระแสลงผ่าน R3 คือ \(I_1 - I_2 = ${n4(I1 - I2)}\ \text{A}\)</p>` };
    } },
    thev: { name: 'เทวินิน', make() {
      const Vs = pick([6, 9, 12, 18, 24, 30]), r1 = pick(RV), r2 = pick(RV), r3 = pick(RV); const Vth = Vs * r2 / (r1 + r2), Rth = r1 * r2 / (r1 + r2) + r3; const k = pick(['v', 'r', 'p']);
      const A = { v: { t: R`\(V_{th}\)`, u: 'V', v: Vth }, r: { t: R`\(R_{th}\)`, u: 'Ω', v: Rth }, p: { t: R`\(P_{max}\)`, u: 'W', v: Vth * Vth / (4 * Rth) } }[k];
      return { fig: () => P.thevenin(Vs, r1, r2, r3, 1, false), lab: () => P.thevenin(Vs, r1, r2, r3, Number(Rth.toPrecision(3)), true), q: k === 'p' ? R`จงหากำลังสูงสุดที่ส่งให้โหลดที่ต่อกับขั้ว a–b ได้` : R`จงหา ${A.t} ที่ขั้ว a–b`, ans: [A],
        sol: R`<p>\(V_{th} = ${Vs}\cdot\dfrac{${r2}}{${r1}+${r2}} = ${n4(Vth)}\ \text{V}\) และ \(R_{th} = (${r1}\parallel${r2}) + ${r3} = ${n4(Rth)}\ \Omega\)</p><p>\(P_{max} = \dfrac{V_{th}^2}{4R_{th}} = ${n4(Vth * Vth / (4 * Rth))}\ \text{W}\)</p>` };
    } },
    tran: { name: 'ทรานเซียนต์', make() {
      if (Math.random() < 0.5) {
        const Vs = pick([5, 10, 12, 24]), r = pick([1, 2.2, 4.7, 10, 22, 47]) * 1e3, c = pick([1, 2.2, 4.7, 10, 22, 47, 100]) * 1e-6, tau = r * c, t = Number((tau * pick([0.3, 0.5, 0.7, 1, 1.5, 2, 2.5, 3])).toPrecision(2)); const v = Vs * (1 - Math.exp(-t / tau));
        return { fig: () => P.rc(Vs, r, c), lab: () => P.rc(Vs, r, c), tran: true, q: R`ตัวเก็บประจุเริ่มที่ 0 V แหล่งจ่ายทำงานที่ \(t = 0\) จงหา \(v_C\) ที่ \(t = \text{${fmtSI(t, 's')}}\)`, ans: [{ t: R`\(v_C\)`, u: 'V', v }],
          sol: R`<p>\(\tau = RC = ${fmtSI(tau, 's', 4)}\) ได้ \(v_C = ${Vs}\left(1 - e^{-${n4(t / tau)}}\right) = ${n4(v)}\ \text{V}\)</p>` };
      }
      const Vs = pick([6, 12, 24]), r = pick([2, 4, 5, 10, 20]), l = pick([0.1, 0.2, 0.5, 1]), tau = l / r, t = Number((tau * pick([0.5, 1, 1.5, 2, 3])).toPrecision(2)); const i = Vs / r * (1 - Math.exp(-t / tau));
      return { fig: () => P.rl(Vs, r, l), lab: () => P.rl(Vs, r, l), tran: true, q: R`กระแสในตัวเหนี่ยวนำเริ่มที่ 0 A จงหา \(i_L\) ที่ \(t = \text{${fmtSI(t, 's')}}\)`, ans: [{ t: R`\(i_L\)`, u: 'A', v: i }],
        sol: R`<p>\(\tau = L/R = ${fmtSI(tau, 's', 4)}\) และ \(i(\infty) = ${Vs}/${r} = ${n4(Vs / r)}\ \text{A}\) ได้ \(i_L = ${n4(Vs / r)}\left(1 - e^{-${n4(t / tau)}}\right) = ${n4(i)}\ \text{A}\)</p>` };
    } }
  };
  let gkind = 'sp', cur = null, streak = 0, gcount = 0;
  function genNew() {
    cur = GENS[gkind].make(); gcount++;
    const key = 'g-fig-' + gcount; const keyL = 'g-lab-' + gcount; UI.addFig(key, cur.fig); if (cur.lab) UI.addFig(keyL, cur.lab, cur.tran);
    $('g-body').innerHTML = '<p>' + cur.q + '</p><figure class="dc-fig"><canvas data-fig="' + key + '"></canvas></figure><div class="ans">' + ansRows('g', cur.ans) + '</div><div class="dc-btnrow"><button class="dc-btn pri" id="g-chk">ตรวจคำตอบ</button><button class="dc-btn" id="g-new">ข้อใหม่</button>' + (cur.lab ? '<button class="dc-btn ghost" data-open="' + keyL + '">เปิดในแล็บ</button>' : '') + '</div><details class="sol" id="g-sol"><summary>ดูเฉลย (นับเป็นข้อที่ทำไม่ได้)</summary><div>' + cur.sol + '</div></details>';
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
  return { init, LIST };
})();

UI.init(); PB.init();
