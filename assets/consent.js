/* Cookie consent (PDPA / GDPR style opt-in) for modsengineeringmath.com.
   - Google AdSense is NOT loaded until the visitor presses "accept". The tiny inline script in <head> (src/layout.html)
     loads it on later pages when the stored choice is ads: true.
   - The choice lives in localStorage "mem-consent-v1" = {"v":1,"ads":true|false,"t":"ISO time"} on the visitor's device only.
   - "Accept" and "Decline" are equal buttons. Declining keeps every lesson, lab and calculator fully usable, with no ads.
   - The footer button [data-consent-open] (and any element with that attribute) reopens the panel to change the choice;
     withdrawing removes AdSense's first-party cookies on this domain and reloads the page so the ad script is gone.
   No dependencies; works on Thai and English pages (text follows <html lang>). */
(function () {
  "use strict";
  var KEY = "mem-consent-v1", CLIENT = "ca-pub-3139064301447683";
  var EN = (document.documentElement.getAttribute("lang") || "th").toLowerCase().indexOf("en") === 0;
  var L = EN ? {
    title: "Cookies & privacy",
    body: "This site shows ads from Google AdSense, which uses cookies to show and measure ads. Ads load <b>only if you press “Accept”</b>. If you decline, every lesson, lab and calculator still works in full, with no ads.",
    more: "Privacy policy", change: "You can change this anytime with “Cookie settings” at the bottom of every page.",
    yes: "Accept ad cookies", no: "Decline", close: "Close",
    nowYes: "Current choice: ad cookies accepted", nowNo: "Current choice: ad cookies declined",
    link: "Cookie settings", privacy: "/privacy/#english"
  } : {
    title: "คุกกี้และความเป็นส่วนตัว",
    body: "เว็บไซต์นี้แสดงโฆษณาจาก Google AdSense ซึ่งใช้คุกกี้เพื่อแสดงและวัดผลโฆษณา โฆษณาจะโหลด<b>ก็ต่อเมื่อคุณกด “ยอมรับ” เท่านั้น</b> ถ้าไม่ยอมรับ บทเรียน แล็บ และเครื่องคิดเลขทุกอย่างยังใช้ได้ครบเหมือนเดิม และไม่มีโฆษณา",
    more: "นโยบายความเป็นส่วนตัว", change: "เปลี่ยนใจได้ทุกเมื่อที่ปุ่ม “ตั้งค่าคุกกี้” ท้ายทุกหน้า",
    yes: "ยอมรับคุกกี้โฆษณา", no: "ไม่ยอมรับ", close: "ปิด",
    nowYes: "สถานะตอนนี้: ยอมรับคุกกี้โฆษณาแล้ว", nowNo: "สถานะตอนนี้: ไม่ยอมรับคุกกี้โฆษณา",
    link: "ตั้งค่าคุกกี้", privacy: "/privacy/"
  };

  function read() { try { var c = JSON.parse(localStorage.getItem(KEY) || "null"); return c && typeof c.ads === "boolean" ? c : null; } catch (e) { return null; } }
  function write(ads) { try { localStorage.setItem(KEY, JSON.stringify({ v: 1, ads: ads, t: new Date().toISOString() })); } catch (e) { /* storage blocked: choice lasts for this page only */ } }
  function loadAds() {
    if (window.__adsOn) return;
    window.__adsOn = 1;
    var s = document.createElement("script");
    s.async = true; s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + CLIENT;
    document.head.appendChild(s);
  }
  // first-party cookies that AdSense / Google's consent tools may set on this domain
  function clearAdCookies() {
    var names = ["__gads", "__gpi", "__eoi", "FCCDCF", "FCNEC", "_gcl_au"];
    var host = location.hostname, domains = ["", host, "." + host];
    var parts = host.split("."); if (parts.length > 2) domains.push("." + parts.slice(-2).join("."));
    names.forEach(function (n) {
      domains.forEach(function (d) { document.cookie = n + "=; Max-Age=0; path=/" + (d ? "; domain=" + d : ""); });
    });
  }

  var panel = null;
  function close() {
    if (!panel) return;
    panel.remove(); panel = null;
    document.documentElement.classList.remove("has-consent");
    document.documentElement.style.removeProperty("--consent-h");
  }
  function open(fromButton) {
    close();
    var cur = read();
    panel = document.createElement("section");
    panel.className = "consent-bar no-print";
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", L.title);
    panel.innerHTML = '<div class="consent-in">' +
      '<div class="consent-text"><b class="consent-h">🍪 ' + L.title + "</b><p>" + L.body + "</p>" +
      '<p class="consent-small">' + (cur ? (cur.ads ? L.nowYes : L.nowNo) + " · " : "") + L.change + ' · <a href="' + L.privacy + '">' + L.more + "</a></p></div>" +
      '<div class="consent-btns"><button type="button" class="consent-btn" data-c="yes">' + L.yes + '</button><button type="button" class="consent-btn" data-c="no">' + L.no + "</button>" +
      (cur ? '<button type="button" class="consent-x" data-c="close" aria-label="' + L.close + '">✕</button>' : "") + "</div></div>";
    document.body.appendChild(panel);
    var fit = function () { if (panel) document.documentElement.style.setProperty("--consent-h", panel.offsetHeight + "px"); };
    document.documentElement.classList.add("has-consent");
    fit(); setTimeout(fit, 300);
    panel.addEventListener("click", function (e) {
      var b = e.target.closest("[data-c]"); if (!b) return;
      var c = b.getAttribute("data-c");
      if (c === "yes") { write(true); close(); loadAds(); }
      else if (c === "no") {
        var had = !!window.__adsOn;
        write(false); clearAdCookies(); close();
        if (had) location.reload(); // unload the ad script that is already running on this page
      } else close();
    });
    if (fromButton) { var first = panel.querySelector(".consent-btn"); if (first) first.focus(); }
  }

  function boot() {
    // label the footer button in English pages
    Array.prototype.forEach.call(document.querySelectorAll("[data-consent-open]"), function (b) { if (EN && b.classList.contains("consent-link")) b.textContent = L.link; });
    document.addEventListener("click", function (e) { if (e.target.closest("[data-consent-open]")) { e.preventDefault(); open(true); } });
    window.addEventListener("resize", function () { if (panel) document.documentElement.style.setProperty("--consent-h", panel.offsetHeight + "px"); });
    if (!read()) open(false);
  }
  window.MEMConsent = { open: function () { open(true); }, get: read };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
