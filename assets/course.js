// Courses (/courses/): "learned" marks and progress (kept only in this browser's localStorage), classroom mode, print.
(function () {
  var art = document.querySelector("[data-course]");
  var EN = document.documentElement.lang === "en";
  var KEY = art ? "course-done:" + art.dataset.course : "";
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }

  // lesson page
  var tools = document.querySelector(".c-tools");
  if (tools && art) {
    var slug = art.dataset.lesson, done = tools.querySelector(".c-done"), cls = tools.querySelector(".c-class");
    var paint = function () {
      var on = load().indexOf(slug) >= 0;
      done.setAttribute("aria-pressed", on);
      done.textContent = EN ? (on ? "Learned (click to undo)" : "Mark as learned") : on ? "เรียนแล้ว (กดเพื่อยกเลิก)" : "ทำเครื่องหมายว่าเรียนแล้ว";
    };
    done.addEventListener("click", function () {
      var list = load(), i = list.indexOf(slug);
      if (i >= 0) list.splice(i, 1); else list.push(slug);
      save(list); paint();
    });
    paint();
    var setClass = function (on) {
      document.body.classList.toggle("c-classroom", on);
      cls.setAttribute("aria-pressed", on);
      cls.textContent = EN ? (on ? "Leave classroom mode (Esc)" : "Classroom mode") : on ? "ออกจากโหมดสอนในห้อง (Esc)" : "โหมดสอนในห้อง";
      // answers stay folded; the teacher opens them on the projector when ready
      if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
      if (!on && document.fullscreenElement) document.exitFullscreen().catch(function () {});
    };
    cls.addEventListener("click", function () { setClass(!document.body.classList.contains("c-classroom")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.body.classList.contains("c-classroom")) setClass(false); });
    document.addEventListener("fullscreenchange", function () { if (!document.fullscreenElement && document.body.classList.contains("c-classroom")) setClass(false); });
    tools.querySelector(".c-print").addEventListener("click", function () {
      // print with every answer open, then fold them again
      var closed = [].slice.call(document.querySelectorAll("details.c-ans:not([open])"));
      closed.forEach(function (d) { d.open = true; });
      window.print();
      setTimeout(function () { closed.forEach(function (d) { d.open = false; }); }, 500);
    });
  }

  // course hub
  var prog = document.querySelector(".c-prog");
  if (prog && art) {
    var links = [].slice.call(document.querySelectorAll(".c-unit a[data-lesson]"));
    var paintHub = function () {
      var list = load(), n = 0;
      links.forEach(function (a) {
        var on = list.indexOf(a.dataset.lesson) >= 0;
        if (on) n++;
        a.querySelector(".c-bd-done").hidden = !on;
      });
      prog.hidden = n === 0;
      prog.querySelector("i").style.width = (links.length ? (100 * n) / links.length : 0) + "%";
      prog.querySelector(".c-prog-t").textContent = EN ? "Learned " + n + " of " + links.length + " open units (saved in this browser only)" : "เรียนแล้ว " + n + " จาก " + links.length + " หน่วยที่เปิด (บันทึกในเบราว์เซอร์นี้เท่านั้น)";
    };
    prog.querySelector(".c-prog-reset").addEventListener("click", function () { save([]); paintHub(); });
    paintHub();
  }
})();
