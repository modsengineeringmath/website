/* About page: live status feed from /data/updates.json, filters, bio tabs */
(function () {
  var PAGE = 5;
  var nowList = document.getElementById("nowList"), feed = document.getElementById("feed"),
      filters = document.getElementById("feedFilters"), more = document.getElementById("feedMore");
  var active = "ทั้งหมด", shown = PAGE;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function thaiDate(iso) {
    try {
      return new Date(iso + "T00:00:00+07:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });
    } catch (e) { return iso; }
  }
  function ago(iso) {
    var d = Math.round((Date.now() - new Date(iso + "T00:00:00+07:00").getTime()) / 86400000);
    if (d <= 0) return "วันนี้";
    if (d === 1) return "เมื่อวาน";
    if (d < 30) return d + " วันที่แล้ว";
    return "";
  }

  function render(data) {
    if (nowList && data.now) {
      nowList.innerHTML = data.now.map(function (n) {
        return '<li><span class="now-ic" aria-hidden="true">' + esc(n.icon || "•") + "</span><span>" + esc(n.text) + "</span></li>";
      }).join("");
    }
    if (!feed) return;
    var items = (data.updates || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    feed.innerHTML = items.map(function (u) {
      var rel = ago(u.date);
      return '<li class="post" data-tag="' + esc(u.tag) + '"><div class="post-meta">' +
        (u.tag ? '<span class="tag">' + esc(u.tag) + "</span>" : "") +
        '<time datetime="' + esc(u.date) + '">' + thaiDate(u.date) + "</time>" + (rel ? "<span>· " + rel + "</span>" : "") +
        "</div><p>" + esc(u.text) + "</p>" +
        (u.link ? '<a class="post-link" href="' + esc(u.link) + '">' + esc(u.linkText || "อ่านต่อ") + " →</a>" : "") + "</li>";
    }).join("");
    buildFilters(items);
    apply();
  }

  function buildFilters(items) {
    if (!filters) return;
    var tags = ["ทั้งหมด"];
    items.forEach(function (u) { if (u.tag && tags.indexOf(u.tag) < 0) tags.push(u.tag); });
    if (tags.length <= 2) { filters.innerHTML = ""; return; } // nothing to filter yet
    filters.innerHTML = tags.map(function (t) {
      return '<button type="button" aria-pressed="' + (t === active) + '">' + esc(t) + "</button>";
    }).join("");
  }

  function apply() {
    var posts = [].slice.call(feed.querySelectorAll(".post")), visible = 0, total = 0;
    posts.forEach(function (p) {
      var match = active === "ทั้งหมด" || p.dataset.tag === active;
      if (match) total++;
      p.hidden = !match || visible >= shown;
      if (match && visible < shown) visible++;
    });
    if (more) more.hidden = total <= shown;
  }

  if (filters) filters.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    active = b.textContent; shown = PAGE;
    [].forEach.call(filters.children, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    apply();
  });
  if (more) more.addEventListener("click", function () { shown += PAGE; apply(); });

  // Use the server-rendered list immediately, then refresh from the JSON file
  if (feed) apply();
  var bucket = Math.floor(Date.now() / 60000); // change once a minute to skip stale caches
  fetch("/data/updates.json?t=" + bucket, { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d) render(d); })
    .catch(function () {});

  // bio tabs
  var tabs = document.getElementById("bioTabs");
  if (tabs) {
    var btns = [].slice.call(tabs.querySelectorAll("[role=tab]"));
    var select = function (b) {
      btns.forEach(function (x) {
        var on = x === b;
        x.setAttribute("aria-selected", on ? "true" : "false");
        x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute("aria-controls")).hidden = !on;
      });
    };
    tabs.addEventListener("click", function (e) { var b = e.target.closest("[role=tab]"); if (b) select(b); });
    tabs.addEventListener("keydown", function (e) {
      var i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        var n = btns[(i + (e.key === "ArrowRight" ? 1 : btns.length - 1)) % btns.length];
        select(n); n.focus();
      }
    });
  }
})();
