/* Mod's Engineering Mathematics — Celtic Cross photo reader (/tools/tarot-photo/ and /en/tools/tarot-photo/)
   For a spread laid out with real cards: take or choose a photo, pin the ten positions on it with two taps, name each card
   and the way its head points, then read it with the same engine as /tools/tarot/. The photo never leaves the browser.
   Needs tarot-data.js, tarot-engine.js and tarot-view.js. Renders into #tarotPhoto; the language comes from data-lang. */
(function () {
  "use strict";
  const app = document.getElementById("tarotPhoto");
  if (!app || !window.TarotData || !window.TarotEngine || !window.TarotView) return;
  const T = window.TarotData, E = window.TarotEngine;
  const lang = app.dataset.lang === "en" ? "en" : "th";
  const en = lang === "en";
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const $ = (sel) => app.querySelector(sel);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  // ===== strings ====================================================================================
  const U = Object.assign({}, window.TarotView.STR[lang], {
    th: {
      steps: ["ถ่ายภาพ", "ระบุไพ่", "คำถาม", "อ่านผล"],
      photoH: "ถ่ายภาพไพ่บนโต๊ะ",
      photoTip: "วางไพ่ Celtic Cross 10 ใบบนพื้นเรียบ ถ่ายตรงจากด้านบนให้เห็นไพ่ครบทุกใบ ภาพอยู่ในเครื่องของคุณเท่านั้น ไม่ถูกอัปโหลด ถ้าจะกรอกชื่อไพ่อย่างเดียวข้ามขั้นนี้ได้",
      take: "ถ่ายภาพ", pick: "เลือกภาพจากเครื่อง", recal: "ปักหมุดใหม่", clearPhoto: "เอาภาพออก",
      noPhoto: "ยังไม่มีภาพ บนมือถือ ปุ่ม “ถ่ายภาพ” จะเปิดกล้องให้",
      cal1: "แตะกลางกากบาท ตรงที่ใบ 1 กับใบ 2 ซ้อนกัน",
      cal2: "แตะกลางไพ่ใบที่ 10 ใบบนสุดของแถวด้านขวา",
      calDone: "ปักหมุดครบ 10 ตำแหน่งแล้ว ลากหมุดให้ตรงไพ่ได้ แตะหมุดเพื่อเลือกตำแหน่งนั้น",
      nameH: "ระบุไพ่ 10 ใบ",
      nameTip: "แตะตำแหน่งในผัง เลือกไพ่ แล้วเลือกทิศของไพ่ตามที่เห็นบนโต๊ะ ระบบจะเลื่อนไปตำแหน่งถัดไปให้เอง",
      progress: (n) => `ระบุแล้ว ${n}/10 ใบ`, example: "ลองด้วยไพ่ตัวอย่าง", clearAll: "ล้างผัง",
      major: "ชุดใหญ่", upright: "ตั้งตรง", reversed: "กลับหัว", headL: "หัวไพ่ชี้ซ้าย (ไปทางใบ 4)", headR: "หัวไพ่ชี้ขวา (ไปทางใบ 6)",
      readAs: (o) => `อ่านเป็น${o}`, remove: "เอาไพ่ออก", usedAt: (p) => `อยู่ตำแหน่ง ${p}`, posN: (p) => `ตำแหน่ง ${p}`,
      ruleH: "กติกาใบที่ 2 (ไพ่ไขว้)",
      rules: { left: "หัวชี้ซ้าย = ตั้งตรง", right: "หัวชี้ขวา = ตั้งตรง", up: "อ่านตั้งตรงเสมอ" },
      ruleTip: "ใบที่ 2 วางขวางจึงไม่มีบน-ล่างตามธรรมชาติ ดูว่าหัวไพ่ (ขอบที่มีเลขไพ่ ตรงข้ามกับแถบชื่อในสำรับ Rider–Waite) ชี้ไปทางใบ 4 หรือใบ 6 แล้วใช้กติกาเดียวทุกครั้ง หน้าเว็บจำกติกาที่เลือกไว้ในเครื่องนี้",
      invert: "ถ่ายภาพจากฝั่งผู้ถาม (กลับทิศทุกใบ)",
      lines: ["ธาตุเดียวกัน เสริมแรง", "ธาตุมิตร หนุนกัน", "เป็นกลาง", "ธาตุตรงข้าม ลดทอน"],
      short: ["", "ปัจจุบัน", "สิ่งที่ขวาง", "รากฐาน", "อดีต", "เป้าหมาย", "อนาคตใกล้", "ตัวคุณ", "สิ่งแวดล้อม", "หวัง/กลัว", "ผลลัพธ์"],
      empty: "ว่าง", qH: "คำถามและวันเกิด", qLabel: "คำถามของคุณ (ไม่บังคับ แต่ช่วยให้อ่านตรงเรื่อง)",
      qPh: "เช่น งานใหม่ที่กำลังตัดสินใจจะไปทางไหน", birthL: "วันเกิด (ไม่บังคับ ใช้คำนวณราศี เลขเส้นทางชีวิต และไพ่ประจำตัว)",
      readBtn: "อ่านไพ่", need: (n) => `ยังขาดอีก ${n} ใบ ระบุให้ครบ 10 ใบก่อน`,
      privacy: "ภาพ คำถาม และวันเกิดอยู่ในเบราว์เซอร์ของคุณเท่านั้น ไม่ถูกส่งไปที่ใด",
      birthHint: "ใส่วันเกิดในขั้นที่ 3 เพื่อให้ระบบคำนวณราศี เลขเส้นทางชีวิต และไพ่ประจำตัว แล้วเชื่อมกับไพ่ในผัง",
      cardIn: (c, p) => `${c} ตำแหน่ง ${p}`, emptyIn: (p, t) => `ตำแหน่ง ${p} ${t} ว่าง แตะเพื่อเลือกไพ่`,
    },
    en: {
      steps: ["Photo", "Name the cards", "Question", "Reading"],
      photoH: "Photograph the cards on the table",
      photoTip: "Lay out the ten Celtic Cross cards on a flat surface and shoot straight down so every card is in the frame. The photo stays on your device and is never uploaded. To type the cards in only, skip this step.",
      take: "Take photo", pick: "Choose a photo", recal: "Re-pin", clearPhoto: "Remove photo",
      noPhoto: "No photo yet. On a phone, “Take photo” opens the camera.",
      cal1: "Tap the centre of the cross, where cards 1 and 2 overlap",
      cal2: "Tap the centre of card 10, the top card of the column on the right",
      calDone: "All ten positions are pinned. Drag a pin onto its card; tap a pin to select that position.",
      nameH: "Name the ten cards",
      nameTip: "Tap a position in the spread, choose the card, then the direction it lies on the table. The next empty position opens by itself.",
      progress: (n) => `${n}/10 cards named`, example: "Try an example spread", clearAll: "Clear spread",
      major: "Major Arcana", upright: "Upright", reversed: "Reversed", headL: "Head points left (toward card 4)", headR: "Head points right (toward card 6)",
      readAs: (o) => `Read as ${o.toLowerCase()}`, remove: "Remove card", usedAt: (p) => `in position ${p}`, posN: (p) => `Position ${p}`,
      ruleH: "Card 2 rule (the crossing card)",
      rules: { left: "Head left = upright", right: "Head right = upright", up: "Always upright" },
      ruleTip: "Card 2 lies sideways, so it has no natural up or down. Look at where its head points (the edge with the card number, opposite the title banner on Rider–Waite cards): toward card 4 or toward card 6. Then keep one rule every time. The page remembers your rule on this device.",
      invert: "Photo taken from the querent's side (invert every card)",
      lines: ["Same element · strengthen", "Friendly · support", "Neutral", "Contrary · weaken"],
      short: ["", "Present", "Challenge", "Foundation", "Past", "Crown", "Near future", "Self", "Environment", "Hopes & fears", "Outcome"],
      empty: "empty", qH: "Question and birth date", qLabel: "Your question (optional, but it focuses the reading)",
      qPh: "e.g. Where is the new job decision heading?", birthL: "Birth date (optional; used for your sun sign, Life Path number and birth cards)",
      readBtn: "Read the cards", need: (n) => `${n} more card${n === 1 ? "" : "s"} to name before reading`,
      privacy: "Your photo, question and birth date stay in your browser and are never sent anywhere.",
      birthHint: "Add your birth date in step 3 to compute your sun sign, Life Path number and birth cards and link them to the spread.",
      cardIn: (c, p) => `${c}, position ${p}`, emptyIn: (p, t) => `Position ${p}, ${t}, empty. Tap to choose a card`,
    },
  }[lang]);
  const V = window.TarotView(lang, U);

  // ===== geometry: one spread frame (720 × 620) for the diagram and for pins on the photo ============
  const P = { 1: [230, 300], 2: [230, 300], 3: [230, 490], 4: [70, 300], 5: [230, 110], 6: [390, 300], 7: [530, 510], 8: [530, 370], 9: [530, 230], 10: [530, 90] };
  const LBL = { 1: ["c", 230, 205], 2: ["c", 230, 398], 3: ["c", 230, 580], 4: ["l", 30, 212], 5: ["c", 230, 28], 6: ["c", 390, 212], 7: ["l", 580, 510], 8: ["l", 580, 370], 9: ["l", 580, 230], 10: ["l", 580, 90] };
  // where each pin sits in the same frame: card 1's visible top edge and card 2's right arm keep the two pins apart
  const PIN = { 1: [230, 250], 2: [292, 300], 3: [230, 490], 4: [70, 300], 5: [230, 110], 6: [390, 300], 7: [530, 510], 8: [530, 370], 9: [530, 230], 10: [530, 90] };
  const ANCHOR_A = [230, 300], ANCHOR_B = [530, 90]; // centre of the cross, card 10
  const PAIRS = [[1, 2], [3, 5], [4, 6], [1, 10], [5, 10], [7, 8], [7, 9], [9, 10]];
  const PATHS = { "3-5": "M230,490 Q40,300 230,110", "4-6": "M70,300 Q230,500 390,300", "1-10": "M230,300 L530,90", "5-10": "M230,110 L530,90", "7-8": "M530,510 Q420,440 530,370", "7-9": "M530,510 Q370,370 530,230", "9-10": "M530,230 Q420,160 530,90" };
  const DIG = { 2: "tp-l-strong", 1: "tp-l-friend", 0: "tp-l-neutral", "-1": "tp-l-enemy" };
  const pct = (v, d) => (v / d * 100).toFixed(3) + "%";
  const OPP = { up: "down", down: "up", left: "right", right: "left" };

  // complex-number similarity: maps the spread frame onto the photo from two matching points
  function similarity(a, b, A, B) {
    const dx = b[0] - a[0], dy = b[1] - a[1], DX = B[0] - A[0], DY = B[1] - A[1], d = dx * dx + dy * dy || 1;
    const re = (DX * dx + DY * dy) / d, im = (DY * dx - DX * dy) / d;
    return (p) => { const x = p[0] - a[0], y = p[1] - a[1]; return [A[0] + re * x - im * y, A[1] + im * x + re * y]; };
  }

  // ===== state ======================================================================================
  const KEY = "mem-tarot-photo";
  let saved = null;
  try { saved = JSON.parse(store.get(KEY) || "null"); } catch (e) { saved = null; }
  const S = {
    cards: (saved && saved.cards) || {}, rule: (saved && saved.rule) || "left", invert: !!(saved && saved.invert),
    sel: 1, tab: "M", photo: null, cal: 0, A: null, B: null, pins: null, report: null,
  };
  const save = () => store.set(KEY, JSON.stringify({ cards: S.cards, rule: S.rule, invert: S.invert }));
  const EXAMPLE = { 1: [17, "up"], 2: [54, "right"], 3: [48, "up"], 4: [71, "down"], 5: [19, "up"], 6: [33, "up"], 7: [9, "up"], 8: [38, "up"], 9: [58, "down"], 10: [10, "up"] };

  const card = (pos) => (S.cards[pos] ? T.CARDS[S.cards[pos].id] : null);
  function head(pos) {
    const s = S.cards[pos]; if (!s) return null;
    let h = s.top || (pos === 2 ? "left" : "up");
    if (pos === 2 && (h === "up" || h === "down")) h = "left";
    if (pos !== 2 && (h === "left" || h === "right")) h = "up";
    return S.invert ? OPP[h] : h;
  }
  function isRev(pos) {
    const h = head(pos); if (!h) return false;
    if (pos === 2) return S.rule === "up" ? false : h !== S.rule;
    return h === "down";
  }
  const count = () => Object.keys(S.cards).filter((p) => card(+p)).length;
  const usedBy = (id) => { for (let p = 1; p <= 10; p++) if (S.cards[p] && S.cards[p].id === id) return p; return 0; };
  const nextEmpty = (from) => { for (let k = 1; k <= 10; k++) { const p = ((from - 1 + k) % 10) + 1; if (!S.cards[p]) return p; } return 0; };
  const cardName = (c) => c.name[lang];
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollTo = (el) => el && el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });

  // ===== skeleton ===================================================================================
  app.innerHTML = V.SPRITE + `
<ol class="tc-steps" aria-label="${en ? "Steps" : "ขั้นตอน"}">${U.steps.map((s, i) => `<li><b>${i + 1}</b>${esc(s)}</li>`).join("")}</ol>
<section class="tc-panel" aria-labelledby="tpPhotoH">
  <h2 class="tc-h" id="tpPhotoH"><span>1</span>${U.photoH}</h2>
  <p class="tc-tip">${U.photoTip}</p>
  <div class="tp-row">
    <label class="btn btn-primary" for="tpCam">${U.take}</label><input id="tpCam" class="tp-file" type="file" accept="image/*" capture="environment">
    <label class="btn btn-ghost" for="tpPick">${U.pick}</label><input id="tpPick" class="tp-file" type="file" accept="image/*">
    <button class="btn btn-ghost" type="button" data-act="recal" hidden>${U.recal}</button>
    <button class="btn btn-ghost" type="button" data-act="nophoto" hidden>${U.clearPhoto}</button>
  </div>
  <div class="tp-photo" id="tpPhoto"><p class="tp-nophoto">${U.noPhoto}</p></div>
  <p class="tp-msg" id="tpCalDone" role="status"></p>
</section>
<section class="tc-panel" id="tpName" aria-labelledby="tpNameH">
  <h2 class="tc-h" id="tpNameH"><span>2</span>${U.nameH}</h2>
  <p class="tc-tip">${U.nameTip}</p>
  <div class="tp-row tp-between"><p class="tp-progress" id="tpProg"></p>
    <div class="tp-row"><button class="btn btn-ghost btn-sm" type="button" data-act="example">${U.example}</button><button class="btn btn-ghost btn-sm" type="button" data-act="clear">${U.clearAll}</button></div></div>
  <div class="tp-work">
    <div class="tp-stagewrap"><div class="tp-stage" id="tpStage"></div><p class="tp-legend" id="tpLegend"></p></div>
    <div class="tp-picker" id="tpPicker" aria-live="polite"></div>
  </div>
  <div class="tp-rule">
    <p class="tc-lbl">${U.ruleH}</p>
    <div class="tp-seg" role="group" aria-label="${esc(U.ruleH)}">${["left", "right", "up"].map((k) => `<button type="button" data-rule="${k}">${esc(U.rules[k])}</button>`).join("")}</div>
    <p class="tc-small">${U.ruleTip}</p>
    <label class="tc-check"><input type="checkbox" id="tpInvert"> ${U.invert}</label>
  </div>
</section>
<section class="tc-panel" aria-labelledby="tpQH">
  <h2 class="tc-h" id="tpQH"><span>3</span>${U.qH}</h2>
  <label class="tc-lbl" for="tpQ">${U.qLabel}</label>
  <textarea id="tpQ" rows="3" maxlength="300" placeholder="${esc(U.qPh)}"></textarea>
  <div class="tc-row"><label class="tc-birth" for="tpBirth">${U.birthL}<input id="tpBirth" type="date"></label></div>
  <div class="tp-row"><button class="btn btn-primary" type="button" data-act="read">${U.readBtn}</button></div>
  <p class="tc-warn" id="tpNeed" role="status"></p>
  <p class="tc-small">${U.privacy}</p>
</section>
<section class="tc-panel tc-read" id="tcRead" aria-labelledby="tcReadH" hidden></section>`;

  // ===== spread diagram ============================================================================
  function renderStage() {
    let html = `<svg class="tp-links" viewBox="0 0 720 620" aria-hidden="true">`;
    for (const [a, b] of PAIRS) {
      const d = PATHS[a + "-" + b], A = card(a), B = card(b);
      if (!d || !A || !B) continue;
      html += `<path d="${d}" class="${DIG[T.dignity(A.el, B.el)]}${!S.sel || S.sel === a || S.sel === b ? "" : " is-dim"}"/>`;
    }
    html += "</svg>";
    for (let pos = 1; pos <= 10; pos++) {
      const c = card(pos), [x, y] = P[pos], rev = isRev(pos), h = head(pos), t = U.short[pos];
      const rot = !c ? 0 : pos === 2 ? (h === "right" ? 90 : -90) : rev ? 180 : 0;
      const label = c ? U.cardIn(cardName(c) + (rev ? ` (${U.reversed})` : ""), pos) : U.emptyIn(pos, t);
      html += `<button type="button" class="tp-slot${pos === 2 ? " tp-h" : ""}${c ? "" : " is-empty"}${S.sel === pos ? " is-sel" : ""}" data-pos="${pos}" style="left:${pct(x, 720)};top:${pct(y, 620)}" aria-label="${esc(label)}" aria-pressed="${S.sel === pos}">`
        + (c ? `<span class="tp-art" style="transform:translate(-50%,-50%) rotate(${rot}deg)">${V.cardSVG(c.id)}</span>` : `<span class="tp-num">${pos}</span>`) + `</button>`;
      const [k, lx, ly] = LBL[pos];
      html += `<div class="tp-lbl tp-lbl-${k}" style="left:${pct(lx, 720)};top:${pct(ly, 620)}" aria-hidden="true"><b>${pos}</b> ${esc(t)}<span class="tp-nm">${c ? esc(cardName(c)) + (rev ? " ▼" : "") : ""}</span></div>`;
    }
    $("#tpStage").innerHTML = html;
    $("#tpLegend").innerHTML = ["tp-l-strong", "tp-l-friend", "tp-l-neutral", "tp-l-enemy"].map((k, i) => `<span><svg width="28" height="8" viewBox="0 0 28 8" aria-hidden="true"><path d="M1 4H27" class="${k}"/></svg>${esc(U.lines[i])}</span>`).join("");
    $("#tpProg").textContent = U.progress(count());
  }

  // ===== card picker ================================================================================
  let pend = null; // direction chosen for an empty position before its card
  function renderPicker() {
    const pos = S.sel, el = $("#tpPicker");
    if (!pos) { el.innerHTML = ""; return; }
    const c = card(pos), pp = T.POSITIONS[pos];
    const cur = c ? head(pos) : pend || (pos === 2 ? "left" : "up");
    const dirs = pos === 2 ? [["left", U.headL], ["right", U.headR]] : [["up", U.upright], ["down", U.reversed]];
    const orient = `<div class="tp-seg" role="group">${dirs.map(([k, t]) => `<button type="button" data-top="${k}" aria-pressed="${cur === k}">${esc(t)}</button>`).join("")}</div>`
      + (pos === 2 && c ? `<p class="tc-small">${esc(U.readAs(isRev(2) ? U.reversed : U.upright))} · ${esc(U.rules[S.rule])}</p>` : "");
    const tabs = [["M", U.major], ...T.SUIT_KEYS.map((s) => [s, T.SUITS[s][lang]])];
    const list = T.CARDS.filter((x) => (S.tab === "M" ? x.major : !x.major && x.suit === S.tab));
    const grid = list.map((x) => {
      const u = usedBy(x.id), mine = u === pos;
      const txt = x.major ? `<small>${x.roman}</small>${esc(x.name[lang])}` : esc(T.RANKS[x.rank][lang]);
      return `<button type="button" data-card="${x.id}"${mine ? ' class="is-on"' : ""}${u && !mine ? ` disabled title="${esc(U.usedAt(u))}"` : ""} aria-pressed="${mine}">${txt}${u && !mine ? `<em>${u}</em>` : ""}</button>`;
    }).join("");
    el.innerHTML = `<p class="tp-pk-k">${esc(U.posN(pos))}</p><h3 class="tp-pk-h">${esc(pp[lang])}</h3><p class="tc-small">${esc(pp.d[lang])}</p>
      ${orient}
      <div class="tp-tabs" role="group">${tabs.map(([k, t]) => `<button type="button" data-tab="${k}" aria-pressed="${S.tab === k}">${esc(t)}</button>`).join("")}</div>
      <div class="tp-grid${S.tab === "M" ? " tp-grid-m" : ""}">${grid}</div>
      ${c ? `<div class="tp-chosen"><div class="tp-mini${pos !== 2 && isRev(pos) ? " is-rev" : ""}">${V.cardSVG(c.id)}</div><div><p class="tp-chosen-n">${esc(cardName(c))}${isRev(pos) ? ` · ${esc(U.reversed)}` : ""}</p><button type="button" class="tc-link" data-act="remove">${U.remove}</button></div></div>` : ""}`;
  }

  // ===== photo and pins =============================================================================
  function renderPhoto() {
    const box = $("#tpPhoto");
    $('[data-act="recal"]').hidden = !S.photo; $('[data-act="nophoto"]').hidden = !S.photo;
    if (!S.photo) { box.innerHTML = `<p class="tp-nophoto">${U.noPhoto}</p>`; box.classList.remove("is-cal"); $("#tpCalDone").textContent = ""; return; }
    // the tap prompt floats over the photo so the image never moves between the two taps
    if (!box.querySelector("img")) box.innerHTML = `<img src="${S.photo}" alt="" draggable="false"><div class="tp-pins"></div><p class="tp-calbar" id="tpCalMsg" role="status"></p>`;
    const msg = $("#tpCalMsg"); msg.textContent = S.cal === 1 ? U.cal1 : S.cal === 2 ? U.cal2 : ""; msg.hidden = !msg.textContent;
    $("#tpCalDone").textContent = S.cal === 3 ? U.calDone : "";
    box.classList.toggle("is-cal", S.cal === 1 || S.cal === 2);
    renderPins();
  }
  function renderPins() {
    const layer = $("#tpPhoto .tp-pins"); if (!layer) return;
    let h = S.cal === 2 && S.A ? `<span class="tp-anchor" style="left:${(S.A[0] * 100).toFixed(2)}%;top:${(S.A[1] * 100).toFixed(2)}%"></span>` : "";
    if (S.pins) for (let pos = 1; pos <= 10; pos++) {
      const [x, y] = S.pins[pos], c = card(pos), rev = isRev(pos);
      const txt = c ? cardName(c) + (rev ? " ▼" : "") : U.short[pos];
      h += `<button type="button" class="tp-pin${S.sel === pos ? " is-sel" : ""}${c ? "" : " is-empty"}" data-pin="${pos}" style="left:${(x * 100).toFixed(2)}%;top:${(y * 100).toFixed(2)}%" aria-label="${esc(c ? U.cardIn(txt, pos) : U.emptyIn(pos, U.short[pos]))}"><span>${esc(txt)}</span><i>${pos}</i></button>`;
    }
    layer.innerHTML = h;
  }
  function computePins() {
    const img = $("#tpPhoto img"), W = img.naturalWidth || 1, H = img.naturalHeight || 1;
    const f = similarity(ANCHOR_A, ANCHOR_B, [S.A[0] * W, S.A[1] * H], [S.B[0] * W, S.B[1] * H]);
    S.pins = {};
    for (let p = 1; p <= 10; p++) { const [x, y] = f(PIN[p]); S.pins[p] = [clamp01(x / W), clamp01(y / H)]; }
  }
  const frac = (ev) => { const r = $("#tpPhoto img").getBoundingClientRect(); return [clamp01((ev.clientX - r.left) / r.width), clamp01((ev.clientY - r.top) / r.height)]; };

  // ===== steps, reading ==============================================================================
  function syncSteps() {
    const stage = S.report ? 3 : count() === 10 ? 2 : S.photo || count() ? 1 : 0;
    app.querySelectorAll(".tc-steps li").forEach((li, i) => { li.classList.toggle("is-done", i < stage); li.classList.toggle("is-now", i === stage); });
    app.querySelectorAll("[data-rule]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.rule === S.rule));
    $("#tpInvert").checked = S.invert;
  }
  function stale() { if (S.report) { S.report = null; $("#tcRead").hidden = true; $("#tcRead").innerHTML = ""; } }
  function renderAll() { renderStage(); renderPicker(); renderPins(); syncSteps(); }

  function read() {
    const n = 10 - count();
    if (n) { $("#tpNeed").textContent = U.need(n); select(nextEmpty(0)); scrollTo($("#tpName")); return; }
    $("#tpNeed").textContent = "";
    S.spread = Array.from({ length: 10 }, (_, i) => ({ id: S.cards[i + 1].id, r: isRev(i + 1) ? 1 : 0 }));
    S.report = E.analyze(S.spread, { lang, question: $("#tpQ").value, birth: $("#tpBirth").value, reversals: true, today: new Date() });
    const out = $("#tcRead");
    out.innerHTML = V.readingHtml(S.report, { step: "4", actions: ["copy", "print"], birthHint: U.birthHint });
    out.hidden = false;
    out.querySelector('[data-act="copy"]').addEventListener("click", copyReading);
    out.querySelector('[data-act="print"]').addEventListener("click", () => window.print());
    syncSteps();
    setTimeout(() => scrollTo(out), reduce ? 0 : 60);
  }
  async function copyReading() {
    const text = E.toText(S.report, S.spread);
    try { await navigator.clipboard.writeText(text); }
    catch (e) { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (x) { /* ignore */ } ta.remove(); }
    const b = $('#tcRead [data-act="copy"]'); const old = b.textContent; b.textContent = U.copied; setTimeout(() => { b.textContent = old; }, 1600);
  }

  // ===== actions ====================================================================================
  function select(pos) {
    S.sel = pos; pend = null;
    const c = card(pos); if (c) S.tab = c.major ? "M" : c.suit;
    renderAll();
  }
  function setTop(pos, k) { // k = direction as seen on the table
    const raw = S.invert ? OPP[k] : k;
    if (S.cards[pos]) { S.cards[pos].top = raw; save(); stale(); } else pend = k;
    renderAll();
  }
  function setCard(id) {
    const pos = S.sel; if (!pos) return;
    const had = !!S.cards[pos];
    const k = had ? head(pos) : pend || (pos === 2 ? "left" : "up");
    S.cards[pos] = { id, top: S.invert ? OPP[k] : k };
    save(); stale();
    if (!had) { const nx = nextEmpty(pos); if (nx) { S.sel = nx; pend = null; } }
    renderAll();
  }

  app.addEventListener("click", (ev) => {
    const t = ev.target.closest("button"); if (!t || !app.contains(t)) return;
    if (t.dataset.pos) { const pos = +t.dataset.pos; if (S.sel === pos && S.cards[pos]) setTop(pos, OPP[head(pos)]); else select(pos); return; }
    if (t.dataset.pin) { select(+t.dataset.pin); return; }
    if (t.dataset.card) { setCard(+t.dataset.card); return; }
    if (t.dataset.tab) { S.tab = t.dataset.tab; renderPicker(); return; }
    if (t.dataset.top) { setTop(S.sel, t.dataset.top); return; }
    if (t.dataset.rule) { S.rule = t.dataset.rule; save(); stale(); renderAll(); return; }
    const act = t.dataset.act;
    if (act === "remove") { delete S.cards[S.sel]; save(); stale(); renderAll(); }
    else if (act === "example") { S.cards = {}; for (const [p, [id, k]] of Object.entries(EXAMPLE)) S.cards[p] = { id, top: S.invert ? OPP[k] : k }; save(); stale(); select(1); }
    else if (act === "clear") { S.cards = {}; save(); stale(); select(1); }
    else if (act === "read") read();
    else if (act === "recal" && S.photo) { S.cal = 1; S.A = S.B = null; S.pins = null; renderPhoto(); }
    else if (act === "nophoto") { if (S.photo) URL.revokeObjectURL(S.photo); S.photo = null; S.cal = 0; S.pins = null; renderPhoto(); syncSteps(); }
  });
  $("#tpInvert").addEventListener("change", (ev) => { S.invert = ev.target.checked; save(); stale(); renderAll(); });

  function onFile(ev) {
    const f = ev.target.files && ev.target.files[0]; ev.target.value = "";
    if (!f) return;
    if (S.photo) URL.revokeObjectURL(S.photo);
    S.photo = URL.createObjectURL(f); S.cal = 1; S.A = S.B = null; S.pins = null;
    $("#tpPhoto").innerHTML = "";
    renderPhoto(); syncSteps();
    scrollTo($("#tpPhoto"));
  }
  $("#tpCam").addEventListener("change", onFile);
  $("#tpPick").addEventListener("change", onFile);

  // two taps pin the frame; afterwards pins can be dragged
  const photo = $("#tpPhoto");
  let drag = null;
  photo.addEventListener("click", (ev) => {
    if (!(S.cal === 1 || S.cal === 2) || !ev.target.closest("img, .tp-pins")) return;
    if (S.cal === 1) { S.A = frac(ev); S.cal = 2; }
    else { S.B = frac(ev); computePins(); S.cal = 3; }
    renderPhoto();
  });
  photo.addEventListener("pointerdown", (ev) => {
    const pin = ev.target.closest("[data-pin]"); if (!pin || S.cal !== 3) return;
    drag = { pos: +pin.dataset.pin, x: ev.clientX, y: ev.clientY, moved: false, el: pin };
    pin.setPointerCapture(ev.pointerId);
  });
  photo.addEventListener("pointermove", (ev) => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < 6) return;
    drag.moved = true;
    const [x, y] = frac(ev); S.pins[drag.pos] = [x, y];
    drag.el.style.left = (x * 100).toFixed(2) + "%"; drag.el.style.top = (y * 100).toFixed(2) + "%";
  });
  const endDrag = () => { drag = null; };
  photo.addEventListener("pointerup", endDrag);
  photo.addEventListener("pointercancel", endDrag);

  renderAll();
  renderPhoto();
})();
