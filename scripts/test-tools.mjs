// Checks for the calculators in /tools/ and /en/tools/:  node build.mjs && node scripts/test-tools.mjs
// 1. engine (assets/mt-core.js): derivatives vs finite differences, antiderivatives differentiated back, Laplace vs the defining integral
// 2. Thai tariff (assets/thai-tariff.js): the worked examples printed on the pages
// 3. pages: TH ⇄ EN pairing, hreflang, canonical, JSON-LD, sitemap, llms.txt, internal links, no Thai text in the English pages
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import os from "node:os";
const ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mt-"));
for (const f of ["mt-core", "thai-tariff"]) fs.copyFileSync(path.join(ROOT, "assets", f + ".js"), path.join(tmp, f + ".cjs"));
const require = createRequire(import.meta.url);
const MT = require(path.join(tmp, "mt-core.cjs")), TT = require(path.join(tmp, "thai-tariff.cjs"));
let fail = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fail++; console.error("FAIL", msg); } };
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

for (const s of ["x^3*sin(2x)", "e^(-x^2)", "ln(x^2+1)/x", "atan(x)", "sqrt(1-x^2)", "x^x", "(x^2+1)/(x-1)", "sinh(x)cos(x)", "sec(x)^2", "tan(3x)", "ln(sin(x))", "2^x", "x e^x sin(x)", "(3x+2)^5", "asin(x/2)", "cot(x)csc(x)", "sqrt(x)+1/sqrt(x)", "log(x)", "tan^-1(2x)"]) {
  const f = MT.parse(s); ok(MT.checkDeriv(f, MT.diff(f, "x"), "x"), "derivative " + s);
}
for (const s of ["x^2*e^(3x)", "sin(x)^2", "1/(x^2+4)", "x*cos(x)", "ln(x)", "1/(x^2-1)", "sqrt(1-x^2)", "e^x*sin(x)", "x/(x^2+1)", "tan(x)", "1/sqrt(x^2+1)", "sec(x)", "(2x+3)/(x^2+3x+2)", "x^2/(x+1)", "e^(-x^2)", "cos(x)^3", "x*sqrt(x+1)", "x*e^(x^2)", "sin(x)cos(x)", "1/(x^2+2x+5)", "(x+3)/((x+1)(x+2)^2)", "x^3/(x^2+1)", "ln(x)/x", "x^2 ln(x)", "sin(3x)cos(2x)", "1/(x(x^2+1))", "e^(2x)cos(3x)", "x atan(x)", "1/(x^3+1)", "(3x+1)^4", "x^2 sin(x)", "e^x/(1+e^x)", "sqrt(x^2+9)", "x^2/(x^2+1)^2"]) {
  const f = MT.parse(s), F = MT.integrate(f, "x"); ok(F && MT.checkDeriv(F, f, "x"), "integral " + s);
}
ok(near(MT.quad(Math.sin, 0, Math.PI).v, 2, 1e-12), "quad sin");
for (const [s, want] of [["t^2", "\\frac{2}{s^{3}}"], ["e^(-2t)*sin(3t)", "\\frac{3}{\\left(s + 2\\right)^{2} + 9}"], ["t*cos(2t)", "\\frac{s^{2} - 4}{\\left(s^{2} + 4\\right)^{2}}"], ["cos(t)^2", "\\frac{s^{2} + 2}{s\\left(s^{2} + 4\\right)}"], ["(t-1)*u(t-1)", "\\frac{e^{-s}}{s^{2}}"],
  ["5+3t-2e^(-4t)", null], ["sin(2t)cos(3t)", null], ["t u(t-3)", null], ["sinh(2t)", null], ["t^2 sin(t)", null], ["t e^(-t) cos(2t)", null], ["sin(t+pi/4)", null], ["u(t)-u(t-1)", null]]) {
  const f = MT.parse(s, { step: true }), L = MT.laplace(f, "t"), s0 = Math.max(L.sigma, 0) + 1.7;
  if (want) ok(L.tex === want, `laplace ${s}: ${L.tex}`);
  ok(near(MT.laplaceNumeric(f, "t", s0, L.sigma), L.value({ re: s0, im: 0 }).re) && near(L.valueRational(s0), L.value({ re: s0, im: 0 }).re, 1e-8), "laplace check " + s);
}
const sq = MT.fourier([{ f: () => 1, a: 0, b: Math.PI }, { f: () => -1, a: Math.PI, b: 2 * Math.PI }], 2 * Math.PI, 9);
ok(MT.niceTex(sq.b[1]) === "\\frac{4}{\\pi}" && MT.niceTex(sq.b[3]) === "\\frac{4}{3\\pi}" && sq.b[2] === 0 && sq.odd && sq.half && near(sq.thd, 0.4834, 1e-3), "fourier square wave");

// tariff: examples printed on the pages
const b1 = TT.bill({ cat: "1.2", volt: "lv", units: 350 });
ok(near(b1.base, 1248.38, 1e-9) && b1.total.toFixed(2) === "1396.55", "bill 1.2, 350 units = " + b1.total.toFixed(2));
const b2 = TT.bill({ cat: "1.1", volt: "lv", units: 100 }); // 15×2.3488 + 10×2.9882 + 75×3 + 8.19
ok(near(b2.base, 15 * 2.3488 + 10 * 2.9882 + 75 * 3 + 8.19, 1e-9), "bill 1.1");
const b3 = TT.bill({ cat: "3.1", volt: "mv", units: 30000, kw: 100, kvar: 88.19 }); // PF: 88.19 − 61.97 = 26.22 → 26 kvar
ok(near(b3.pf, 26 * 56.07, 1e-9) && near(b3.base, 100 * 196.26 + 30000 * 3.1471 + 26 * 56.07 + 312.24, 1e-9), "bill 3.1 with PF charge");
const b4 = TT.bill({ cat: "4.1", volt: "lv", units: 1000, kwPeak: 1000, kwPartial: 1200 });
ok(near(b4.demand, 1000 * 332.71 + 200 * 68.22, 1e-9), "bill 4.1 TOD");
ok(TT.bill({ cat: "1.1", volt: "lv", units: 40, free: true }).total === 0, "free units");
for (const c of TT.cats) for (const v of ["hv", "mv", "lv"]) if (c[v]) ok(isFinite(TT.bill({ cat: c.id, volt: v, units: 500, on: 200, off: 300, kw: 50, kwPeak: 50, kwPartial: 60 }).total), `bill ${c.id} ${v}`);

// pages
const SLUGS = ["", "latex-equation-editor", "laplace-transform-calculator", "inverse-laplace-transform-calculator", "fourier-series-calculator", "derivative-calculator", "integral-calculator", "area-calculator", "power-factor-calculator", "electricity-bill-calculator"];
const SITE = "https://modsengineeringmath.com", sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8"), llms = fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8");
const exists = (href) => { const p = href.split(/[?#]/)[0]; if (!p.startsWith("/")) return true; return fs.existsSync(path.join(ROOT, p, p.endsWith("/") ? "index.html" : "")); };
for (const lang of ["th", "en"]) for (const s of SLUGS) {
  const route = (lang === "en" ? "/en/tools/" : "/tools/") + (s ? s + "/" : ""), twin = (lang === "en" ? "/tools/" : "/en/tools/") + (s ? s + "/" : "");
  const file = path.join(ROOT, route, "index.html");
  if (!fs.existsSync(file)) { ok(false, "missing " + route); continue; }
  const h = fs.readFileSync(file, "utf8"), title = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || "", desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  ok(h.includes(`<html lang="${lang}">`), route + " lang");
  ok(h.includes(`<link rel="canonical" href="${SITE}${route}">`), route + " canonical");
  ok(h.includes(`hreflang="${lang === "en" ? "th" : "en"}" href="${SITE}${twin}"`) && h.includes(`hreflang="x-default" href="${SITE}${lang === "th" ? route : twin}"`), route + " hreflang");
  ok((h.match(/<h1[\s>]/g) || []).length === 1, route + " one h1");
  ok(title.length >= 30 && desc.length >= 110 && desc.length <= 330, `${route} title ${title.length} / description ${desc.length}`);
  ok(/<meta name="keywords"/.test(h) && /application\/ld\+json/.test(h) && /BreadcrumbList/.test(h), route + " keywords + JSON-LD");
  if (s) ok(/"WebApplication"/.test(h) && /"FAQPage"/.test(h) && h.includes('class="mt-tool"') && h.includes("/assets/mt-ui.js"), route + " app schema + widget");
  ok(!/katex-error|ParseError/.test(h), route + " KaTeX");
  ok(sitemap.includes(`<loc>${SITE}${route}</loc>`) && llms.includes(SITE + route), route + " in sitemap + llms.txt");
  ok(fs.existsSync(path.join(ROOT, route, "index.html.md")), route + " markdown copy");
  for (const m of h.matchAll(/href="(\/[^"]*)"/g)) if (!/^\/(assets|images|feed\.xml|site\.webmanifest|favicon|apple|android)/.test(m[1])) ok(exists(m[1]), `${route} broken link ${m[1]}`);
  if (lang === "en") { const main = h.slice(h.indexOf("<main"), h.indexOf("</main>")).replace(/<nav class="lang-sw"[\s\S]*?<\/nav>/, ""); ok(!/[\u0E01-\u0E3A\u0E40-\u0E7F]/.test(main), route + " Thai text in the English page: " + (main.match(/[^<>]{0,30}[\u0E01-\u0E3A\u0E40-\u0E7F]+[^<>]{0,20}/) || [""])[0]); }
}
console.log(fail ? `${fail} of ${n} checks FAILED` : `all ${n} checks passed`);
process.exit(fail ? 1 : 0);
