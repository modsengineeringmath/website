/* Mod's Engineering Mathematics — Tarot reader UI (/tools/tarot/ and /en/tools/tarot/)
   Needs tarot-data.js and tarot-engine.js. Renders everything into #tarotApp; the language comes from data-lang. */
(function () {
  "use strict";
  const app = document.getElementById("tarotApp");
  if (!app || !window.TarotData || !window.TarotEngine) return;
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
  const U = {
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
  }[lang];

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
  function readingHtml(r) {
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
      : `<p class="tc-small">${esc(en ? "Add your birth date in step 1 to compute your sun sign, Life Path number and birth cards." : "ใส่วันเกิดในขั้นที่ 1 เพื่อให้ระบบคำนวณราศี เลขเส้นทางชีวิต และไพ่ประจำตัว แล้วเชื่อมกับไพ่ที่เปิดได้")}</p>`;
    return `
  <h2 class="tc-h" id="tcReadH"><span>5</span>${U.readH}</h2>
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
  <ul class="tc-list">${r.stats.map((s) => `<li>${esc(s)}</li>`).join("")}<li>${esc(U.deckAt(dealtMix, riffles))}</li></ul>
  <p class="tc-disclaimer">${U.disclaimer}</p>
  <div class="tc-row tc-end no-print"><button class="btn btn-primary" type="button" data-act="copy">${U.copy}</button><button class="btn btn-ghost" type="button" data-act="print">${U.print}</button><button class="btn btn-ghost" type="button" data-act="again">${U.again}</button></div>`;
  }

  // ===== step indicator and enabling ===================================================================
  function syncSteps() {
    const stage = report ? 4 : spread ? 3 : cutDone ? 3 : shuffled ? 2 : hasQ() ? 1 : 0;
    $$(".tc-steps li").forEach((li, i) => { li.classList.toggle("is-done", i < stage); li.classList.toggle("is-now", i === stage); });
    lockActs(busy);
  }

  renderDeck();
  syncSteps();
})();
