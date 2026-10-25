// Tests for the tarot reader: card data, Golden Dawn correspondences, shuffle models, mixing statistics and the reading.
// Run: node scripts/test-tarot.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { window: { crypto: globalThis.crypto }, console, Date, Math, Intl };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["assets/tarot-data.js", "assets/tarot-engine.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
const T = ctx.window.TarotData, E = ctx.window.TarotEngine;

let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.error("FAIL", msg); } };
const THAI = /[฀-๿]/;

// ---- card data ----
ok(T.CARDS.length === 78, "78 cards");
ok(new Set(T.CARDS.map((c) => c.id)).size === 78 && T.CARDS.every((c, i) => c.id === i), "ids 0..77 in order");
for (const c of T.CARDS) {
  const tag = `${c.id} ${c.name.en}`;
  for (const l of ["th", "en"]) {
    ok(c.name[l], `${tag} name ${l}`);
    ok(c.mean[l].length === 2 && c.mean[l].every((s) => s.length > 30), `${tag} meanings ${l}`);
    ok(["love", "work", "money"].every((k) => c[k][l] && c[k][l].length > 15), `${tag} topic lines ${l}`);
    ok(c.kw[l].length === 2 && c.kw[l].every((a) => a.length >= 3), `${tag} keywords ${l}`);
  }
  ok(!THAI.test([c.name.en, ...c.mean.en, c.love.en, c.work.en, c.money.en, ...c.kw.en.flat()].join(" ")), `${tag} English text has no Thai`);
  ok(THAI.test(c.mean.th.join("")), `${tag} Thai meaning is Thai`);
  ok(c.v.length === 2 && c.v.every((x) => Number.isInteger(x) && x >= -3 && x <= 3), `${tag} valence`);
  ok(["fire", "water", "air", "earth"].includes(c.el), `${tag} element`);
}
const byName = (n) => T.CARDS.find((c) => c.name.en === n);
const sign = (c) => T.SIGNS[c.sign].en;
// Golden Dawn decans and attributions
const decans = [["Two of Wands", "mars", "Aries"], ["Five of Wands", "saturn", "Leo"], ["Ten of Wands", "saturn", "Sagittarius"], ["Two of Cups", "venus", "Cancer"],
  ["Ten of Cups", "mars", "Pisces"], ["Three of Swords", "saturn", "Libra"], ["Nine of Swords", "mars", "Gemini"], ["Ten of Swords", "sun", "Gemini"],
  ["Two of Pentacles", "jupiter", "Capricorn"], ["Seven of Pentacles", "saturn", "Taurus"], ["Ten of Pentacles", "mercury", "Virgo"], ["Six of Swords", "mercury", "Aquarius"]];
for (const [n, p, s] of decans) { const c = byName(n); ok(c.planet === p && sign(c) === s, `${n} = ${p} in ${s} (got ${c.planet} in ${sign(c)})`); }
ok(byName("The Emperor").sign === 0 && byName("Death").sign === 7 && byName("The Star").sign === 10, "Major signs (Emperor Aries, Death Scorpio, Star Aquarius)");
ok(byName("The Magician").planet === "mercury" && byName("The Tower").planet === "mars" && byName("The World").planet === "saturn", "Major planets");
ok(byName("The Fool").el === "air" && byName("The Hanged Man").el === "water" && byName("Judgement").el === "fire", "Major elements");
ok(T.CARDS.slice(0, 22).every((c, n) => c.path === 11 + n && T.PATHS[n].length === 2), "22 paths 11–32");
ok(byName("King of Cups").sub === "fire" && byName("Queen of Cups").sub === "water" && byName("Knight of Cups").sub === "air" && byName("Page of Cups").sub === "earth", "court sub-elements");
// court spans tile the zodiac exactly once
const cover = new Array(360).fill(0);
for (const s of T.SUIT_KEYS) for (const r of [12, 13, 14]) { const [a, b] = T.COURT_SPAN[s][r]; for (let d = a; d !== b; d = (d + 1) % 360) cover[d]++; }
ok(cover.every((x) => x === 1), "court card spans cover 360° once");
// pips 2–10 cover the 36 decans once
const dec = new Set(T.CARDS.filter((c) => !c.major && c.rank >= 2 && c.rank <= 10).map((c) => c.span[0]));
ok(dec.size === 36, "36 decans");

// ---- shuffles ----
const rng = E.makeRng([11, 22, 33, 44]);
let d = E.freshDeck();
for (let i = 0; i < 200; i++) {
  const k = i % 3;
  d = (k === 0 ? E.riffle(d, rng, { reversals: true }) : k === 1 ? E.overhand(d, rng) : E.wash(d, rng, 1 + (i % 7))).deck;
  if (!E.isDeck(d)) { ok(false, "shuffle keeps a valid 78-card deck at step " + i); break; }
}
ok(E.isDeck(d), "deck valid after 200 mixed shuffles");
ok(E.decode(E.encode(d)) && E.encode(E.decode(E.encode(d))) === E.encode(d), "encode/decode round trip");
ok(E.decode("1.2.3") === null && E.decode("garbage") === null, "decode rejects invalid decks");
// riffle without reversals never turns cards; overhand never turns cards
let e = E.freshDeck();
for (let i = 0; i < 20; i++) e = E.riffle(e, rng, { reversals: false }).deck;
ok(e.every((c) => c.r === 0), "riffle without reversals keeps orientation");
ok(E.overhand(E.freshDeck(), rng).deck.every((c) => c.r === 0), "overhand keeps orientation");
// Bayer–Diaconis: after k riffles there are at most 2^k rising sequences
const ref = E.freshDeck();
let rr = E.freshDeck(), boundOk = true;
for (let k = 1; k <= 7; k++) { rr = E.riffle(rr, rng).deck; if (E.metrics(rr, ref).rising > 2 ** k) boundOk = false; }
ok(boundOk, "rising sequences ≤ 2^k after k riffles");
// overhand reverses packet order: a single pass from a fresh deck gives rising sequences = number of packets
const oh = E.overhand(E.freshDeck(), rng);
ok(E.metrics(oh.deck, ref).rising === oh.info.packets, "overhand: rising sequences equal packets");
// GSR cut is binomial: mean ≈ 39, sd ≈ 4.4
const cuts = Array.from({ length: 4000 }, () => E.riffle(E.freshDeck(), rng).info.top);
const mean = cuts.reduce((a, x) => a + x, 0) / cuts.length;
const sd = Math.sqrt(cuts.reduce((a, x) => a + (x - mean) ** 2, 0) / cuts.length);
ok(Math.abs(mean - 39) < 0.4 && Math.abs(sd - Math.sqrt(78) / 2) < 0.3, `GSR cut ~ Binomial(78, ½): mean ${mean.toFixed(2)}, sd ${sd.toFixed(2)}`);
// fresh deck: unmixed; many riffles: mixed
ok(E.metrics(E.freshDeck(), ref).mix === 0, "fresh deck mix = 0");
let m12 = E.freshDeck();
for (let k = 0; k < 12; k++) m12 = E.riffle(m12, rng).deck;
ok(E.metrics(m12, ref).mix > 0.8, "12 riffles look mixed");
// the cut keeps all cards and every pile has at least 8
for (let i = 0; i < 300; i++) { const p = E.cutPiles(d, rng); if (p.some((x) => x.length < 8) || p.flat().length !== 78) { ok(false, "cut piles"); break; } }
ok(E.isDeck(E.restack(E.cutPiles(d, rng), [2, 0, 1])), "restack keeps the deck");
// gathering puts the spread back on top, position 10 first
const g = E.gather(d.slice(0, 10), d.slice(10));
ok(E.isDeck(g) && g[0].id === d[9].id && g[9].id === d[0].id, "gather order");

// ---- astronomy and numerology ----
const lon = E.sunLongitude(new Date(Date.UTC(2026, 2, 20, 14, 46))); // March equinox 2026 ≈ 14:46 UT
ok(Math.min(lon, 360 - lon) < 0.05, `Sun at the March equinox ≈ 0° (got ${lon.toFixed(3)})`);
ok(E.signOf(E.sunLongitude(new Date(1985, 6, 15, 12))) === 3, "15 Jul 1985 is Cancer");
ok(E.lifePath(1985, 7, 15) === 9 && E.lifePath(1980, 11, 29) === 4, "life path numbers");
const bc = E.birthCards(1985, 7, 15);
ok(bc.personality === 9 && bc.soul === 9, "Greer birth cards 1985-07-15 → Hermit");
const bc2 = E.birthCards(1966, 2, 10); // 10 + 2 + 1966 = 1978 → 25 → 7
ok(bc2.personality === 7, "Greer birth cards 1966-02-10 → Chariot");
ok(Math.abs(E.hyperTail(0, 78, 22, 10) - 1) < 1e-12 && E.hyperTail(5, 78, 22, 10) > 0.05 && E.hyperTail(5, 78, 22, 10) < 0.15, "hypergeometric tail");
const w = E.sunWindow(byName("Two of Cups").span, new Date(2026, 9, 26));
ok(w.from.getMonth() === 5 && w.from.getDate() >= 20 && w.from.getDate() <= 22 && !w.now, "Two of Cups window starts ~21 June");

// ---- question classifier ----
const cl = (q) => E.classify(q);
ok(cl("แต่งงานปีนี้ไหม").topic === "love" && cl("แต่งงานปีนี้ไหม").yesno, "แต่งงาน is love, not งาน");
ok(cl("รักษาโรคนี้จะหายไหม").topic === "health", "รักษา is health, not รัก");
ok(cl("ควรลงทุนหุ้นตัวนี้ดีไหม").topic === "money" && cl("ควรลงทุนหุ้นตัวนี้ดีไหม").should, "money + should");
ok(cl("จะได้เลื่อนตำแหน่งเมื่อไหร่").topic === "work" && cl("จะได้เลื่อนตำแหน่งเมื่อไหร่").when && !cl("จะได้เลื่อนตำแหน่งเมื่อไหร่").yesno, "work + when, not yes/no");
ok(cl("Will I get the job?").topic === "work" && cl("Will I get the job?").yesno, "English yes/no work");
ok(cl("What should I focus on in life?").topic === "general", "general question");

// ---- readings ----
const bad = /undefined|NaN|\[object|null/;
let readings = 0;
for (let i = 0; i < 400; i++) {
  let dk = E.freshDeck();
  for (let k = 0; k < 10; k++) dk = E.riffle(dk, rng, { reversals: true }).deck;
  dk = E.wash(dk, rng, 20).deck;
  const spread = dk.slice(0, 10);
  for (const lang of ["th", "en"]) {
    const q = lang === "th" ? ["ความรักจะไปต่อได้ไหม", "งานใหม่จะดีไหม", "การเงินปีหน้า", "สุขภาพแม่", "ชีวิตช่วงนี้"][i % 5] : ["Will we get back together?", "When will I find a job?", "Should I invest?", "", "My health"][i % 5];
    const rep = E.analyze(spread, { lang, question: q, birth: i % 2 ? "1990-03-21" : "", reversals: i % 3 !== 0, today: new Date(2026, 9, 26) });
    const text = JSON.stringify(rep) + E.toText(rep, spread);
    readings++;
    const plain = text.replace(/:null\b/g, ":0");
    if (bad.test(plain)) { ok(false, `reading ${i} ${lang} contains undefined/NaN: ${plain.match(bad)[0]} …${plain.slice(plain.search(bad) - 80, plain.search(bad) + 20)}`); break; }
    if (lang === "en" && THAI.test(text.replace(/"(heb|hebName)":"[^"]*"/g, ""))) { ok(false, `English reading ${i} contains Thai`); break; }
    ok(rep.positions.length === 10 && rep.axes.length === 6 && rep.timing.lines.length >= 1 && rep.advice.length >= 2, `reading ${i} ${lang} complete`);
    ok(rep.verdict.yn >= -1 && rep.verdict.yn <= 1 && rep.quint.n >= 0 && rep.quint.n <= 21, `reading ${i} ${lang} ranges`);
  }
}
console.log(`${checks - fails}/${checks} checks passed (${readings} readings)`);
if (fails) process.exit(1);
