/* Mod's Engineering Mathematics — Tarot card art and reading renderer (no state).
   Shared by the shuffle reader (/tools/tarot/, assets/tarot.js) and the photo reader (/tools/tarot-photo/, assets/tarot-photo.js).
   TarotView(lang, U) returns { SPRITE, BACK, cardSVG, trendSvg, treeSvg, readingHtml, elName }; TarotView.STR holds the reading strings.
   readingHtml(report, { step, extraStats, actions, birthHint }) renders a report from TarotEngine.analyze(). Needs tarot-data.js. */
(function (root) {
  "use strict";
  const STR = {
    th: {
      readH: "ผลการอ่าน", answer: "คำตอบโดยสรุป", yesno: "แนวโน้มคำตอบใช่/ไม่ใช่", timing: "ช่วงเวลา", byPos: "อ่านทีละตำแหน่ง", axes: "การอ่านแบบเชื่อมโยง",
      trend: "แนวโน้มพลังงานตามเส้นเวลา", trendNote: "จุดคือค่าพลังงานของไพ่ (−3 ถึง +3) เส้นประคือเส้นตรงที่ได้จากวิธีกำลังสองน้อยที่สุด",
      tAxis: ["3 รากฐาน", "4 อดีต", "1 ปัจจุบัน", "6 อนาคต", "10 ผลลัพธ์"],
      elements: "สมดุลธาตุและความสัมพันธ์ของธาตุ", dign: "ความสัมพันธ์ของธาตุ (Elemental dignities)", astro: "โหราศาสตร์ในไพ่", signs: "ราศี", planets: "ดาวเคราะห์", modes: "ลักษณะพลังของราศี",
      numbers: "ตัวเลขและแก่นสาร", tree: "Key of Life · ต้นไม้แห่งชีวิต", treeNote: "วงกลมคือสิบเสฟิรอท ยิ่งเข้มยิ่งมีไพ่ลงมาก ตัวเลขข้างวงคือตำแหน่งไพ่ชุดเล็ก เส้นสีส้มคือเส้นทางของไพ่ชุดใหญ่ที่เปิดได้",
      birth2: "กุญแจชีวิตจากวันเกิด", advice: "คำแนะนำ", stats: "สถิติของการเปิดไพ่ครั้งนี้", deckAt: (p, r) => `ระดับการผสมของสำรับตอนวางไพ่: ${p}% · ริฟเฟิล ${r} ครั้ง`,
      copy: "คัดลอกผลการอ่าน", copied: "คัดลอกแล้ว", again: "ดูดวงใหม่ (เก็บไพ่คืนสำรับ)", print: "พิมพ์",
      disclaimer: "การอ่านไพ่ทาโรต์เป็นเครื่องมือทบทวนความคิดและเพื่อความบันเทิง ยังไม่มีหลักฐานทางวิทยาศาสตร์ว่าไพ่ทำนายอนาคตได้ ใช้ผลการอ่านเป็นมุมมองหนึ่งประกอบการตัดสินใจ และอย่าใช้แทนคำปรึกษาจากแพทย์ นักกฎหมาย หรือที่ปรึกษาการเงิน",
      up: "ตั้งตรง", revd: "กลับหัว", position: "ตำแหน่ง", score: "คะแนนรวม",
      count: (n) => `${n} ใบ`, none: "ไม่มี",
    },
    en: {
      readH: "Your reading", answer: "The answer in brief", yesno: "Yes/no lean", timing: "Timing", byPos: "Position by position", axes: "Reading the connections",
      trend: "Energy along the time line", trendNote: "Dots are card valences (−3 to +3); the dashed line is the least-squares fit.",
      tAxis: ["3 root", "4 past", "1 present", "6 future", "10 outcome"],
      elements: "Element balance and elemental dignities", dign: "Elemental dignities", astro: "Astrology in the cards", signs: "Signs", planets: "Planets", modes: "Modalities",
      numbers: "Numbers and quintessence", tree: "Key of Life · the Tree of Life", treeNote: "Circles are the ten Sephiroth; darker means more cards. Numbers beside them are Minor Arcana positions; orange lines are the paths of the Major Arcana drawn.",
      birth2: "Keys from your birth date", advice: "Advice", stats: "Statistics of this draw", deckAt: (p, r) => `Deck mixing when dealt: ${p}% · ${r} riffles`,
      copy: "Copy reading", copied: "Copied", again: "New reading (gather cards back)", print: "Print",
      disclaimer: "Tarot is a tool for reflection and entertainment; there is no scientific evidence that cards predict the future. Treat the reading as one perspective among others, and never as a substitute for a doctor, lawyer or financial adviser.",
      up: "upright", revd: "reversed", position: "Position", score: "Overall score",
      count: (n) => `${n} card${n === 1 ? "" : "s"}`, none: "none",
    },
  };

  function TarotView(lang, U) {
    const T = root.TarotData;
    const en = lang === "en";
    U = U || STR[lang];
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    // ===== card art (original designs drawn in SVG) ====================================================
    const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
  <symbol id="tc-W" viewBox="0 0 20 40"><path fill="currentColor" d="M8.6 7h2.8v31H8.6z"/><circle fill="currentColor" cx="10" cy="5" r="3.4"/><path fill="currentColor" d="M11.4 15c3.6-2.6 6.4-2 7.6.4-3 1.3-5.6 1.3-7.6-.4zM8.6 24c-3.6-2.6-6.4-2-7.6.4 3 1.3 5.6 1.3 7.6-.4z"/></symbol>
  <symbol id="tc-C" viewBox="0 0 30 40"><path fill="currentColor" d="M3 4h24c0 9.2-4.6 15.4-10 16.6V29h6v4H7v-4h6v-8.4C7.6 19.4 3 13.2 3 4z"/><path fill="var(--tc-paper)" opacity=".55" d="M7 7.5h4.5c0 4.5 1.2 8 3 10-4.5-1.2-7.2-5-7.5-10z"/></symbol>
  <symbol id="tc-S" viewBox="0 0 20 40"><path fill="currentColor" d="M10 1l3.2 6.4V27H6.8V7.4z"/><rect fill="currentColor" x="1.5" y="27" width="17" height="3.2" rx="1.2"/><rect fill="currentColor" x="8.4" y="30" width="3.2" height="6.4"/><circle fill="currentColor" cx="10" cy="37.8" r="2"/></symbol>
  <symbol id="tc-P" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M20 4.5L29.1 32.5 5.3 15.2h29.4L10.9 32.5z"/></symbol>
  <symbol id="tc-fire" viewBox="0 0 40 40"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" d="M20 5L36 33H4z"/></symbol>
  <symbol id="tc-water" viewBox="0 0 40 40"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" d="M20 35L36 7H4z"/></symbol>
  <symbol id="tc-air" viewBox="0 0 40 40"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" d="M20 5L36 33H4zM9 21.5h22"/></symbol>
  <symbol id="tc-earth" viewBox="0 0 40 40"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" d="M20 35L36 7H4zM9 18.5h22"/></symbol>
  <pattern id="tc-grid" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H8M0 0V8" stroke="#c8a25a" stroke-width=".5" opacity=".35"/></pattern>
  </defs></svg>`;
    const ICON = { W: [20, 40, 0.55], C: [30, 40, 0.66], S: [20, 40, 0.55], P: [40, 40, 0.44] }; // viewBox w, h and base scale
    const PIPS = {
      2: [[50, 52], [50, 108]], 3: [[50, 44], [50, 80], [50, 116]], 4: [[34, 50], [66, 50], [34, 110], [66, 110]],
      5: [[34, 48], [66, 48], [50, 80], [34, 112], [66, 112]], 6: [[34, 44], [66, 44], [34, 80], [66, 80], [34, 116], [66, 116]],
      7: [[34, 42], [66, 42], [50, 61], [34, 80], [66, 80], [34, 118], [66, 118]], 8: [[34, 40], [66, 40], [34, 66], [66, 66], [34, 94], [66, 94], [34, 120], [66, 120]],
      9: [[34, 40], [66, 40], [34, 66], [66, 66], [50, 80], [34, 94], [66, 94], [34, 120], [66, 120]],
      10: [[34, 38], [66, 38], [50, 51], [34, 64], [66, 64], [34, 96], [66, 96], [50, 109], [34, 122], [66, 122]],
    };
    function icon(s, x, y, k) {
      const [w, h, b] = ICON[s];
      const sc = b * k, W = w * sc, H = h * sc;
      return `<use href="#tc-${s}" x="${(x - W / 2).toFixed(1)}" y="${(y - H / 2).toFixed(1)}" width="${W.toFixed(1)}" height="${H.toFixed(1)}"/>`;
    }
    const EMBLEM = {
      14: '<path d="M38 56 41.5 42l8.5 8 8.5-8L62 56z"/><circle cx="41.5" cy="41" r="1.8"/><circle cx="50" cy="48.5" r="1.8"/><circle cx="58.5" cy="41" r="1.8"/>',
      13: '<path d="M40 56 42.8 45.5 50 51l7.2-5.5L60 56z"/><circle cx="50" cy="42" r="3.2"/>',
      12: '<path d="M41 40h18v9c0 6.5-4.4 9.6-9 11.8-4.6-2.2-9-5.3-9-11.8z"/>',
      11: '<path d="M50 38.5l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z"/>',
    };
    function cardSVG(id, title) {
      const c = T.CARDS[id];
      const nm = c.name[lang];
      const fs = nm.length > 15 ? 6.6 : en ? 7.4 : 8;
      const fit = nm.length > 14 ? ` textLength="84" lengthAdjust="spacingAndGlyphs"` : "";
      let art = "", top = "";
      if (c.major) {
        top = c.roman;
        const rays = Array.from({ length: 16 }, (_, i) => { const a = (i * Math.PI) / 8, r1 = 31, r2 = i % 2 ? 34 : 37; return `M${(50 + r1 * Math.cos(a)).toFixed(1)} ${(80 + r1 * Math.sin(a)).toFixed(1)}L${(50 + r2 * Math.cos(a)).toFixed(1)} ${(80 + r2 * Math.sin(a)).toFixed(1)}`; }).join("");
        let glyph;
        if (c.sign != null) glyph = `<text class="tc-glyph" x="50" y="81">${T.SIGNS[c.sign].g}︎</text>`;
        else if (c.planet) glyph = `<text class="tc-glyph" x="50" y="81">${T.PLANETS[c.planet].g}</text>`;
        else glyph = `<use href="#tc-${c.el}" x="34" y="64" width="32" height="32"/>`;
        art = `<path d="${rays}" stroke="currentColor" stroke-width="1" opacity=".55"/><circle cx="50" cy="80" r="27" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="50" cy="80" r="23.5" fill="none" stroke="currentColor" stroke-width=".6" opacity=".5"/>${glyph}<text class="tc-heb" x="50" y="126">${c.heb}</text>`;
      } else if (c.rank === 1) {
        top = "A";
        art = `<circle cx="50" cy="80" r="30" fill="none" stroke="currentColor" stroke-width=".8" opacity=".5"/><circle cx="50" cy="80" r="34" fill="none" stroke="currentColor" stroke-width=".5" stroke-dasharray="1.5 3" opacity=".6"/>${icon(c.suit, 50, 80, 2.5)}`;
      } else if (c.rank <= 10) {
        top = String(c.rank);
        const k = c.rank >= 7 ? 0.82 : 1;
        art = PIPS[c.rank].map(([x, y]) => icon(c.suit, x, y, k)).join("");
      } else {
        top = T.RANKS[c.rank].s;
        art = `<g fill="currentColor" opacity=".9">${EMBLEM[c.rank]}</g>${icon(c.suit, 50, 98, 1.7)}`;
      }
      const gold = c.major ? `<rect x="3" y="3" width="94" height="154" rx="4.5" fill="none" stroke="var(--tc-gold)" stroke-width="1.2"/>` : "";
      return `<svg class="tc-svg tc-e-${c.el}" viewBox="0 0 100 160" role="img" aria-label="${esc(title || nm)}"><rect x=".8" y=".8" width="98.4" height="158.4" rx="6" fill="var(--tc-paper)" stroke="currentColor" stroke-width="1.6"/>${gold}<rect x="7" y="7" width="86" height="146" rx="3" fill="none" stroke="currentColor" stroke-width=".7" opacity=".45"/><text class="tc-top" x="50" y="21">${top}</text>${art}<text class="tc-name" x="50" y="146" style="font-size:${fs}px"${fit}>${esc(nm)}</text></svg>`;
    }
    const BACK = `<svg class="tc-svg tc-back-svg" viewBox="0 0 100 160" aria-hidden="true"><rect x=".8" y=".8" width="98.4" height="158.4" rx="6" fill="var(--tc-back)" stroke="#c8a25a" stroke-width="1.4"/><rect x="7" y="7" width="86" height="146" rx="3" fill="url(#tc-grid)" stroke="#c8a25a" stroke-width=".7" opacity=".9"/><circle cx="50" cy="80" r="22" fill="var(--tc-back)" stroke="#c8a25a" stroke-width=".9"/><path d="M33 86c5 0 6-14 11-14s5 12 9 9 5-3 14-3" fill="none" stroke="#e8692c" stroke-width="3.2" stroke-linecap="round"/></svg>`;

    const elName = (e) => T.ELEMENTS[e][lang];
    function trendSvg(tr) {
      const W = 320, H = 170, x0 = 34, x1 = W - 14, y0 = 14, y1 = H - 34;
      const X = (t) => x0 + ((t + 2) / 4) * (x1 - x0), Y = (v) => y0 + ((3 - v) / 6) * (y1 - y0);
      const grid = [-3, -2, -1, 0, 1, 2, 3].map((v) => `<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" class="${v === 0 ? "tc-g0" : "tc-g"}"/><text x="${x0 - 6}" y="${Y(v) + 3.5}" class="tc-gl" text-anchor="end">${v > 0 ? "+" + v : v}</text>`).join("");
      const pts = tr.points.map((p) => [X(p.t), Y(p.y)]);
      const line = `<line x1="${X(-2)}" y1="${Y(tr.mean - 2 * tr.slope)}" x2="${X(2)}" y2="${Y(tr.mean + 2 * tr.slope)}" class="tc-fit"/>`;
      const poly = `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" class="tc-pl"/>`;
      const dots = pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" class="tc-dot"/><text x="${p[0]}" y="${H - 16}" class="tc-gl" text-anchor="middle">${U.tAxis[i].split(" ")[0]}</text><text x="${p[0]}" y="${H - 4}" class="tc-gl tc-gl2" text-anchor="middle">${U.tAxis[i].split(" ").slice(1).join(" ")}</text>`).join("");
      return `<svg class="tc-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(U.trend + ": " + tr.label)}">${grid}${line}${poly}${dots}</svg>`;
    }
    function treeSvg(tree) {
      const SP = T.SEPHIROT;
      const mx = Math.max(1, ...tree.seph.slice(1));
      const used = new Map(tree.paths.map((p) => [p.n, p]));
      const lines = T.PATHS.map(([a, b], n) => {
        const u = used.get(n);
        const A = SP[a], B = SP[b];
        const f = 0.36; // label a third of the way along, so crossing paths (25 and 27) do not collide
        const mid = u ? `<text x="${(A.x + (B.x - A.x) * f).toFixed(1)}" y="${(A.y + (B.y - A.y) * f + 3).toFixed(1)}" class="tc-tp">${u.pos}</text>` : "";
        return `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="${u ? "tc-path is-on" : "tc-path"}"/>${mid}`;
      }).join("");
      const nodes = SP.slice(1).map((s, i) => {
        const k = i + 1, w = tree.seph[k];
        const posTxt = tree.sephPos[k].length ? `<text x="${s.x + (s.x < 100 ? -17 : s.x > 100 ? 17 : 17)}" y="${s.y + 3}" class="tc-sp" text-anchor="${s.x < 100 ? "end" : "start"}">${tree.sephPos[k].join("·")}</text>` : "";
        return `<circle cx="${s.x}" cy="${s.y}" r="13" class="tc-seph-b"/><circle cx="${s.x}" cy="${s.y}" r="13" class="tc-seph" fill-opacity="${w ? (0.18 + 0.72 * (w / mx)).toFixed(2) : 0}"/><text x="${s.x}" y="${s.y + 3}" class="tc-sn">${k}</text><text x="${s.x}" y="${s.y + 23}" class="tc-sl">${s.k}</text>${posTxt}`;
      }).join("");
      return `<svg class="tc-tree" viewBox="-14 0 228 352" role="img" aria-label="${esc(U.tree)}">${lines}${nodes}</svg>`;
    }
    function readingHtml(r, o = {}) {
      const posLi = r.positions.map((p) => {
        const tags = p.tags.map((t) => `<span class="tc-tag${t.k === "el" ? " tc-e-" + t.el : ""}">${esc(t.text)}</span>`).join("");
        return `<li id="tcPos${p.pos}" class="tc-pos"><div class="tc-pos-card${p.rev ? " is-rev" : ""}">${cardSVG(p.id)}</div><div class="tc-pos-body">
          <p class="tc-pos-k">${U.position} ${p.pos} · ${esc(p.title)}</p>
          <h4>${esc(p.name)}</h4>
          <p class="tc-pos-d">${esc(p.desc)}</p>
          <p class="tc-kw">${p.keywords.map((k) => `<span>${esc(k)}</span>`).join("")}</p>
          <p>${esc(p.meaning)}</p>
          ${p.topic ? `<p class="tc-topic">${esc(p.topic)}</p>` : ""}
          ${p.notes.map((n) => `<p class="tc-note">${esc(n)}</p>`).join("")}
          <p class="tc-tags">${tags}</p></div></li>`;
      }).join("");
      const elRows = ["fire", "water", "air", "earth"].map((e) => `<div class="tc-elr tc-e-${e}"><span>${elName(e)}</span><i style="width:${r.elements.count[e] * 10}%"></i><b>${r.elements.count[e]}</b></div>`).join("");
      const digRows = r.dignities.map((d) => {
        const a = r.positions[d.a - 1], b = r.positions[d.b - 1];
        return `<li><b>${d.a} ↔ ${d.b}</b> ${esc(elName(T.CARDS[a.id].el))} / ${esc(elName(T.CARDS[b.id].el))}: ${esc(d.text)}</li>`;
      }).join("");
      const signChips = r.astro.signs.map((n, i) => n ? `<span class="tc-chip${r.astro.topSigns.includes(i) ? " is-top" : ""}">${T.SIGNS[i].g}︎ ${T.SIGNS[i][lang]} × ${n}</span>` : "").join("") || `<span class="tc-chip">${U.none}</span>`;
      const planetChips = Object.entries(r.astro.planets).sort((a, b) => b[1] - a[1]).map(([p, n]) => `<span class="tc-chip${r.astro.topPlanets.includes(p) ? " is-top" : ""}">${T.PLANETS[p].g} ${T.PLANETS[p][lang]} × ${n}</span>`).join("") || `<span class="tc-chip">${U.none}</span>`;
      const modeChips = Object.entries(r.astro.modes).map(([m, n]) => `<span class="tc-chip${r.astro.topMode.includes(m) && n ? " is-top" : ""}">${T.MODES[m][lang]} × ${n}</span>`).join("");
      const v = r.verdict;
      const gauge = v.show ? `<div class="tc-verdict" data-v="${v.idx}"><p class="tc-pos-k">${U.yesno}</p><div class="tc-gauge"><i style="left:${(((v.yn + 1) / 2) * 100).toFixed(1)}%"></i></div><div class="tc-gauge-l"><span>${en ? "No" : "ไม่"}</span><span>${en ? "Unclear" : "ไม่ชัด"}</span><span>${en ? "Yes" : "ใช่"}</span></div><p><b>${esc(v.label)}</b> — ${esc(v.note)}</p></div>` : "";
      const b = r.birth;
      const birthHtml = b ? `<ul class="tc-list">${b.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>${b.resonance.length ? `<ul class="tc-list tc-res">${b.resonance.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}<div class="tc-bcards">${[...new Set([b.cards.personality, b.cards.soul, b.year])].map((id) => `<figure>${cardSVG(id)}<figcaption>${id === b.year && id !== b.cards.personality && id !== b.cards.soul ? (en ? "Year card" : "ไพ่ประจำปี") : id === b.cards.personality ? (en ? "Personality" : "บุคลิกภาพ") : (en ? "Soul" : "จิตวิญญาณ")}</figcaption></figure>`).join("")}</div>`
        : `<p class="tc-small">${esc(o.birthHint || (en ? "Add your birth date in step 1 to compute your sun sign, Life Path number and birth cards." : "ใส่วันเกิดในขั้นที่ 1 เพื่อให้ระบบคำนวณราศี เลขเส้นทางชีวิต และไพ่ประจำตัว แล้วเชื่อมกับไพ่ที่เปิดได้"))}</p>`;
      return `
    <h2 class="tc-h" id="tcReadH">${o.step ? `<span>${o.step}</span>` : ""}${U.readH}</h2>
    <div class="tc-sum">
      ${r.summary.question ? `<p class="tc-q">${esc(r.summary.question)}</p>` : ""}
      <p class="tc-pos-k">${esc(r.summary.topic)}</p>
      <h3>${U.answer}</h3>
      <p class="tc-lead">${esc(r.summary.text)}</p>
      <p>${esc(r.summary.trend)}</p>
      ${gauge}
      ${r.timing.lines.length ? `<p class="tc-time"><b>${U.timing}:</b> ${esc(r.timing.lines[0])}</p>` : ""}
      ${r.caution ? `<p class="tc-note">${esc(r.caution)}</p>` : ""}
    </div>
    <h3>${U.byPos}</h3>
    <ol class="tc-poslist">${posLi}</ol>
    <h3>${U.axes}</h3>
    <ul class="tc-axes">${r.axes.map((a) => `<li><b>${esc(a.title)}</b><p>${esc(a.text)}</p></li>`).join("")}</ul>
    <div class="tc-grid2">
      <div><h3>${U.trend}</h3>${trendSvg(r.trend)}<p class="tc-small">${U.trendNote}</p><p>${esc(r.summary.trend)}</p></div>
      <div><h3>${U.elements}</h3><div class="tc-els">${elRows}</div><ul class="tc-list">${r.elements.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul><h4>${U.dign}</h4><ul class="tc-list tc-dig">${digRows}</ul></div>
    </div>
    <h3>${U.astro}</h3>
    <p class="tc-chips"><b>${U.signs}</b> ${signChips}</p>
    <p class="tc-chips"><b>${U.planets}</b> ${planetChips}</p>
    <p class="tc-chips"><b>${U.modes}</b> ${modeChips}</p>
    <ul class="tc-list">${r.astro.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
    <h3>${U.numbers}</h3>
    <div class="tc-quint"><div class="tc-pos-card">${cardSVG(r.quint.id)}</div><div><p><b>${esc(r.quint.text)}</b></p><p class="tc-small">${esc(r.quint.how)}</p><p>${esc(r.quint.meaning)}</p>${r.numbers.length ? `<ul class="tc-list">${r.numbers.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}</div></div>
    <h3>${U.tree}</h3>
    <div class="tc-grid2 tc-keys">
      <div>${treeSvg(r.tree)}<p class="tc-small">${U.treeNote}</p></div>
      <div><ul class="tc-list">${r.tree.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul><h4>${U.birth2}</h4>${birthHtml}</div>
    </div>
    <h3>${U.timing}</h3>
    <ul class="tc-list">${r.timing.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
    <h3>${U.advice}</h3>
    <ul class="tc-list tc-advice">${r.advice.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
    <h3>${U.stats}</h3>
    <ul class="tc-list">${r.stats.map((s) => `<li>${esc(s)}</li>`).join("")}${(o.extraStats || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
    <p class="tc-disclaimer">${U.disclaimer}</p>
    <div class="tc-row tc-end no-print">${(o.actions || ["copy", "print", "again"]).map((a, i) => `<button class="btn ${i ? "btn-ghost" : "btn-primary"}" type="button" data-act="${a}">${U[a]}</button>`).join("")}</div>`;
    }

    return { SPRITE, BACK, cardSVG, trendSvg, treeSvg, readingHtml, elName };
  }
  TarotView.STR = STR;
  root.TarotView = TarotView;
})(typeof window !== "undefined" ? window : globalThis);
