/* Home page: interactive step response + playlist player */
(function () {
  /* ---------- step response scope ---------- */
  var X0 = 40, X1 = 468, Y0 = 240, Y1 = 110, TMAX = 12, YSCALE = Y0 - Y1;
  var gridG = document.getElementById("gridG"), ns = "http://www.w3.org/2000/svg";
  if (gridG) {
    for (var i = 1; i <= 6; i++) {
      var gx = X0 + (X1 - X0) * i / 6, l = document.createElementNS(ns, "line");
      l.setAttribute("class", "gridline"); l.setAttribute("x1", gx); l.setAttribute("x2", gx); l.setAttribute("y1", 20); l.setAttribute("y2", Y0);
      gridG.appendChild(l);
    }
    [0.5, 1.5].forEach(function (v) {
      var gy = Y0 - v * YSCALE, l = document.createElementNS(ns, "line");
      l.setAttribute("class", "gridline"); l.setAttribute("x1", X0); l.setAttribute("x2", X1); l.setAttribute("y1", gy); l.setAttribute("y2", gy);
      gridG.appendChild(l);
    });

    var step = function (z, t) { // wn = 1
      if (z < 1) { var wd = Math.sqrt(1 - z * z), ph = Math.acos(z); return 1 - Math.exp(-z * t) * Math.sin(wd * t + ph) / wd; }
      if (Math.abs(z - 1) < 1e-6) return 1 - Math.exp(-t) * (1 + t);
      var s = Math.sqrt(z * z - 1), r1 = -z + s, r2 = -z - s;
      return 1 + (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r1 - r2);
    };
    var resp = document.getElementById("resp"), osLine = document.getElementById("osLine"), osText = document.getElementById("osText");
    var zIn = document.getElementById("zeta"), zOut = document.getElementById("zetaOut");
    var draw = function (z) {
      var d = "", N = 220, peak = -1, pt = 0;
      for (var k = 0; k <= N; k++) {
        var t = TMAX * k / N, y = step(z, t);
        if (y > peak) { peak = y; pt = t; }
        var x = X0 + (X1 - X0) * t / TMAX, yy = Y0 - Math.max(Math.min(y, 1.75), 0) * YSCALE;
        d += (k ? "L" : "M") + x.toFixed(1) + " " + yy.toFixed(1);
      }
      resp.setAttribute("d", d);
      zOut.textContent = (+z).toFixed(2);
      if (z < 1 && peak > 1.005) {
        var px = X0 + (X1 - X0) * pt / TMAX, py = Y0 - Math.min(peak, 1.75) * YSCALE, os = ((peak - 1) * 100).toFixed(1);
        osLine.setAttribute("x1", px); osLine.setAttribute("x2", px); osLine.setAttribute("y1", py); osLine.setAttribute("y2", Y1);
        osLine.style.display = ""; osText.style.display = "";
        osText.setAttribute("x", Math.min(px + 8, X1 - 110)); osText.setAttribute("y", Math.max(py - 6, 30));
        osText.textContent = "overshoot " + os + "%";
      } else { osLine.style.display = "none"; osText.style.display = "none"; }
    };
    zIn.addEventListener("input", function () { draw(+zIn.value); });
    draw(+zIn.value);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var len = resp.getTotalLength();
      resp.style.strokeDasharray = len; resp.style.strokeDashoffset = len;
      resp.getBoundingClientRect();
      resp.style.transition = "stroke-dashoffset 1.6s ease-out"; resp.style.strokeDashoffset = 0;
      setTimeout(function () { resp.style.strokeDasharray = ""; resp.style.transition = ""; }, 1700);
    }
  }

  /* ---------- playlists ---------- */
  var PL = [
    { id: "PLAJhR5azwWpJkUHNvACZSpBG2C7l7VJTO", en: "Matrix & Determinant", th: "ตัวกำหนด ดีเทอร์มิแนนต์ และเมทริกซ์", eq: "Ax = b  ⇒  x = A⁻¹b", sub: "สำหรับการแก้ระบบสมการเชิงเส้น", lesson: "/learn/matrix-determinant/" },
    { id: "PLAJhR5azwWpLgWalcHsCEE8q_bPJv0Eaa", en: "Laplace Transform", th: "การแปลงลาปลาซ", eq: "F(s) = ∫₀^∞ f(t) e^{−st} dt", sub: "Laplace และ Inverse Laplace สำหรับแก้สมการเชิงอนุพันธ์", lesson: "/learn/laplace-transform/" },
    { id: "PLAJhR5azwWpK04F2C2Vp6h3v82Wvqn9ka", en: "Feedback Control", th: "การควบคุมป้อนกลับ", eq: "T(s) = G(s) / (1 + G(s)H(s))", sub: "ระบบควบคุมแบบป้อนกลับและข้อดีของการป้อนกลับ" },
    { id: "PLAJhR5azwWpJEprWclikULegqCgddv0PF", en: "Buck Converter", th: "อิเล็กทรอนิกส์กำลัง วงจรบั๊กคอนเวอร์เตอร์", eq: "V_o = D · V_in", sub: "Power Electronics: วงจรแปลงแรงดัน DC-DC" }
  ];
  var tabs = document.getElementById("tabs"), screen = document.getElementById("screen");
  if (!tabs || !screen) return;
  var plLink = document.getElementById("plLink"), plSub = document.getElementById("plSub"), plLesson = document.getElementById("plLesson");
  var nodes = [].slice.call(document.querySelectorAll(".node")), cur = -1;

  PL.forEach(function (p, i) {
    var b = document.createElement("button");
    b.className = "tab"; b.type = "button"; b.setAttribute("role", "tab"); b.id = "tab" + i;
    b.innerHTML = '<span class="mono">0' + (i + 1) + '</span><span><b>' + p.en + "</b></span>";
    b.addEventListener("click", function () { select(i, false); });
    tabs.appendChild(b);
  });
  tabs.addEventListener("keydown", function (e) {
    if (["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].indexOf(e.key) < 0) return;
    e.preventDefault();
    var n = (cur + ((e.key === "ArrowDown" || e.key === "ArrowRight") ? 1 : PL.length - 1)) % PL.length;
    select(n, false); document.getElementById("tab" + n).focus();
  });

  function facade(p) {
    screen.innerHTML = '<div class="facade"><div class="f-eq">' + p.eq + '</div><div><h3>' + p.en + "</h3><p>" + p.th + "</p></div>" +
      '<button class="play" type="button"><i></i>เล่นเพลย์ลิสต์</button></div>';
    screen.querySelector(".play").addEventListener("click", function () {
      screen.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/videoseries?list=' + p.id + '&autoplay=1&rel=0" title="' + p.en +
        ' — เพลย์ลิสต์" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    });
  }
  function select(i, scroll) {
    if (i === cur) { if (scroll) document.getElementById("watch").scrollIntoView(); return; }
    cur = i; var p = PL[i];
    [].forEach.call(tabs.children, function (t, k) { t.setAttribute("aria-selected", k === i ? "true" : "false"); t.tabIndex = k === i ? 0 : -1; });
    screen.setAttribute("aria-labelledby", "tab" + i);
    nodes.forEach(function (n, k) { n.setAttribute("aria-current", k === i ? "true" : "false"); });
    plSub.textContent = p.sub;
    plLink.href = "https://www.youtube.com/playlist?list=" + p.id;
    if (plLesson) {
      if (p.lesson) { plLesson.href = p.lesson; plLesson.hidden = false; } else plLesson.hidden = true;
    }
    facade(p);
    if (scroll) document.getElementById("watch").scrollIntoView();
  }
  nodes.forEach(function (n) { n.addEventListener("click", function () { select(+n.dataset.pl, true); }); });
  select(0, false);
})();
