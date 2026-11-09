/* Precalculus labs — sequences, series, counting, probability, statistics (needs assets/precalc.js first).
     .pc-seq    arithmetic · geometric · recursive a(n+1) = p·a(n) + q                    data-type data-a1 data-d data-r data-n data-p data-q
     .pc-sum    partial sums · sigma · savings and loan annuities                           data-mode=arith|geo|sigma|annuity …
     .pc-count  n!, nPr, nCr, repetition, circular, word arrangements, Pascal row            data-n data-r data-word
     .pc-sim    coin and dice simulator (law of large numbers)                              data-exp=coin|die|sum7|six4
     .pc-binom  binomial distribution with an optional normal curve                         data-n data-p data-k data-rel
     .pc-stat   descriptive statistics, box plot, histogram, frequency table               data-data
     .pc-norm   normal distribution areas and percentiles                                   data-mu data-sigma data-mode data-a data-b data-p
     .pc-reg    scatter plot, least-squares line, r and r²                                  data-data data-x0
     .pc-dist   p-values and critical values for z, t, χ², F                                data-dist data-df1 data-df2 data-mode data-x data-alpha data-tail
     .pc-tlook  highlight a cell in the static statistical tables                           data-kind=z|grid data-table="id[,id]"  */
(function (root) {
  "use strict";
  var PC = root.PC;
  if (!PC || !PC.widget) return;
  var L = PC.L, fmt = PC.fmt, nice = PC.nice, tex = PC.tex, dl = PC.dl, C = PC.C, esc = PC.esc, D = PC.dist;

  // ---------------------------------------------------------------- sequences
  PC.widget("pc-seq", function (box) {
    return PC.make(box, { type: "arith", a1: 3, d: 2, r: 1.5, n: 12, p: 0.5, q: 4 }, [
      { k: "type", t: "sel", lab: L("ชนิดลำดับ", "Sequence type"), opts: [["arith", L("เลขคณิต aₙ = a₁ + (n − 1)d", "Arithmetic aₙ = a₁ + (n − 1)d")], ["geo", L("เรขาคณิต aₙ = a₁rⁿ⁻¹", "Geometric aₙ = a₁rⁿ⁻¹")], ["rec", L("เวียนเกิด aₙ₊₁ = p·aₙ + q", "Recursive aₙ₊₁ = p·aₙ + q")]], wide: true },
      { k: "a1", t: "range", lab: "a₁", min: -10, max: 10, step: 0.5 },
      { k: "d", t: "range", lab: L("ผลต่างร่วม d", "common difference d"), min: -5, max: 5, step: 0.5, show: "type:arith" },
      { k: "r", t: "range", lab: L("อัตราส่วนร่วม r", "common ratio r"), min: -2, max: 2.5, step: 0.05, show: "type:geo" },
      { k: "p", t: "range", lab: "p", min: -1.5, max: 1.5, step: 0.05, show: "type:rec" },
      { k: "q", t: "range", lab: "q", min: -6, max: 6, step: 0.5, show: "type:rec" },
      { k: "n", t: "range", lab: L("จำนวนพจน์ n", "number of terms n"), min: 1, max: 40, step: 1 }
    ], function (st, ui) {
      var n = Math.max(1, Math.round(st.n)), a = [], rows = [], model = null, hl = [];
      var term = st.type === "arith" ? function (k) { return st.a1 + (k - 1) * st.d; } : st.type === "geo" ? function (k) { return st.a1 * Math.pow(st.r, k - 1); } : null;
      if (term) for (var k = 1; k <= n; k++) a.push(term(k));
      else { a.push(st.a1); for (k = 2; k <= n; k++) a.push(st.p * a[k - 2] + st.q); }
      if (st.type === "arith") {
        model = { pts: PC.sample(term, 0.6, n + 0.4, 50), color: C.m, width: 1.2, dash: "4 4" };
        rows.push([L("พจน์ทั่วไป", "nth term"), tex("a_n = " + nice(st.a1) + (st.d ? (st.d > 0 ? " + " : " - ") + "(n - 1)" + (Math.abs(st.d) === 1 ? "" : "\\cdot " + nice(Math.abs(st.d))) : "") + " = " + PC.poly.tex([st.d, st.a1 - st.d], "n"))]);
        rows.push([L("พฤติกรรม", "Behavior"), st.d > 0 ? L("เพิ่มขึ้นทีละ d เท่ากัน จุดเรียงบนเส้นตรงความชัน d", "increases by d each step; the points lie on a line of slope d") : st.d < 0 ? L("ลดลงทีละ |d| เท่ากัน จุดเรียงบนเส้นตรงความชันลบ", "decreases by |d| each step; the points lie on a line of negative slope") : L("ลำดับคงตัว", "constant sequence")]);
      } else if (st.type === "geo") {
        if (st.r > 0) model = { pts: PC.sample(term, 0.6, n + 0.4, 120), color: C.m, width: 1.2, dash: "4 4" };
        rows.push([L("พจน์ทั่วไป", "nth term"), tex("a_n = " + nice(st.a1) + "\\cdot\\left(" + nice(st.r) + "\\right)^{n-1}")]);
        var ar = Math.abs(st.r);
        rows.push([L("พฤติกรรม", "Behavior"), st.r === 0 ? L("พจน์ที่ 2 เป็นต้นไปเป็นศูนย์", "zero from the second term on") : ar < 1 ? L("|r| < 1 พจน์เข้าใกล้ 0 (ลู่เข้าสู่ 0)", "|r| < 1, the terms shrink toward 0 (converges to 0)") + (st.r < 0 ? L(" โดยสลับเครื่องหมาย", ", alternating in sign") : "") : ar === 1 ? (st.r === 1 ? L("r = 1 ลำดับคงตัว", "r = 1, constant") : L("r = −1 สลับไปมาระหว่างสองค่า (ลู่ออก)", "r = −1, flips between two values (diverges)")) : L("|r| > 1 พจน์โตแบบเอกซ์โพเนนเชียล (ลู่ออก)", "|r| > 1, the terms grow exponentially (diverges)") + (st.r < 0 ? L(" และสลับเครื่องหมาย", " and alternate in sign") : "")]);
      } else {
        var p = st.p, q = st.q;
        rows.push([L("นิยาม", "Definition"), tex("a_1 = " + nice(st.a1) + ",\\quad a_{n+1} = " + nice(p) + "\\,a_n " + (q < 0 ? "- " + nice(-q) : "+ " + nice(q)))]);
        if (Math.abs(p - 1) > 1e-12) {
          var Lf = q / (1 - p);
          hl.push({ y: Lf, color: C.c, label: "L = " + fmt(Lf, 4) });
          rows.push([L("จุดตรึง", "Fixed point"), tex("L = pL + q \\Rightarrow L = \\dfrac{q}{1 - p} = " + nice(Lf))]);
          rows.push([L("สูตรปิด", "Closed form"), tex("a_n = L + (a_1 - L)\\,p^{\\,n-1} = " + nice(Lf) + " + \\left(" + nice(st.a1 - Lf) + "\\right)\\left(" + nice(p) + "\\right)^{n-1}")]);
          rows.push([L("พฤติกรรม", "Behavior"), Math.abs(p) < 1 ? L("|p| < 1 ลำดับลู่เข้าสู่ L", "|p| < 1, the sequence converges to L") : L("|p| ≥ 1 ลำดับไม่ลู่เข้า L (เว้นแต่ a₁ = L)", "|p| ≥ 1, it does not settle at L (unless a₁ = L)")]);
        } else rows.push([L("สูตรปิด", "Closed form"), tex("p = 1:\\ a_n = a_1 + (n-1)q") + L(" (เป็นลำดับเลขคณิต)", " (arithmetic)")]);
      }
      rows.push([tex("a_{" + n + "}"), "<b>" + fmt(a[n - 1], 6) + "</b>"]);
      rows.push([L("พจน์แรก ๆ", "First terms"), '<span class="pc-wrapnum">' + a.slice(0, 14).map(function (v) { return fmt(v, 4); }).join(", ") + (n > 14 ? ", …" : "") + "</span>"]);
      var fin = a.filter(isFinite), lo = Math.min.apply(null, fin.concat([0])), hi = Math.max.apply(null, fin.concat([0])), pad = Math.max(1, (hi - lo) * 0.12);
      hl.forEach(function (h) { lo = Math.min(lo, h.y); hi = Math.max(hi, h.y); });
      PC.plotIn(ui.fig, { xmin: 0, xmax: n + 1, ymin: lo - pad, ymax: hi + pad, series: model ? [model] : [], hlines: hl,
        marks: a.map(function (v, i) { return { x: i + 1, y: v, color: C.a, r: n > 25 ? 3 : 4 }; }), xlabel: "n", ylabel: "aₙ", label: "sequence plot" });
      ui.out.innerHTML = dl(rows);
    }, { title: L("แล็บลำดับ: จุด (n, aₙ)", "Sequence lab: the points (n, aₙ)"), hint: L("ลำดับคือฟังก์ชันที่มีโดเมนเป็นจำนวนนับ จึงวาดเป็นจุดไม่ต่อเนื่อง", "a sequence is a function on 1, 2, 3, …, so its graph is separate dots") });
  });

  // ---------------------------------------------------------------- series: partial sums · sigma · annuity
  PC.widget("pc-sum", function (box) {
    return PC.make(box, { mode: "geo", a1: 8, d: 3, r: 0.5, n: 10, f: "k^2", m: 1, top: 10, kind: "save", amt: 1000, rate: 3, per: "12", yrs: 5 }, [
      { k: "mode", t: "sel", lab: L("โหมด", "Mode"), opts: [["arith", L("อนุกรมเลขคณิต", "Arithmetic series")], ["geo", L("อนุกรมเรขาคณิต", "Geometric series")], ["sigma", L("ซิกมา Σ f(k)", "Sigma Σ f(k)")], ["annuity", L("เงินออม · เงินผ่อนรายงวด", "Savings · loan payments")]], wide: true },
      { k: "a1", t: "range", lab: "a₁", min: -10, max: 20, step: 0.5, show: "mode:arith|geo" },
      { k: "d", t: "range", lab: "d", min: -5, max: 5, step: 0.5, show: "mode:arith" },
      { k: "r", t: "range", lab: "r", min: -1.5, max: 2, step: 0.05, show: "mode:geo" },
      { k: "n", t: "range", lab: "n", min: 1, max: 40, step: 1, show: "mode:arith|geo" },
      { k: "f", t: "text", lab: "f(k) =", ph: "k^2", show: "mode:sigma" },
      { k: "m", t: "num", lab: L("k เริ่ม", "k from"), show: "mode:sigma" },
      { k: "top", t: "num", lab: L("ถึง", "to"), show: "mode:sigma" },
      { k: "kind", t: "sel", lab: L("ชนิด", "Kind"), opts: [["save", L("ออมเงินทุกงวด → เงินรวมปลายทาง", "save each period → future value")], ["loan", L("กู้เงิน → ค่างวดต่องวด", "borrow → payment per period")]], show: "mode:annuity", wide: true },
      { k: "amt", t: "num", lab: L("เงินต่องวด / ยอดกู้", "Payment / loan amount"), show: "mode:annuity" },
      { k: "rate", t: "num", lab: L("ดอกเบี้ยต่อปี (%)", "Annual rate (%)"), show: "mode:annuity" },
      { k: "per", t: "sel", lab: L("งวดต่อปี", "Periods per year"), opts: [["1", "1"], ["4", "4"], ["12", "12"]], show: "mode:annuity" },
      { k: "yrs", t: "num", lab: L("จำนวนปี", "Years"), show: "mode:annuity" }
    ], function (st, ui) {
      var rows = [], terms = [], sums = [], s = 0, k, hl = [];
      if (st.mode === "arith" || st.mode === "geo") {
        var n = Math.max(1, Math.round(st.n));
        for (k = 1; k <= n; k++) { var t = st.mode === "arith" ? st.a1 + (k - 1) * st.d : st.a1 * Math.pow(st.r, k - 1); terms.push(t); s += t; sums.push(s); }
        if (st.mode === "arith") {
          var an = terms[n - 1];
          rows.push([tex("S_{" + n + "}"), tex("\\dfrac{n}{2}\\left(a_1 + a_n\\right) = \\dfrac{" + n + "}{2}\\left(" + nice(st.a1) + " + " + nice(an) + "\\right) = " + nice(s))]);
          rows.push([L("อีกรูปหนึ่ง", "Same as"), tex("\\dfrac{n}{2}\\left(2a_1 + (n-1)d\\right)")]);
        } else {
          var r = st.r;
          rows.push([tex("S_{" + n + "}"), Math.abs(r - 1) < 1e-12 ? tex("n a_1 = " + nice(s)) : tex("a_1\\dfrac{1 - r^n}{1 - r} = " + nice(st.a1) + "\\cdot\\dfrac{1 - (" + nice(r) + ")^{" + n + "}}{1 - " + (r < 0 ? "(" + nice(r) + ")" : nice(r)) + "} = " + nice(s, 6))]);
          if (Math.abs(r) < 1) { var Sinf = st.a1 / (1 - r); hl.push({ y: Sinf, color: C.c, label: "S∞ = " + fmt(Sinf, 4) }); rows.push([tex("S_\\infty"), tex("\\dfrac{a_1}{1 - r} = " + nice(Sinf)) + L(" (ลู่เข้าเพราะ |r| < 1)", " (converges because |r| < 1)")]); }
          else rows.push([tex("S_\\infty"), L("ไม่มี เพราะ |r| ≥ 1 ผลบวกย่อยไม่เข้าใกล้ค่าใด", "none: |r| ≥ 1, so the partial sums do not settle")]);
        }
      } else if (st.mode === "sigma") {
        var f = PC.parse(st.f, "k"), m = Math.round(st.m), N = Math.round(st.top);
        if (!isFinite(m) || !isFinite(N) || N < m) throw new Error(L("ขอบเขตบนต้องไม่น้อยกว่าขอบเขตล่าง", "The upper limit must be at least the lower limit"));
        if (N - m > 100000) throw new Error(L("รวมได้ไม่เกิน 100,000 พจน์", "At most 100,000 terms"));
        for (k = m; k <= N; k++) { var v = f(k); s += v; if (terms.length < 60) { terms.push(v); sums.push(s); } }
        var rr = PC.rat(s, 1000, 1e-11);
        rows.push([L("ผลบวก", "Sum"), tex("\\displaystyle\\sum_{k=" + m + "}^{" + N + "} " + String(st.f).replace(/\\/g, "").replace(/\*/g, "\\cdot ") + " = " + (rr ? PC.fracTex(rr[0], rr[1]) : nice(s, 8)))]);
        rows.push([L("เขียนกระจาย", "Written out"), '<span class="pc-wrapnum">' + terms.slice(0, 6).map(function (v) { return fmt(v, 5); }).join(" + ") + (N - m + 1 > 6 ? " + … + " + fmt(f(N), 5) : "") + "</span>"]);
        rows.push([L("จำนวนพจน์", "Number of terms"), String(N - m + 1)]);
      } else {
        var P = st.amt, i = st.rate / 100 / +st.per, NN = Math.round(st.yrs * +st.per);
        if (!(P > 0) || !(NN > 0) || !(i >= 0)) throw new Error(L("ใส่จำนวนเงิน อัตรา และจำนวนปีเป็นบวก", "Enter a positive amount, rate and number of years"));
        var bal = [], b = 0;
        if (st.kind === "save") {
          var FV = i ? P * (Math.pow(1 + i, NN) - 1) / i : P * NN;
          for (k = 0; k <= NN; k++) bal.push([k / +st.per, i ? P * (Math.pow(1 + i, k) - 1) / i : P * k]);
          rows.push([L("สูตร (อนุกรมเรขาคณิต)", "Formula (geometric series)"), tex("FV = R\\left[1 + (1+i) + \\cdots + (1+i)^{N-1}\\right] = R\\,\\dfrac{(1+i)^N - 1}{i}")]);
          rows.push([L("แทนค่า", "Values"), tex("R = " + nice(P) + ",\\ i = " + nice(i, 6) + ",\\ N = " + NN)]);
          rows.push([L("เงินรวมปลายทาง", "Future value"), "<b>" + fmt(FV, 2) + "</b>"]);
          rows.push([L("เงินที่ฝากเอง · ดอกเบี้ย", "Deposited · interest"), fmt(P * NN, 2) + " · " + fmt(FV - P * NN, 2)]);
        } else {
          var R = i ? P * i / (1 - Math.pow(1 + i, -NN)) : P / NN;
          b = P; for (k = 0; k <= NN; k++) { bal.push([k / +st.per, Math.max(0, b)]); b = b * (1 + i) - R; }
          rows.push([L("สูตร", "Formula"), tex("PV = R\\,\\dfrac{1 - (1+i)^{-N}}{i} \\ \\Rightarrow\\ R = \\dfrac{PV\\cdot i}{1 - (1+i)^{-N}}")]);
          rows.push([L("แทนค่า", "Values"), tex("PV = " + nice(P) + ",\\ i = " + nice(i, 6) + ",\\ N = " + NN)]);
          rows.push([L("ค่างวดต่องวด", "Payment per period"), "<b>" + fmt(R, 2) + "</b>"]);
          rows.push([L("จ่ายรวม · ดอกเบี้ยรวม", "Total paid · total interest"), fmt(R * NN, 2) + " · " + fmt(R * NN - P, 2)]);
        }
        PC.plotIn(ui.fig, { xmin: 0, xmax: st.yrs, ymin: 0, ymax: Math.max.apply(null, bal.map(function (q) { return q[1]; })) * 1.08 || 1, series: [{ pts: bal }], xlabel: L("ปี", "years"), ylabel: st.kind === "save" ? L("ยอดออม", "savings") : L("ยอดหนี้", "balance"), label: "annuity" });
        ui.out.innerHTML = dl(rows);
        return;
      }
      var nb = terms.length, all = terms.concat(sums, hl.map(function (h) { return h.y; }), [0]);
      var lo = Math.min.apply(null, all.filter(isFinite)), hi = Math.max.apply(null, all.filter(isFinite)), pad = Math.max(0.5, (hi - lo) * 0.1);
      var x0 = st.mode === "sigma" ? Math.round(st.m) : 1;
      var bars = terms.map(function (v, j) { var x = x0 + j; return { pts: [[x - 0.32, 0], [x - 0.32, v], [x + 0.32, v], [x + 0.32, 0]], fill: "var(--signal)", op: 0.35, color: "var(--signal)", width: 1 }; });
      PC.plotIn(ui.fig, { xmin: x0 - 1, xmax: x0 + nb, ymin: Math.max(lo - pad, -1e6), ymax: Math.min(hi + pad, 1e6), polys: bars,
        series: [{ pts: sums.map(function (v, j) { return [x0 + j, v]; }), color: "var(--accent)" }], marks: sums.map(function (v, j) { return { x: x0 + j, y: v, color: "var(--accent)", r: 3 }; }),
        hlines: hl, xlabel: "k", ylabel: L("แท่ง = พจน์ · เส้น = ผลบวกย่อย", "bars = terms · line = partial sums"), label: "partial sums" });
      ui.out.innerHTML = dl(rows);
    }, { title: L("แล็บอนุกรม: พจน์และผลบวกย่อย", "Series lab: terms and partial sums"), hint: L("ในโหมดซิกมาพิมพ์ f(k) เช่น k^2, 1/(k(k+1)), 2^k", "in sigma mode type f(k) such as k^2, 1/(k(k+1)), 2^k") });
  });

  // ---------------------------------------------------------------- counting
  function bigFact(n) { var r = 1n; for (var i = 2n; i <= BigInt(n); i++) r *= i; return r; }
  function bigPerm(n, r) { var x = 1n; for (var i = 0; i < r; i++) x *= BigInt(n - i); return x; }
  function bigComb(n, r) { if (r < 0 || r > n) return 0n; r = Math.min(r, n - r); var x = 1n; for (var i = 1; i <= r; i++) x = x * BigInt(n - r + i) / BigInt(i); return x; }
  function grp(b) { return b.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  PC.big = { fact: bigFact, perm: bigPerm, comb: bigComb };
  PC.widget("pc-count", function (box) {
    return PC.make(box, { n: 8, r: 3, word: "BANANA" }, [
      { k: "n", t: "num", lab: L("n (จำนวนสิ่งของ)", "n (items)") },
      { k: "r", t: "num", lab: L("r (จำนวนที่เลือก)", "r (chosen)") },
      { k: "word", t: "text", lab: L("คำที่จะเรียงตัวอักษร", "Word to rearrange") }
    ], function (st, ui) {
      var n = Math.round(st.n), r = Math.round(st.r);
      if (!(n >= 0) || n > 200 || !(r >= 0)) throw new Error(L("ใช้ 0 ≤ n ≤ 200 และ r ≥ 0", "Use 0 ≤ n ≤ 200 and r ≥ 0"));
      var rows = [];
      rows.push([tex("n!"), grp(bigFact(n))]);
      rows.push([L("เรียงสับเปลี่ยน ", "Permutations ") + tex("P(n,r) = \\dfrac{n!}{(n-r)!}"), r > n ? "0" : grp(bigPerm(n, r))]);
      rows.push([L("จัดหมู่ ", "Combinations ") + tex("\\dbinom{n}{r} = \\dfrac{n!}{r!(n-r)!}"), grp(bigComb(n, r))]);
      rows.push([L("เลือกซ้ำได้และสนใจลำดับ ", "With repetition, order matters ") + tex("n^r"), r > 400 ? "—" : grp(BigInt(n) ** BigInt(r))]);
      rows.push([L("เลือกซ้ำได้ ไม่สนใจลำดับ ", "With repetition, order ignored ") + tex("\\dbinom{n+r-1}{r}"), grp(bigComb(n + r - 1, r))]);
      rows.push([L("เรียงเป็นวงกลม ", "Around a circle ") + tex("(n-1)!"), n ? grp(bigFact(n - 1)) : "—"]);
      var w = String(st.word || "").replace(/\s+/g, "");
      if (w) {
        var chars = Array.from(w), cnt = {}; chars.forEach(function (c) { cnt[c] = (cnt[c] || 0) + 1; });
        var den = 1n, parts = []; Object.keys(cnt).forEach(function (c) { den *= bigFact(cnt[c]); if (cnt[c] > 1) parts.push(c + " " + cnt[c] + "!"); });
        rows.push([L("เรียงตัวอักษรของ ", "Arrangements of ") + esc(w), tex("\\dfrac{" + chars.length + "!}{" + (parts.length ? parts.map(function (p) { return p.split(" ")[1]; }).join("\\,") : "1") + "}") + " = <b>" + grp(bigFact(chars.length) / den) + "</b>" + (parts.length ? " <small>(" + L("ซ้ำ: ", "repeats: ") + esc(parts.join(", ")) + ")</small>" : "")]);
      }
      var html = dl(rows);
      if (n <= 14) {
        var row = []; for (var k = 0; k <= n; k++) row.push(bigComb(n, k));
        html += '<p class="pc-note">' + L("แถวที่ n ของสามเหลี่ยมปาสกาล = สัมประสิทธิ์ของ ", "Row n of Pascal's triangle = coefficients of ") + tex("(a + b)^{" + n + "}") + "</p><p class=\"pc-wrapnum mono\">" + row.map(grp).join("&nbsp; ") + "</p>";
        if (n <= 8) html += '<div class="pc-tw">' + tex("(a+b)^{" + n + "} = " + row.map(function (c, k) { var pa = n - k, pb = k; return (c === 1n ? "" : c.toString()) + (pa ? "a" + (pa > 1 ? "^{" + pa + "}" : "") : "") + (pb ? "b" + (pb > 1 ? "^{" + pb + "}" : "") : "") || "1"; }).join(" + "), true) + "</div>";
      }
      ui.out.innerHTML = html;
    }, { title: L("เครื่องคิดเลขการนับ", "Counting calculator"), hint: L("ตัวเลขแม่นตรงทุกหลัก (BigInt)", "exact to every digit (BigInt)"), noFig: true });
  });

  // ---------------------------------------------------------------- probability simulator
  PC.widget("pc-sim", function (box) {
    var EXP = {
      coin: { lab: L("โยนเหรียญ: ได้หัว", "Coin: heads"), p: 0.5, run: function () { return Math.random() < 0.5; }, show: function (h) { return h ? "H" : "T"; } },
      die: { lab: L("ทอยลูกเต๋า: ได้ 6", "Die: a six"), p: 1 / 6, run: function () { var v = 1 + Math.floor(Math.random() * 6); this.last = v; return v === 6; }, show: function () { return String(this.last); } },
      sum7: { lab: L("ทอยลูกเต๋า 2 ลูก: ผลรวม 7", "Two dice: sum is 7"), p: 1 / 6, run: function () { var a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6); this.last = a + "+" + b; return a + b === 7; }, show: function () { return this.last; } },
      six4: { lab: L("ทอย 4 ครั้ง: ได้ 6 อย่างน้อยหนึ่งครั้ง", "Four rolls: at least one six"), p: 1 - Math.pow(5 / 6, 4), run: function () { var hit = false, s = ""; for (var i = 0; i < 4; i++) { var v = 1 + Math.floor(Math.random() * 6); s += v; if (v === 6) hit = true; } this.last = s; return hit; }, show: function () { return this.last; } }
    };
    var st = PC.attrs(box, { exp: "coin" }), N = 0, H = 0, path = [], last = [];
    PC.head(box, L("เครื่องจำลองความน่าจะเป็น", "Probability simulator"), L("ความถี่สัมพัทธ์เข้าใกล้ความน่าจะเป็นเมื่อทดลองมากครั้ง", "relative frequency approaches the probability as trials grow"));
    var ctl = PC.controls(box, [{ k: "exp", t: "sel", lab: L("การทดลอง", "Experiment"), opts: Object.keys(EXP).map(function (k) { return [k, EXP[k].lab]; }), wide: true }], st, function () { reset(); });
    var bar = PC.part(box, "pc-btns");
    bar.innerHTML = [1, 10, 100, 1000].map(function (k) { return '<button type="button" class="btn btn-ghost btn-sm" data-k="' + k + '">+' + k + "</button>"; }).join("") + '<button type="button" class="btn btn-ghost btn-sm" data-k="0">' + L("เริ่มใหม่", "Reset") + "</button>";
    var fig = PC.part(box, "pc-fig"), out = PC.part(box, "pc-out");
    bar.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; var k = +b.getAttribute("data-k"); if (!k) reset(); else run(k); });
    function reset() { N = 0; H = 0; path = []; last = []; render(); }
    function run(k) { var E = EXP[st.exp]; for (var i = 0; i < k; i++) { var h = E.run(); N++; if (h) H++; if (last.length > 11) last.shift(); last.push(E.show(h)); if (N <= 50 || N % Math.ceil(N / 400) === 0) path.push([N, H / N]); } render(); }
    function render() {
      var E = EXP[st.exp];
      PC.plotIn(fig, { xmin: 0, xmax: Math.max(10, N), ymin: 0, ymax: 1, series: [{ pts: path, color: "var(--accent)" }], hlines: [{ y: E.p, color: C.b, label: "P = " + fmt(E.p, 4) }], xlabel: L("จำนวนครั้ง", "trials"), ylabel: L("ความถี่สัมพัทธ์", "relative frequency"), label: "simulation" });
      out.innerHTML = dl([[L("ทดลอง", "Trials"), String(N)], [L("เกิดเหตุการณ์", "Successes"), String(H)], [L("ความถี่สัมพัทธ์", "Relative frequency"), N ? fmt(H / N, 4) : "—"], [L("ความน่าจะเป็นทางทฤษฎี", "Theoretical probability"), fmt(E.p, 4)], [L("ผลล่าสุด", "Latest outcomes"), last.join(" · ") || "—"]]);
    }
    render();
    return { render: render, set: function (o) { st.exp = o.exp || st.exp; ctl.sync(); reset(); } };
  });

  // ---------------------------------------------------------------- binomial distribution
  PC.widget("pc-binom", function (box) {
    return PC.make(box, { n: 10, p: 0.5, k: 3, k2: 7, rel: "le", norm: false }, [
      { k: "n", t: "range", lab: L("จำนวนครั้ง n", "trials n"), min: 1, max: 60, step: 1 },
      { k: "p", t: "range", lab: L("ความน่าจะเป็นสำเร็จ p", "success probability p"), min: 0, max: 1, step: 0.01 },
      { k: "rel", t: "sel", lab: L("เหตุการณ์", "Event"), opts: [["eq", "P(X = k)"], ["le", "P(X ≤ k)"], ["lt", "P(X < k)"], ["ge", "P(X ≥ k)"], ["gt", "P(X > k)"], ["bt", "P(k ≤ X ≤ k₂)"]] },
      { k: "k", t: "num", lab: "k" }, { k: "k2", t: "num", lab: "k₂", show: "rel:bt" },
      { k: "norm", t: "chk", lab: L("วางโค้งปกติประมาณ N(np, np(1 − p))", "overlay the normal approximation N(np, np(1 − p))") }
    ], function (st, ui) {
      var n = Math.round(st.n), p = Math.min(1, Math.max(0, st.p)), k = Math.round(st.k), k2 = Math.round(st.k2), sel = function (x) {
        return st.rel === "eq" ? x === k : st.rel === "le" ? x <= k : st.rel === "lt" ? x < k : st.rel === "ge" ? x >= k : st.rel === "gt" ? x > k : x >= Math.min(k, k2) && x <= Math.max(k, k2);
      };
      var pm = [], P = 0, mx = 0;
      for (var x = 0; x <= n; x++) { var v = D.binomPMF(x, n, p); pm.push(v); mx = Math.max(mx, v); if (sel(x)) P += v; }
      var polys = pm.map(function (v, x) { return { pts: [[x - 0.4, 0], [x - 0.4, v], [x + 0.4, v], [x + 0.4, 0]], fill: sel(x) ? "var(--accent)" : "var(--signal)", op: sel(x) ? 0.75 : 0.3, color: sel(x) ? "var(--accent)" : "var(--signal)", width: 1 }; });
      var mu = n * p, sd = Math.sqrt(n * p * (1 - p)), series = [];
      if (st.norm && sd > 0) series.push({ pts: PC.sample(function (t) { return D.phi((t - mu) / sd) / sd; }, -0.5, n + 0.5, 300), color: C.c, width: 1.8 });
      PC.plotIn(ui.fig, { xmin: -0.8, xmax: n + 0.8, ymin: 0, ymax: mx * 1.15 || 1, polys: polys, series: series, vlines: [{ x: mu, color: C.m, label: "μ = " + fmt(mu, 3) }], xlabel: "x", ylabel: "P(X = x)", label: "binomial distribution" });
      var lab = { eq: "P(X = " + k + ")", le: "P(X \\le " + k + ")", lt: "P(X < " + k + ")", ge: "P(X \\ge " + k + ")", gt: "P(X > " + k + ")", bt: "P(" + Math.min(k, k2) + " \\le X \\le " + Math.max(k, k2) + ")" }[st.rel];
      var rows = [[L("สูตร", "Formula"), tex("P(X = x) = \\dbinom{" + n + "}{x}(" + nice(p) + ")^{x}(" + nice(1 - p) + ")^{" + n + " - x}")],
        [tex(lab), "<b>" + fmt(P, 6) + "</b> (" + fmt(P * 100, 3) + "%)"],
        [L("ค่าคาดหมาย · ความแปรปรวน", "Mean · variance"), tex("\\mu = np = " + nice(mu) + ",\\quad \\sigma^2 = np(1-p) = " + nice(n * p * (1 - p)))],
        [L("ส่วนเบี่ยงเบนมาตรฐาน", "Standard deviation"), tex("\\sigma = " + nice(sd, 4))]];
      if (st.norm) rows.push([L("เงื่อนไขประมาณด้วยโค้งปกติ", "Normal approximation check"), (n * p >= 5 && n * (1 - p) >= 5) ? L("np ≥ 5 และ n(1 − p) ≥ 5 จึงประมาณได้ดี (ใช้การปรับแก้ความต่อเนื่อง ±0.5)", "np ≥ 5 and n(1 − p) ≥ 5, so the approximation is good (use the ±0.5 continuity correction)") : L("np หรือ n(1 − p) น้อยกว่า 5 การประมาณยังไม่ดี", "np or n(1 − p) is below 5, the approximation is poor")]);
      ui.out.innerHTML = dl(rows);
    }, { title: L("การแจกแจงทวินาม B(n, p)", "Binomial distribution B(n, p)"), hint: L("แท่งสีส้ม = ค่า x ที่อยู่ในเหตุการณ์", "orange bars = values of x in the event") });
  });

  // ---------------------------------------------------------------- descriptive statistics
  PC.widget("pc-stat", function (box) {
    return PC.make(box, { data: "62 71 75 58 80 77 69 73 85 66 71 90 54 78 71 68 74 82 63 76", bins: "auto" }, [
      { k: "data", t: "area", lab: L("ข้อมูล (คั่นด้วยช่องว่าง จุลภาค หรือขึ้นบรรทัดใหม่)", "Data (separated by spaces, commas or new lines)"), wide: true, rows: 3 },
      { k: "bins", t: "sel", lab: L("จำนวนชั้นของฮิสโทแกรม", "Histogram classes"), opts: [["auto", L("อัตโนมัติ (สเตอร์เจส)", "automatic (Sturges)")], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["10", "10"]] }
    ], function (st, ui) {
      var xs = PC.stat.parse(st.data);
      if (xs.length < 2) throw new Error(L("ใส่ข้อมูลอย่างน้อย 2 ค่า", "Enter at least 2 values"));
      var S = PC.stat.describe(xs), n = S.n;
      var k = st.bins === "auto" ? Math.max(3, Math.min(12, Math.ceil(1 + 3.322 * Math.log10(n)))) : +st.bins;
      var w0 = (S.max - S.min) / k || 1, wexp = Math.pow(10, Math.floor(Math.log10(w0))), w = Math.ceil(w0 / wexp * 2) / 2 * wexp;
      if (w * k <= S.max - S.min) w += wexp / 2;
      var start = Math.floor(S.min / wexp) * wexp, freq = [];
      for (var i = 0; i < k; i++) freq.push(0);
      xs.forEach(function (v) { var j = Math.min(k - 1, Math.floor((v - start) / w + 1e-9)); freq[j]++; });
      while (freq.length > 1 && freq[freq.length - 1] === 0) { freq.pop(); k--; }
      // figure: histogram on top, box plot below (one SVG)
      var W = Math.round(Math.max(260, Math.min(720, ui.fig.clientWidth || 600))), Hh = Math.round(Math.max(150, Math.min(220, W * 0.36))), Hb = 70, Lm = 34, R = 12, T = 10, H = Hh + Hb + 26;
      var x0 = Math.min(start, S.min), x1 = Math.max(start + w * k, S.max), sx = function (v) { return Lm + (v - x0) / (x1 - x0) * (W - Lm - R); }, fmax = Math.max.apply(null, freq);
      var sy = function (f) { return T + Hh - 10 - f / fmax * (Hh - 24); };
      var svg = '<svg class="pc-plot" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="histogram and box plot"><g class="pc-grid">';
      for (var f = 0; f <= fmax; f += Math.max(1, Math.ceil(fmax / 5))) svg += '<line x1="' + Lm + '" x2="' + (W - R) + '" y1="' + sy(f).toFixed(1) + '" y2="' + sy(f).toFixed(1) + '"/>';
      svg += '</g><g class="pc-tick">';
      for (f = 0; f <= fmax; f += Math.max(1, Math.ceil(fmax / 5))) svg += '<text x="' + (Lm - 5) + '" y="' + (sy(f) + 4).toFixed(1) + '" text-anchor="end">' + f + "</text>";
      svg += "</g>";
      freq.forEach(function (fq, j) {
        var a = sx(start + j * w), b = sx(start + (j + 1) * w);
        svg += '<rect x="' + (a + 0.5).toFixed(1) + '" y="' + sy(fq).toFixed(1) + '" width="' + Math.max(0, b - a - 1).toFixed(1) + '" height="' + (sy(0) - sy(fq)).toFixed(1) + '" fill="var(--signal)" fill-opacity="0.35" stroke="var(--signal)"/>';
        if (fq) svg += '<text class="pc-ann" x="' + ((a + b) / 2).toFixed(1) + '" y="' + (sy(fq) - 3).toFixed(1) + '" text-anchor="middle">' + fq + "</text>";
      });
      var by = T + Hh + 30;
      svg += '<line class="pc-axis" x1="' + Lm + '" x2="' + (W - R) + '" y1="' + (sy(0)).toFixed(1) + '" y2="' + sy(0).toFixed(1) + '"/>';
      svg += '<line stroke="var(--ink-2)" stroke-width="1.5" x1="' + sx(S.whiskerLo).toFixed(1) + '" x2="' + sx(S.q1).toFixed(1) + '" y1="' + by + '" y2="' + by + '"/><line stroke="var(--ink-2)" stroke-width="1.5" x1="' + sx(S.q3).toFixed(1) + '" x2="' + sx(S.whiskerHi).toFixed(1) + '" y1="' + by + '" y2="' + by + '"/>';
      svg += '<rect x="' + sx(S.q1).toFixed(1) + '" y="' + (by - 16) + '" width="' + (sx(S.q3) - sx(S.q1)).toFixed(1) + '" height="32" fill="var(--accent)" fill-opacity="0.18" stroke="var(--accent)" stroke-width="1.6"/>';
      svg += '<line stroke="var(--accent)" stroke-width="2.6" x1="' + sx(S.median).toFixed(1) + '" x2="' + sx(S.median).toFixed(1) + '" y1="' + (by - 16) + '" y2="' + (by + 16) + '"/>';
      [S.whiskerLo, S.whiskerHi].forEach(function (v) { svg += '<line stroke="var(--ink-2)" stroke-width="1.5" x1="' + sx(v).toFixed(1) + '" x2="' + sx(v).toFixed(1) + '" y1="' + (by - 9) + '" y2="' + (by + 9) + '"/>'; });
      S.outliers.forEach(function (v) { svg += '<circle cx="' + sx(v).toFixed(1) + '" cy="' + by + '" r="4" fill="none" stroke="#c43c3c" stroke-width="2"/>'; });
      svg += '<circle cx="' + sx(S.mean).toFixed(1) + '" cy="' + by + '" r="3.5" fill="var(--ok)"/>';
      svg += '<g class="pc-tick">' + PC.niceTicks(x0, x1, Math.max(3, Math.round(W / 80))).map(function (t) { return '<text x="' + sx(t).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle">' + fmt(t, 3) + "</text>"; }).join("") + "</g></svg>";
      ui.fig.innerHTML = svg;
      var rows = [[L("จำนวนข้อมูล n · ผลรวม", "n · sum"), n + " · " + fmt(S.sum, 4)],
        [L("ค่าเฉลี่ยเลขคณิต", "Mean"), tex("\\bar{x} = \\dfrac{\\sum x_i}{n} = \\dfrac{" + fmt(S.sum, 6).replace(/,/g, "{,}").replace(/−/g, "-") + "}{" + n + "} = " + fmt(S.mean, 4).replace(/,/g, "{,}").replace(/−/g, "-"))],
        [L("มัธยฐาน", "Median"), fmt(S.median, 4)],
        [L("ฐานนิยม", "Mode"), S.modes.length ? S.modes.map(function (v) { return fmt(v); }).join(", ") + L(" (ซ้ำ ", " (appears ") + S.modeCount + L(" ครั้ง)", " times)") : L("ไม่มี (ไม่มีค่าซ้ำ)", "none (no value repeats)")],
        [L("ต่ำสุด · สูงสุด · พิสัย", "Min · max · range"), fmt(S.min) + " · " + fmt(S.max) + " · " + fmt(S.range)],
        [L("ควอร์ไทล์ (ตำแหน่ง r(n+1)/4)", "Quartiles (position r(n+1)/4)"), "Q₁ = " + fmt(S.q1, 4) + " · Q₂ = " + fmt(S.median, 4) + " · Q₃ = " + fmt(S.q3, 4)],
        [L("พิสัยระหว่างควอร์ไทล์", "Interquartile range"), "IQR = " + fmt(S.iqr, 4) + L(" · รั้วค่าผิดปกติ ", " · outlier fences ") + fmt(S.fenceLo, 4) + " , " + fmt(S.fenceHi, 4)],
        [L("ค่าผิดปกติ", "Outliers"), S.outliers.length ? S.outliers.map(function (v) { return fmt(v); }).join(", ") : L("ไม่มี", "none")],
        [L("ส่วนเบี่ยงเบนมาตรฐานประชากร", "Population SD"), tex("\\sigma = \\sqrt{\\tfrac{\\sum (x_i - \\mu)^2}{N}} = " + nice(S.sdP, 4))],
        [L("ส่วนเบี่ยงเบนมาตรฐานตัวอย่าง", "Sample SD"), tex("s = \\sqrt{\\tfrac{\\sum (x_i - \\bar{x})^2}{n - 1}} = " + nice(S.sdS, 4))],
        [L("ความแปรปรวน", "Variance"), "σ² = " + fmt(S.varP, 4) + " · s² = " + fmt(S.varS, 4)],
        [L("ส่วนเบี่ยงเบนเฉลี่ย · สัมประสิทธิ์การแปรผัน", "Mean absolute deviation · CV"), fmt(S.mad, 4) + " · " + fmt(S.sdS / S.mean * 100, 3) + "%"]];
      var ft = '<div class="pc-tw"><table class="pc-mini"><thead><tr><th>' + L("ชั้น", "Class") + "</th><th>" + L("ความถี่", "f") + "</th><th>" + L("ความถี่สัมพัทธ์", "Rel. f") + "</th><th>" + L("ความถี่สะสม", "Cum. f") + "</th></tr></thead><tbody>", cum = 0;
      freq.forEach(function (fq, j) { cum += fq; ft += "<tr><td>" + fmt(start + j * w, 4) + " – " + fmt(start + (j + 1) * w, 4) + "</td><td>" + fq + "</td><td>" + fmt(fq / n, 3) + "</td><td>" + cum + "</td></tr>"; });
      ft += "</tbody></table></div><p class=\"pc-note\">" + L("ชั้นรวมค่าขอบซ้าย ไม่รวมค่าขอบขวา (ยกเว้นชั้นสุดท้าย) · จุดเขียวในแผนภาพกล่อง = ค่าเฉลี่ย · วงกลมแดง = ค่าผิดปกติ", "classes include the left end, not the right (except the last) · green dot on the box plot = mean · red ring = outlier") + "</p>";
      ui.out.innerHTML = dl(rows) + ft + '<p class="pc-note">' + L("ข้อมูลเรียงแล้ว: ", "Sorted: ") + '<span class="pc-wrapnum">' + S.sorted.map(function (v) { return fmt(v); }).join(", ") + "</span></p>";
    }, { title: L("เครื่องคิดเลขสถิติ + ฮิสโทแกรม + แผนภาพกล่อง", "Statistics calculator + histogram + box plot"), hint: L("วางข้อมูลจากสเปรดชีตได้", "paste a column from a spreadsheet") });
  });

  // ---------------------------------------------------------------- normal distribution
  PC.widget("pc-norm", function (box) {
    return PC.make(box, { mu: 70, sigma: 8, mode: "bt", a: 62, b: 86, p: 0.9 }, [
      { k: "mu", t: "num", lab: L("ค่าเฉลี่ย μ", "Mean μ") }, { k: "sigma", t: "num", lab: L("ส่วนเบี่ยงเบนมาตรฐาน σ", "Standard deviation σ") },
      { k: "mode", t: "sel", lab: L("คำถาม", "Question"), opts: [["lt", "P(X < a)"], ["gt", "P(X > a)"], ["bt", "P(a < X < b)"], ["out", "P(X < a or X > b)"], ["inv", L("หา x จากพื้นที่ทางซ้าย p", "x with left area p")]] },
      { k: "a", t: "num", lab: "a", show: "mode:lt|gt|bt|out" }, { k: "b", t: "num", lab: "b", show: "mode:bt|out" }, { k: "p", t: "num", lab: "p", show: "mode:inv" }
    ], function (st, ui) {
      var mu = st.mu, s = st.sigma;
      if (!(s > 0)) throw new Error(L("σ ต้องเป็นบวก", "σ must be positive"));
      var z = function (x) { return (x - mu) / s; }, pdf = function (x) { return D.phi(z(x)) / s; }, x0 = mu - 4 * s, x1 = mu + 4 * s, areas = [], P, rows = [], xs = [];
      var shade = function (lo, hi) { lo = Math.max(lo, x0); hi = Math.min(hi, x1); if (hi > lo) areas.push({ pts: PC.sample(pdf, lo, hi, 120), color: "var(--accent)", op: 0.35 }); };
      if (st.mode === "inv") {
        if (!(st.p > 0 && st.p < 1)) throw new Error(L("p ต้องอยู่ระหว่าง 0 ถึง 1", "p must be between 0 and 1"));
        var zz = D.invPhi(st.p), xv = mu + zz * s; shade(x0, xv); xs = [xv];
        rows.push([L("ขั้นที่ 1", "Step 1"), tex("\\Phi(z) = " + nice(st.p) + " \\Rightarrow z = " + fmt(zz, 4).replace(/−/g, "-"))]);
        rows.push([L("ขั้นที่ 2", "Step 2"), tex("x = \\mu + z\\sigma = " + nice(mu) + " + (" + fmt(zz, 4).replace(/−/g, "-") + ")(" + nice(s) + ") = " + fmt(xv, 4).replace(/−/g, "-"))]);
        rows.push([L("แปลว่า", "Meaning"), L("ข้อมูลประมาณ " + fmt(st.p * 100, 3) + "% มีค่าน้อยกว่า " + fmt(xv, 4) + " (เปอร์เซ็นไทล์ที่ " + fmt(st.p * 100, 3) + ")", "about " + fmt(st.p * 100, 3) + "% of values lie below " + fmt(xv, 4) + " (the " + fmt(st.p * 100, 3) + "th percentile)")]);
      } else {
        var a = st.a, b = st.b, za = z(a), zb = z(b);
        if (st.mode === "lt") { P = D.Phi(za); shade(x0, a); xs = [a]; rows.push([tex("P(X < " + nice(a) + ")"), tex("P\\left(Z < \\tfrac{" + nice(a) + " - " + nice(mu) + "}{" + nice(s) + "}\\right) = \\Phi(" + fmt(za, 4).replace(/−/g, "-") + ")")]); }
        else if (st.mode === "gt") { P = 1 - D.Phi(za); shade(a, x1); xs = [a]; rows.push([tex("P(X > " + nice(a) + ")"), tex("1 - \\Phi(" + fmt(za, 4).replace(/−/g, "-") + ")")]); }
        else if (st.mode === "bt") { if (b < a) { var t = a; a = b; b = t; t = za; za = zb; zb = t; } P = D.Phi(zb) - D.Phi(za); shade(a, b); xs = [a, b]; rows.push([tex("P(" + nice(a) + " < X < " + nice(b) + ")"), tex("\\Phi(" + fmt(zb, 4).replace(/−/g, "-") + ") - \\Phi(" + fmt(za, 4).replace(/−/g, "-") + ")")]); }
        else { if (b < a) { var u = a; a = b; b = u; u = za; za = zb; zb = u; } P = D.Phi(za) + 1 - D.Phi(zb); shade(x0, a); shade(b, x1); xs = [a, b]; rows.push([L("สองหาง", "Two tails"), tex("\\Phi(" + fmt(za, 4).replace(/−/g, "-") + ") + 1 - \\Phi(" + fmt(zb, 4).replace(/−/g, "-") + ")")]); }
        rows.push([L("ค่า z", "z-values"), (st.mode === "bt" || st.mode === "out") ? "z₁ = " + fmt(za, 4) + " · z₂ = " + fmt(zb, 4) : "z = " + fmt(za, 4)]);
        rows.push([L("ความน่าจะเป็น", "Probability"), "<b>" + fmt(P, 4) + "</b> (" + fmt(P * 100, 2) + "%)"]);
      }
      var xt = []; for (var k = -3; k <= 3; k++) xt.push([mu + k * s, fmt(mu + k * s, 3)]);
      PC.plotIn(ui.fig, { xmin: x0, xmax: x1, ymin: 0, ymax: D.phi(0) / s * 1.15, xt: xt, areas: areas, series: [{ pts: PC.sample(pdf, x0, x1, 300), color: "var(--signal)" }],
        vlines: xs.map(function (x) { return { x: x, color: "var(--accent)", label: "z = " + fmt(z(x), 2) }; }), xlabel: "x", label: "normal curve" });
      rows.push([L("กฎ 68–95–99.7", "68–95–99.7 rule"), "μ ± σ: " + fmt(mu - s, 4) + "–" + fmt(mu + s, 4) + " · μ ± 2σ: " + fmt(mu - 2 * s, 4) + "–" + fmt(mu + 2 * s, 4)]);
      ui.out.innerHTML = dl(rows);
    }, { title: L("พื้นที่ใต้เส้นโค้งปกติ N(μ, σ²)", "Areas under the normal curve N(μ, σ²)"), hint: L("ส่วนที่ระบายสีคือความน่าจะเป็น", "the shaded area is the probability") });
  });

  // ---------------------------------------------------------------- regression
  PC.widget("pc-reg", function (box) {
    return PC.make(box, { data: "1 52\n2 55\n3 61\n4 64\n5 70\n6 71\n7 78\n8 80", x0: 10 }, [
      { k: "data", t: "area", lab: L("คู่ x y (บรรทัดละคู่)", "x y pairs (one pair per line)"), wide: true, rows: 4 },
      { k: "x0", t: "num", lab: L("พยากรณ์ y ที่ x =", "Predict y at x =") }
    ], function (st, ui) {
      var xs = [], ys = [];
      String(st.data).split(/\n+/).forEach(function (line) { var v = PC.stat.parse(line); if (v.length >= 2) { xs.push(v[0]); ys.push(v[1]); } });
      if (xs.length < 3) throw new Error(L("ใส่อย่างน้อย 3 คู่", "Enter at least 3 pairs"));
      var R = PC.stat.regress(xs, ys);
      if (!isFinite(R.slope)) throw new Error(L("ค่า x ทุกตัวเท่ากัน หาเส้นตรงไม่ได้", "All x values are equal; no line can be fitted"));
      var lo = Math.min.apply(null, xs.concat([st.x0])), hi = Math.max.apply(null, xs.concat([st.x0])), pad = (hi - lo) * 0.08 || 1;
      var yl = Math.min.apply(null, ys), yh = Math.max.apply(null, ys), yp = (yh - yl) * 0.15 || 1, yhat = R.icpt + R.slope * st.x0;
      PC.plotIn(ui.fig, { xmin: lo - pad, xmax: hi + pad, ymin: Math.min(yl, yhat) - yp, ymax: Math.max(yh, yhat) + yp,
        segs: xs.map(function (x, i) { return { x1: x, y1: ys[i], x2: x, y2: R.icpt + R.slope * x, color: "var(--ink-3)", width: 1, dash: "2 3" }; }),
        series: [{ pts: [[lo - pad, R.icpt + R.slope * (lo - pad)], [hi + pad, R.icpt + R.slope * (hi + pad)]], color: "var(--accent)" }],
        marks: xs.map(function (x, i) { return { x: x, y: ys[i], color: "var(--signal)", r: 4 }; }).concat(isFinite(st.x0) ? [{ x: st.x0, y: yhat, color: C.c, label: "ŷ = " + fmt(yhat, 4) }] : []), xlabel: "x", ylabel: "y", label: "scatter plot with regression line" });
      var r = R.r, ar = Math.abs(r);
      ui.out.innerHTML = dl([[L("เส้นถดถอย", "Regression line"), tex("\\hat{y} = " + nice(R.icpt, 4) + (R.slope < 0 ? " - " : " + ") + nice(Math.abs(R.slope), 4) + "x")],
        [L("ความชัน · จุดตัด", "Slope · intercept"), tex("b = \\dfrac{S_{xy}}{S_{xx}} = \\dfrac{" + nice(R.Sxy, 4) + "}{" + nice(R.Sxx, 4) + "},\\quad a = \\bar{y} - b\\bar{x}")],
        [L("สัมประสิทธิ์สหสัมพันธ์", "Correlation coefficient"), tex("r = \\dfrac{S_{xy}}{\\sqrt{S_{xx}S_{yy}}} = " + fmt(r, 4).replace(/−/g, "-")) + " · " + (ar >= 0.8 ? L("สัมพันธ์เชิงเส้นสูง", "strong linear relation") : ar >= 0.5 ? L("ปานกลาง", "moderate") : ar >= 0.3 ? L("ต่ำ", "weak") : L("แทบไม่สัมพันธ์เชิงเส้น", "little linear relation")) + (r > 0 ? L(" ทางบวก", ", positive") : L(" ทางลบ", ", negative"))],
        [tex("r^2"), fmt(r * r, 4) + L(" = สัดส่วนความแปรผันของ y ที่เส้นตรงอธิบายได้", " = share of the variation in y explained by the line")],
        [L("ผลรวมที่ใช้", "Sums used"), "n = " + R.n + ", Σx = " + fmt(R.sx, 4) + ", Σy = " + fmt(R.sy, 4) + ", Σxy = " + fmt(R.sxy, 4) + ", Σx² = " + fmt(R.sxx, 4) + ", Σy² = " + fmt(R.syy, 4)],
        [L("พยากรณ์", "Prediction"), isFinite(st.x0) ? tex("\\hat{y}(" + nice(st.x0) + ") = " + nice(yhat, 4)) + (st.x0 < Math.min.apply(null, xs) || st.x0 > Math.max.apply(null, xs) ? L(" (นอกช่วงข้อมูล ระวังการพยากรณ์เกินช่วง)", " (outside the data: extrapolation, use with care)") : "") : "—"]]);
    }, { title: L("แผนภาพการกระจายและเส้นถดถอย", "Scatter plot and regression line"), hint: L("เส้นประ = ส่วนเหลือ (residual) ที่ถูกทำให้ผลรวมกำลังสองน้อยที่สุด", "dotted = residuals whose sum of squares is minimised") });
  });

  // ---------------------------------------------------------------- distribution calculator (z, t, χ², F)
  PC.widget("pc-dist", function (box) {
    return PC.make(box, { dist: "z", df1: 10, df2: 20, mode: "p", x: "1.96", alpha: "0.05", tail: "two" }, [
      { k: "dist", t: "sel", lab: L("การแจกแจง", "Distribution"), opts: [["z", L("ปกติมาตรฐาน Z", "Standard normal Z")], ["t", "Student t"], ["chi", L("ไคกำลังสอง χ²", "Chi-square χ²")], ["F", "F"]] },
      { k: "df1", t: "num", lab: L("องศาอิสระ df (df₁)", "degrees of freedom df (df₁)"), show: "dist:t|chi|F" },
      { k: "df2", t: "num", lab: "df₂", show: "dist:F" },
      { k: "mode", t: "sel", lab: L("ต้องการ", "Find"), opts: [["p", L("ค่า p จากค่าสถิติ", "p-value from a statistic")], ["crit", L("ค่าวิกฤตจาก α", "critical value from α")]] },
      { k: "x", t: "text", lab: L("ค่าสถิติ", "Statistic"), show: "mode:p" },
      { k: "alpha", t: "text", lab: "α", show: "mode:crit" },
      { k: "tail", t: "sel", lab: L("หาง", "Tail"), opts: [["two", L("สองหาง", "two-tailed")], ["right", L("หางขวา", "right tail")], ["left", L("หางซ้าย", "left tail")]] }
    ], function (st, ui) {
      var d = st.dist, v1 = st.df1 === Infinity || String(st.df1) === "Infinity" ? Infinity : Math.round(st.df1), v2 = Math.round(st.df2);
      if (d !== "z" && !(v1 >= 1)) throw new Error(L("องศาอิสระต้องเป็นจำนวนเต็มบวก", "Degrees of freedom must be a positive whole number"));
      if (d === "F" && !(v2 >= 1)) throw new Error(L("df₂ ต้องเป็นจำนวนเต็มบวก", "df₂ must be a positive whole number"));
      var cdf, pdf, inv, sym = d === "z" || d === "t", name;
      if (d === "z") { cdf = D.Phi; pdf = D.phi; inv = D.invPhi; name = "Z"; }
      else if (d === "t") { cdf = function (x) { return D.tCDF(x, v1); }; pdf = function (x) { return D.tPDF(x, v1); }; inv = function (p) { return D.tInv(p, v1); }; name = "t_{" + v1 + "}"; }
      else if (d === "chi") { cdf = function (x) { return D.chi2CDF(x, v1); }; pdf = function (x) { return D.chi2PDF(x, v1); }; inv = function (p) { return D.chi2Inv(p, v1); }; name = "\\chi^2_{" + v1 + "}"; }
      else { cdf = function (x) { return D.fCDF(x, v1, v2); }; pdf = function (x) { return D.fPDF(x, v1, v2); }; inv = function (p) { return D.fInv(p, v1, v2); }; name = "F_{" + v1 + "," + v2 + "}"; }
      var tail = st.tail, rows = [], cut = [], x0, x1;
      if (!sym && tail === "two") tail = "right";
      if (st.mode === "p") {
        var x = PC.evalNum(st.x), left = cdf(x), right = 1 - left, p;
        if (tail === "two") { p = sym ? 2 * Math.min(left, right) : 2 * Math.min(left, right); cut = sym ? [-Math.abs(x), Math.abs(x)] : [x]; }
        else p = tail === "right" ? right : left, cut = [x];
        rows.push([L("พื้นที่ทางซ้าย", "Left area"), tex("P(" + name + " < " + nice(x, 4) + ") = " + fmt(left, 6).replace(/−/g, "-"))]);
        rows.push([L("พื้นที่ทางขวา", "Right area"), tex("P(" + name + " > " + nice(x, 4) + ") = " + fmt(right, 6).replace(/−/g, "-"))]);
        rows.push([L("ค่า p (" + (tail === "two" ? "สองหาง" : tail === "right" ? "หางขวา" : "หางซ้าย") + ")", "p-value (" + (tail === "two" ? "two-tailed" : tail + " tail") + ")"), "<b>" + fmt(p, 6) + "</b>"]);
      } else {
        var a = PC.evalNum(st.alpha);
        if (!(a > 0 && a < 1)) throw new Error(L("α ต้องอยู่ระหว่าง 0 ถึง 1", "α must be between 0 and 1"));
        var c;
        if (tail === "two") { c = inv(1 - a / 2); cut = sym ? [-c, c] : [c]; rows.push([L("ค่าวิกฤตสองหาง", "Two-tailed critical value"), tex("\\pm " + fmt(c, 4)) + L(" (α/2 = ", " (α/2 = ") + fmt(a / 2, 4) + L(" ในแต่ละหาง)", " in each tail)")]); }
        else if (tail === "right") { c = inv(1 - a); cut = [c]; rows.push([L("ค่าวิกฤตหางขวา", "Right-tail critical value"), tex(name + ",\\," + nice(a) + " = " + fmt(c, 4).replace(/−/g, "-"))]); }
        else { c = inv(a); cut = [c]; rows.push([L("ค่าวิกฤตหางซ้าย", "Left-tail critical value"), tex(fmt(c, 4).replace(/−/g, "-"))]); }
        rows.push([L("ระดับความเชื่อมั่น", "Confidence level"), fmt((1 - a) * 100, 3) + "%"]);
      }
      if (sym) { var e = d === "z" ? 4 : Math.max(4, Math.min(8, inv(0.995) * 1.2)); x0 = -e; x1 = e; }
      else { x0 = 0; x1 = Math.max(inv(0.995), (cut[0] || 0) * 1.1, 1); }
      var areas = [], shadeTail = function (lo, hi) { lo = Math.max(lo, x0); hi = Math.min(hi, x1); if (hi > lo) areas.push({ pts: PC.sample(pdf, lo, hi, 120), color: "var(--accent)", op: 0.4 }); };
      if (tail === "two") { if (sym) { shadeTail(x0, -Math.abs(cut[cut.length - 1])); shadeTail(Math.abs(cut[cut.length - 1]), x1); } else shadeTail(cut[0], x1); }
      else if (tail === "right") shadeTail(cut[0], x1); else shadeTail(x0, cut[0]);
      var pts = PC.sample(pdf, x0 + (sym ? 0 : 1e-6), x1, 400), ym = Math.max.apply(null, pts.map(function (q) { return isFinite(q[1]) ? q[1] : 0; }).concat([0.05]));
      PC.plotIn(ui.fig, { xmin: x0, xmax: x1, ymin: 0, ymax: Math.min(ym * 1.15, 1.5), areas: areas, series: [{ pts: pts, color: "var(--signal)" }], vlines: cut.map(function (c) { return { x: c, color: "var(--accent)", label: fmt(c, 3) }; }), xlabel: d === "chi" ? "χ²" : d, label: "distribution" });
      ui.out.innerHTML = dl(rows);
    }, { title: L("เครื่องคิดค่า p และค่าวิกฤต", "p-value and critical value calculator"), hint: L("ใช้ตรวจหรือแทนการเปิดตาราง ผลตรงกับ scipy ถึงทศนิยม 4 ตำแหน่งขึ้นไป", "check or replace the tables; matches scipy to at least 4 decimals") });
  });

  // ---------------------------------------------------------------- static table lookup (highlight a cell)
  PC.widget("pc-tlook", function (box) {
    var ids = String(box.getAttribute("data-table") || "").split(","), tables = ids.map(function (id) { return document.getElementById(id.trim()); }).filter(Boolean), kind = box.getAttribute("data-kind") || "grid";
    if (!tables.length) return {};
    var rowsOf = function (t) { return Array.prototype.slice.call(t.tBodies[0].rows); };
    var colsOf = function (t) { return Array.prototype.slice.call(t.tHead.rows[t.tHead.rows.length - 1].cells).filter(function (c) { return c.hasAttribute("data-c"); }); };
    var html = '<div class="pc-tbar">';
    if (kind === "z") html += '<label class="pc-inl">z = <input type="text" inputmode="decimal" data-z placeholder="1.96" size="7"></label>';
    else {
      html += '<label class="pc-inl">' + (box.getAttribute("data-rlab") || "df") + ' <select data-r>' + rowsOf(tables[0]).map(function (r) { var v = r.getAttribute("data-r"); return '<option value="' + esc(v) + '">' + esc(v === "inf" ? "∞" : v) + "</option>"; }).join("") + "</select></label>";
      html += '<label class="pc-inl">' + (box.getAttribute("data-clab") || "α") + ' <select data-c>' + colsOf(tables[0]).map(function (c) { var v = c.getAttribute("data-c"); return '<option value="' + esc(v) + '">' + esc(v === "inf" ? "∞" : v) + "</option>"; }).join("") + "</select></label>";
    }
    html += '<output class="pc-tout" aria-live="polite"></output></div>';
    box.innerHTML = html;
    var out = box.querySelector("output");
    function clear() { tables.forEach(function (t) { t.querySelectorAll(".pc-hitc,.pc-hitl").forEach(function (e) { e.classList.remove("pc-hitc"); e.classList.remove("pc-hitl"); }); }); }
    function hit(t, rk, ck) {
      var row = rowsOf(t).filter(function (r) { return r.getAttribute("data-r") === rk; })[0], cols = colsOf(t), ci = -1;
      cols.forEach(function (c, i) { if (c.getAttribute("data-c") === ck) ci = i; });
      if (!row || ci < 0) return null;
      var cells = Array.prototype.slice.call(row.cells).filter(function (c) { return c.tagName === "TD"; }), cell = cells[ci];
      if (!cell) return null;
      clear(); cell.classList.add("pc-hitc"); row.cells[0].classList.add("pc-hitl"); cols[ci].classList.add("pc-hitl");
      var sc = t.closest(".pc-scroll");
      if (sc) { sc.scrollTop = Math.max(0, row.offsetTop - sc.clientHeight / 2); sc.scrollLeft = Math.max(0, cell.offsetLeft - sc.clientWidth / 2); }
      return cell.textContent;
    }
    if (kind === "z") {
      var zi = box.querySelector("[data-z]");
      zi.addEventListener("input", function () {
        var z = parseFloat(zi.value.replace("−", "-"));
        if (!isFinite(z)) { out.textContent = ""; clear(); return; }
        z = Math.round(z * 100) / 100;
        var neg = z < 0 || Object.is(z, -0) || /^\s*[-−]/.test(zi.value), a = Math.abs(z), r = Math.floor(a * 10 + 1e-9) / 10, c = Math.round((a - r) * 100) / 100;
        var rk = (neg && tables.length > 1 ? "-" : "") + r.toFixed(1), ck = c.toFixed(2), val = null;
        for (var i = 0; i < tables.length && val == null; i++) val = hit(tables[i], rk, ck);
        out.textContent = val == null ? L("อยู่นอกช่วงของตาราง", "outside the table") : (tables[0].getAttribute("data-kind") === "zero" ? L("พื้นที่ 0 ถึง ", "Area 0 to ") + a.toFixed(2) + " = " + val : "Φ(" + (neg ? "−" : "") + a.toFixed(2) + ") = " + val);
      });
    } else {
      var rs = box.querySelector("[data-r]"), cs = box.querySelector("[data-c]");
      var go = function () { var v = hit(tables[0], rs.value, cs.value); out.textContent = v == null ? "" : "→ " + v; };
      rs.addEventListener("change", go); cs.addEventListener("change", go);
    }
    return {};
  });

  PC.boot();
})(typeof window !== "undefined" ? window : globalThis);
