/* Op-amp circuits lab (lesson 26): circuit engine + circuit builders. Pure JS, no DOM: loads in the browser (window.OAE, window.OK)
   and in Node (module.exports; copy to .cjs because package.json is "type": "module").
   Modified Nodal Analysis with
     · op-amp: ideal (nullor) or finite gain A0, single pole (GBW), slew rate, Rin, Rout, output swing limited by the supply rails
     · DC operating point, transient (BE start + BDF2, piecewise-linear saturation / slew / diode states) and AC sweep
     · exact transfer function H(s) = N(s)/D(s): det(G + sC) sampled on a circle and recovered by an inverse DFT, then poles/zeros
   Conventions for every two-terminal element: end a = (x1,y1), end b = (x2,y2); v = V(a) − V(b); i = current a → b through the
   element; p = v·i is power ABSORBED. V source: '+' at end a. I source: arrow a → b. Diode: anode = end a.
   Op-amp (three pins, centre (x1,y1), rot 0..3, flip): pins [−input, +input, output] = (−2,−1)(−2,+1)(+2,0) rotated.            */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else Object.assign(root, api);
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  /* ===================================================== units ===== */
  const PFX = { p: -12, n: -9, u: -6, 'µ': -6, 'μ': -6, m: -3, '': 0, k: 3, K: 3, M: 6, G: 9, R: 0 };
  const sc = (num, p) => parseFloat((Number(num) * Math.pow(10, PFX[p])).toPrecision(14));
  function parseSI(s) {
    if (typeof s === 'number') return s;
    s = String(s).trim().replace(/,/g, '').replace(/\s+/g, '');
    s = s.replace(/(ohm|Ω|Hz|V|A|F|H|S|W|s)$/i, (m) => (m.toLowerCase() === 'ohm' || m === 'Ω' ? '' : m));
    let m = s.match(/^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)([pnuµμmkKMG]?)(?:Hz|V|A|F|H|S|W|s)?$/);
    if (m) return sc(m[1], m[2]);
    m = s.match(/^(\d+)([pnuµμmkKMGR])(\d+)$/);
    if (m) return sc(m[1] + '.' + m[3], m[2]);
    return NaN;
  }
  const STEPS = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
  function fmtSI(x, unit = '', digits = 3) {
    if (x === null || x === undefined || !isFinite(x)) return '—';
    const a = Math.abs(x);
    if (a < 1e-15) return ('0 ' + unit).trim();
    let i = STEPS.findIndex(([v]) => a >= v * 0.99995); if (i < 0) i = STEPS.length - 1;
    let str = Number((x / STEPS[i][0]).toPrecision(digits)).toString();
    if (Math.abs(parseFloat(str)) >= 1000 && i > 0) { i--; str = Number((x / STEPS[i][0]).toPrecision(digits)).toString(); }
    return (str + ' ' + STEPS[i][1] + unit).trim();
  }

  /* ============================================= parts & models ===== */
  const TYPES = {
    R: { name: 'ตัวต้านทาน', unit: 'Ω', pre: 'R', def: 10e3 },
    L: { name: 'ตัวเหนี่ยวนำ', unit: 'H', pre: 'L', def: 0.01 },
    C: { name: 'ตัวเก็บประจุ', unit: 'F', pre: 'C', def: 10e-9 },
    V: { name: 'แหล่งจ่ายแรงดัน / สัญญาณ', unit: 'V', pre: 'V', def: 1 },
    I: { name: 'แหล่งจ่ายกระแส / สัญญาณ', unit: 'A', pre: 'I', def: 1e-3 },
    D: { name: 'ไดโอด', unit: 'V', pre: 'D', def: 0.65 },
    A: { name: 'แอมมิเตอร์', unit: '', pre: 'AM', def: 0 },
    VM: { name: 'โวลต์มิเตอร์', unit: '', pre: 'VM', def: 0 },
    OP: { name: 'ออปแอมป์', unit: '', pre: 'U', def: 0 },
    P: { name: 'จุดวัดแรงดัน', unit: '', pre: 'Vo', def: 0 },
    W: { name: 'สายไฟ' }, G: { name: 'กราวด์ (0 V)' }, T: { name: 'ป้ายข้อความ' }
  };
  const TWO = new Set(['R', 'L', 'C', 'V', 'I', 'D', 'A', 'VM']);
  const WAVES = {
    dc: 'DC คงที่', sin: 'ไซน์', sq: 'สี่เหลี่ยม ±', pulse: 'พัลส์ 0–V', tri: 'สามเหลี่ยม ±', step: 'สเต็ป ที่ t = 0'
  };
  const key = (x, y) => x + ',' + y;
  const RON = 1, GOFF = 1e-9, GMIN = 1e-12;

  /* Op-amp library. sr in V/s, rin/rout in Ω, head = headroom to each rail in V. ideal = nullor (A → ∞, no limits except the rails). */
  const OPM = {
    ideal: { name: 'อุดมคติ (A → ∞)', short: 'อุดมคติ', ideal: true, head: 0 },
    generic: { name: 'ทั่วไป · GBW 1 MHz', short: 'ทั่วไป', A0: 1e5, gbw: 1e6, sr: 1e6, rin: 1e9, rout: 50, head: 1.5 },
    '741': { name: 'µA741', short: '741', A0: 2e5, gbw: 1e6, sr: 0.5e6, rin: 2e6, rout: 75, head: 2 },
    tl072: { name: 'TL072 (JFET)', short: 'TL072', A0: 2e5, gbw: 3e6, sr: 13e6, rin: 1e12, rout: 100, head: 1.5 },
    lm358: { name: 'LM358', short: 'LM358', A0: 1e5, gbw: 1e6, sr: 0.3e6, rin: 1e6, rout: 100, head: 1.5 },
    op07: { name: 'OP07 (แม่นยำ)', short: 'OP07', A0: 4e5, gbw: 0.6e6, sr: 0.3e6, rin: 33e6, rout: 60, head: 2 },
    rrio: { name: 'Rail-to-rail 1 MHz', short: 'RRIO', A0: 1e5, gbw: 1e6, sr: 0.6e6, rin: 1e12, rout: 100, head: 0.05 },
    fast: { name: 'เร็ว · GBW 100 MHz', short: 'เร็ว 100M', A0: 1e5, gbw: 100e6, sr: 200e6, rin: 1e12, rout: 30, head: 1.5 }
  };
  function opParams(c, fbA) {
    const m = OPM[c.m] || OPM.ideal; const p = Object.assign({}, m, c.p || {});
    const vp = c.vp == null ? 15 : +c.vp, vn = c.vn == null ? -15 : +c.vn; const head = +p.head || 0;
    let ideal = !!p.ideal; let A0 = +p.A0, gbw = +p.gbw, rout = +p.rout || 0;
    if (ideal && fbA) { ideal = false; A0 = 1e7; gbw = Infinity; rout = 0; }
    return { ideal, A0, gbw: gbw > 0 ? gbw : Infinity, sr: p.sr > 0 ? +p.sr : Infinity, rin: p.rin > 0 ? +p.rin : Infinity, rout,
      vmax: vp - head, vmin: vn + head, vp, vn, wp: gbw > 0 && isFinite(gbw) ? 2 * Math.PI * gbw / A0 : Infinity, tau: gbw > 0 && isFinite(gbw) ? A0 / (2 * Math.PI * gbw) : 0 };
  }

  /* source waveforms */
  const frac = (x) => x - Math.floor(x);
  const triw = (ph) => 4 * Math.abs(frac(ph + 0.75) - 0.5) - 1;
  function wave(e, t) {
    const k = e.w || 'dc', v = +e.v, off = +e.off || 0, f = +e.f > 0 ? +e.f : 1000, duty = e.duty == null ? 0.5 : +e.duty;
    switch (k) {
      case 'sin': return off + v * Math.sin(2 * Math.PI * f * t);
      case 'sq': return off + (frac(f * t + 1e-12) < duty ? v : -v);
      case 'pulse': return off + (frac(f * t + 1e-12) < duty ? v : 0);
      case 'tri': return off + v * triw(f * t);
      case 'step': return off + v;
      default: return v;
    }
  }
  /* value used for the DC operating point (pre = just before the sources start at t = 0) */
  function dcLevel(e, pre) { const k = e.w || 'dc'; if (k === 'dc') return +e.v; if (k === 'step') return (+e.off || 0) + (pre ? 0 : +e.v); return +e.off || 0; }
  const isPeriodic = (e) => ['sin', 'sq', 'pulse', 'tri'].includes(e.w);

  /* ================================================== geometry ===== */
  const rotP = (x, y, r) => (r === 0 ? [x, y] : r === 1 ? [-y, x] : r === 2 ? [-x, -y] : [y, -x]);
  /* pins [inverting, non-inverting, output] in grid coordinates */
  function opPins(c) {
    const r = ((c.rot | 0) % 4 + 4) % 4, f = c.flip ? -1 : 1;
    return [[-2, -f], [-2, f], [2, 0]].map(([x, y]) => { const [a, b] = rotP(x, y, r); return [c.x1 + a, c.y1 + b]; });
  }

  function buildNodes(comps) {
    const parent = new Map();
    const find = (k) => { if (!parent.has(k)) parent.set(k, k); let r = k; while (parent.get(r) !== r) r = parent.get(r); while (parent.get(k) !== r) { const n = parent.get(k); parent.set(k, r); k = n; } return r; };
    const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
    let hasGround = false;
    const elems = [], ops = [], probes = [];
    for (const c of comps) {
      if (c.t === 'W') {
        const k1 = key(c.x1, c.y1);
        if (c.x1 === c.x2 || c.y1 === c.y2) {
          const dx = Math.sign(c.x2 - c.x1), dy = Math.sign(c.y2 - c.y1);
          let x = c.x1, y = c.y1; find(k1);
          while (x !== c.x2 || y !== c.y2) { x += dx; y += dy; union(k1, key(x, y)); }
        } else union(k1, key(c.x2, c.y2));
      } else if (c.t === 'G') { union(key(c.x1, c.y1), 'GND'); hasGround = true; }
      else if (TWO.has(c.t)) { find(key(c.x1, c.y1)); find(key(c.x2, c.y2)); elems.push(c); }
      else if (c.t === 'OP') { for (const [x, y] of opPins(c)) find(key(x, y)); ops.push(c); }
      else if (c.t === 'P') { find(key(c.x1, c.y1)); probes.push(c); }
    }
    let refRoot = null, autoRef = false;
    if (hasGround) refRoot = find('GND');
    else if (elems.length || ops.length) {
      const src = elems.find((e) => e.t === 'V');
      if (src) refRoot = find(key(src.x2, src.y2));
      else if (elems.length) refRoot = find(key(elems[0].x2, elems[0].y2));
      else { const p = opPins(ops[0]); refRoot = find(key(p[1][0], p[1][1])); }
      autoRef = true;
    }
    const idx = new Map(); let n = 0; const order = [];
    const take = (k) => { const r = find(k); if (r === refRoot) return; if (!idx.has(r)) { idx.set(r, n++); order.push(k); } };
    for (const e of elems) { take(key(e.x1, e.y1)); take(key(e.x2, e.y2)); }
    for (const c of ops) for (const [x, y] of opPins(c)) take(key(x, y));
    const nodeOfKey = (k) => { if (!parent.has(k)) return undefined; const r = find(k); if (r === refRoot) return -1; return idx.has(r) ? idx.get(r) : undefined; };
    return { n, find, nodeOfKey, elems, ops, probes, hasGround, autoRef, order, refRoot };
  }
  const nodeAt = (net, x, y) => { const k = net.nodeOfKey(key(x, y)); return k === undefined ? -1 : k; };

  /* ================================================ real solver ===== */
  function lusolve(A, z) {
    const N = z.length; const M = A.map((r) => r.slice()); const b = z.slice();
    let scale = 0; for (const r of M) for (const v of r) scale = Math.max(scale, Math.abs(v));
    const tol = Math.max(scale, 1) * 1e-17;
    for (let k = 0; k < N; k++) {
      let p = k, mx = Math.abs(M[k][k]);
      for (let i = k + 1; i < N; i++) if (Math.abs(M[i][k]) > mx) { mx = Math.abs(M[i][k]); p = i; }
      if (mx < tol) return null;
      if (p !== k) { [M[p], M[k]] = [M[k], M[p]]; [b[p], b[k]] = [b[k], b[p]]; }
      const piv = M[k][k];
      for (let i = k + 1; i < N; i++) {
        const f = M[i][k] / piv; if (f === 0) continue;
        for (let j = k; j < N; j++) M[i][j] -= f * M[k][j];
        b[i] -= f * b[k];
      }
    }
    const x = new Array(N).fill(0);
    for (let i = N - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < N; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
    if (x.some((v) => !isFinite(v))) return null;
    return x;
  }

  /* ctx: { mode:'dc'|'init'|'tran', pre, t, h, be, useIC, fbA, cap:Map, ind:Map, op:Map, dio:Map } */
  const hasIC = (e) => e.ic !== undefined && e.ic !== null && e.ic !== '' && isFinite(+e.ic);
  function opBounds(P, S, ctx) {
    let U = P.vmax, L = P.vmin;
    if (ctx.mode === 'tran' && isFinite(P.sr)) { U = Math.min(U, S.x + P.sr * ctx.h); L = Math.max(L, S.x - P.sr * ctx.h); }
    return [U, L];
  }
  function srcValue(e, ctx) { return ctx.mode === 'dc' ? dcLevel(e, ctx.pre) : wave(e, ctx.t); }

  function assemble(net, ctx) {
    const { n, elems, ops } = net; const mode = ctx.mode;
    const nodes = elems.map((e) => [nodeAt(net, e.x1, e.y1), nodeAt(net, e.x2, e.y2)]);
    const opn = ops.map((c) => opPins(c).map(([x, y]) => nodeAt(net, x, y)));
    const br = new Map(), brOp = []; let nb = 0; const brLabel = [];
    elems.forEach((e, i) => {
      const t = e.t;
      if (t === 'V' || t === 'A' || (t === 'L' && mode === 'dc' && !(ctx.useIC && hasIC(e))) || (t === 'C' && (mode === 'init' || (mode === 'dc' && ctx.useIC && hasIC(e))))) { br.set(i, n + nb); nb++; brLabel.push(e); }
    });
    ops.forEach((c) => { brOp.push(n + nb); nb++; brLabel.push(c); });
    const N = n + nb;
    const A = Array.from({ length: N }, () => new Array(N).fill(0)); const z = new Array(N).fill(0);
    const add = (r, c, v) => { if (r >= 0 && c >= 0) A[r][c] += v; };
    const addz = (r, v) => { if (r >= 0) z[r] += v; };
    const cond = (a, b, g) => { add(a, a, g); add(b, b, g); add(a, b, -g); add(b, a, -g); };
    for (let k = 0; k < n; k++) A[k][k] += GMIN;
    const errs = []; const aux = { C: new Map(), L: new Map(), op: [] };
    const bdf = !ctx.be;
    elems.forEach((e, i) => {
      const [a, b] = nodes[i]; const v = +e.v;
      switch (e.t) {
        case 'R': if (!(v > 0)) errs.push(e.lab + ': ค่าความต้านทานต้องมากกว่า 0'); else cond(a, b, 1 / v); break;
        case 'C': {
          if (!(v > 0)) { errs.push(e.lab + ': ค่าความจุต้องมากกว่า 0'); break; }
          if (mode === 'dc') { if (ctx.useIC && hasIC(e)) { const k = br.get(i); add(a, k, 1); add(b, k, -1); add(k, a, 1); add(k, b, -1); z[k] = +e.ic; } }
          else if (mode === 'init') { const k = br.get(i); add(a, k, 1); add(b, k, -1); add(k, a, 1); add(k, b, -1); z[k] = ctx.cap.get(e.id).v; }
          else { const s = ctx.cap.get(e.id); const G = bdf ? 1.5 * v / ctx.h : v / ctx.h; const Ieq = bdf ? v / (2 * ctx.h) * (4 * s.v - s.vp) : v / ctx.h * s.v; cond(a, b, G); addz(a, Ieq); addz(b, -Ieq); aux.C.set(e.id, { G, Ieq }); }
          break;
        }
        case 'L': {
          if (!(v > 0)) { errs.push(e.lab + ': ค่าความเหนี่ยวนำต้องมากกว่า 0'); break; }
          if (mode === 'dc') {
            if (ctx.useIC && hasIC(e)) { addz(a, -(+e.ic)); addz(b, +e.ic); }
            else { const k = br.get(i); add(a, k, 1); add(b, k, -1); add(k, a, 1); add(k, b, -1); }
          } else if (mode === 'init') { const s = ctx.ind.get(e.id); addz(a, -s.i); addz(b, s.i); }
          else { const s = ctx.ind.get(e.id); const G = bdf ? 2 * ctx.h / (3 * v) : ctx.h / v; const J = bdf ? (4 * s.i - s.ip) / 3 : s.i; cond(a, b, G); addz(a, -J); addz(b, J); aux.L.set(e.id, { G, J }); }
          break;
        }
        case 'V': case 'A': { const k = br.get(i); add(a, k, 1); add(b, k, -1); add(k, a, 1); add(k, b, -1); z[k] = e.t === 'V' ? srcValue(e, ctx) : 0; break; }
        case 'I': { const val = srcValue(e, ctx); addz(a, -val); addz(b, val); break; }
        case 'D': { const on = ctx.dio.get(e.id); if (on) { const g = 1 / RON; cond(a, b, g); addz(a, g * v); addz(b, -g * v); } else cond(a, b, GOFF); break; }
        default: break;
      }
    });
    ops.forEach((c, j) => {
      const P = opParams(c, ctx.fbA); const S = ctx.op.get(c.id); const [ni, np, no] = opn[j]; const k = brOp[j];
      add(no, k, 1);
      if (isFinite(P.rin)) cond(np, ni, 1 / P.rin);
      const info = { P, k };
      if (S.st !== 0) {
        const [U, L] = opBounds(P, S, ctx); const f = S.st > 0 ? U : L; info.force = f;
        add(k, no, 1); add(k, k, -P.rout); z[k] = f;
      } else if (P.ideal) { add(k, np, 1); add(k, ni, -1); }
      else if (mode === 'init' && isFinite(P.gbw)) { add(k, no, 1); add(k, k, -P.rout); z[k] = S.x0; }
      else if (mode === 'tran' && isFinite(P.gbw)) {
        const wp = P.wp, h = ctx.h; let al, be;
        if (bdf) { const q = 1 + 2 * h * wp / 3; al = (2 * h * wp * P.A0 / 3) / q; be = ((4 * S.x - S.xp) / 3) / q; }
        else { const q = 1 + h * wp; al = (h * wp * P.A0) / q; be = S.x / q; }
        add(k, no, 1); add(k, k, -P.rout); add(k, np, -al); add(k, ni, al); z[k] = be; info.al = al; info.be = be;
      } else { add(k, no, 1); add(k, k, -P.rout); add(k, np, -P.A0); add(k, ni, P.A0); }
      aux.op.push(info);
    });
    return { A, z, N, n, nb, br, brOp, brLabel, nodes, opn, errs, aux };
  }

  function elemResults(net, sys, x, ctx) {
    const { elems, ops } = net; const out = {}; const mode = ctx.mode;
    const V = (k) => (k >= 0 ? x[k] : 0);
    elems.forEach((e, i) => {
      const [a, b] = sys.nodes[i]; const va = V(a), vb = V(b); const v = va - vb;
      let cur = 0;
      switch (e.t) {
        case 'R': cur = v / e.v; break;
        case 'C': cur = mode === 'dc' ? (sys.br.has(i) ? x[sys.br.get(i)] : 0) : mode === 'init' ? x[sys.br.get(i)] : sys.aux.C.get(e.id).G * v - sys.aux.C.get(e.id).Ieq; break;
        case 'L': cur = mode === 'dc' ? (sys.br.has(i) ? x[sys.br.get(i)] : +e.ic) : mode === 'init' ? ctx.ind.get(e.id).i : sys.aux.L.get(e.id).G * v + sys.aux.L.get(e.id).J; break;
        case 'V': case 'A': cur = x[sys.br.get(i)]; break;
        case 'I': cur = srcValue(e, ctx); break;
        case 'D': cur = ctx.dio.get(e.id) ? (v - e.v) / RON : GOFF * v; break;
        default: cur = 0;
      }
      if (Math.abs(cur) < 1e-12) cur = 0;
      out[e.id] = { v, i: cur, p: v * cur, va, vb };
    });
    const opx = {};
    ops.forEach((c, j) => {
      const [ni, np, no] = sys.opn[j]; const P = sys.aux.op[j].P; const d = V(np) - V(ni), vo = V(no), io = -x[sys.brOp[j]], vint = vo + P.rout * io; // io = current DELIVERED by the output pin
      const S = ctx.op.get(c.id);
      let cur = io; if (Math.abs(cur) < 1e-12) cur = 0;
      const pin = isFinite(P.rin) ? d * d / P.rin : 0;
      out[c.id] = { v: vo, i: cur, p: -vo * io + pin, va: vo, vb: 0 };
      opx[c.id] = { d, vo, io, vint, st: S.st, vp: V(np), vm: V(ni) };
    });
    return { elem: out, opx };
  }

  /* solve one time point, iterating the piecewise-linear states (op-amp limits, slew, diodes) until they agree */
  function solveIter(net, ctx, maxIt = 40) {
    let sys = null, x = null;
    for (const c of net.ops) ctx.op.get(c.id).from = 0;
    for (let it = 0; it < maxIt; it++) {
      sys = assemble(net, ctx);
      if (sys.errs.length) return { err: sys.errs.join(' · '), sys };
      x = lusolve(sys.A, sys.z);
      if (!x) return { singular: true, sys };
      for (let k = 0; k < sys.n; k++) if (Math.abs(x[k]) < 1e-11) x[k] = 0; // GMIN leakage is not a result
      let changed = false; const V = (k) => (k >= 0 ? x[k] : 0);
      net.ops.forEach((c, j) => {
        const { P } = sys.aux.op[j]; const S = ctx.op.get(c.id); const [ni, np, no] = sys.opn[j];
        if (ctx.mode === 'init' && !P.ideal && isFinite(P.gbw)) return;
        const d = V(np) - V(ni), vint = V(no) - P.rout * x[sys.brOp[j]]; const [U, L] = opBounds(P, S, ctx);
        const info = sys.aux.op[j];
        const target = P.ideal ? null : info.al !== undefined ? info.al * d + info.be : P.A0 * d;
        let ns = S.st; const eps = 1e-9 * (1 + Math.abs(U) + Math.abs(L));
        // leaving a rail and landing on the same rail again means the linear branch is the unstable one (positive feedback): flip rails instead
        if (S.st === 0) { if (vint > U + eps) ns = S.from === 1 ? -1 : 1; else if (vint < L - eps) ns = S.from === -1 ? 1 : -1; }
        else if (S.st > 0) { if (!(P.ideal ? d >= 0 : target >= U - eps)) { ns = 0; S.from = 1; } }
        else if (!(P.ideal ? d <= 0 : target <= L + eps)) { ns = 0; S.from = -1; }
        if (ns !== S.st) { S.st = ns; changed = true; }
      });
      net.elems.forEach((e, i) => {
        if (e.t !== 'D') return; const on = ctx.dio.get(e.id); const [a, b] = sys.nodes[i]; const v = V(a) - V(b);
        if (!on && v > +e.v + 1e-9) { ctx.dio.set(e.id, true); changed = true; }
        else if (on && (v - e.v) / RON < -1e-12) { ctx.dio.set(e.id, false); changed = true; }
      });
      if (!changed) return { sys, x, iters: it + 1 };
    }
    return { sys, x, iters: maxIt, unsettled: true };
  }
  const newCtx = (net, mode, o = {}) => {
    const c = Object.assign({ mode, pre: false, t: 0, h: 0, be: false, useIC: false, fbA: false, cap: new Map(), ind: new Map(), op: new Map(), dio: new Map() }, o);
    for (const e of net.elems) { if (e.t === 'D') c.dio.set(e.id, false); }
    for (const e of net.ops) c.op.set(e.id, { st: 0, x: 0, xp: 0, x0: 0 });
    return c;
  };

  const SINGULAR = 'แก้สมการไม่ได้ (เมทริกซ์เอกฐาน): มักเกิดจากแหล่งจ่ายแรงดัน/ตัวเหนี่ยวนำ/แอมมิเตอร์ต่อกันเป็นลูปปิดโดยไม่มีความต้านทาน แหล่งจ่ายแรงดันสองตัวขนานกัน หรือเอาต์พุตของออปแอมป์สองตัวต่อชนกัน';
  function warnOps(net, res) {
    // floating op-amp inputs
    const deg = new Map(); const inc = (k) => { const n = net.nodeOfKey(k); if (n !== undefined && n >= 0) deg.set(n, (deg.get(n) || 0) + 1); };
    for (const e of net.elems) { if (e.t === 'VM') continue; inc(key(e.x1, e.y1)); inc(key(e.x2, e.y2)); }
    for (const c of net.ops) { const p = opPins(c); inc(key(p[2][0], p[2][1])); }
    for (const c of net.ops) {
      const p = opPins(c);
      [['ขาอินพุตกลับเฟส (−)', p[0]], ['ขาอินพุตไม่กลับเฟส (+)', p[1]]].forEach(([nm, pt]) => {
        const k = net.nodeOfKey(key(pt[0], pt[1])); if (k !== undefined && k < 0) return;
        const other = net.ops.reduce((s, q) => s + opPins(q).filter((pp, ii) => ii < 2 && (pp[0] !== pt[0] || pp[1] !== pt[1]) && net.nodeOfKey(key(pp[0], pp[1])) === k).length, 0);
        if (!deg.get(k) && !other) res.warnings.push(c.lab + ' ' + nm + ' ไม่ได้ต่ออะไร (ลอย) ค่าแรงดันที่ขานั้นไม่มีความหมาย');
      });
    }
  }

  function solveDC(comps) {
    const net = buildNodes(comps);
    const res = { ok: false, warnings: [], net };
    if (!net.elems.length && !net.ops.length) { res.err = 'ยังไม่มีองค์ประกอบในวงจร'; return res; }
    if (net.autoRef) res.warnings.push('ยังไม่ได้วางกราวด์ จึงใช้ขั้วลบของแหล่งจ่าย (หรือขั้วหนึ่งของวงจร) เป็นจุดอ้างอิง 0 V');
    warnOps(net, res);
    let ctx = newCtx(net, 'dc'); let it = solveIter(net, ctx);
    if (it.err) { res.err = it.err; return res; }
    if (it.singular && net.ops.some((c) => c.m === undefined || OPM[c.m] === undefined || OPM[c.m].ideal)) {
      ctx = newCtx(net, 'dc', { fbA: true }); it = solveIter(net, ctx);
      if (!it.singular && !it.err) res.warnings.push('ไม่มีทางป้อนกลับสำหรับ DC (เช่นอินทิเกรเตอร์ไม่มี R ขนาน C) ออปแอมป์จริงจะลอยไปชนแหล่งจ่ายเพราะออฟเซ็ตเล็กน้อย ที่นี่แสดงค่าเมื่อแรงดันอินพุต 0 V');
    }
    if (it.singular || it.err) { res.err = it.err || SINGULAR; res.sys = it.sys; return res; }
    const { sys, x } = it; res.sys = sys; res.x = x; res.ctx = ctx;
    for (let k = 0; k < x.length; k++) if (Math.abs(x[k]) < 1e-11) x[k] = 0; // GMIN leakage is not a result
    res.nodeV = x.slice(0, net.n);
    const er = elemResults(net, sys, x, ctx); res.elem = er.elem; res.opx = er.opx;
    for (const c of net.ops) { const o = res.opx[c.id]; if (o.st > 0) res.warnings.push(c.lab + ' อิ่มตัวที่ขอบบน (' + fmtSI(o.vo, 'V') + ') เอาต์พุตถูกตัดที่แรงดันแหล่งจ่าย'); else if (o.st < 0) res.warnings.push(c.lab + ' อิ่มตัวที่ขอบล่าง (' + fmtSI(o.vo, 'V') + ') เอาต์พุตถูกตัดที่แรงดันแหล่งจ่าย'); }
    if (it.unsettled) res.warnings.push('สถานะไดโอด/ออปแอมป์สลับไม่หยุด ผลที่แสดงอาจไม่นิ่ง');
    let pa = 0, ps = 0; for (const k in res.elem) { const p = res.elem[k].p; if (p > 0) pa += p; else ps -= p; }
    res.pAbs = pa; res.pSup = ps;
    res.probe = {}; for (const p of net.probes) { const k = net.nodeOfKey(key(p.x1, p.y1)); res.probe[p.id] = k === undefined ? null : k < 0 ? 0 : res.nodeV[k]; }
    res.states = { op: new Map([...ctx.op].map(([k, v]) => [k, v.st])), dio: new Map(ctx.dio), fbA: ctx.fbA };
    res.ok = true;
    return res;
  }

  /* -------------------------------------------------- transient ----- */
  function autoTime(comps, tf) {
    const per = comps.filter((c) => (c.t === 'V' || c.t === 'I') && isPeriodic(c) && +c.f > 0).map((c) => +c.f);
    if (per.length) return 5 / Math.min(...per);
    if (tf && tf.tau && isFinite(tf.tau) && tf.tau > 0) return Math.min(1e3, Math.max(1e-9, 6 * tf.tau));
    const Rs = comps.filter((c) => c.t === 'R').map((c) => +c.v).filter((v) => v > 0);
    const Rg = Rs.length ? Math.exp(Rs.reduce((s, v) => s + Math.log(v), 0) / Rs.length) : 1;
    let T = 0; for (const c of comps) { if (c.t === 'C') T = Math.max(T, c.v * Rg); if (c.t === 'L') T = Math.max(T, c.v / Rg); }
    return T > 0 ? 6 * T : 1e-3;
  }

  function solveTran(comps, tEnd, steps = 4000, keep = 2000) {
    const net = buildNodes(comps);
    const res = { ok: false, warnings: [] };
    if (!net.elems.length && !net.ops.length) { res.err = 'ยังไม่มีองค์ประกอบในวงจร'; return res; }
    warnOps(net, res);
    if (!(tEnd > 0)) { res.err = 'เวลาจำลองต้องมากกว่า 0'; return res; }
    const h = tEnd / steps;
    // 1) state just before the sources start (initial conditions: capacitor/inductor ic, otherwise the DC operating point)
    let ctx0 = newCtx(net, 'dc', { pre: true, useIC: true }); let it = solveIter(net, ctx0);
    if (it.err) { res.err = it.err; return res; }
    if (it.singular) { ctx0 = newCtx(net, 'dc', { pre: true, useIC: true, fbA: true }); it = solveIter(net, ctx0); }
    if (it.err || it.singular) { res.err = it.err || SINGULAR; return res; }
    const ctx = newCtx(net, 'init', { t: 0, fbA: ctx0.fbA, useIC: true });
    const er0 = elemResults(net, it.sys, it.x, ctx0);
    for (const e of net.elems) {
      if (e.t === 'C') ctx.cap.set(e.id, { v: er0.elem[e.id].v, vp: er0.elem[e.id].v });
      if (e.t === 'L') ctx.ind.set(e.id, { i: er0.elem[e.id].i, ip: er0.elem[e.id].i });
    }
    for (const c of net.ops) { const o = er0.opx[c.id]; const S = ctx.op.get(c.id); S.x = o.vint; S.xp = o.vint; S.x0 = o.vint; S.st = ctx0.op.get(c.id).st; }
    for (const e of net.elems) if (e.t === 'D') ctx.dio.set(e.id, ctx0.dio.get(e.id));
    // 2) t = 0+ with the sources switched on, reactive elements frozen at their initial values
    it = solveIter(net, ctx);
    if (it.err || it.singular) { res.err = it.err || SINGULAR; return res; }
    const T = [], NV = [], EL = {}, OPX = {}; for (const e of net.elems) EL[e.id] = { v: [], i: [] }; for (const c of net.ops) { EL[c.id] = { v: [], i: [] }; OPX[c.id] = { st: [], d: [] }; }
    const PR = {}; for (const p of net.probes) PR[p.id] = { node: net.nodeOfKey(key(p.x1, p.y1)) };
    const every = Math.max(1, Math.round(steps / keep));
    const record = (t, x, er) => { T.push(t); NV.push(x.slice(0, net.n)); for (const k in er.elem) { EL[k].v.push(er.elem[k].v); EL[k].i.push(er.elem[k].i); } for (const k in er.opx) { OPX[k].st.push(er.opx[k].st); OPX[k].d.push(er.opx[k].d); } };
    let er = elemResults(net, it.sys, it.x, ctx); record(0, it.x, er);
    const advance = (x, erx) => {
      for (const e of net.elems) {
        if (e.t === 'C') { const s = ctx.cap.get(e.id); s.vp = s.v; s.v = erx.elem[e.id].v; }
        if (e.t === 'L') { const s = ctx.ind.get(e.id); s.ip = s.i; s.i = erx.elem[e.id].i; }
      }
      for (const c of net.ops) { const S = ctx.op.get(c.id); S.xp = S.x; S.x = erx.opx[c.id].vint; }
    };
    advance(it.x, er);
    // from here on: backward Euler for the first step, then BDF2
    ctx.mode = 'tran'; ctx.h = h; ctx.be = true;
    let nsw = 0, unsettled = 0;
    const satTime = {}; for (const c of net.ops) satTime[c.id] = 0;
    for (let s = 1; s <= steps; s++) {
      ctx.t = s * h; if (s > 1) ctx.be = false;
      const r = solveIter(net, ctx);
      if (r.err || r.singular) { res.err = r.err || (SINGULAR + ' (ที่ t = ' + fmtSI(s * h, 's') + ')'); return res; }
      if (r.unsettled) unsettled++;
      er = elemResults(net, r.sys, r.x, ctx);
      advance(r.x, er);
      for (const c of net.ops) if (er.opx[c.id].st !== 0) satTime[c.id]++;
      if (s % every === 0 || s === steps) record(s * h, r.x, er);
    }
    res.ok = true; res.t = T; res.nodeV = NV; res.el = EL; res.opx = OPX; res.net = net; res.h = h; res.tEnd = tEnd; res.probe = PR;
    res.sat = {}; for (const c of net.ops) res.sat[c.id] = satTime[c.id] / steps;
    for (const c of net.ops) if (res.sat[c.id] > 0.002) res.warnings.push(c.lab + ' อิ่มตัวหรือถูกจำกัดอัตราการเปลี่ยนแรงดัน (slew) ' + Math.round(res.sat[c.id] * 100) + '% ของเวลาจำลอง');
    if (unsettled) res.warnings.push('บางขั้นเวลาสถานะไดโอด/ออปแอมป์สลับไม่หยุด (' + unsettled + ' ขั้น)');
    return res;
  }

  /* ============================================ AC / transfer fn ===== */
  /* real matrices G, Cm so that (G + sCm)x = b for the small-signal circuit at the DC operating point */
  function acMatrices(net, st, o = {}) {
    const { n, elems, ops } = net; const nodes = elems.map((e) => [nodeAt(net, e.x1, e.y1), nodeAt(net, e.x2, e.y2)]);
    const opn = ops.map((c) => opPins(c).map(([x, y]) => nodeAt(net, x, y)));
    let nb = 0; const br = new Map(), brOp = [];
    elems.forEach((e, i) => { if (e.t === 'V' || e.t === 'A' || e.t === 'L') { br.set(i, n + nb); nb++; } });
    ops.forEach(() => { brOp.push(n + nb); nb++; });
    const N = n + nb;
    const G = Array.from({ length: N }, () => new Array(N).fill(0)), Cm = Array.from({ length: N }, () => new Array(N).fill(0));
    const g = (r, c, v) => { if (r >= 0 && c >= 0) G[r][c] += v; }, cc = (r, c, v) => { if (r >= 0 && c >= 0) Cm[r][c] += v; };
    const gc = (M, a, b, v) => { if (a >= 0) M[a][a] += v; if (b >= 0) M[b][b] += v; if (a >= 0 && b >= 0) { M[a][b] -= v; M[b][a] -= v; } };
    for (let k = 0; k < n; k++) G[k][k] += GMIN;
    const srcs = [];
    elems.forEach((e, i) => {
      const [a, b] = nodes[i]; const v = +e.v;
      switch (e.t) {
        case 'R': if (v > 0) gc(G, a, b, 1 / v); break;
        case 'C': if (v > 0) gc(Cm, a, b, v); break;
        case 'L': { const k = br.get(i); g(a, k, 1); g(b, k, -1); g(k, a, 1); g(k, b, -1); Cm[k][k] -= v; break; }
        case 'V': case 'A': { const k = br.get(i); g(a, k, 1); g(b, k, -1); g(k, a, 1); g(k, b, -1); if (e.t === 'V') srcs.push({ id: e.id, lab: e.lab, kind: 'V', k }); break; }
        case 'I': srcs.push({ id: e.id, lab: e.lab, kind: 'I', a, b }); break;
        case 'D': { const on = st && st.dio.get(e.id); gc(G, a, b, on ? 1 / RON : GOFF); break; }
        default: break;
      }
    });
    let order = 0;
    ops.forEach((c, j) => {
      const P = opParams(c, false); const [ni, np, no] = opn[j]; const k = brOp[j];
      const ideal = P.ideal || !!o.forceIdeal;
      const lim = st && st.op.get(c.id);
      g(no, k, 1);
      if (isFinite(P.rin) && !(o.forceIdeal)) gc(G, np, ni, 1 / P.rin);
      if (lim) { g(k, no, 1); g(k, k, -P.rout); return; }
      if (ideal) { g(k, np, 1); g(k, ni, -1); return; }
      g(k, no, 1); g(k, k, -P.rout); g(k, np, -P.A0); g(k, ni, P.A0);
      if (isFinite(P.gbw)) { cc(k, no, P.tau); cc(k, k, -P.tau * P.rout); order++; }
    });
    return { N, n, G, Cm, srcs, nodes, opn, order };
  }
  function srcVec(M, s) {
    const b = new Array(M.N).fill(0);
    if (s.kind === 'V') b[s.k] = 1; else { if (s.a >= 0) b[s.a] -= 1; if (s.b >= 0) b[s.b] += 1; }
    return b;
  }

  /* complex LU (row swaps applied to whole rows) */
  function cluFactor(Ar, Ai) {
    const N = Ar.length; const piv = new Array(N); let sg = 1;
    for (let k = 0; k < N; k++) {
      let p = k, mx = Ar[k][k] * Ar[k][k] + Ai[k][k] * Ai[k][k];
      for (let i = k + 1; i < N; i++) { const m = Ar[i][k] * Ar[i][k] + Ai[i][k] * Ai[i][k]; if (m > mx) { mx = m; p = i; } }
      piv[k] = p; if (!(mx > 1e-300)) return null;
      if (p !== k) { [Ar[p], Ar[k]] = [Ar[k], Ar[p]]; [Ai[p], Ai[k]] = [Ai[k], Ai[p]]; sg = -sg; }
      const pr = Ar[k][k], pi = Ai[k][k], den = pr * pr + pi * pi;
      for (let i = k + 1; i < N; i++) {
        const fr = (Ar[i][k] * pr + Ai[i][k] * pi) / den, fi = (Ai[i][k] * pr - Ar[i][k] * pi) / den;
        Ar[i][k] = fr; Ai[i][k] = fi; if (fr === 0 && fi === 0) continue;
        for (let j = k + 1; j < N; j++) { Ar[i][j] -= fr * Ar[k][j] - fi * Ai[k][j]; Ai[i][j] -= fr * Ai[k][j] + fi * Ar[k][j]; }
      }
    }
    let dr = sg, di = 0; for (let k = 0; k < N; k++) { const a = dr * Ar[k][k] - di * Ai[k][k], b = dr * Ai[k][k] + di * Ar[k][k]; dr = a; di = b; }
    return { Ar, Ai, piv, N, dr, di };
  }
  function cluSolve(lu, b) {
    const { Ar, Ai, piv, N } = lu; const xr = b.slice(), xi = new Array(N).fill(0);
    for (let k = 0; k < N; k++) { const p = piv[k]; if (p !== k) { [xr[p], xr[k]] = [xr[k], xr[p]]; [xi[p], xi[k]] = [xi[k], xi[p]]; } }
    for (let i = 0; i < N; i++) for (let j = 0; j < i; j++) { xr[i] -= Ar[i][j] * xr[j] - Ai[i][j] * xi[j]; xi[i] -= Ar[i][j] * xi[j] + Ai[i][j] * xr[j]; }
    for (let i = N - 1; i >= 0; i--) {
      for (let j = i + 1; j < N; j++) { xr[i] -= Ar[i][j] * xr[j] - Ai[i][j] * xi[j]; xi[i] -= Ar[i][j] * xi[j] + Ai[i][j] * xr[j]; }
      const pr = Ar[i][i], pi = Ai[i][i], den = pr * pr + pi * pi; const a = (xr[i] * pr + xi[i] * pi) / den, bb = (xi[i] * pr - xr[i] * pi) / den; xr[i] = a; xi[i] = bb;
    }
    return { xr, xi };
  }
  function Yat(M, sr, si) {
    const Ar = M.G.map((r, i) => r.map((v, j) => v + sr * M.Cm[i][j])); const Ai = M.Cm.map((r) => r.map((v) => si * v));
    return [Ar, Ai];
  }

  /* output selectors: probe (node → ground), voltmeter (a − b), op-amp output */
  function listOutputs(comps) {
    const out = [];
    for (const c of comps) {
      if (c.t === 'P') out.push({ id: c.id, name: c.lab, a: [c.x1, c.y1], b: null });
      else if (c.t === 'VM') out.push({ id: c.id, name: c.lab, a: [c.x1, c.y1], b: [c.x2, c.y2] });
      else if (c.t === 'OP') { const p = opPins(c); out.push({ id: c.id, name: c.lab + ' (ขาออก)', a: p[2], b: null }); }
    }
    return out;
  }
  function outIdx(net, comps, outId) {
    const o = listOutputs(comps).find((q) => q.id === outId) || listOutputs(comps)[0];
    if (!o) return null;
    return { o, a: nodeAt(net, o.a[0], o.a[1]), b: o.b ? nodeAt(net, o.b[0], o.b[1]) : -1 };
  }
  function listInputs(comps) { return comps.filter((c) => c.t === 'V' || c.t === 'I').map((c) => ({ id: c.id, lab: c.lab, kind: c.t, w: c.w || 'dc' })); }

  function acSetup(comps, opts = {}) {
    const net = buildNodes(comps);
    if (!net.elems.length && !net.ops.length) return { err: 'ยังไม่มีองค์ประกอบในวงจร' };
    const dc = solveDC(comps); const st = dc.ok ? dc.states : null;
    const M = acMatrices(net, st, opts);
    const out = outIdx(net, comps, opts.outId);
    if (!out) return { err: 'วางจุดวัดแรงดัน (Probe) หรือโวลต์มิเตอร์ที่เอาต์พุตก่อน แล้วระบบจะหา H(s) ให้' };
    if (!M.srcs.length) return { err: 'ต้องมีแหล่งจ่ายแรงดันหรือกระแสอย่างน้อยหนึ่งตัวเป็นอินพุต' };
    return { net, dc, st, M, out };
  }

  function acPoint(setup, srcIdx, f) {
    const { M, out } = setup; const s = 2 * Math.PI * f;
    const [Ar, Ai] = Yat(M, 0, s); const lu = cluFactor(Ar, Ai); if (!lu) return null;
    const { xr, xi } = cluSolve(lu, srcVec(M, M.srcs[srcIdx]));
    const g = (a) => (a >= 0 ? [xr[a], xi[a]] : [0, 0]); const A = g(out.a), B = g(out.b);
    return [A[0] - B[0], A[1] - B[1]];
  }
  function acSweep(comps, o = {}) {
    const setup = acSetup(comps, o); if (setup.err) return { ok: false, err: setup.err };
    const { M } = setup; let si = M.srcs.findIndex((q) => q.id === o.srcId); if (si < 0) si = 0;
    const fmin = o.fmin || 1, fmax = o.fmax || 1e6, ppd = o.ppd || 24; const dec = Math.log10(fmax / fmin); const np = Math.max(2, Math.round(dec * ppd));
    const f = [], re = [], im = [], mag = [], db = [], ph = []; let prev = null;
    for (let k = 0; k <= np; k++) {
      const fk = fmin * Math.pow(fmax / fmin, k / np); const h = acPoint(setup, si, fk); if (!h) return { ok: false, err: 'แก้สมการในโดเมนความถี่ไม่ได้ที่ ' + fmtSI(fk, 'Hz') };
      const m = Math.hypot(h[0], h[1]); let p = Math.atan2(h[1], h[0]) * 180 / Math.PI;
      if (prev !== null) { while (p - prev > 180) p -= 360; while (p - prev < -180) p += 360; }
      prev = p; f.push(fk); re.push(h[0]); im.push(h[1]); mag.push(m); db.push(20 * Math.log10(Math.max(m, 1e-300))); ph.push(p);
    }
    return { ok: true, f, re, im, mag, db, ph, src: M.srcs[si], outName: setup.out.o.name, warnings: setup.dc.ok ? setup.dc.warnings.filter((w) => /อิ่มตัว/.test(w)) : [] };
  }

  /* ---------- polynomials & roots (ascending real coefficients) ---------- */
  const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]], cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  function polyEvalC(c, z) { let r = [0, 0]; for (let i = c.length - 1; i >= 0; i--) r = cadd(cmul(r, z), [c[i], 0]); return r; }
  function polyTrim(c, rel) { c = c.slice(); const mx = Math.max(...c.map(Math.abs), 0); while (c.length > 1 && Math.abs(c[c.length - 1]) <= rel * mx) c.pop(); return c; }
  function polyRoots(c0) {
    let c = polyTrim(c0, 1e-12); if (c.length <= 1) return [];
    const mx = Math.max(...c.map(Math.abs)); let nz = 0; while (nz < c.length - 1 && Math.abs(c[nz]) <= 1e-11 * mx) nz++;
    const zeros = Array.from({ length: nz }, () => [0, 0]); c = c.slice(nz); const n = c.length - 1; if (n < 1) return zeros;
    const lead = c[n]; const a = c.map((v) => v / lead);
    if (n === 1) return zeros.concat([[-a[0], 0]]);
    if (n === 2) { const disc = a[1] * a[1] - 4 * a[0]; if (disc >= 0) { const q = -0.5 * (a[1] + Math.sign(a[1] || 1) * Math.sqrt(disc)); const r1 = q, r2 = q !== 0 ? a[0] / q : 0; return zeros.concat([[r1, 0], [r2, 0]]); } return zeros.concat([[-a[1] / 2, Math.sqrt(-disc) / 2], [-a[1] / 2, -Math.sqrt(-disc) / 2]]); }
    let R = 1 + Math.max(...a.slice(0, n).map(Math.abs)); R = Math.min(R, 1e6);
    const z = Array.from({ length: n }, (_, k) => { const th = 2 * Math.PI * k / n + 0.4; return [R * 0.6 * Math.cos(th), R * 0.6 * Math.sin(th)]; });
    for (let it = 0; it < 800; it++) {
      let mv = 0;
      for (let i = 0; i < n; i++) {
        let den = [1, 0]; for (let j = 0; j < n; j++) if (j !== i) den = cmul(den, [z[i][0] - z[j][0], z[i][1] - z[j][1]]);
        const dz = cdiv(polyEvalC(a, z[i]), den); z[i] = [z[i][0] - dz[0], z[i][1] - dz[1]]; mv = Math.max(mv, Math.hypot(dz[0], dz[1]) / (1 + Math.hypot(z[i][0], z[i][1])));
      }
      if (mv < 1e-15) break;
    }
    const da = a.map((v, i) => v * i).slice(1);
    for (let i = 0; i < n; i++) for (let it = 0; it < 4; it++) { const f = polyEvalC(a, z[i]), d = polyEvalC(da, z[i]); if (Math.hypot(d[0], d[1]) < 1e-300) break; const dz = cdiv(f, d); const nz2 = [z[i][0] - dz[0], z[i][1] - dz[1]]; if (isFinite(nz2[0]) && isFinite(nz2[1])) z[i] = nz2; }
    for (const r of z) if (Math.abs(r[1]) < 1e-9 * (1 + Math.abs(r[0]))) r[1] = 0;
    return zeros.concat(z);
  }
  function expandRoots(roots) {
    let p = [[1, 0]];
    for (const r of roots) { const q = new Array(p.length + 1).fill(0).map(() => [0, 0]); p.forEach((c, i) => { q[i + 1] = cadd(q[i + 1], c); q[i] = cadd(q[i], cmul(c, [-r[0], -r[1]])); }); p = q; }
    return p.map((c) => c[0]);
  }

  /* H(s) = N(s)/D(s) for the chosen output, for every independent source */
  function transferFunctions(comps, outId, opts = {}) {
    const setup = acSetup(comps, Object.assign({ outId }, opts)); if (setup.err) return { ok: false, err: setup.err };
    const { M, dc, out } = setup; const notes = [];
    if (dc.ok) for (const w of dc.warnings) if (/อิ่มตัว/.test(w)) notes.push('จุดทำงาน DC: ' + w + ' ฟังก์ชันถ่ายโอนด้านล่างคิดที่สถานะอิ่มตัวนี้ (อัตราขยายสัญญาณเล็กของออปแอมป์ที่อิ่มตัวเป็นศูนย์)');
    if (setup.net.elems.some((e) => e.t === 'D')) notes.push('มีไดโอด: ฟังก์ชันถ่ายโอนคิดแบบเชิงเส้นช่วงที่สถานะไดโอด (เปิด/ปิด) ตรงกับจุดทำงาน DC');
    // rank of Cm bounds the degree of det(G + sCm)
    let rank = 0; { const T = M.Cm.map((r) => r.slice()); const N = M.N; const used = new Array(N).fill(false); let mx0 = 0; for (const r of T) for (const v of r) mx0 = Math.max(mx0, Math.abs(v));
      for (let c = 0; c < N; c++) { let p = -1, best = 1e-12 * (mx0 || 1); for (let r = 0; r < N; r++) if (!used[r] && Math.abs(T[r][c]) > best) { best = Math.abs(T[r][c]); p = r; } if (p < 0) continue; used[p] = true; rank++; for (let r = 0; r < N; r++) if (r !== p) { const f = T[r][c] / T[p][c]; if (f) for (let j = 0; j < N; j++) T[r][j] -= f * T[p][j]; } } }
    const m = rank; const K = Math.max(2, m + 1);
    // frequency scale from the reactive elements
    const Rs = comps.filter((c) => c.t === 'R').map((c) => +c.v).filter((v) => v > 0); const Rg = Rs.length ? Math.exp(Rs.reduce((s, v) => s + Math.log(v), 0) / Rs.length) : 1e3;
    const ws = []; for (const c of comps) { if (c.t === 'C' && c.v > 0) ws.push(1 / (Rg * c.v)); if (c.t === 'L' && c.v > 0) ws.push(Rg / c.v); }
    for (const c of setup.net.ops) { const P = opParams(c, false); if (!P.ideal && isFinite(P.gbw)) ws.push(2 * Math.PI * P.gbw); }
    let rho = ws.length ? Math.exp(ws.reduce((s, v) => s + Math.log(v), 0) / ws.length) : 1;
    const sample = (rho) => {
      const D = [], H = M.srcs.map(() => []);
      for (let k = 0; k < K; k++) {
        const th = 2 * Math.PI * k / K; const sr = rho * Math.cos(th), si = rho * Math.sin(th);
        const [Ar, Ai] = Yat(M, sr, si); const lu = cluFactor(Ar, Ai); if (!lu) return null;
        D.push([lu.dr, lu.di]);
        M.srcs.forEach((s, j) => { const { xr, xi } = cluSolve(lu, srcVec(M, s)); const g = (a) => (a >= 0 ? [xr[a], xi[a]] : [0, 0]); const A = g(out.a), B = g(out.b); H[j].push([A[0] - B[0], A[1] - B[1]]); });
      }
      return { D, H };
    };
    const dft = (vals) => { // coefficients c_n rho^n
      const c = []; for (let n = 0; n < K; n++) { let r = 0; for (let k = 0; k < K; k++) { const th = -2 * Math.PI * k * n / K; r += vals[k][0] * Math.cos(th) - vals[k][1] * Math.sin(th); } c.push(r / K); } return c;
    };
    const run = (rho) => {
      const sm = sample(rho); if (!sm) return null;
      const dmax = Math.max(...sm.D.map((d) => Math.hypot(d[0], d[1]))) || 1;
      const Dn = sm.D.map((d) => [d[0] / dmax, d[1] / dmax]); const Dc = dft(Dn);
      const Nc = sm.H.map((Hj) => dft(Hj.map((h, k) => cmul(h, Dn[k]))));
      return { Dc, Nc };
    };
    let r = run(rho); if (!r) return { ok: false, err: SINGULAR, notes };
    // second pass: centre the circle on the root magnitudes
    { const rts = [].concat(polyRoots(r.Dc), ...r.Nc.map((c) => polyRoots(c))).map((z) => Math.hypot(z[0], z[1])).filter((v) => v > 1e-9); if (rts.length) { const g2 = Math.exp(rts.reduce((s, v) => s + Math.log(v), 0) / rts.length); if (g2 > 0 && isFinite(g2) && (g2 / 1 > 3 || g2 < 1 / 3)) { const r2 = run(rho * g2); if (r2) { r = r2; rho = rho * g2; } } } }
    let horizon = Infinity;
    { let g = 0; for (const c of setup.net.ops) { const P = opParams(c, false); if (!P.ideal && isFinite(P.gbw)) g = Math.max(g, 2 * Math.PI * P.gbw); } horizon = g > 0 ? 100 * g : Infinity; }
    const tfs = M.srcs.map((s, j) => {
      let Dc = r.Dc.slice(), Nc = r.Nc[j].slice();
      const dmax = Math.max(...Dc.map(Math.abs)); const nmax = Math.max(...Nc.map(Math.abs));
      const rec = { src: s.lab, srcId: s.id, kind: s.kind, zero: false };
      if (!(nmax > 1e-10 * dmax)) { rec.zero = true; rec.num = [0]; rec.den = [1]; rec.zeros = []; rec.poles = []; rec.k = 0; rec.dc = 0; return rec; }
      Dc = polyTrim(Dc, 1e-10); Nc = polyTrim(Nc, 1e-10);
      let zr = polyRoots(Nc).map((z) => [z[0] * rho, z[1] * rho]), pl = polyRoots(Dc).map((z) => [z[0] * rho, z[1] * rho]);
      let kScaled = Nc[Nc.length - 1] / Dc[Dc.length - 1] * Math.pow(rho, Dc.length - Nc.length); // leading ratio in s-domain
      // cancel common roots
      let cancelled = 0;
      for (let i = zr.length - 1; i >= 0; i--) { let jb = -1, bd = Infinity; pl.forEach((p, jj) => { const d = Math.hypot(zr[i][0] - p[0], zr[i][1] - p[1]) / Math.max(Math.hypot(zr[i][0], zr[i][1]), Math.hypot(p[0], p[1]), 1e-6 * rho); if (d < bd) { bd = d; jb = jj; } }); if (bd < 2e-4) { zr.splice(i, 1); pl.splice(jb, 1); cancelled++; } }
      rec.cancelled = cancelled;
      // beyond ~100x the unity-gain frequency of a real op-amp the macromodel means nothing: fold those roots into the gain
      let kk = kScaled; rec.dropped = 0;
      if (horizon < Infinity) {
        const fold = (arr, isZero) => { for (let i = arr.length - 1; i >= 0; i--) { const mg = Math.hypot(arr[i][0], arr[i][1]); if (mg <= horizon) continue; const r2 = arr[i][1] === 0 ? -arr[i][0] : mg * mg; const pairIdx = arr[i][1] !== 0 ? arr.findIndex((q, j) => j !== i && Math.abs(q[0] - arr[i][0]) < 1e-6 * mg && Math.abs(q[1] + arr[i][1]) < 1e-6 * mg) : -1; if (arr[i][1] !== 0 && pairIdx < 0) continue; kk = isZero ? kk * r2 : kk / r2; arr.splice(i, 1); if (pairIdx >= 0) { arr.splice(pairIdx > i ? pairIdx - 1 : pairIdx, 1); i = Math.min(i, arr.length); } rec.dropped++; } };
        fold(zr, true); fold(pl, false);
      }
      rec.zeros = zr; rec.poles = pl; rec.k = kk; kScaled = kk;
      rec.den = expandRoots(pl); rec.num = expandRoots(zr).map((v) => v * kScaled);
      { const rm = pl.concat(zr).map((z) => Math.hypot(z[0], z[1])).filter((v) => v > 1e-9 * rho); rec.w0 = rm.length ? Math.exp(rm.reduce((a2, v) => a2 + Math.log(v), 0) / rm.length) : rho; }
      const n0 = rec.num[0], d0 = rec.den[0]; rec.dc = Math.abs(d0) < 1e-12 * Math.max(...rec.den.map(Math.abs), 1) ? (Math.abs(n0) < 1e-12 ? NaN : Infinity) : n0 / d0;
      rec.order = pl.length;
      return rec;
    });
    return { ok: true, tfs, outName: out.o.name, order: m, notes, rho };
  }
  /* evaluate a recovered H(jω) */
  function evalTF(tf, f) {
    const s = [0, 2 * Math.PI * f]; const pe = (c) => polyEvalC(c, s); const nn = pe(tf.num), dd = pe(tf.den); return cdiv(nn, dd);
  }

  /* classify (from the pole/zero structure) and measure a response for the summary line */
  function analyzeTF(tf) {
    if (tf.zero) return { kind: 'ไม่มีเส้นทางสัญญาณ', kindEn: 'no path', desc: 'H(s) = 0: แหล่งจ่ายนี้ไม่มีผลต่อเอาต์พุตที่เลือก', stable: true, poles: [], zeros: [] };
    const mg0 = (z) => Math.hypot(z[0], z[1]);
    const rts = tf.poles.concat(tf.zeros).map(mg0).filter((v) => v > 1e-9 * Math.max(...tf.poles.concat(tf.zeros).map(mg0), 1e-300));
    const w0 = rts.length ? Math.exp(rts.reduce((s2, v) => s2 + Math.log(v), 0) / rts.length) : 2 * Math.PI * 1e3;
    const isO = (z) => mg0(z) < 1e-9 * w0;
    const np = tf.poles.length, nz = tf.zeros.length, np0 = tf.poles.filter(isO).length, nz0 = tf.zeros.filter(isO).length;
    const onAxis = (z) => Math.abs(z[0]) < 1e-6 * mg0(z) && mg0(z) > 0;
    const info = { poles: tf.poles, zeros: tf.zeros, np0, nz0, order: np };
    info.unstable = tf.poles.some((p) => p[0] > 1e-6 * Math.max(mg0(p), 1e-9)); info.marginal = !info.unstable && tf.poles.some((p) => isO(p) || onAxis(p)); info.stable = !info.unstable && !info.marginal;
    // response grid
    const fmin = Math.max(1e-9, (rts.length ? Math.min(...rts) : w0) / (2 * Math.PI) / 1e3), fmax = (rts.length ? Math.max(...rts) : w0) / (2 * Math.PI) * 1e3;
    const NPT = 800, fs = [], mg = [];
    for (let k = 0; k <= NPT; k++) { const f = fmin * Math.pow(fmax / fmin, k / NPT); const h = evalTF(tf, f); fs.push(f); mg.push(Math.hypot(h[0], h[1])); }
    const interp = (k, lvl) => { const a = Math.log10(fs[k - 1]), b = Math.log10(fs[k]), ya = mg[k - 1], yb = mg[k]; const t = ya === yb ? 0 : (lvl - ya) / (yb - ya); return Math.pow(10, a + (b - a) * Math.max(0, Math.min(1, t))); };
    const down = (lvl, from) => { for (let k = Math.max(1, from); k <= NPT; k++) if (mg[k] <= lvl && mg[k - 1] > lvl) return interp(k, lvl); return null; };
    const up = (lvl, from) => { for (let k = Math.max(1, from); k <= NPT; k++) if (mg[k] >= lvl && mg[k - 1] < lvl) return interp(k, lvl); return null; };
    const lo = np0 === 0 ? Math.abs(tf.dc) : Infinity, hi = nz >= np ? Math.abs(tf.k) : 0;
    info.dc = np0 === 0 ? tf.dc : null; info.hf = nz >= np ? tf.k : 0;
    const pk = Math.max(...mg), ipk = mg.indexOf(pk); info.peak = pk; info.fpeak = fs[ipk];
    let kind, en;
    if (np === 0 && nz === 0) { kind = 'ขยายสัญญาณคงที่ (Gain)'; en = 'gain'; }
    else if (np === 0 && nz0 === nz) { kind = nz0 === 1 ? 'ดิฟเฟอเรนเชียเตอร์ (Differentiator)' : 'ดิฟเฟอเรนเชียเตอร์ลำดับ ' + nz0; en = 'differentiator'; }
    else if (np0 === np && nz === 0) { kind = np0 === 1 ? 'อินทิเกรเตอร์ (Integrator)' : 'อินทิเกรเตอร์ซ้อน ' + np0 + ' ชั้น'; en = 'integrator'; info.unity = Math.pow(Math.abs(tf.k), 1 / np0) / (2 * Math.PI); }
    else if (np0 > 0) { kind = np0 === 1 && np === 1 && nz === 1 && !isO(tf.zeros[0]) ? 'ตัวควบคุม PI (PI controller)' : 'ระบบที่มีอินทิเกรเตอร์ (ขั้วที่ s = 0) อันดับ ' + np; en = 'pi'; if (np0 === 1 && nz === 1 && !isO(tf.zeros[0])) info.fz = mg0(tf.zeros[0]) / (2 * Math.PI); }
    else if (nz0 === 0) {
      if (nz < np) { kind = 'ตัวกรองผ่านต่ำ (Low-pass) อันดับ ' + np; en = 'low-pass'; }
      else if (tf.zeros.length && tf.zeros.every(onAxis)) { kind = 'ตัวกรองแถบหยุด (Notch / Band-stop)'; en = 'notch'; info.f0 = Math.min(...tf.zeros.map(mg0)) / (2 * Math.PI); }
      else if (np === nz && tf.poles.every((p) => tf.zeros.some((z) => Math.abs(z[0] + p[0]) < 1e-3 * mg0(p) && Math.abs(z[1] - p[1]) < 1e-3 * mg0(p)))) { kind = 'ตัวกรองผ่านทุกความถี่ (All-pass) เลื่อนเฟสอย่างเดียว'; en = 'all-pass'; }
      else { kind = hi > lo ? 'วงจรนำเฟส (Lead) / ชันขึ้นที่ความถี่สูง' : 'วงจรหน่วงเฟส (Lag) / ชั้นลดที่ความถี่สูง'; en = 'lead-lag'; }
    } else if (nz < np) { kind = 'ตัวกรองผ่านแถบความถี่ (Band-pass) อันดับ ' + np; en = 'band-pass'; }
    else if (nz0 === np) { kind = 'ตัวกรองผ่านสูง (High-pass) อันดับ ' + np; en = 'high-pass'; }
    else { kind = 'ระบบอันดับ ' + np; en = 'general'; }
    info.kind = kind; info.kindEn = en;
    if (en === 'low-pass') { const ref = lo; info.fc = down(ref / Math.SQRT2, pk > ref * 1.0001 ? ipk : 1); info.peakDb = 20 * Math.log10(pk / ref); }
    else if (en === 'high-pass') { info.fc = up(hi / Math.SQRT2, 1); info.peakDb = 20 * Math.log10(pk / hi); }
    else if (en === 'band-pass') { const lvl = pk / Math.SQRT2; info.f1 = up(lvl, 1); info.f2 = down(lvl, ipk); info.f0 = fs[ipk]; info.q = info.f1 && info.f2 ? info.f0 / (info.f2 - info.f1) : null; info.gain0 = pk; }
    else if (en === 'lead-lag' || en === 'gain') { info.fc = null; }
    if (en === 'low-pass' || en === 'high-pass' || en === 'band-pass' || en === 'lead-lag') {
      // −3 dB / second-order parameters from the dominant complex pair
      const cp = tf.poles.filter((p) => p[1] > 1e-9 * mg0(p)); if (cp.length) { cp.sort((a, b) => mg0(b) - mg0(a)); const p = cp[0]; info.wn = mg0(p); info.zeta = -p[0] / info.wn; info.Q = info.zeta > 1e-9 ? 1 / (2 * info.zeta) : Infinity; }
    }
    return info;
  }

  /* TeX helpers */
  function numTeX(x, d = 4) {
    if (x === 0 || Math.abs(x) < 1e-30) return '0';
    const a = Math.abs(x);
    if (a >= 1e-2 && a < 1e5) return String(Number(x.toPrecision(d)));
    let e = Math.floor(Math.log10(a)); let m = Number((x / Math.pow(10, e)).toPrecision(d));
    if (Math.abs(m) >= 10) { m /= 10; e += 1; }
    return (m === 1 ? '' : m === -1 ? '-' : m + '\\times ') + '10^{' + e + '}';
  }
  /* c ascending; ws = characteristic angular frequency so that tiny-looking but genuine coefficients (s² next to 10¹⁰) are kept */
  function polyTeX(c, d = 4, ws = 1) {
    const terms = []; let mx = 0; c.forEach((v, i) => { mx = Math.max(mx, Math.abs(v) * Math.pow(ws, i)); });
    for (let i = c.length - 1; i >= 0; i--) {
      const v = c[i]; if (Math.abs(v) * Math.pow(ws, i) <= 1e-9 * mx) continue; const neg = v < 0; const a = Math.abs(v);
      let body; const pw = i === 0 ? '' : i === 1 ? 's' : 's^{' + i + '}';
      if (i === 0) body = numTeX(a, d); else if (Math.abs(a - 1) < 5e-5) body = pw; else { const t = numTeX(a, d); body = (/times/.test(t) ? '(' + t + ')' : t) + pw; }
      terms.push((terms.length ? (neg ? ' - ' : ' + ') : (neg ? '-' : '')) + body);
    }
    return terms.length ? terms.join('') : '0';
  }
  function tfTeX(tf, name = 'H') {
    if (tf.zero) return name + '(s) = 0';
    const den = tf.den, num = tf.num; const lead = den[den.length - 1];
    const dn = den.map((v) => v / lead), nn = num.map((v) => v / lead);
    const ws = tf.w0 || 1; const nTeX = polyTeX(nn, 4, ws), dTeX = polyTeX(dn, 4, ws);
    if (dTeX === '1') return name + '(s) = ' + nTeX;
    return name + '(s) = \\dfrac{' + nTeX + '}{' + dTeX + '}';
  }
  function pzTeX(tf, name = 'H') {
    if (tf.zero) return '';
    const fac = (r) => { const re = r[0], im = r[1]; const mg = Math.hypot(re, im); if (mg < 1e-9) return 's'; return re === 0 ? '(s ' + (im > 0 ? '+' : '-') + ' j' + numTeX(Math.abs(im)) + ')' : '(s ' + (re < 0 ? '+' : '-') + ' ' + numTeX(Math.abs(re)) + ')'; };
    const group = (rs) => {
      const out = []; const used = new Array(rs.length).fill(false);
      rs.forEach((r, i) => { if (used[i]) return; used[i] = true; if (Math.abs(r[1]) > 1e-9 * Math.hypot(r[0], r[1])) { const j = rs.findIndex((q, k) => !used[k] && Math.abs(q[0] - r[0]) < 1e-6 * Math.hypot(r[0], r[1]) && Math.abs(q[1] + r[1]) < 1e-6 * Math.hypot(r[0], r[1])); if (j >= 0) used[j] = true; const wn2 = r[0] * r[0] + r[1] * r[1]; out.push('(s^2 ' + (r[0] <= 0 ? '+ ' : '- ') + numTeX(Math.abs(2 * r[0])) + 's + ' + numTeX(wn2) + ')'); } else out.push(fac(r)); });
      return out;
    };
    const nz = group(tf.zeros), dp = group(tf.poles);
    return name + '(s) = ' + numTeX(tf.k) + '\\,\\dfrac{' + (nz.length ? nz.join('') : '1') + '}{' + (dp.length ? dp.join('') : '1') + '}';
  }

  /* ================================================ builders ===== */
  const OK = (() => {
    let uid = 0;
    const mk = (t, x1, y1, x2, y2, v, lab, o) => Object.assign({ id: 'k' + (++uid), t, x1, y1, x2, y2, v, lab }, o || {});
    const R = (x1, y1, x2, y2, v, lab, o) => mk('R', x1, y1, x2, y2, v, lab, o);
    const L = (x1, y1, x2, y2, v, lab, o) => mk('L', x1, y1, x2, y2, v, lab, o);
    const C = (x1, y1, x2, y2, v, lab, o) => mk('C', x1, y1, x2, y2, v, lab, o);
    const D = (x1, y1, x2, y2, lab, o) => mk('D', x1, y1, x2, y2, 0.65, lab, o);
    /* V / I source with a waveform: w kind, v amplitude (or DC level), f Hz, off DC offset */
    const V = (x1, y1, x2, y2, lab, w, v, f, off, o) => mk('V', x1, y1, x2, y2, v, lab, Object.assign({ w: w || 'dc', f: f || 1000, off: off || 0 }, o || {}));
    const I = (x1, y1, x2, y2, lab, w, v, f, off, o) => mk('I', x1, y1, x2, y2, v, lab, Object.assign({ w: w || 'dc', f: f || 1000, off: off || 0 }, o || {}));
    const VM = (x1, y1, x2, y2, lab, o) => mk('VM', x1, y1, x2, y2, 0, lab, o);
    const OP = (cx, cy, lab, o) => mk('OP', cx, cy, cx, cy, 0, lab, Object.assign({ rot: 0, flip: false, m: 'ideal', vp: 15, vn: -15 }, o || {}));
    const PR = (x, y, lab, o) => mk('P', x, y, x, y, 0, lab, o);
    const G = (x, y) => mk('G', x, y, x, y);
    const T = (x, y, text, o) => mk('T', x, y, x, y, 0, text, o);
    const W = (...p) => { const out = []; for (let i = 0; i + 3 < p.length; i += 2) out.push(mk('W', p[i], p[i + 1], p[i + 2], p[i + 3])); return out; };
    const flat = (...a) => a.flat(3);
    /* load resistor from node (x,y) down to ground */
    const load = (x, y, rl) => (rl ? [W(x, y, x, y + 2), R(x, y + 2, x, y + 6, rl, 'RL'), G(x, y + 6)] : []);
    const P = {};
    /* Single-stage layout: source at x=3, op-amp centre (20,10): pins (−)(18,9) (+)(18,11) out(22,10); output node x=30. Flip = (+) on top. */

    /* Vo = −(Rf/Rin) Vin */
    P.inverting = (o = {}) => { const { rin = 1e3, rf = 10e3, m = 'ideal', w = 'sin', amp = 0.1, f = 1000, rl = 10e3, vp = 15, vn = -15 } = o; return flat(
      V(3, 9, 3, 13, 'Vin', w, amp, f, 0), G(3, 13), W(3, 9, 6, 9), R(6, 9, 10, 9, rin, 'Rin'), W(10, 9, 18, 9),
      W(14, 9, 14, 5, 16, 5), R(16, 5, 20, 5, rf, 'Rf'), W(20, 5, 26, 5, 26, 10),
      OP(20, 10, 'U1', { m, vp, vn }), W(18, 11, 18, 13), G(18, 13), W(22, 10, 30, 10), load(30, 10, rl),
      PR(30, 10, 'Vo', { side: 'r' }), PR(3, 9, 'Vi', { side: 'l' })); };
    /* Vo = (1 + Rf/Rg) Vin */
    P.noninverting = (o = {}) => { const { rg = 1e3, rf = 10e3, m = 'ideal', w = 'sin', amp = 0.1, f = 1000, rl = 10e3, vp = 15, vn = -15 } = o; return flat(
      V(3, 9, 3, 13, 'Vin', w, amp, f, 0), G(3, 13), W(3, 9, 18, 9), OP(20, 10, 'U1', { m, flip: true, vp, vn }),
      W(18, 11, 14, 11), W(14, 11, 12, 11), R(8, 11, 12, 11, rg, 'Rg', { lp: -1 }), G(8, 11),
      W(14, 11, 14, 15, 16, 15), R(16, 15, 20, 15, rf, 'Rf', { lp: -1 }), W(20, 15, 26, 15, 26, 10), W(22, 10, 30, 10), load(30, 10, rl),
      PR(30, 10, 'Vo', { side: 'r' }), PR(3, 9, 'Vi', { side: 'l' })); };
    /* Vo = Vin */
    P.follower = (o = {}) => { const { m = 'ideal', w = 'sin', amp = 1, f = 1000, rl = 10e3, vp = 15, vn = -15 } = o; return flat(
      V(3, 11, 3, 15, 'Vin', w, amp, f, 0), G(3, 15), W(3, 11, 18, 11), OP(20, 10, 'U1', { m, vp, vn }),
      W(18, 9, 16, 9, 16, 5, 26, 5, 26, 10), W(22, 10, 30, 10), load(30, 10, rl),
      PR(30, 10, 'Vo', { side: 'r' }), PR(3, 11, 'Vi', { side: 'l' })); };
    /* Vo = −Rf (V1/R1 + V2/R2) */
    P.summer = (o = {}) => { const { r1 = 10e3, r2 = 20e3, rf = 10e3, m = 'ideal', rl = 10e3 } = o; return flat(
      V(6, 5, 2, 5, 'V1', 'dc', 1, 1000, 0), G(2, 5), W(6, 5, 8, 5), R(8, 5, 12, 5, r1, 'R1'), W(12, 5, 16, 5),
      V(6, 9, 2, 9, 'V2', 'sin', 0.5, 1000, 0), G(2, 9), W(6, 9, 8, 9), R(8, 9, 12, 9, r2, 'R2'), W(12, 9, 16, 9),
      W(16, 5, 16, 11, 20, 11), W(16, 5, 16, 3, 18, 3), R(18, 3, 22, 3, rf, 'Rf'), W(22, 3, 28, 3, 28, 12),
      OP(22, 12, 'U1', { m }), W(20, 13, 20, 15), G(20, 15), W(24, 12, 32, 12), load(32, 12, rl), PR(32, 12, 'Vo', { side: 'r' })); };
    /* Vo = (R4/(R3+R4))(1+Rf/R1) V2 − (Rf/R1) V1 */
    P.diffamp = (o = {}) => { const { r1 = 10e3, rf = 10e3, r3 = 10e3, r4 = 10e3, m = 'ideal', rl = 10e3 } = o; return flat(
      V(6, 7, 2, 7, 'V1', 'sin', 0.5, 1000, 0), G(2, 7), W(6, 7, 8, 7), R(8, 7, 12, 7, r1, 'R1'), W(12, 7, 16, 7), W(16, 7, 16, 11, 20, 11),
      W(16, 7, 16, 3, 18, 3), R(18, 3, 22, 3, rf, 'Rf'), W(22, 3, 28, 3, 28, 12),
      V(6, 15, 2, 15, 'V2', 'dc', 1, 1000, 0), G(2, 15), W(6, 15, 8, 15), R(8, 15, 12, 15, r3, 'R3'), W(12, 15, 16, 15), W(16, 15, 16, 13, 20, 13),
      R(16, 15, 16, 19, r4, 'R4'), G(16, 19), OP(22, 12, 'U1', { m }), W(24, 12, 32, 12), load(32, 12, rl), PR(32, 12, 'Vo', { side: 'r' })); };
    /* three op-amp instrumentation amplifier: Vo = (1 + 2R1/Rg)(R3/R2)(V2 − V1) */
    P.inamp = (o = {}) => { const { r1 = 12e3, rg = 1e3, r2 = 10e3, r3 = 10e3, m = 'ideal', rl = 10e3 } = o; return flat(
      V(6, 7, 2, 7, 'V1', 'dc', 1, 1000, 0), G(2, 7), W(6, 7, 12, 7), V(6, 21, 2, 21, 'V2', 'sin', 0.01, 1000, 1), G(2, 21), W(6, 21, 12, 21),
      OP(14, 8, 'U1', { m, flip: true }), OP(14, 20, 'U2', { m }),
      W(12, 9, 10, 9, 10, 12), W(10, 12, 12, 12), R(12, 12, 16, 12, r1, 'R1', { lp: -1 }), W(16, 12, 19, 12, 19, 8), W(16, 8, 19, 8),
      R(10, 12, 10, 16, rg, 'Rg', { lp: -1 }), W(12, 19, 10, 19, 10, 16), W(10, 16, 12, 16), R(12, 16, 16, 16, r1, 'R1b'), W(16, 16, 19, 16, 19, 20), W(16, 20, 19, 20),
      OP(30, 14, 'U3', { m }), W(19, 8, 22, 8), R(22, 8, 26, 8, r2, 'R2'), W(26, 8, 26, 13, 28, 13), W(26, 8, 26, 5, 28, 5), R(28, 5, 32, 5, r3, 'R3'), W(32, 5, 36, 5, 36, 14),
      W(19, 20, 22, 20), R(22, 20, 26, 20, r2, 'R2b'), W(26, 20, 26, 15, 28, 15), R(26, 20, 26, 24, r3, 'R3b'), G(26, 24),
      W(32, 14, 40, 14), load(40, 14, rl), PR(40, 14, 'Vo', { side: 'r' })); };
    /* integrator: Vo = −(1/RC)∫Vin dt (+ initial condition ic on C) */
    P.integrator = (o = {}) => { const { rin = 10e3, cf = 100e-9, ic = 0, rp = null, m = 'ideal', w = 'sq', amp = 1, f = 100, rl = 10e3 } = o; return flat(
      V(3, 9, 3, 13, 'Vin', w, amp, f, 0), G(3, 13), W(3, 9, 6, 9), R(6, 9, 10, 9, rin, 'Rin'), W(10, 9, 18, 9),
      W(14, 9, 14, 5, 16, 5), C(16, 5, 20, 5, cf, 'Cf', { ic }), W(20, 5, 26, 5, 26, 10),
      rp ? [W(14, 5, 14, 2, 16, 2), R(16, 2, 20, 2, rp, 'Rp'), W(20, 2, 26, 2, 26, 5)] : [],
      OP(20, 10, 'U1', { m }), W(18, 11, 18, 13), G(18, 13), W(22, 10, 30, 10), load(30, 10, rl),
      PR(30, 10, 'Vo', { side: 'r' }), PR(3, 9, 'Vi', { side: 'l' })); };
    /* practical differentiator: Vo ≈ −Rf Cin dVin/dt (limited by Rs and Cf) */
    P.differentiator = (o = {}) => { const { cin = 10e-9, rs = 1e3, rf = 10e3, cf = 1e-9, m = 'ideal', w = 'tri', amp = 0.5, f = 1000, rl = 10e3 } = o; return flat(
      V(3, 9, 3, 13, 'Vin', w, amp, f, 0), G(3, 13), W(3, 9, 5, 9), C(5, 9, 9, 9, cin, 'Cin'), W(9, 9, 10, 9), R(10, 9, 14, 9, rs, 'Rs'), W(14, 9, 18, 9),
      W(16, 9, 16, 5, 18, 5), R(18, 5, 22, 5, rf, 'Rf'), W(22, 5, 26, 5, 26, 10), W(16, 5, 16, 2, 18, 2), C(18, 2, 22, 2, cf, 'Cf'), W(22, 2, 26, 2, 26, 5),
      OP(20, 10, 'U1', { m }), W(18, 11, 18, 13), G(18, 13), W(22, 10, 30, 10), load(30, 10, rl),
      PR(30, 10, 'Vo', { side: 'r' }), PR(3, 9, 'Vi', { side: 'l' })); };
    /* first-order low-pass: H = −(Rf/Rin)/(1 + sRfCf) */
    P.lpf1 = (o = {}) => { const { rin = 10e3, rf = 10e3, cf = 10e-9, m = 'ideal', w = 'sin', amp = 1, f = 1000, rl = 10e3 } = o; return flat(
      V(3, 9, 3, 13, 'Vin', w, amp, f, 0), G(3, 13), W(3, 9, 6, 9), R(6, 9, 10, 9, rin, 'Rin'), W(10, 9, 18, 9),
      W(14, 9, 14, 5, 16, 5), R(16, 5, 20, 5, rf, 'Rf'), W(20, 5, 26, 5, 26, 10), W(14, 5, 14, 2, 16, 2), C(16, 2, 20, 2, cf, 'Cf'), W(20, 2, 26, 2, 26, 5),
      OP(20, 10, 'U1', { m }), W(18, 11, 18, 13), G(18, 13), W(22, 10, 30, 10), load(30, 10, rl),
      PR(30, 10, 'Vo', { side: 'r' }), PR(3, 9, 'Vi', { side: 'l' })); };
    /* first-order high-pass: H = −(Rf/Rin) s/(s + 1/(RinCin)) */
    P.hpf1 = (o = {}) => { const { cin = 10e-9, rin = 10e3, rf = 10e3, m = 'ideal', w = 'sin', amp = 1, f = 1000, rl = 10e3 } = o; return flat(
      V(3, 9, 3, 13, 'Vin', w, amp, f, 0), G(3, 13), W(3, 9, 5, 9), C(5, 9, 9, 9, cin, 'Cin'), W(9, 9, 10, 9), R(10, 9, 14, 9, rin, 'Rin'), W(14, 9, 18, 9),
      W(16, 9, 16, 5, 18, 5), R(18, 5, 22, 5, rf, 'Rf'), W(22, 5, 26, 5, 26, 10),
      OP(20, 10, 'U1', { m }), W(18, 11, 18, 13), G(18, 13), W(22, 10, 30, 10), load(30, 10, rl),
      PR(30, 10, 'Vo', { side: 'r' }), PR(3, 9, 'Vi', { side: 'l' })); };
    /* PI controller: H = −(Rf/Rin)(1 + 1/(sRfCf)) */
    P.pi = (o = {}) => { const { rin = 10e3, rf = 20e3, cf = 100e-9, m = 'ideal', w = 'sq', amp = 0.5, f = 20, rl = 10e3 } = o; return flat(
      V(3, 9, 3, 13, 'Vin', w, amp, f, 0), G(3, 13), W(3, 9, 6, 9), R(6, 9, 10, 9, rin, 'Rin'), W(10, 9, 18, 9),
      W(14, 9, 14, 5, 16, 5), R(16, 5, 20, 5, rf, 'Rf'), W(20, 5, 22, 5), C(22, 5, 26, 5, cf, 'Cf', { ic: 0 }), W(26, 5, 28, 5, 28, 10),
      OP(20, 10, 'U1', { m }), W(18, 11, 18, 13), G(18, 13), W(22, 10, 34, 10), load(34, 10, rl),
      PR(34, 10, 'Vo', { side: 'r' }), PR(3, 9, 'Vi', { side: 'l' })); };
    /* transimpedance amplifier: Vo = −Rf Iin (pole at 1/(RfCf)) */
    P.tia = (o = {}) => { const { rf = 100e3, cf = 100e-12, m = 'ideal', amp = 10e-6, f = 1000, rl = 10e3 } = o; return flat(
      I(3, 13, 3, 9, 'Iin', 'sin', amp, f, 0), G(3, 13), W(3, 9, 18, 9),
      W(14, 9, 14, 5, 16, 5), R(16, 5, 20, 5, rf, 'Rf'), W(20, 5, 26, 5, 26, 10), W(14, 5, 14, 2, 16, 2), C(16, 2, 20, 2, cf, 'Cf'), W(20, 2, 26, 2, 26, 5),
      OP(20, 10, 'U1', { m }), W(18, 11, 18, 13), G(18, 13), W(22, 10, 30, 10), load(30, 10, rl), PR(30, 10, 'Vo', { side: 'r' })); };
    /* one Sallen–Key unity-gain low-pass stage, shifted right by dx: input = left end of R1 (6+dx,11), output = (28+dx,10).
       ω0 = 1/√(R1R2C1C2), Q = √(R1R2C1C2)/(C2(R1+R2)) with C1 = feedback capacitor, C2 = capacitor to ground (equal R: Q = ½√(C1/C2)) */
    const skStage = (dx, r1, r2, c1, c2, m, n) => flat(
      R(6 + dx, 11, 10 + dx, 11, r1, 'R1' + n), W(10 + dx, 11, 12 + dx, 11), R(12 + dx, 11, 16 + dx, 11, r2, 'R2' + n), W(16 + dx, 11, 22 + dx, 11),
      W(10 + dx, 11, 10 + dx, 3, 12 + dx, 3), C(12 + dx, 3, 16 + dx, 3, c1, 'C1' + n), W(16 + dx, 3, 28 + dx, 3, 28 + dx, 5), W(18 + dx, 11, 18 + dx, 13), C(18 + dx, 13, 18 + dx, 17, c2, 'C2' + n), G(18 + dx, 17),
      OP(24 + dx, 10, 'U' + (n || 1), { m }), W(22 + dx, 9, 20 + dx, 9, 20 + dx, 5, 28 + dx, 5, 28 + dx, 10), W(26 + dx, 10, 28 + dx, 10));
    P.sallen = (o = {}) => { const { r1 = 10e3, r2 = 10e3, c1 = 22.5e-9, c2 = 11.25e-9, m = 'ideal', w = 'sin', amp = 1, f = 1000, rl = 10e3 } = o; return flat(
      V(3, 11, 3, 15, 'Vin', w, amp, f, 0), G(3, 15), W(3, 11, 6, 11), skStage(0, r1, r2, c1, c2, m, ''), W(28, 10, 34, 10), load(34, 10, rl),
      PR(34, 10, 'Vo', { side: 'r' }), PR(3, 11, 'Vi', { side: 'l' })); };
    /* 4th-order Butterworth low-pass (fc = 1 kHz) = two Sallen–Key stages with Q = 0.5412 and 1.3066 */
    P.butter4 = (o = {}) => { const { r = 10e3, f0 = 1000, m = 'ideal', w = 'sin', amp = 1, f = 1000, rl = null } = o; const w0 = 2 * Math.PI * f0; const st = (Q) => [2 * Q / (w0 * r), 1 / (2 * Q * w0 * r)]; const [a1, a2] = st(0.5412), [b1, b2] = st(1.3066); return flat(
      V(3, 11, 3, 15, 'Vin', w, amp, f, 0), G(3, 15), W(3, 11, 6, 11), skStage(0, r, r, a1, a2, m, 'a'), W(28, 10, 30, 10, 30, 11), skStage(24, r, r, b1, b2, m, 'b'), W(52, 10, 54, 10), load(54, 10, rl),
      PR(28, 10, 'V1', { side: 't' }), PR(54, 10, 'Vo', { side: 'r' }), PR(3, 11, 'Vi', { side: 'l' }), T(14, 19, 'ภาค 1 · Q = 0.541', { small: true, side: 'c' }), T(38, 19, 'ภาค 2 · Q = 1.307', { small: true, side: 'c' })); };
    /* multiple-feedback band-pass (C1 = C2 = C): ω0² = (R1+R2)/(R1R2R3C²), Q = ω0R3C/2, peak gain −R3/(2R1) */
    P.mfb = (o = {}) => { const { r1 = 39.79e3, r2 = 1.658e3, r3 = 159.15e3, c = 10e-9, m = 'ideal', w = 'sin', amp = 0.5, f = 1000, rl = 10e3 } = o; return flat(
      V(3, 9, 3, 13, 'Vin', w, amp, f, 0), G(3, 13), W(3, 9, 6, 9), R(6, 9, 10, 9, r1, 'R1'), W(10, 9, 14, 9), C(14, 9, 18, 9, c, 'C1'), W(18, 9, 22, 9),
      W(14, 9, 14, 13), R(14, 13, 14, 17, r2, 'R2'), G(14, 17), W(20, 9, 20, 5, 22, 5), R(22, 5, 26, 5, r3, 'R3'), W(26, 5, 30, 5, 30, 10),
      W(14, 9, 14, 3, 16, 3), C(16, 3, 20, 3, c, 'C2'), W(20, 3, 32, 3, 32, 10),
      OP(24, 10, 'U1', { m }), W(22, 11, 22, 13), G(22, 13), W(26, 10, 36, 10), load(36, 10, rl),
      PR(36, 10, 'Vo', { side: 'r' }), PR(3, 9, 'Vi', { side: 'l' })); };
    /* Tow–Thomas biquad built like an analog computer: lossy summing integrator → integrator → inverter, fed back. LP: Vb/u = +ω0²/(s²+(ω0/Q)s+ω0²), Vc = −Vb, Va = band-pass; ω0 = 1/(RC), Q = Rq/R */
    P.tow = (o = {}) => { const { r = 10e3, c = 100e-9, rq = 25e3, ic1 = 0, ic2 = 0, w = 'step', amp = 1, f = 20, off = 0, m = 'ideal' } = o; return flat(
      V(2, 11, 2, 15, 'u', w, amp, f, off), G(2, 15), W(2, 11, 4, 11), R(4, 11, 8, 11, r, 'Ru', { lp: -1 }), W(8, 11, 10, 11), R(4, 9, 8, 9, r, 'Rfb'),
      W(8, 11, 8, rq ? 4 : 7), W(8, 7, 10, 7), C(10, 7, 14, 7, c, 'C1', { ic: ic1 }), W(14, 7, 17, 7, 17, 12),
      rq ? [W(8, 4, 10, 4), R(10, 4, 14, 4, rq, 'Rq'), W(14, 4, 17, 4, 17, 7)] : [],
      OP(12, 12, 'U1', { m, hideVal: true }), G(10, 13), W(14, 12, 18, 12, 18, 11, 20, 11),
      R(20, 11, 24, 11, r, 'R2'), W(24, 11, 26, 11), W(24, 11, 24, 7, 26, 7), C(26, 7, 30, 7, c, 'C2', { ic: ic2 }), W(30, 7, 33, 7, 33, 12),
      OP(28, 12, 'U2', { m, hideVal: true }), G(26, 13), W(30, 12, 34, 12, 34, 11, 36, 11),
      R(36, 11, 40, 11, r, 'R3'), W(40, 11, 42, 11), W(40, 11, 40, 7, 42, 7), R(42, 7, 46, 7, r, 'R4'), W(46, 7, 49, 7, 49, 12),
      OP(44, 12, 'U3', { m, hideVal: true }), G(42, 13), W(46, 12, 52, 12),
      W(4, 9, 3, 9, 3, 2, 52, 2, 52, 12),
      PR(14, 12, 'Va', { side: 'b' }), PR(30, 12, 'Vb', { side: 'b' }), PR(52, 12, 'Vc', { side: 'r' }),
      T(12, 17, 'U1 ตัวรวม + อินทิเกรต', { small: true, side: 'c' }), T(28, 17, 'U2 อินทิเกรต', { small: true, side: 'c' }), T(44, 17, 'U3 ตัวกลับเฟส (−1)', { small: true, side: 'c' }),
      T(27, 1, 'ป้อนกลับ Vc → ตัวรวม', { small: true, side: 't' })); };
    /* open-loop comparator with a reference */
    P.comparator = (o = {}) => { const { m = 'generic', vref = 0.5, amp = 1.5, f = 1000, rl = 10e3 } = o; return flat(
      V(6, 6, 2, 6, 'Vref', 'dc', vref, 1000, 0), G(2, 6), W(6, 6, 16, 6, 16, 9, 18, 9),
      V(6, 11, 2, 11, 'Vin', 'sin', amp, f, 0), G(2, 11), W(6, 11, 18, 11), OP(20, 10, 'U1', { m }), W(22, 10, 30, 10), load(30, 10, rl),
      PR(30, 10, 'Vo', { side: 'r' })); };
    /* inverting Schmitt trigger: thresholds ±Vsat·R2/(R1+R2) */
    P.schmitt = (o = {}) => { const { r1 = 100e3, r2 = 10e3, m = 'generic', amp = 3, f = 1000, rl = null } = o; return flat(
      V(3, 13, 3, 17, 'Vin', 'sin', amp, f, 0), G(3, 17), W(3, 13, 16, 13, 16, 11, 18, 11), OP(20, 10, 'U1', { m, flip: true }),
      W(18, 9, 16, 9), W(16, 9, 14, 9), R(10, 9, 14, 9, r2, 'R2'), G(10, 9), W(16, 9, 16, 5, 18, 5), R(18, 5, 22, 5, r1, 'R1'), W(22, 5, 26, 5, 26, 10),
      W(22, 10, 30, 10), load(30, 10, rl), PR(30, 10, 'Vo', { side: 'r' }), PR(3, 13, 'Vi', { side: 'l' })); };
    /* half-wave precision rectifier: diode inside the feedback loop */
    P.rectifier = (o = {}) => { const { m = 'generic', amp = 2, f = 1000, rl = 10e3 } = o; return flat(
      V(3, 11, 3, 15, 'Vin', 'sin', amp, f, 0), G(3, 15), W(3, 11, 18, 11), OP(20, 10, 'U1', { m }), W(22, 10, 24, 10), D(24, 10, 28, 10, 'D1'), W(28, 10, 32, 10),
      W(18, 9, 16, 9, 16, 5, 30, 5, 30, 10), load(32, 10, rl), PR(32, 10, 'Vo', { side: 'r' }), PR(22, 10, 'Vx', { side: 't' }), PR(3, 11, 'Vi', { side: 'l' })); };
    P.blank = () => [];

    /* menu for the lab: mode = initial analysis; tEnd/fmin/fmax = sensible ranges */
    const PRESETS = [
      { k: 'inverting', g: 'วงจรพื้นฐาน', name: 'ขยายแบบกลับเฟส (Inverting) Av = −10', f: () => P.inverting(), mode: 'tran' },
      { k: 'noninverting', g: 'วงจรพื้นฐาน', name: 'ขยายแบบไม่กลับเฟส (Non-inverting) Av = 11', f: () => P.noninverting(), mode: 'tran' },
      { k: 'follower', g: 'วงจรพื้นฐาน', name: 'บัฟเฟอร์ (Voltage follower)', f: () => P.follower(), mode: 'tran' },
      { k: 'summer', g: 'วงจรพื้นฐาน', name: 'วงจรบวก (Summing amplifier)', f: () => P.summer(), mode: 'tran' },
      { k: 'diffamp', g: 'วงจรพื้นฐาน', name: 'ขยายผลต่าง (Difference amplifier)', f: () => P.diffamp(), mode: 'tran' },
      { k: 'inamp', g: 'วงจรพื้นฐาน', name: 'Instrumentation amplifier 3 ออปแอมป์', f: () => P.inamp(), mode: 'tran' },
      { k: 'integrator', g: 'ประมวลผลสัญญาณ', name: 'อินทิเกรเตอร์ (Integrator)', f: () => P.integrator(), mode: 'tran' },
      { k: 'differentiator', g: 'ประมวลผลสัญญาณ', name: 'ดิฟเฟอเรนเชียเตอร์ (Differentiator)', f: () => P.differentiator(), mode: 'tran' },
      { k: 'lpf1', g: 'ประมวลผลสัญญาณ', name: 'ตัวกรองผ่านต่ำอันดับ 1 (fc ≈ 1.6 kHz)', f: () => P.lpf1(), mode: 'ac', fmin: 10, fmax: 1e5 },
      { k: 'hpf1', g: 'ประมวลผลสัญญาณ', name: 'ตัวกรองผ่านสูงอันดับ 1 (fc ≈ 1.6 kHz)', f: () => P.hpf1(), mode: 'ac', fmin: 10, fmax: 1e5 },
      { k: 'sallen', g: 'ประมวลผลสัญญาณ', name: 'Sallen–Key ผ่านต่ำอันดับ 2 (Butterworth 1 kHz)', f: () => P.sallen(), mode: 'ac', fmin: 10, fmax: 1e5 },
      { k: 'butter4', g: 'ประมวลผลสัญญาณ', name: 'Butterworth อันดับ 4 (Sallen–Key 2 ภาคต่อกัน, 1 kHz)', f: () => P.butter4(), mode: 'ac', fmin: 10, fmax: 1e5 },
      { k: 'mfb', g: 'ประมวลผลสัญญาณ', name: 'ผ่านแถบความถี่ MFB (1 kHz, Q = 5)', f: () => P.mfb(), mode: 'ac', fmin: 100, fmax: 1e4 },
      { k: 'pi', g: 'ประมวลผลสัญญาณ', name: 'ตัวควบคุม PI (op-amp)', f: () => P.pi(), mode: 'tran' },
      { k: 'tia', g: 'ประมวลผลสัญญาณ', name: 'ตัวขยายทรานส์อิมพีแดนซ์ (กระแส → แรงดัน)', f: () => P.tia(), mode: 'tran' },
      { k: 'tow', g: 'อนาล็อกคอมพิวเตอร์', name: 'แก้สมการอันดับสอง ẍ + 2ζω ẋ + ω²x = ω²u (Tow–Thomas)', f: () => P.tow(), mode: 'tran', tEnd: 0.04 },
      { k: 'osc', g: 'อนาล็อกคอมพิวเตอร์', name: 'ออสซิลเลเตอร์ไซน์: ẍ = −ω²x มีเงื่อนไขเริ่มต้น', f: () => P.tow({ rq: null, ic2: -1, w: 'dc', amp: 0 }), mode: 'tran', tEnd: 0.03 },
      { k: 'gbw', g: 'ข้อจำกัดจริง', name: 'GBW จำกัดแบนด์วิดท์: µA741 ไม่กลับเฟสเกน 100', f: () => P.noninverting({ m: '741', rg: 1e3, rf: 99e3, amp: 0.05 }), mode: 'ac', fmin: 10, fmax: 1e7 },
      { k: 'slew', g: 'ข้อจำกัดจริง', name: 'Slew rate: บัฟเฟอร์ µA741 รับสัญญาณใหญ่ 50 kHz', f: () => P.follower({ m: '741', amp: 10, f: 50e3 }), mode: 'tran' },
      { k: 'comparator', g: 'ไม่เชิงเส้น', name: 'คอมพาเรเตอร์ (วงเปิด) อิ่มตัวที่ขอบแหล่งจ่าย', f: () => P.comparator(), mode: 'tran' },
      { k: 'schmitt', g: 'ไม่เชิงเส้น', name: 'Schmitt trigger (ฮิสเทอรีซิส)', f: () => P.schmitt(), mode: 'tran' },
      { k: 'rectifier', g: 'ไม่เชิงเส้น', name: 'วงจรเรียงกระแสแม่นยำครึ่งคลื่น', f: () => P.rectifier(), mode: 'tran' },
      { k: 'blank', g: 'เริ่มเอง', name: 'กระดานว่าง', f: () => P.blank(), mode: 'dc' }
    ];
    return { P, PRESETS, mk, R, L, C, D, V, I, VM, OP, PR, G, T, W, flat };
  })();

  return { OAE: { parseSI, fmtSI, TYPES, TWO, WAVES, OPM, opParams, opPins, key, buildNodes, solveDC, solveTran, autoTime, lusolve, wave, dcLevel, isPeriodic,
    listOutputs, listInputs, transferFunctions, acSweep, acSetup, acPoint, analyzeTF, evalTF, tfTeX, pzTeX, polyTeX, numTeX, polyRoots, expandRoots, RON }, OK };
});
