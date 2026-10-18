/* Op-amp circuits virtual lab: schematic editor on a grid, DC / transient (scope) / frequency (Bode) analysis and the transfer function H(s).
   Needs oa-core.js (OAE, OK) and oa-draw.js (OAR). */
const LAB = (() => {
  const { TYPES, TWO, fmtSI, parseSI, key, opPins } = OAE;
  const $ = (id) => document.getElementById(id);
  const cv = $('lab-cv'), ctx = cv.getContext('2d'), wrap = $('lab-wrap'), tip = $('lab-tip');
  const st = { comps: [], tool: 'select', sel: null, hover: null, cols: 56, rows: 30, cell: 22, zoom: 0, iec: false, showVal: true, showNodes: false,
    dots: !matchMedia('(prefers-reduced-motion: reduce)').matches, mode: 'dc', res: null, tran: null, tIdx: 0, tEnd: null, autoT: true,
    undo: [], redo: [], drag: null, ghost: null, orient: 0, opRot: 0, opFlip: false, visible: true, playing: false, slots: new Map(),
    outId: null, srcId: null, ac: null, tf: null, tfKey: '', fmin: 10, fmax: 1e5, cmpIdeal: true, xy: false };
  let uid = 0; const nid = () => 'L' + (++uid);
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const math = (el) => { if (typeof renderMathInElement === 'function') { try { renderMathInElement(el, { delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false, strict: 'ignore' }); } catch (e) { } } };
  const tex = (t, display) => { try { return window.katex ? window.katex.renderToString(t, { displayMode: !!display, throwOnError: false, strict: 'ignore' }) : esc(t); } catch (e) { return esc(t); } };

  /* ---------- model helpers ---------- */
  function nextLabel(t) {
    const pre = TYPES[t].pre; let mx = 0; const re = new RegExp('^' + pre + '(\\d+)$');
    for (const c of st.comps) { const m = (c.lab || '').match(re); if (m) mx = Math.max(mx, +m[1]); }
    if (t === 'P' && !st.comps.some((c) => c.t === 'P' && c.lab === 'Vo')) return 'Vo';
    return pre + (mx + 1);
  }
  const snapshot = () => JSON.stringify(st.comps);
  function pushUndo() { st.undo.push(snapshot()); if (st.undo.length > 120) st.undo.shift(); st.redo = []; }
  function undo() { if (!st.undo.length) return; st.redo.push(snapshot()); st.comps = JSON.parse(st.undo.pop()); afterChange(true); }
  function redo() { if (!st.redo.length) return; st.undo.push(snapshot()); st.comps = JSON.parse(st.redo.pop()); afterChange(true); }
  function load(comps, opt = {}) {
    pushUndo();
    st.comps = comps.map((c) => { const n = Object.assign({}, c); n.id = nid(); return n; });
    st.sel = null; st.slots = new Map(); st.tran = null; st.tf = null; st.tfKey = ''; st.ac = null; st.outId = null; st.srcId = null; traces.v.clear(); traces.i.clear();
    if (opt.mode) setMode(opt.mode, true);
    if (opt.tEnd) { st.tEnd = opt.tEnd; st.autoT = false; $('lab-auto').checked = false; $('lab-tend').value = fmtSI(opt.tEnd, 's').replace(' ', ''); } else { st.autoT = true; $('lab-auto').checked = true; }
    if (opt.fmin) { st.fmin = opt.fmin; st.fmax = opt.fmax; $('lab-ac-fmin').value = fmtSI(st.fmin, '').replace(' ', ''); $('lab-ac-fmax').value = fmtSI(st.fmax, '').replace(' ', ''); }
    st.tIdx = 0;
    fitCircuit(); afterChange(true);
  }
  const byId = (id) => st.comps.find((c) => c.id === id);
  const pinsOf = (c) => (c.t === 'OP' ? opPins(c) : c.t === 'G' || c.t === 'P' || c.t === 'T' ? [[c.x1, c.y1]] : [[c.x1, c.y1], [c.x2, c.y2]]);

  /* ---------- geometry ---------- */
  function segDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy; let t = L2 ? ((px - x1) * dx + (py - y1) * dy) / L2 : 0; t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }
  function hit(wx, wy) {
    let best = null, bd = 0.5;
    for (const c of st.comps) {
      if (c.t === 'W') continue;
      let d;
      if (c.t === 'OP') d = Math.hypot(wx - c.x1, wy - c.y1) - 0.9;
      else if (c.t === 'T') d = Math.hypot(wx - c.x1, wy - c.y1) - 0.1;
      else if (c.t === 'P') d = Math.hypot(wx - c.x1, wy - c.y1) - 0.25;
      else if (c.t === 'G') d = Math.hypot(wx - c.x1, wy - (c.y1 + 0.55)) - 0.15;
      else d = segDist(wx, wy, c.x1, c.y1, c.x2, c.y2) - 0.1;
      if (d < bd) { bd = d; best = c; }
    }
    if (best) return best;
    bd = 0.32;
    for (const c of st.comps) if (c.t === 'W') { const d = segDist(wx, wy, c.x1, c.y1, c.x2, c.y2); if (d < bd) { bd = d; best = c; } }
    return best;
  }
  function world(e) { const r = cv.getBoundingClientRect(); return { wx: (e.clientX - r.left) / st.cell, wy: (e.clientY - r.top) / st.cell }; }
  const clampX = (x) => Math.max(0, Math.min(st.cols, x)), clampY = (y) => Math.max(0, Math.min(st.rows, y));

  /* ---------- sizing & drawing ---------- */
  // Choose the zoom so the whole circuit is visible without scrolling (phones) and as large as is comfortable on desktops.
  function fitCircuit() {
    const avail = wrap.clientWidth - 2; if (avail < 50) return;
    const base = Math.max(18, Math.min(30, Math.floor(avail / st.cols)));
    if (!st.comps.length) { st.zoom = 0; fit(); return; }
    const bb = OAR.bbox(st.comps); const need = Math.max(10, bb.x1 + 1.4);
    const cell = Math.max(11, Math.min(30, Math.floor(avail / need)));
    st.zoom = cell - base; fit(); wrap.scrollLeft = 0; wrap.scrollTop = 0;
  }
  function fit() {
    const avail = wrap.clientWidth - 2;
    const base = Math.max(18, Math.min(30, Math.floor(avail / st.cols)));
    st.cell = Math.max(11, Math.min(44, base + st.zoom));
    const W = st.cols * st.cell, H = st.rows * st.cell, dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }
  function displayRes() {
    if (st.mode !== 'tran') return st.res && st.res.ok ? st.res : null;
    const T = st.tran; if (!T || !T.ok) return null; const j = Math.min(st.tIdx, T.t.length - 1);
    const elem = {}; for (const id in T.el) { const v = T.el[id].v[j], i = T.el[id].i[j]; elem[id] = { v, i, p: v * i }; }
    const opx = {}; for (const id in T.opx) opx[id] = { st: T.opx[id].st[j], d: T.opx[id].d[j] };
    return { elem, nodeV: T.nodeV[j], net: T.net, opx };
  }
  let phase = 0, lastT = 0;
  function draw() {
    const W = st.cols * st.cell, H = st.rows * st.cell;
    ctx.clearRect(0, 0, W, H);
    OAR.draw(ctx, st.comps, { cell: st.cell, ox: 0, oy: 0, grid: true, cols: st.cols, rows: st.rows, iec: st.iec, showVal: st.showVal, showLab: true,
      res: st.mode === 'ac' ? (st.res && st.res.ok ? st.res : null) : displayRes(), nodeColor: true, sel: st.sel, hover: st.hover, phase, dots: st.dots && st.mode !== 'ac', nodeNames: st.showNodes, ghost: st.ghost });
  }
  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t;
    if (st.playing && st.tran && st.tran.ok) {
      const n = st.tran.t.length; st.tIdx = Math.min(n - 1, st.tIdx + Math.max(1, Math.round(n * dt / 5)));
      $('lab-scrub').value = st.tIdx; updateTimeReadout(); if (st.tIdx >= n - 1) { st.playing = false; $('lab-play').textContent = '▶ เล่น'; }
      renderSideResults(); drawPlots();
    }
    if (st.visible && (st.dots || st.playing) && displayRes() && st.mode !== 'ac') { phase += dt; draw(); }
    requestAnimationFrame(loop);
  }

  /* ---------- solving ---------- */
  let tranTimer = null, acTimer = null, tfTimer = null;
  function solve() {
    st.res = OAE.solveDC(st.comps);
    if (st.mode === 'tran') { clearTimeout(tranTimer); tranTimer = setTimeout(runTran, 120); }
    if (st.mode === 'ac') { clearTimeout(acTimer); acTimer = setTimeout(runAC, 120); }
    if (!$('pane-tf').hidden) { clearTimeout(tfTimer); tfTimer = setTimeout(renderTF, 160); }
    renderStatus(); renderTable(); renderMNA(); renderSideResults(); syncSelects();
  }
  function runTran() {
    if (st.autoT || !st.tEnd) { st.tEnd = OAE.autoTime(st.comps); $('lab-tend').value = fmtSI(st.tEnd, 's').replace(' ', ''); }
    st.tran = OAE.solveTran(st.comps, st.tEnd, 4000, 2000);
    const sc = $('lab-scrub'); if (st.tran.ok) { sc.max = st.tran.t.length - 1; st.tIdx = Math.min(st.tIdx || st.tran.t.length - 1, st.tran.t.length - 1); sc.value = st.tIdx; buildTraces(); }
    const has = st.comps.some((c) => c.t === 'L' || c.t === 'C' || c.t === 'OP' || ((c.t === 'V' || c.t === 'I') && c.w && c.w !== 'dc'));
    $('lab-tran-note').textContent = st.tran.ok ? (has ? 'เริ่มจากสถานะ DC ก่อนเปิดแหล่งสัญญาณ (ตัวเก็บประจุ/ตัวเหนี่ยวนำที่ตั้ง ic ไว้เริ่มที่ค่านั้น) · ขั้นเวลา h = ' + fmtSI(st.tran.h, 's') + ' (BDF2) · ออปแอมป์จำกัดที่แรงดันแหล่งจ่ายและ slew rate' : 'วงจรนี้ไม่มีส่วนที่เปลี่ยนตามเวลา ค่าทุกตัวคงที่') : st.tran.err;
    updateTimeReadout(); buildChips(); drawPlots(); renderSideResults(); renderTable(); renderStatus(); draw();
  }

  /* ---------- side panel ---------- */
  const typeName = (t) => (TYPES[t] ? TYPES[t].name : t);
  const unitOf = (t) => (TYPES[t] ? TYPES[t].unit : '');
  const opt = (v, cur, label) => '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + esc(label) + '</option>';
  const num = (v) => (v === undefined || v === null || v === '' ? '' : fmtSI(+v, '').replace(' ', ''));
  function renderProps() {
    const p = $('lab-props'); const c = byId(st.sel);
    if (!c) {
      const n = st.res && st.res.net ? st.res.net.n : 0; const m = st.comps.filter((q) => TWO.has(q.t)).length; const u = st.comps.filter((q) => q.t === 'OP').length;
      p.innerHTML = '<p class="side-h">วงจรบนกระดาน</p><dl class="kv"><dt>จำนวนโหนด (ไม่รวมกราวด์)</dt><dd>' + n + '</dd><dt>องค์ประกอบ</dt><dd>' + m + '</dd><dt>ออปแอมป์</dt><dd>' + u + '</dd><dt>ขนาดระบบสมการ</dt><dd>' + (st.res && st.res.sys ? st.res.sys.N + ' × ' + st.res.sys.N : '—') + '</dd></dl>' +
        '<p class="side-h">วิธีใช้</p><ol class="howto"><li>เลือกอุปกรณ์จากแถบเครื่องมือ แล้วแตะจุดบนกริดเพื่อวาง (ออปแอมป์วางโดยแตะที่กึ่งกลาง)</li><li>เลือก <b>สายไฟ</b> แล้วลากจากจุดหนึ่งไปอีกจุด สายที่ผ่านจุดกริดเดียวกันจะเชื่อมกัน (มีจุดดำแสดง)</li><li>แตะอุปกรณ์เพื่อแก้ค่า รูปคลื่น หรือรุ่นออปแอมป์ หมุน (R) พลิกขาอินพุต (F) หรือลบ (Delete)</li><li>วางกราวด์อย่างน้อยหนึ่งจุด และวางจุดวัด <b>Vo</b> ที่เอาต์พุต เพื่อดูสโคปและหา H(s)</li></ol>';
      return;
    }
    if (c.t === 'W') { p.innerHTML = '<p class="side-h">สายไฟ</p><p class="muted">สายไฟอุดมคติ ความต้านทานเป็นศูนย์ ทุกจุดบนสายมีศักย์เท่ากัน</p><div class="dc-btnrow"><button class="dc-btn" id="pp-del">ลบสาย</button></div>'; $('pp-del').onclick = delSel; return; }
    if (c.t === 'G') { p.innerHTML = '<p class="side-h">กราวด์</p><p class="muted">กำหนดให้โหนดนี้มีศักย์ 0 V เป็นจุดอ้างอิงของแรงดันโหนดทั้งหมด (ใช้เป็นขั้วร่วมของแหล่งจ่ายออปแอมป์ด้วย)</p><div class="dc-btnrow"><button class="dc-btn" id="pp-del">ลบ</button></div>'; $('pp-del').onclick = delSel; return; }
    let h = '<p class="side-h">' + esc(c.lab) + ' <span class="muted">· ' + typeName(c.t) + '</span></p>';
    h += '<label class="fld"><span>ชื่อ</span><input id="pp-lab" type="text" value="' + esc(c.lab) + '" maxlength="8"></label>';
    if (c.t === 'P') { h += '<p class="muted small">จุดวัดแรงดันเทียบกราวด์ ใช้เป็นเอาต์พุตของสโคป กราฟ Bode และฟังก์ชันถ่ายโอน H(s)</p><div class="dc-btnrow"><button class="dc-btn danger" id="pp-del">ลบ</button></div>'; p.innerHTML = h; bindProps(c); return; }
    if (c.t === 'OP') {
      const m = OAE.OPM[c.m] || OAE.OPM.ideal; const pr = OAE.opParams(c);
      h += '<label class="fld"><span>รุ่น / แบบจำลอง</span><select id="pp-model">' + Object.entries(OAE.OPM).map(([k, v]) => opt(k, c.m || 'ideal', v.name)).join('') + '</select></label>';
      h += '<div class="oa-two"><label class="fld"><span>V+ แหล่งจ่าย <em>V</em></span><input id="pp-vp" type="text" inputmode="decimal" value="' + (c.vp == null ? 15 : c.vp) + '"></label><label class="fld"><span>V− แหล่งจ่าย <em>V</em></span><input id="pp-vn" type="text" inputmode="decimal" value="' + (c.vn == null ? -15 : c.vn) + '"></label></div>';
      if (!m.ideal) {
        h += '<div class="oa-two"><label class="fld"><span>GBW <em>Hz</em></span><input id="pp-gbw" type="text" value="' + num(pr.gbw) + '"></label><label class="fld"><span>A₀ <em>V/V</em></span><input id="pp-a0" type="text" value="' + num(pr.A0) + '"></label></div>';
        h += '<div class="oa-two"><label class="fld"><span>Slew <em>V/µs</em></span><input id="pp-sr" type="text" value="' + (isFinite(pr.sr) ? Number((pr.sr / 1e6).toPrecision(3)) : '') + '"></label><label class="fld"><span>R<sub>out</sub> <em>Ω</em></span><input id="pp-rout" type="text" value="' + num(pr.rout) + '"></label></div>';
        h += '<p class="muted small">ขีดจำกัดเอาต์พุต ' + fmtSI(pr.vmin, 'V') + ' ถึง ' + fmtSI(pr.vmax, 'V') + ' · R<sub>in</sub> ' + fmtSI(pr.rin, 'Ω') + ' · ขั้วโดมิแนนต์ที่ ' + fmtSI(pr.wp / 2 / Math.PI, 'Hz') + '</p>';
      } else h += '<p class="muted small">อุดมคติ: อัตราขยาย ∞ ความถี่ไม่จำกัด v₊ = v₋ ถูกตัดที่แรงดันแหล่งจ่ายเท่านั้น (ใช้หาฟังก์ชันถ่ายโอนแบบสมบูรณ์)</p>';
      h += '<div class="dc-btnrow"><button class="dc-btn" id="pp-rot" title="หมุน 90° (R)">หมุน</button><button class="dc-btn" id="pp-flip" title="สลับขา + / − (F)">สลับ +/−</button><button class="dc-btn danger" id="pp-del" title="Delete">ลบ</button></div><div id="pp-res"></div>';
      p.innerHTML = h; bindProps(c); renderSideResults(); return;
    }
    const isMeter = c.t === 'A' || c.t === 'VM'; const isSrc = c.t === 'V' || c.t === 'I';
    if (isSrc) {
      const w = c.w || 'dc'; const u = unitOf(c.t);
      h += '<label class="fld"><span>รูปคลื่น</span><select id="pp-w">' + Object.entries(OAE.WAVES).map(([k, v]) => opt(k, w, v)).join('') + '</select></label>';
      h += '<label class="fld"><span>' + (w === 'dc' ? 'ค่า' : w === 'step' ? 'ขนาดสเต็ป' : 'แอมพลิจูด (ยอด)') + ' <em>' + u + '</em></span><input id="pp-val" type="text" inputmode="decimal" value="' + num(c.v) + '"><small id="pp-err" class="err" hidden>อ่านค่าไม่ได้ ลองพิมพ์ เช่น 100m, 2.5, 10u</small></label>';
      if (w !== 'dc') h += '<label class="fld"><span>ออฟเซ็ต DC <em>' + u + '</em></span><input id="pp-off" type="text" inputmode="decimal" value="' + num(c.off || 0) + '"></label>';
      if (['sin', 'sq', 'pulse', 'tri'].includes(w)) h += '<label class="fld"><span>ความถี่ <em>Hz</em></span><input id="pp-f" type="text" inputmode="decimal" value="' + num(c.f || 1000) + '"></label>';
      if (w === 'sq' || w === 'pulse') h += '<label class="fld"><span>ดิวตี้ (0–1)</span><input id="pp-duty" type="text" inputmode="decimal" value="' + (c.duty == null ? 0.5 : c.duty) + '"></label>';
      h += '<p class="muted small">' + (w === 'dc' ? 'ค่าคงที่ตลอดเวลา' : w === 'step' ? 'ค่า = ออฟเซ็ต ก่อน t = 0 และ ออฟเซ็ต + ขนาด หลังเปิดแหล่งจ่าย' : 'ค่า DC (โหมด DC และจุดเริ่มต้น) = ออฟเซ็ต') + ' · ในโหมดความถี่ แหล่งนี้เป็นอินพุตเมื่อเลือกใน “อินพุต”</p>';
    } else if (!isMeter) {
      h += '<label class="fld"><span>' + (c.t === 'D' ? 'แรงดันนำไฟ V<sub>f</sub>' : 'ค่า') + ' <em>' + unitOf(c.t) + '</em></span><input id="pp-val" type="text" inputmode="decimal" value="' + num(c.v) + '"><small id="pp-err" class="err" hidden>อ่านค่าไม่ได้ ลองพิมพ์ เช่น 4.7k, 10u, 2m</small></label>';
      if (c.t === 'C' || c.t === 'L') h += '<label class="fld"><span>เงื่อนไขเริ่มต้น ' + (c.t === 'C' ? 'v(0) <em>V</em>' : 'i(0) <em>A</em>') + '</span><input id="pp-ic" type="text" inputmode="decimal" value="' + (c.ic === undefined || c.ic === '' ? '' : num(c.ic)) + '" placeholder="ว่าง = ค่า DC"></label><p class="muted small">ตั้งค่านี้เพื่อเริ่มอินทิเกรเตอร์ที่ค่าที่ต้องการ (แรงดัน a − b ของตัวเก็บประจุ) เช่นในอนาล็อกคอมพิวเตอร์</p>';
    }
    h += '<div class="dc-btnrow"><button class="dc-btn" id="pp-rot" title="หมุน 90° (R)">หมุน</button><button class="dc-btn" id="pp-flip">กลับขั้ว</button><button class="dc-btn danger" id="pp-del" title="Delete">ลบ</button></div><div id="pp-res"></div>';
    p.innerHTML = h; bindProps(c); renderSideResults();
  }
  function bindProps(c) {
    const g = (id) => $(id);
    if (g('pp-lab')) g('pp-lab').onchange = (e) => { pushUndo(); c.lab = e.target.value.trim() || c.lab; afterChange(); };
    if (g('pp-val')) g('pp-val').onchange = (e) => {
      const v = parseSI(e.target.value);
      if (!isFinite(v) || (['R', 'L', 'C'].includes(c.t) && v <= 0)) { g('pp-err').hidden = false; return; }
      g('pp-err').hidden = true; pushUndo(); c.v = v; afterChange();
    };
    if (g('pp-w')) g('pp-w').onchange = (e) => { pushUndo(); c.w = e.target.value; if (c.f == null) c.f = 1000; if (c.off == null) c.off = 0; afterChange(); renderProps(); };
    if (g('pp-off')) g('pp-off').onchange = (e) => { const v = parseSI(e.target.value || '0'); if (isFinite(v)) { pushUndo(); c.off = v; afterChange(); } };
    if (g('pp-f')) g('pp-f').onchange = (e) => { const v = parseSI(e.target.value); if (isFinite(v) && v > 0) { pushUndo(); c.f = v; afterChange(); } };
    if (g('pp-duty')) g('pp-duty').onchange = (e) => { const v = parseFloat(e.target.value); if (isFinite(v) && v > 0 && v < 1) { pushUndo(); c.duty = v; afterChange(); } };
    if (g('pp-ic')) g('pp-ic').onchange = (e) => { const t = e.target.value.trim(); pushUndo(); if (t === '') delete c.ic; else { const v = parseSI(t); if (isFinite(v)) c.ic = v; } afterChange(); };
    if (g('pp-model')) g('pp-model').onchange = (e) => { pushUndo(); c.m = e.target.value; delete c.p; afterChange(); renderProps(); };
    const rail = (id, k) => { if (g(id)) g(id).onchange = (e) => { const v = parseFloat(e.target.value); if (isFinite(v)) { pushUndo(); c[k] = v; afterChange(); renderProps(); } }; };
    rail('pp-vp', 'vp'); rail('pp-vn', 'vn');
    const ov = (id, k, mul) => { if (g(id)) g(id).onchange = (e) => { const v = parseSI(e.target.value); if (isFinite(v) && v >= 0) { pushUndo(); c.p = Object.assign({}, c.p || {}, { [k]: v * mul }); afterChange(); renderProps(); } }; };
    ov('pp-gbw', 'gbw', 1); ov('pp-a0', 'A0', 1); ov('pp-rout', 'rout', 1);
    if (g('pp-sr')) g('pp-sr').onchange = (e) => { const v = parseFloat(e.target.value); if (isFinite(v) && v > 0) { pushUndo(); c.p = Object.assign({}, c.p || {}, { sr: v * 1e6 }); afterChange(); renderProps(); } };
    if (g('pp-rot')) g('pp-rot').onclick = rotSel; if (g('pp-flip')) g('pp-flip').onclick = flipSel; if (g('pp-del')) g('pp-del').onclick = delSel;
  }
  function renderSideResults() {
    const box = $('pp-res'); if (!box) return; const c = byId(st.sel); const R = displayRes(); if (!c || !R || !R.elem || !R.elem[c.id]) { box.innerHTML = ''; return; }
    const r = R.elem[c.id]; const isOp = c.t === 'OP';
    box.innerHTML = '<p class="side-h">ผลการวิเคราะห์' + (st.mode === 'tran' && st.tran && st.tran.ok ? ' ที่ t = ' + fmtSI(st.tran.t[st.tIdx], 's') : '') + '</p><dl class="kv dc-mono"><dt>' + (isOp ? 'v ขาออก (เทียบกราวด์)' : 'v (ปลายแรก − ปลายสอง)') + '</dt><dd>' + fmtSI(r.v, 'V', 4) + '</dd><dt>' + (isOp ? 'i ที่ออปแอมป์จ่ายออก' : 'i (ปลายแรก → ปลายสอง)') + '</dt><dd>' + fmtSI(r.i, 'A', 4) + '</dd><dt>p ดูดกลืน = v·i</dt><dd>' + fmtSI(r.p, 'W', 4) + (r.p < -1e-15 ? ' <span class="tag-src">จ่ายกำลัง</span>' : '') + '</dd>' + (isOp && R.opx && R.opx[c.id] ? '<dt>v₊ − v₋</dt><dd>' + fmtSI(R.opx[c.id].d, 'V', 3) + '</dd><dt>สถานะ</dt><dd>' + (R.opx[c.id].st > 0 ? 'อิ่มตัวบน' : R.opx[c.id].st < 0 ? 'อิ่มตัวล่าง' : 'ช่วงเชิงเส้น') + '</dd>' : '') + '</dl>';
  }

  /* ---------- status, table, MNA ---------- */
  function renderStatus() {
    const s = $('lab-status'); const r = st.res; let h = '';
    if (!r) { s.innerHTML = ''; return; }
    if (!r.ok && r.net && !r.net.elems.length && !r.net.ops.length) { s.innerHTML = '<span class="pill warn">กระดานว่าง</span> เลือกอุปกรณ์จากแถบเครื่องมือ แล้วแตะบนกริดเพื่อเริ่มต่อวงจร หรือเลือกวงจรตัวอย่าง'; return; }
    if (!r.ok) h += '<span class="pill bad">แก้ไม่ได้</span> ' + esc(r.err);
    else h += '<span class="pill ok">แก้ได้</span> ' + r.net.n + ' โหนด · ระบบสมการ MNA ขนาด ' + r.sys.N + ' × ' + r.sys.N + ' · จุดทำงาน DC (ตัวเก็บประจุเปิดวงจร ตัวเหนี่ยวนำลัดวงจร)';
    for (const w of (r.warnings || [])) h += '<br><span class="pill warn">ข้อสังเกต</span> ' + esc(w);
    if (st.mode === 'tran' && st.tran && st.tran.ok) for (const w of st.tran.warnings) h += '<br><span class="pill warn">สโคป</span> ' + esc(w);
    if (st.mode === 'tran' && st.tran && !st.tran.ok) h += '<br><span class="pill bad">ทรานเซียนต์</span> ' + esc(st.tran.err);
    s.innerHTML = h;
  }
  function renderTable() {
    const box = $('lab-table'); const R = displayRes(); const els = st.comps.filter((c) => TWO.has(c.t) || c.t === 'OP');
    if (st.mode === 'ac') { /* show DC bias table */ }
    const RR = st.mode === 'ac' ? (st.res && st.res.ok ? st.res : null) : R;
    if (!RR || !els.length) { box.innerHTML = '<p class="muted">' + (st.res && !st.res.ok ? 'ยังไม่มีผลลัพธ์ เพราะระบบสมการแก้ไม่ได้' : 'วางอุปกรณ์อย่างน้อยหนึ่งตัวเพื่อเริ่มวิเคราะห์') + '</p>'; return; }
    let sum = 0, sup = 0;
    let h = '<div class="dc-tbl-wrap"><table class="dc-tbl"><thead><tr><th>ชื่อ</th><th>ชนิด</th><th class="dc-num">ค่า</th><th class="dc-num">v</th><th class="dc-num">i</th><th class="dc-num">p ดูดกลืน</th></tr></thead><tbody>';
    for (const c of els) {
      const r = RR.elem[c.id]; if (!r) continue; sum += r.p; if (r.p < 0) sup -= r.p;
      const val = c.t === 'OP' ? (OAE.OPM[c.m] || OAE.OPM.ideal).short : c.t === 'A' || c.t === 'VM' ? '—' : esc(OAR.valueText(c));
      h += '<tr' + (c.id === st.sel ? ' class="on"' : '') + ' data-id="' + c.id + '"><td><b>' + esc(c.lab) + '</b></td><td>' + typeName(c.t).split(' ')[0] + '</td><td class="dc-num">' + val + '</td><td class="dc-num">' + fmtSI(r.v, 'V', 4) + '</td><td class="dc-num">' + fmtSI(r.i, 'A', 4) + '</td><td class="dc-num' + (r.p < -1e-15 ? ' src' : '') + '">' + fmtSI(r.p, 'W', 4) + '</td></tr>';
    }
    h += '</tbody></table></div><p class="balance">ผลรวมกำลังทุกองค์ประกอบ Σp = ' + fmtSI(Math.abs(sum) < sup * 1e-9 ? 0 : sum, 'W', 3) + ' ' + (Math.abs(sum) <= Math.max(1e-12, sup * 1e-6) ? '<span class="pill ok">สมดุล</span>' : '<span class="pill warn">ตรวจสอบ</span>') + ' · แถวออปแอมป์: v = แรงดันขาออก i = กระแสที่จ่ายออก p ติดลบ = ดึงกำลังจากแหล่งจ่าย ± ของออปแอมป์มาให้วงจร</p>';
    const nv = RR.nodeV || []; if (nv.length) h += '<div class="dc-chips">' + nv.map((v, i) => '<span class="dc-chip dc-mono">n' + (i + 1) + ' = ' + fmtSI(v, 'V', 4) + '</span>').join('') + '<span class="dc-chip dc-mono">กราวด์ = 0 V</span></div>';
    box.innerHTML = h;
    box.querySelectorAll('tr[data-id]').forEach((tr) => tr.onclick = () => { st.sel = tr.dataset.id; renderProps(); renderTable(); draw(); });
  }
  function renderMNA() {
    const box = $('lab-mna'); const r = st.res;
    if (!r || !r.sys) { box.innerHTML = '<p class="muted">ยังไม่มีระบบสมการ</p>'; return; }
    const { A, z, n, N, brLabel } = r.sys;
    if (N > 26) { box.innerHTML = '<p class="muted">ระบบสมการมีขนาด ' + N + ' × ' + N + ' ใหญ่เกินกว่าจะแสดงอ่านได้สะดวก ลองลดจำนวนองค์ประกอบ</p>'; return; }
    const unk = []; for (let k = 0; k < n; k++) unk.push('v<sub>' + (k + 1) + '</sub>'); for (const e of brLabel) unk.push('i<sub>' + esc(e.lab) + '</sub>');
    const fmt = (v) => { if (Math.abs(v) < 1e-15) return '<span class="z">·</span>'; const s = Math.abs(v) >= 1e4 || Math.abs(v) < 1e-3 ? v.toExponential(2) : Number(v.toPrecision(4)).toString(); return s; };
    let h = '<div class="dc-tbl-wrap"><table class="mna"><thead><tr><th></th>' + unk.map((u) => '<th>' + u + '</th>').join('') + '<th class="eq"></th><th>z</th></tr></thead><tbody>';
    for (let i = 0; i < N; i++) {
      const lab = i < n ? 'KCL โหนด ' + (i + 1) : (brLabel[i - n].t === 'OP' ? 'ออปแอมป์ ' : 'กิ่ง ') + esc(brLabel[i - n].lab);
      h += '<tr' + (i === n ? ' class="sep"' : '') + '><th>' + lab + '</th>' + A[i].map((v, j) => '<td>' + fmt(i === j && i < n ? v - 1e-12 : v) + '</td>').join('') + '<td class="eq">' + (i === 0 ? '=' : '') + '</td><td>' + fmt(z[i]) + '</td></tr>';
    }
    h += '</tbody></table></div>';
    h += '<p class="muted small">แถวบน ' + n + ' แถวคือ KCL ที่แต่ละโหนด ส่วนแถวล่างคือสมการของกิ่งที่ต้องรู้กระแส: แหล่งจ่ายแรงดัน แอมมิเตอร์ ตัวเหนี่ยวนำ (ลัดวงจรใน DC) และ <b>ออปแอมป์</b> ซึ่งในแบบอุดมคติคือแถว v₊ − v₋ = 0 (นัลเลเตอร์) ส่วนแบบจริงคือ v<sub>o</sub> = A₀(v₊ − v₋) ผ่าน R<sub>out</sub>' + (r.x ? ' · คำตอบ: ' + unk.map((u, k) => u + ' = ' + (k < n ? fmtSI(r.x[k], 'V', 4) : fmtSI(r.x[k], 'A', 4))).join(', ') : '') + '</p>';
    box.innerHTML = h;
  }

  /* ---------- trace selection ---------- */
  const SER = ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6', '--s7', '--s8'];
  const traces = { v: new Set(), i: new Set() };
  function slotOf(id) { if (!st.slots.has(id)) st.slots.set(id, st.slots.size % 8); return st.slots.get(id); }
  /* voltage traces: probes, op-amp outputs, V sources, voltmeters */
  function vTraceList() {
    const T = st.tran; if (!T || !T.ok) return [];
    const out = [];
    for (const c of st.comps) {
      if (c.t === 'P') { const k = T.net.nodeOfKey(key(c.x1, c.y1)); if (k !== undefined) out.push({ id: c.id, name: c.lab, arr: T.nodeV.map((v) => (k < 0 ? 0 : v[k])), kind: 'P' }); }
      else if (c.t === 'OP') out.push({ id: c.id, name: c.lab + ' ออก', arr: T.el[c.id].v, kind: 'OP' });
      else if (c.t === 'V' && T.el[c.id]) out.push({ id: c.id, name: c.lab, arr: T.el[c.id].v, kind: 'V' });
      else if (c.t === 'VM' && T.el[c.id]) out.push({ id: c.id, name: c.lab, arr: T.el[c.id].v, kind: 'VM' });
    }
    return out;
  }
  function iTraceList() { const T = st.tran; if (!T || !T.ok) return []; return st.comps.filter((c) => (TWO.has(c.t) || c.t === 'OP') && c.t !== 'VM' && T.el[c.id]).map((c) => ({ id: c.id, name: c.lab, arr: T.el[c.id].i, kind: c.t })); }
  function buildTraces() {
    const vl = vTraceList(), il = iTraceList();
    for (const k of ['v', 'i']) for (const id of [...traces[k]]) if (!byId(id)) traces[k].delete(id);
    if (!traces.v.size) {
      const pr = vl.filter((t) => t.kind === 'P'), vs = vl.filter((t) => t.kind === 'V');
      for (const t of vs.slice(0, 1)) traces.v.add(t.id); for (const t of pr.slice(0, 4)) traces.v.add(t.id);
      if (!pr.length) for (const t of vl.filter((q) => q.kind === 'OP').slice(0, 3)) traces.v.add(t.id);
    }
    st.vl = vl; st.il = il;
  }
  function buildChips() {
    const cs = getComputedStyle(DCROOT());
    for (const [k, list] of [['v', st.vl || []], ['i', st.il || []]]) {
      const box = $('lab-chips-' + k);
      box.innerHTML = list.map((c) => { const on = traces[k].has(c.id); const col = cs.getPropertyValue(SER[slotOf(c.id)]).trim(); return '<button class="tchip' + (on ? ' on' : '') + '" data-k="' + k + '" data-id="' + c.id + '" aria-pressed="' + on + '"><i style="background:' + (on ? col : 'transparent') + ';border-color:' + col + '"></i>' + (k === 'v' ? 'v' : 'i') + '(' + esc(c.name) + ')</button>'; }).join('');
      box.querySelectorAll('.tchip').forEach((b) => b.onclick = () => { const s = traces[b.dataset.k]; if (s.has(b.dataset.id)) s.delete(b.dataset.id); else if (s.size < 8) s.add(b.dataset.id); buildChips(); drawPlots(); });
    }
    const xs = (st.vl || []); const keep = [$('lab-xy-x').value, $('lab-xy-y').value];
    const optx = xs.map((t) => '<option value="' + t.id + '">' + esc(t.name) + '</option>').join('');
    $('lab-xy-x').innerHTML = optx; $('lab-xy-y').innerHTML = optx;
    const pick = (cur, dflt) => (xs.some((t) => t.id === cur) ? cur : dflt);
    const pr = xs.filter((t) => t.kind === 'P');
    $('lab-xy-x').value = pick(keep[0], (pr[0] || xs[0] || {}).id); $('lab-xy-y').value = pick(keep[1], (pr[1] || pr[0] || xs[1] || xs[0] || {}).id);
  }
  function niceTicks(lo, hi, n = 5) {
    if (hi - lo < 1e-15) { hi = lo + 1; lo = lo - 1; }
    const span = hi - lo, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0))); const f = step0 / mag;
    const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag; const t0 = Math.ceil(lo / step - 1e-9) * step; const out = [];
    for (let t = t0; t <= hi + step * 1e-6; t += step) out.push(Math.abs(t) < step * 1e-9 ? 0 : t); return out;
  }
  const cssv = (n) => getComputedStyle(DCROOT()).getPropertyValue(n).trim();
  function prep(pc, H) { const box = pc.parentElement; const W = Math.max(240, box.clientWidth - 12), dpr = window.devicePixelRatio || 1; pc.width = W * dpr; pc.height = H * dpr; pc.style.width = W + 'px'; pc.style.height = H + 'px'; const g = pc.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); return { g, W, H }; }
  function drawPlots() { drawPlot($('lab-plot-v'), 'v'); if ($('lab-i-box').open) drawPlot($('lab-plot-i'), 'i'); drawXY(); }
  function drawPlot(pc, k) {
    const T = st.tran; const { g, W, H } = prep(pc, k === 'v' ? 230 : 170); const C = cssv;
    if (!T || !T.ok) { g.fillStyle = C('--ink-3'); g.font = '13px "IBM Plex Sans Thai",sans-serif'; g.fillText('ยังไม่มีผลจำลอง', 12, 24); return; }
    const list = (k === 'v' ? st.vl : st.il) || []; const sel = list.filter((t) => traces[k].has(t.id));
    const L = 60, Rr = 12, Tp = 14, B = 30; const pw = W - L - Rr, ph = H - Tp - B;
    let lo = 0, hi = 0; for (const t of sel) for (const v of t.arr) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const pad = (hi - lo) * 0.08 || 1; const yt = niceTicks(lo - (lo < 0 ? pad : 0), hi + pad, 4); const y0 = Math.min(yt[0], lo), y1 = Math.max(yt[yt.length - 1], hi);
    const tEnd = T.t[T.t.length - 1]; const xt = niceTicks(0, tEnd, 6);
    const px = (t) => L + (t / tEnd) * pw, py = (v) => Tp + ph - ((v - y0) / (y1 - y0)) * ph;
    g.font = '11px "IBM Plex Mono",monospace'; g.textBaseline = 'middle'; g.strokeStyle = C('--grid-2'); g.lineWidth = 1; g.fillStyle = C('--ink-3');
    for (const v of yt) { if (v < y0 - 1e-12 || v > y1 + 1e-12) continue; const y = Math.round(py(v)) + 0.5; g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke(); g.textAlign = 'right'; g.fillText(fmtSI(v, k === 'v' ? 'V' : 'A', 3), L - 6, y); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const t of xt) { if (t > tEnd * 1.0001) continue; const x = Math.round(px(t)) + 0.5; g.beginPath(); g.moveTo(x, Tp + ph); g.lineTo(x, Tp + ph + 4); g.stroke(); g.fillText(fmtSI(t, 's', 3), x, Tp + ph + 7); }
    g.strokeStyle = C('--ink-3'); g.beginPath(); g.moveTo(L + 0.5, Tp); g.lineTo(L + 0.5, Tp + ph + 0.5); g.lineTo(L + pw, Tp + ph + 0.5); g.stroke();
    if (k === 'v') { // rails of the op-amps whose output is plotted
      g.save(); g.setLineDash([3, 4]); g.strokeStyle = C('--rule'); const seen = new Set();
      for (const c of st.comps) if (c.t === 'OP' && traces.v.has(c.id)) { const P = OAE.opParams(c); for (const v of [P.vmax, P.vmin]) { const key2 = v.toFixed(3); if (seen.has(key2) || v > y1 || v < y0) continue; seen.add(key2); const y = Math.round(py(v)) + 0.5; g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke(); } }
      g.restore();
    }
    for (const t of sel) { g.strokeStyle = C(SER[slotOf(t.id)]); g.lineWidth = 2; g.beginPath(); t.arr.forEach((v, j) => { const x = px(T.t[j]), y = py(v); j ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); }
    const xc = px(T.t[Math.min(st.tIdx, T.t.length - 1)]); g.strokeStyle = C('--copper'); g.lineWidth = 1.5; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(xc, Tp); g.lineTo(xc, Tp + ph); g.stroke(); g.setLineDash([]);
    for (const t of sel) { const v = t.arr[Math.min(st.tIdx, t.arr.length - 1)]; g.fillStyle = C(SER[slotOf(t.id)]); g.strokeStyle = C('--sheet'); g.lineWidth = 2; g.beginPath(); g.arc(xc, py(v), 4.5, 0, 7); g.fill(); g.stroke(); }
    g.fillStyle = C('--ink-2'); g.font = '600 12px "IBM Plex Sans Thai",sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(k === 'v' ? 'แรงดัน (สโคป)' : 'กระแส', L + 6, Tp + 2);
    pc._map = { L, pw, tEnd, k };
  }
  function drawXY() {
    const pc = $('lab-plot-xy'); $('lab-xy-box').hidden = !st.xy; if (!st.xy) return;
    const { g, W, H } = prep(pc, 300); const C = cssv; const T = st.tran; const vl = st.vl || [];
    const tx = vl.find((t) => t.id === $('lab-xy-x').value), ty = vl.find((t) => t.id === $('lab-xy-y').value);
    if (!T || !T.ok || !tx || !ty) { g.fillStyle = C('--ink-3'); g.font = '13px "IBM Plex Sans Thai",sans-serif'; g.fillText('เลือกสองสัญญาณสำหรับแกน X และ Y', 12, 24); return; }
    const L = 60, B = 34, Tp = 14, Rr = 14; const pw = W - L - Rr, ph = H - Tp - B;
    const lim = (a) => { let lo = Math.min(0, ...a), hi = Math.max(0, ...a); const p = (hi - lo) * 0.08 || 1; const t = niceTicks(lo - (lo < 0 ? p : 0), hi + p, 4); return [Math.min(t[0], lo), Math.max(t[t.length - 1], hi), t]; };
    const [x0, x1, xt] = lim(tx.arr), [y0, y1, yt] = lim(ty.arr);
    const px = (v) => L + ((v - x0) / (x1 - x0)) * pw, py = (v) => Tp + ph - ((v - y0) / (y1 - y0)) * ph;
    g.font = '11px "IBM Plex Mono",monospace'; g.strokeStyle = C('--grid-2'); g.fillStyle = C('--ink-3'); g.lineWidth = 1;
    g.textAlign = 'right'; g.textBaseline = 'middle'; for (const v of yt) { if (v < y0 - 1e-12 || v > y1 + 1e-12) continue; const y = Math.round(py(v)) + 0.5; g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke(); g.fillText(fmtSI(v, 'V', 3), L - 6, y); }
    g.textAlign = 'center'; g.textBaseline = 'top'; for (const v of xt) { if (v < x0 - 1e-12 || v > x1 + 1e-12) continue; const x = Math.round(px(v)) + 0.5; g.beginPath(); g.moveTo(x, Tp); g.lineTo(x, Tp + ph); g.stroke(); g.fillText(fmtSI(v, 'V', 3), x, Tp + ph + 6); }
    g.strokeStyle = C('--ink-3'); g.strokeRect(L + 0.5, Tp + 0.5, pw, ph);
    g.strokeStyle = C('--s1'); g.lineWidth = 2; g.beginPath(); tx.arr.forEach((v, j) => { const x = px(v), y = py(ty.arr[j]); j ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    const j = Math.min(st.tIdx, tx.arr.length - 1); g.fillStyle = C('--copper'); g.strokeStyle = C('--sheet'); g.lineWidth = 2; g.beginPath(); g.arc(px(tx.arr[j]), py(ty.arr[j]), 5, 0, 7); g.fill(); g.stroke();
    g.fillStyle = C('--ink-2'); g.font = '600 12px "IBM Plex Sans Thai",sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('แกน X = ' + tx.name + ' · แกน Y = ' + ty.name + ' (วงโคจรเฟส)', L + 6, Tp + 2);
  }
  function plotPointer(e) {
    const pc = e.currentTarget; const m = pc._map; if (!m || !st.tran || !st.tran.ok) return;
    const r = pc.getBoundingClientRect(); const t = Math.max(0, Math.min(m.tEnd, ((e.clientX - r.left - m.L) / m.pw) * m.tEnd));
    const T = st.tran.t; let j = 0; while (j < T.length - 1 && T[j] < t) j++;
    if (e.type === 'pointerdown' || e.buttons) { st.tIdx = j; $('lab-scrub').value = j; updateTimeReadout(); drawPlots(); renderSideResults(); renderTable(); draw(); }
    const list = (m.k === 'v' ? st.vl : st.il) || []; const sel = list.filter((q) => traces[m.k].has(q.id));
    const ptip = $('lab-ptip');
    ptip.innerHTML = '<b>t = ' + fmtSI(T[j], 's', 4) + '</b><br>' + sel.map((q) => esc(q.name) + ': ' + fmtSI(q.arr[j], m.k === 'v' ? 'V' : 'A', 4)).join('<br>');
    ptip.hidden = false; const br = pc.parentElement.parentElement.getBoundingClientRect();
    ptip.style.left = Math.min(br.width - 170, e.clientX - br.left + 14) + 'px'; ptip.style.top = (e.clientY - br.top + 10) + 'px';
  }
  function updateTimeReadout() { if (st.tran && st.tran.ok) $('lab-time').textContent = 't = ' + fmtSI(st.tran.t[st.tIdx], 's', 4) + ' / ' + fmtSI(st.tran.t[st.tran.t.length - 1], 's', 3); }

  /* ---------- frequency response (Bode) ---------- */
  function syncSelects() {
    const outs = OAE.listOutputs(st.comps), ins = OAE.listInputs(st.comps);
    if (!outs.some((o) => o.id === st.outId)) { const vo = outs.find((o) => /^Vo/.test(o.name)) || outs.find((o) => o.name === 'Vb') || outs.filter((o) => o.name && !/ออก/.test(o.name)).slice(-1)[0] || outs[outs.length - 1]; st.outId = vo ? vo.id : null; }
    if (!ins.some((o) => o.id === st.srcId)) { const s = ins.find((q) => q.w !== 'dc') || ins[0]; st.srcId = s ? s.id : null; }
    const fill = (sel, items, cur, f) => { const h = items.map((o) => '<option value="' + o.id + '"' + (o.id === cur ? ' selected' : '') + '>' + esc(f(o)) + '</option>').join(''); if (sel.dataset.h !== h) { sel.innerHTML = h; sel.dataset.h = h; } sel.value = cur || ''; };
    fill($('lab-ac-out'), outs, st.outId, (o) => o.name); fill($('lab-tf-out'), outs, st.outId, (o) => o.name); fill($('lab-ac-src'), ins, st.srcId, (o) => o.lab);
  }
  function runAC() {
    if (!st.outId) { st.ac = { ok: false, err: 'วางจุดวัดแรงดัน Vo (Probe) ที่เอาต์พุตของวงจรก่อน' }; drawBode(); renderACNote(); return; }
    const o = { outId: st.outId, srcId: st.srcId, fmin: st.fmin, fmax: st.fmax, ppd: 28 };
    const r = OAE.acSweep(st.comps, o); st.ac = r;
    st.acIdeal = null; if (r.ok && st.cmpIdeal && st.comps.some((c) => c.t === 'OP' && c.m && c.m !== 'ideal')) { const q = OAE.acSweep(st.comps, Object.assign({ forceIdeal: true }, o)); if (q.ok) st.acIdeal = q; }
    st.acTF = null; try { const t = OAE.transferFunctions(st.comps, st.outId); if (t.ok) st.acTF = t.tfs.find((q) => q.srcId === st.srcId) || t.tfs[0]; } catch (e) { }
    drawBode(); renderACNote();
  }
  function renderACNote() {
    const a = st.ac; const el = $('lab-ac-note');
    if (!a) { el.textContent = ''; return; }
    if (!a.ok) { el.textContent = a.err; return; }
    let h = 'อินพุต ' + esc(a.src.lab) + ' → เอาต์พุต ' + esc(a.outName) + ' · แก้ที่จุดทำงาน DC แล้วหาผลตอบสนองสัญญาณเล็กด้วย MNA เชิงซ้อน (s = jω)';
    const m0 = a.db[0], mx = Math.max(...a.db); const i3 = a.db.findIndex((d, i) => i > a.db.indexOf(mx) && d <= mx - 3.0103);
    h += ' · อัตราขยายสูงสุด ' + mx.toFixed(2) + ' dB (' + (Math.pow(10, mx / 20)).toPrecision(4) + ' เท่า)';
    if (i3 > 0 && mx > -200) { const l0 = mx - 3.0103, d0 = a.db[i3 - 1], d1 = a.db[i3], t = d0 === d1 ? 1 : (d0 - l0) / (d0 - d1); h += ' · ลดลง 3 dB ที่ ' + fmtSI(a.f[i3 - 1] * Math.pow(a.f[i3] / a.f[i3 - 1], t), 'Hz', 4); }
    for (const w of a.warnings || []) h += ' · ' + w;
    el.innerHTML = h;
  }
  function logTicks(f0, f1) { const out = []; for (let e = Math.floor(Math.log10(f0)); e <= Math.ceil(Math.log10(f1)); e++) { const v = Math.pow(10, e); if (v >= f0 * 0.9999 && v <= f1 * 1.0001) out.push(v); } return out; }
  function bodePlot(pc, kind, a, b, marks) {
    const { g, W, H } = prep(pc, kind === 'db' ? 240 : 190); const C = cssv;
    if (!a || !a.ok) { g.fillStyle = C('--ink-3'); g.font = '13px "IBM Plex Sans Thai",sans-serif'; g.fillText(a && a.err ? a.err : 'ยังไม่มีผลการสแกนความถี่', 12, 24); return; }
    const L = 60, Rr = 14, Tp = 14, B = 30; const pw = W - L - Rr, ph = H - Tp - B; const f0 = a.f[0], f1 = a.f[a.f.length - 1];
    const sets = [{ r: a, col: '--s1', lab: 'จริง', w: 2.2 }].concat(b ? [{ r: b, col: '--s3', lab: 'อุดมคติ', w: 1.6, dash: [5, 4] }] : []);
    const ys = (r) => (kind === 'db' ? r.db : r.ph);
    let lo = Infinity, hi = -Infinity; for (const s of sets) for (const v of ys(s.r)) { if (v < lo) lo = v; if (v > hi) hi = v; }
    let y0, y1, yt;
    if (kind === 'db') { hi = Math.ceil((hi + 2) / 10) * 10; lo = Math.max(Math.floor(lo / 10) * 10, hi - 130); if (hi - lo < 20) lo = hi - 20; y0 = lo; y1 = hi; yt = niceTicks(y0, y1, 5); }
    else { const st2 = hi - lo > 360 ? 90 : 45; lo = Math.floor(lo / st2) * st2; hi = Math.ceil(hi / st2) * st2; if (hi - lo < 90) hi = lo + 90; y0 = lo; y1 = hi; yt = []; for (let v = y0; v <= y1 + 1e-9; v += st2) yt.push(v); }
    const px = (f) => L + (Math.log10(f / f0) / Math.log10(f1 / f0)) * pw, py = (v) => Tp + ph - ((v - y0) / (y1 - y0)) * ph;
    g.font = '11px "IBM Plex Mono",monospace'; g.lineWidth = 1; g.textBaseline = 'middle';
    for (const v of yt) { const y = Math.round(py(v)) + 0.5; g.strokeStyle = C('--grid-2'); g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke(); g.fillStyle = C('--ink-3'); g.textAlign = 'right'; g.fillText(kind === 'db' ? Number(v.toFixed(1)) + ' dB' : v + '°', L - 6, y); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const f of logTicks(f0, f1)) { const x = Math.round(px(f)) + 0.5; g.strokeStyle = C('--grid-2'); g.beginPath(); g.moveTo(x, Tp); g.lineTo(x, Tp + ph); g.stroke(); g.fillStyle = C('--ink-3'); g.fillText(fmtSI(f, ''), x, Tp + ph + 7); }
    g.strokeStyle = C('--ink-3'); g.beginPath(); g.moveTo(L + 0.5, Tp); g.lineTo(L + 0.5, Tp + ph + 0.5); g.lineTo(L + pw, Tp + ph + 0.5); g.stroke();
    if (kind === 'db' && 0 >= y0 && 0 <= y1) { g.strokeStyle = C('--ink-3'); g.setLineDash([2, 3]); const y = Math.round(py(0)) + 0.5; g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke(); g.setLineDash([]); }
    for (const m of marks || []) { if (m.f < f0 || m.f > f1) continue; const x = Math.round(px(m.f)) + 0.5; g.strokeStyle = m.kind === 'p' ? C('--s2') : C('--s3'); g.setLineDash([3, 4]); g.beginPath(); g.moveTo(x, Tp); g.lineTo(x, Tp + ph); g.stroke(); g.setLineDash([]); g.fillStyle = m.kind === 'p' ? C('--s2') : C('--s3'); g.font = '600 11px "IBM Plex Mono",monospace'; g.textAlign = 'center'; g.textBaseline = 'top'; if (kind === 'db') g.fillText(m.kind === 'p' ? '×' : '○', x, Tp + 2); }
    for (const s of sets) { g.strokeStyle = C(s.col); g.lineWidth = s.w; g.setLineDash(s.dash || []); g.beginPath(); a.f.forEach((f, i) => { const x = px(f), y = Math.max(Tp - 2, Math.min(Tp + ph + 2, py(ys(s.r)[i]))); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.setLineDash([]); }
    g.font = '600 12px "IBM Plex Sans Thai",sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top'; let lx = L + 8;
    sets.forEach((s) => { g.fillStyle = C(s.col); g.fillRect(lx, Tp + 20, 14, 3); g.fillStyle = C('--ink-2'); g.fillText((kind === 'db' ? 'อัตราขยาย ' : 'เฟส ') + s.lab, lx + 18, Tp + 14); lx += 18 + g.measureText((kind === 'db' ? 'อัตราขยาย ' : 'เฟส ') + s.lab).width + 14; });
    pc._map = { L, pw, f0, f1, kind };
  }
  function drawBode() {
    const a = st.ac; const marks = [];
    if (st.acTF && !st.acTF.zero) { for (const p of st.acTF.poles) { const m = Math.hypot(p[0], p[1]); if (m > 1e-6 && (p[1] >= 0)) marks.push({ f: m / 2 / Math.PI, kind: 'p' }); } for (const z of st.acTF.zeros) { const m = Math.hypot(z[0], z[1]); if (m > 1e-6 && z[1] >= 0) marks.push({ f: m / 2 / Math.PI, kind: 'z' }); } }
    bodePlot($('lab-plot-mag'), 'db', a, st.acIdeal, marks); bodePlot($('lab-plot-ph'), 'deg', a, st.acIdeal, marks);
  }
  function bodePointer(e) {
    const pc = e.currentTarget; const m = pc._map; const a = st.ac; if (!m || !a || !a.ok) return;
    const r = pc.getBoundingClientRect(); const x = e.clientX - r.left; if (x < m.L || x > m.L + m.pw) { $('lab-ac-tip').hidden = true; return; }
    const f = m.f0 * Math.pow(m.f1 / m.f0, (x - m.L) / m.pw); let j = 0; while (j < a.f.length - 1 && a.f[j] < f) j++;
    const tipEl = $('lab-ac-tip'); tipEl.innerHTML = '<b>f = ' + fmtSI(a.f[j], 'Hz', 4) + '</b><br>|H| = ' + a.db[j].toFixed(2) + ' dB (' + Number(a.mag[j].toPrecision(4)) + ' เท่า)<br>∠H = ' + a.ph[j].toFixed(1) + '°' + (st.acIdeal ? '<br>อุดมคติ: ' + st.acIdeal.db[j].toFixed(2) + ' dB' : '');
    tipEl.hidden = false; const br = pc.parentElement.parentElement.getBoundingClientRect(); tipEl.style.left = Math.min(br.width - 190, e.clientX - br.left + 14) + 'px'; tipEl.style.top = (e.clientY - br.top + 10) + 'px';
  }

  /* ---------- transfer function H(s) ---------- */
  function renderTF() {
    const box = $('lab-tf'); const k = snapshot() + '|' + st.outId; if (k === st.tfKey && st.tf) { return; }
    if (!st.outId) { box.innerHTML = '<p class="muted">วางจุดวัดแรงดัน (Probe) ที่เอาต์พุต เช่น Vo แล้วระบบจะสรุปฟังก์ชันถ่ายโอน H(s) ให้</p>'; return; }
    let r; try { r = OAE.transferFunctions(st.comps, st.outId); } catch (e) { r = { ok: false, err: 'คำนวณ H(s) ไม่ได้: ' + e.message }; }
    st.tf = r; st.tfKey = k;
    if (!r.ok) { box.innerHTML = '<p class="muted">' + esc(r.err) + '</p>'; return; }
    let h = '';
    for (const n of r.notes) h += '<p class="oa-note"><span class="pill warn">หมายเหตุ</span> ' + esc(n) + '</p>';
    h += '<p class="dc-small">เอาต์พุต <b>' + esc(r.outName) + '</b> · ความอันดับของระบบ (จำนวนตัวเก็บพลังงานอิสระ) ≤ ' + r.order + ' · หาจาก det(G + sC) แบบแม่นยำ ไม่ใช่การประมาณจากกราฟ</p>';
    if (r.tfs.length > 1) h += '<p class="dc-small">หลายแหล่งจ่ายทำงานพร้อมกันได้ด้วยการซ้อนทับ: <span class="oa-tex">' + tex('V_{out}(s) = ' + r.tfs.map((t, i) => 'H_{' + i + '}(s)\\,V_{' + (t.src.replace(/[^A-Za-z0-9]/g, '') || i) + '}(s)').join(' + ')) + '</span></p>';
    r.tfs.forEach((t, i) => {
      const a = OAE.analyzeTF(t); const nm = 'H_{' + (t.src || 'in').replace(/[^A-Za-z0-9]/g, '') + '\\to ' + (r.outName.replace(/[^A-Za-z0-9]/g, '') || 'o') + '}';
      h += '<article class="oa-tfc"><header><h4>' + tex(nm + '(s)') + ' <span class="muted">จาก ' + esc(t.src) + '</span></h4>';
      if (!t.zero) h += '<span class="pill ' + (a.unstable ? 'bad' : a.marginal ? 'warn' : 'ok') + '">' + (a.unstable ? 'ไม่เสถียร (มีขั้วซีกขวา)' : a.marginal ? 'เสถียรแบบขอบ' : 'เสถียร') + '</span>';
      h += '</header>';
      if (t.zero) { h += '<p class="muted">' + esc(a.desc) + '</p></article>'; return; }
      h += '<div class="oa-tex">' + tex(OAE.tfTeX(t, nm), true) + '</div>';
      if (t.zeros.length > 0 || t.poles.length > 2) h += '<div class="oa-tex">' + tex(OAE.pzTeX(t, nm), true) + '</div>';
      h += '<p class="oa-kind"><b>' + esc(a.kind) + '</b>';
      const facts = [];
      if (a.dc !== null && a.dc !== undefined && isFinite(a.dc)) facts.push('อัตราขยาย DC <b>' + Number(a.dc.toPrecision(4)) + '</b> เท่า (' + (20 * Math.log10(Math.abs(a.dc))).toFixed(2) + ' dB' + (a.dc < 0 ? ', กลับเฟส' : '') + ')');
      if (a.dc === Infinity || (a.np0 > 0)) facts.push('มีขั้วที่ s = 0 → อัตราขยาย DC เป็นอนันต์');
      if (a.hf && isFinite(a.hf) && t.zeros.length >= t.poles.length) facts.push('อัตราขยายความถี่สูง <b>' + Number(a.hf.toPrecision(4)) + '</b> เท่า');
      if (a.fc) facts.push('f<sub>−3dB</sub> = <b>' + fmtSI(a.fc, 'Hz', 4) + '</b>');
      if (a.f0 && a.kindEn === 'band-pass') facts.push('f<sub>0</sub> = <b>' + fmtSI(a.f0, 'Hz', 4) + '</b>' + (a.q ? ', Q ≈ <b>' + Number(a.q.toPrecision(3)) + '</b>, แบนด์วิดท์ ' + fmtSI(a.f2 - a.f1, 'Hz', 3) : ''));
      if (a.f0 && a.kindEn === 'notch') facts.push('f<sub>notch</sub> = <b>' + fmtSI(a.f0, 'Hz', 4) + '</b>');
      if (a.wn) facts.push('f<sub>n</sub> = <b>' + fmtSI(a.wn / 2 / Math.PI, 'Hz', 4) + '</b>, ζ = <b>' + Number(a.zeta.toPrecision(3)) + '</b>' + (isFinite(a.Q) ? ', Q = <b>' + Number(a.Q.toPrecision(3)) + '</b>' : ''));
      if (a.peakDb > 0.05) facts.push('ยอดสูงกว่าแถบผ่าน ' + a.peakDb.toFixed(2) + ' dB');
      if (a.unity) facts.push('ความถี่ที่อัตราขยาย = 1: <b>' + fmtSI(a.unity, 'Hz', 4) + '</b>');
      if (a.fz) facts.push('ศูนย์ของ PI ที่ <b>' + fmtSI(a.fz, 'Hz', 3) + '</b>');
      if (facts.length) h += ' — ' + facts.join(' · ');
      h += '</p>';
      const row = (arr, sym) => arr.map((z) => { const m = Math.hypot(z[0], z[1]); const re = z[0]; return '<tr><td>' + sym + '</td><td class="dc-num">' + (z[1] === 0 ? fmtSI(re, '', 4) : fmtSI(re, '', 4) + (z[1] > 0 ? ' + j' : ' − j') + fmtSI(Math.abs(z[1]), '', 4)) + '</td><td class="dc-num">' + (m < 1e-9 ? '0' : fmtSI(m / 2 / Math.PI, 'Hz', 4)) + '</td></tr>'; }).join('');
      if (t.poles.length || t.zeros.length) h += '<details class="oa-pz"><summary>ขั้ว (poles) และศูนย์ (zeros)</summary><div class="dc-tbl-wrap"><table class="dc-tbl"><thead><tr><th></th><th class="dc-num">s (rad/s)</th><th class="dc-num">|s|/2π</th></tr></thead><tbody>' + row(t.poles, 'ขั้ว ×') + row(t.zeros, 'ศูนย์ ○') + '</tbody></table></div></details>';
      if (t.dropped) h += '<p class="muted small">ตัดรากที่ความถี่สูงกว่า 100 เท่าของ GBW ออก เพราะแบบจำลองออปแอมป์ไม่ได้ครอบคลุมช่วงนั้น</p>';
      h += '<div class="dc-btnrow"><button class="dc-btn ghost" data-tf-copy="' + i + '">คัดลอก H(s) เป็น LaTeX</button><button class="dc-btn ghost" data-tf-bode="' + esc(t.srcId) + '">ดู Bode ของ H นี้</button></div></article>';
    });
    box.innerHTML = h;
    box.querySelectorAll('[data-tf-copy]').forEach((b) => b.onclick = () => { const t = r.tfs[+b.dataset.tfCopy]; const txt = OAE.tfTeX(t); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { b.textContent = 'คัดลอกแล้ว'; setTimeout(() => b.textContent = 'คัดลอก H(s) เป็น LaTeX', 1800); }).catch(() => { b.textContent = txt; }); });
    box.querySelectorAll('[data-tf-bode]').forEach((b) => b.onclick = () => { st.srcId = b.dataset.tfBode; setMode('ac'); syncSelects(); });
  }

  /* ---------- editing actions ---------- */
  function delSel() { const c = byId(st.sel); if (!c) return; pushUndo(); st.comps = st.comps.filter((q) => q !== c); st.sel = null; afterChange(true); }
  function rotSel() {
    const c = byId(st.sel);
    if (!c) { if (st.tool === 'OP') st.opRot = (st.opRot + 1) % 4; else st.orient = 1 - st.orient; return; }
    if (c.t === 'G' || c.t === 'T' || c.t === 'P') return;
    pushUndo();
    if (c.t === 'OP') { c.rot = ((c.rot | 0) + 1) % 4; afterChange(); return; }
    const cx = (c.x1 + c.x2) / 2, cy = (c.y1 + c.y2) / 2, dx = c.x2 - c.x1, dy = c.y2 - c.y1;
    c.x1 = Math.round(cx + dy / 2); c.y1 = Math.round(cy - dx / 2); c.x2 = Math.round(cx - dy / 2); c.y2 = Math.round(cy + dx / 2);
    st.orient = Math.abs(c.y2 - c.y1) > Math.abs(c.x2 - c.x1) ? 1 : 0; afterChange();
  }
  function flipSel() {
    const c = byId(st.sel); if (!c) { if (st.tool === 'OP') st.opFlip = !st.opFlip; return; }
    if (c.t === 'OP') { pushUndo(); c.flip = !c.flip; afterChange(); return; }
    if (!TWO.has(c.t)) return; pushUndo(); [c.x1, c.y1, c.x2, c.y2] = [c.x2, c.y2, c.x1, c.y1]; afterChange();
  }
  let saveTimer = null;
  function afterChange(full) {
    if (st.sel && !byId(st.sel)) st.sel = null;
    solve(); renderProps(); draw();
    clearTimeout(saveTimer); saveTimer = setTimeout(() => store.set('oa-lab-v1', snapshot()), 400);
    $('lab-undo').disabled = !st.undo.length; $('lab-redo').disabled = !st.redo.length;
  }
  function setTool(t) {
    st.tool = t; st.ghost = null;
    document.querySelectorAll('#lab-tools [data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === t));
    cv.style.cursor = t === 'select' ? 'default' : t === 'delete' ? 'not-allowed' : 'crosshair';
    const name = { R: 'ตัวต้านทาน', L: 'ตัวเหนี่ยวนำ', C: 'ตัวเก็บประจุ', V: 'แหล่งจ่าย DC', VS: 'แหล่งสัญญาณไซน์', I: 'แหล่งจ่ายกระแส', D: 'ไดโอด', OP: 'ออปแอมป์', P: 'จุดวัดแรงดัน', VM: 'โวลต์มิเตอร์', A: 'แอมมิเตอร์', G: 'กราวด์' }[t];
    $('lab-hint').textContent = t === 'select' ? 'แตะอุปกรณ์เพื่อเลือก ลากเพื่อย้าย ลากจุดปลายเพื่อยืด' : t === 'W' ? 'ลากจากจุดกริดหนึ่งไปอีกจุดเพื่อเดินสาย (เลี้ยวมุมฉากให้อัตโนมัติ)' : t === 'delete' ? 'แตะสิ่งที่ต้องการลบ' : 'แตะจุดบนกริดเพื่อวาง' + name + (t === 'OP' ? ' (แตะที่กึ่งกลาง) · R หมุน F สลับ +/−' : t === 'G' || t === 'P' ? '' : ' · ปุ่ม R สลับแนวนอน/แนวตั้ง');
    draw();
  }
  function setMode(m, silent) {
    st.mode = m;
    document.querySelectorAll('#lab-mode button').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
    $('lab-tran').hidden = m !== 'tran'; $('lab-ac').hidden = m !== 'ac';
    if (!silent) { if (m === 'tran') runTran(); if (m === 'ac') { syncSelects(); runAC(); } renderTable(); renderSideResults(); renderStatus(); draw(); }
  }

  /* ---------- pointer interaction ---------- */
  cv.addEventListener('pointerdown', (e) => {
    cv.focus({ preventScroll: true });
    const { wx, wy } = world(e); const gx = clampX(Math.round(wx)), gy = clampY(Math.round(wy)); const t = st.tool;
    if (t === 'select') {
      const sc = byId(st.sel);
      if (sc && TWO.has(sc.t)) for (const end of [1, 2]) { const ex = sc['x' + end], ey = sc['y' + end]; if (Math.hypot(wx - ex, wy - ey) < 0.42) { st.drag = { kind: 'end', c: sc, end, moved: false, snap: snapshot() }; cv.setPointerCapture(e.pointerId); return; } }
      const h = hit(wx, wy);
      if (h) {
        st.sel = h.id; renderProps(); renderTable();
        const ends = pinsOf(h); const attached = [];
        if (h.t !== 'W') for (const w of st.comps) if (w.t === 'W') for (const end of [1, 2]) for (const [x, y] of ends) if (w['x' + end] === x && w['y' + end] === y) attached.push({ w, end });
        st.drag = { kind: 'move', c: h, sx: wx, sy: wy, o: [h.x1, h.y1, h.x2, h.y2], att: attached.map((a) => ({ ...a, ox: a.w['x' + a.end], oy: a.w['y' + a.end] })), moved: false, snap: snapshot() };
        cv.setPointerCapture(e.pointerId);
      } else {
        st.sel = null; renderProps(); renderTable();
        st.drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, sl: wrap.scrollLeft, stp: wrap.scrollTop, py: window.scrollY };
        cv.setPointerCapture(e.pointerId);
      }
      draw(); return;
    }
    if (t === 'delete') { const h = hit(wx, wy); if (h) { st.sel = h.id; delSel(); } return; }
    if (t === 'W') { st.drag = { kind: 'wire', x0: gx, y0: gy }; st.ghost = []; cv.setPointerCapture(e.pointerId); return; }
    pushUndo(); let c;
    if (t === 'G') c = { id: nid(), t: 'G', x1: gx, y1: gy, x2: gx, y2: gy };
    else if (t === 'P') c = { id: nid(), t: 'P', x1: gx, y1: gy, x2: gx, y2: gy, v: 0, lab: nextLabel('P'), side: 'r' };
    else if (t === 'OP') {
      const probe = { x1: gx, y1: gy, rot: st.opRot, flip: st.opFlip }; let cx = gx, cy = gy;
      for (let k = 0; k < 6; k++) { const pins = opPins({ x1: cx, y1: cy, rot: st.opRot, flip: st.opFlip }); const bad = pins.some(([x, y]) => x < 0 || y < 0 || x > st.cols || y > st.rows); if (!bad) break; cx = Math.max(2, Math.min(st.cols - 2, cx)); cy = Math.max(2, Math.min(st.rows - 2, cy)); }
      c = { id: nid(), t: 'OP', x1: cx, y1: cy, x2: cx, y2: cy, v: 0, lab: nextLabel('OP'), rot: st.opRot, flip: st.opFlip, m: 'ideal', vp: 15, vn: -15 };
    } else {
      const tt = t === 'VS' ? 'V' : t; const [dx, dy] = st.orient ? [0, 1] : [1, 0];
      let x1 = gx - dx, y1 = gy - dy, x2 = gx + dx, y2 = gy + dy;
      if (x1 < 0 || y1 < 0) { x1 += dx; y1 += dy; x2 += dx; y2 += dy; } if (x2 > st.cols || y2 > st.rows) { x1 -= dx; y1 -= dy; x2 -= dx; y2 -= dy; }
      c = { id: nid(), t: tt, x1, y1, x2, y2, v: TYPES[tt].def, lab: nextLabel(tt) };
      if (tt === 'V' || tt === 'I') { c.w = t === 'VS' ? 'sin' : 'dc'; c.f = 1000; c.off = 0; if (t === 'VS') c.v = 0.5; }
      if (tt === 'C' && st.comps.filter((q) => q.t === 'OP').length) { /* leave ic empty */ }
    }
    st.comps.push(c); st.sel = c.id; afterChange();
  });
  cv.addEventListener('pointermove', (e) => {
    const { wx, wy } = world(e); const d = st.drag;
    if (d) {
      if (d.kind === 'pan') { const dx = e.clientX - d.sx, dy = e.clientY - d.sy; wrap.scrollLeft = d.sl - dx; if (wrap.scrollHeight > wrap.clientHeight + 2) wrap.scrollTop = d.stp - dy; else window.scrollTo(0, d.py - dy); return; }
      if (d.kind === 'move') {
        const dx = Math.round(wx - d.sx), dy = Math.round(wy - d.sy); const c = d.c;
        const nx1 = d.o[0] + dx, ny1 = d.o[1] + dy, nx2 = d.o[2] + dx, ny2 = d.o[3] + dy;
        const probe = Object.assign({}, c, { x1: nx1, y1: ny1 }); const ext = c.t === 'OP' ? opPins(probe) : [[nx1, ny1], [nx2, ny2]];
        if (ext.some(([x, y]) => x < 0 || y < 0 || x > st.cols || y > st.rows)) return;
        if (nx1 !== c.x1 || ny1 !== c.y1) { c.x1 = nx1; c.y1 = ny1; c.x2 = nx2; c.y2 = ny2; for (const a of d.att) { a.w['x' + a.end] = a.ox + dx; a.w['y' + a.end] = a.oy + dy; } d.moved = true; solveLight(); }
      } else if (d.kind === 'end') {
        const gx = clampX(Math.round(wx)), gy = clampY(Math.round(wy)); const c = d.c; const o = d.end === 1 ? [c.x2, c.y2] : [c.x1, c.y1];
        if ((gx !== o[0] || gy !== o[1]) && (gx !== c['x' + d.end] || gy !== c['y' + d.end])) { c['x' + d.end] = gx; c['y' + d.end] = gy; d.moved = true; solveLight(); }
      } else if (d.kind === 'wire') {
        const gx = clampX(Math.round(wx)), gy = clampY(Math.round(wy)); st.ghost = wirePath(d.x0, d.y0, gx, gy, Math.abs(wx - d.x0) >= Math.abs(wy - d.y0)); draw();
      }
      return;
    }
    const h = st.tool === 'select' || st.tool === 'delete' ? hit(wx, wy) : null; const hid = h ? h.id : null;
    if (hid !== st.hover) { st.hover = hid; draw(); }
    showTip(e, wx, wy, h);
  });
  function wirePath(x0, y0, x1, y1, horFirst) {
    const out = [];
    if (x0 === x1 || y0 === y1) { if (x0 !== x1 || y0 !== y1) out.push({ t: 'W', x1: x0, y1: y0, x2: x1, y2: y1 }); return out; }
    if (horFirst) out.push({ t: 'W', x1: x0, y1: y0, x2: x1, y2: y0 }, { t: 'W', x1: x1, y1: y0, x2: x1, y2: y1 });
    else out.push({ t: 'W', x1: x0, y1: y0, x2: x0, y2: y1 }, { t: 'W', x1: x0, y1: y1, x2: x1, y2: y1 });
    return out;
  }
  let lightTimer = null;
  function solveLight() { draw(); clearTimeout(lightTimer); lightTimer = setTimeout(() => { st.res = OAE.solveDC(st.comps); renderStatus(); draw(); }, 30); }
  function endDrag() {
    const d = st.drag; st.drag = null; if (!d) return;
    if (d.kind === 'wire') { const segs = st.ghost || []; st.ghost = null; if (segs.length) { pushUndo(); for (const s of segs) st.comps.push(Object.assign({ id: nid() }, s)); afterChange(); } else draw(); return; }
    if (d.moved) { st.undo.push(d.snap); st.redo = []; afterChange(); }
  }
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('pointerleave', () => { if (!st.drag) { tip.hidden = true; if (st.hover) { st.hover = null; draw(); } } });
  cv.addEventListener('dblclick', () => { const v = $('pp-val') || $('pp-model'); if (v) { v.focus(); if (v.select) v.select(); } });
  function showTip(e, wx, wy, h) {
    const R = st.mode === 'ac' ? (st.res && st.res.ok ? st.res : null) : displayRes(); if (!R) { tip.hidden = true; return; }
    let txt = null;
    if (h && (TWO.has(h.t) || h.t === 'OP') && R.elem && R.elem[h.id]) { const r = R.elem[h.id]; txt = '<b>' + esc(h.lab) + '</b> ' + esc(h.t === 'OP' ? (OAE.OPM[h.m] || OAE.OPM.ideal).short : OAR.valueText(h)) + '<br>v = ' + fmtSI(r.v, 'V', 4) + '<br>i = ' + fmtSI(r.i, 'A', 4) + '<br>p = ' + fmtSI(r.p, 'W', 4); }
    else {
      const gx = Math.round(wx), gy = Math.round(wy);
      if (Math.hypot(wx - gx, wy - gy) < 0.3 && R.net) { const k = R.net.nodeOfKey(key(gx, gy)); if (k !== undefined) txt = k < 0 ? '<b>กราวด์</b> 0 V' : '<b>โหนด n' + (k + 1) + '</b><br>' + fmtSI(R.nodeV[k], 'V', 4); }
    }
    if (!txt) { tip.hidden = true; return; }
    tip.innerHTML = txt; tip.hidden = false;
    const wr = wrap.getBoundingClientRect(); let x = e.clientX - wr.left + wrap.scrollLeft + 14, y = e.clientY - wr.top + wrap.scrollTop + 14;
    if (x + 170 > wrap.scrollLeft + wr.width) x -= 190; tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  cv.addEventListener('keydown', (e) => {
    const c = byId(st.sel);
    if ((e.key === 'Delete' || e.key === 'Backspace') && c) { e.preventDefault(); delSel(); }
    else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); rotSel(); if (!c) setTool(st.tool); }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); flipSel(); }
    else if (e.key === 'Escape') { st.sel = null; setTool('select'); renderProps(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if (c && e.key.startsWith('Arrow') && c.t !== 'T') {
      e.preventDefault(); const [dx, dy] = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      const probe = Object.assign({}, c, { x1: c.x1 + dx, y1: c.y1 + dy, x2: c.x2 + dx, y2: c.y2 + dy }); const ext = c.t === 'OP' ? opPins(probe) : [[probe.x1, probe.y1], [probe.x2, probe.y2]];
      if (ext.some(([x, y]) => x < 0 || y < 0 || x > st.cols || y > st.rows)) return;
      pushUndo(); c.x1 += dx; c.x2 += dx; c.y1 += dy; c.y2 += dy; afterChange();
    }
  });

  /* ---------- toolbar wiring ---------- */
  document.querySelectorAll('#lab-tools [data-tool]').forEach((b) => b.onclick = () => setTool(b.dataset.tool));
  $('lab-undo').onclick = undo; $('lab-redo').onclick = redo;
  $('lab-rot').onclick = () => { rotSel(); setTool(st.tool); }; $('lab-flip').onclick = () => { flipSel(); setTool(st.tool); };
  $('lab-clear').onclick = () => { if (!st.comps.length) return; load([]); $('lab-cleared').hidden = false; setTimeout(() => $('lab-cleared').hidden = true, 4000); };
  $('lab-zin').onclick = () => { st.zoom += 3; fit(); }; $('lab-zout').onclick = () => { st.zoom -= 3; fit(); }; $('lab-zfit').onclick = fitCircuit;
  const preset = $('lab-preset');
  { const groups = []; for (const p of OK.PRESETS) { let g = groups.find((q) => q.n === p.g); if (!g) groups.push(g = { n: p.g, l: [] }); g.l.push(p); }
    preset.innerHTML = '<option value="">เลือกวงจรตัวอย่าง…</option>' + groups.map((g) => '<optgroup label="' + g.n + '">' + g.l.map((p) => '<option value="' + p.k + '">' + p.name + '</option>').join('') + '</optgroup>').join(''); }
  function openPreset(p) {
    load(p.f(), { mode: p.mode || 'dc', tEnd: p.tEnd, fmin: p.fmin, fmax: p.fmax });
    if (p.mode === 'tran') runTran(); if (p.mode === 'ac') { syncSelects(); runAC(); }
    if (p.k === 'osc' || p.k === 'tow') { st.xy = p.k === 'osc'; $('lab-xy-on').checked = st.xy; drawXY(); }
    else if (st.xy) { st.xy = false; $('lab-xy-on').checked = false; drawXY(); }
  }
  preset.onchange = () => { const p = OK.PRESETS.find((q) => q.k === preset.value); if (p) openPreset(p); preset.value = ''; };
  document.querySelectorAll('#lab-mode button').forEach((b) => b.onclick = () => setMode(b.dataset.mode));
  const tog = (id, k) => { const el = $(id); el.checked = st[k]; el.onchange = () => { st[k] = el.checked; if (k === 'iec') window.dispatchEvent(new Event('dc-redraw')); draw(); }; };
  tog('opt-iec', 'iec'); tog('opt-val', 'showVal'); tog('opt-nodes', 'showNodes'); tog('opt-dots', 'dots');
  $('lab-scrub').oninput = (e) => { st.tIdx = +e.target.value; updateTimeReadout(); drawPlots(); renderSideResults(); renderTable(); draw(); };
  $('lab-play').onclick = () => { if (!st.tran || !st.tran.ok) runTran(); if (!st.tran.ok) return; if (st.tIdx >= st.tran.t.length - 1) st.tIdx = 0; st.playing = !st.playing; $('lab-play').textContent = st.playing ? '❚❚ หยุด' : '▶ เล่น'; };
  $('lab-tend').onchange = (e) => { const v = parseSI(e.target.value.replace(/s$/, '')); if (v > 0) { st.tEnd = v; st.autoT = false; $('lab-auto').checked = false; runTran(); } };
  $('lab-auto').onchange = (e) => { st.autoT = e.target.checked; runTran(); };
  $('lab-xy-on').onchange = (e) => { st.xy = e.target.checked; drawXY(); };
  $('lab-xy-x').onchange = drawXY; $('lab-xy-y').onchange = drawXY;
  $('lab-i-box').addEventListener('toggle', () => { if ($('lab-i-box').open) drawPlots(); });
  ['lab-plot-v', 'lab-plot-i'].forEach((id) => { const p = $(id); p.addEventListener('pointermove', plotPointer); p.addEventListener('pointerdown', plotPointer); p.addEventListener('pointerleave', () => $('lab-ptip').hidden = true); });
  ['lab-plot-mag', 'lab-plot-ph'].forEach((id) => { const p = $(id); p.addEventListener('pointermove', bodePointer); p.addEventListener('pointerdown', bodePointer); p.addEventListener('pointerleave', () => $('lab-ac-tip').hidden = true); });
  $('lab-ac-src').onchange = (e) => { st.srcId = e.target.value; runAC(); };
  const setOut = (v) => { st.outId = v; st.tfKey = ''; if (st.mode === 'ac') runAC(); if (!$('pane-tf').hidden) renderTF(); syncSelects(); };
  $('lab-ac-out').onchange = (e) => setOut(e.target.value); $('lab-tf-out').onchange = (e) => setOut(e.target.value);
  const rng = () => { const a = parseSI($('lab-ac-fmin').value), b = parseSI($('lab-ac-fmax').value); if (a > 0 && b > a * 10) { st.fmin = a; st.fmax = b; runAC(); } };
  $('lab-ac-fmin').onchange = rng; $('lab-ac-fmax').onchange = rng;
  $('lab-ac-ideal').onchange = (e) => { st.cmpIdeal = e.target.checked; runAC(); };
  document.querySelectorAll('#lab-tabs button').forEach((b) => b.onclick = () => {
    document.querySelectorAll('#lab-tabs button').forEach((q) => { q.classList.toggle('on', q === b); q.setAttribute('aria-selected', q === b); });
    document.querySelectorAll('.lab-pane').forEach((p) => p.hidden = p.id !== b.dataset.pane);
    if (b.dataset.pane === 'pane-tf') { st.tfKey = ''; renderTF(); }
  });
  $('lab-copy').onclick = () => {
    const txt = snapshot(); const ta = $('lab-json'); ta.value = txt; $('lab-io').hidden = false;
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { $('lab-io-msg').textContent = 'คัดลอกข้อความวงจรแล้ว นำไปวางในช่องนี้บนเครื่องอื่นเพื่อเปิดวงจรเดิม'; }).catch(() => { ta.select(); $('lab-io-msg').textContent = 'เลือกข้อความไว้แล้ว กด Ctrl+C เพื่อคัดลอก'; });
  };
  $('lab-paste').onclick = () => { $('lab-io').hidden = false; $('lab-json').value = ''; $('lab-json').focus(); $('lab-io-msg').textContent = 'วางข้อความวงจร (JSON) แล้วกด เปิดวงจร'; };
  $('lab-load').onclick = () => { try { const a = JSON.parse($('lab-json').value); if (!Array.isArray(a)) throw 0; load(a.filter((c) => c && c.t)); $('lab-io-msg').textContent = 'เปิดวงจรแล้ว'; } catch (e) { $('lab-io-msg').textContent = 'อ่านข้อความไม่ได้ ตรวจว่าคัดลอกมาครบทั้งหมด'; } };

  new ResizeObserver(() => { fit(); if (st.mode === 'tran') drawPlots(); if (st.mode === 'ac') drawBode(); }).observe(wrap);
  new IntersectionObserver((en) => { st.visible = en[0].isIntersecting; }).observe(cv);
  window.addEventListener('dc-redraw', () => { draw(); if (st.mode === 'tran') { buildChips(); drawPlots(); } if (st.mode === 'ac') drawBode(); });

  // initial circuit
  let init = null; try { init = JSON.parse(store.get('oa-lab-v1') || 'null'); } catch (e) { }
  const startP = OK.PRESETS.find((p) => p.k === 'inverting');
  st.comps = (Array.isArray(init) && init.length ? init : startP.f()).map((c) => Object.assign({}, c, { id: nid() }));
  setTool('select'); fitCircuit(); afterChange(); st.undo = []; $('lab-undo').disabled = true;
  setMode(document.querySelector('#lab-mode button.on') ? document.querySelector('#lab-mode button.on').dataset.mode : 'dc');
  requestAnimationFrame(loop);

  return {
    get iec() { return st.iec; },
    open(comps, o = {}) { load(comps, o); if (o.mode === 'tran') runTran(); if (o.mode === 'ac') { syncSelects(); runAC(); } document.getElementById('lab').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); if (o.note) $('lab-hint').textContent = o.note; },
    openPreset(k) { const p = OK.PRESETS.find((q) => q.k === k); if (p) { openPreset(p); document.getElementById('lab').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } },
    setMode, redraw() { draw(); }, state: st
  };
})();
window.LAB = LAB;
