/* Shared behaviour: theme toggle, mobile menu, site search, YouTube facades, copy & print buttons */
(function () {
  var root = document.documentElement, KEY = "mem-theme";

  // theme
  var themeBtn = document.getElementById("themeToggle");
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var cur = root.getAttribute("data-theme");
    if (!cur) cur = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    var next = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
  });

  // mobile menu
  var header = document.getElementById("siteHeader"), menuBtn = document.getElementById("menuBtn"), nav = document.getElementById("siteNav");
  function setMenu(open) {
    if (!header) return;
    if (open) header.setAttribute("data-open", ""); else header.removeAttribute("data-open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "ปิดเมนู" : "เปิดเมนู");
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", function () { setMenu(!header.hasAttribute("data-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.hasAttribute("data-open")) { setMenu(false); menuBtn.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (header.hasAttribute("data-open") && !header.contains(e.target)) setMenu(false);
    });
    matchMedia("(min-width:1900px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  // menu groups: accordion in the hamburger panel, dropdown on desktop (hover, focus or click)
  if (nav) {
    var wide = matchMedia("(min-width:1900px)"), grps = nav.querySelectorAll(".nav-grp");
    var setGrp = function (g, open) {
      if (open) g.setAttribute("data-open", ""); else g.removeAttribute("data-open");
      g.querySelector(".nav-tg").setAttribute("aria-expanded", open ? "true" : "false");
    };
    var closeOthers = function (keep) { Array.prototype.forEach.call(grps, function (g) { if (g !== keep) setGrp(g, false); }); };
    Array.prototype.forEach.call(grps, function (g) {
      Array.prototype.forEach.call(g.querySelectorAll("a"), function (a) { if (a.getAttribute("href") === location.pathname) a.classList.add("nav-here"); });
      var here = g.querySelector(".nav-here"), top = g.querySelector('[aria-current="page"]');
      if (here && top && here !== top) top.removeAttribute("aria-current");
      var cur = here || top;
      if (cur) { g.classList.add("nav-cur"); if (!wide.matches) setGrp(g, true); }
      g.querySelector(".nav-tg").addEventListener("click", function (e) {
        e.stopPropagation();
        var open = !g.hasAttribute("data-open");
        if (wide.matches) closeOthers(g);
        setGrp(g, open);
      });
    });
    document.addEventListener("click", function (e) { if (wide.matches && !nav.contains(e.target)) closeOthers(null); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && wide.matches) closeOthers(null); });
    wide.addEventListener("change", function (m) {
      Array.prototype.forEach.call(grps, function (g) { setGrp(g, !m.matches && g.classList.contains("nav-cur")); });
    });
  }

  // site search: header button, "/" or Ctrl/⌘+K opens a dialog over /search-index.json (written by build.mjs, loaded on first open)
  var dlg = document.getElementById("searchDlg"), sBtn = document.getElementById("searchBtn");
  if (dlg && sBtn && dlg.showModal) {
    var sIn = document.getElementById("searchInput"), sList = document.getElementById("searchResults"), sStat = document.getElementById("searchStatus");
    var EN = root.lang === "en", pages = null, loading = null, hits = [], act = -1, timer;
    var T = EN
      ? { hint: sStat.textContent, load: "Loading the index…", fail: "Could not load the search index. Please try again.", none: function (q) { return "No results for “" + q + "”"; }, n: function (n) { return n + " results"; }, th: "Thai", en: "English" }
      : { hint: sStat.textContent, load: "กำลังโหลดดัชนี…", fail: "โหลดดัชนีค้นหาไม่สำเร็จ ลองใหม่อีกครั้ง", none: function (q) { return "ไม่พบผลลัพธ์สำหรับ “" + q + "”"; }, n: function (n) { return "พบ " + n + " หน้า"; }, th: "ไทย", en: "English" };
    var norm = function (x) { return (x || "").normalize("NFKC").toLowerCase().replace(/[​-‍﻿]/g, ""); };
    var escH = function (x) { return x.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var load = function () {
      if (!loading) {
        sStat.textContent = T.load;
        loading = fetch("/search-index.json").then(function (r) { if (!r.ok) throw r.status; return r.json(); }).then(function (list) {
          pages = list.map(function (p) {
            return { p: p, t: norm(p.t), d: norm(p.d), k: norm(p.k), c: norm(p.c), w: p.w || "", h: p.h.map(function (h) { return norm(h[1]); }) };
          });
          run();
        }, function () { loading = null; sStat.textContent = T.fail; });
      }
      return loading;
    };
    var score = function (x, toks, phrase) {
      var s = 0;
      for (var i = 0; i < toks.length; i++) {
        var w = toks[i], v = 0;
        if (x.t.indexOf(w) >= 0) v += x.t.indexOf(w) === 0 ? 14 : 10;
        var nh = x.h.filter(function (h) { return h.indexOf(w) >= 0; }).length;
        if (nh) v += 2 + Math.min(nh, 4);
        if (x.k.indexOf(w) >= 0) v += 3;
        if (x.d.indexOf(w) >= 0) v += 2;
        if (!v && x.w.indexOf(w) >= 0) v = 1;
        if (!v && x.c.indexOf(w) >= 0) v = 1; // series name only counts when nothing on the page itself matches
        if (!v) return 0;
        s += v;
      }
      if (toks.length > 1 && x.t.indexOf(phrase) >= 0) s += 10;
      else if (toks.length > 1 && (x.k.indexOf(phrase) >= 0 || x.d.indexOf(phrase) >= 0 || x.h.some(function (h) { return h.indexOf(phrase) >= 0; }))) s += 8;
      return s + (x.p.l === (root.lang || "th") ? 3 : 0) - x.p.u.split("/").length * 0.1;
    };
    var mark = function (text, re) {
      var out = "", last = 0;
      text.replace(re, function (m, at) { out += escH(text.slice(last, at)) + "<mark>" + escH(m) + "</mark>"; last = at + m.length; return m; });
      return out + escH(text.slice(last));
    };
    var snip = function (text, toks) {
      if (text.length <= 170) return text;
      var n = norm(text), at = -1;
      toks.forEach(function (w) { var i = n.indexOf(w); if (i >= 0 && (at < 0 || i < at)) at = i; });
      var from = at < 90 ? 0 : at - 60;
      return (from ? "…" : "") + text.slice(from, from + 170).trim() + "…";
    };
    var setAct = function (i) {
      var links = sList.querySelectorAll("a");
      if (!links.length) { act = -1; sIn.removeAttribute("aria-activedescendant"); return; }
      act = (i + links.length) % links.length;
      Array.prototype.forEach.call(links, function (a, k) { a.setAttribute("aria-selected", k === act ? "true" : "false"); });
      links[act].scrollIntoView({ block: "nearest" });
      sIn.setAttribute("aria-activedescendant", links[act].id);
    };
    var run = function () {
      var q = sIn.value.trim();
      if (!q) { sList.innerHTML = ""; sStat.textContent = T.hint; act = -1; return; }
      if (!pages) { load(); return; }
      var phrase = norm(q), toks = phrase.split(/\s+/).filter(Boolean);
      var re = new RegExp(toks.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).sort(function (a, b) { return b.length - a.length; }).join("|"), "gi");
      hits = pages.map(function (x) { return { x: x, s: score(x, toks, phrase) }; }).filter(function (r) { return r.s > 0; })
        .sort(function (a, b) { return b.s - a.s; });
      var n = 0, total = hits.length;
      hits = hits.slice(0, 25);
      sList.innerHTML = hits.map(function (r) {
        var p = r.x.p, subs = r.x.h.map(function (h, i) { return { i: i, m: toks.filter(function (w) { return h.indexOf(w) >= 0; }).length }; })
          .filter(function (h) { return h.m; }).sort(function (a, b) { return b.m - a.m || a.i - b.i; }).slice(0, 3);
        var meta = [p.c ? escH(p.c) : "", p.l !== (root.lang || "th") ? (p.l === "en" ? T.en : T.th) : ""].filter(Boolean).join(" · ");
        return '<li><a id="sr' + n++ + '" role="option" href="' + escH(p.u) + '"><b>' + mark(p.t, re) + "</b>" +
          (meta ? "<small>" + meta + "</small>" : "") + "<span>" + mark(snip(p.d, toks), re) + "</span></a>" +
          (subs.length ? '<ul class="search-subs">' + subs.map(function (h) {
            var hh = p.h[h.i];
            return '<li><a id="sr' + n++ + '" role="option" href="' + escH(p.u + "#" + hh[0]) + '">' + mark(hh[1], re) + "</a></li>";
          }).join("") + "</ul>" : "") + "</li>";
      }).join("");
      sStat.textContent = total ? T.n(total) : T.none(q);
      setAct(0);
    };
    var openS = function () {
      if (dlg.open) return;
      if (header && header.hasAttribute("data-open")) setMenu(false);
      dlg.showModal();
      sIn.focus();
      sIn.select();
      load();
    };
    sBtn.addEventListener("click", openS);
    sIn.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(run, 90); });
    sIn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setAct(act + (e.key === "ArrowDown" ? 1 : -1)); }
      else if (e.key === "Enter") {
        e.preventDefault();
        clearTimeout(timer);
        if (act < 0) run();
        var a = sList.querySelectorAll("a")[act];
        if (a) a.click();
      }
    });
    sList.addEventListener("click", function (e) { if (e.target.closest("a")) dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", function () { sBtn.focus(); });
    document.addEventListener("keydown", function (e) {
      var el = e.target, typing = el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey)) {
        e.preventDefault();
        openS();
      }
    });
  }

  // footer year
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  // YouTube playlist facade: <div class="screen" data-yt-list="ID" data-yt-title="...">
  document.querySelectorAll("[data-yt-list]").forEach(function (box) {
    var btn = box.querySelector(".play");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/videoseries?list=" + encodeURIComponent(box.dataset.ytList) + "&autoplay=1&rel=0";
      f.title = (box.dataset.ytTitle || "YouTube") + " — เพลย์ลิสต์";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      f.allowFullscreen = true;
      box.innerHTML = "";
      box.appendChild(f);
    });
  });

  // Single video / Shorts facade: <div class="screen short" data-yt-id="ID" data-yt-title="...">
  document.querySelectorAll("[data-yt-id]").forEach(function (box) {
    var btn = box.querySelector(".play");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(box.dataset.ytId) + "?autoplay=1&rel=0&playsinline=1";
      f.title = box.dataset.ytTitle || "YouTube";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      f.referrerPolicy = "strict-origin-when-cross-origin";
      f.allowFullscreen = true;
      box.innerHTML = "";
      box.appendChild(f);
    });
  });

  // copy buttons: <button data-copy="#targetId">
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]");
    if (!b) return;
    var el = document.querySelector(b.getAttribute("data-copy"));
    if (!el) return;
    var text = el.innerText.trim();
    var done = function () {
      var old = b.textContent;
      b.textContent = "คัดลอกแล้ว ✓";
      setTimeout(function () { b.textContent = old; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
    } else { fallback(text); done(); }
  });
  function fallback(text) {
    var t = document.createElement("textarea");
    t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(t);
  }

  // share buttons: native share sheet on phones, otherwise copy the link
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-share-url]");
    if (!b) return;
    var url = b.getAttribute("data-share-url"), title = b.getAttribute("data-share-title") || document.title;
    var done = function () {
      var old = b.textContent;
      b.textContent = "คัดลอกลิงก์แล้ว ✓";
      setTimeout(function () { b.textContent = old; }, 1800);
    };
    if (navigator.share && matchMedia("(pointer:coarse)").matches) {
      navigator.share({ title: title, url: url }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { fallback(url); done(); });
    } else { fallback(url); done(); }
  });

  // print buttons
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-print]")) window.print();
  });
})();
