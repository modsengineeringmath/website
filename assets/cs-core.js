/* Control systems core (no DOM): complex numbers, polynomials, root finding, transfer-function parser,
   frequency response, margins, Nyquist winding, step response (state space + matrix exponential), root locus tracking,
   and the quantities used by the root-locus sketching rules.
   Polynomials are arrays of real coefficients, highest power first.  Exposed as window.CS and as a CommonJS module for tests. */
(function (global) {
  "use strict";
  var CS = {};
  var PI = Math.PI, TAU = 2 * Math.PI, D2R = PI / 180, R2D = 180 / PI;

  /* ---------------------------------------------------------------- complex */
  function cx(re, im) { return { re: re, im: im || 0 }; }
  var cadd = function (a, b) { return { re: a.re + b.re, im: a.im + b.im }; };
  var csub = function (a, b) { return { re: a.re - b.re, im: a.im - b.im }; };
  var cmul = function (a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; };
  var cabs = function (a) { return Math.hypot(a.re, a.im); };
  var carg = function (a) { return Math.atan2(a.im, a.re); };
  function cdiv(a, b) {
    var d = b.re * b.re + b.im * b.im;
    return { re: (a.re * b.re + b.im * a.im) / d, im: (a.im * b.re - a.re * b.im) / d };
  }
  var cexp = function (a) { var m = Math.exp(a.re); return { re: m * Math.cos(a.im), im: m * Math.sin(a.im) }; };
  var cscale = function (a, k) { return { re: a.re * k, im: a.im * k }; };
  CS.cx = cx; CS.cadd = cadd; CS.csub = csub; CS.cmul = cmul; CS.cdiv = cdiv; CS.cabs = cabs; CS.carg = carg;

  /* ------------------------------------------------------------ polynomials */
  function trim(p, eps) {
    eps = eps || 0;
    var i = 0;
    while (i < p.length - 1 && Math.abs(p[i]) <= eps) i++;
    return p.slice(i);
  }
  function pmul(a, b) {
    var r = new Array(a.length + b.length - 1).fill(0);
    for (var i = 0; i < a.length; i++) for (var j = 0; j < b.length; j++) r[i + j] += a[i] * b[j];
    return r;
  }
  function padd(a, b) {
    var n = Math.max(a.length, b.length), r = new Array(n).fill(0), i;
    for (i = 0; i < a.length; i++) r[n - a.length + i] += a[i];
    for (i = 0; i < b.length; i++) r[n - b.length + i] += b[i];
    return r;
  }
  var pscale = function (a, k) { return a.map(function (x) { return x * k; }); };
  var psub = function (a, b) { return padd(a, pscale(b, -1)); };
  function peval(p, z) { // complex Horner
    var re = 0, im = 0;
    for (var i = 0; i < p.length; i++) {
      var t = re * z.re - im * z.im + p[i];
      im = re * z.im + im * z.re; re = t;
    }
    return { re: re, im: im };
  }
  function pevalR(p, x) { var r = 0; for (var i = 0; i < p.length; i++) r = r * x + p[i]; return r; }
  function pderiv(p) {
    var n = p.length - 1;
    if (n < 1) return [0];
    var r = [];
    for (var i = 0; i < n; i++) r.push(p[i] * (n - i));
    return r;
  }
  var deg = function (p) { return trim(p).length - 1; };
  CS.trim = trim; CS.pmul = pmul; CS.padd = padd; CS.psub = psub; CS.pscale = pscale; CS.peval = peval; CS.pevalR = pevalR; CS.pderiv = pderiv; CS.deg = deg;

  /* Aberth–Ehrlich root finder.  guess (optional) = array of complex starting points. */
  function aberth(a, guess) {
    var n = a.length - 1, i, j, it, z = [];
    if (guess && guess.length === n) {
      for (i = 0; i < n; i++) z.push({ re: guess[i].re + 1e-7 * (i % 2 ? 1 : -1), im: guess[i].im + 1e-7 * (i % 2 ? -1 : 1) });
    } else {
      var r = 0;
      for (i = 1; i <= n; i++) r = Math.max(r, Math.pow(Math.abs(a[i] / a[0]), 1 / i));
      r = r || 1;
      for (i = 0; i < n; i++) { var ang = TAU * i / n + 0.4; z.push({ re: r * Math.cos(ang), im: r * Math.sin(ang) }); }
    }
    var dp = pderiv(a);
    for (it = 0; it < 300; it++) {
      var maxw = 0;
      for (i = 0; i < n; i++) {
        var pv = peval(a, z[i]), dv = peval(dp, z[i]);
        if (cabs(pv) === 0) continue;
        var ratio = cabs(dv) === 0 ? { re: 1e-3, im: 1e-3 } : cdiv(pv, dv);
        var s = { re: 0, im: 0 };
        for (j = 0; j < n; j++) if (j !== i) {
          var df = csub(z[i], z[j]);
          if (cabs(df) < 1e-14) df = { re: 1e-14, im: 0 };
          s = cadd(s, cdiv({ re: 1, im: 0 }, df));
        }
        var den = csub({ re: 1, im: 0 }, cmul(ratio, s));
        var w = cabs(den) < 1e-300 ? ratio : cdiv(ratio, den);
        z[i] = csub(z[i], w);
        maxw = Math.max(maxw, cabs(w) / (1 + cabs(z[i])));
      }
      if (maxw < 1e-14) break;
    }
    return z;
  }
  /* all roots of p (trailing zeros give exact zero roots). Near-real roots are snapped to the real axis. */
  function roots(p0, guess) {
    var p = trim(p0, 0).slice(), res = [];
    while (p.length > 1 && p[p.length - 1] === 0) { res.push(cx(0, 0)); p.pop(); }
    var n = p.length - 1;
    if (n < 1) return res;
    var z;
    if (n === 1) z = [cx(-p[1] / p[0], 0)];
    else if (n === 2) {
      var A = p[0], B = p[1], Cc = p[2], disc = B * B - 4 * A * Cc;
      if (disc >= 0) {
        var q = -0.5 * (B + (B >= 0 ? 1 : -1) * Math.sqrt(disc));
        var r1 = q / A, r2 = q !== 0 ? Cc / q : -B / (2 * A);
        z = [cx(r1, 0), cx(r2, 0)];
      } else z = [cx(-B / (2 * A), Math.sqrt(-disc) / (2 * A)), cx(-B / (2 * A), -Math.sqrt(-disc) / (2 * A))];
    } else {
      var a = p.map(function (x) { return x / p[0]; });
      z = aberth(a, guess && guess.length === n ? guess : null);
    }
    z.forEach(function (w) { if (Math.abs(w.im) < 1e-7 * (1 + Math.abs(w.re))) w.im = 0; });
    return res.concat(z);
  }
  /* real polynomial from a root list (complex roots must come in conjugate pairs) */
  function fromRoots(rs) {
    var used = new Array(rs.length).fill(false), p = [1];
    for (var i = 0; i < rs.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      var r = rs[i];
      if (Math.abs(r.im) < 1e-9 * (1 + Math.abs(r.re))) p = pmul(p, [1, -r.re]);
      else {
        var best = -1, bd = Infinity;
        for (var j = i + 1; j < rs.length; j++) if (!used[j]) {
          var d = Math.hypot(rs[j].re - r.re, rs[j].im + r.im);
          if (d < bd) { bd = d; best = j; }
        }
        if (best >= 0) used[best] = true;
        p = pmul(p, [1, -2 * r.re, r.re * r.re + r.im * r.im]);
      }
    }
    return p;
  }
  CS.roots = roots; CS.fromRoots = fromRoots;

  /* --------------------------------------------------- transfer-function parser */
  /* Accepts e.g.  10(s+2)/(s(s+1)(s^2+2s+5))   K*(s+1)/(s^2+3s+2)   1/(s*(0.1s+1))   e^(-0.5s)/(s+1)  */
  function tokenise(src) {
    var str = String(src).replace(/−/g, "-").replace(/[×·]/g, "*").replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁴/g, "^4");
    var toks = [], i = 0, m;
    while (i < str.length) {
      var ch = str[i];
      if (/\s/.test(ch)) { i++; continue; }
      if ((m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(str.slice(i)))) {
        // an "e" directly followed by something non-numeric is not an exponent (e.g. "2e^(-s)" is not supported; use 2*e^(-s))
        toks.push({ t: "num", v: parseFloat(m[0]) }); i += m[0].length; continue;
      }
      if ((m = /^(exp|[a-zA-Z])/.exec(str.slice(i)))) { toks.push({ t: "id", v: m[0] }); i += m[0].length; continue; }
      if ("+-*/^()".indexOf(ch) >= 0) { toks.push({ t: ch }); i++; continue; }
      throw new Error("อักขระที่ไม่รู้จัก: " + ch);
    }
    return toks;
  }
  function rat(n, d) { return { n: n, d: d || [1] }; }
  function rmul(a, b) { return rat(pmul(a.n, b.n), pmul(a.d, b.d)); }
  function radd(a, b) { return rat(padd(pmul(a.n, b.d), pmul(b.n, a.d)), pmul(a.d, b.d)); }
  function rinv(a) {
    if (trim(a.n).length === 1 && a.n[a.n.length - 1] === 0) throw new Error("หารด้วยศูนย์");
    return rat(a.d, a.n);
  }
  function parseTF(src, opts) {
    opts = opts || {};
    var toks = tokenise(src), pos = 0, delay = 0, K = opts.K == null ? 1 : opts.K;
    function peek() { return toks[pos]; }
    function expect(t) { if (!toks[pos] || toks[pos].t !== t) throw new Error("ไวยากรณ์ผิด: คาดว่าจะเป็น " + t); return toks[pos++]; }
    function expr() {
      var v = term();
      while (peek() && (peek().t === "+" || peek().t === "-")) {
        var op = toks[pos++].t, w = term();
        v = radd(v, op === "+" ? w : rat(pmul(w.n, [-1]), w.d));
      }
      return v;
    }
    function term() {
      var v = implicit();
      while (peek() && (peek().t === "*" || peek().t === "/")) {
        var op = toks[pos++].t, w = implicit();
        v = op === "*" ? rmul(v, w) : rmul(v, rinv(w));
      }
      return v;
    }
    function startsFactor(t) { return t && (t.t === "num" || t.t === "id" || t.t === "("); }
    function implicit() {
      var v = unary();
      while (startsFactor(peek())) v = rmul(v, power());
      return v;
    }
    function unary() {
      if (peek() && peek().t === "-") { pos++; var v = unary(); return rat(pmul(v.n, [-1]), v.d); }
      if (peek() && peek().t === "+") { pos++; return unary(); }
      return power();
    }
    function power() {
      var b = atom();
      if (peek() && peek().t === "^") {
        pos++;
        var neg = false;
        if (peek() && peek().t === "-") { neg = true; pos++; }
        var tk = expect("num"), e = tk.v;
        if (e !== Math.round(e)) throw new Error("เลขชี้กำลังต้องเป็นจำนวนเต็ม");
        var r = rat([1]);
        for (var i = 0; i < e; i++) r = rmul(r, b);
        return neg ? rinv(r) : r;
      }
      return b;
    }
    function atom() {
      var t = peek();
      if (!t) throw new Error("นิพจน์ไม่สมบูรณ์");
      if (t.t === "num") { pos++; return rat([t.v]); }
      if (t.t === "(") { pos++; var v = expr(); expect(")"); return v; }
      if (t.t === "id") {
        pos++;
        if (t.v === "s") return rat([1, 0]);
        if (t.v === "K" || t.v === "k") return rat([K]);
        if (t.v === "exp" || t.v === "e") {
          var inner;
          if (t.v === "exp") { expect("("); inner = expr(); expect(")"); }
          else { expect("^"); if (peek() && peek().t === "(") { pos++; inner = expr(); expect(")"); } else inner = unary(); }
          var N = trim(inner.n), Dn = trim(inner.d);
          if (Dn.length !== 1 || N.length > 2 || (N.length === 2 && Math.abs(N[1]) > 1e-12)) throw new Error("รองรับเฉพาะหน่วงเวลา e^(−T·s)");
          var a1 = N.length === 2 ? N[0] / Dn[0] : 0; // coefficient of s
          if (a1 > 1e-12) throw new Error("หน่วงเวลาต้องเป็น e^(−T·s) ที่ T ≥ 0");
          delay += -a1;
          return rat([1]);
        }
        throw new Error("ตัวแปรที่รู้จักมีแค่ s และ K (พบ " + t.v + ")");
      }
      throw new Error("ไวยากรณ์ผิด");
    }
    var v = expr();
    if (pos < toks.length) throw new Error("มีส่วนเกินท้ายนิพจน์");
    var N = trim(v.n, 1e-300), D = trim(v.d, 1e-300);
    if (D.length === 1 && D[0] === 0) throw new Error("ตัวส่วนเป็นศูนย์");
    var tf = { N: N, D: D, delay: delay };
    return cancelCommon(tf);
  }
  /* remove identical pole/zero pairs that come from typing the same factor in numerator and denominator */
  function cancelCommon(tf) {
    var zr = roots(tf.N), pr = roots(tf.D), changed = false;
    for (var i = zr.length - 1; i >= 0; i--) {
      for (var j = 0; j < pr.length; j++) {
        if (Math.hypot(zr[i].re - pr[j].re, zr[i].im - pr[j].im) < 1e-7 * (1 + Math.hypot(pr[j].re, pr[j].im))) {
          zr.splice(i, 1); pr.splice(j, 1); changed = true; break;
        }
      }
    }
    if (!changed) { tf.cancelled = false; return tf; }
    var k = tf.N[0] / tf.D[0];
    return { N: pscale(fromRoots(zr), k), D: fromRoots(pr), delay: tf.delay, cancelled: true };
  }
  CS.parseTF = parseTF;

  /* poles / zeros / gain of N/D (gain k for monic polynomials) */
  function pzk(tf) {
    return { z: roots(tf.N), p: roots(tf.D), k: tf.N[0] / tf.D[0], delay: tf.delay };
  }
  CS.pzk = pzk;
  function fromPZK(z, p, k, delay) { return { N: pscale(fromRoots(z), k), D: fromRoots(p), delay: delay || 0 }; }
  CS.fromPZK = fromPZK;

  /* ------------------------------------------------------- frequency response */
  function freqAt(tf, w, K) {
    var s = { re: 0, im: w };
    var h = cdiv(peval(tf.N, s), peval(tf.D, s));
    if (K != null) h = cscale(h, K);
    if (tf.delay) h = cmul(h, { re: Math.cos(w * tf.delay), im: -Math.sin(w * tf.delay) });
    return h;
  }
  /* DC-gain structure: number of integrators q (poles at 0 minus zeros at 0) and the Bode gain Kb = lim s^q L(s) */
  function lowFreq(tf) {
    var N = tf.N.slice(), D = tf.D.slice(), q = 0, scale = Math.max.apply(null, N.concat(D).map(Math.abs)) || 1;
    var tol = 1e-12 * scale;
    while (D.length > 1 && Math.abs(D[D.length - 1]) <= tol) { D.pop(); q++; }
    while (N.length > 1 && Math.abs(N[N.length - 1]) <= tol) { N.pop(); q--; }
    return { q: q, Kb: N[N.length - 1] / D[D.length - 1] };
  }
  CS.lowFreq = lowFreq;
  /* characteristic corner frequencies: |roots| of N and D that are non-zero */
  function corners(tf) {
    var ws = [];
    roots(tf.N).concat(roots(tf.D)).forEach(function (r) { var m = cabs(r); if (m > 1e-9) ws.push(m); });
    return ws;
  }
  CS.corners = corners;
  /* Bode data on a log grid with unwrapped phase (degrees) */
  function bode(tf, wmin, wmax, n, K) {
    var out = { w: [], db: [], ph: [], mag: [] }, lf = lowFreq(tf), kdc = (K == null ? 1 : K) * lf.Kb;
    var phase0 = (kdc < 0 ? -180 : 0) - 90 * lf.q, prev = null, off = 0;
    for (var i = 0; i <= n; i++) {
      var w = wmin * Math.pow(wmax / wmin, i / n), h = freqAt(tf, w, K), m = cabs(h), ph = carg(h) * R2D;
      if (i === 0) {
        // anchor the phase at the lowest frequency to the low-frequency asymptote
        off = Math.round((phase0 - ph) / 360) * 360;
        // for a pure delay or high-order system the principal value at wmin is already near phase0
      } else {
        var d = ph + off - prev;
        if (d > 180) off -= 360 * Math.round(d / 360); else if (d < -180) off -= 360 * Math.round(d / 360);
      }
      prev = ph + off;
      out.w.push(w); out.mag.push(m); out.db.push(20 * Math.log10(m)); out.ph.push(prev);
    }
    return out;
  }
  CS.bode = bode; CS.freqAt = freqAt;
  /* refine a bracketed root of f on [a,b] by bisection */
  function bisect(f, a, b, it) {
    var fa = f(a), fb = f(b);
    for (var i = 0; i < (it || 60); i++) {
      var m = 0.5 * (a + b), fm = f(m);
      if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else { b = m; fb = fm; }
    }
    return 0.5 * (a + b);
  }
  /* gain/phase margins from a dense Bode grid.  returns {gc:[{w,pm}], pc:[{w,gm}], gm, pm, wgc, wpc, stable} (first crossings) */
  function margins(tf, K, wmin, wmax) {
    var cs = corners(tf);
    var lo = wmin || (cs.length ? Math.min.apply(null, cs) / 1e3 : 1e-3), hi = wmax || (cs.length ? Math.max.apply(null, cs) * 1e3 : 1e3);
    if (tf.delay) hi = Math.max(hi, 50 / tf.delay);
    var n = 3000, b = bode(tf, lo, hi, n, K), gc = [], pc = [], i;
    var phAt = function (w) { // phase at arbitrary w consistent with the unwrapped grid
      var j = Math.min(n - 1, Math.max(0, Math.floor(Math.log(w / lo) / Math.log(hi / lo) * n)));
      var h = freqAt(tf, w, K), p = carg(h) * R2D, ref = b.ph[j];
      return p + 360 * Math.round((ref - p) / 360);
    };
    for (i = 0; i < n; i++) {
      if ((b.db[i] > 0) !== (b.db[i + 1] > 0)) {
        var wg = Math.exp(bisect(function (lw) { return 20 * Math.log10(cabs(freqAt(tf, Math.exp(lw), K))); }, Math.log(b.w[i]), Math.log(b.w[i + 1])));
        var ph = phAt(wg), pm = ((ph + 180 + 180) % 360 + 360) % 360 - 180;
        gc.push({ w: wg, pm: pm, ph: ph });
      }
      var a1 = Math.floor((b.ph[i] + 180) / 360), a2 = Math.floor((b.ph[i + 1] + 180) / 360);
      if (a1 !== a2) {
        var target = -180 + 360 * Math.max(a1, a2) - 360; // the crossed multiple of -180 deg that is ≡ -180 mod 360
        target = Math.max(a1, a2) * 360 - 180;
        var wp = Math.exp(bisect(function (lw) { return phAt(Math.exp(lw)) - target; }, Math.log(b.w[i]), Math.log(b.w[i + 1])));
        pc.push({ w: wp, gm: -20 * Math.log10(cabs(freqAt(tf, wp, K))) });
      }
    }
    var res = { gc: gc, pc: pc, gm: pc.length ? Math.min.apply(null, pc.map(function (x) { return Math.abs(x.gm); })) * (pc.length ? Math.sign(pc.reduce(function (m, x) { return Math.abs(x.gm) < Math.abs(m.gm) ? x : m; }).gm) : 1) : Infinity,
      pm: gc.length ? gc[gc.length - 1].pm : Infinity, wgc: gc.length ? gc[gc.length - 1].w : null, wpc: pc.length ? pc[0].w : null };
    return res;
  }
  CS.margins = margins;

  /* ---------------------------------------------------------- state space / simulation */
  function matmul(A, B) {
    var n = A.length, m = B[0].length, k = B.length, R = [];
    for (var i = 0; i < n; i++) { R.push(new Array(m).fill(0)); for (var j = 0; j < m; j++) { var s = 0; for (var l = 0; l < k; l++) s += A[i][l] * B[l][j]; R[i][j] = s; } }
    return R;
  }
  function expm(A) {
    var n = A.length, nrm = 0, i, j;
    for (i = 0; i < n; i++) { var rs = 0; for (j = 0; j < n; j++) rs += Math.abs(A[i][j]); nrm = Math.max(nrm, rs); }
    var sq = Math.max(0, Math.ceil(Math.log2(Math.max(nrm, 1e-12) / 0.5)));
    var f = Math.pow(2, -sq), M = A.map(function (r) { return r.map(function (x) { return x * f; }); });
    var I = [], R = [], T = [];
    for (i = 0; i < n; i++) { I.push(new Array(n).fill(0)); I[i][i] = 1; }
    R = I.map(function (r) { return r.slice(); }); T = I.map(function (r) { return r.slice(); });
    for (var k = 1; k <= 20; k++) {
      T = matmul(T, M).map(function (r) { return r.map(function (x) { return x / k; }); });
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) R[i][j] += T[i][j];
    }
    for (var s = 0; s < sq; s++) R = matmul(R, R);
    return R;
  }
  /* controllable canonical realisation of N/D (deg N <= deg D) */
  function toSS(N, D) {
    N = trim(N); D = trim(D);
    var n = D.length - 1;
    if (N.length - 1 > n) throw new Error("ฟังก์ชันถ่ายโอนไม่เป็น proper");
    if (n === 0) return { A: [], B: [], C: [], Dd: N[0] / D[0], n: 0 };
    var a = D.map(function (x) { return x / D[0]; }), b = new Array(n + 1 - N.length).fill(0).concat(N).map(function (x) { return x / D[0]; });
    var dd = b[0], cn = [];
    for (var i = 1; i <= n; i++) cn.push(b[i] - dd * a[i]); // highest-order first (s^{n-1} ... s^0)
    var A = [], B = [], C = [];
    for (i = 0; i < n; i++) { A.push(new Array(n).fill(0)); B.push(i === n - 1 ? 1 : 0); }
    for (i = 0; i < n - 1; i++) A[i][i + 1] = 1;
    for (i = 0; i < n; i++) A[n - 1][i] = -a[n - i];
    for (i = 0; i < n; i++) C.push(cn[n - 1 - i]);
    return { A: A, B: B, C: C, Dd: dd, n: n };
  }
  CS.toSS = toSS; CS.expm = expm;
  /* exact zero-order-hold discretisation */
  function discretise(ss, dt) {
    var n = ss.n, M = [], i, j;
    for (i = 0; i <= n; i++) { M.push(new Array(n + 1).fill(0)); }
    for (i = 0; i < n; i++) { for (j = 0; j < n; j++) M[i][j] = ss.A[i][j] * dt; M[i][n] = ss.B[i] * dt; }
    var E = expm(M), Ad = [], Bd = [];
    for (i = 0; i < n; i++) { Ad.push(E[i].slice(0, n)); Bd.push(E[i][n]); }
    return { Ad: Ad, Bd: Bd, C: ss.C, Dd: ss.Dd, n: n };
  }
  CS.discretise = discretise;
  function simulate(ssd, u, steps, x0) {
    var n = ssd.n, x = x0 ? x0.slice() : new Array(n).fill(0), y = [], i, j, k;
    for (k = 0; k < steps; k++) {
      var yk = ssd.Dd * u(k);
      for (j = 0; j < n; j++) yk += ssd.C[j] * x[j];
      y.push(yk);
      var xn = new Array(n).fill(0);
      for (i = 0; i < n; i++) { var s = ssd.Bd[i] * u(k); for (j = 0; j < n; j++) s += ssd.Ad[i][j] * x[j]; xn[i] = s; }
      x = xn;
    }
    return y;
  }
  CS.simulate = simulate;
  /* closed-loop T = K N / (D + K N) for unity feedback.  Delay is replaced by a 3rd-order Padé approximation. */
  function pade(T) {
    // (1 - sT/2 + (sT)^2/10 - (sT)^3/120) / (1 + sT/2 + (sT)^2/10 + (sT)^3/120)
    return { n: [-T * T * T / 120, T * T / 10, -T / 2, 1], d: [T * T * T / 120, T * T / 10, T / 2, 1] };
  }
  function withDelay(tf) {
    if (!tf.delay) return { N: tf.N, D: tf.D };
    var p = pade(tf.delay);
    return { N: pmul(tf.N, p.n), D: pmul(tf.D, p.d) };
  }
  CS.withDelay = withDelay;
  function closedLoop(tf, K) {
    var t = withDelay(tf), KN = pscale(t.N, K);
    return { N: KN, D: padd(t.D, KN) };
  }
  CS.closedLoop = closedLoop;
  /* step response of N/D.  Returns {t, y, info}.  tEnd chosen automatically from the poles unless given. */
  function stepResponse(N, D, tEnd, nPts) {
    nPts = nPts || 600;
    N = trim(N); D = trim(D);
    var pr = roots(D), maxRe = -Infinity, minAbsRe = Infinity, maxW = 0;
    pr.forEach(function (p) {
      maxRe = Math.max(maxRe, p.re);
      if (Math.abs(p.re) > 1e-9) minAbsRe = Math.min(minAbsRe, Math.abs(p.re));
      maxW = Math.max(maxW, cabs(p));
    });
    var stable = maxRe < -1e-9;
    if (!tEnd) {
      tEnd = isFinite(minAbsRe) ? 6 / minAbsRe : 10 / (maxW || 1);
      if (!stable && maxRe > 1e-9) tEnd = Math.min(tEnd, 8 / maxRe);
      tEnd = Math.max(tEnd, 12 / (maxW || 1));
    }
    var dt = tEnd / nPts, ss = toSS(N, D);
    // sub-step so that the fastest dynamics are resolved when tEnd is long
    var sub = Math.max(1, Math.ceil(dt * maxW / 0.5)), dts = dt / sub, ssd = discretise(ss, dts);
    var total = nPts * sub, y = simulate(ssd, function () { return 1; }, total + 1), t = [], yy = [];
    for (var i = 0; i <= nPts; i++) { t.push(i * dt); yy.push(y[i * sub]); }
    var info = stepInfo(t, yy, N, D, stable);
    info.stable = stable; info.marginal = !stable && maxRe > -1e-9 && maxRe < 1e-9;
    return { t: t, y: yy, info: info, tEnd: tEnd };
  }
  function stepInfo(t, y, N, D, stable) {
    var d0 = pevalR(D, 0), n0 = pevalR(N, 0), yss = Math.abs(d0) > 1e-12 ? n0 / d0 : NaN;
    var info = { yss: yss, Mp: NaN, tp: NaN, tr: NaN, ts: NaN };
    if (!stable || !isFinite(yss) || Math.abs(yss) < 1e-12) return info;
    var i, ymax = -Infinity, imax = 0;
    for (i = 0; i < y.length; i++) if (y[i] * Math.sign(yss) > ymax) { ymax = y[i] * Math.sign(yss); imax = i; }
    info.Mp = Math.max(0, (ymax * Math.sign(yss) - yss) / Math.abs(yss) * 100);
    info.tp = t[imax];
    var lo = 0.1 * yss, hi = 0.9 * yss, t1 = null, t2 = null;
    for (i = 1; i < y.length; i++) {
      if (t1 === null && (y[i] - lo) * Math.sign(yss) >= 0) t1 = t[i - 1] + (lo - y[i - 1]) / (y[i] - y[i - 1]) * (t[i] - t[i - 1]);
      if (t2 === null && (y[i] - hi) * Math.sign(yss) >= 0) { t2 = t[i - 1] + (hi - y[i - 1]) / (y[i] - y[i - 1]) * (t[i] - t[i - 1]); break; }
    }
    if (t1 !== null && t2 !== null) info.tr = t2 - t1;
    var band = 0.02 * Math.abs(yss), last = 0;
    for (i = 0; i < y.length; i++) if (Math.abs(y[i] - yss) > band) last = i;
    info.ts = last >= y.length - 2 ? NaN : t[Math.min(y.length - 1, last + 1)];
    return info;
  }
  CS.stepInfo = stepInfo; CS.stepResponse = stepResponse; CS.bisect = bisect; CS.pade = pade;

  /* --------------------------------------------------------------- root locus */
  /* closed-loop characteristic polynomial for loop gain K:  D + sign*K*N  */
  function charPoly(N, D, K) { return padd(D, pscale(N, K)); }
  CS.charPoly = charPoly;
  /* Track the branches of  D(s) + sgn*K N(s) = 0  for K from 0 up.  opts: {sgn:+1|-1, scale, kmax, rmax}  returns {branches:[[{k,re,im}]], kEnd} */
  function locus(N, D, opts) {
    opts = opts || {};
    N = trim(N); D = trim(D);
    var sgn = opts.sgn || 1, n = D.length - 1;
    if (n < 1) return { branches: [], kEnd: 0 };
    var poles = roots(D), zs = roots(N), sc = opts.scale;
    if (!sc) {
      sc = 0; poles.concat(zs).forEach(function (r) { sc = Math.max(sc, cabs(r)); });
      sc = sc || 1;
    }
    var rmax = opts.rmax || 8 * sc;
    // reference gain: |D/N| at |s| = sc on a generic direction
    var sref = { re: 0.7 * sc, im: 0.7 * sc }, kref = cabs(peval(D, sref)) / Math.max(cabs(peval(N, sref)), 1e-300);
    var K = 0, dK = 1e-6 * kref, kcap = opts.kmax || 1e7 * kref;
    var cur = poles.map(function (p) { return { re: p.re, im: p.im }; });
    var branches = cur.map(function (p) { return [{ k: 0, re: p.re, im: p.im }]; });
    var tol = 0.01 * sc, steps = 0, ends = false;
    var zeroSet = zs;
    while (K < kcap && steps < 40000) {
      steps++;
      var Kn = K + dK, P = padd(D, pscale(N, sgn * Kn)), nr = roots(P, cur);
      if (nr.length !== n) { dK *= 0.5; if (dK < 1e-15 * kref) break; continue; }
      // greedy nearest matching to keep branches continuous
      var used = new Array(n).fill(false), next = new Array(n), maxMove = 0, i, j;
      for (i = 0; i < n; i++) {
        var bj = -1, bd = Infinity;
        for (j = 0; j < n; j++) if (!used[j]) {
          var d = Math.hypot(nr[j].re - cur[i].re, nr[j].im - cur[i].im);
          if (d < bd) { bd = d; bj = j; }
        }
        used[bj] = true; next[i] = nr[bj]; maxMove = Math.max(maxMove, bd);
      }
      if (maxMove > tol && dK > 1e-14 * kref) { dK *= 0.5; continue; }
      K = Kn;
      for (i = 0; i < n; i++) { cur[i] = { re: next[i].re, im: next[i].im }; branches[i].push({ k: K, re: next[i].re, im: next[i].im }); }
      if (maxMove < tol * 0.3) dK *= 1.5; else if (maxMove > tol * 0.8) dK *= 0.7;
      // stop when every branch is at a zero or out of range
      var done = true;
      for (i = 0; i < n; i++) {
        var far = cabs(cur[i]) > rmax, atZero = false;
        for (j = 0; j < zeroSet.length; j++) if (Math.hypot(cur[i].re - zeroSet[j].re, cur[i].im - zeroSet[j].im) < 0.004 * sc) atZero = true;
        if (!(far || atZero)) { done = false; break; }
      }
      if (done) { ends = true; break; }
    }
    return { branches: branches, kEnd: K, scale: sc, complete: ends };
  }
  CS.locus = locus;

  /* the quantities used by the hand-sketching rules (K > 0 locus for sgn = +1, K < 0 locus for sgn = -1) */
  function lociRules(tf, sgn) {
    sgn = sgn || 1;
    var N = trim(tf.N), D = trim(tf.D), n = D.length - 1, m = N.length - 1;
    var poles = roots(D), zeros = roots(N), k0 = N[0] / D[0];
    var res = { n: n, m: m, poles: poles, zeros: zeros, nm: n - m };
    // real-axis segments: a real point lies on the K>0 locus if the number of real poles+zeros to its right is odd (even for K<0)
    var reals = poles.concat(zeros).filter(function (r) { return Math.abs(r.im) < 1e-9; }).map(function (r) { return r.re; }).sort(function (a, b) { return b - a; });
    var segs = [], right = 0, want = sgn > 0 ? 1 : 0, i;
    // iterate over intervals between sorted real critical points (from the right)
    var pts = reals.slice();
    var bounds = [Infinity].concat(pts).concat([-Infinity]);
    var cnt = 0;
    for (i = 0; i < bounds.length - 1; i++) {
      // interval (bounds[i+1], bounds[i]); count of critical points strictly to its right = i
      if ((i % 2) === (sgn > 0 ? 1 : 0) && bounds[i] !== bounds[i + 1]) segs.push({ from: bounds[i + 1], to: bounds[i] });
    }
    // multiplicity: a double real pole counts twice (handled because duplicates appear twice in the list)
    res.segments = segs;
    // asymptotes
    if (n > m) {
      var sumP = 0, sumZ = 0;
      poles.forEach(function (p) { sumP += p.re; }); zeros.forEach(function (z) { sumZ += z.re; });
      res.centroid = (sumP - sumZ) / (n - m);
      res.angles = [];
      for (i = 0; i < n - m; i++) res.angles.push(sgn > 0 ? (2 * i + 1) * 180 / (n - m) : (2 * i) * 180 / (n - m));
    }
    // break-away / break-in points: roots of N D' - N' D = 0 with real K
    var Q = psub(pmul(N, pderiv(D)), pmul(pderiv(N), D));
    res.breaks = [];
    if (deg(Q) >= 1) {
      roots(Q).forEach(function (s) {
        var Dv = peval(D, s), Nv = peval(N, s);
        if (cabs(Nv) < 1e-12) return;
        var Kv = cdiv(Dv, Nv); Kv = { re: -Kv.re, im: -Kv.im }; // K = -D/N
        var Kreal = Math.abs(Kv.im) < 1e-6 * (1 + Math.abs(Kv.re));
        if (!Kreal) return;
        var K = Kv.re;
        if (sgn > 0 ? K > 1e-9 : K < -1e-9) res.breaks.push({ s: s, K: Math.abs(K) });
      });
    }
    // j-omega crossings: Im[D conj N] = 0, K = -Re[D conj N]/|N|^2
    function jw(p) { // real & imag polynomials in omega (high-first) of p(j w)
      var d = p.length - 1, re = new Array(d + 1).fill(0), im = new Array(d + 1).fill(0);
      for (var i = 0; i <= d; i++) {
        var pw = d - i, c = p[i]; // coefficient of (jw)^pw
        var idx = d - pw; // position in omega array (high-first, degree = pw)
        var r = pw % 4;
        if (r === 0) re[idx] += c; else if (r === 1) im[idx] += c; else if (r === 2) re[idx] -= c; else im[idx] -= c;
      }
      return { re: re, im: im };
    }
    var jd = jw(D), jn = jw(N);
    var Gim = psub(pmul(jd.im, jn.re), pmul(jd.re, jn.im)), Gre = padd(pmul(jd.re, jn.re), pmul(jd.im, jn.im)), Nn = padd(pmul(jn.re, jn.re), pmul(jn.im, jn.im));
    res.cross = [];
    var seen = [];
    var addCross = function (w) {
      var nre = pevalR(Gre, w), den = pevalR(Nn, w);
      if (den < 1e-14) return;
      var K = -nre / den;
      if (sgn > 0 ? K > 1e-9 : K < -1e-9) {
        for (var q = 0; q < seen.length; q++) if (Math.abs(seen[q] - w) < 1e-6 * (1 + w)) return;
        seen.push(w); res.cross.push({ w: w, K: Math.abs(K) });
      }
    };
    if (deg(Gim) >= 1 || Math.abs(Gim[0]) > 0) {
      var gz = Gim.length > 1 ? roots(Gim) : [];
      gz.forEach(function (r) { if (Math.abs(r.im) < 1e-6 * (1 + Math.abs(r.re)) && r.re >= -1e-9) addCross(Math.max(0, r.re)); });
    }
    res.cross.sort(function (a, b) { return a.w - b.w; });
    // angle of departure / arrival (degrees) for complex poles and zeros in the upper half plane
    var ang = function (a, b) { return Math.atan2(a.im - b.im, a.re - b.re) * R2D; };
    res.departure = []; res.arrival = [];
    poles.forEach(function (p, idx) {
      if (p.im > 1e-9) {
        var s = 0;
        zeros.forEach(function (z) { s += ang(p, z); });
        poles.forEach(function (q, j) { if (j !== idx) s -= ang(p, q); });
        var th = (sgn > 0 ? 180 : 0) + s; th = ((th + 180) % 360 + 360) % 360 - 180;
        res.departure.push({ p: p, angle: th });
      }
    });
    zeros.forEach(function (z, idx) {
      if (z.im > 1e-9) {
        var s = 0;
        poles.forEach(function (p) { s += ang(z, p); });
        zeros.forEach(function (q, j) { if (j !== idx) s -= ang(z, q); });
        var th = (sgn > 0 ? 180 : 0) - s; th = ((th + 180) % 360 + 360) % 360 - 180;
        res.arrival.push({ z: z, angle: th });
      }
    });
    return res;
  }
  CS.lociRules = lociRules;

  /* ------------------------------------------------------------------ Nyquist */
  /* Nyquist data for K·L(jω): {pts:[{re,im,w}] for w>0, wind: counter-clockwise winding about -1 over the full contour (indented at the origin), P, Z, N} */
  function nyquist(tf, K, n) {
    var cs = corners(tf), lf = lowFreq(tf);
    var lo = cs.length ? Math.min.apply(null, cs) / 1e3 : 1e-3, hi = cs.length ? Math.max.apply(null, cs) * 1e3 : 1e3;
    if (tf.delay) hi = Math.max(hi, 60 / tf.delay);
    n = n || 1500;
    var pts = [], i;
    for (i = 0; i <= n; i++) {
      var w = lo * Math.pow(hi / lo, i / n), h = freqAt(tf, w, K);
      pts.push({ re: h.re, im: h.im, w: w });
    }
    // closed contour for winding about -1: w from +lo..hi, (nothing at infinity for strictly proper), mirror hi..lo, indent arc around origin poles
    var contour = pts.map(function (p) { return { re: p.re, im: p.im }; });
    var mirror = pts.slice().reverse().map(function (p) { return { re: p.re, im: -p.im }; });
    var q = lf.q, arc = [];
    if (q > 0) {
      // L ~ c/s^q ; on s = eps e^{j th}, th: -90..90 -> L ~ (c/eps^q) e^{-j q th}.  start at mirror end (th=-90) and finish at the start of `contour` (th=+90)
      var big = Math.max(cabs(contour[0]), 1e3), c0 = (K == null ? 1 : K) * lf.Kb, steps = 90;
      for (i = 0; i <= steps; i++) {
        var th = (-90 + 180 * i / steps) * D2R, mag = big, ph = carg({ re: c0, im: 0 }) - q * th;
        arc.push({ re: mag * Math.cos(ph), im: mag * Math.sin(ph) });
      }
    }
    var loop = contour.concat(mirror.slice(0, 0)); // contour first (w: lo -> hi)
    // full order: w=-hi..-lo (mirror reversed order is hi..lo mirrored => we need -hi..-lo i.e. mirror as built: hi->lo conj gives w=-hi..-lo), arc, w=lo..hi
    var full = mirror.concat(arc).concat(contour);
    var total = 0, prev = null;
    for (i = 0; i < full.length; i++) {
      var a = Math.atan2(full[i].im, full[i].re + 1);
      if (prev !== null) { var d = a - prev; while (d > PI) d -= TAU; while (d < -PI) d += TAU; total += d; }
      prev = a;
    }
    var wind = total / TAU; // counter-clockwise
    var P = roots(tf.D).filter(function (r) { return r.re > 1e-9; }).length;
    var Nclk = -Math.round(wind);
    return { pts: pts, wind: wind, N: Nclk, P: P, Z: Nclk + P };
  }
  CS.nyquist = nyquist;

  /* -------------------------------------------------------------- misc helpers */
  CS.fmt = function (x, d) {
    if (!isFinite(x)) return x > 0 ? "∞" : x < 0 ? "−∞" : "—";
    d = d == null ? 3 : d;
    var ax = Math.abs(x);
    if (ax !== 0 && (ax < 1e-3 || ax >= 1e5)) return x.toExponential(2).replace("-", "−").replace("e", "×10^").replace("+", "");
    var s = (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toString();
    return s.replace("-", "−");
  };
  CS.polyToString = function (p, v) {
    v = v || "s";
    var out = [], n = p.length - 1;
    for (var i = 0; i < p.length; i++) {
      var c = p[i], pw = n - i;
      if (Math.abs(c) < 1e-12) continue;
      var a = Math.abs(c), cs = (Math.abs(a - 1) < 1e-12 && pw > 0) ? "" : CS.fmt(a, 4);
      var term = cs + (pw > 0 ? v + (pw > 1 ? "^" + pw : "") : "");
      out.push((c < 0 ? "−" : (out.length ? "+" : "")) + (out.length ? " " : "") + term);
    }
    return out.join(" ").replace(/^−\s/, "−") || "0";
  };
  CS.D2R = D2R; CS.R2D = R2D;

  global.CS = CS;
  if (typeof module !== "undefined" && module.exports) module.exports = CS;
})(typeof window !== "undefined" ? window : globalThis);
