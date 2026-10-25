/* Mod's Engineering Mathematics — Tarot engine (no DOM)
   1) Physical shuffling models on a 78-card deck that remembers its order between readings:
      riffle = Gilbert–Shannon–Reeds model, overhand = packet reversal (Pemantle), table wash = position and angle diffusion,
      cut = three piles restacked by the querent. Randomness is "hand noise": crypto.getRandomValues mixed with the
      timing of the querent's own pointer and key events, fed to an sfc32 generator per action.
   2) Mixing diagnostics: rising sequences (Bayer–Diaconis), neighbour pairs kept, Spearman rank correlation.
   3) The reading: Celtic Cross positions, question classifier, elemental dignities, element/zodiac/planet/modality balance,
      trend by least squares, verdict, timing from decans and the Sun's longitude, numerology, Tree of Life and birth cards. */
(function (root) {
  "use strict";
  const T = root.TarotData;
  const N = 78;
  const RAD = Math.PI / 180;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const clamp01 = (x) => clamp(x, 0, 1);

  // ===== randomness ================================================================================
  function sfc32(a, b, c, d) {
    return function () {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      let t = (a + b) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      d = (d + 1) | 0;
      t = (t + d) | 0;
      c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
  }
  const pool = new Uint32Array(4);
  let poolEvents = 0;
  // fold one 32-bit observation (an event time in microseconds, a coordinate…) into the pool
  function stir(x) {
    let h = (Math.floor(x) ^ 0x9e3779b9) >>> 0;
    for (let i = 0; i < 4; i++) {
      h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
      h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
      h = (h ^ (h >>> 16)) >>> 0;
      pool[i] = (pool[i] ^ h) >>> 0;
      h = (h + pool[(i + 1) & 3] + Math.imul(i + 1, 0x632be5ab)) >>> 0;
    }
    poolEvents++;
  }
  function makeRng(seed) {
    const s = new Uint32Array(4);
    if (seed) s.set(seed.map((x) => x >>> 0));
    else {
      const c = root.crypto;
      if (c && c.getRandomValues) c.getRandomValues(s);
      else for (let i = 0; i < 4; i++) s[i] = (Math.random() * 4294967296) >>> 0;
      for (let i = 0; i < 4; i++) s[i] = (s[i] ^ pool[i]) >>> 0;
    }
    const r = sfc32(s[0], s[1], s[2], s[3]);
    for (let i = 0; i < 15; i++) r();
    r.seed = Array.from(s);
    return r;
  }
  function binomial(rng, n, p) { let k = 0; for (let i = 0; i < n; i++) if (rng() < p) k++; return k; }
  function gauss(rng) { let u = 0; while (u === 0) u = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng()); }

  // ===== the deck ==================================================================================
  // index 0 is the top card; r = 1 means the card lies reversed relative to the reader
  const freshDeck = () => Array.from({ length: N }, (_, i) => ({ id: i, r: 0 }));
  const copy = (d) => d.map((c) => ({ id: c.id, r: c.r }));
  // turning a face-down packet end for end on the table keeps the order and flips every card
  const turn = (pack) => pack.map((c) => ({ id: c.id, r: c.r ^ 1 }));
  function isDeck(d) {
    if (!Array.isArray(d) || d.length !== N) return false;
    const seen = new Set();
    for (const c of d) { if (!c || !(c.id >= 0 && c.id < N) || seen.has(c.id) || (c.r !== 0 && c.r !== 1)) return false; seen.add(c.id); }
    return true;
  }
  const encode = (d) => d.map((c) => c.id * 2 + c.r).join(".");
  function decode(s) {
    try { const d = String(s).split(".").map((x) => { const v = parseInt(x, 10); return { id: v >> 1, r: v & 1 }; }); return isDeck(d) ? d : null; } catch (e) { return null; }
  }

  // Riffle — Gilbert–Shannon–Reeds: cut at k ~ Binomial(n, ½), then let cards fall from the bottoms of the two halves
  // with probability proportional to the number of cards left in each half (every interleaving equally likely).
  function riffle(deck, rng, opt = {}) {
    const n = deck.length, k = binomial(rng, n, 0.5);
    const L = deck.slice(0, k);
    let R = deck.slice(k);
    const turned = !!opt.reversals && rng() < (opt.pTurn == null ? 0.5 : opt.pTurn);
    if (turned) R = turn(R);
    const out = [];
    let a = L.length, b = R.length, runs = 0, last = -1;
    while (a + b > 0) {
      const fromL = rng() * (a + b) < a;
      const side = fromL ? 0 : 1;
      if (side !== last) { runs++; last = side; }
      out.push(fromL ? L[--a] : R[--b]);
    }
    out.reverse();
    return { deck: out, info: { type: "riffle", top: k, bottom: n - k, turned, runs } };
  }
  // Overhand — the thumb pulls packets off the top into the other hand; each new packet lands on top of the last,
  // so packet order reverses while the order inside a packet is kept. A cut happens between two cards with probability p.
  function overhand(deck, rng, p = 0.16) {
    const packs = [];
    let cur = [];
    for (let i = 0; i < deck.length; i++) {
      cur.push(deck[i]);
      if (i < deck.length - 1 && rng() < p) { packs.push(cur); cur = []; }
    }
    packs.push(cur);
    const out = [];
    for (let j = packs.length - 1; j >= 0; j--) out.push(...packs[j]);
    return { deck: out, info: { type: "overhand", packets: packs.length, mean: deck.length / packs.length } };
  }
  // Table wash ("smooshing") for t seconds: each card drifts from its place (Gaussian spread that grows with t) and turns
  // by a random angle; when the cards are swept together the order follows the drifted places and a card ends reversed
  // when its total turn passes 90°.
  function wash(deck, rng, sec) {
    const t = clamp(sec, 0.3, 30);
    const spread = 4 * Math.pow(t, 0.85);
    const spin = 0.9 * Math.sqrt(t);
    let flips = 0;
    const items = deck.map((c, i) => {
      const th = (c.r ? Math.PI : 0) + spin * gauss(rng);
      const r = Math.cos(th) < 0 ? 1 : 0;
      if (r !== c.r) flips++;
      return { c: { id: c.id, r }, key: i + spread * gauss(rng) };
    });
    items.sort((x, y) => x.key - y.key);
    return { deck: items.map((x) => x.c), info: { type: "wash", sec: t, flips, spread } };
  }
  // Cut into three piles (top, middle, bottom) — hands are imprecise, so the cut points scatter around ⅓ and ⅔
  function cutPiles(deck, rng) {
    const n = deck.length;
    const c1 = clamp(Math.round(n / 3 + gauss(rng) * n / 14), 8, n - 16);
    const c2 = clamp(Math.round((2 * n) / 3 + gauss(rng) * n / 14), c1 + 8, n - 8);
    return [deck.slice(0, c1), deck.slice(c1, c2), deck.slice(c2)];
  }
  // order lists the piles from the new top to the new bottom
  const restack = (piles, order) => order.flatMap((i) => piles[i]);
  // after the reading the reader picks the ten cards up in position order (1 first, so 1 ends at the bottom of the
  // small pile) and puts the pile back on top of the deck, orientation unchanged
  function gather(spread, rest) { return [...spread.slice().reverse().map((c) => ({ id: c.id, r: c.r })), ...copy(rest)]; }

  // ===== mixing diagnostics ========================================================================
  // ref = the deck order before this round of shuffling started
  function metrics(deck, ref) {
    const n = deck.length;
    const refPos = new Array(N);
    ref.forEach((c, i) => { refPos[c.id] = i; });
    const s = deck.map((c) => refPos[c.id]);
    const where = new Array(n);
    s.forEach((v, i) => { where[v] = i; });
    let rising = 1;
    for (let v = 0; v < n - 1; v++) if (where[v + 1] < where[v]) rising++;
    let pairs = 0;
    for (let i = 0; i < n - 1; i++) if (Math.abs(s[i + 1] - s[i]) === 1) pairs++;
    let d2 = 0;
    for (let i = 0; i < n; i++) d2 += (s[i] - i) * (s[i] - i);
    const rho = 1 - (6 * d2) / (n * (n * n - 1));
    const reversed = deck.reduce((a, c) => a + c.r, 0);
    const mPairs = clamp01((n - 1 - pairs) / (n - 1 - (2 * (n - 1)) / n));
    const mRise = clamp01((rising - 1) / ((n + 1) / 2 - 1));
    const mRho = clamp01((1 - Math.abs(rho)) / 0.88);
    const mix = Math.min(mPairs, mRise, mRho);
    return { rising, risingRandom: (n + 1) / 2, pairs, pairsRandom: (2 * (n - 1)) / n, rho, reversed, mix, parts: { mPairs, mRise, mRho } };
  }
  // total variation distance from uniform after k GSR riffles of 78 cards (Bayer & Diaconis 1992), computed exactly offline
  const TV78 = [1, 1, 1, 1, 1, 0.9996, 0.8926, 0.5713, 0.3065, 0.1532, 0.078, 0.0392, 0.0196, 0.0098, 0.0049];

  // ===== astronomy (Sun's ecliptic longitude, low-precision formula good to ~0.01°) =================
  function sunLongitude(date) {
    const d = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;
    const g = (357.529 + 0.98560028 * d) * RAD;
    const q = 280.459 + 0.98564736 * d;
    return T.norm(q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  }
  const inSpan = (lon, span) => { const a = T.norm(span[0]), b = T.norm(span[1]); return a < b ? lon >= a && lon < b : lon >= a || lon < b; };
  // first window, from `from` on, in which the Sun stands inside the ecliptic span; dates at local noon
  function sunWindow(span, from) {
    const day = (k) => { const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + k, 12); return d; };
    let k = 0;
    const now = inSpan(sunLongitude(day(0)), span);
    if (!now) { while (k < 370 && !inSpan(sunLongitude(day(k)), span)) k++; }
    const start = k;
    while (k < 740 && inSpan(sunLongitude(day(k)), span)) k++;
    return { from: day(start), to: day(k - 1), now };
  }
  const signOf = (lon) => Math.floor(T.norm(lon) / 30);

  // ===== numerology ================================================================================
  const digitSum = (x) => String(Math.abs(x)).split("").reduce((a, ch) => a + (+ch || 0), 0);
  function reduceKeep(x) { while (x > 9 && x !== 11 && x !== 22 && x !== 33) x = digitSum(x); return x; }
  function lifePath(y, m, d) { return reduceKeep(reduceKeep(m) + reduceKeep(d) + reduceKeep(digitSum(y))); }
  const toMajor = (x) => { while (x > 22) x = digitSum(x); return x === 22 ? 0 : x; };
  // Mary K. Greer's tarot birth cards: day + month + year, reduced to 22 or below (personality), then to one digit (soul)
  function birthCards(y, m, d) {
    let s = d + m + y;
    while (s > 22) s = digitSum(s);
    if (s === 22) return { personality: 0, soul: 4, chain: [0, 4] };
    const chain = [s];
    let x = s;
    while (x > 9) { x = digitSum(x); chain.push(x); }
    return { personality: s, soul: x, chain };
  }
  function comb(n, k) { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; }
  // P(X ≥ k) for X hypergeometric: draws n from a deck of size Ntot holding K special cards
  function hyperTail(k, Ntot, K, n) { let p = 0; for (let x = k; x <= n; x++) p += (comb(K, x) * comb(Ntot - K, n - x)) / comb(Ntot, n); return p; }

  // ===== question analysis =========================================================================
  function classify(q) {
    const raw = " " + String(q || "").toLowerCase().replace(/\s+/g, " ") + " ";
    // longest keywords first so that แต่งงาน (marriage) is not read as งาน (work), รักษา (treatment) not as รัก (love)
    const all = [];
    for (const [k, t] of Object.entries(T.TOPICS)) for (const w of t.kw) all.push([w, k]);
    all.sort((a, b) => b[0].length - a[0].length);
    let text = raw;
    const hits = {};
    for (const [w, k] of all) {
      let i = text.indexOf(w);
      while (i >= 0) { hits[k] = (hits[k] || 0) + 1; text = text.slice(0, i) + " ".repeat(w.length) + text.slice(i + w.length); i = text.indexOf(w); }
    }
    let topic = "general", best = 0;
    for (const k of Object.keys(T.TOPICS)) if ((hits[k] || 0) > best) { best = hits[k]; topic = k; }
    const has = (list) => list.some((w) => raw.includes(w));
    const Q = T.QTYPES;
    const trimmed = raw.trim();
    const when = has(Q.when);
    // "when will…" asks for timing, not for a yes/no answer
    const yesno = !when && (has(Q.yesno) || Q.yesnoEn.test(trimmed));
    return { topic, hits, yesno, when, should: has(Q.should), why: has(Q.why), other: has(Q.other) };
  }

  // ===== text ======================================================================================
  const S = {
    th: {
      rev: "กลับหัว", up: "ตั้งตรง",
      inTopic: (t) => `ในเรื่อง${t}: `,
      revGood: (t) => `ในเรื่อง${t} พลังด้านนี้ยังติดขัดหรือมาช้ากว่าที่ควร: `,
      revBad: (t) => `ในเรื่อง${t} สถานการณ์ต่อไปนี้กำลังคลี่คลายหรือเบาลง: `,
      revMid: (t) => `ในเรื่อง${t} ลักษณะต่อไปนี้ยังค้างอยู่ภายในใจมากกว่าจะแสดงออก: `,
      pos2good: "ไพ่ด้านบวกในตำแหน่งท้าทาย หมายความว่าสิ่งดีนั้นเองคือโจทย์ เช่น มีมากเกินไป ทำให้ประมาท หรือคุณยังไม่พร้อมรับ",
      pos9hope: (k) => `สิ่งที่คุณแอบหวังไว้คือ ${k}`,
      pos9fear: (k) => `สิ่งที่คุณกังวลลึก ๆ คือ ${k} ความกลัวนี้อาจใหญ่กว่าความจริง`,
      pos9mix: (k) => `คุณทั้งหวังและกลัวในเรื่องเดียวกัน คือ ${k}`,
      pos10major: "ผลลัพธ์เป็นไพ่ชุดใหญ่ เรื่องนี้เป็นจุดเปลี่ยนที่มีผลระยะยาว",
      pos10court: "ผลลัพธ์เป็นไพ่บุคคล ผลอาจมาในรูปของคนคนหนึ่ง หรือบทบาทที่คุณต้องก้าวขึ้นไปรับ",
      courtSelf: "ไพ่บุคคลในตำแหน่งนี้สะท้อนบุคลิกที่คุณกำลังใช้ หรือควรใช้ กับเรื่องนี้",
      courtOther: "ไพ่บุคคลในตำแหน่งนี้มักหมายถึงคนจริง ๆ ที่มีบทบาทในเรื่อง",
      otherFocus: "คำถามของคุณเกี่ยวกับอีกฝ่าย ไพ่ตำแหน่ง 8 จึงสะท้อนท่าทีและมุมมองของเขาโดยตรง",
      healthNote: "ไพ่ไม่ใช่การวินิจฉัยทางการแพทย์ หากมีอาการหรือความกังวลเรื่องสุขภาพ ควรปรึกษาแพทย์",
      moneyNote: "นี่ไม่ใช่คำแนะนำทางการเงินหรือการลงทุน ตัดสินใจจากข้อมูลจริงและความเสี่ยงที่รับได้",
      majors: (n, exp, p) => n === 0 ? `ไม่มีไพ่ชุดใหญ่เลย เรื่องนี้อยู่ในมือคุณเกือบทั้งหมด ผลลัพธ์ขึ้นกับการตัดสินใจและการกระทำในชีวิตประจำวัน`
        : n <= 2 ? `ไพ่ชุดใหญ่ ${n} ใบ (ค่าเฉลี่ย ${exp} ใบ) เป็นสัดส่วนปกติ เรื่องนี้มีทั้งส่วนที่คุณควบคุมได้และจังหวะชีวิตผสมกัน`
        : n === 3 ? `ไพ่ชุดใหญ่ 3 ใบ มากกว่าค่าเฉลี่ยเล็กน้อย เรื่องนี้มีน้ำหนักมากกว่าเรื่องทั่วไป`
        : `ไพ่ชุดใหญ่ ${n} ใบจาก 10 (ค่าเฉลี่ย ${exp} ใบ โอกาสได้ ${n} ใบขึ้นไปโดยบังเอิญเพียง ${p}) บ่งบอกช่วงสำคัญของชีวิต มีแรงที่ใหญ่กว่าตัวคุณเกี่ยวข้อง และบทเรียนนี้มีผลระยะยาว`,
      courts: (n) => n === 0 ? "ไม่มีไพ่บุคคล เรื่องนี้เป็นเรื่องของสถานการณ์มากกว่าตัวบุคคล" : n >= 4 ? `ไพ่บุคคล ${n} ใบ มีหลายคนเกี่ยวข้อง หรือคุณกำลังสวมหลายบทบาทพร้อมกัน` : `ไพ่บุคคล ${n} ใบ มีคนสำคัญเกี่ยวข้องกับเรื่องนี้`,
      reversed: (n) => n >= 6 ? `ไพ่กลับหัว ${n} ใบ พลังงานส่วนใหญ่ติดขัด ล่าช้า หรือเกิดขึ้นภายในใจและยังไม่แสดงออกภายนอก` : n <= 1 ? `ไพ่กลับหัว ${n} ใบ พลังงานไหลลื่นและแสดงออกตรงไปตรงมา` : `ไพ่กลับหัว ${n} ใบ มีบางส่วนของเรื่องที่ยังติดขัดหรือต้องทำงานกับตัวเอง`,
      suit: (s, n) => `ไพ่ชุด${s} ${n} ใบเด่นกว่าชุดอื่น`,
      number: (r, k, m) => `${r} ปรากฏ ${k} ใบ: ${m}`,
      dom: (e, pct, d) => `ธาตุ${e}เด่นที่สุด (${pct}%) เรื่องนี้หมุนรอบ${d}`,
      tie: (es) => `ธาตุ${es}มีน้ำหนักเท่ากัน`,
      dig: { 2: "ธาตุเดียวกัน เสริมกันอย่างแรง", 1: "ธาตุที่เป็นมิตร หนุนกัน", 0: "ธาตุที่เป็นกลาง ไม่ขัดไม่หนุน", "-1": "ธาตุที่ขัดกัน ลดทอนกัน" },
      pair12: { 2: "อุปสรรคมาจากแหล่งเดียวกับตัวเรื่อง ต้องแก้ที่ต้นเหตุ", 1: "อุปสรรคนี้เปลี่ยนให้เป็นแรงหนุนได้ถ้าใช้ถูกทาง", 0: "อุปสรรคแยกจากเรื่องหลัก จัดการทีละส่วนได้", "-1": "อุปสรรคนี้บั่นทอนเรื่องหลักจริง ควรให้ความสำคัญเป็นอันดับแรก" },
      axisTime: (a, b, c, ph) => `จาก ${a} ในอดีตที่เพิ่งผ่าน ผ่าน ${b} ในปัจจุบัน ไปสู่ ${c} ในช่วงถัดไป ${ph}`,
      delta: [ "สถานการณ์กำลังหนักขึ้นชั่วคราว เตรียมรับมือและอย่าตัดสินใจด้วยอารมณ์", "ช่วงถัดไปอาจยากกว่าที่ผ่านมาเล็กน้อย", "ระดับพลังงานใกล้เคียงเดิม สิ่งที่เปลี่ยนคือรูปแบบมากกว่าระดับ", "สถานการณ์ค่อย ๆ ดีขึ้น", "สถานการณ์กำลังดีขึ้นอย่างเห็นได้ชัด" ],
      axisMind: { 2: "สิ่งที่อยู่ลึกในใจ (ตำแหน่ง 3) กับเป้าหมายที่ตั้งไว้ (ตำแหน่ง 5) เป็นธาตุเดียวกัน ใจกับความตั้งใจไปทางเดียวกันอย่างทรงพลัง", 1: "แรงขับลึก ๆ กับเป้าหมายที่ตั้งไว้หนุนกัน คุณทำสิ่งที่ตั้งใจได้อย่างเป็นธรรมชาติ", 0: "แรงขับลึก ๆ กับเป้าหมายเป็นอิสระต่อกัน ต้องเชื่อมด้วยความตั้งใจและวินัย", "-1": "สิ่งที่คุณคิดว่าต้องการ (ตำแหน่ง 5) ขัดกับแรงขับลึก ๆ (ตำแหน่ง 3) อาจทำให้ลังเลหรือขัดขวางตัวเองโดยไม่รู้ตัว ทบทวนว่าต้องการอะไรจริง" },
      axisSelf: (s, e, d) => `ตัวคุณ (${s}) กับคนรอบข้าง (${e}): ${d}`,
      selfEnv: { 2: "มองเรื่องนี้ไปในทางเดียวกัน", 1: "เข้ากันได้และช่วยกันได้", 0: "ต่างคนต่างมีจังหวะของตัวเอง", "-1": "มีความต่างหรือแรงเสียดทาน ต้องสื่อสารให้ชัด" },
      hopeOut: { same: "ความหวังหรือความกลัวของคุณสะท้อนอยู่ในผลลัพธ์ ทัศนคติของคุณจึงมีผลต่อปลายทางมาก", diff: "ผลลัพธ์ไม่ได้เป็นไปตามที่หวังหรือกลัวทั้งหมด ปล่อยให้เรื่องเผยตัวเองโดยไม่คาดเดาล่วงหน้า" },
      crownOut: { yes: "ผลลัพธ์สอดคล้องกับเป้าหมายที่คุณตั้งไว้ ทิศทางนี้ถูกต้อง", no: "ผลลัพธ์ต่างจากเป้าหมายที่คิดไว้ อาจได้สิ่งที่ต้องการในรูปแบบที่ไม่คาดคิด หรือต้องปรับเป้าหมาย" },
      outStrong: "ไพ่ข้างเคียงหนุนไพ่ผลลัพธ์ ผลลัพธ์มีแนวโน้มแสดงออกเต็มที่", outWeak: "ไพ่ข้างเคียงลดทอนไพ่ผลลัพธ์ ผลอาจออกมาเบากว่าที่ไพ่บอก และยังเปลี่ยนแปลงได้ด้วยการกระทำของคุณ", outMid: "แรงหนุนรอบไพ่ผลลัพธ์อยู่ในระดับปกติ",
      trend: ["ขาลงชัดเจน", "ค่อนข้างขาลง", "ทรงตัว", "ค่อย ๆ ดีขึ้น", "ขาขึ้นชัดเจน"],
      level: (y) => y >= 1.2 ? "ระดับพลังงานโดยรวมเป็นบวกมาก" : y >= 0.4 ? "ระดับพลังงานโดยรวมเป็นบวก" : y > -0.4 ? "ระดับพลังงานโดยรวมเป็นกลาง" : y > -1.2 ? "ระดับพลังงานโดยรวมค่อนข้างหนัก" : "ระดับพลังงานโดยรวมหนัก",
      verdict: ["ไม่ (ในตอนนี้)", "มีอุปสรรคมาก แนวโน้มไม่", "ยังไม่ชัดเจน ขึ้นกับการกระทำของคุณ", "ใช่ แต่มีเงื่อนไข", "ใช่ แนวโน้มชัดเจน"],
      verdictNote: ["ไพ่ไม่สนับสนุนในสถานการณ์ปัจจุบัน ถ้ายังต้องการ ให้ดูตำแหน่ง 2 และ 7 ว่าต้องเปลี่ยนอะไร", "แนวโน้มไม่เอื้อ แต่ยังไม่ปิดตาย ต้องแก้อุปสรรคในตำแหน่ง 2 ก่อน", "ไพ่ไม่ชี้ไปทางใดชัด ผลขึ้นกับการตัดสินใจและการลงมือของคุณ", "แนวโน้มเป็นบวก แต่มีเงื่อนไขหรืออุปสรรคที่ต้องจัดการ", "ไพ่ส่วนใหญ่สนับสนุนอย่างชัดเจน"],
      timeNow: (a, b) => `ตอนนี้อยู่ในช่วงเวลาของไพ่ใบนี้แล้ว (ถึงราว ${b})`,
      timeWin: (a, b) => `ช่วงเวลาที่ควรจับตา: ราว ${a} – ${b}`,
      timeBy: (c, how) => `อ้างอิงจาก ${c} (${how})`,
      timeMajors: "เมื่อมีไพ่ชุดใหญ่มาก เรื่องมักเกิดตามจังหวะชีวิตมากกว่าตามปฏิทิน ให้ใช้ช่วงเวลานี้เป็นแนวทางคร่าว ๆ",
      paceSuit: (s, p) => `ไพ่ชุด${s}บอกจังหวะ: ${p}`,
      pacePlanet: (pl, p) => `ดาว${pl} บอกจังหวะ: ${p}`,
      decanHow: (pl, sg, d) => `ดาว${pl}ในราศี${sg} เดแคนที่ ${d}`,
      spanHow: (sg) => `ช่วงของไพ่บุคคล คาบราศี${sg}`,
      quadHow: (a, b) => `จตุภาคของราศี${a}ถึง${b}`,
      signHow: (sg) => `ราศี${sg}`,
      quint: (name, kw) => `แก่นสาร (Quintessence) ของการอ่านครั้งนี้คือ ${name} — ${kw}`,
      quintHow: (sum, q) => `ผลรวมเลขไพ่ = ${sum} → ทอนเหลือ ${q}`,
      pillar: (p, n) => `พลังของการอ่านอยู่ที่${p} มากที่สุด: ${n}`,
      levelTree: { sup: "ระดับบน (มงกุฎ ปัญญา ความเข้าใจ) เรื่องนี้เกี่ยวกับเป้าหมายและเจตจำนงลึก ๆ ของชีวิต", eth: "ระดับกลาง (เมตตา อำนาจ ความงาม) เรื่องนี้เกี่ยวกับคุณค่า การตัดสินใจ และหัวใจของตัวตน", ast: "ระดับล่าง (ชัยชนะ ความรุ่งโรจน์ รากฐาน) เรื่องนี้เกี่ยวกับอารมณ์ ความคิด และสิ่งที่อยู่ในจิตใต้สำนึก", mat: "มัลคูท (อาณาจักร) เรื่องนี้เกี่ยวกับผลที่จับต้องได้ในโลกจริง" },
      levelLead: "ระดับที่มีน้ำหนักมากที่สุดคือ",
      world: (w, n) => `โลกที่เด่น: ${w} (${n} ใบ)`,
      sunSign: (sg, el, mod, ru) => `ราศีเกิด (ดวงอาทิตย์): ${sg} · ธาตุ${el} · ${mod} · ดาวเจ้าเรือน${ru}`,
      cusp: (o) => `คุณเกิดใกล้รอยต่อราศี ขึ้นกับเวลาเกิด อาจเป็นราศี${o}`,
      lifePath: (n, m) => `เลขเส้นทางชีวิต (Life Path) ${n}: ${m}`,
      birthCard: (p, s) => `ไพ่ประจำตัว (Birth cards แบบ Mary K. Greer): บุคลิกภาพ ${p} · จิตวิญญาณ ${s}`,
      yearCard: (y, c) => `ไพ่ประจำปี ${y} ของคุณ: ${c}`,
      resBirth: (c, p) => `${c} ซึ่งเป็นไพ่ประจำตัวของคุณ ปรากฏในตำแหน่ง ${p} เรื่องนี้ผูกกับแก่นตัวตนของคุณโดยตรง`,
      resYear: (c, p) => `${c} ซึ่งเป็นไพ่ประจำปีของคุณ ปรากฏในตำแหน่ง ${p} เรื่องนี้เป็นบทเรียนหลักของปีนี้`,
      resSign: (list) => `ไพ่ที่สัมพันธ์กับราศีของคุณ: ${list} พลังเหล่านี้เข้ากับธรรมชาติของคุณเป็นพิเศษ`,
      resRuler: (list, pl) => `ไพ่ที่มีดาว${pl} (ดาวเจ้าเรือนของคุณ): ${list}`,
      resEl: (d) => `ธาตุประจำราศีของคุณกับไพ่ผลลัพธ์: ${d}`,
      resLP: (q, lp) => `แก่นสารของการอ่าน (${q}) กับเลขเส้นทางชีวิต (${lp}) ตรงกัน การอ่านครั้งนี้สะท้อนบทเรียนหลักของชีวิตคุณ`,
      noBirth: "ใส่วันเกิดเพื่อให้ระบบคำนวณราศี เลขเส้นทางชีวิต และไพ่ประจำตัว แล้วเชื่อมกับไพ่ที่เปิดได้",
      adviceSelfGood: (k) => `รักษาท่าทีแบบ ${k} ไว้ เพราะเป็นจุดแข็งของคุณในเรื่องนี้`,
      adviceSelfBad: (k) => `ทบทวนท่าทีของตัวเอง: ${k} อาจกำลังทำให้เรื่องยากขึ้นกว่าที่ควร`,
      adviceChallenge: (k) => `จัดการสิ่งท้าทายหลักก่อน คือ ${k}`,
      adviceQuint: (k) => `จำแก่นของเรื่องนี้ไว้: ${k}`,
      adviceExcess: (e) => `ลดพลังธาตุ${e}ที่มากเกินไปลงบ้าง`,
      adviceMoon: "ถ้าต้องตัดสินใจเรื่องสำคัญ รอให้ข้อมูลชัดเจนกว่านี้",
      summaryQ: (q) => `คำถาม: “${q}”`,
      summary: (a) => `ไพ่ชี้ว่าหัวใจของเรื่องคือ ${a.c1} (${a.k1}) โดยมี ${a.c2} เป็นแรงท้าทาย (${a.k2}) ในช่วงถัดไปจะเข้าสู่ ${a.c6} (${a.k6}) และถ้าเดินตามทิศทางนี้ ผลที่มีแนวโน้มคือ ${a.c10} — ${a.k10}`,
      trendLine: (t, s, lvl) => `แนวโน้มพลังงานตามเส้นเวลา: ${t} (ความชัน ${s} ต่อช่วง) ${lvl}`,
      topicLine: (t, flags) => `หมวดคำถาม: ${t}${flags}`,
      flagYes: " · คำถามแบบใช่/ไม่ใช่", flagWhen: " · ถามเรื่องเวลา", flagShould: " · ขอคำแนะนำ", flagWhy: " · ถามหาสาเหตุ",
      whyNote: "คำถามของคุณถามหาสาเหตุ คำตอบหลักอยู่ที่ตำแหน่ง 3 (รากฐาน) และ 4 (อดีตที่เพิ่งผ่าน)",
      shouldNote: "คำถามของคุณขอคำแนะนำ ให้ให้น้ำหนักกับตำแหน่ง 7 (ท่าทีของคุณ) และตำแหน่ง 5 (เป้าหมาย) มากที่สุด",
      andSep: ", ",
    },
    en: {
      rev: "reversed", up: "upright",
      inTopic: (t) => `For ${t}: `,
      revGood: (t) => `For ${t}, this strength is blocked or arriving late: `,
      revBad: (t) => `For ${t}, the following is easing or fading: `,
      revMid: (t) => `For ${t}, this stays inside you more than it shows: `,
      pos2good: "A positive card in the challenge position means the good thing itself is the test — too much of it, complacency, or not being ready to receive it.",
      pos9hope: (k) => `What you secretly hope for: ${k}.`,
      pos9fear: (k) => `What you fear deep down: ${k} — the fear may be bigger than the reality.`,
      pos9mix: (k) => `You both hope for and fear the same thing: ${k}.`,
      pos10major: "The outcome is a Major Arcana card: this is a turning point with long-term effects.",
      pos10court: "The outcome is a court card: the result may arrive as a person, or as a role you must step into.",
      courtSelf: "A court card here reflects the personality you are using — or should use — in this matter.",
      courtOther: "A court card here often stands for a real person who plays a part in the matter.",
      otherFocus: "Your question is about another person, so position 8 speaks directly to their stance and view.",
      healthNote: "Tarot is not a medical diagnosis. If you have symptoms or health concerns, see a doctor.",
      moneyNote: "This is not financial or investment advice; decide on real data and the risk you can bear.",
      majors: (n, exp, p) => n === 0 ? "No Major Arcana at all: the matter is almost entirely in your hands, decided by everyday choices and actions."
        : n <= 2 ? `${n} Major Arcana (average ${exp}) — a normal share: the matter mixes what you control with life's timing.`
        : n === 3 ? "3 Major Arcana, a little above average: this matter carries more weight than most."
        : `${n} Major Arcana out of 10 (average ${exp}; the chance of ${n} or more by luck alone is only ${p}): an important life chapter with forces larger than you, and lessons with long-term effect.`,
      courts: (n) => n === 0 ? "No court cards: this is about circumstances more than people." : n >= 4 ? `${n} court cards: several people are involved, or you are wearing several hats at once.` : `${n} court card${n > 1 ? "s" : ""}: key people are involved.`,
      reversed: (n) => n >= 6 ? `${n} reversed cards: most of the energy is blocked, delayed or internal, not yet expressed outwardly.` : n <= 1 ? `${n} reversed card${n === 1 ? "" : "s"}: energy flows freely and is expressed directly.` : `${n} reversed cards: parts of the matter are stuck or call for inner work.`,
      suit: (s, n) => `${s} dominate with ${n} cards.`,
      number: (r, k, m) => `${r} appear${/s$/.test(r) ? "" : "s"} ${k} times: ${m}.`,
      dom: (e, pct, d) => `${e} dominates (${pct}%): the matter revolves around ${d}.`,
      tie: (es) => `${es} are equally strong.`,
      dig: { 2: "same element — strongly reinforcing", 1: "friendly elements — supporting", 0: "neutral elements — neither helping nor hindering", "-1": "contrary elements — weakening each other" },
      pair12: { 2: "the obstacle springs from the same source as the matter itself; fix the root cause.", 1: "the obstacle can be turned into support if used well.", 0: "the obstacle is separate from the main issue and can be handled on its own.", "-1": "the obstacle genuinely weakens the main issue; make it your first priority." },
      axisTime: (a, b, c, ph) => `From ${a} in the recent past, through ${b} now, toward ${c} next: ${ph}`,
      delta: ["things get heavier for a while — prepare, and do not decide in the heat of emotion.", "the next stage may be slightly harder than the last.", "the energy stays at a similar level; what changes is its form rather than its strength.", "things gradually improve.", "things are clearly improving."],
      axisMind: { 2: "Your deep drive (position 3) and your conscious aim (position 5) share an element: heart and intention move powerfully together.", 1: "Your deep drive supports your conscious aim; you pursue it naturally.", 0: "Your deep drive and your aim are independent; link them with intention and discipline.", "-1": "What you think you want (position 5) clashes with your deeper drive (position 3); you may hesitate or sabotage yourself unknowingly. Ask what you really want." },
      axisSelf: (s, e, d) => `You (${s}) and those around you (${e}): ${d}`,
      selfEnv: { 2: "you see the matter the same way.", 1: "you get along and can help each other.", 0: "each side moves at its own pace.", "-1": "there is difference or friction; communicate clearly." },
      hopeOut: { same: "Your hope or fear is mirrored in the outcome, so your attitude strongly shapes where this ends.", diff: "The outcome is not simply what you hope for or fear; let the matter reveal itself without second-guessing." },
      crownOut: { yes: "The outcome agrees with your conscious aim: you are heading the right way.", no: "The outcome differs from your aim: you may get what you need in an unexpected form, or need to adjust the goal." },
      outStrong: "The neighbouring cards strengthen the outcome card: the result is likely to show in full.", outWeak: "The neighbouring cards weaken the outcome card: the result may be milder than it looks, and your actions can still change it.", outMid: "Support around the outcome card is about average.",
      trend: ["clearly declining", "somewhat declining", "steady", "gradually improving", "clearly rising"],
      level: (y) => y >= 1.2 ? "Overall energy is strongly positive." : y >= 0.4 ? "Overall energy is positive." : y > -0.4 ? "Overall energy is neutral." : y > -1.2 ? "Overall energy is rather heavy." : "Overall energy is heavy.",
      verdict: ["No (for now)", "Many obstacles — leaning no", "Unclear — it depends on your actions", "Yes, with conditions", "Yes — a clear lean"],
      verdictNote: ["The cards do not support it as things stand. If you still want it, see what positions 2 and 7 ask you to change.", "The lean is unfavourable but not closed; deal with the obstacle in position 2 first.", "The cards point neither way clearly; the outcome rests on your decisions and actions.", "The lean is positive, but there are conditions or obstacles to handle.", "Most cards clearly support it."],
      timeNow: (a, b) => `You are already inside this card's period (until about ${b}).`,
      timeWin: (a, b) => `Window to watch: about ${a} – ${b}.`,
      timeBy: (c, how) => `Based on ${c} (${how}).`,
      timeMajors: "With many Major Arcana, events follow life's rhythm more than the calendar; treat the window as a rough guide.",
      paceSuit: (s, p) => `${s} set the pace: ${p}.`,
      pacePlanet: (pl, p) => `${pl} sets the pace: ${p}.`,
      decanHow: (pl, sg, d) => `${pl} in ${sg}, decan ${d}`,
      spanHow: (sg) => `the court card's span, mostly ${sg}`,
      quadHow: (a, b) => `the quadrant from ${a} to ${b}`,
      signHow: (sg) => sg,
      quint: (name, kw) => `The quintessence of this reading is ${name} — ${kw}.`,
      quintHow: (sum, q) => `sum of card numbers = ${sum} → reduced to ${q}`,
      pillar: (p, n) => `The reading's energy sits mostly on the ${p}: ${n}.`,
      levelTree: { sup: "the upper level (Crown, Wisdom, Understanding): the matter concerns life purpose and deep will.", eth: "the middle level (Mercy, Severity, Beauty): the matter concerns values, decisions and the heart of the self.", ast: "the lower level (Victory, Splendour, Foundation): the matter concerns emotions, thoughts and the subconscious.", mat: "Malkuth (Kingdom): the matter concerns tangible, real-world results." },
      levelLead: "The heaviest level is",
      world: (w, n) => `Leading world: ${w} (${n} cards)`,
      sunSign: (sg, el, mod, ru) => `Sun sign: ${sg} · ${el} · ${mod} · ruled by ${ru}`,
      cusp: (o) => `You were born near a sign boundary; depending on your birth time you may be ${o}.`,
      lifePath: (n, m) => `Life Path number ${n}: ${m}`,
      birthCard: (p, s) => `Tarot birth cards (Mary K. Greer): personality ${p} · soul ${s}`,
      yearCard: (y, c) => `Your year card for ${y}: ${c}`,
      resBirth: (c, p) => `${c}, one of your birth cards, appears in position ${p}: this matter touches the core of who you are.`,
      resYear: (c, p) => `${c}, your year card, appears in position ${p}: this is a main lesson of the year.`,
      resSign: (list) => `Cards linked to your sign: ${list}. These energies suit your nature especially well.`,
      resRuler: (list, pl) => `Cards ruled by ${pl}, your ruling planet: ${list}.`,
      resEl: (d) => `Your sign's element and the outcome card: ${d}.`,
      resLP: (q, lp) => `The reading's quintessence (${q}) matches your Life Path (${lp}): this reading reflects a core lesson of your life.`,
      noBirth: "Add your birth date to compute your sun sign, Life Path number and birth cards and link them to the cards drawn.",
      adviceSelfGood: (k) => `Keep your attitude of ${k} — it is your strength here.`,
      adviceSelfBad: (k) => `Review your own stance: ${k} may be making things harder than they need to be.`,
      adviceChallenge: (k) => `Deal with the main challenge first: ${k}.`,
      adviceQuint: (k) => `Remember the core of this matter: ${k}.`,
      adviceExcess: (e) => `Tone down the excess of ${e}.`,
      adviceMoon: "If a major decision is due, wait until the facts are clearer.",
      summaryQ: (q) => `Question: “${q}”`,
      summary: (a) => `The cards say the heart of the matter is ${a.c1} (${a.k1}), challenged by ${a.c2} (${a.k2}). Next comes ${a.c6} (${a.k6}), and if the present course holds, the likely outcome is ${a.c10} — ${a.k10}.`,
      trendLine: (t, s, lvl) => `Energy along the time line: ${t} (slope ${s} per step). ${lvl}`,
      topicLine: (t, flags) => `Question type: ${t}${flags}`,
      flagYes: " · yes/no question", flagWhen: " · asks about timing", flagShould: " · asks for advice", flagWhy: " · asks for causes",
      whyNote: "Your question asks why, so the key answers are in position 3 (the root) and position 4 (the recent past).",
      shouldNote: "Your question asks for advice, so weigh position 7 (your attitude) and position 5 (your aim) most.",
      andSep: ", ",
    },
  };

  // ===== the reading ================================================================================
  const lv = (o, lang) => (o && typeof o === "object" ? o[lang] : o);
  function fmtDate(d, lang) {
    return d.toLocaleDateString(lang === "en" ? "en-GB" : "th-TH", { day: "numeric", month: "short", year: lang === "en" ? "numeric" : "2-digit" });
  }
  function analyze(spread, opt) {
    const lang = opt.lang === "en" ? "en" : "th";
    const L = S[lang];
    const today = opt.today || new Date();
    const useRev = opt.reversals !== false;
    const P = T.POSITIONS;
    const items = spread.map((s, i) => {
      const c = T.CARDS[s.id];
      const rev = useRev && s.r === 1;
      return { pos: i + 1, c, rev, v: c.v[rev ? 1 : 0] };
    });
    const at = (p) => items[p - 1];
    const nm = (it) => it.c.name[lang] + (it.rev ? ` (${L.rev})` : "");
    // inside a sentence that already has brackets: "Four of Pentacles reversed (…)" / "สี่เหรียญกลับหัว (…)"
    const nm2 = (it) => it.c.name[lang] + (it.rev ? (lang === "en" ? " reversed" : "กลับหัว") : "");
    const kw = (it, n = 3) => it.c.kw[lang][it.rev ? 1 : 0].slice(0, n).join(L.andSep);
    const q = classify(opt.question);
    const topic = T.TOPICS[q.topic];
    const tname = topic[lang];

    // ---- per position
    const lineKey = { l: "love", w: "work", f: "money" }[topic.line];
    const positions = items.map((it) => {
      const notes = [];
      let topicText = "";
      if (lineKey) {
        const base = it.c[lineKey][lang];
        const lead = !it.rev ? L.inTopic(tname) : it.c.v[0] >= 1 ? L.revGood(tname) : it.c.v[0] <= -1 ? L.revBad(tname) : L.revMid(tname);
        topicText = lead + base;
      }
      if (it.pos === 2 && it.v >= 2) notes.push(L.pos2good);
      if (it.pos === 9) notes.push(it.v >= 1 ? L.pos9hope(kw(it, 2)) : it.v <= -1 ? L.pos9fear(kw(it, 2)) : L.pos9mix(kw(it, 2)));
      if (it.pos === 10 && it.c.major) notes.push(L.pos10major);
      if (it.pos === 10 && !it.c.major && it.c.rank >= 11) notes.push(L.pos10court);
      if (it.pos === 7 && !it.c.major && it.c.rank >= 11) notes.push(L.courtSelf);
      if (it.pos === 8 && !it.c.major && it.c.rank >= 11) notes.push(L.courtOther);
      if (it.pos === 8 && q.other) notes.push(L.otherFocus);
      return { pos: it.pos, id: it.c.id, rev: it.rev, title: P[it.pos][lang], desc: P[it.pos].d[lang], name: nm(it), keywords: it.c.kw[lang][it.rev ? 1 : 0],
        meaning: it.c.mean[lang][it.rev ? 1 : 0], topic: topicText, notes, v: it.v, tags: tags(it.c, lang) };
    });

    // ---- counts
    const elCount = { fire: 0, water: 0, air: 0, earth: 0 };
    items.forEach((it) => { elCount[it.c.el]++; });
    const majors = items.filter((it) => it.c.major).length;
    const courts = items.filter((it) => !it.c.major && it.c.rank >= 11).length;
    const reversed = items.filter((it) => it.rev).length;
    const suits = { W: 0, C: 0, S: 0, P: 0 };
    items.forEach((it) => { if (!it.c.major) suits[it.c.suit]++; });
    const ranks = {};
    items.forEach((it) => { if (!it.c.major) ranks[it.c.rank] = (ranks[it.c.rank] || 0) + 1; });
    const signs = new Array(12).fill(0), planets = {}, modes = { cardinal: 0, fixed: 0, mutable: 0 };
    items.forEach((it) => {
      if (it.c.sign != null) { signs[it.c.sign]++; modes[T.SIGNS[it.c.sign].mod]++; }
      if (it.c.planet) planets[it.c.planet] = (planets[it.c.planet] || 0) + 1;
    });

    // ---- elements
    const elMax = Math.max(...Object.values(elCount));
    const domEls = Object.keys(elCount).filter((e) => elCount[e] === elMax);
    const missing = Object.keys(elCount).filter((e) => elCount[e] === 0);
    const elNotes = [];
    if (domEls.length === 1) elNotes.push(L.dom(T.ELEMENTS[domEls[0]][lang], elMax * 10, T.ELEMENTS[domEls[0]].dom[lang]));
    else elNotes.push(L.tie(domEls.map((e) => T.ELEMENTS[e][lang]).join(lang === "en" ? " and " : "และ")));
    if (elMax >= 5) domEls.forEach((e) => elNotes.push(T.ELEMENTS[e].much[lang]));
    missing.forEach((e) => elNotes.push(T.ELEMENTS[e].lack[lang]));
    const d12 = T.dignity(at(1).c.el, at(2).c.el);
    const d35 = T.dignity(at(3).c.el, at(5).c.el);
    const d78 = T.dignity(at(7).c.el, at(8).c.el);
    const outSupport = T.dignity(at(10).c.el, at(6).c.el) + T.dignity(at(10).c.el, at(9).c.el);
    const dignities = [
      { a: 1, b: 2, d: d12, text: L.dig[d12] + " — " + L.pair12[d12] },
      { a: 3, b: 5, d: d35, text: L.dig[d35] },
      { a: 7, b: 8, d: d78, text: L.dig[d78] },
      { a: 10, b: 6, d: T.dignity(at(10).c.el, at(6).c.el), text: L.dig[T.dignity(at(10).c.el, at(6).c.el)] },
      { a: 10, b: 9, d: T.dignity(at(10).c.el, at(9).c.el), text: L.dig[T.dignity(at(10).c.el, at(9).c.el)] },
    ];

    // ---- trend: least-squares line through the time positions 3 (t=−2), 4 (−1), 1 (0), 6 (+1), 10 (+2)
    const tl = [3, 4, 1, 6, 10].map((p) => ({ p, t: P[p].t, y: at(p).v }));
    const ybar = tl.reduce((a, x) => a + x.y, 0) / tl.length;
    const slope = tl.reduce((a, x) => a + x.t * (x.y - ybar), 0) / tl.reduce((a, x) => a + x.t * x.t, 0);
    const trendIdx = slope <= -0.45 ? 0 : slope <= -0.15 ? 1 : slope < 0.15 ? 2 : slope < 0.45 ? 3 : 4;
    const dv = at(6).v - at(4).v;
    const deltaIdx = dv <= -2 ? 0 : dv <= -1 ? 1 : dv < 1 ? 2 : dv < 2 ? 3 : 4;

    // ---- verdict score: weighted valence in [−1, 1]
    let wsum = 0, ssum = 0;
    items.forEach((it) => { wsum += P[it.pos].w; ssum += P[it.pos].w * it.v; });
    const score = ssum / (3 * wsum);
    const yn = 0.6 * score + 0.4 * (at(10).v / 3);
    const vIdx = yn <= -0.35 ? 0 : yn <= -0.12 ? 1 : yn < 0.12 ? 2 : yn < 0.35 ? 3 : 4;

    // ---- axes
    const axes = [];
    axes.push({ k: "time", title: lang === "en" ? "Time line (4 → 1 → 6)" : "แกนเวลา (4 → 1 → 6)", text: L.axisTime(nm2(at(4)), nm2(at(1)), nm2(at(6)), L.delta[deltaIdx]) });
    axes.push({ k: "mind", title: lang === "en" ? "Root and aim (3 ↔ 5)" : "รากฐานกับเป้าหมาย (3 ↔ 5)", text: L.axisMind[d35] });
    axes.push({ k: "self", title: lang === "en" ? "You and your surroundings (7 ↔ 8)" : "ตัวคุณกับสิ่งแวดล้อม (7 ↔ 8)", text: L.axisSelf(nm2(at(7)), nm2(at(8)), L.selfEnv[d78]) });
    const sameHope = Math.sign(at(9).v) === Math.sign(at(10).v) && (at(9).c.el === at(10).c.el || Math.abs(at(9).v - at(10).v) <= 1);
    axes.push({ k: "hope", title: lang === "en" ? "Hopes and fears vs outcome (9 → 10)" : "ความหวัง/ความกลัว กับผลลัพธ์ (9 → 10)", text: sameHope ? L.hopeOut.same : L.hopeOut.diff });
    const crownMatch = Math.sign(at(5).v) === Math.sign(at(10).v) || T.dignity(at(5).c.el, at(10).c.el) >= 1;
    axes.push({ k: "crown", title: lang === "en" ? "Aim vs outcome (5 → 10)" : "เป้าหมาย กับผลลัพธ์ (5 → 10)", text: crownMatch ? L.crownOut.yes : L.crownOut.no });
    axes.push({ k: "out", title: lang === "en" ? "Strength of the outcome" : "ความหนักแน่นของผลลัพธ์", text: outSupport >= 2 ? L.outStrong : outSupport <= -1 ? L.outWeak : L.outMid });

    // ---- statistics of the draw
    const expMaj = ((10 * 22) / 78).toFixed(1);
    const pMaj = hyperTail(majors, 78, 22, 10);
    const pct = (p) => (p < 0.001 ? "<0.1%" : (p * 100).toFixed(p < 0.1 ? 1 : 0) + "%");
    const stats = [L.majors(majors, expMaj, pct(pMaj)), L.courts(courts)];
    if (useRev) stats.push(L.reversed(reversed));
    const suitMax = Math.max(...Object.values(suits));
    if (suitMax >= 4) Object.keys(suits).filter((s) => suits[s] === suitMax).forEach((s) => stats.push(L.suit(T.SUITS[s][lang], suitMax)));
    const numbers = Object.keys(ranks).filter((r) => ranks[r] >= 2).map((r) => L.number(+r === 1 ? (lang === "en" ? "Aces" : "ไพ่เอซ (เลข 1)") : +r <= 10 ? (lang === "en" ? `The number ${r}` : `เลข ${r}`) : lang === "en" ? T.RANKS[r].en + "s" : "ไพ่" + T.RANKS[r].th, ranks[r], T.NUMBERS[r][lang]));

    // ---- astrology
    const sMax = Math.max(...signs);
    const topSigns = sMax > 0 ? signs.map((n, i) => [i, n]).filter((x) => x[1] === sMax).map((x) => x[0]) : [];
    const pMax = Math.max(0, ...Object.values(planets));
    const topPlanets = Object.keys(planets).filter((p) => planets[p] === pMax && pMax > 0);
    const mMax = Math.max(...Object.values(modes));
    const topMode = mMax > 0 ? Object.keys(modes).filter((m) => modes[m] === mMax) : [];
    const astro = { signs, planets, modes, topSigns, topPlanets, topMode,
      notes: [
        ...topPlanets.map((p) => `${T.PLANETS[p].g} ${T.PLANETS[p][lang]}: ${T.PLANETS[p].m[lang]}`),
        ...(topMode.length === 1 ? [`${T.MODES[topMode[0]][lang]}: ${T.MODES[topMode[0]].note[lang]}`] : []),
      ] };

    // ---- numerology: quintessence
    const sum = items.reduce((a, it) => a + (it.c.major ? it.c.n : it.c.rank <= 10 ? it.c.rank : 0), 0);
    const qn = toMajor(sum);
    const qc = T.CARDS[qn];
    const quint = { sum, n: qn, id: qn, text: L.quint(qc.name[lang], qc.kw[lang][0].slice(0, 3).join(L.andSep)), how: L.quintHow(sum, qn), meaning: qc.mean[lang][0] };

    // ---- Tree of Life
    const seph = new Array(11).fill(0), sephPos = Array.from({ length: 11 }, () => []), paths = [];
    items.forEach((it) => {
      if (it.c.major) { const [a, b] = it.c.seph; seph[a] += 0.5; seph[b] += 0.5; paths.push({ n: it.c.n, a, b, pos: it.pos }); }
      else { seph[it.c.seph] += 1; sephPos[it.c.seph].push(it.pos); }
    });
    const pil = { m: 0, s: 0, c: 0 };
    for (let i = 1; i <= 10; i++) pil[T.SEPHIROT[i].p] += seph[i];
    const pilTop = Object.keys(pil).sort((a, b) => pil[b] - pil[a])[0];
    const lvl = { sup: seph[1] + seph[2] + seph[3], eth: seph[4] + seph[5] + seph[6], ast: seph[7] + seph[8] + seph[9], mat: seph[10] };
    const lvlTop = Object.keys(lvl).sort((a, b) => lvl[b] - lvl[a])[0];
    const worldTop = Object.keys(suits).sort((a, b) => suits[b] - suits[a])[0];
    const tree = { seph, sephPos, paths, pillars: pil, levels: lvl,
      notes: [L.pillar(T.PILLARS[pilTop][lang], T.PILLARS[pilTop].note[lang]), `${L.levelLead} ${L.levelTree[lvlTop]}`,
        ...(suits[worldTop] > 0 ? [L.world(T.WORLDS[worldTop][lang], suits[worldTop])] : [])] };

    // ---- birth data (Key of Life)
    let birth = null;
    const bm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(opt.birth || "");
    if (bm) {
      const y = +bm[1], m = +bm[2], d = +bm[3];
      const bd = new Date(y, m - 1, d, 12);
      if (!isNaN(bd) && y > 1900 && bd <= today) {
        const lon = sunLongitude(bd);
        const sg = signOf(lon), within = T.norm(lon) - sg * 30;
        const other = within < 0.8 ? (sg + 11) % 12 : within > 29.2 ? (sg + 1) % 12 : null;
        const SG = T.SIGNS[sg];
        const lp = lifePath(y, m, d);
        const bc = birthCards(y, m, d);
        const yc = toMajor(d + m + today.getFullYear());
        const lines = [
          L.sunSign(`${SG.g}︎ ${SG[lang]}`, T.ELEMENTS[SG.el][lang], T.MODES[SG.mod][lang], T.PLANETS[SG.ruler][lang]),
          ...(other != null ? [L.cusp(T.SIGNS[other][lang])] : []),
          L.lifePath(lp, T.LIFE_PATH[lp][lang]),
          L.birthCard(T.CARDS[bc.personality].name[lang], T.CARDS[bc.soul].name[lang]),
          L.yearCard(today.getFullYear(), T.CARDS[yc].name[lang]),
        ];
        const res = [];
        items.forEach((it) => {
          if (it.c.major && bc.chain.includes(it.c.n)) res.push(L.resBirth(it.c.name[lang], it.pos));
          if (it.c.major && it.c.n === yc) res.push(L.resYear(it.c.name[lang], it.pos));
        });
        const bySign = items.filter((it) => it.c.sign === sg).map((it) => `${it.c.name[lang]} (${it.pos})`);
        if (bySign.length) res.push(L.resSign(bySign.join(L.andSep)));
        const byRuler = items.filter((it) => it.c.planet === SG.ruler).map((it) => `${it.c.name[lang]} (${it.pos})`);
        if (byRuler.length) res.push(L.resRuler(byRuler.join(L.andSep), T.PLANETS[SG.ruler][lang]));
        const de = T.dignity(SG.el, at(10).c.el);
        res.push(L.resEl(L.dig[de]));
        if (qn === lp || (lp === 22 && qn === 0)) res.push(L.resLP(qn, lp));
        birth = { sign: sg, el: SG.el, lifePath: lp, cards: bc, year: yc, lines, resonance: res };
      }
    }

    // ---- timing
    const timing = timingFor(at(10), at(6), majors, today, lang, L);

    // ---- advice
    const advice = [];
    advice.push(at(7).v >= 1 ? L.adviceSelfGood(kw(at(7), 2)) : L.adviceSelfBad(kw(at(7), 2)));
    if (at(2).v <= 0) advice.push(L.adviceChallenge(kw(at(2), 2)));
    missing.forEach((e) => advice.push(T.ELEMENTS[e].fix[lang]));
    if (elMax >= 5) domEls.forEach((e) => advice.push(L.adviceExcess(T.ELEMENTS[e][lang])));
    if (items.some((it) => it.c.id === 18 && !it.rev) && (at(1).c.id === 18 || at(6).c.id === 18 || at(10).c.id === 18)) advice.push(L.adviceMoon);
    advice.push(L.adviceQuint(qc.kw[lang][0].slice(0, 2).join(L.andSep)));
    if (q.why) advice.unshift(L.whyNote);
    if (q.should) advice.unshift(L.shouldNote);
    const caution = q.topic === "health" ? L.healthNote : q.topic === "money" ? L.moneyNote : "";

    // ---- summary
    const flags = (q.yesno ? L.flagYes : "") + (q.when ? L.flagWhen : "") + (q.should ? L.flagShould : "") + (q.why ? L.flagWhy : "");
    const summary = {
      question: opt.question ? L.summaryQ(String(opt.question).trim()) : "",
      topic: L.topicLine(tname, flags),
      text: L.summary({ c1: nm2(at(1)), k1: kw(at(1), 2), c2: nm2(at(2)), k2: kw(at(2), 2), c6: nm2(at(6)), k6: kw(at(6), 2), c10: nm2(at(10)), k10: kw(at(10), 3) }),
      trend: L.trendLine(L.trend[trendIdx], (slope >= 0 ? "+" : "") + slope.toFixed(2), L.level(ybar)),
    };

    return {
      lang, question: q, topicName: tname, summary, positions, axes,
      elements: { count: elCount, dominant: domEls, missing, notes: elNotes }, dignities,
      trend: { points: tl, slope, mean: ybar, label: L.trend[trendIdx], idx: trendIdx },
      verdict: { score, yn, idx: vIdx, label: L.verdict[vIdx], note: L.verdictNote[vIdx], show: q.yesno },
      stats, counts: { majors, courts, reversed, suits }, numbers, astro, quint, tree, birth, timing, advice, caution,
    };
  }

  // tags shown under a card: element, astrology, Hebrew letter / Tree of Life
  function tags(c, lang) {
    const E = T.ELEMENTS;
    const elText = c.major || !c.sub ? (lang === "en" ? E[c.el].en : "ธาตุ" + E[c.el].th)
      : lang === "en" ? `${E[c.sub].en} of ${E[c.el].en}` : `ธาตุ${E[c.sub].th}ของ${E[c.el].th}`;
    const out = [{ k: "el", el: c.el, text: elText }];
    if (c.major) {
      if (c.sign != null) out.push({ k: "astro", text: `${T.SIGNS[c.sign].g}︎ ${lang === "en" ? "" : "ราศี"}${T.SIGNS[c.sign][lang]}` });
      if (c.planet) out.push({ k: "astro", text: `${T.PLANETS[c.planet].g} ${lang === "en" ? "" : "ดาว"}${T.PLANETS[c.planet][lang]}` });
      out.push({ k: "heb", text: `${c.heb} ${c.hebName} · ${lang === "en" ? "path" : "เส้นทาง"} ${c.path}` });
    } else {
      if (c.rank >= 2 && c.rank <= 10) out.push({ k: "astro", text: `${T.PLANETS[c.planet].g} ${T.PLANETS[c.planet][lang]} ${lang === "en" ? "in" : "ใน"} ${T.SIGNS[c.sign].g}︎ ${T.SIGNS[c.sign][lang]}` });
      else if (c.rank >= 12) out.push({ k: "astro", text: `${T.SIGNS[Math.floor(T.norm(c.span[0]) / 30)].g}︎ 20° → ${T.SIGNS[c.sign].g}︎ 20°` });
      else out.push({ k: "astro", text: `${T.SIGNS[c.span[0] / 30].g}︎–${T.SIGNS[(c.span[1] / 30 - 1) % 12].g}︎` });
      out.push({ k: "heb", text: T.SEPHIROT[c.seph][lang] });
    }
    return out;
  }

  function timingFor(o, n, majors, today, lang, L) {
    const lines = [];
    let win = null;
    const describe = (it) => {
      const c = it.c, name = c.name[lang];
      if (c.span) {
        const w = sunWindow(c.span, today);
        let how;
        if (c.major) how = L.signHow(T.SIGNS[c.sign][lang]);
        else if (c.rank >= 2 && c.rank <= 10) how = L.decanHow(T.PLANETS[c.planet][lang], T.SIGNS[c.sign][lang], c.decan);
        else if (c.rank >= 12) how = L.spanHow(T.SIGNS[c.sign][lang]);
        else how = L.quadHow(T.SIGNS[c.span[0] / 30][lang], T.SIGNS[(c.span[1] / 30 - 1) % 12][lang]);
        return { w, line: L.timeBy(name, how) };
      }
      if (c.planet) return { w: null, line: L.pacePlanet(T.PLANETS[c.planet][lang], T.PLANETS[c.planet].pace[lang]) };
      return null;
    };
    const first = describe(o) || describe(n);
    if (first) {
      if (first.w) { win = first.w; lines.push(first.w.now ? L.timeNow(fmtDate(first.w.from, lang), fmtDate(first.w.to, lang)) : L.timeWin(fmtDate(first.w.from, lang), fmtDate(first.w.to, lang))); }
      lines.push(first.line);
    }
    if (!o.c.major) lines.push(L.paceSuit(T.SUITS[o.c.suit][lang], T.SUITS[o.c.suit].pace[lang]));
    else if (!n.c.major) lines.push(L.paceSuit(T.SUITS[n.c.suit][lang], T.SUITS[n.c.suit].pace[lang]));
    if (majors >= 4) lines.push(L.timeMajors);
    return { lines, window: win };
  }

  // plain-text copy of a reading (for "copy" and sharing)
  function toText(rep, spread) {
    const en = rep.lang === "en";
    const out = [];
    out.push(en ? "Celtic Cross tarot reading — Mod's Engineering Mathematics" : "ผลดูดวงไพ่ทาโรต์ Celtic Cross — Mod's Engineering Mathematics");
    if (rep.summary.question) out.push(rep.summary.question);
    out.push(rep.summary.topic, "", rep.summary.text, rep.summary.trend);
    if (rep.verdict.show) out.push((en ? "Yes/no lean: " : "แนวโน้มคำตอบ: ") + rep.verdict.label);
    out.push("");
    rep.positions.forEach((p) => out.push(`${p.pos}. ${p.title}: ${p.name} — ${p.keywords.slice(0, 3).join(", ")}`));
    out.push("", ...rep.timing.lines, "", (en ? "Advice:" : "คำแนะนำ:"), ...rep.advice.map((a) => "• " + a));
    out.push("", "https://modsengineeringmath.com" + (en ? "/en/tools/tarot/" : "/tools/tarot/"));
    return out.join("\n");
  }

  const API = { N, makeRng, stir, poolEvents: () => poolEvents, freshDeck, copy, isDeck, encode, decode, riffle, overhand, wash, cutPiles, restack, gather,
    metrics, TV78, sunLongitude, sunWindow, signOf, lifePath, birthCards, toMajor, hyperTail, classify, analyze, toText, fmtDate };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.TarotEngine = API;
})(typeof window !== "undefined" ? window : globalThis);
