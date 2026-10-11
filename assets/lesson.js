/* Shared lesson tools (series pages outside linear algebra): per-page formula search, practice mode,
   step-by-step worked examples and the series formula index on a hub page. Same markup as linalg.js. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var art = document.querySelector("article.lesson");
  // ======================================================================= formula filter (per page)
  (function () {
    var inp = $("tfFilter");
    if (!inp || !art) return;
    var secs = Array.prototype.slice.call(art.querySelectorAll(".tsec"));
    var hay = new Map();
    secs.forEach(function (sec) {
      sec.querySelectorAll(".tf").forEach(function (card) {
        var n = card.querySelector(".tf-n"), t = (card.getAttribute("data-k") || "") + " " + (card.id || "") + " " + (n ? n.textContent : "");
        card.querySelectorAll("annotation").forEach(function (a) { t += " " + a.textContent.replace(/\\[a-z]+/gi, function (w) { return " " + w.slice(1) + " "; }); });
        hay.set(card, t.toLowerCase());
      });
    });
    function run() {
      var terms = inp.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.length) {
        art.classList.remove("is-filtering");
        secs.forEach(function (s) { s.hidden = false; s.classList.remove("tsec-all"); });
        art.querySelectorAll(".tf-off").forEach(function (c) { c.classList.remove("tf-off"); });
        $("tfCount").textContent = "";
        return;
      }
      art.classList.add("is-filtering");
      var total = 0;
      secs.forEach(function (sec) {
        var h2 = sec.querySelector("h2"), title = h2 ? h2.textContent.toLowerCase() : "";
        var all = terms.every(function (t) { return title.indexOf(t) >= 0; }), n = 0;
        sec.querySelectorAll(".tf").forEach(function (card) {
          var ok = all || terms.every(function (t) { return hay.get(card).indexOf(t) >= 0; });
          card.classList.toggle("tf-off", !ok);
          if (ok) n++;
        });
        sec.classList.toggle("tsec-all", all);
        sec.hidden = !all && n === 0;
        total += n;
      });
      $("tfCount").textContent = total ? "พบ " + total + " สูตร" : "ไม่พบในหน้านี้ ลองค้นทุกหน้าที่หน้าภาพรวม";
    }
    inp.addEventListener("input", run);
    inp.addEventListener("keydown", function (e) { if (e.key === "Escape") { inp.value = ""; run(); } });
  })();

  // ======================================================================= worked examples: step mode + practice mode
  (function () {
    if (!art) return;
    var examples = Array.prototype.slice.call(art.querySelectorAll(".wx"));
    examples.forEach(function (wx) {
      var steps = Array.prototype.slice.call(wx.querySelectorAll(".steps > li"));
      var head = wx.querySelector(".wx-head");
      if (!head || !steps.length) return;
      var bar = document.createElement("div");
      bar.className = "wx-bar";
      bar.innerHTML = '<button type="button" class="wx-btn" data-act="step">▶ ดูทีละขั้น</button><button type="button" class="wx-btn" data-act="show" hidden>ดูวิธีทำ</button>';
      var go = head.querySelector(".calc-go");
      if (go) bar.appendChild(go);
      head.appendChild(bar);
      var stepBtn = bar.querySelector('[data-act="step"]'), showBtn = bar.querySelector('[data-act="show"]');
      var shown = -1;
      function paint() {
        steps.forEach(function (li, i) { li.classList.toggle("st-hide", shown >= 0 && i > shown); });
        var done = shown < 0 || shown >= steps.length - 1;
        wx.classList.toggle("st-pending", !done);
        stepBtn.textContent = shown < 0 ? "▶ ดูทีละขั้น" : !done ? "ขั้นถัดไป (" + (shown + 2) + "/" + steps.length + ") ▶" : "↺ เริ่มใหม่";
      }
      stepBtn.addEventListener("click", function () {
        wx.classList.add("open");
        if (shown < 0 || shown >= steps.length - 1) shown = 0; else shown++;
        paint();
        if (shown > 0) steps[shown].scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
      showBtn.addEventListener("click", function () { wx.classList.toggle("open"); showBtn.textContent = wx.classList.contains("open") ? "ซ่อนวิธีทำ" : "ดูวิธีทำ"; });
      wx._reset = function (practice) { shown = -1; paint(); showBtn.hidden = !practice; showBtn.textContent = "ดูวิธีทำ"; wx.classList.remove("open"); };
    });
    var pb = $("practiceBtn");
    if (pb) pb.addEventListener("click", function () {
      var on = !art.classList.contains("practice");
      art.classList.toggle("practice", on);
      pb.setAttribute("aria-pressed", on ? "true" : "false");
      pb.textContent = on ? "ออกจากโหมดฝึกทำ" : "โหมดฝึกทำ: ซ่อนวิธีทำ";
      examples.forEach(function (wx) { if (wx._reset) wx._reset(on); });
    });
  })();

  // ======================================================================= formula index (hub)
  (function () {
    var box = $("fxIndex");
    if (!box) return;
    var inp = $("fxFilter"), items = Array.prototype.slice.call(box.querySelectorAll(".fx")), chips = box.querySelectorAll(".fx-chips button");
    var page = "", LIMIT = 12, expanded = false;
    var more = document.createElement("button");
    more.type = "button"; more.className = "btn btn-ghost btn-sm fx-more";
    box.appendChild(more);
    more.addEventListener("click", function () { expanded = !expanded; run(); if (!expanded) box.scrollIntoView({ block: "start" }); });
    items.forEach(function (li) {
      var t = li.getAttribute("data-k") || "";
      li.querySelectorAll("annotation").forEach(function (a) { t += " " + a.textContent.toLowerCase(); });
      li._hay = t;
    });
    function run() {
      var raw = inp.value.trim().toLowerCase().replace(/×/g, "x");
      var terms = raw.split(/\s+/).filter(Boolean), n = 0, limited = !terms.length && !page && !expanded;
      items.forEach(function (li) {
        var idm = terms.length === 1 && /^[a-z]\d+[a-z]?$/.test(terms[0]);
        var ok = (!page || li.getAttribute("data-p") === page) &&
          (idm ? li.querySelector(".fid").textContent.toLowerCase() === terms[0] || li._hay.indexOf(terms[0] + " ") >= 0 : terms.every(function (t) { return li._hay.indexOf(t) >= 0; }));
        if (ok) n++;
        li.hidden = !ok || (limited && n > LIMIT);
      });
      more.hidden = !!terms.length || !!page;
      more.textContent = expanded ? "ย่อรายการ ↑" : "แสดงทั้งหมด " + items.length + " สูตร ↓";
      $("fxCount").textContent = (terms.length || page ? "พบ " : "ทั้งหมด ") + n + " สูตร";
      $("fxEmpty").hidden = n > 0;
    }
    inp.addEventListener("input", run);
    inp.addEventListener("keydown", function (e) { if (e.key === "Escape") { inp.value = ""; run(); } });
    chips.forEach(function (b) {
      b.addEventListener("click", function () {
        page = b.getAttribute("data-p");
        chips.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        run();
      });
    });
    run();
  })();
})();
