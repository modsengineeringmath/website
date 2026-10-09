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
    matchMedia("(min-width:1240px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
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

  // print buttons
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-print]")) window.print();
  });
})();
