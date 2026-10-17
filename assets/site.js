/* Shared behaviour: theme toggle, mobile menu, YouTube facades, copy & print buttons */
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
    matchMedia("(min-width:1600px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  // menu groups: accordion in the hamburger panel, dropdown on desktop (hover, focus or click)
  if (nav) {
    var wide = matchMedia("(min-width:1600px)"), grps = nav.querySelectorAll(".nav-grp");
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
