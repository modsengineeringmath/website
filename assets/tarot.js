/* Mod's Engineering Mathematics — Tarot reader UI (/tools/tarot/ and /en/tools/tarot/)
   Needs tarot-data.js, tarot-engine.js and tarot-view.js. Renders everything into #tarotApp; the language comes from data-lang. */
(function () {
  "use strict";
  const app = document.getElementById("tarotApp");
  if (!app || !window.TarotData || !window.TarotEngine || !window.TarotView) return;
  const T = window.TarotData, E = window.TarotEngine;
  const lang = app.dataset.lang === "en" ? "en" : "th";
  const en = lang === "en";
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const $ = (sel, el = app) => el.querySelector(sel);
  const $$ = (sel, el = app) => Array.from(el.querySelectorAll(sel));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  // ===== strings ====================================================================================
  const U = Object.assign({}, window.TarotView.STR[lang], {
    th: {
      steps: ["ตั้งคำถาม", "สับไพ่", "ตัดไพ่", "วางไพ่", "อ่านผล"],
      askH: "ตั้งคำถาม", askTip: "ตั้งสมาธิกับเรื่องที่อยากรู้ แล้วพิมพ์คำถามให้ชัดเจน คำถามปลายเปิดอย่าง “ควรทำอย่างไรกับ…” ให้คำตอบที่ลึกกว่า ส่วนคำถาม “…ไหม” ระบบจะสรุปแนวโน้มใช่/ไม่ใช่ให้ด้วย",
      qLabel: "คำถามของคุณ", qPh: "เช่น ความสัมพันธ์กับคนที่คุยอยู่จะไปต่อได้ไหม / ควรเปลี่ยนงานในปีนี้หรือไม่",
      birth: "วันเกิด (ไม่บังคับ ใช้คำนวณราศี เลขชีวิต และไพ่ประจำตัว)", rev: "ใช้ไพ่กลับหัว (reversed)",
      privacy: "ทุกอย่างคำนวณในเบราว์เซอร์ของคุณ คำถามและวันเกิดไม่ถูกส่งไปที่ใด",
      detect: (t, f) => `ระบบอ่านคำถามว่า: หมวด${t}${f}`, needQ: "พิมพ์คำถามก่อน แล้วจึงเริ่มสับไพ่",
      shufH: "สับไพ่", shufTip: "สำรับนี้จำลำดับไพ่ต่อจากการเปิดครั้งก่อนบนเครื่องนี้ เหมือนสำรับจริงที่วางอยู่บนโต๊ะ เลือกวิธีสับได้ตามถนัด และดูมาตรวัดว่าไพ่ผสมกันทั่วแค่ไหน",
      riffle: "ริฟเฟิล", riffleSub: "แบ่งครึ่ง แล้วสลับซ้อน", overhand: "โอเวอร์แฮนด์", overSub: "ดึงทีละก้อนจากบนลงมือ", wash: "วนไพ่บนโต๊ะ", washSub: "กดค้างไว้ ยิ่งนานยิ่งทั่ว",
      washing: (s) => `กำลังวนไพ่… ${s} วินาที`,
      meter: "ระดับการผสมของสำรับ", mixLbl: ["ยังไม่ทั่ว", "พอใช้", "ดี", "ทั่วมาก"],
      mRise: "ลำดับขาขึ้น (rising sequences)", mPairs: "คู่ไพ่ที่ยังติดกันเหมือนเดิม", mRho: "สหสัมพันธ์สเปียร์แมน ρ", mRev: "ไพ่กลับหัวในสำรับ",
      ideal: (x) => `สำรับสุ่มดี ≈ ${x}`, tvBound: (k, x) => `ขอบเขตบนทางทฤษฎี (ริฟเฟิล ${k} ครั้ง): ระยะห่างจากลำดับสุ่มสมบูรณ์ ≤ ${x}`,
      strip: "แถบสีแทนไพ่ 78 ใบ ระบายสีตามลำดับก่อนเริ่มสับ (จุดล่าง = กลับหัว)",
      log: "บันทึกการสับ", newDeck: "เริ่มด้วยสำรับใหม่ (เรียงตามโรงพิมพ์)", newDeckDone: "เปลี่ยนเป็นสำรับใหม่แล้ว ไพ่เรียงตามลำดับเริ่มต้นทั้งหมด",
      lRiffle: (i) => `ริฟเฟิล · ตัดที่ ${i.top} | ${i.bottom} ใบ · ไพ่หล่นสลับ ${i.runs} ช่วง${i.turned ? " · หมุนกองล่าง 180°" : ""}`,
      lOver: (i) => `โอเวอร์แฮนด์ · ${i.packets} ก้อน (เฉลี่ย ${i.mean.toFixed(1)} ใบ/ก้อน)`,
      lWash: (i) => `วนไพ่บนโต๊ะ ${i.sec.toFixed(1)} วินาที · ไพ่เปลี่ยนทิศ ${i.flips} ใบ`,
      lCut: (p, o) => `ตัด 3 กอง ${p.join(" / ")} ใบ → เรียงใหม่ ${o.map((x) => x + 1).join("-")}${o.join() === "0,1,2" ? " (ลำดับเดิม)" : ""}`,
      lGather: "เก็บไพ่ 10 ใบจากการเปิดครั้งก่อนวางบนสำรับ",
      cutH: "ตัดไพ่", cutTip: "ตามธรรมเนียม Celtic Cross ผู้ถามตัดไพ่ด้วยมือซ้ายเป็น 3 กอง แล้วรวมกลับในลำดับใหม่ มือคนไม่แม่นยำ จุดตัดจึงคลาดเคลื่อนไปจาก ⅓ และ ⅔ เล็กน้อยทุกครั้ง",
      cutBtn: "ตัดเป็น 3 กอง", pile: ["กองบน", "กองกลาง", "กองล่าง"], cards: "ใบ",
      pickTip: "แตะกองที่จะให้อยู่บนสุดก่อน แล้วแตะกองถัดไปตามลำดับ", cutDone: "รวมกองแล้ว ไพ่ใบบนสุดของสำรับคือไพ่ใบแรกที่จะวาง", needShuffle: "สับไพ่อย่างน้อยหนึ่งครั้งก่อนตัด",
      dealH: "วางไพ่ Celtic Cross", dealTip: "แจกไพ่จากบนสุดของสำรับ 10 ใบตามตำแหน่ง แตะไพ่เพื่อเปิดทีละใบ", dealBtn: "วางไพ่ 10 ใบ", revealAll: "เปิดทั้งหมด", needCut: "ตัดไพ่ก่อนวาง",
      lowMix: (p) => `สำรับผสมกันเพียง ${p}% ไพ่บางช่วงยังเรียงตามลำดับเดิม กลับไปสับต่ออีกหน่อยได้ หรือกด “วางไพ่ 10 ใบ” อีกครั้งเพื่อวางเลย`,
      tapCard: (n) => `ไพ่ตำแหน่ง ${n} แตะเพื่อเปิด`,
    },
    en: {
      steps: ["Ask", "Shuffle", "Cut", "Lay out", "Read"],
      askH: "Ask your question", askTip: "Focus on what you want to know and type a clear question. Open questions such as “How should I approach…” give deeper answers; for “Will…” questions the reader also sums up a yes/no lean.",
      qLabel: "Your question", qPh: "e.g. Will my relationship with the person I'm seeing move forward? / Should I change jobs this year?",
      birth: "Birth date (optional — used for your sun sign, Life Path and birth cards)", rev: "Use reversed cards",
      privacy: "Everything is computed in your browser; your question and birth date are not sent anywhere.",
      detect: (t, f) => `The reader understood: ${t}${f}`, needQ: "Type your question first, then shuffle.",
      shufH: "Shuffle", shufTip: "This deck keeps its order from your last reading on this device, like a real deck left on the table. Shuffle any way you like and watch the meter to see how well the cards are mixed.",
      riffle: "Riffle", riffleSub: "split and interleave", overhand: "Overhand", overSub: "pull packets off the top", wash: "Table wash", washSub: "press and hold — longer mixes more",
      washing: (s) => `Washing… ${s} s`,
      meter: "How well the deck is mixed", mixLbl: ["not yet mixed", "fair", "good", "very well mixed"],
      mRise: "Rising sequences", mPairs: "Neighbour pairs still together", mRho: "Spearman correlation ρ", mRev: "Reversed cards in the deck",
      ideal: (x) => `well-shuffled ≈ ${x}`, tvBound: (k, x) => `Theoretical bound (${k} riffles): distance from a perfectly random order ≤ ${x}`,
      strip: "Each sliver is one of the 78 cards, coloured by its place before shuffling began (dot below = reversed).",
      log: "Shuffle log", newDeck: "Start with a new deck (factory order)", newDeckDone: "Switched to a new deck in factory order.",
      lRiffle: (i) => `Riffle · cut at ${i.top} | ${i.bottom} cards · ${i.runs} runs fell${i.turned ? " · bottom half turned 180°" : ""}`,
      lOver: (i) => `Overhand · ${i.packets} packets (mean ${i.mean.toFixed(1)} cards)`,
      lWash: (i) => `Table wash ${i.sec.toFixed(1)} s · ${i.flips} cards changed orientation`,
      lCut: (p, o) => `Cut into 3 piles ${p.join(" / ")} → restacked ${o.map((x) => x + 1).join("-")}${o.join() === "0,1,2" ? " (same order)" : ""}`,
      lGather: "The 10 cards from the last reading were gathered onto the deck",
      cutH: "Cut the deck", cutTip: "In the Celtic Cross tradition the querent cuts with the left hand into three piles and restacks them in a new order. Hands are not precise, so the cuts scatter a little around ⅓ and ⅔.",
      cutBtn: "Cut into 3 piles", pile: ["Top pile", "Middle pile", "Bottom pile"], cards: "cards",
      pickTip: "Tap the pile that should go on top first, then the next one.", cutDone: "Restacked. The top card of the deck will be the first card laid out.", needShuffle: "Shuffle at least once before cutting.",
      dealH: "Lay out the Celtic Cross", dealTip: "Ten cards are dealt from the top of the deck into the positions. Tap a card to turn it over.", dealBtn: "Deal 10 cards", revealAll: "Turn all over", needCut: "Cut the deck before dealing.",
      lowMix: (p) => `The deck is only ${p}% mixed; parts of it still follow the previous order. Shuffle a little more, or press “Deal 10 cards” again to deal anyway.`,
      tapCard: (n) => `Card in position ${n}, tap to turn over`,
    },
  }[lang]);

  // ===== card art and reading renderer: assets/tarot-view.js ======================================
  const V = window.TarotView(lang, U);
  const { SPRITE, BACK, cardSVG } = V;

  // ===== state ======================================================================================
  let deck = E.decode(store.get("mem-tarot-deck")) || E.freshDeck();
  let ref = E.copy(deck); // order at the start of this round of shuffling
  let log = [], riffles = 0, shuffled = 0, piles = null, pick = [], cutDone = false, spread = null, revealed = new Set(), report = null, dealtMix = 0, warned = false;
  const saveDeck = () => store.set("mem-tarot-deck", E.encode(deck));

  // ===== skeleton ===================================================================================
  const revPref = store.get("mem-tarot-rev");
  app.innerHTML = SPRITE + `
<ol class="tc-steps" aria-label="${en ? "Steps" : "ขั้นตอน"}">${U.steps.map((s, i) => `<li data-s="${i}"><b>${i + 1}</b>${s}</li>`).join("")}</ol>
<section class="tc-panel" id="tcAsk" aria-labelledby="tcAskH">
  <h2 class="tc-h" id="tcAskH"><span>1</span>${U.askH}</h2>
  <p class="tc-tip">${U.askTip}</p>
  <label class="tc-lbl" for="tcQ">${U.qLabel}</label>
  <textarea id="tcQ" rows="3" maxlength="300" placeholder="${esc(U.qPh)}"></textarea>
  <p class="tc-detect" id="tcDetect" aria-live="polite"></p>
  <div class="tc-row">
    <label class="tc-lbl tc-birth">${U.birth}<input type="date" id="tcBirth" min="1900-01-01"></label>
    <label class="tc-check"><input type="checkbox" id="tcRev"${revPref === "0" ? "" : " checked"}> ${U.rev}</label>
  </div>
  <p class="tc-small">${U.privacy}</p>
</section>
<section class="tc-panel" id="tcShuf" aria-labelledby="tcShufH">
  <h2 class="tc-h" id="tcShufH"><span>2</span>${U.shufH}</h2>
  <p class="tc-tip">${U.shufTip}</p>
  <div class="tc-table" id="tcTable" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<div class="tc-tb" style="--i:${i}">${BACK}</div>`).join("")}<p class="tc-washing" id="tcWashing"></p></div>
  <div class="tc-acts">
    <button class="tc-act" type="button" data-act="riffle"><b>${U.riffle}</b><small>${U.riffleSub}</small></button>
    <button class="tc-act" type="button" data-act="overhand"><b>${U.overhand}</b><small>${U.overSub}</small></button>
    <button class="tc-act" type="button" data-act="wash"><b>${U.wash}</b><small>${U.washSub}</small></button>
  </div>
  <p class="tc-warn" id="tcShufMsg" aria-live="polite"></p>
  <div class="tc-meter"><div class="tc-meter-h"><span>${U.meter}</span><b id="tcMixV">0%</b></div><div class="tc-bar"><i id="tcMixBar"></i></div></div>
  <div class="tc-strip" id="tcStrip" role="img" aria-label="${esc(U.strip)}"></div>
  <p class="tc-small">${U.strip}</p>
  <dl class="tc-metrics" id="tcMetrics"></dl>
  <p class="tc-small" id="tcTv"></p>
  <details class="tc-log"><summary>${U.log} <span id="tcLogN">0</span></summary><ol id="tcLog"></ol></details>
  <button class="tc-link" type="button" data-act="newdeck">${U.newDeck}</button>
</section>
<section class="tc-panel" id="tcCut" aria-labelledby="tcCutH">
  <h2 class="tc-h" id="tcCutH"><span>3</span>${U.cutH}</h2>
  <p class="tc-tip">${U.cutTip}</p>
  <button class="btn btn-ghost" type="button" data-act="cut">${U.cutBtn}</button>
  <div class="tc-piles" id="tcPiles"></div>
  <p class="tc-warn" id="tcCutMsg" aria-live="polite"></p>
</section>
<section class="tc-panel" id="tcDeal" aria-labelledby="tcDealH">
  <h2 class="tc-h" id="tcDealH"><span>4</span>${U.dealH}</h2>
  <p class="tc-tip">${U.dealTip}</p>
  <div class="tc-row"><button class="btn btn-primary" type="button" data-act="deal">${U.dealBtn}</button><button class="btn btn-ghost" type="button" data-act="revealall" hidden>${U.revealAll}</button></div>
  <p class="tc-warn" id="tcDealMsg" aria-live="polite"></p>
  <div class="tc-spread" id="tcSpread"></div>
</section>
<section class="tc-panel tc-read" id="tcRead" aria-labelledby="tcReadH" hidden></section>`;

  const qEl = $("#tcQ"), birthEl = $("#tcBirth"), revEl = $("#tcRev");
  birthEl.max = new Date().toISOString().slice(0, 10);

  // ===== entropy from the querent's own movements ====================================================
  const feed = (e) => E.stir((e.timeStamp * 1000) ^ ((e.clientX | 0) << 11) ^ ((e.clientY | 0) << 21));
  app.addEventListener("pointermove", feed, { passive: true });
  app.addEventListener("pointerdown", feed, { passive: true });
  qEl.addEventListener("keydown", (e) => E.stir(e.timeStamp * 1000 + e.keyCode));

  // ===== step 1: question ============================================================================
  function detectText() {
    const q = qEl.value.trim();
    if (q.length < 2) return "";
    const c = E.classify(q);
    const L = en ? { y: " · yes/no", w: " · timing", s: " · advice", h: " · causes" } : { y: " · คำถามใช่/ไม่ใช่", w: " · ถามเรื่องเวลา", s: " · ขอคำแนะนำ", h: " · ถามหาสาเหตุ" };
    return U.detect(T.TOPICS[c.topic][lang], (c.yesno ? L.y : "") + (c.when ? L.w : "") + (c.should ? L.s : "") + (c.why ? L.h : ""));
  }
  qEl.addEventListener("input", () => { $("#tcDetect").textContent = detectText(); syncSteps(); });
  revEl.addEventListener("change", () => store.set("mem-tarot-rev", revEl.checked ? "1" : "0"));

  // ===== step 2: shuffling ===========================================================================
  const hasQ = () => qEl.value.trim().length >= 2;
  function stripHtml() {
    const pos = new Map(ref.map((c, i) => [c.id, i]));
    return deck.map((c) => { const i = pos.get(c.id); return `<i style="--h:${Math.round(18 + (i / 77) * 300)}"${c.r ? ' class="r"' : ""}></i>`; }).join("");
  }
  function renderDeck() {
    $("#tcStrip").innerHTML = stripHtml();
    const m = E.metrics(deck, ref);
    const p = Math.round(m.mix * 100);
    $("#tcMixV").textContent = `${p}% · ${U.mixLbl[p < 40 ? 0 : p < 85 ? 1 : p < 95 ? 2 : 3]}`;
    const bar = $("#tcMixBar");
    bar.style.width = Math.max(2, p) + "%";
    bar.dataset.lvl = p < 40 ? 0 : p < 85 ? 1 : 2;
    $("#tcMetrics").innerHTML = [
      [U.mRise, m.rising, U.ideal("39.5")], [U.mPairs, m.pairs, U.ideal("2")], [U.mRho, m.rho.toFixed(2), U.ideal("0")], [U.mRev, `${m.reversed}/78`, revEl.checked ? U.ideal("39") : ""],
    ].map(([k, v, i]) => `<div><dt>${k}</dt><dd><b>${v}</b><small>${i}</small></dd></div>`).join("");
    $("#tcTv").textContent = riffles ? U.tvBound(riffles, E.TV78[Math.min(riffles, E.TV78.length - 1)].toFixed(riffles > 9 ? 3 : 2)) : "";
    $("#tcLogN").textContent = `(${log.length})`;
    $("#tcLog").innerHTML = log.slice().reverse().map((l) => `<li>${esc(l)}</li>`).join("");
    return m;
  }
  function record(text) { log.push(`#${log.length + 1} ${text}`); }
  let busy = false;
  const backs = $$(".tc-tb");
  const rest = (el) => { el.getAnimations().forEach((a) => a.cancel()); };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function animate(kind) {
    if (reduce || !backs[0].animate) return;
    backs.forEach(rest);
    const n = backs.length, half = n / 2;
    const base = (k) => `translate(${(k - n / 2) * 0.5}px, ${-k * 0.9}px)`;
    if (kind === "riffle") {
      const a = backs.map((el, i) => el.animate([{ transform: base(i) }, { transform: `translate(${i < half ? -78 : 78}px, ${-(i % half) * 1.6}px) rotate(${i < half ? -9 : 9}deg)` }], { duration: 240, easing: "ease-out", fill: "forwards" }));
      await Promise.all(a.map((x) => x.finished));
      const order = [];
      for (let i = 0; i < half; i++) order.push(i, i + half);
      const b = order.map((idx, k) => backs[idx].animate([{ transform: `translate(${idx < half ? -78 : 78}px, ${-(idx % half) * 1.6}px) rotate(${idx < half ? -9 : 9}deg)` }, { transform: base(k) }], { duration: 200, delay: k * 26, easing: "ease-in", fill: "forwards" }));
      await Promise.all(b.map((x) => x.finished));
    } else if (kind === "overhand") {
      const packs = [[10, 11, 12, 13], [6, 7, 8, 9], [3, 4, 5], [0, 1, 2]];
      for (let j = 0; j < packs.length; j++) {
        const a = packs[j].map((i) => backs[i].animate([{ transform: base(i) }, { transform: `translate(-82px, ${-(j * 4 + (i % 4)) * 0.9}px) rotate(-4deg)` }], { duration: 170, easing: "ease-out", fill: "forwards" }));
        await Promise.all(a.map((x) => x.finished));
      }
      const back = backs.map((el, i) => el.animate([{ transform: el.style.transform || getComputedStyle(el).transform }, { transform: base(i) }], { duration: 240, easing: "ease-in-out", fill: "forwards" }));
      await Promise.all(back.map((x) => x.finished));
    }
    backs.forEach(rest);
  }
  function lockActs(on) {
    busy = on;
    $$(".tc-act").forEach((b) => { b.disabled = on || !hasQ() || !!spread; });
    // no cutting or dealing while a shuffle is still moving the cards
    $('[data-act="cut"]').disabled = on || !!spread || !shuffled;
    $('[data-act="deal"]').disabled = on || !!spread || !cutDone;
  }
  async function doShuffle(kind, sec) {
    if (busy || spread) return;
    if (!hasQ()) { $("#tcShufMsg").textContent = U.needQ; qEl.focus(); return; }
    $("#tcShufMsg").textContent = "";
    lockActs(true);
    const rng = E.makeRng();
    let res;
    if (kind === "riffle") { await animate("riffle"); res = E.riffle(deck, rng, { reversals: revEl.checked }); riffles++; record(U.lRiffle(res.info)); }
    else if (kind === "overhand") { await animate("overhand"); res = E.overhand(deck, rng); record(U.lOver(res.info)); }
    else { res = E.wash(deck, rng, sec); record(U.lWash(res.info)); }
    deck = res.deck;
    shuffled++;
    warned = false; $("#tcDealMsg").textContent = "";
    cutDone = false; piles = null; pick = []; $("#tcPiles").innerHTML = ""; $("#tcCutMsg").textContent = "";
    saveDeck();
    renderDeck();
    lockActs(false);
    syncSteps();
  }
  $$(".tc-act").forEach((b) => {
    const kind = b.dataset.act;
    if (kind !== "wash") { b.addEventListener("click", () => doShuffle(kind)); return; }
    // press and hold: the cards spread and swirl on the table for as long as the button is held
    let t0 = 0, timer = 0, swirl = 0;
    const start = (e) => {
      if (busy || spread || t0) return;
      if (!hasQ()) { $("#tcShufMsg").textContent = U.needQ; qEl.focus(); return; }
      if (e && e.type === "pointerdown") { b.setPointerCapture && b.setPointerCapture(e.pointerId); e.preventDefault(); }
      t0 = performance.now();
      $("#tcTable").classList.add("is-wash");
      const move = () => { backs.forEach((el) => { const r = 30 + Math.random() * 62, a = Math.random() * 2 * Math.PI; el.style.transform = `translate(${(r * Math.cos(a)).toFixed(0)}px, ${(r * Math.sin(a) * 0.55).toFixed(0)}px) rotate(${(Math.random() * 360).toFixed(0)}deg)`; }); };
      if (!reduce) { move(); swirl = setInterval(move, 380); }
      timer = setInterval(() => { $("#tcWashing").textContent = U.washing(((performance.now() - t0) / 1000).toFixed(1)); }, 100);
    };
    const end = () => {
      if (!t0) return;
      const ms = performance.now() - t0;
      t0 = 0;
      clearInterval(timer); clearInterval(swirl);
      E.stir(ms * 1000);
      $("#tcWashing").textContent = "";
      $("#tcTable").classList.remove("is-wash");
      backs.forEach((el) => { el.style.transform = ""; });
      doShuffle("wash", ms / 1000);
    };
    b.addEventListener("pointerdown", start);
    b.addEventListener("pointerup", end);
    b.addEventListener("pointercancel", end);
    b.addEventListener("lostpointercapture", end);
    b.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); start(); } });
    b.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") end(); });
    b.addEventListener("contextmenu", (e) => e.preventDefault());
  });
  $('[data-act="newdeck"]').addEventListener("click", () => {
    if (busy) return;
    deck = E.freshDeck(); ref = E.copy(deck); log = []; riffles = 0; shuffled = 0; cutDone = false; piles = null; pick = [];
    $("#tcPiles").innerHTML = ""; saveDeck(); renderDeck(); $("#tcShufMsg").textContent = U.newDeckDone; syncSteps();
  });

  // ===== step 3: cut ===================================================================================
  $('[data-act="cut"]').addEventListener("click", () => {
    if (spread || busy) return;
    if (!shuffled) { $("#tcCutMsg").textContent = U.needShuffle; return; }
    piles = E.cutPiles(deck, E.makeRng());
    pick = []; cutDone = false;
    $("#tcCutMsg").textContent = U.pickTip;
    renderPiles();
    syncSteps();
  });
  function renderPiles() {
    $("#tcPiles").innerHTML = piles.map((p, i) => {
      const k = pick.indexOf(i);
      const h = Math.max(6, Math.round(p.length * 0.9));
      return `<button type="button" class="tc-pile${k >= 0 ? " is-picked" : ""}" data-pile="${i}"${cutDone ? " disabled" : ""}><span class="tc-pile-stack" style="--h:${h}px">${BACK}</span><b>${U.pile[i]}</b><small>${p.length} ${U.cards}</small>${k >= 0 ? `<em>${k + 1}</em>` : ""}</button>`;
    }).join("");
    $$(".tc-pile").forEach((b) => b.addEventListener("click", () => {
      const i = +b.dataset.pile;
      if (cutDone || pick.includes(i)) return;
      pick.push(i);
      if (pick.length === 2) pick.push([0, 1, 2].find((x) => !pick.includes(x)));
      if (pick.length === 3) {
        deck = E.restack(piles, pick);
        record(U.lCut(piles.map((p) => p.length), pick));
        cutDone = true;
        saveDeck();
        renderDeck();
        $("#tcCutMsg").textContent = U.cutDone;
      }
      renderPiles();
      syncSteps();
    }));
  }

  // ===== step 4: deal ==================================================================================
  // Celtic Cross geometry in container units (width 100, height 106): card 15.5 × 24.8
  const CW = 15.5, CH = 24.8, BOXH = 106;
  const XY = [null, [30.5, 53], [30.5, 53], [30.5, 79.4], [8.85, 53], [30.5, 26.6], [52.15, 53], [88, 92.6], [88, 66.2], [88, 39.8], [88, 13.4]];
  $('[data-act="deal"]').addEventListener("click", deal);
  async function deal() {
    if (spread || busy) return;
    if (!cutDone) { $("#tcDealMsg").textContent = U.needCut; return; }
    const m = E.metrics(deck, ref);
    dealtMix = Math.round(m.mix * 100);
    // a barely shuffled deck gets one warning; a second press deals anyway, as a reader may choose to
    if (dealtMix < 40 && !warned) { warned = true; $("#tcDealMsg").textContent = U.lowMix(dealtMix); return; }
    $("#tcDealMsg").textContent = "";
    spread = deck.slice(0, 10).map((c) => ({ id: c.id, r: c.r }));
    revealed = new Set();
    lockActs(false);
    const box = $("#tcSpread");
    box.innerHTML = "";
    for (let p = 1; p <= 10; p++) {
      const [x, y] = XY[p];
      const s = spread[p - 1];
      const rev = revEl.checked && s.r === 1;
      const c = T.CARDS[s.id];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tc-card" + (p === 2 ? " is-cross" : "");
      b.dataset.pos = p;
      b.style.cssText = `left:${x - CW / 2}%;top:${((y - CH / 2) / BOXH) * 100}%;width:${CW}%;height:${(CH / BOXH) * 100}%`;
      b.setAttribute("aria-label", U.tapCard(p));
      b.innerHTML = `<span class="tc-flip"><span class="tc-face tc-face-back">${BACK}</span><span class="tc-face tc-face-front${rev ? " is-rev" : ""}">${cardSVG(s.id, `${p}. ${c.name[lang]}${rev ? ` (${U.revd})` : ""}`)}</span></span><span class="tc-num">${p}</span>`;
      b.addEventListener("click", () => reveal(p));
      box.appendChild(b);
      if (!reduce) { b.animate([{ opacity: 0, transform: "translateY(-14px) scale(.9)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "ease-out" }); await wait(110); }
    }
    $('[data-act="revealall"]').hidden = false;
    syncSteps();
  }
  function reveal(p) {
    if (!spread) return;
    const b = $(`.tc-card[data-pos="${p}"]`);
    if (revealed.has(p)) { const t = document.getElementById("tcPos" + p); if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); return; }
    revealed.add(p);
    b.classList.add("is-open");
    const s = spread[p - 1], c = T.CARDS[s.id], rev = revEl.checked && s.r === 1;
    b.setAttribute("aria-label", `${p}. ${c.name[lang]}${rev ? ` (${U.revd})` : ""}`);
    if (revealed.size === 10) finish();
  }
  $('[data-act="revealall"]').addEventListener("click", async () => {
    for (let p = 1; p <= 10; p++) { if (!revealed.has(p)) { reveal(p); if (!reduce) await wait(90); } }
  });

  // ===== step 5: the reading ==========================================================================
  function finish() {
    $('[data-act="revealall"]').hidden = true;
    report = E.analyze(spread, { lang, question: qEl.value, birth: birthEl.value, reversals: revEl.checked, today: new Date() });
    const out = $("#tcRead");
    out.innerHTML = readingHtml(report);
    out.hidden = false;
    out.querySelector('[data-act="copy"]').addEventListener("click", copyReading);
    out.querySelector('[data-act="again"]').addEventListener("click", again);
    out.querySelector('[data-act="print"]').addEventListener("click", () => window.print());
    syncSteps();
    setTimeout(() => out.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), reduce ? 0 : 450);
  }
  function again() {
    deck = E.gather(spread, deck.slice(10));
    log = [];
    record(U.lGather);
    ref = E.copy(deck);
    riffles = 0; shuffled = 0; cutDone = false; piles = null; pick = []; spread = null; revealed = new Set(); report = null;
    saveDeck();
    $("#tcSpread").innerHTML = ""; $("#tcPiles").innerHTML = ""; $("#tcRead").hidden = true; $("#tcRead").innerHTML = "";
    $("#tcDealMsg").textContent = ""; $("#tcCutMsg").textContent = ""; $("#tcShufMsg").textContent = U.lGather;
    lockActs(false);
    renderDeck();
    syncSteps();
    $("#tcAsk").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    qEl.select();
  }
  async function copyReading() {
    const text = E.toText(report, spread);
    try { await navigator.clipboard.writeText(text); }
    catch (e) { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (x) { /* ignore */ } ta.remove(); }
    const b = $('#tcRead [data-act="copy"]'); const old = b.textContent; b.textContent = U.copied; setTimeout(() => { b.textContent = old; }, 1600);
  }

  const readingHtml = (r) => V.readingHtml(r, { step: "5", extraStats: [U.deckAt(dealtMix, riffles)] });

  // ===== step indicator and enabling ===================================================================
  function syncSteps() {
    const stage = report ? 4 : spread ? 3 : cutDone ? 3 : shuffled ? 2 : hasQ() ? 1 : 0;
    $$(".tc-steps li").forEach((li, i) => { li.classList.toggle("is-done", i < stage); li.classList.toggle("is-now", i === stage); });
    lockActs(busy);
  }

  renderDeck();
  syncSteps();
})();
