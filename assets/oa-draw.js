/* Op-amp lab schematic renderer (lesson 26). Shared by the lab, lesson figures and problem figures. Needs oa-core.js (OAE).
   Colour tokens are read from the .dcx element (same tokens as the DC circuits lab). */
const DCROOT = () => document.querySelector('.dcx') || document.documentElement;
const OAR = (() => {
  const { fmtSI, key, TWO, opPins } = OAE;
  const FS = (s, k) => Math.max(k >= 0.5 ? 11 : 9.5, Math.round(s * k));
  let COL = null;
  function readColors() {
    const cs = getComputedStyle(DCROOT()); const g = (n) => cs.getPropertyValue(n).trim();
    COL = { ink: g('--ink'), ink2: g('--ink-2'), ink3: g('--ink-3'), grid: g('--grid'), grid2: g('--grid-2'), copper: g('--copper'), flow: g('--flow'), flow2: g('--flow-2'), sheet: g('--sheet'), paper: g('--paper'), vpos: g('--vpos'), vneg: g('--vneg'), ok: g('--ok'), bad: g('--bad'), rule: g('--rule') };
    return COL;
  }
  const hex2rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
  const FONT_UI = '"IBM Plex Sans Thai","Noto Sans Thai",system-ui,sans-serif';
  const FONT_MONO = '"IBM Plex Mono",ui-monospace,Menlo,monospace';
  const trimNum = (v) => Number((+v).toPrecision(4)).toString();
  const rotP = (x, y, r) => (r === 0 ? [x, y] : r === 1 ? [-y, x] : r === 2 ? [-x, -y] : [y, -x]);
  const WNAME = { sin: '∿', sq: '⊓', pulse: '⊓', tri: '△', step: '⎍' };

  function valueText(c) {
    const v = +c.v;
    switch (c.t) {
      case 'R': return fmtSI(v, 'Ω');
      case 'L': return fmtSI(v, 'H');
      case 'C': return fmtSI(v, 'F') + (c.ic !== undefined && c.ic !== '' && isFinite(+c.ic) ? ' · ic ' + fmtSI(+c.ic, 'V') : '');
      case 'V': case 'I': {
        const u = c.t === 'V' ? 'V' : 'A', k = c.w || 'dc';
        if (k === 'dc') return fmtSI(v, u);
        if (k === 'step') return 'สเต็ป ' + fmtSI(v, u);
        return fmtSI(v, u) + ' ' + WNAME[k] + ' ' + fmtSI(+c.f || 1000, 'Hz') + (+c.off ? ' +' + fmtSI(+c.off, u) : '');
      }
      case 'D': return 'Vf ' + fmtSI(v, 'V');
      default: return '';
    }
  }
  const modelShort = (c) => { const m = OAE.OPM[c.m]; return !m ? 'อุดมคติ' : m.short || m.name.split(' ')[0]; };

  function bbox(comps) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const inc = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
    for (const c of comps) {
      if (c.t === 'OP') { for (const [x, y] of opPins(c)) inc(x, y); inc(c.x1 - 0.5, c.y1 - 2.6); inc(c.x1 + 0.5, c.y1 + 2.6); continue; }
      inc(c.x1, c.y1); inc(c.x2, c.y2);
      if (c.t === 'G') inc(c.x1, c.y1 + 1.3);
      if (TWO.has(c.t)) {
        const hor = Math.abs(c.x2 - c.x1) >= Math.abs(c.y2 - c.y1); const mx = (c.x1 + c.x2) / 2, my = (c.y1 + c.y2) / 2; const lp = c.lp || 1;
        if (hor) inc(mx, my - lp * 1.6); else inc(mx + lp * 2.6, my);
      }
      if (c.t === 'P') { inc(c.x1 + 2.6, c.y1); }
      if (c.t === 'T') { const s = c.side || 'r'; inc(c.x1 + (s === 'r' ? 1.2 : s === 'l' ? -1.2 : 0), c.y1 + (s === 't' ? -0.8 : s === 'b' ? 0.8 : 0)); }
    }
    if (!isFinite(x0)) return { x0: 0, y0: 0, x1: 10, y1: 6 };
    return { x0, y0, x1, y1 };
  }

  function degreeMap(comps) {
    const deg = new Map(); const inc = (k, d) => deg.set(k, (deg.get(k) || 0) + d);
    for (const c of comps) {
      if (c.t === 'W') {
        inc(key(c.x1, c.y1), 1); inc(key(c.x2, c.y2), 1);
        if (c.x1 === c.x2 || c.y1 === c.y2) { const dx = Math.sign(c.x2 - c.x1), dy = Math.sign(c.y2 - c.y1); let x = c.x1 + dx, y = c.y1 + dy; while (x !== c.x2 || y !== c.y2) { inc(key(x, y), 2); x += dx; y += dy; } }
      } else if (TWO.has(c.t)) { inc(key(c.x1, c.y1), 1); inc(key(c.x2, c.y2), 1); }
      else if (c.t === 'G') inc(key(c.x1, c.y1), 1);
      else if (c.t === 'OP') for (const [x, y] of opPins(c)) inc(key(x, y), 1);
    }
    return deg;
  }

  /* o: {cell, ox, oy, grid, cols, rows, iec, showVal, showLab, res, nodeColor, sel, hover, phase, dots, nodeNames, ghost} */
  function draw(ctx, comps, o) {
    const C = COL || readColors(); opTri.ctx = ctx;
    const s = o.cell; const X = (x) => o.ox + x * s, Y = (y) => o.oy + y * s;
    const res = o.res;
    if (o.grid) { ctx.fillStyle = C.grid2; for (let x = 0; x <= o.cols; x++) for (let y = 0; y <= o.rows; y++) ctx.fillRect(X(x) - 0.75, Y(y) - 0.75, 1.5, 1.5); }
    let vmax = 0; const net = res && res.net;
    if (res && res.nodeV) for (const v of res.nodeV) vmax = Math.max(vmax, Math.abs(v));
    const nodeCol = (x, y) => {
      if (!res || !o.nodeColor || !net) return C.ink;
      const k = net.nodeOfKey(key(x, y)); if (k === undefined) return C.ink3;
      const v = k < 0 ? 0 : res.nodeV[k]; if (vmax < 1e-12) return C.ink2;
      const t = Math.max(-1, Math.min(1, v / vmax));
      return t >= 0 ? mix(C.ink3, C.vpos, t) : mix(C.ink3, C.vneg, -t);
    };
    const lw = Math.max(1.6, s * 0.075);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const c of comps) if (c.t === 'T' && c.box) { ctx.save(); ctx.setLineDash([s * 0.25, s * 0.18]); ctx.strokeStyle = C.ink3; ctx.lineWidth = 1.2; ctx.strokeRect(X(c.box[0]), Y(c.box[1]), (c.box[2] - c.box[0]) * s, (c.box[3] - c.box[1]) * s); ctx.restore(); }
    const halo = (c, color, alpha) => {
      ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.globalAlpha = alpha; ctx.lineCap = 'round';
      if (c.t === 'OP') { ctx.lineWidth = s * 0.5; ctx.beginPath(); opTri(c, X, Y, 1.15, true); ctx.fill(); ctx.stroke(); }
      else if (c.t === 'P') { ctx.beginPath(); ctx.arc(X(c.x1), Y(c.y1), s * 0.45, 0, 7); ctx.fill(); }
      else { ctx.lineWidth = s * 0.62; ctx.beginPath(); if (c.t === 'G') { ctx.moveTo(X(c.x1), Y(c.y1)); ctx.lineTo(X(c.x1), Y(c.y1) + s * 0.9); } else { ctx.moveTo(X(c.x1), Y(c.y1)); ctx.lineTo(X(c.x2), Y(c.y2)); } ctx.stroke(); }
      ctx.restore();
    };
    for (const c of comps) { if (c.id === o.sel) halo(c, C.flow2, 0.95); else if (c.id === o.hover) halo(c, C.flow2, 0.55); }
    for (const c of comps) if (c.t === 'W') { ctx.strokeStyle = nodeCol(c.x1, c.y1); ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(X(c.x1), Y(c.y1)); ctx.lineTo(X(c.x2), Y(c.y2)); ctx.stroke(); }
    for (const c of comps) if (TWO.has(c.t)) drawElem(ctx, c, o, C, X, Y, nodeCol(c.x1, c.y1), nodeCol(c.x2, c.y2), lw);
    for (const c of comps) if (c.t === 'OP') drawOp(ctx, c, o, C, X, Y, nodeCol, lw);
    for (const c of comps) if (c.t === 'G') {
      const x = X(c.x1), y = Y(c.y1); ctx.strokeStyle = C.ink; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + s * 0.5);
      [0.9, 0.58, 0.26].forEach((w, i) => { ctx.moveTo(x - w * s / 2, y + s * (0.5 + i * 0.18)); ctx.lineTo(x + w * s / 2, y + s * (0.5 + i * 0.18)); });
      ctx.stroke();
    }
    const deg = degreeMap(comps);
    for (const [k, d] of deg) if (d >= 3) { const [x, y] = k.split(',').map(Number); ctx.fillStyle = nodeCol(x, y); ctx.beginPath(); ctx.arc(X(x), Y(y), Math.max(2.6, s * 0.13), 0, 7); ctx.fill(); }
    const selC = comps.find((c) => c.id === o.sel);
    if (selC && TWO.has(selC.t)) for (const [x, y] of [[selC.x1, selC.y1], [selC.x2, selC.y2]]) { ctx.fillStyle = C.sheet; ctx.strokeStyle = C.flow; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(X(x) - s * 0.17, Y(y) - s * 0.17, s * 0.34, s * 0.34); ctx.fill(); ctx.stroke(); }
    if (selC && selC.t === 'OP') for (const [x, y] of opPins(selC)) { ctx.fillStyle = C.sheet; ctx.strokeStyle = C.flow; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(X(x) - s * 0.15, Y(y) - s * 0.15, s * 0.3, s * 0.3); ctx.fill(); ctx.stroke(); }
    // probes
    for (const c of comps) if (c.t === 'P') drawProbe(ctx, c, o, C, X, Y, nodeCol);
    // texts
    for (const c of comps) if (c.t === 'T') {
      const x = X(c.x1), y = Y(c.y1); if (!c.lab) continue;
      ctx.fillStyle = c.small ? C.ink3 : C.ink; ctx.font = (c.small ? '500 ' : 'italic 600 ') + FS(s, c.small ? 0.44 : 0.62) + 'px ' + (c.small ? FONT_UI : '"Trirong",Georgia,serif');
      const sd = c.side || 'r'; ctx.textAlign = sd === 'l' ? 'right' : sd === 'r' ? 'left' : 'center'; ctx.textBaseline = sd === 't' ? 'bottom' : sd === 'b' ? 'top' : 'middle';
      ctx.fillText(c.lab, x + (sd === 'l' ? -s * 0.35 : sd === 'r' ? s * 0.35 : 0), y + (sd === 't' ? -s * 0.2 : sd === 'b' ? s * 0.2 : 0));
    }
    // current dots
    if (res && res.elem && o.dots) {
      let imax = 0; for (const c of comps) if (TWO.has(c.t) && res.elem[c.id]) imax = Math.max(imax, Math.abs(res.elem[c.id].i));
      if (imax > 1e-12) for (const c of comps) if (TWO.has(c.t) && res.elem[c.id]) {
        const i = res.elem[c.id].i; if (Math.abs(i) < imax * 1e-4 || Math.abs(i) < 1e-13) continue;
        const ax = X(c.x1), ay = Y(c.y1), bx = X(c.x2), by = Y(c.y2); const L = Math.hypot(bx - ax, by - ay);
        const kk = Math.max(0, Math.min(1, (Math.log10(Math.abs(i) / imax) + 3) / 3)); const sp = s * 0.62, speed = s * (0.5 + 2.4 * kk);
        let off = ((o.phase || 0) * speed) % sp; if (i < 0) off = sp - off; ctx.fillStyle = C.flow;
        for (let d = off; d < L; d += sp) { const t = d / L; ctx.beginPath(); ctx.arc(ax + (bx - ax) * t, ay + (by - ay) * t, Math.max(2, s * 0.09), 0, 7); ctx.fill(); }
      }
    }
    if (res && o.nodeNames && net) {
      ctx.font = '500 ' + FS(s, 0.4) + 'px ' + FONT_MONO; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      net.order.forEach((k, idx) => { const [x, y] = k.split(',').map(Number); const t = 'n' + (idx + 1) + ' ' + fmtSI(res.nodeV[idx], 'V'); const w = ctx.measureText(t).width; const px = X(x) + s * 0.2, py = Y(y) - s * 0.2; ctx.fillStyle = C.sheet; ctx.globalAlpha = 0.86; ctx.fillRect(px - 2, py - s * 0.46, w + 4, s * 0.5); ctx.globalAlpha = 1; ctx.fillStyle = C.copper; ctx.fillText(t, px, py); });
    }
    if (o.ghost) {
      ctx.save(); ctx.globalAlpha = 0.45;
      for (const c of o.ghost) { if (c.t === 'W') { ctx.strokeStyle = C.flow; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(X(c.x1), Y(c.y1)); ctx.lineTo(X(c.x2), Y(c.y2)); ctx.stroke(); } else if (TWO.has(c.t)) drawElem(ctx, c, Object.assign({}, o, { res: null, showVal: false, showLab: false }), C, X, Y, C.flow, C.flow, lw); else if (c.t === 'OP') drawOp(ctx, c, Object.assign({}, o, { res: null, showVal: false, showLab: false }), C, X, Y, () => C.flow, lw); }
      ctx.restore();
    }
  }

  /* op-amp triangle path in grid-local coordinates, rotated; grow = scale factor */
  function opTri(c, X, Y, grow, closePath) {
    const r = ((c.rot | 0) % 4 + 4) % 4; const pts = [[-1.5, -1.75], [-1.5, 1.75], [1.65, 0]].map(([x, y]) => { const [a, b] = rotP(x * grow, y * grow, r); return [X(c.x1 + a), Y(c.y1 + b)]; });
    const ctx = opTri.ctx; if (!ctx) return;
    ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[2][0], pts[2][1]); if (closePath) ctx.closePath();
  }
  function drawOp(ctx, c, o, C, X, Y, nodeCol, lw) {
    const s = o.cell; opTri.ctx = ctx; const r = ((c.rot | 0) % 4 + 4) % 4, f = c.flip ? -1 : 1;
    const L = (lx, ly) => { const [a, b] = rotP(lx, ly, r); return [X(c.x1 + a), Y(c.y1 + b)]; };
    const pins = opPins(c);
    // leads
    const leads = [[[-2, -f], [-1.5, -f]], [[-2, f], [-1.5, f]], [[2, 0], [1.65, 0]]];
    leads.forEach(([p, q], i) => { const col = nodeCol(pins[i][0], pins[i][1]); const A = L(p[0], p[1]), B = L(q[0], q[1]); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); });
    ctx.strokeStyle = C.ink; ctx.fillStyle = C.sheet; ctx.lineWidth = lw; ctx.beginPath(); opTri(c, X, Y, 1, true); ctx.fill(); ctx.stroke();
    const glyph = (txt, lx, ly, size, color) => { const [px, py] = L(lx, ly); ctx.fillStyle = color; ctx.font = '600 ' + Math.max(9, Math.round(size)) + 'px ' + FONT_MONO; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, px, py + 0.5); };
    glyph('−', -1.0, -f * 1.0, s * 0.62, C.ink); glyph('+', -1.0, f * 1.0, s * 0.62, C.ink);
    if (o.showLab === false && o.showVal === false) return;
    const R = o.res && o.res.opx ? o.res.opx[c.id] : null; const sat = R && R.st !== 0;
    const lab = (txt, lx, ly, font, col) => { const [px, py] = L(lx, ly); ctx.font = font; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, px, py); };
    // labels sit on the side away from the pins' wiring: above for rot 0/2, right for rot 1, left for rot 3
    const up = r === 0 ? [0.1, -2.35] : r === 2 ? [0.1, -2.35] : [0.1, -2.35];
    if (o.showLab !== false && c.lab) lab(c.lab, up[0], up[1], '700 ' + FS(s, 0.5) + 'px ' + FONT_UI, C.ink);
    if (o.showVal !== false && !c.hideVal) {
      const vp = c.vp == null ? 15 : +c.vp, vn = c.vn == null ? -15 : +c.vn;
      lab(modelShort(c), 0.7, 2.3, '500 ' + FS(s, 0.4) + 'px ' + FONT_UI, C.ink3);
      lab(vp === -vn ? '±' + trimNum(vp) + ' V' : '+' + trimNum(vp) + '/' + trimNum(vn) + ' V', 0.7, 2.95, '500 ' + FS(s, 0.36) + 'px ' + FONT_MONO, C.ink3);
    }
    if (sat) {
      const P = OAE.opParams(c); const vo = o.res.elem && o.res.elem[c.id] ? o.res.elem[c.id].v : 0; const rail = Math.abs(vo - P.vmax) < 0.15 + 0.02 * Math.abs(P.vmax) || Math.abs(vo - P.vmin) < 0.15 + 0.02 * Math.abs(P.vmin);
      const [px, py] = L(0.3, 0); ctx.font = '700 ' + FS(s, 0.4) + 'px ' + FONT_MONO; ctx.fillStyle = C.copper; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(rail ? 'SAT' : 'SLEW', px, py);
    }
  }
  function drawProbe(ctx, c, o, C, X, Y, nodeCol) {
    const s = o.cell; const x = X(c.x1), y = Y(c.y1);
    ctx.fillStyle = C.sheet; ctx.strokeStyle = C.copper; ctx.lineWidth = Math.max(1.6, s * 0.075);
    ctx.beginPath(); ctx.arc(x, y, Math.max(3.2, s * 0.2), 0, 7); ctx.fill(); ctx.stroke();
    if (o.showLab === false && !o.res) return;
    const sd = c.side || 'r'; ctx.textBaseline = 'middle'; ctx.textAlign = sd === 'l' ? 'right' : sd === 'r' ? 'left' : 'center';
    const dx = sd === 'l' ? -s * 0.42 : sd === 'r' ? s * 0.42 : 0, dy = sd === 't' ? -s * 0.62 : sd === 'b' ? s * 0.62 : 0;
    const lines = []; if (o.showLab !== false && c.lab) lines.push({ t: c.lab, f: 'italic 600 ' + FS(s, 0.58) + 'px "Trirong",Georgia,serif', col: C.ink });
    const net = o.res && o.res.net;
    if (net && o.res.nodeV) { const k = net.nodeOfKey(key(c.x1, c.y1)); if (k !== undefined) lines.push({ t: fmtSI(k < 0 ? 0 : o.res.nodeV[k], 'V', 4), f: '700 ' + FS(s, 0.46) + 'px ' + FONT_MONO, col: C.copper }); }
    const lh = Math.max(s * 0.55, 12); const sdv = sd === 't' ? -1 : 1;
    lines.forEach((l, k) => { ctx.font = l.f; ctx.fillStyle = l.col; const yy = sd === 't' ? y + dy - (lines.length - 1 - k) * lh : sd === 'b' ? y + dy + k * lh : y + dy + (k - (lines.length - 1) / 2) * lh; ctx.fillText(l.t, x + dx, yy); });
  }

  function glyphWave(ctx, kind, r) {
    ctx.beginPath();
    if (kind === 'sin') { ctx.moveTo(-r * 0.62, 0); ctx.bezierCurveTo(-r * 0.35, -r * 0.85, -r * 0.1, -r * 0.85, 0, 0); ctx.bezierCurveTo(r * 0.1, r * 0.85, r * 0.35, r * 0.85, r * 0.62, 0); }
    else if (kind === 'sq') { ctx.moveTo(-r * 0.6, r * 0.42); ctx.lineTo(-r * 0.6, -r * 0.42); ctx.lineTo(0, -r * 0.42); ctx.lineTo(0, r * 0.42); ctx.lineTo(r * 0.6, r * 0.42); ctx.lineTo(r * 0.6, -r * 0.42); }
    else if (kind === 'pulse') { ctx.moveTo(-r * 0.62, r * 0.42); ctx.lineTo(-r * 0.3, r * 0.42); ctx.lineTo(-r * 0.3, -r * 0.42); ctx.lineTo(r * 0.1, -r * 0.42); ctx.lineTo(r * 0.1, r * 0.42); ctx.lineTo(r * 0.62, r * 0.42); }
    else if (kind === 'tri') { ctx.moveTo(-r * 0.62, 0); ctx.lineTo(-r * 0.31, -r * 0.5); ctx.lineTo(0, 0); ctx.lineTo(r * 0.31, r * 0.5); ctx.lineTo(r * 0.62, 0); }
    else if (kind === 'step') { ctx.moveTo(-r * 0.62, r * 0.42); ctx.lineTo(-r * 0.05, r * 0.42); ctx.lineTo(-r * 0.05, -r * 0.42); ctx.lineTo(r * 0.62, -r * 0.42); }
    ctx.stroke();
  }

  function drawElem(ctx, c, o, C, X, Y, colA, colB, lw) {
    const s = o.cell;
    const ax = X(c.x1), ay = Y(c.y1), bx = X(c.x2), by = Y(c.y2);
    const len = Math.hypot(bx - ax, by - ay); if (len < 2) return;
    const ang = Math.atan2(by - ay, bx - ax), cs = Math.cos(ang), sn = Math.sin(ang);
    const cx = (ax + bx) / 2, cy = (ay + by) / 2;
    const toS = (lx, ly) => [cx + cs * lx - sn * ly, cy + sn * lx + cs * ly];
    const hb = Math.min(0.8 * s, len * 0.42);
    const round = ['V', 'I', 'A', 'VM'].includes(c.t);
    const r = Math.min(0.62 * s, len * 0.4);
    const bodyHalf = c.t === 'C' ? 0.13 * s : c.t === 'D' ? 0.4 * s : round ? r : hb;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); ctx.lineWidth = lw;
    ctx.strokeStyle = colA; ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(-bodyHalf, 0); ctx.stroke();
    ctx.strokeStyle = colB; ctx.beginPath(); ctx.moveTo(bodyHalf, 0); ctx.lineTo(len / 2, 0); ctx.stroke();
    ctx.strokeStyle = C.ink; ctx.fillStyle = C.sheet; ctx.lineWidth = lw;
    switch (c.t) {
      case 'R':
        if (o.iec) { ctx.beginPath(); ctx.rect(-hb, -0.24 * s, 2 * hb, 0.48 * s); ctx.fill(); ctx.stroke(); }
        else { const n = 6, seg = 2 * hb / n, a = 0.27 * s; ctx.beginPath(); ctx.moveTo(-hb, 0); for (let k = 0; k < n; k++) ctx.lineTo(-hb + seg * (k + 0.5), k % 2 ? a : -a); ctx.lineTo(hb, 0); ctx.stroke(); }
        break;
      case 'L': { const rr = hb / 4; ctx.beginPath(); ctx.moveTo(-hb, 0); for (let k = 0; k < 4; k++) ctx.arc(-hb + rr * (2 * k + 1), 0, rr, Math.PI, 0, false); ctx.stroke(); break; }
      case 'C': { const g = 0.13 * s, hh = 0.44 * s; ctx.lineWidth = lw * 1.5; ctx.beginPath(); ctx.moveTo(-g, -hh); ctx.lineTo(-g, hh); ctx.moveTo(g, -hh); ctx.lineTo(g, hh); ctx.stroke(); break; }
      case 'D': { const h = 0.4 * s, w = 0.36 * s; ctx.beginPath(); ctx.moveTo(-h, -w); ctx.lineTo(-h, w); ctx.lineTo(h, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(h, -w); ctx.lineTo(h, w); ctx.stroke(); break; }
      case 'V': case 'I': case 'A': case 'VM':
        ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
        if (c.t === 'I') arrow(ctx, -0.55 * r, 0.55 * r, s);
        if (c.t === 'V' && c.w && c.w !== 'dc') { ctx.lineWidth = Math.max(1.3, lw * 0.85); glyphWave(ctx, c.w, r); }
        break;
    }
    ctx.restore();
    const glyph = (txt, lx, ly, size, color, font) => { const [px, py] = toS(lx, ly); ctx.fillStyle = color; ctx.font = font || ('600 ' + Math.max(9, Math.round(size)) + 'px ' + FONT_MONO); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, px, py + 0.5); };
    if (c.t === 'V') { if (!c.w || c.w === 'dc') { glyph('+', -r * 0.5, 0, s * 0.5, C.ink); glyph('−', r * 0.5, 0, s * 0.5, C.ink); } else glyph('+', -r - 0.24 * s, -0.4 * s * (Math.abs(cs) > 0.7 ? 1 : -1), s * 0.4, C.ink3); }
    if (c.t === 'A') { glyph('A', 0, 0, s * 0.56, C.ink); glyph('+', -r - 0.22 * s, -0.34 * s, s * 0.36, C.ink3); }
    if (c.t === 'VM') { glyph('V', 0, 0, s * 0.56, C.ink); glyph('+', -r - 0.22 * s, -0.34 * s, s * 0.36, C.ink3); }
    if (o.showLab === false && o.showVal === false && !o.res) return;
    const lines = [];
    if (o.showLab !== false && c.lab) lines.push({ t: c.lab, f: '600 ' + FS(s, 0.46) + 'px ' + FONT_UI, col: C.ink });
    if (o.showVal !== false && c.t !== 'A' && c.t !== 'VM') { const vt = valueText(c); if (vt) lines.push({ t: vt, f: '500 ' + FS(s, 0.42) + 'px ' + FONT_MONO, col: C.ink2 }); }
    const R = o.res && o.res.elem && o.res.elem[c.id];
    if (R) {
      if (c.t === 'A') lines.push({ t: fmtSI(R.i, 'A', 4), f: '700 ' + FS(s, 0.5) + 'px ' + FONT_MONO, col: C.copper });
      else if (c.t === 'VM') lines.push({ t: fmtSI(R.v, 'V', 4), f: '700 ' + FS(s, 0.5) + 'px ' + FONT_MONO, col: C.copper });
      else if (o.showRes !== false && s >= 16) {
        const src = c.t === 'V' || c.t === 'I';
        lines.push({ t: fmtSI(Math.abs(R.v), 'V') + ' · ' + fmtSI(Math.abs(R.i), 'A'), f: '500 ' + FS(s, 0.38) + 'px ' + FONT_MONO, col: C.flow });
        if (src && Math.abs(R.p) > 1e-15) lines.push({ t: (R.p < 0 ? 'จ่าย ' : 'รับ ') + fmtSI(Math.abs(R.p), 'W'), f: '500 ' + FS(s, 0.38) + 'px ' + FONT_UI, col: R.p < 0 ? C.copper : C.ink3 });
      }
    }
    if (!lines.length) return;
    const lp = c.lp || 1; const hor = Math.abs(cs) > 0.7; const lh = Math.max(s * 0.52, 11.5);
    ctx.textBaseline = 'middle';
    if (hor) { ctx.textAlign = 'center'; const base = lp > 0 ? cy - s * 0.62 - (lines.length - 1) * lh : cy + s * 0.68; lines.forEach((l, k) => { ctx.font = l.f; ctx.fillStyle = l.col; ctx.fillText(l.t, cx, base + k * lh); }); }
    else { ctx.textAlign = lp > 0 ? 'left' : 'right'; const x0 = cx + lp * s * 0.78; const base = cy - (lines.length - 1) * lh / 2; lines.forEach((l, k) => { ctx.font = l.f; ctx.fillStyle = l.col; ctx.fillText(l.t, x0, base + k * lh); }); }
  }
  function arrow(ctx, x0, x1, s) {
    ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1 + 0.02 * s, 0); ctx.lineTo(x1 - 0.2 * s, -0.14 * s); ctx.lineTo(x1 - 0.2 * s, 0.14 * s); ctx.closePath(); ctx.fillStyle = ctx.strokeStyle; ctx.fill();
  }

  /* static figure into a canvas that fits its container width */
  function figure(cv, comps, opt = {}) {
    readColors();
    const bb = bbox(comps); const pad = 0.9;
    const wU = bb.x1 - bb.x0 + 2 * pad, hU = bb.y1 - bb.y0 + 2 * pad;
    const avail = Math.max(240, (cv.parentElement && cv.parentElement.clientWidth) || 520);
    const cell = Math.max(10, Math.min(opt.maxCell || 24, Math.floor(avail / wU)));
    const W = Math.round(wU * cell), H = Math.round(hU * cell); const dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    draw(ctx, comps, { cell, ox: (pad - bb.x0) * cell, oy: (pad - bb.y0) * cell, grid: false, iec: !!(window.LAB && LAB.iec), showVal: opt.showVal !== false, showLab: true, res: opt.res || null, nodeColor: false, dots: false });
  }
  return { draw, figure, readColors, valueText, bbox, mix, hex2rgb };
})();
