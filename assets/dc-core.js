/* DC circuits (lesson 25): circuit engine (MNA, DC + trapezoidal transient), circuit builders and schematic renderer.
   Used by /learn/dc-circuits/ together with dc-lab.js and dc-lesson.js. Tokens are read from the .dcx element. */
const DCROOT = () => document.querySelector(".dcx") || document.documentElement;
/* ===== DC circuit engine: node extraction + Modified Nodal Analysis (MNA) =====
   Conventions (every two-terminal element):
   end a = (x1,y1), end b = (x2,y2);  v = V(a) − V(b);  i = current from a to b through the element
   p = v·i  is power ABSORBED (passive sign convention).  Sources: '+' terminal is end a.
   Current source: arrow a→b (current leaves the source at end b).                                   */
const DCE = (() => {
  const PFX = { p: -12, n: -9, u: -6, 'µ': -6, 'μ': -6, m: -3, '': 0, k: 3, K: 3, M: 6, G: 9, R: 0 };
  const sc = (num, p) => parseFloat((Number(num) * Math.pow(10, PFX[p])).toPrecision(14));
  function parseSI(s) {
    if (typeof s === 'number') return s;
    s = String(s).trim().replace(/,/g, '').replace(/\s+/g, '');
    s = s.replace(/(ohm|Ω|V|A|F|H|S|W)$/i, (m) => (m.toLowerCase() === 'ohm' || m === 'Ω' ? '' : m));
    let m = s.match(/^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)([pnuµμmkKMG]?)(?:V|A|F|H|S|W)?$/);
    if (m) return sc(m[1], m[2]);
    m = s.match(/^(\d+)([pnuµμmkKMGR])(\d+)$/); // 4k7, 2R2 style
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
  const TYPES = {
    R: { name: 'ตัวต้านทาน', unit: 'Ω', pre: 'R', def: 1000 },
    L: { name: 'ตัวเหนี่ยวนำ', unit: 'H', pre: 'L', def: 0.01 },
    C: { name: 'ตัวเก็บประจุ', unit: 'F', pre: 'C', def: 1e-6 },
    V: { name: 'แหล่งจ่ายแรงดัน', unit: 'V', pre: 'V', def: 10 },
    I: { name: 'แหล่งจ่ายกระแส', unit: 'A', pre: 'I', def: 0.01 },
    A: { name: 'แอมมิเตอร์', unit: '', pre: 'AM', def: 0 },
    VM: { name: 'โวลต์มิเตอร์', unit: '', pre: 'VM', def: 0 },
    E: { name: 'VCVS แหล่งแรงดันควบคุมด้วยแรงดัน', unit: 'V/V', pre: 'E', def: 2, ctrl: 'v' },
    Gd: { name: 'VCCS แหล่งกระแสควบคุมด้วยแรงดัน', unit: 'A/V', pre: 'G', def: 0.01, ctrl: 'v' },
    H: { name: 'CCVS แหล่งแรงดันควบคุมด้วยกระแส', unit: 'V/A', pre: 'H', def: 10, ctrl: 'i' },
    F: { name: 'CCCS แหล่งกระแสควบคุมด้วยกระแส', unit: 'A/A', pre: 'F', def: 2, ctrl: 'i' },
    W: { name: 'สายไฟ' }, G: { name: 'กราวด์ (0 V)' }, T: { name: 'ป้ายข้อความ' }
  };
  const TWO = new Set(['R', 'L', 'C', 'V', 'I', 'A', 'VM', 'E', 'Gd', 'H', 'F']);
  const key = (x, y) => x + ',' + y;

  function buildNodes(comps) {
    const parent = new Map();
    const find = (k) => { if (!parent.has(k)) parent.set(k, k); let r = k; while (parent.get(r) !== r) r = parent.get(r); while (parent.get(k) !== r) { const n = parent.get(k); parent.set(k, r); k = n; } return r; };
    const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
    let hasGround = false;
    for (const c of comps) {
      if (c.t === 'W') {
        const k1 = key(c.x1, c.y1);
        if (c.x1 === c.x2 || c.y1 === c.y2) {
          const dx = Math.sign(c.x2 - c.x1), dy = Math.sign(c.y2 - c.y1);
          let x = c.x1, y = c.y1; find(k1);
          while (x !== c.x2 || y !== c.y2) { x += dx; y += dy; union(k1, key(x, y)); }
        } else union(k1, key(c.x2, c.y2));
      } else if (c.t === 'G') { union(key(c.x1, c.y1), 'GND'); hasGround = true; }
      else if (TWO.has(c.t)) { find(key(c.x1, c.y1)); find(key(c.x2, c.y2)); }
    }
    const elems = comps.filter((c) => TWO.has(c.t));
    // reference node
    let refRoot = null, autoRef = false;
    if (hasGround) refRoot = find('GND');
    else if (elems.length) {
      const src = elems.find((e) => e.t === 'V') || elems[0];
      refRoot = find(key(src.x2, src.y2)); autoRef = true;
    }
    const idx = new Map(); let n = 0;
    const order = [];
    for (const e of elems) for (const k of [key(e.x1, e.y1), key(e.x2, e.y2)]) {
      const r = find(k);
      if (r === refRoot) continue;
      if (!idx.has(r)) { idx.set(r, n++); order.push(k); }
    }
    const nodeOfKey = (k) => { if (!parent.has(k)) return undefined; const r = find(k); if (r === refRoot) return -1; return idx.has(r) ? idx.get(r) : undefined; };
    return { n, find, nodeOfKey, elems, hasGround, autoRef, order, refRoot };
  }

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

  const GMIN = 1e-12;
  // mode: 'dc' | 'tran' | 'init'
  function assemble(net, mode, st) {
    const { n, nodeOfKey, elems } = net;
    const nodes = elems.map((e) => [nodeOfKey(key(e.x1, e.y1)), nodeOfKey(key(e.x2, e.y2))]);
    const byId = new Map(elems.map((e, i) => [e.id, i]));
    // branch variables
    const br = new Map(); let nb = 0; const brLabel = [];
    elems.forEach((e, i) => {
      const t = e.t;
      if (t === 'V' || t === 'A' || t === 'E' || t === 'H' || (t === 'L' && mode === 'dc') || (t === 'C' && mode === 'init')) { br.set(i, n + nb); nb++; brLabel.push(e); }
    });
    const N = n + nb;
    const A = Array.from({ length: N }, () => new Array(N).fill(0));
    const z = new Array(N).fill(0);
    const add = (r, c, v) => { if (r >= 0 && c >= 0) A[r][c] += v; };
    const addz = (r, v) => { if (r >= 0) z[r] += v; };
    const cond = (a, b, g) => { add(a, a, g); add(b, b, g); add(a, b, -g); add(b, a, -g); };
    for (let k = 0; k < n; k++) A[k][k] += GMIN;
    const errs = [];
    elems.forEach((e, i) => {
      const [a, b] = nodes[i]; const v = +e.v;
      switch (e.t) {
        case 'R': if (!(v > 0)) errs.push(e.lab + ': ค่าความต้านทานต้องมากกว่า 0'); else cond(a, b, 1 / v); break;
        case 'C':
          if (mode === 'tran') { const s = st.C.get(e.id); cond(a, b, s.G); addz(a, s.Ieq); addz(b, -s.Ieq); }
          else if (mode === 'init') { const k = br.get(i); add(a, k, 1); add(b, k, -1); add(k, a, 1); add(k, b, -1); z[k] = st.C.get(e.id).v; }
          break;
        case 'L':
          if (mode === 'dc') { const k = br.get(i); add(a, k, 1); add(b, k, -1); add(k, a, 1); add(k, b, -1); }
          else if (mode === 'tran') { const s = st.L.get(e.id); cond(a, b, s.G); addz(a, -s.J); addz(b, s.J); }
          else { const s = st.L.get(e.id); addz(a, -s.i); addz(b, s.i); }
          break;
        case 'V': case 'A': { const k = br.get(i); add(a, k, 1); add(b, k, -1); add(k, a, 1); add(k, b, -1); z[k] = e.t === 'V' ? v : 0; break; }
        case 'I': addz(a, -v); addz(b, v); break;
        case 'VM': break;
        case 'E': case 'Gd': case 'H': case 'F': {
          const ci = byId.get(e.ctrl);
          if (ci === undefined) { errs.push(e.lab + ': ยังไม่ได้เลือกองค์ประกอบที่ใช้ควบคุม'); break; }
          const [ca, cb] = nodes[ci];
          if (e.t === 'E' || e.t === 'H') {
            const k = br.get(i); add(a, k, 1); add(b, k, -1); add(k, a, 1); add(k, b, -1);
            if (e.t === 'E') { add(k, ca, -v); add(k, cb, v); }
            else { const kc = br.get(ci); if (kc === undefined || !(elems[ci].t === 'V' || elems[ci].t === 'A')) { errs.push(e.lab + ': ตัวควบคุมกระแสต้องเป็นแอมมิเตอร์หรือแหล่งจ่ายแรงดัน'); break; } add(k, kc, -v); }
          } else if (e.t === 'Gd') { add(a, ca, v); add(a, cb, -v); add(b, ca, -v); add(b, cb, v); }
          else { const kc = br.get(ci); if (kc === undefined || !(elems[ci].t === 'V' || elems[ci].t === 'A')) { errs.push(e.lab + ': ตัวควบคุมกระแสต้องเป็นแอมมิเตอร์หรือแหล่งจ่ายแรงดัน'); break; } add(a, kc, v); add(b, kc, -v); }
          break;
        }
      }
    });
    return { A, z, N, n, nb, br, brLabel, nodes, errs };
  }

  function elemResults(net, sys, x, mode, st) {
    const { elems } = net; const out = {};
    const V = (k) => (k >= 0 ? x[k] : 0);
    elems.forEach((e, i) => {
      const [a, b] = sys.nodes[i]; const va = V(a), vb = V(b); const v = va - vb;
      let cur = 0;
      switch (e.t) {
        case 'R': cur = v / e.v; break;
        case 'C': cur = mode === 'tran' ? st.C.get(e.id).G * v - st.C.get(e.id).Ieq : mode === 'init' ? x[sys.br.get(i)] : 0; break;
        case 'L': cur = mode === 'dc' ? x[sys.br.get(i)] : mode === 'tran' ? st.L.get(e.id).G * v + st.L.get(e.id).J : st.L.get(e.id).i; break;
        case 'V': case 'A': case 'E': case 'H': cur = x[sys.br.get(i)]; break;
        case 'I': cur = +e.v; break;
        case 'VM': cur = 0; break;
        case 'Gd': { const ci = elems.findIndex((q) => q.id === e.ctrl); const [ca, cb] = sys.nodes[ci]; cur = e.v * (V(ca) - V(cb)); break; }
        case 'F': { const ci = elems.findIndex((q) => q.id === e.ctrl); cur = e.v * x[sys.br.get(ci)]; break; }
      }
      if (Math.abs(cur) < 1e-10) cur = 0;
      out[e.id] = { v, i: cur, p: v * cur, va, vb };
    });
    return out;
  }

  function connectivity(net) {
    // nodes reachable from reference through elements
    const { n, elems, nodeOfKey } = net; const adj = Array.from({ length: n + 1 }, () => []);
    const id = (k) => (k < 0 ? n : k);
    for (const e of elems) { const a = id(nodeOfKey(key(e.x1, e.y1))), b = id(nodeOfKey(key(e.x2, e.y2))); adj[a].push(b); adj[b].push(a); }
    const seen = new Array(n + 1).fill(false); const q = [n]; seen[n] = true;
    while (q.length) { const u = q.pop(); for (const w of adj[u]) if (!seen[w]) { seen[w] = true; q.push(w); } }
    return seen.slice(0, n).every(Boolean);
  }

  function solveDC(comps) {
    const net = buildNodes(comps);
    const res = { ok: false, warnings: [], net };
    if (!net.elems.length) { res.err = 'ยังไม่มีองค์ประกอบในวงจร'; return res; }
    if (net.autoRef) res.warnings.push('ยังไม่ได้วางกราวด์ จึงใช้ขั้วลบของ ' + (net.elems.find((e) => e.t === 'V') || net.elems[0]).lab + ' เป็นจุดอ้างอิง 0 V');
    if (!connectivity(net)) res.warnings.push('มีบางส่วนของวงจรไม่ได้ต่อถึงจุดอ้างอิง (ลอยอยู่) ค่าแรงดันของส่วนนั้นจึงไม่มีความหมาย');
    const sys = assemble(net, 'dc');
    if (sys.errs.length) { res.err = sys.errs.join(' · '); return res; }
    const x = lusolve(sys.A, sys.z);
    if (!x) { res.err = 'แก้สมการไม่ได้ (เมทริกซ์เอกฐาน): มักเกิดจากแหล่งจ่ายแรงดัน/ตัวเหนี่ยวนำ/แอมมิเตอร์ต่อกันเป็นลูปปิดโดยไม่มีความต้านทาน หรือแหล่งจ่ายแรงดันสองตัวขนานกัน'; res.sys = sys; return res; }
    const big = x.slice(0, net.n).some((v) => Math.abs(v) > 1e7);
    if (big) res.warnings.push('แรงดันบางโหนดสูงผิดปกติ: มักเกิดจากแหล่งจ่ายกระแสที่ไม่มีทางให้กระแสไหล (ต่อกับวงจรเปิด หรือกับตัวเก็บประจุซึ่งเปิดวงจรในสภาวะ DC)');
    res.ok = true; res.x = x; res.sys = sys;
    res.nodeV = x.slice(0, net.n);
    res.elem = elemResults(net, sys, x, 'dc');
    let pa = 0, ps = 0; for (const k in res.elem) { const p = res.elem[k].p; if (p > 0) pa += p; else ps -= p; }
    res.pAbs = pa; res.pSup = ps;
    return res;
  }

  function autoTime(comps) {
    const Rs = comps.filter((c) => c.t === 'R').map((c) => +c.v).filter((v) => v > 0);
    const Rg = Rs.length ? Math.exp(Rs.reduce((s, v) => s + Math.log(v), 0) / Rs.length) : 1;
    const Ls = comps.filter((c) => c.t === 'L').map((c) => +c.v), Cs = comps.filter((c) => c.t === 'C').map((c) => +c.v);
    let T = 0;
    for (const C of Cs) T = Math.max(T, C * Rg);
    for (const L of Ls) T = Math.max(T, L / Rg);
    if (Ls.length && Cs.length) T = Math.max(T, 2 * Math.PI * Math.sqrt(Math.max(...Ls) * Math.max(...Cs)) * 0.8);
    return T > 0 ? 6 * T : 1e-3;
  }

  function solveTran(comps, tEnd, steps = 2000, keep = 500) {
    const net = buildNodes(comps);
    const res = { ok: false, warnings: [] };
    if (!net.elems.length) { res.err = 'ยังไม่มีองค์ประกอบในวงจร'; return res; }
    const h = tEnd / steps;
    const st = { C: new Map(), L: new Map() };
    for (const e of net.elems) { if (e.t === 'C') st.C.set(e.id, { v: 0, i: 0, G: 0, Ieq: 0 }); if (e.t === 'L') st.L.set(e.id, { i: 0, v: 0, G: 0, J: 0 }); }
    const T = [], NV = [], EL = {}; for (const e of net.elems) EL[e.id] = { v: [], i: [] };
    const record = (t, x, er) => { T.push(t); NV.push(x.slice(0, net.n)); for (const k in er) { EL[k].v.push(er[k].v); EL[k].i.push(er[k].i); } };
    // t = 0+ : capacitors as voltage sources (v=0), inductors as current sources (i=0)
    let useTR = false;
    {
      const sys = assemble(net, 'init', st);
      if (sys.errs.length) { res.err = sys.errs.join(' · '); return res; }
      const x = lusolve(sys.A, sys.z);
      if (x) {
        const er = elemResults(net, sys, x, 'init', st);
        for (const e of net.elems) { if (e.t === 'C') st.C.get(e.id).i = er[e.id].i; if (e.t === 'L') st.L.get(e.id).v = er[e.id].v; }
        record(0, x, er); useTR = true;
      } else {
        const z0 = new Array(net.n).fill(0); const er = {}; for (const e of net.elems) er[e.id] = { v: 0, i: 0 }; record(0, z0, er);
      }
    }
    const every = Math.max(1, Math.round(steps / keep));
    for (let s = 1; s <= steps; s++) {
      const tr = useTR || s > 1;
      for (const e of net.elems) {
        if (e.t === 'C') { const c = st.C.get(e.id); if (tr) { c.G = 2 * e.v / h; c.Ieq = c.G * c.v + c.i; } else { c.G = e.v / h; c.Ieq = c.G * c.v; } }
        if (e.t === 'L') { const l = st.L.get(e.id); if (tr) { l.G = h / (2 * e.v); l.J = l.i + l.G * l.v; } else { l.G = h / e.v; l.J = l.i; } }
      }
      const sys = assemble(net, 'tran', st);
      if (sys.errs.length) { res.err = sys.errs.join(' · '); return res; }
      const x = lusolve(sys.A, sys.z);
      if (!x) { res.err = 'แก้สมการไม่ได้ในขั้นเวลา t = ' + fmtSI(s * h, 's') + ' (ตรวจลูปของแหล่งจ่ายแรงดัน/แอมมิเตอร์)'; return res; }
      const er = elemResults(net, sys, x, 'tran', st);
      for (const e of net.elems) {
        if (e.t === 'C') { const c = st.C.get(e.id); c.v = er[e.id].v; c.i = er[e.id].i; }
        if (e.t === 'L') { const l = st.L.get(e.id); l.v = er[e.id].v; l.i = er[e.id].i; }
      }
      if (s % every === 0 || s === steps) record(s * h, x, er);
    }
    res.ok = true; res.t = T; res.nodeV = NV; res.el = EL; res.net = net; res.h = h; res.tEnd = tEnd;
    return res;
  }

  return { parseSI, fmtSI, TYPES, TWO, key, buildNodes, solveDC, solveTran, autoTime, lusolve };
})();

/* ===== Circuit builders: presets for the lab, figures for lessons & problems ===== */
const CK = (() => {
  let uid = 0;
  const mk = (t, x1, y1, x2, y2, v, lab, o) => Object.assign({ id: 'k' + (++uid), t, x1, y1, x2, y2, v, lab }, o || {});
  const R = (x1, y1, x2, y2, v, lab, o) => mk('R', x1, y1, x2, y2, v, lab, o);
  const L = (x1, y1, x2, y2, v, lab, o) => mk('L', x1, y1, x2, y2, v, lab, o);
  const C = (x1, y1, x2, y2, v, lab, o) => mk('C', x1, y1, x2, y2, v, lab, o);
  const V = (x1, y1, x2, y2, v, lab, o) => mk('V', x1, y1, x2, y2, v, lab, o);
  const I = (x1, y1, x2, y2, v, lab, o) => mk('I', x1, y1, x2, y2, v, lab, o);
  const AM = (x1, y1, x2, y2, lab, o) => mk('A', x1, y1, x2, y2, 0, lab, o);
  const VM = (x1, y1, x2, y2, lab, o) => mk('VM', x1, y1, x2, y2, 0, lab, o);
  const DEP = (t, x1, y1, x2, y2, v, lab, ctrl, o) => mk(t, x1, y1, x2, y2, v, lab, Object.assign({ ctrl: ctrl.id }, o || {}));
  const G = (x, y) => mk('G', x, y, x, y);
  const T = (x, y, text, o) => mk('T', x, y, x, y, 0, text, o);
  const W = (...p) => { const out = []; for (let i = 0; i + 3 < p.length; i += 2) out.push(mk('W', p[i], p[i + 1], p[i + 2], p[i + 3])); return out; };
  const flat = (...a) => a.flat(3);

  // Source on the left + series R + node "a" + two shunt branches (used by many figures)
  function srcSeries2Shunt({ Vs, R1, R2, R3, lab1 = 'R1', lab2 = 'R2', lab3 = 'R3', third = 'R', thirdVal, terminals = false }) {
    const parts = [V(3, 7, 3, 11, Vs, 'Vs'), W(3, 7, 3, 4, 5, 4), R(5, 4, 9, 4, R1, lab1), W(9, 4, 16, 4),
      R(11, 6, 11, 10, R2, lab2), W(11, 4, 11, 6), W(11, 10, 11, 13), W(16, 4, 16, 6), W(16, 10, 16, 13), W(3, 11, 3, 13, 16, 13), G(7, 13)];
    if (third === 'R') parts.push(R(16, 6, 16, 10, R3, lab3));
    if (third === 'Iup') parts.push(I(16, 10, 16, 6, thirdVal, lab3));
    return flat(parts);
  }

  const P = {};
  P.divider = (Vs = 10, r1 = 10e3, r2 = 10e3, rl = 10e3) => flat(
    V(3, 7, 3, 11, Vs, 'Vs'), W(3, 7, 3, 4, 7, 4), R(7, 4, 11, 4, r1, 'R1'), W(11, 4, 23, 4),
    R(13, 6, 13, 10, r2, 'R2'), W(13, 4, 13, 6), W(13, 10, 13, 13),
    R(18, 6, 18, 10, rl, 'RL'), W(18, 4, 18, 6), W(18, 10, 18, 13),
    VM(23, 6, 23, 10, 'VM1'), W(23, 4, 23, 6), W(23, 10, 23, 13),
    W(3, 11, 3, 13, 23, 13), G(8, 13));
  P.wheatstone = (Vs = 10, r1 = 100, r2 = 200, r3 = 150, rx = 330) => flat(
    V(3, 7, 3, 11, Vs, 'Vs'), W(3, 7, 3, 2, 18, 2), W(10, 2, 10, 4), W(18, 2, 18, 4),
    R(10, 4, 10, 8, r1, 'R1'), W(10, 8, 10, 10), R(10, 10, 10, 14, r2, 'R2'),
    R(18, 4, 18, 8, r3, 'R3', { lp: -1 }), W(18, 8, 18, 10), R(18, 10, 18, 14, rx, 'Rx', { lp: -1 }),
    VM(12, 9, 16, 9, 'VM1'), W(10, 9, 12, 9), W(16, 9, 18, 9),
    W(10, 14, 10, 16), W(18, 14, 18, 16), W(3, 11, 3, 16, 18, 16), G(6, 16),
    T(9, 9, 'a', { side: 'l' }), T(19, 9, 'b', { side: 'r' }));
  P.twoNode = (Vs = 12, Ra = 2, Rb = 8, Rc = 4, Rd = 2, Is = 1) => flat(
    V(3, 7, 3, 11, Vs, 'Vs'), W(3, 7, 3, 4, 5, 4), R(5, 4, 9, 4, Ra, 'R1'), W(9, 4, 15, 4),
    R(11, 6, 11, 10, Rb, 'R2'), W(11, 4, 11, 6), W(11, 10, 11, 13),
    R(15, 4, 19, 4, Rc, 'R3'), W(19, 4, 25, 4),
    R(21, 6, 21, 10, Rd, 'R4'), W(21, 4, 21, 6), W(21, 10, 21, 13),
    I(25, 10, 25, 6, Is, 'Is'), W(25, 4, 25, 6), W(25, 10, 25, 13),
    W(3, 11, 3, 13, 25, 13), G(7, 13), T(11, 3, 'V₁', { side: 't' }), T(21, 3, 'V₂', { side: 't' }));
  P.mesh = (V1 = 8, R1 = 2, R3 = 4, R2 = 2, V2 = 2) => flat(
    V(3, 7, 3, 11, V1, 'V1'), W(3, 7, 3, 4, 5, 4), R(5, 4, 9, 4, R1, 'R1'), W(9, 4, 15, 4),
    R(12, 6, 12, 10, R3, 'R3'), W(12, 4, 12, 6), W(12, 10, 12, 13),
    R(15, 4, 19, 4, R2, 'R2'), W(19, 4, 21, 4, 21, 7), V(21, 7, 21, 11, V2, 'V2', { lp: -1 }),
    W(21, 11, 21, 13, 3, 13, 3, 11), G(7, 13), T(7.5, 8.6, 'I₁ ↻', { side: 'c' }), T(16.5, 8.6, 'I₂ ↻', { side: 'c' }));
  P.rc = (Vs = 10, r = 10e3, c = 100e-6) => flat(
    V(3, 7, 3, 11, Vs, 'Vs'), W(3, 7, 3, 4, 6, 4), R(6, 4, 10, 4, r, 'R1'), W(10, 4, 13, 4, 13, 6),
    C(13, 6, 13, 10, c, 'C1'), W(13, 10, 13, 13, 3, 13, 3, 11), G(8, 13));
  P.rl = (Vs = 24, r = 12, l = 0.6) => flat(
    V(3, 7, 3, 11, Vs, 'Vs'), W(3, 7, 3, 4, 6, 4), R(6, 4, 10, 4, r, 'R1'), W(10, 4, 13, 4, 13, 6),
    L(13, 6, 13, 10, l, 'L1'), W(13, 10, 13, 13, 3, 13, 3, 11), G(8, 13));
  P.rlc = (Vs = 10, r = 10, l = 10e-3, c = 10e-6) => flat(
    V(3, 7, 3, 11, Vs, 'Vs'), W(3, 7, 3, 4, 5, 4), R(5, 4, 9, 4, r, 'R1'), W(9, 4, 11, 4),
    L(11, 4, 15, 4, l, 'L1'), W(15, 4, 18, 4, 18, 6), C(18, 6, 18, 10, c, 'C1'),
    W(18, 10, 18, 13, 3, 13, 3, 11), G(10, 13));
  P.thevenin = (Vs = 12, r1 = 6, r2 = 3, r3 = 2, rl = 4, withLoad = true) => {
    const a = [V(3, 7, 3, 11, Vs, 'Vs'), W(3, 7, 3, 4, 5, 4), R(5, 4, 9, 4, r1, 'R1'), W(9, 4, 15, 4),
      R(11, 6, 11, 10, r2, 'R2'), W(11, 4, 11, 6), W(11, 10, 11, 13), R(15, 4, 19, 4, r3, 'R3'), G(7, 13)];
    if (withLoad) a.push(W(19, 4, 22, 4, 22, 6), R(22, 6, 22, 10, rl, 'RL'), W(22, 10, 22, 13), W(3, 11, 3, 13, 22, 13), T(23.2, 4, 'a', { side: 'r' }), T(23.2, 13, 'b', { side: 'r' }));
    else a.push(W(19, 4, 22, 4), W(3, 11, 3, 13, 22, 13), T(22, 4, 'a', { side: 'r', dot: true }), T(22, 13, 'b', { side: 'r', dot: true }));
    return flat(a);
  };
  P.superpos = (Vs = 12, r1 = 4, r2 = 4, is = 2) => srcSeries2Shunt({ Vs, R1: r1, R2: r2, third: 'Iup', thirdVal: is, lab3: 'Is' });
  P.seriesPar = (Vs = 12, r1 = 2, r2 = 6, r3 = 3) => srcSeries2Shunt({ Vs, R1: r1, R2: r2, R3: r3 });
  P.battery = (E = 12, r = 0.5, rl = 5.5) => flat(
    V(3, 7, 3, 11, E, 'E'), W(3, 7, 3, 4, 5, 4), R(5, 4, 9, 4, r, 'r'), W(9, 4, 14, 4, 14, 6),
    R(14, 6, 14, 10, rl, 'RL'), W(14, 10, 14, 13, 3, 13, 3, 11), G(8, 13),
    T(1.3, 2.6, 'แบตเตอรี่', { side: 'r', small: true, box: [1.6, 2.2, 10.4, 12.2] }));
  P.vccs = (Vs = 12, r1 = 2, r2 = 4, g = 0.5) => {
    const r2e = R(11, 6, 11, 10, r2, 'R2', { vx: true });
    return flat(V(3, 7, 3, 11, Vs, 'Vs'), W(3, 7, 3, 4, 5, 4), R(5, 4, 9, 4, r1, 'R1'), W(9, 4, 16, 4),
      r2e, W(11, 4, 11, 6), W(11, 10, 11, 13), DEP('Gd', 16, 6, 16, 10, g, 'G1', r2e), W(16, 4, 16, 6), W(16, 10, 16, 13),
      W(3, 11, 3, 13, 16, 13), G(7, 13));
  };
  P.negres = (Vs = 12, r1 = 4, r2 = 4, g = 0.25, rl = 4, withLoad = true) => {
    const r2e = R(11, 6, 11, 10, r2, 'R2', { vx: true });
    const a = [V(3, 7, 3, 11, Vs, 'Vs'), W(3, 7, 3, 4, 5, 4), R(5, 4, 9, 4, r1, 'R1'), W(9, 4, 20, 4),
      r2e, W(11, 4, 11, 6), W(11, 10, 11, 13), DEP('Gd', 16, 10, 16, 6, g, 'G1', r2e), W(16, 4, 16, 6), W(16, 10, 16, 13), G(7, 13)];
    if (withLoad) a.push(R(20, 6, 20, 10, rl, 'RL'), W(20, 4, 20, 6), W(20, 10, 20, 13), W(3, 11, 3, 13, 20, 13));
    else a.push(W(3, 11, 3, 13, 20, 13), T(20, 4, 'a', { side: 'r', dot: true }), T(20, 13, 'b', { side: 'r', dot: true }));
    return flat(a);
  };
  P.bridge5 = (withSrc = true) => {
    const a = [W(4, 4, 6, 4), R(6, 4, 10, 4, 1, 'R1'), W(10, 4, 14, 4), R(14, 4, 18, 4, 2, 'R2'), W(18, 4, 20, 4),
      W(4, 12, 6, 12), R(6, 12, 10, 12, 2, 'R3', { lp: -1 }), W(10, 12, 14, 12), R(14, 12, 18, 12, 1, 'R4', { lp: -1 }), W(18, 12, 20, 12),
      R(12, 6, 12, 10, 1, 'R5'), W(12, 4, 12, 6), W(12, 10, 12, 12), W(4, 4, 4, 12), W(20, 4, 20, 12)];
    if (withSrc) a.push(W(4, 12, 4, 16, 11, 16), I(15, 16, 11, 16, 1, 'Is', { lp: -1 }), W(15, 16, 20, 16, 20, 12), G(20, 16),
      VM(8, 1, 16, 1, 'VM1'), W(4, 4, 4, 1, 8, 1), W(16, 1, 20, 1, 20, 4), T(3, 8, 'a', { side: 'l' }), T(21, 8, 'b', { side: 'r' }));
    else a.push(W(4, 8, 2, 8), W(20, 8, 22, 8), T(2, 8, 'a', { side: 'l', dot: true }), T(22, 8, 'b', { side: 'r', dot: true }), T(12, 3, 'c', { side: 't' }), T(12, 13.1, 'd', { side: 'b' }));
    return flat(a);
  };
  P.capdiv = (Vs = 12, r1 = 1e3, r2 = 2e3, c1 = 2e-6, c2 = 4e-6) => flat(
    V(3, 7, 3, 11, Vs, 'Vs'), W(3, 7, 3, 3, 16, 3), W(3, 11, 3, 15, 16, 15),
    W(10, 3, 10, 4), R(10, 4, 10, 8, r1, 'R1'), W(10, 8, 10, 10), R(10, 10, 10, 14, r2, 'R2'), W(10, 14, 10, 15),
    W(16, 3, 16, 4), C(16, 4, 16, 8, c1, 'C1', { lp: -1 }), W(16, 8, 16, 10), C(16, 10, 16, 14, c2, 'C2', { lp: -1 }), W(16, 14, 16, 15),
    W(10, 9, 16, 9), G(6, 15), T(13, 8.2, 'P', { side: 't' }));
  P.ladder = (N = 6, r = 1) => {
    const a = [I(3, 10, 3, 6, 1, 'Is', { lp: -1 }), W(3, 6, 3, 4, 5, 4), W(3, 10, 3, 12), G(3, 12), VM(1, 6, 1, 10, 'VM1', { lp: -1 }), W(3, 4, 1, 4, 1, 6), W(1, 10, 1, 12, 3, 12)];
    for (let k = 0; k < N; k++) {
      const x = 5 + 4 * k;
      a.push(R(x, 4, x + 2, 4, r, 'R' + (2 * k + 1)), W(x + 2, 4, x + 4, 4), R(x + 4, 6, x + 4, 10, r, 'R' + (2 * k + 2)), W(x + 4, 4, x + 4, 6), W(x + 4, 10, x + 4, 12));
    }
    a.push(W(3, 12, 5 + 4 * (N - 1) + 4, 12));
    return flat(a).map((c) => { c.x1 += 5; c.x2 += 5; return c; }); // shift right so the voltmeter label stays on the board
  };
  P.kcl = () => flat(
    V(3, 7, 3, 11, 9, 'Vs'), W(3, 7, 3, 4, 5, 4), R(5, 4, 9, 4, 1e3, 'R1'), W(9, 4, 21, 4),
    AM(11, 6, 11, 8, 'AM1'), W(11, 4, 11, 6), R(11, 8, 11, 12, 2e3, 'R2'), W(11, 12, 11, 14),
    AM(16, 6, 16, 8, 'AM2'), W(16, 4, 16, 6), R(16, 8, 16, 12, 3e3, 'R3'), W(16, 12, 16, 14),
    AM(21, 6, 21, 8, 'AM3'), W(21, 4, 21, 6), R(21, 8, 21, 12, 6e3, 'R4'), W(21, 12, 21, 14),
    W(3, 11, 3, 14, 21, 14), G(7, 14));
  P.supernode = (Is = 4.5, r1 = 2, vs = 6, r2 = 4) => flat(
    I(3, 10, 3, 6, Is, 'Is', { lp: -1 }), W(3, 6, 3, 4, 10, 4), R(8, 6, 8, 10, r1, 'R1'), W(8, 4, 8, 6), W(8, 10, 8, 12),
    V(10, 4, 14, 4, vs, 'Vs'), W(14, 4, 17, 4, 17, 6), R(17, 6, 17, 10, r2, 'R2'), W(17, 10, 17, 12),
    W(3, 10, 3, 12, 17, 12), G(5, 12), T(7.6, 3.2, 'V₁', { side: 'l' }), T(15.6, 3.2, 'V₂', { side: 'r' }));
  P.ladderOpen = (N = 4, r = 1, rp = 1) => {
    const a = [W(2, 4, 3, 4), W(2, 12, 3, 12), T(2, 4, 'a', { side: 'l', dot: true }), T(2, 12, 'b', { side: 'l', dot: true }), W(3, 4, 5, 4)];
    for (let k = 0; k < N; k++) { const x = 5 + 4 * k; a.push(R(x, 4, x + 2, 4, r, 'R'), W(x + 2, 4, x + 4, 4), R(x + 4, 6, x + 4, 10, rp, 'Rp'), W(x + 4, 4, x + 4, 6), W(x + 4, 10, x + 4, 12)); }
    const xe = 5 + 4 * N; a.push(W(3, 12, xe + 1, 12), W(xe, 4, xe + 1, 4), T(xe + 1.2, 8, '· · ·', { side: 'r' }));
    return flat(a);
  };
  P.blank = () => [];

  const PRESETS = [
    { k: 'divider', name: 'วงจรแบ่งแรงดันที่มีโหลด', f: () => P.divider(), tran: false },
    { k: 'kcl', name: 'ตรวจสอบ KCL ด้วยแอมมิเตอร์', f: () => P.kcl() },
    { k: 'twoNode', name: 'วิเคราะห์โหนด 2 โหนด', f: () => P.twoNode() },
    { k: 'mesh', name: 'วิเคราะห์เมช 2 เมช', f: () => P.mesh() },
    { k: 'wheatstone', name: 'บริดจ์วีตสโตน', f: () => P.wheatstone() },
    { k: 'thevenin', name: 'เทวินินและการถ่ายโอนกำลังสูงสุด', f: () => P.thevenin() },
    { k: 'vccs', name: 'แหล่งจ่ายไม่อิสระ (VCCS)', f: () => P.vccs() },
    { k: 'bridge5', name: 'บริดจ์ไม่สมดุล หา R_ab', f: () => P.bridge5(true) },
    { k: 'ladder', name: 'บันไดตัวต้านทาน 6 ชั้น', f: () => P.ladder(6) },
    { k: 'capdiv', name: 'ตัวเก็บประจุในสภาวะคงตัว', f: () => P.capdiv() },
    { k: 'rc', name: 'ทรานเซียนต์ RC (ชาร์จ)', f: () => P.rc(), tran: true },
    { k: 'rl', name: 'ทรานเซียนต์ RL', f: () => P.rl(), tran: true },
    { k: 'rlc', name: 'ทรานเซียนต์ RLC อนุกรม', f: () => P.rlc(), tran: true },
    { k: 'blank', name: 'กระดานว่าง', f: () => P.blank() }
  ];
  return { P, PRESETS, R, L, C, V, I, AM, VM, DEP, G, T, W, flat };
})();

/* ===== Schematic renderer (shared by the lab, lesson figures and problem figures) ===== */
const RND = (() => {
  const FS = (s, k) => Math.max(k >= 0.5 ? 11 : 9.5, Math.round(s * k));
  const { fmtSI, key, TWO } = DCE;
  let COL = null;
  function readColors() {
    const cs = getComputedStyle(DCROOT());
    const g = (n) => cs.getPropertyValue(n).trim();
    COL = { ink: g('--ink'), ink2: g('--ink-2'), ink3: g('--ink-3'), grid: g('--grid'), grid2: g('--grid-2'), copper: g('--copper'), flow: g('--flow'), flow2: g('--flow-2'), sheet: g('--sheet'), paper: g('--paper'), vpos: g('--vpos'), vneg: g('--vneg'), ok: g('--ok'), bad: g('--bad'), rule: g('--rule') };
    return COL;
  }
  const hex2rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
  const FONT_UI = '"IBM Plex Sans Thai","Noto Sans Thai",system-ui,sans-serif';
  const FONT_MONO = '"IBM Plex Mono",ui-monospace,Menlo,monospace';

  function valueText(c) {
    const v = +c.v;
    switch (c.t) {
      case 'R': return fmtSI(v, 'Ω');
      case 'L': return fmtSI(v, 'H');
      case 'C': return fmtSI(v, 'F');
      case 'V': return fmtSI(v, 'V');
      case 'I': return fmtSI(v, 'A');
      case 'E': return trimNum(v) + '·vₓ';
      case 'Gd': return trimNum(v) + ' S·vₓ';
      case 'H': return trimNum(v) + ' Ω·iₓ';
      case 'F': return trimNum(v) + '·iₓ';
      default: return '';
    }
  }
  const trimNum = (v) => Number((+v).toPrecision(4)).toString();

  // bounding box in grid units (for figure fitting)
  function bbox(comps) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const inc = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
    for (const c of comps) {
      inc(c.x1, c.y1); inc(c.x2, c.y2);
      if (c.t === 'G') inc(c.x1, c.y1 + 1.3);
      if (TWO.has(c.t)) {
        const hor = Math.abs(c.x2 - c.x1) >= Math.abs(c.y2 - c.y1); const mx = (c.x1 + c.x2) / 2, my = (c.y1 + c.y2) / 2; const lp = c.lp || 1;
        if (hor) inc(mx, my - lp * 1.6); else inc(mx + lp * 2.6, my);
      }
      if (c.t === 'T') { const s = c.side || 'r'; inc(c.x1 + (s === 'r' ? 1.2 : s === 'l' ? -1.2 : 0), c.y1 + (s === 't' ? -0.8 : s === 'b' ? 0.8 : 0)); if (c.box) { inc(c.box[0], c.box[1]); inc(c.box[2], c.box[3]); } }
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
    }
    return deg;
  }

  /* o: {cell, ox, oy, grid, cols, rows, iec, showVal, showLab, res, nodeColor, sel, hover, phase, dots, nodeNames, ghost, figure} */
  function draw(ctx, comps, o) {
    const C = COL || readColors();
    const s = o.cell; const X = (x) => o.ox + x * s, Y = (y) => o.oy + y * s;
    const res = o.res;
    // grid points
    if (o.grid) {
      ctx.fillStyle = C.grid2;
      for (let x = 0; x <= o.cols; x++) for (let y = 0; y <= o.rows; y++) { ctx.fillRect(X(x) - 0.75, Y(y) - 0.75, 1.5, 1.5); }
    }
    // node colouring
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
    // box annotations first
    for (const c of comps) if (c.t === 'T' && c.box) {
      ctx.save(); ctx.setLineDash([s * 0.25, s * 0.18]); ctx.strokeStyle = C.ink3; ctx.lineWidth = 1.2;
      ctx.strokeRect(X(c.box[0]), Y(c.box[1]), (c.box[2] - c.box[0]) * s, (c.box[3] - c.box[1]) * s); ctx.restore();
    }
    // selection halo
    const halo = (c, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = 0.9; ctx.lineWidth = s * 0.62; ctx.lineCap = 'round';
      ctx.beginPath();
      if (c.t === 'G') { ctx.moveTo(X(c.x1), Y(c.y1)); ctx.lineTo(X(c.x1), Y(c.y1) + s * 0.9); }
      else { ctx.moveTo(X(c.x1), Y(c.y1)); ctx.lineTo(X(c.x2), Y(c.y2)); }
      ctx.stroke(); ctx.restore();
    };
    for (const c of comps) {
      if (c.id === o.sel) halo(c, C.flow2);
      else if (c.id === o.hover) { ctx.save(); ctx.globalAlpha = 0.55; halo(c, C.flow2); ctx.restore(); }
    }
    // wires
    for (const c of comps) if (c.t === 'W') {
      ctx.strokeStyle = nodeCol(c.x1, c.y1); ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(X(c.x1), Y(c.y1)); ctx.lineTo(X(c.x2), Y(c.y2)); ctx.stroke();
    }
    // elements
    for (const c of comps) if (TWO.has(c.t)) drawElem(ctx, c, o, C, X, Y, nodeCol(c.x1, c.y1), nodeCol(c.x2, c.y2), lw);
    // grounds
    for (const c of comps) if (c.t === 'G') {
      const x = X(c.x1), y = Y(c.y1); ctx.strokeStyle = C.ink; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + s * 0.5);
      [0.9, 0.58, 0.26].forEach((w, i) => { ctx.moveTo(x - w * s / 2, y + s * (0.5 + i * 0.18)); ctx.lineTo(x + w * s / 2, y + s * (0.5 + i * 0.18)); });
      ctx.stroke();
    }
    // junction dots
    const deg = degreeMap(comps);
    for (const [k, d] of deg) if (d >= 3) {
      const [x, y] = k.split(',').map(Number); ctx.fillStyle = nodeCol(x, y);
      ctx.beginPath(); ctx.arc(X(x), Y(y), Math.max(2.6, s * 0.13), 0, 7); ctx.fill();
    }
    // endpoints of selected item
    const selC = comps.find((c) => c.id === o.sel);
    if (selC && selC.t !== 'G' && selC.t !== 'T') for (const [x, y] of [[selC.x1, selC.y1], [selC.x2, selC.y2]]) {
      ctx.fillStyle = C.sheet; ctx.strokeStyle = C.flow; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(X(x) - s * 0.17, Y(y) - s * 0.17, s * 0.34, s * 0.34); ctx.fill(); ctx.stroke();
    }
    // texts
    for (const c of comps) if (c.t === 'T') {
      const x = X(c.x1), y = Y(c.y1);
      if (c.dot) { ctx.fillStyle = C.sheet; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, Math.max(3, s * 0.17), 0, 7); ctx.fill(); ctx.stroke(); }
      if (!c.lab) continue;
      ctx.fillStyle = c.small ? C.ink3 : C.ink; ctx.font = (c.small ? '500 ' : 'italic 600 ') + FS(s, c.small ? 0.44 : 0.62) + 'px ' + (c.small ? FONT_UI : '"Trirong",Georgia,serif');
      const sd = c.side || 'r';
      ctx.textAlign = sd === 'l' ? 'right' : sd === 'r' ? 'left' : 'center';
      ctx.textBaseline = sd === 't' ? 'bottom' : sd === 'b' ? 'top' : 'middle';
      const dx = sd === 'l' ? -s * 0.35 : sd === 'r' ? s * 0.35 : 0, dy = sd === 't' ? -s * 0.2 : sd === 'b' ? s * 0.2 : 0;
      ctx.fillText(c.lab, x + dx, y + dy);
    }
    // current dots
    if (res && res.elem && o.dots) {
      let imax = 0; for (const k in res.elem) imax = Math.max(imax, Math.abs(res.elem[k].i));
      if (imax > 1e-12) for (const c of comps) if (TWO.has(c.t) && res.elem[c.id]) {
        const i = res.elem[c.id].i; if (Math.abs(i) < imax * 1e-4 || Math.abs(i) < 1e-13) continue;
        const ax = X(c.x1), ay = Y(c.y1), bx = X(c.x2), by = Y(c.y2); const L = Math.hypot(bx - ax, by - ay);
        const kk = Math.max(0, Math.min(1, (Math.log10(Math.abs(i) / imax) + 3) / 3));
        const sp = s * 0.62, speed = s * (0.5 + 2.4 * kk);
        let off = ((o.phase || 0) * speed) % sp; if (i < 0) off = sp - off;
        ctx.fillStyle = C.flow;
        for (let d = off; d < L; d += sp) { const t = d / L; ctx.beginPath(); ctx.arc(ax + (bx - ax) * t, ay + (by - ay) * t, Math.max(2, s * 0.09), 0, 7); ctx.fill(); }
      }
    }
    // node names
    if (res && o.nodeNames && net) {
      ctx.font = '500 ' + FS(s, 0.4) + 'px ' + FONT_MONO; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      net.order.forEach((k, idx) => {
        const [x, y] = k.split(',').map(Number); const t = 'n' + (idx + 1) + ' ' + fmtSI(res.nodeV[idx], 'V');
        const w = ctx.measureText(t).width; const px = X(x) + s * 0.2, py = Y(y) - s * 0.2;
        ctx.fillStyle = C.sheet; ctx.globalAlpha = 0.86; ctx.fillRect(px - 2, py - s * 0.46, w + 4, s * 0.5); ctx.globalAlpha = 1;
        ctx.fillStyle = C.copper; ctx.fillText(t, px, py);
      });
    }
    // ghost (placement preview)
    if (o.ghost) { ctx.save(); ctx.globalAlpha = 0.45; for (const c of o.ghost) { if (c.t === 'W') { ctx.strokeStyle = C.flow; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(X(c.x1), Y(c.y1)); ctx.lineTo(X(c.x2), Y(c.y2)); ctx.stroke(); } else if (TWO.has(c.t)) drawElem(ctx, c, Object.assign({}, o, { res: null, showVal: false, showLab: false }), C, X, Y, C.flow, C.flow, lw); } ctx.restore(); }
  }

  function drawElem(ctx, c, o, C, X, Y, colA, colB, lw) {
    const s = o.cell;
    const ax = X(c.x1), ay = Y(c.y1), bx = X(c.x2), by = Y(c.y2);
    const len = Math.hypot(bx - ax, by - ay); if (len < 2) return;
    const ang = Math.atan2(by - ay, bx - ax), cs = Math.cos(ang), sn = Math.sin(ang);
    const cx = (ax + bx) / 2, cy = (ay + by) / 2;
    const toS = (lx, ly) => [cx + cs * lx - sn * ly, cy + sn * lx + cs * ly];
    const hb = Math.min(0.8 * s, len * 0.42);
    const round = ['V', 'I', 'A', 'VM'].includes(c.t), diamond = ['E', 'Gd', 'H', 'F'].includes(c.t);
    const r = Math.min(0.62 * s, len * 0.4);
    let bodyHalf = c.t === 'C' ? 0.13 * s : (round || diamond) ? r : hb;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.lineWidth = lw;
    ctx.strokeStyle = colA; ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(-bodyHalf, 0); ctx.stroke();
    ctx.strokeStyle = colB; ctx.beginPath(); ctx.moveTo(bodyHalf, 0); ctx.lineTo(len / 2, 0); ctx.stroke();
    ctx.strokeStyle = C.ink; ctx.fillStyle = C.sheet; ctx.lineWidth = lw;
    switch (c.t) {
      case 'R':
        if (o.iec) { ctx.beginPath(); ctx.rect(-hb, -0.24 * s, 2 * hb, 0.48 * s); ctx.fill(); ctx.stroke(); }
        else { const n = 6, seg = 2 * hb / n, a = 0.27 * s; ctx.beginPath(); ctx.moveTo(-hb, 0); for (let k = 0; k < n; k++) ctx.lineTo(-hb + seg * (k + 0.5), k % 2 ? a : -a); ctx.lineTo(hb, 0); ctx.stroke(); }
        break;
      case 'L': {
        const rr = hb / 4; ctx.beginPath(); ctx.moveTo(-hb, 0);
        for (let k = 0; k < 4; k++) ctx.arc(-hb + rr * (2 * k + 1), 0, rr, Math.PI, 0, false);
        ctx.stroke(); break;
      }
      case 'C': {
        const g = 0.13 * s, hh = 0.44 * s; ctx.lineWidth = lw * 1.5;
        ctx.beginPath(); ctx.moveTo(-g, -hh); ctx.lineTo(-g, hh); ctx.moveTo(g, -hh); ctx.lineTo(g, hh); ctx.stroke(); break;
      }
      case 'V': case 'I': case 'A': case 'VM':
        ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
        if (c.t === 'I') arrow(ctx, -0.55 * r, 0.55 * r, s);
        break;
      case 'E': case 'Gd': case 'H': case 'F':
        ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.closePath(); ctx.fill(); ctx.stroke();
        if (c.t === 'Gd' || c.t === 'F') arrow(ctx, -0.5 * r, 0.5 * r, s);
        break;
    }
    ctx.restore();
    // upright glyphs
    const glyph = (txt, lx, ly, size, color, font) => { const [px, py] = toS(lx, ly); ctx.fillStyle = color; ctx.font = font || ('600 ' + Math.max(9, Math.round(size)) + 'px ' + FONT_MONO); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, px, py + 0.5); };
    if (c.t === 'V' || c.t === 'E' || c.t === 'H') { glyph('+', -r * 0.5, 0, s * 0.5, C.ink); glyph('−', r * 0.5, 0, s * 0.5, C.ink); }
    if (c.t === 'A') { glyph('A', 0, 0, s * 0.56, C.ink); glyph('+', -r - 0.22 * s, -0.34 * s, s * 0.36, C.ink3); }
    if (c.t === 'VM') { glyph('V', 0, 0, s * 0.56, C.ink); glyph('+', -r - 0.22 * s, -0.34 * s, s * 0.36, C.ink3); }
    if (c.vx && o.showLab !== false) { glyph('+', -hb - 0.05 * s, -0.42 * s * (Math.abs(cs) > 0.7 ? 1 : -1), s * 0.36, C.copper); glyph('−', hb + 0.05 * s, -0.42 * s * (Math.abs(cs) > 0.7 ? 1 : -1), s * 0.36, C.copper); }
    // labels
    if (o.showLab === false && o.showVal === false && !o.res) return;
    const lines = [];
    if (o.showLab !== false && c.lab) lines.push({ t: c.lab + (c.vx ? '  (vₓ)' : '') + (c.ix ? '  (iₓ)' : ''), f: '600 ' + FS(s, 0.46) + 'px ' + FONT_UI, col: C.ink });
    if (o.showVal !== false && c.t !== 'A' && c.t !== 'VM') { const vt = c.hideVal ? (c.hideVal === true ? '?' : c.hideVal) : valueText(c); if (vt) lines.push({ t: vt, f: '500 ' + FS(s, 0.42) + 'px ' + FONT_MONO, col: c.hideVal ? C.copper : C.ink2 }); }
    const R = o.res && o.res.elem && o.res.elem[c.id];
    if (R) {
      if (c.t === 'A') lines.push({ t: fmtSI(R.i, 'A', 4), f: '700 ' + FS(s, 0.5) + 'px ' + FONT_MONO, col: C.copper });
      else if (c.t === 'VM') lines.push({ t: fmtSI(R.v, 'V', 4), f: '700 ' + FS(s, 0.5) + 'px ' + FONT_MONO, col: C.copper });
      else if (o.showRes !== false && s >= 16) { // on a small (phone) board the numbers live in the tooltip, side panel and table
        const src = ['V', 'I', 'E', 'Gd', 'H', 'F'].includes(c.t);
        lines.push({ t: fmtSI(Math.abs(R.v), 'V') + ' · ' + fmtSI(Math.abs(R.i), 'A'), f: '500 ' + FS(s, 0.38) + 'px ' + FONT_MONO, col: C.flow });
        if (src && Math.abs(R.p) > 1e-15) lines.push({ t: (R.p < 0 ? 'จ่าย ' : 'รับ ') + fmtSI(Math.abs(R.p), 'W'), f: '500 ' + FS(s, 0.38) + 'px ' + FONT_UI, col: R.p < 0 ? C.copper : C.ink3 });
      }
    }
    if (!lines.length) return;
    const lp = c.lp || 1; const hor = Math.abs(cs) > 0.7;
    const lh = Math.max(s * 0.52, 11.5);
    ctx.textBaseline = 'middle';
    if (hor) {
      ctx.textAlign = 'center';
      const base = lp > 0 ? cy - s * 0.62 - (lines.length - 1) * lh : cy + s * 0.68;
      lines.forEach((l, k) => { ctx.font = l.f; ctx.fillStyle = l.col; ctx.fillText(l.t, cx, base + k * lh); });
    } else {
      ctx.textAlign = lp > 0 ? 'left' : 'right';
      const x0 = cx + lp * s * 0.78; const base = cy - (lines.length - 1) * lh / 2;
      lines.forEach((l, k) => { ctx.font = l.f; ctx.fillStyle = l.col; ctx.fillText(l.t, x0, base + k * lh); });
    }
  }
  function arrow(ctx, x0, x1, s) {
    ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1 + 0.02 * s, 0); ctx.lineTo(x1 - 0.2 * s, -0.14 * s); ctx.lineTo(x1 - 0.2 * s, 0.14 * s); ctx.closePath(); ctx.fillStyle = ctx.strokeStyle; ctx.fill();
  }

  // Static figure into a canvas that fits its container width
  function figure(cv, comps, opt = {}) {
    readColors();
    const bb = bbox(comps); const pad = 0.9;
    const wU = bb.x1 - bb.x0 + 2 * pad, hU = bb.y1 - bb.y0 + 2 * pad;
    const avail = Math.max(240, (cv.parentElement && cv.parentElement.clientWidth) || 520);
    const cell = Math.max(15, Math.min(opt.maxCell || 26, Math.floor(avail / wU)));
    const W = Math.round(wU * cell), H = Math.round(hU * cell); const dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    draw(ctx, comps, { cell, ox: (pad - bb.x0) * cell, oy: (pad - bb.y0) * cell, grid: false, iec: !!(window.LAB && LAB.iec), showVal: true, showLab: true, res: opt.res || null, nodeColor: false, dots: false });
  }
  return { draw, figure, readColors, valueText, bbox, mix, hex2rgb };
})();
