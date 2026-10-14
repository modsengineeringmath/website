/* Linear-algebra engineering labs (plain JS). Needs mathkit.js and (for TeX) /assets/vendor/katex.min.js.
   <div class="la-truss" [data-preset="tri|warren"]>   plane truss by the method of joints written as A·f = b (member forces + reactions)
   <div class="la-modes" [data-n="2|3"]>               spring–mass chain: K φ = ω² M φ, natural frequencies and animated mode shapes */
(function () {
  "use strict";
  var MK = window.MK;
  if (!MK) return;
  var fmt = MK.fmt, T = function (s, d) { return MK.texStr(s, d); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  function solve(A, b) { // Gaussian elimination with partial pivoting; returns null if singular
    var n = A.length, M = A.map(function (r, i) { return r.concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var p = c;
      for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-12) return null;
      var t = M[c]; M[c] = M[p]; M[p] = t;
      for (r = 0; r < n; r++) if (r !== c) { var f = M[r][c] / M[c][c]; for (var k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    return M.map(function (row, i) { return row[n] / row[i]; });
  }
  function slider(key, label, min, max, step, val) {
    return '<label class="lap-row cl-sl"><span class="lap-lbl">' + label + '</span><input type="range" data-k="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><output>' + val + "</output></label>";
  }
  function bind(box, st, draw) {
    $$("input[type=range][data-k]", box).forEach(function (r) { r.addEventListener("input", function () { st[r.getAttribute("data-k")] = +r.value; r.parentNode.querySelector("output").textContent = r.value; draw(); }); });
  }

  /* ================================================================ truss */
  var TRUSS = {
    tri: { n: "สามเหลี่ยม 3 ชิ้น", nodes: [[0, 0], [3, 4], [6, 0]], names: ["A", "B", "C"], members: [[0, 1], [1, 2], [0, 2]], pin: 0, roller: 2, loadNodes: [1] },
    warren: { n: "โครงถักวอร์เรน 7 ชิ้น", nodes: [[0, 0], [4, 0], [8, 0], [2, 3], [6, 3]], names: ["A", "B", "C", "D", "E"], members: [[0, 1], [1, 2], [0, 3], [3, 1], [3, 4], [1, 4], [4, 2]], pin: 0, roller: 2, loadNodes: [1, 3, 4] }
  };
  function initTruss(box) {
    var st = { p: box.dataset.preset || "warren", P: 20, H: 0, at: 0 };
    box.innerHTML = '<div class="lap-chips">' + Object.keys(TRUSS).map(function (k) { return '<button type="button" class="lap-chip" data-p="' + k + '">' + TRUSS[k].n + "</button>"; }).join("") + "</div>" +
      slider("P", "แรงแนวดิ่ง P (kN, ลง)", 0, 60, 1, 20) + slider("H", "แรงแนวนอน H (kN, ขวา)", -30, 30, 1, 0) +
      '<div class="lap-chips la-at"></div><div class="la-truss-fig"></div><div class="la-truss-out"></div>';
    var fig = box.querySelector(".la-truss-fig"), out = box.querySelector(".la-truss-out"), at = box.querySelector(".la-at");
    function draw() {
      var G = TRUSS[st.p], N = G.nodes.length, Mm = G.members.length;
      var ln = G.loadNodes[Math.min(st.at, G.loadNodes.length - 1)];
      at.innerHTML = '<span class="lap-lbl">กระทำที่จุด</span>' + G.loadNodes.map(function (j, i) { return '<button type="button" class="lap-chip' + (i === Math.min(st.at, G.loadNodes.length - 1) ? " on" : "") + '" data-at="' + i + '">' + G.names[j] + "</button>"; }).join("");
      // unknowns: member forces (tension +) then reactions Ax, Ay (pin), Cy (roller)
      var nU = Mm + 3, A = [], b = [];
      for (var j = 0; j < N; j++) { A.push(new Array(nU).fill(0)); A.push(new Array(nU).fill(0)); b.push(0); b.push(0); }
      G.members.forEach(function (m, k) {
        var a = G.nodes[m[0]], c = G.nodes[m[1]], dx = c[0] - a[0], dy = c[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
        // force on node a from a tension member points toward c
        A[2 * m[0]][k] += ux; A[2 * m[0] + 1][k] += uy;
        A[2 * m[1]][k] -= ux; A[2 * m[1] + 1][k] -= uy;
      });
      A[2 * G.pin][Mm] = 1; A[2 * G.pin + 1][Mm + 1] = 1; A[2 * G.roller + 1][Mm + 2] = 1;
      // external loads move to the right-hand side: ΣF = 0 → A f = −F_ext
      b[2 * ln] -= st.H; b[2 * ln + 1] -= -st.P;
      var f = solve(A, b);
      var names = G.members.map(function (m) { return G.names[m[0]] + G.names[m[1]]; }).concat(["A_x", "A_y", G.names[G.roller] + "_y"]);
      // drawing
      var xs = G.nodes.map(function (p) { return p[0]; }), ys = G.nodes.map(function (p) { return p[1]; });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y1 = Math.max.apply(null, ys);
      var W = 680, H = 300, sc = Math.min((W - 120) / (x1 - x0), (H - 110) / (y1 || 1));
      var sx = function (x) { return 60 + (x - x0) * sc; }, sy = function (y) { return H - 60 - y * sc; };
      var maxF = f ? Math.max.apply(null, f.slice(0, Mm).map(Math.abs)) || 1 : 1;
      var s = '<svg class="mk-plot" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="แรงในชิ้นส่วนโครงถัก">';
      G.members.forEach(function (m, k) {
        var a = G.nodes[m[0]], c = G.nodes[m[1]], v = f ? f[k] : 0, col = Math.abs(v) < 1e-9 ? "var(--ink-3)" : v > 0 ? "var(--signal)" : "var(--accent)";
        s += '<line x1="' + sx(a[0]) + '" y1="' + sy(a[1]) + '" x2="' + sx(c[0]) + '" y2="' + sy(c[1]) + '" stroke="' + col + '" stroke-width="' + (2 + 6 * Math.abs(v) / maxF).toFixed(1) + '" stroke-linecap="round"/>';
        s += '<text class="mk-ann" x="' + ((sx(a[0]) + sx(c[0])) / 2 + 4) + '" y="' + ((sy(a[1]) + sy(c[1])) / 2 - 4) + '">' + fmt(v, 3) + "</text>";
      });
      G.nodes.forEach(function (p, i) { s += '<circle cx="' + sx(p[0]) + '" cy="' + sy(p[1]) + '" r="6" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/><text class="mk-lab" x="' + (sx(p[0]) - 16) + '" y="' + (sy(p[1]) - 8) + '">' + G.names[i] + "</text>"; });
      var pa = G.nodes[G.pin], pc = G.nodes[G.roller];
      s += '<path d="M' + sx(pa[0]) + " " + (sy(pa[1]) + 6) + " l-11 18 h22 z" + '" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/>';
      s += '<circle cx="' + sx(pc[0]) + '" cy="' + (sy(pc[1]) + 14) + '" r="8" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/>';
      var L0 = G.nodes[ln];
      if (st.P) s += '<line x1="' + sx(L0[0]) + '" x2="' + sx(L0[0]) + '" y1="' + (sy(L0[1]) - 60) + '" y2="' + (sy(L0[1]) - 9) + '" stroke="var(--ok)" stroke-width="3"/><path d="M' + sx(L0[0]) + " " + (sy(L0[1]) - 7) + ' l-6 -11 h12 z" fill="var(--ok)"/><text class="mk-lab" x="' + (sx(L0[0]) + 6) + '" y="' + (sy(L0[1]) - 50) + '">P = ' + st.P + " kN</text>";
      if (st.H) { var d = st.H > 0 ? 1 : -1; s += '<line x1="' + (sx(L0[0]) - d * 60) + '" x2="' + (sx(L0[0]) - d * 9) + '" y1="' + sy(L0[1]) + '" y2="' + sy(L0[1]) + '" stroke="var(--ok)" stroke-width="3"/><text class="mk-lab" x="' + (sx(L0[0]) - d * 60) + '" y="' + (sy(L0[1]) + 16) + '">H = ' + st.H + "</text>"; }
      s += '<text class="mk-ann" x="12" y="18">น้ำเงิน = แรงดึง (T, +) · ส้ม = แรงอัด (C, −) · ความหนาของเส้น ∝ ขนาดแรง</text></svg>';
      fig.innerHTML = s;
      if (!f) { out.innerHTML = '<p class="lap-err">ระบบเป็นเอกฐาน (โครงถักไม่เสถียร)</p>'; return; }
      // matrix display (rounded)
      var r3 = function (v) { return Math.abs(v) < 1e-9 ? "0" : String(Math.round(v * 1000) / 1000).replace("-", "-"); };
      var rows = [];
      for (j = 0; j < N; j++) ["x", "y"].forEach(function (ax, q) { rows.push(A[2 * j + q].map(r3).join(" & ") + " & \\Big| & " + r3(b[2 * j + q])); });
      var tex = "\\underbrace{\\left[\\begin{array}{" + "c".repeat(nU) + "cc}" + rows.join("\\\\") + "\\end{array}\\right]}_{[A\\,|\\,\\mathbf b]}\\quad \\mathbf f = \\begin{bmatrix}" + names.join("\\\\").replace(/_/g, "_") + "\\end{bmatrix}";
      out.innerHTML = '<p class="lap-note">ทุกจุดต่อเขียนสมดุลได้ 2 สมการ (ΣFx = 0, ΣFy = 0) รวม 2j = ' + 2 * N + " สมการ ตัวไม่รู้คือแรงในชิ้นส่วน m = " + Mm + " ตัว + แรงปฏิกิริยา r = 3 ตัว เท่ากันพอดี (m + r = 2j) จึงเป็นโครงถักดีเทอร์มิเนตสถิต แก้ Af = b ด้วยการกำจัดแบบเกาส์</p>" +
        '<div class="lap-eq">' + T(tex, true) + "</div>" +
        '<table class="lap-pt"><thead><tr><th>ชิ้นส่วน / แรงปฏิกิริยา</th><th>แรง (kN)</th><th>ชนิด</th></tr></thead><tbody>' +
        names.map(function (nm, k) { var v = f[k], isM = k < Mm; return "<tr><td>" + T(nm) + "</td><td>" + fmt(v, 4) + "</td><td>" + (isM ? (Math.abs(v) < 1e-9 ? "ไม่รับแรง (zero-force)" : v > 0 ? "ดึง (T)" : "อัด (C)") : "แรงปฏิกิริยา") + "</td></tr>"; }).join("") + "</tbody></table>";
      $$("[data-p]", box).forEach(function (x) { x.classList.toggle("on", x.getAttribute("data-p") === st.p); });
    }
    box.addEventListener("click", function (e) {
      var p = e.target.closest("[data-p]"); if (p) { st.p = p.getAttribute("data-p"); st.at = 0; draw(); return; }
      var a = e.target.closest("[data-at]"); if (a) { st.at = +a.getAttribute("data-at"); draw(); }
    });
    bind(box, st, draw);
    draw();
  }

  /* ================================================================ vibration modes */
  function jacobi(S) { // symmetric eigen-decomposition: returns {vals, vecs (columns)}
    var n = S.length, A = S.map(function (r) { return r.slice(); }), V = [];
    for (var i = 0; i < n; i++) { V.push(new Array(n).fill(0)); V[i][i] = 1; }
    for (var sweep = 0; sweep < 60; sweep++) {
      var off = 0;
      for (var p = 0; p < n; p++) for (var q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
      if (off < 1e-20) break;
      for (p = 0; p < n; p++) for (q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-15) continue;
        var th = (A[q][q] - A[p][p]) / (2 * A[p][q]), t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (var k = 0; k < n; k++) { var akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
        for (k = 0; k < n; k++) { var apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
        for (k = 0; k < n; k++) { var vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
      }
    }
    return { vals: A.map(function (r, i) { return r[i]; }), vecs: V };
  }
  function initModes(box) {
    var st = { n: +(box.dataset.n || 2), m1: 1, m2: 1, m3: 1, k1: 100, k2: 100, k3: 100, mode: 0, wall: 0 };
    box.innerHTML = '<div class="lap-chips"><button type="button" class="lap-chip" data-n="2">2 มวล</button><button type="button" class="lap-chip" data-n="3">3 มวล (อาคาร 3 ชั้น)</button></div>' +
      '<div class="la-mk">' + slider("m1", "m₁ (kg)", 0.5, 5, 0.5, 1) + slider("m2", "m₂ (kg)", 0.5, 5, 0.5, 1) + '<div class="la-m3">' + slider("m3", "m₃ (kg)", 0.5, 5, 0.5, 1) + "</div>" + slider("k1", "k₁ (N/m)", 20, 400, 10, 100) + slider("k2", "k₂ (N/m)", 20, 400, 10, 100) + '<div class="la-m3">' + slider("k3", "k₃ (N/m)", 20, 400, 10, 100) + "</div></div>" +
      '<div class="lap-eq la-mat"></div><div class="lap-chips la-mpick"></div><svg class="mk-plot la-anim" viewBox="0 0 680 150" role="img" aria-label="การสั่นตามรูปโหมด"></svg><div class="la-mout"></div>';
    var mat = box.querySelector(".la-mat"), pick = box.querySelector(".la-mpick"), anim = box.querySelector(".la-anim"), mout = box.querySelector(".la-mout");
    var res = null, t0 = performance.now(), raf = null, visible = true;
    function compute() {
      var n = st.n, m = [st.m1, st.m2, st.m3].slice(0, n), k = [st.k1, st.k2, st.k3].slice(0, n);
      var K = [], i, j;
      for (i = 0; i < n; i++) { K.push(new Array(n).fill(0)); }
      for (i = 0; i < n; i++) { K[i][i] += k[i]; if (i + 1 < n) { K[i][i] += k[i + 1]; K[i][i + 1] -= k[i + 1]; K[i + 1][i] -= k[i + 1]; } }
      // S = M^{-1/2} K M^{-1/2}
      var S = K.map(function (r, a) { return r.map(function (v, b) { return v / Math.sqrt(m[a] * m[b]); }); });
      var E = jacobi(S), idx = E.vals.map(function (v, a) { return a; }).sort(function (a, b) { return E.vals[a] - E.vals[b]; });
      var modes = idx.map(function (c) {
        var phi = m.map(function (mm, a) { return E.vecs[a][c] / Math.sqrt(mm); });
        var s0 = phi[0] || 1; phi = phi.map(function (v) { return v / s0; });
        return { w2: E.vals[c], w: Math.sqrt(Math.max(0, E.vals[c])), phi: phi };
      });
      res = { n: n, m: m, k: k, K: K, modes: modes };
      var Mtex = "\\begin{bmatrix}" + m.map(function (v, a) { return m.map(function (u, b) { return a === b ? MK.nice(v) : "0"; }).join(" & "); }).join("\\\\") + "\\end{bmatrix}";
      var Ktex = "\\begin{bmatrix}" + K.map(function (r) { return r.map(function (v) { return MK.nice(v); }).join(" & "); }).join("\\\\") + "\\end{bmatrix}";
      MK.tex(mat, "M\\ddot{\\mathbf x} + K\\mathbf x = \\mathbf 0,\\quad M = " + Mtex + ",\\ K = " + Ktex + "\\ \\Rightarrow\\ \\det(K - \\omega^2M) = 0", true);
      pick.innerHTML = '<span class="lap-lbl">ดูโหมด</span>' + modes.map(function (md, a) { return '<button type="button" class="lap-chip' + (a === st.mode ? " on" : "") + '" data-mode="' + a + '">โหมด ' + (a + 1) + " · " + fmt(md.w / (2 * Math.PI), 3) + " Hz</button>"; }).join("");
      mout.innerHTML = '<table class="lap-pt"><thead><tr><th>โหมด</th><th>ω² (ค่าเฉพาะ)</th><th>ω (rad/s)</th><th>f (Hz)</th><th>รูปโหมด φ (มวล 1 = 1)</th></tr></thead><tbody>' + modes.map(function (md, a) { return "<tr><td>" + (a + 1) + "</td><td>" + fmt(md.w2, 5) + "</td><td>" + fmt(md.w, 4) + "</td><td>" + fmt(md.w / (2 * Math.PI), 4) + "</td><td>[" + md.phi.map(function (v) { return fmt(v, 4); }).join(", ") + "]</td></tr>"; }).join("") + '</tbody></table><p class="lap-note">โหมดแรก (ความถี่ต่ำสุด) มวลทุกก้อนเคลื่อนทิศเดียวกัน โหมดสูงขึ้นมีจุดที่เครื่องหมายสลับ (node) มากขึ้น ถ้าแรงภายนอก เช่น เครื่องจักรหรือแผ่นดินไหว สั่นตรงความถี่ใดความถี่หนึ่ง จะเกิดเรโซแนนซ์ในรูปโหมดนั้น</p>';
      $$("[data-n]", box).forEach(function (x) { x.classList.toggle("on", +x.getAttribute("data-n") === n); });
      $$(".la-m3", box).forEach(function (x) { x.hidden = n < 3; });
    }
    function frame(now) {
      raf = null;
      if (!res) return;
      var md = res.modes[Math.min(st.mode, res.modes.length - 1)], t = (now - t0) / 1000;
      var amp = 26 / Math.max.apply(null, md.phi.map(Math.abs)), wv = 2 * Math.PI * 0.6; // slowed for viewing
      var n = res.n, base = 60, gap = (600 - base) / (n + 0.5), s = '<line x1="40" y1="20" x2="40" y2="120" stroke="var(--ink)" stroke-width="4"/>';
      var px = [40];
      for (var i = 0; i < n; i++) px.push(base + gap * (i + 1) + amp * md.phi[i] * Math.sin(wv * t));
      for (i = 0; i < n; i++) {
        var a = px[i] + (i ? 18 : 0), c = px[i + 1] - 18, d = "M" + a + " 70", segs = 10;
        for (var q = 1; q <= segs; q++) d += " L" + (a + (c - a) * q / segs).toFixed(1) + " " + (q === segs ? 70 : (q % 2 ? 58 : 82));
        s += '<path d="' + d + '" fill="none" stroke="var(--ink-3)" stroke-width="2"/>';
        s += '<rect x="' + (px[i + 1] - 18).toFixed(1) + '" y="52" width="36" height="36" rx="5" fill="var(--accent)" opacity=".85"/><text class="mk-lab" x="' + (px[i + 1] - 8).toFixed(1) + '" y="75" fill="#fff">m' + (i + 1) + "</text>";
        s += '<line x1="' + (base + gap * (i + 1)) + '" x2="' + (base + gap * (i + 1)) + '" y1="96" y2="110" stroke="var(--ink-3)"/>';
      }
      s += '<line x1="40" y1="112" x2="640" y2="112" stroke="var(--rule)"/><text class="mk-ann" x="460" y="140">ภาพเคลื่อนไหวช้าลงเพื่อให้เห็นรูปโหมด</text>';
      anim.innerHTML = s;
      if (visible) raf = requestAnimationFrame(frame);
    }
    function draw() { compute(); if (!raf) raf = requestAnimationFrame(frame); }
    box.addEventListener("click", function (e) {
      var n = e.target.closest("[data-n]"); if (n) { st.n = +n.getAttribute("data-n"); st.mode = 0; draw(); return; }
      var m = e.target.closest("[data-mode]"); if (m) { st.mode = +m.getAttribute("data-mode"); compute(); }
    });
    bind(box, st, draw);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(box);
    draw();
  }

  function boot() {
    $$("div.la-truss").forEach(function (b) { if (b.__le) return; b.__le = true; b.classList.add("cl-lab"); try { initTruss(b); } catch (e) { b.textContent = e.message; } });
    $$("div.la-modes").forEach(function (b) { if (b.__le) return; b.__le = true; b.classList.add("cl-lab"); try { initModes(b); } catch (e) { b.textContent = e.message; } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
