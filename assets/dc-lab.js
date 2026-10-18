/* DC circuits virtual lab: schematic editor on a grid, live MNA solution, MNA matrix view, transient plots. Needs dc-core.js. */
/* ===== Virtual lab: schematic editor + MNA results + transient plots ===== */
const LAB = (() => {
  const { TYPES, TWO, fmtSI, parseSI, key } = DCE;
  const $ = (id) => document.getElementById(id);
  const cv = $('lab-cv'), ctx = cv.getContext('2d'), wrap = $('lab-wrap'), tip = $('lab-tip');
  const st = { comps: [], tool: 'select', sel: null, hover: null, cols: 40, rows: 18, cell: 26, zoom: 0, iec: false, showVal: true, showNodes: false,
    dots: !matchMedia('(prefers-reduced-motion: reduce)').matches, mode: 'dc', res: null, tran: null, tIdx: 0, tEnd: null, autoT: true,
    undo: [], redo: [], drag: null, ghost: null, orient: 0, visible: true, playing: false, slots: new Map() };
  let uid = 0; const nid = () => 'L' + (++uid);
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };

  /* ---------- model helpers ---------- */
  function nextLabel(t) {
    const pre = TYPES[t].pre; let mx = 0; const re = new RegExp('^' + pre + '(\\d+)$');
    for (const c of st.comps) { const m = (c.lab || '').match(re); if (m) mx = Math.max(mx, +m[1]); }
    return pre + (mx + 1);
  }
  function snapshot() { return JSON.stringify(st.comps); }
  function pushUndo() { st.undo.push(snapshot()); if (st.undo.length > 120) st.undo.shift(); st.redo = []; }
  function undo() { if (!st.undo.length) return; st.redo.push(snapshot()); st.comps = JSON.parse(st.undo.pop()); afterChange(true); }
  function redo() { if (!st.redo.length) return; st.undo.push(snapshot()); st.comps = JSON.parse(st.redo.pop()); afterChange(true); }
  function load(comps, opt = {}) {
    pushUndo();
    const map = new Map();
    st.comps = comps.map((c) => { const n = Object.assign({}, c); const id = nid(); map.set(c.id, id); n.id = id; return n; });
    for (const c of st.comps) if (c.ctrl) c.ctrl = map.get(c.ctrl) || c.ctrl;
    st.sel = null; st.slots = new Map(); st.tran = null;
    if (opt.mode) setMode(opt.mode, true);
    fitCircuit(); afterChange(true);
  }
  const byId = (id) => st.comps.find((c) => c.id === id);

  /* ---------- geometry ---------- */
  function segDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy; let t = L2 ? ((px - x1) * dx + (py - y1) * dy) / L2 : 0; t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }
  function hit(wx, wy) {
    let best = null, bd = 0.5;
    for (const c of st.comps) {
      if (c.t === 'W') continue;
      const d = c.t === 'T' ? Math.hypot(wx - c.x1, wy - c.y1) - 0.1 : c.t === 'G' ? Math.hypot(wx - c.x1, wy - (c.y1 + 0.55)) - 0.15 : segDist(wx, wy, c.x1, c.y1, c.x2, c.y2) - 0.1;
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
  // Shrink the board on narrow screens so the whole circuit is visible without scrolling (phones).
  function fitCircuit() {
    const avail = wrap.clientWidth - 2; if (avail < 50) return;
    const base = Math.max(18, Math.min(30, Math.floor(avail / st.cols)));
    if (!st.comps.length) { st.zoom = 0; fit(); return; }
    const bb = RND.bbox(st.comps); const need = Math.max(10, bb.x1 + 1.2);
    const cell = Math.max(11, Math.min(base, Math.floor(avail / need)));
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
    if (st.mode === 'dc') return st.res && st.res.ok ? st.res : null;
    const T = st.tran; if (!T || !T.ok) return null; const j = Math.min(st.tIdx, T.t.length - 1);
    const elem = {}; for (const id in T.el) { const v = T.el[id].v[j], i = T.el[id].i[j]; elem[id] = { v, i, p: v * i }; }
    return { elem, nodeV: T.nodeV[j], net: T.net };
  }
  let phase = 0, lastT = 0;
  function draw() {
    const W = st.cols * st.cell, H = st.rows * st.cell;
    ctx.clearRect(0, 0, W, H);
    RND.draw(ctx, st.comps, { cell: st.cell, ox: 0, oy: 0, grid: true, cols: st.cols, rows: st.rows, iec: st.iec, showVal: st.showVal, showLab: true,
      res: displayRes(), nodeColor: true, sel: st.sel, hover: st.hover, phase, dots: st.dots, nodeNames: st.showNodes, ghost: st.ghost });
  }
  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t;
    if (st.playing && st.tran && st.tran.ok) {
      const n = st.tran.t.length; st.tIdx = Math.min(n - 1, st.tIdx + Math.max(1, Math.round(n * dt / 5)));
      $('lab-scrub').value = st.tIdx; updateTimeReadout(); if (st.tIdx >= n - 1) { st.playing = false; $('lab-play').textContent = '▶ เล่น'; }
      renderSideResults(); drawPlots();
    }
    if (st.visible && (st.dots || st.playing) && displayRes()) { phase += dt; draw(); }
    requestAnimationFrame(loop);
  }

  /* ---------- solving ---------- */
  let tranTimer = null;
  function solve() {
    st.res = DCE.solveDC(st.comps);
    if (st.mode === 'tran') { clearTimeout(tranTimer); tranTimer = setTimeout(runTran, 120); }
    renderStatus(); renderTable(); renderMNA(); renderSideResults();
  }
  function runTran() {
    const hasLC = st.comps.some((c) => c.t === 'L' || c.t === 'C');
    if (st.autoT || !st.tEnd) { st.tEnd = DCE.autoTime(st.comps); $('lab-tend').value = fmtSI(st.tEnd, 's').replace(' ', ''); }
    st.tran = DCE.solveTran(st.comps, st.tEnd, 2000, 600);
    const sc = $('lab-scrub'); if (st.tran.ok) { sc.max = st.tran.t.length - 1; st.tIdx = Math.min(st.tIdx || st.tran.t.length - 1, st.tran.t.length - 1); sc.value = st.tIdx; }
    $('lab-tran-note').textContent = st.tran.ok ? (hasLC ? 'แหล่งจ่ายทุกตัวเริ่มทำงานที่ t = 0 โดยตัวเก็บประจุเริ่มที่ 0 V และตัวเหนี่ยวนำเริ่มที่ 0 A · ขั้นเวลา h = ' + fmtSI(st.tran.h, 's') + ' (วิธีสี่เหลี่ยมคางหมู)' : 'วงจรนี้ไม่มี L หรือ C ค่าทุกตัวจึงคงที่ตลอดเวลา') : st.tran.err;
    updateTimeReadout(); buildTraceChips(); drawPlots(); renderSideResults(); renderTable(); draw();
  }

  /* ---------- side panel ---------- */
  const typeName = (t) => (TYPES[t] ? TYPES[t].name : t);
  const unitOf = (t) => (TYPES[t] ? TYPES[t].unit : '');
  function renderProps() {
    const p = $('lab-props'); const c = byId(st.sel);
    if (!c) {
      const n = st.res && st.res.net ? st.res.net.n : 0; const m = st.comps.filter((q) => TWO.has(q.t)).length;
      p.innerHTML = '<p class="side-h">วงจรบนกระดาน</p><dl class="kv"><dt>จำนวนโหนด (ไม่รวมกราวด์)</dt><dd>' + n + '</dd><dt>องค์ประกอบ</dt><dd>' + m + '</dd><dt>ขนาดระบบสมการ</dt><dd>' + (st.res && st.res.sys ? st.res.sys.N + ' × ' + st.res.sys.N : '—') + '</dd></dl>' +
        '<p class="side-h">วิธีใช้</p><ol class="howto"><li>เลือกอุปกรณ์จากแถบเครื่องมือ แล้วแตะจุดบนกริดเพื่อวาง</li><li>เลือก <b>สายไฟ</b> แล้วลากจากจุดหนึ่งไปอีกจุด สายที่ผ่านจุดกริดเดียวกันจะเชื่อมกัน (มีจุดดำแสดง)</li><li>แตะอุปกรณ์เพื่อแก้ค่า หมุน (ปุ่ม R) ลาก หรือลบ (ปุ่ม Delete)</li><li>วางกราวด์อย่างน้อยหนึ่งจุดเป็นจุดอ้างอิง 0 V</li></ol>';
      return;
    }
    if (c.t === 'W') { p.innerHTML = '<p class="side-h">สายไฟ</p><p class="muted">สายไฟอุดมคติ ความต้านทานเป็นศูนย์ ทุกจุดบนสายมีศักย์เท่ากัน</p><div class="dc-btnrow"><button class="dc-btn" id="pp-del">ลบสาย</button></div>'; $('pp-del').onclick = delSel; return; }
    if (c.t === 'T') { p.innerHTML = '<p class="side-h">ป้ายข้อความ</p><p class="muted">ป้ายกำกับในรูป ไม่มีผลต่อการคำนวณ ลากเพื่อย้ายได้</p><div class="dc-btnrow"><button class="dc-btn" id="pp-del">ลบป้าย</button></div>'; $('pp-del').onclick = delSel; return; }
    if (c.t === 'G') { p.innerHTML = '<p class="side-h">กราวด์</p><p class="muted">กำหนดให้โหนดนี้มีศักย์ 0 V เป็นจุดอ้างอิงของแรงดันโหนดทั้งหมด</p><div class="dc-btnrow"><button class="dc-btn" id="pp-del">ลบ</button></div>'; $('pp-del').onclick = delSel; return; }
    const meta = TYPES[c.t]; const isDep = !!meta.ctrl; const isMeter = c.t === 'A' || c.t === 'VM';
    let h = '<p class="side-h">' + esc(c.lab) + ' <span class="muted">· ' + typeName(c.t) + '</span></p>';
    h += '<label class="fld"><span>ชื่อ</span><input id="pp-lab" type="text" value="' + esc(c.lab) + '" maxlength="8"></label>';
    if (!isMeter) h += '<label class="fld"><span>' + (isDep ? 'อัตราขยาย' : 'ค่า') + ' <em>' + unitOf(c.t) + '</em></span><input id="pp-val" type="text" inputmode="decimal" value="' + (isDep ? c.v : fmtSI(+c.v, '').replace(' ', '')) + '"><small id="pp-err" class="err" hidden>อ่านค่าไม่ได้ ลองพิมพ์ เช่น 4.7k, 10u, 2m</small></label>';
    if (isDep) {
      const want = meta.ctrl; const opts = st.comps.filter((q) => TWO.has(q.t) && q.id !== c.id && (want === 'v' || q.t === 'A' || q.t === 'V'));
      h += '<label class="fld"><span>' + (want === 'v' ? 'แรงดันควบคุม vₓ คร่อม' : 'กระแสควบคุม iₓ ผ่าน') + '</span><select id="pp-ctrl"><option value="">— เลือก —</option>' + opts.map((q) => '<option value="' + q.id + '"' + (q.id === c.ctrl ? ' selected' : '') + '>' + esc(q.lab) + '</option>').join('') + '</select></label>';
      h += '<p class="muted small">' + (want === 'v' ? 'vₓ = V(ปลายแรก) − V(ปลายที่สอง) ขององค์ประกอบที่เลือก' : 'iₓ คือกระแสที่ไหลจากปลายแรกไปปลายที่สอง ต้องเลือกแอมมิเตอร์หรือแหล่งจ่ายแรงดัน') + '</p>';
    }
    h += '<div class="dc-btnrow"><button class="dc-btn" id="pp-rot" title="หมุน 90° (R)">หมุน</button><button class="dc-btn" id="pp-flip">กลับขั้ว</button><button class="dc-btn danger" id="pp-del" title="Delete">ลบ</button></div>';
    h += '<div id="pp-res"></div>';
    p.innerHTML = h;
    $('pp-lab').onchange = (e) => { pushUndo(); c.lab = e.target.value.trim() || c.lab; afterChange(); };
    if ($('pp-val')) $('pp-val').onchange = (e) => {
      const v = isDep ? parseFloat(e.target.value) : parseSI(e.target.value);
      if (!isFinite(v) || (['R', 'L', 'C'].includes(c.t) && v <= 0)) { $('pp-err').hidden = false; return; }
      $('pp-err').hidden = true; pushUndo(); c.v = v; afterChange();
    };
    if ($('pp-ctrl')) $('pp-ctrl').onchange = (e) => { pushUndo(); c.ctrl = e.target.value || null; afterChange(); };
    $('pp-rot').onclick = rotSel; $('pp-flip').onclick = flipSel; $('pp-del').onclick = delSel;
    renderSideResults();
  }
  function renderSideResults() {
    const box = $('pp-res'); if (!box) return; const c = byId(st.sel); const R = displayRes(); if (!c || !R || !R.elem[c.id]) { box.innerHTML = ''; return; }
    const r = R.elem[c.id];
    box.innerHTML = '<p class="side-h">ผลการวิเคราะห์' + (st.mode === 'tran' ? ' ที่ t = ' + fmtSI(st.tran.t[st.tIdx], 's') : '') + '</p><dl class="kv dc-mono"><dt>v (ปลายแรก − ปลายสอง)</dt><dd>' + fmtSI(r.v, 'V', 4) + '</dd><dt>i (ปลายแรก → ปลายสอง)</dt><dd>' + fmtSI(r.i, 'A', 4) + '</dd><dt>p ดูดกลืน = v·i</dt><dd>' + fmtSI(r.p, 'W', 4) + (r.p < -1e-15 ? ' <span class="tag-src">จ่ายกำลัง</span>' : '') + '</dd></dl>';
  }
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  /* ---------- status, table, MNA ---------- */
  function renderStatus() {
    const s = $('lab-status'); const r = st.res; let h = '';
    if (!r) { s.innerHTML = ''; return; }
    if (!r.ok && r.net && !r.net.elems.length) { s.innerHTML = '<span class="pill warn">กระดานว่าง</span> เลือกอุปกรณ์จากแถบเครื่องมือ แล้วแตะบนกริดเพื่อเริ่มต่อวงจร หรือเลือกวงจรตัวอย่าง'; return; }
    if (!r.ok) h += '<span class="pill bad">แก้ไม่ได้</span> ' + esc(r.err);
    else h += '<span class="pill ok">แก้ได้</span> ' + r.net.n + ' โหนด · ระบบสมการ MNA ขนาด ' + r.sys.N + ' × ' + r.sys.N + ' · แหล่งจ่ายให้กำลัง ' + fmtSI(r.pSup, 'W') + ' = ถูกดูดกลืน ' + fmtSI(r.pAbs, 'W');
    for (const w of r.warnings || []) h += '<br><span class="pill warn">ข้อสังเกต</span> ' + esc(w);
    s.innerHTML = h;
  }
  function renderTable() {
    const box = $('lab-table'); const R = displayRes(); const els = st.comps.filter((c) => TWO.has(c.t));
    if (!R || !els.length) { box.innerHTML = '<p class="muted">' + (st.res && !st.res.ok ? 'ยังไม่มีผลลัพธ์ เพราะระบบสมการแก้ไม่ได้' : 'วางอุปกรณ์อย่างน้อยหนึ่งตัวเพื่อเริ่มวิเคราะห์') + '</p>'; return; }
    let sum = 0, sup = 0;
    let h = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ชื่อ</th><th>ชนิด</th><th class="dc-num">ค่า</th><th class="dc-num">v</th><th class="dc-num">i</th><th class="dc-num">p ดูดกลืน</th></tr></thead><tbody>';
    for (const c of els) {
      const r = R.elem[c.id]; if (!r) continue; sum += r.p; if (r.p < 0) sup -= r.p;
      h += '<tr' + (c.id === st.sel ? ' class="on"' : '') + ' data-id="' + c.id + '"><td><b>' + esc(c.lab) + '</b></td><td>' + typeName(c.t).split(' ')[0] + '</td><td class="dc-num">' + (c.t === 'A' || c.t === 'VM' ? '—' : esc(RND.valueText(c))) + '</td><td class="dc-num">' + fmtSI(r.v, 'V', 4) + '</td><td class="dc-num">' + fmtSI(r.i, 'A', 4) + '</td><td class="dc-num' + (r.p < -1e-15 ? ' src' : '') + '">' + fmtSI(r.p, 'W', 4) + '</td></tr>';
    }
    h += '</tbody></table></div><p class="balance">ผลรวมกำลังทุกองค์ประกอบ Σp = ' + fmtSI(Math.abs(sum) < sup * 1e-9 ? 0 : sum, 'W', 3) + ' ' + (Math.abs(sum) <= Math.max(1e-12, sup * 1e-6) ? '<span class="pill ok">สมดุล</span>' : '<span class="pill warn">ตรวจสอบ</span>') + ' · กำลังที่จ่ายเท่ากับกำลังที่ใช้เสมอ (ทฤษฎีบทเทลเลเกน)</p>';
    const nv = R.nodeV || []; if (nv.length) h += '<div class="dc-chips">' + nv.map((v, i) => '<span class="dc-chip dc-mono">n' + (i + 1) + ' = ' + fmtSI(v, 'V', 4) + '</span>').join('') + '<span class="dc-chip dc-mono">กราวด์ = 0 V</span></div>';
    box.innerHTML = h;
    box.querySelectorAll('tr[data-id]').forEach((tr) => tr.onclick = () => { st.sel = tr.dataset.id; renderProps(); renderTable(); draw(); });
  }
  function renderMNA() {
    const box = $('lab-mna'); const r = st.res;
    if (!r || !r.sys) { box.innerHTML = '<p class="muted">ยังไม่มีระบบสมการ</p>'; return; }
    const { A, z, n, N, brLabel } = r.sys;
    if (N > 22) { box.innerHTML = '<p class="muted">ระบบสมการมีขนาด ' + N + ' × ' + N + ' ใหญ่เกินกว่าจะแสดงอ่านได้สะดวก ลองลดจำนวนองค์ประกอบ</p>'; return; }
    const unk = []; for (let k = 0; k < n; k++) unk.push('v<sub>' + (k + 1) + '</sub>'); for (const e of brLabel) unk.push('i<sub>' + esc(e.lab) + '</sub>');
    const fmt = (v) => { if (Math.abs(v) < 1e-15) return '<span class="z">·</span>'; const s = Math.abs(v) >= 1e4 || Math.abs(v) < 1e-3 ? v.toExponential(2) : Number(v.toPrecision(4)).toString(); return s; };
    let h = '<div class="tbl-wrap"><table class="mna"><thead><tr><th></th>' + unk.map((u) => '<th>' + u + '</th>').join('') + '<th class="eq"></th><th>z</th></tr></thead><tbody>';
    for (let i = 0; i < N; i++) {
      const lab = i < n ? 'KCL โหนด ' + (i + 1) : 'กิ่ง ' + esc(brLabel[i - n].lab);
      h += '<tr' + (i === n ? ' class="sep"' : '') + '><th>' + lab + '</th>' + A[i].map((v, j) => '<td>' + fmt(i === j && i < n ? v - 1e-12 : v) + '</td>').join('') + '<td class="eq">' + (i === 0 ? '=' : '') + '</td><td>' + fmt(z[i]) + '</td></tr>';
    }
    h += '</tbody></table></div>';
    h += '<p class="muted small">แถวบน ' + n + ' แถวคือ KCL ที่แต่ละโหนด (ผลรวมกระแสที่ไหลออก = 0) ส่วนแถวล่าง ' + brLabel.length + ' แถวคือสมการของกิ่งที่ต้องรู้กระแส เช่น แหล่งจ่ายแรงดัน แอมมิเตอร์ และตัวเหนี่ยวนำซึ่งลัดวงจรในสภาวะ DC หน่วยของสัมประสิทธิ์ในแถว KCL คือซีเมนส์ (S)' + (r.x ? ' · คำตอบ: ' + unk.map((u, k) => u + ' = ' + (k < n ? fmtSI(r.x[k], 'V', 4) : fmtSI(r.x[k], 'A', 4))).join(', ') : '') + '</p>';
    box.innerHTML = h;
  }

  /* ---------- transient plots ---------- */
  const SER = ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6', '--s7', '--s8'];
  const traces = { v: new Set(), i: new Set() };
  function slotOf(id) { if (!st.slots.has(id)) st.slots.set(id, st.slots.size % 8); return st.slots.get(id); }
  function buildTraceChips() {
    const els = st.comps.filter((c) => TWO.has(c.t));
    for (const k of ['v', 'i']) for (const id of [...traces[k]]) if (!byId(id)) traces[k].delete(id);
    if (!traces.v.size && !traces.i.size) {
      for (const c of els) { if (c.t === 'C' || c.t === 'VM') traces.v.add(c.id); if (c.t === 'L' || c.t === 'A') traces.i.add(c.id); }
      if (!traces.v.size && !traces.i.size && els[0]) { traces.v.add(els[0].id); traces.i.add(els[0].id); }
    }
    for (const k of ['v', 'i']) {
      const box = $('lab-chips-' + k); const cs = getComputedStyle(DCROOT());
      box.innerHTML = els.filter((c) => !(k === 'i' && c.t === 'VM') && !(k === 'v' && c.t === 'A')).map((c) => {
        const on = traces[k].has(c.id); const col = cs.getPropertyValue(SER[slotOf(c.id)]).trim();
        return '<button class="tchip' + (on ? ' on' : '') + '" data-k="' + k + '" data-id="' + c.id + '" aria-pressed="' + on + '"><i style="background:' + (on ? col : 'transparent') + ';border-color:' + col + '"></i>' + k + '(' + esc(c.lab) + ')</button>';
      }).join('');
      box.querySelectorAll('.tchip').forEach((b) => b.onclick = () => { const s = traces[b.dataset.k]; if (s.has(b.dataset.id)) s.delete(b.dataset.id); else if (s.size < 8) s.add(b.dataset.id); buildTraceChips(); drawPlots(); });
    }
  }
  function niceTicks(lo, hi, n = 5) {
    if (hi - lo < 1e-15) { hi = lo + 1; lo = lo - 1; }
    const span = hi - lo, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0))); const f = step0 / mag;
    const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag; const t0 = Math.ceil(lo / step - 1e-9) * step; const out = [];
    for (let t = t0; t <= hi + step * 1e-6; t += step) out.push(Math.abs(t) < step * 1e-9 ? 0 : t); return out;
  }
  const plotState = { hoverX: null };
  function drawPlots() {
    for (const k of ['v', 'i']) drawPlot($('lab-plot-' + k), k);
  }
  function drawPlot(pc, k) {
    const T = st.tran; const box = pc.parentElement; const W = Math.max(240, box.clientWidth - 12), H = 190, dpr = window.devicePixelRatio || 1;
    pc.width = W * dpr; pc.height = H * dpr; pc.style.width = W + 'px'; pc.style.height = H + 'px';
    const g = pc.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const cs = getComputedStyle(DCROOT()); const C = (n) => cs.getPropertyValue(n).trim();
    if (!T || !T.ok) { g.fillStyle = C('--ink-3'); g.font = '13px "IBM Plex Sans Thai",sans-serif'; g.fillText('ยังไม่มีผลจำลอง', 12, 24); return; }
    const ids = [...traces[k]].filter((id) => T.el[id]);
    const L = 58, Rr = 12, Tp = 14, B = 30; const pw = W - L - Rr, ph = H - Tp - B;
    let lo = 0, hi = 0; for (const id of ids) for (const v of T.el[id][k]) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const pad = (hi - lo) * 0.08 || 1; const yt = niceTicks(lo - (lo < 0 ? pad : 0), hi + pad, 4); const y0 = Math.min(yt[0], lo), y1 = Math.max(yt[yt.length - 1], hi);
    const tEnd = T.t[T.t.length - 1]; const xt = niceTicks(0, tEnd, 6);
    const px = (t) => L + (t / tEnd) * pw, py = (v) => Tp + ph - ((v - y0) / (y1 - y0)) * ph;
    g.font = '11px "IBM Plex Mono",monospace'; g.textBaseline = 'middle';
    g.strokeStyle = C('--grid-2'); g.lineWidth = 1; g.fillStyle = C('--ink-3');
    for (const v of yt) { if (v < y0 - 1e-12 || v > y1 + 1e-12) continue; const y = Math.round(py(v)) + 0.5; g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke(); g.textAlign = 'right'; g.fillText(fmtSI(v, k === 'v' ? 'V' : 'A', 3), L - 6, y); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const t of xt) { if (t > tEnd * 1.0001) continue; const x = Math.round(px(t)) + 0.5; g.beginPath(); g.moveTo(x, Tp + ph); g.lineTo(x, Tp + ph + 4); g.stroke(); g.fillText(fmtSI(t, 's', 3), x, Tp + ph + 7); }
    g.strokeStyle = C('--ink-3'); g.beginPath(); g.moveTo(L + 0.5, Tp); g.lineTo(L + 0.5, Tp + ph + 0.5); g.lineTo(L + pw, Tp + ph + 0.5); g.stroke();
    for (const id of ids) {
      const arr = T.el[id][k]; g.strokeStyle = C(SER[slotOf(id)]); g.lineWidth = 2; g.beginPath();
      arr.forEach((v, j) => { const x = px(T.t[j]), y = py(v); j ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    }
    // time cursor
    const xc = px(T.t[st.tIdx]); g.strokeStyle = C('--copper'); g.lineWidth = 1.5; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(xc, Tp); g.lineTo(xc, Tp + ph); g.stroke(); g.setLineDash([]);
    for (const id of ids) { const v = T.el[id][k][st.tIdx]; g.fillStyle = C(SER[slotOf(id)]); g.strokeStyle = C('--sheet'); g.lineWidth = 2; g.beginPath(); g.arc(xc, py(v), 4.5, 0, 7); g.fill(); g.stroke(); }
    g.fillStyle = C('--ink-2'); g.font = '600 12px "IBM Plex Sans Thai",sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(k === 'v' ? 'แรงดัน' : 'กระแส', L + 6, Tp + 2);
    pc._map = { L, pw, tEnd };
  }
  function plotPointer(e) {
    const pc = e.currentTarget; const m = pc._map; if (!m || !st.tran || !st.tran.ok) return;
    const r = pc.getBoundingClientRect(); const t = Math.max(0, Math.min(m.tEnd, ((e.clientX - r.left - m.L) / m.pw) * m.tEnd));
    const T = st.tran.t; let j = 0; while (j < T.length - 1 && T[j] < t) j++;
    if (e.type === 'pointerdown' || e.buttons) { st.tIdx = j; $('lab-scrub').value = j; updateTimeReadout(); drawPlots(); renderSideResults(); draw(); }
    const k = pc.id.endsWith('v') ? 'v' : 'i'; const ids = [...traces[k]].filter((id) => st.tran.el[id]);
    const ptip = $('lab-ptip');
    ptip.innerHTML = '<b>t = ' + fmtSI(T[j], 's', 4) + '</b><br>' + ids.map((id) => esc(byId(id).lab) + ': ' + fmtSI(st.tran.el[id][k][j], k === 'v' ? 'V' : 'A', 4)).join('<br>');
    ptip.hidden = false; const br = pc.parentElement.parentElement.getBoundingClientRect();
    ptip.style.left = Math.min(br.width - 170, e.clientX - br.left + 14) + 'px'; ptip.style.top = (e.clientY - br.top + 10) + 'px';
  }
  function updateTimeReadout() { if (st.tran && st.tran.ok) $('lab-time').textContent = 't = ' + fmtSI(st.tran.t[st.tIdx], 's', 4) + ' / ' + fmtSI(st.tran.t[st.tran.t.length - 1], 's', 3); }

  /* ---------- editing actions ---------- */
  function delSel() { const c = byId(st.sel); if (!c) return; pushUndo(); st.comps = st.comps.filter((q) => q !== c); for (const q of st.comps) if (q.ctrl === c.id) q.ctrl = null; st.sel = null; afterChange(true); }
  function rotSel() {
    const c = byId(st.sel); if (!c || c.t === 'G' || c.t === 'T') { st.orient = 1 - st.orient; return; }
    pushUndo(); const cx = (c.x1 + c.x2) / 2, cy = (c.y1 + c.y2) / 2, dx = c.x2 - c.x1, dy = c.y2 - c.y1;
    c.x1 = Math.round(cx + dy / 2); c.y1 = Math.round(cy - dx / 2); c.x2 = Math.round(cx - dy / 2); c.y2 = Math.round(cy + dx / 2);
    st.orient = Math.abs(c.y2 - c.y1) > Math.abs(c.x2 - c.x1) ? 1 : 0; afterChange();
  }
  function flipSel() { const c = byId(st.sel); if (!c || !TWO.has(c.t)) return; pushUndo(); [c.x1, c.y1, c.x2, c.y2] = [c.x2, c.y2, c.x1, c.y1]; afterChange(); }
  let saveTimer = null;
  function afterChange(full) {
    if (full !== true) { /* keep selection */ }
    if (st.sel && !byId(st.sel)) st.sel = null;
    solve(); renderProps(); draw();
    clearTimeout(saveTimer); saveTimer = setTimeout(() => store.set('dc-lab-v1', snapshot()), 400);
    $('lab-undo').disabled = !st.undo.length; $('lab-redo').disabled = !st.redo.length;
  }
  function setTool(t) {
    st.tool = t; st.ghost = null;
    document.querySelectorAll('#lab-tools [data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === t));
    const dep = $('lab-dep'); dep.classList.toggle('on', ['E', 'Gd', 'H', 'F'].includes(t)); if (!['E', 'Gd', 'H', 'F'].includes(t)) dep.value = '';
    cv.style.cursor = t === 'select' ? 'default' : t === 'delete' ? 'not-allowed' : 'crosshair';
    $('lab-hint').textContent = t === 'select' ? 'แตะอุปกรณ์เพื่อเลือก ลากเพื่อย้าย ลากจุดปลายเพื่อยืด' : t === 'W' ? 'ลากจากจุดกริดหนึ่งไปอีกจุดเพื่อเดินสาย (เลี้ยวมุมฉากให้อัตโนมัติ)' : t === 'delete' ? 'แตะสิ่งที่ต้องการลบ' : 'แตะจุดบนกริดเพื่อวาง' + (t === 'G' ? 'กราวด์' : ' · ปุ่ม R สลับแนวนอน/แนวตั้ง (ตอนนี้: ' + (st.orient ? 'แนวตั้ง' : 'แนวนอน') + ')');
    draw();
  }
  function setMode(m, silent) {
    st.mode = m;
    document.querySelectorAll('#lab-mode button').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
    $('lab-tran').hidden = m !== 'tran';
    if (!silent) { if (m === 'tran') runTran(); renderTable(); renderSideResults(); draw(); }
  }

  /* ---------- pointer interaction ---------- */
  cv.addEventListener('pointerdown', (e) => {
    cv.focus({ preventScroll: true });
    const { wx, wy } = world(e); const gx = clampX(Math.round(wx)), gy = clampY(Math.round(wy)); const t = st.tool;
    if (t === 'select') {
      const sc = byId(st.sel);
      if (sc && sc.t !== 'G' && sc.t !== 'T') {
        for (const end of [1, 2]) { const ex = sc['x' + end], ey = sc['y' + end]; if (Math.hypot(wx - ex, wy - ey) < 0.42) { st.drag = { kind: 'end', c: sc, end, moved: false, snap: snapshot() }; cv.setPointerCapture(e.pointerId); return; } }
      }
      const h = hit(wx, wy);
      if (h) {
        st.sel = h.id; renderProps(); renderTable();
        const ends = [[h.x1, h.y1], [h.x2, h.y2]]; const attached = [];
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
    // place component
    pushUndo();
    let c;
    if (t === 'G') c = { id: nid(), t: 'G', x1: gx, y1: gy, x2: gx, y2: gy };
    else {
      const [dx, dy] = st.orient ? [0, 1] : [1, 0];
      let x1 = gx - dx, y1 = gy - dy, x2 = gx + dx, y2 = gy + dy;
      if (x1 < 0 || y1 < 0) { x1 += dx; y1 += dy; x2 += dx; y2 += dy; } if (x2 > st.cols || y2 > st.rows) { x1 -= dx; y1 -= dy; x2 -= dx; y2 -= dy; }
      c = { id: nid(), t, x1, y1, x2, y2, v: TYPES[t].def, lab: nextLabel(t) };
      if (TYPES[t].ctrl) { const cand = st.comps.filter((q) => TWO.has(q.t) && (TYPES[t].ctrl === 'v' || q.t === 'A' || q.t === 'V')); c.ctrl = cand.length ? cand[0].id : null; }
    }
    st.comps.push(c); st.sel = c.id; afterChange();
  });
  cv.addEventListener('pointermove', (e) => {
    const { wx, wy } = world(e); const d = st.drag;
    if (d) {
      if (d.kind === 'pan') {
        const dx = e.clientX - d.sx, dy = e.clientY - d.sy; wrap.scrollLeft = d.sl - dx;
        if (wrap.scrollHeight > wrap.clientHeight + 2) wrap.scrollTop = d.stp - dy; else window.scrollTo(0, d.py - dy);
        return;
      }
      if (d.kind === 'move') {
        const dx = Math.round(wx - d.sx), dy = Math.round(wy - d.sy); const c = d.c;
        const nx1 = d.o[0] + dx, ny1 = d.o[1] + dy, nx2 = d.o[2] + dx, ny2 = d.o[3] + dy;
        if (Math.min(nx1, nx2) < 0 || Math.min(ny1, ny2) < 0 || Math.max(nx1, nx2) > st.cols || Math.max(ny1, ny2) > st.rows) return;
        if (nx1 !== c.x1 || ny1 !== c.y1) { c.x1 = nx1; c.y1 = ny1; c.x2 = nx2; c.y2 = ny2; for (const a of d.att) { a.w['x' + a.end] = a.ox + dx; a.w['y' + a.end] = a.oy + dy; } d.moved = true; solveLight(); }
      } else if (d.kind === 'end') {
        const gx = clampX(Math.round(wx)), gy = clampY(Math.round(wy)); const c = d.c; const o = d.end === 1 ? [c.x2, c.y2] : [c.x1, c.y1];
        if ((gx !== o[0] || gy !== o[1]) && (gx !== c['x' + d.end] || gy !== c['y' + d.end])) { c['x' + d.end] = gx; c['y' + d.end] = gy; d.moved = true; solveLight(); }
      } else if (d.kind === 'wire') {
        const gx = clampX(Math.round(wx)), gy = clampY(Math.round(wy)); st.ghost = wirePath(d.x0, d.y0, gx, gy, Math.abs(wx - d.x0) >= Math.abs(wy - d.y0)); draw();
      }
      return;
    }
    // hover
    const h = st.tool === 'select' || st.tool === 'delete' ? hit(wx, wy) : null; const hid = h ? h.id : null;
    if (hid !== st.hover) { st.hover = hid; draw(); }
    showTip(e, wx, wy, h);
  });
  function wirePath(x0, y0, x1, y1, horFirst) {
    const out = [];
    if (x0 === x1 || y0 === y1) { if (x0 !== x1 || y0 !== y1) out.push({ t: 'W', x1: x0, y1: y0, x2: x1, y2: y1 }); return out; }
    if (horFirst) { out.push({ t: 'W', x1: x0, y1: y0, x2: x1, y2: y0 }, { t: 'W', x1: x1, y1: y0, x2: x1, y2: y1 }); }
    else { out.push({ t: 'W', x1: x0, y1: y0, x2: x0, y2: y1 }, { t: 'W', x1: x0, y1: y1, x2: x1, y2: y1 }); }
    return out;
  }
  let lightTimer = null;
  function solveLight() { draw(); clearTimeout(lightTimer); lightTimer = setTimeout(() => { st.res = DCE.solveDC(st.comps); renderStatus(); draw(); }, 30); }
  function endDrag() {
    const d = st.drag; st.drag = null; if (!d) return;
    if (d.kind === 'wire') { const segs = st.ghost || []; st.ghost = null; if (segs.length) { pushUndo(); for (const s of segs) st.comps.push(Object.assign({ id: nid() }, s)); afterChange(); } else draw(); return; }
    if (d.moved) { st.undo.push(d.snap); st.redo = []; afterChange(); }
  }
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('pointerleave', () => { if (!st.drag) { tip.hidden = true; if (st.hover) { st.hover = null; draw(); } } });
  cv.addEventListener('dblclick', () => { const v = $('pp-val'); if (v) { v.focus(); v.select(); } });
  function showTip(e, wx, wy, h) {
    const R = displayRes(); if (!R) { tip.hidden = true; return; }
    let txt = null;
    if (h && TWO.has(h.t) && R.elem[h.id]) { const r = R.elem[h.id]; txt = '<b>' + esc(h.lab) + '</b> ' + esc(RND.valueText(h)) + '<br>v = ' + fmtSI(r.v, 'V', 4) + '<br>i = ' + fmtSI(r.i, 'A', 4) + '<br>p = ' + fmtSI(r.p, 'W', 4); }
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
    else if (e.key === 'Escape') { st.sel = null; setTool('select'); renderProps(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if (c && e.key.startsWith('Arrow') && c.t !== 'T') {
      e.preventDefault(); const [dx, dy] = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (Math.min(c.x1, c.x2) + dx < 0 || Math.min(c.y1, c.y2) + dy < 0 || Math.max(c.x1, c.x2) + dx > st.cols || Math.max(c.y1, c.y2) + dy > st.rows) return;
      pushUndo(); c.x1 += dx; c.x2 += dx; c.y1 += dy; c.y2 += dy; afterChange();
    }
  });

  /* ---------- toolbar wiring ---------- */
  document.querySelectorAll('#lab-tools [data-tool]').forEach((b) => b.onclick = () => setTool(b.dataset.tool));
  $('lab-dep').onchange = (e) => { if (e.target.value) setTool(e.target.value); };
  $('lab-undo').onclick = undo; $('lab-redo').onclick = redo;
  $('lab-rot').onclick = () => { rotSel(); setTool(st.tool); };
  $('lab-clear').onclick = () => { if (!st.comps.length) return; load([]); $('lab-cleared').hidden = false; setTimeout(() => $('lab-cleared').hidden = true, 4000); };
  $('lab-zin').onclick = () => { st.zoom += 3; fit(); }; $('lab-zout').onclick = () => { st.zoom -= 3; fit(); }; $('lab-zfit').onclick = fitCircuit;
  const preset = $('lab-preset');
  preset.innerHTML = '<option value="">เลือกวงจรตัวอย่าง…</option>' + CK.PRESETS.map((p) => '<option value="' + p.k + '">' + p.name + '</option>').join('');
  preset.onchange = () => { const p = CK.PRESETS.find((q) => q.k === preset.value); if (p) { load(p.f(), { mode: p.tran ? 'tran' : 'dc' }); if (p.tran) runTran(); } preset.value = ''; };
  document.querySelectorAll('#lab-mode button').forEach((b) => b.onclick = () => setMode(b.dataset.mode));
  const tog = (id, k) => { const el = $(id); el.checked = st[k]; el.onchange = () => { st[k] = el.checked; if (k === 'iec') window.dispatchEvent(new Event('dc-redraw')); draw(); }; };
  tog('opt-iec', 'iec'); tog('opt-val', 'showVal'); tog('opt-nodes', 'showNodes'); tog('opt-dots', 'dots');
  $('lab-scrub').oninput = (e) => { st.tIdx = +e.target.value; updateTimeReadout(); drawPlots(); renderSideResults(); renderTable(); draw(); };
  $('lab-play').onclick = () => { if (!st.tran || !st.tran.ok) runTran(); if (st.tIdx >= st.tran.t.length - 1) st.tIdx = 0; st.playing = !st.playing; $('lab-play').textContent = st.playing ? '❚❚ หยุด' : '▶ เล่น'; };
  $('lab-tend').onchange = (e) => { const v = parseSI(e.target.value.replace(/s$/, '')); if (v > 0) { st.tEnd = v; st.autoT = false; $('lab-auto').checked = false; runTran(); } };
  $('lab-auto').onchange = (e) => { st.autoT = e.target.checked; runTran(); };
  ['lab-plot-v', 'lab-plot-i'].forEach((id) => { const p = $(id); p.addEventListener('pointermove', plotPointer); p.addEventListener('pointerdown', plotPointer); p.addEventListener('pointerleave', () => $('lab-ptip').hidden = true); });
  document.querySelectorAll('#lab-tabs button').forEach((b) => b.onclick = () => {
    document.querySelectorAll('#lab-tabs button').forEach((q) => { q.classList.toggle('on', q === b); q.setAttribute('aria-selected', q === b); });
    document.querySelectorAll('.lab-pane').forEach((p) => p.hidden = p.id !== b.dataset.pane);
  });
  $('lab-copy').onclick = () => {
    const txt = JSON.stringify(st.comps.map(({ id, t, x1, y1, x2, y2, v, lab, ctrl, lp }) => ({ id, t, x1, y1, x2, y2, v, lab, ctrl, lp })));
    const ta = $('lab-json'); ta.value = txt; $('lab-io').hidden = false;
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { $('lab-io-msg').textContent = 'คัดลอกข้อความวงจรแล้ว นำไปวางในช่องนี้บนเครื่องอื่นเพื่อเปิดวงจรเดิม'; }).catch(() => { ta.select(); $('lab-io-msg').textContent = 'เลือกข้อความไว้แล้ว กด Ctrl+C เพื่อคัดลอก'; });
  };
  $('lab-paste').onclick = () => { $('lab-io').hidden = false; $('lab-json').value = ''; $('lab-json').focus(); $('lab-io-msg').textContent = 'วางข้อความวงจร (JSON) แล้วกด เปิดวงจร'; };
  $('lab-load').onclick = () => { try { const a = JSON.parse($('lab-json').value); if (!Array.isArray(a)) throw 0; load(a.filter((c) => c && c.t)); $('lab-io-msg').textContent = 'เปิดวงจรแล้ว'; } catch (e) { $('lab-io-msg').textContent = 'อ่านข้อความไม่ได้ ตรวจว่าคัดลอกมาครบทั้งหมด'; } };

  new ResizeObserver(() => { fit(); if (st.mode === 'tran') drawPlots(); }).observe(wrap);
  new IntersectionObserver((en) => { st.visible = en[0].isIntersecting; }).observe(cv);
  window.addEventListener('dc-redraw', () => { draw(); if (st.mode === 'tran') { buildTraceChips(); drawPlots(); } });

  // initial circuit
  let init = null; try { init = JSON.parse(store.get('dc-lab-v1') || 'null'); } catch (e) { }
  st.comps = (Array.isArray(init) && init.length ? init : CK.P.twoNode()).map((c) => Object.assign({}, c));
  { const map = new Map(); for (const c of st.comps) { const id = nid(); map.set(c.id, id); c.id = id; } for (const c of st.comps) if (c.ctrl) c.ctrl = map.get(c.ctrl) || c.ctrl; }
  setTool('select'); fitCircuit(); afterChange(); st.undo = []; $('lab-undo').disabled = true;
  requestAnimationFrame(loop);

  return {
    get iec() { return st.iec; },
    open(comps, opt = {}) { load(comps, opt); if (opt.mode === 'tran') runTran(); document.getElementById('lab').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); if (opt.note) { $('lab-hint').textContent = opt.note; } },
    redraw() { draw(); }
  };
})();
window.LAB = LAB;
