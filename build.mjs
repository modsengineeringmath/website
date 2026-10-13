// Build script for modsengineeringmath.com
// Usage: npm install && node build.mjs
// Reads src/layout.html + src/pages/**.html, writes finished pages into the repo root
// (index.html, about/index.html, learn/index.html, learn/<topic>/index.html),
// plus sitemap.xml and llms.txt. Math written as \( ... \) or \[ ... \] is pre-rendered with KaTeX.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import katex from "katex";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE = "https://modsengineeringmath.com";
const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
// KaTeX stylesheet + woff2 fonts are self-hosted under /assets/katex/ (copied from node_modules)
const KATEX_SRC = path.join(ROOT, "node_modules/katex/dist");
const KATEX_DST = path.join(ROOT, "assets/katex");
fs.mkdirSync(path.join(KATEX_DST, "fonts"), { recursive: true });
fs.copyFileSync(path.join(KATEX_SRC, "katex.min.css"), path.join(KATEX_DST, "katex.min.css"));
for (const f of fs.readdirSync(path.join(KATEX_SRC, "fonts")).filter((f) => f.endsWith(".woff2")))
  fs.copyFileSync(path.join(KATEX_SRC, "fonts", f), path.join(KATEX_DST, "fonts", f));
const KATEX_CSS = `/assets/katex/katex.min.css?v=${katex.version}`;
// Browser-side libraries for the lesson editor, self-hosted under /assets/vendor/
const VENDOR_DST = path.join(ROOT, "assets/vendor");
fs.mkdirSync(VENDOR_DST, { recursive: true });
for (const [src, name] of [
  ["katex/dist/katex.min.js", "katex.min.js"],
  ["katex/dist/contrib/auto-render.min.js", "katex-auto-render.min.js"],
  ["marked/marked.min.js", "marked.min.js"],
  ["dompurify/dist/purify.min.js", "purify.min.js"],
]) fs.copyFileSync(path.join(ROOT, "node_modules", src), path.join(VENDOR_DST, name));
const PERSON_ID = `${SITE}/#mod`;
import crypto from "node:crypto";
const ASSET_V = crypto.createHash("sha1").update(
  fs.readdirSync(path.join(ROOT, "assets")).filter((f) => fs.statSync(path.join(ROOT, "assets", f)).isFile()).sort().map((f) => fs.readFileSync(path.join(ROOT, "assets", f))).join("")
).digest("hex").slice(0, 8);

// ---------------------------------------------------------------------------
// Topics in the knowledge library, in reading order.
// To add a topic: add an entry here and a page at src/pages/learn/<slug>.html
// ---------------------------------------------------------------------------
export const TOPICS = [
  {
    slug: "trigonometry",
    title: "สูตรตรีโกณมิติและตารางค่า",
    en: "Trigonometric Identities & Table",
    sym: "θ",
    summary: "วงกลมหนึ่งหน่วยแบบโต้ตอบ สูตรครบทุกหมวดพร้อมชื่ออังกฤษ และตาราง sin cos tan ทุก 0.05° ตั้งแต่ 0° ถึง 90° ทั้งองศาและเรเดียน",
  },
  {
    slug: "calculus-basics",
    title: "แคลคูลัสเบื้องต้น",
    en: "Basic Calculus",
    sym: "f′",
    summary: "ลิมิต อนุพันธ์ และปริพันธ์ พร้อมตัวอย่างกระแสในตัวเก็บประจุและค่า RMS",
  },
  {
    slug: "integral-calculus",
    title: "อินทิกรัล: สูตรและวิธีทำ",
    en: "Integral Calculus",
    sym: "∫",
    summary: "สูตรอินทิเกรตพร้อมชื่อสากล คุณสมบัติ สูตรสำเร็จ และวิธีทำทีละขั้น: เปลี่ยนตัวแปร u หารยาว เศษส่วนย่อย ทีละส่วน และอินทิกรัลจำกัดเขต",
  },
  {
    slug: "vector-algebra",
    title: "พีชคณิตของเวกเตอร์",
    en: "Vector Algebra",
    sym: "→",
    summary: "ผลคูณจุด ผลคูณไขว้ และแรงที่กระทำต่อตัวนำในสนามแม่เหล็ก",
  },
  {
    // A series: hub page at src/pages/learn/linear-algebra/index.html, sub-pages at src/pages/learn/linear-algebra/<sub>.html
    slug: "linear-algebra",
    title: "พีชคณิตเชิงเส้น",
    en: "Linear Algebra",
    sym: "⊞",
    summary: "เมทริกซ์ ดีเทอร์มิแนนต์ ระบบสมการ อินเวอร์ส กฎของคราเมอร์ ค่าเฉพาะและเวกเตอร์เฉพาะ พร้อมโจทย์วงจรไฟฟ้า ตั้งแต่ ม.ปลาย ถึง ป.โท",
    playlist: "PLAJhR5azwWpJkUHNvACZSpBG2C7l7VJTO",
    sub: [
      { slug: "matrices", short: "เมทริกซ์", title: "เมทริกซ์และการดำเนินการ", en: "Matrices & Matrix Operations", sym: "[ ]", prefix: "M",
        summary: "ชนิดของเมทริกซ์ บวก ลบ คูณ ทรานสโพส เทรซ กำลัง และเมทริกซ์บล็อก พร้อมตัวช่วยดูการคูณทีละช่อง" },
      { slug: "determinants", short: "ดีเทอร์มิแนนต์", title: "ดีเทอร์มิแนนต์", en: "Determinants", sym: "|A|", prefix: "D",
        summary: "2×2 ซาร์รัส ไมเนอร์ โคแฟกเตอร์ กระจายลาปลาซ สมบัติตามการดำเนินการแถว ความหมายเชิงพื้นที่ และวิธีลดแถว" },
      { slug: "linear-systems", short: "ระบบสมการ", title: "ระบบสมการเชิงเส้นและการกำจัดแบบเกาส์", en: "Systems of Linear Equations", sym: "Ax=b", prefix: "L",
        summary: "เมทริกซ์แต่งเติม การดำเนินการแถว เกาส์ เกาส์-จอร์แดน ลำดับชั้น (rank) คำตอบเดียว ไม่มีคำตอบ อนันต์ LU และกำลังสองน้อยสุด" },
      { slug: "inverse", short: "อินเวอร์ส", title: "อินเวอร์สของเมทริกซ์", en: "Matrix Inverse", sym: "A⁻¹", prefix: "I",
        summary: "สูตร 2×2 วิธีแอดจอยต์ วิธีเกาส์-จอร์แดน [A | I] สมบัติ ทฤษฎีบทเมทริกซ์หาอินเวอร์สได้ และการแก้ x = A⁻¹b" },
      { slug: "cramers-rule", short: "คราเมอร์", title: "กฎของคราเมอร์", en: "Cramer's Rule", sym: "Δᵢ/Δ", prefix: "C",
        summary: "แก้ระบบสมการทีละตัวแปรด้วยดีเทอร์มิแนนต์ 2×2 และ 3×3 กรณี Δ = 0 จำนวนเชิงซ้อน และตัวแปร s" },
      { slug: "eigenvalues", short: "ค่าเฉพาะ λ", title: "ค่าเฉพาะและเวกเตอร์เฉพาะ", en: "Eigenvalues & Eigenvectors", sym: "λ", prefix: "E",
        summary: "สมการลักษณะเฉพาะ ค่าซ้ำ ค่าเชิงซ้อน การทำให้เป็นเมทริกซ์ทแยงมุม เมทริกซ์สมมาตร เคย์ลีย์-แฮมิลตัน และเมทริกซ์เอกซ์โพเนนเชียล" },
      { slug: "ee-applications", short: "งานไฟฟ้า", title: "ประยุกต์ในวิศวกรรมไฟฟ้า", en: "Applications in Electrical Engineering", sym: "Ω", prefix: "A",
        summary: "เมช โนด แหล่งจ่ายไม่อิสระ เฟเซอร์ AC ฟังก์ชันถ่ายโอน ปริภูมิสถานะ RLC สองพอร์ต องค์ประกอบสมมาตร และ Y-bus" },
    ],
  },
  {
    slug: "laplace-transform",
    title: "การแปลงลาปลาซ",
    en: "Laplace Transform",
    sym: "ℒ",
    summary: "นิยาม ตาราง เศษส่วนย่อย และการแก้วงจร RC ใน s-domain",
    playlist: "PLAJhR5azwWpLgWalcHsCEE8q_bPJv0Eaa",
  },
  {
    slug: "first-order-system",
    title: "ระบบอันดับหนึ่ง",
    en: "First-Order System · Lab",
    sym: "τ",
    summary: "แล็บโต้ตอบ: ปรับค่าคงตัวเวลา τ หรือ R, C, L แล้วดูผลตอบสนอง สเกลลอการิทึม ระนาบ s และ Bode พร้อมเส้นช่วยวิเคราะห์",
  },
  {
    slug: "second-order-system",
    title: "ระบบอันดับสอง",
    en: "Second-Order System · Lab",
    sym: "ζ",
    summary: "แล็บโต้ตอบ: ζ กำหนดรูปร่าง ωn กำหนดความเร็ว ลากขั้วบนระนาบ s แล้วดูผลตอบสนองเวลา เปลือก %OS และ Bode เปลี่ยนพร้อมกัน",
  },
  {
    slug: "signals",
    title: "สัญญาณเบื้องต้น",
    en: "Signals · Lab",
    sym: "∿",
    summary: "แล็บโต้ตอบ: พิมพ์สมการสัญญาณเอง ทั้ง x(t) และ x[n] ดูอนุพันธ์ ส่วนคู่คี่ พลังงาน สเปกตรัม การแปลงเวลา และคอนโวลูชัน",
  },
  {
    // A series with a full virtual bench: hub at src/pages/learn/function-generator/index.html
    slug: "function-generator",
    title: "แล็บเครื่องกำเนิดสัญญาณและออสซิลโลสโคป",
    en: "Function Generator & Oscilloscope Lab",
    sym: "Hz",
    summary: "แล็บจำลองเสมือนจริง: เครื่องกำเนิดสัญญาณคู่กับออสซิลโลสโคป 2 ช่อง ปรับได้ทุกปุ่ม พร้อมทฤษฎี Vpp Vrms ทริกเกอร์ โพรบ การวัดเฟส Bode วงจร RC RLC ไดโอด ออปแอมป์ และการสร้างเครื่องเอง ตั้งแต่ ม.ปลาย ถึง ป.โท",
    fxHint: "พิมพ์ เช่น vrms, duty, 50, trigger, probe, rise, phase, Q, slew, 555",
    sub: [
      { slug: "waveforms", short: "อ่านค่าสัญญาณ", title: "สัญญาณพื้นฐานและการอ่านค่า: Vp Vpp Vrms ความถี่ ดิวตี้ และเฟส", en: "Waveforms & Their Values", sym: "Vpp", prefix: "W",
        summary: "ไซน์ สี่เหลี่ยม สามเหลี่ยม พัลส์ ค่ายอด ยอดถึงยอด RMS ค่าเฉลี่ย ออฟเซต DC คาบ ความถี่ ดิวตี้ เฟส และเดซิเบล พร้อมตารางสูตร RMS ทุกรูปคลื่น" },
      { slug: "generator", short: "เครื่องกำเนิดสัญญาณ", title: "เครื่องกำเนิดสัญญาณ (Function Generator): ปุ่ม เอาต์พุต 50 Ω มอดูเลชัน และ DDS", en: "The Function Generator", sym: "∿", prefix: "V",
        summary: "ทุกปุ่มบนแผงหน้า ความต้านทานขาออก 50 Ω โหลด High-Z กับ 50 Ω ขีดจำกัดแอมพลิจูด AM FM PWM Sweep Burst Sync และหลักการ DDS" },
      { slug: "oscilloscope", short: "ออสซิลโลสโคป", title: "ออสซิลโลสโคป: V/div Time/div ทริกเกอร์ โพรบ และแบนด์วิดท์", en: "The Oscilloscope", sym: "V/t", prefix: "O",
        summary: "อ่านกราติคูล ตั้งทริกเกอร์ให้ภาพนิ่ง โพรบ 1× 10× การชดเชยโพรบ คัปปลิง AC DC แบนด์วิดท์ เวลาขาขึ้น อัตราสุ่ม อเลียสซิง FFT และความปลอดภัยเรื่องกราวด์" },
      { slug: "simulator", short: "แล็บจำลอง", title: "แล็บจำลองเครื่องกำเนิดสัญญาณ + ออสซิลโลสโคป เสมือนจริง", en: "FG + Oscilloscope Simulator", sym: "▶",
        summary: "โต๊ะแล็บเสมือนจริง: เครื่องกำเนิดสัญญาณ บอร์ดวงจร 15 แบบ และสโคป 2 ช่อง ปุ่มหมุนครบ วัดอัตโนมัติ เคอร์เซอร์ XY FFT พร้อมใบงาน 16 การทดลอง" },
      { slug: "measurements", short: "เทคนิคการวัด", title: "เทคนิคการวัด: แอมพลิจูด ความถี่ เฟส ลิสซาจู และผลตอบสนองความถี่ (Bode)", en: "Measurement Techniques", sym: "φ", prefix: "B",
        summary: "วัดจากกราติคูลและเคอร์เซอร์ ความคลาดเคลื่อน วัดเฟสจาก Δt และวงรีลิสซาจู วัด Bode ทีละความถี่ กวาดความถี่ และวัดอิมพีแดนซ์" },
      { slug: "rc-rlc", short: "RC · RLC", title: "วงจร RC RL RLC กับคลื่นสี่เหลี่ยมและไซน์", en: "RC, RL & RLC on the Bench", sym: "τ", prefix: "R",
        summary: "หา τ จากกราฟ ความถี่ตัด −3 dB เฟส −45° อินทิเกรเตอร์และดิฟเฟอเรนชิเอเตอร์แบบพาสซีฟ เรโซแนนซ์ Q แบนด์วิดท์ และการแกว่งเมื่อป้อนคลื่นสี่เหลี่ยม" },
      { slug: "op-amp", short: "ออปแอมป์", title: "ออปแอมป์บนโต๊ะแล็บ: ขยาย อินทิเกรต ดิฟเฟอเรนชิเอต คอมพาเรเตอร์ และชมิตต์ทริกเกอร์", en: "Op-Amp Lab", sym: "▷", prefix: "U",
        summary: "เกนกลับเฟสและไม่กลับเฟส GBW สลูว์เรต แบนด์วิดท์กำลังเต็ม การอิ่มตัว อินทิเกรเตอร์ ดิฟเฟอเรนชิเอเตอร์ คอมพาเรเตอร์ และฮิสเทอรีซิสของชมิตต์ทริกเกอร์" },
      { slug: "build", short: "สร้างเครื่องเอง", title: "สร้างเครื่องกำเนิดสัญญาณเอง: 555 ออสซิลเลเตอร์ Wien และ DDS AD9833", en: "Build Your Own Signal Generator", sym: "555", prefix: "K",
        summary: "ออสซิลเลเตอร์ผ่อนคลายด้วยออปแอมป์ ไอซี 555 วงจร Wien bridge XR2206 DAC R-2R และ DDS AD9833 กับ Arduino/ESP32 พร้อมภาคขาออกและสโคปทำเอง" },
      { slug: "applications", short: "งานประยุกต์", title: "งานประยุกต์และโจทย์ที่เจอเสมอ: เรกติไฟเออร์ PWM คลิปเปอร์ และการวัด L C", en: "Engineering Applications", sym: "Σ", prefix: "X",
        summary: "รูปแบบงานจริงที่เจอบ่อย: แรงดันริปเปิล PWM กับค่าเฉลี่ย คลิปเปอร์ แคลมเปอร์ หา C และ L จากการวัด ความต้านทานขาออก ทดสอบเครื่องขยายเสียง และสัญญาณเซนเซอร์" },
    ],
  },
  {
    // A large series grouped into parts. A sub-page is "live" only when src/pages/learn/control-systems/<slug>.html exists;
    // the others show as "เร็วๆ นี้" on the hub and are skipped by prev/next, sitemap and llms.txt.
    slug: "control-systems",
    title: "ระบบควบคุม (Control Systems Engineering)",
    en: "Control Systems Engineering",
    sym: "G(s)",
    summary: "วิศวกรรมระบบควบคุมจากพื้นฐานถึงขั้นสูง: ป้อนกลับ แบบจำลอง เสถียรภาพ Routh–Hurwitz รูทโลคัสแบบวาดด้วยมือ ตอบสนองความถี่ Bode Nyquist ตัวชดเชย P PI PD PID ปริภูมิสถานะ ดิจิทัล ไปจนถึงเมคาทรอนิกส์ โรโบติกส์ และตัวแปลงกำลัง",
    playlist: "PLAJhR5azwWpK04F2C2Vp6h3v82Wvqn9ka",
    fxHint: "พิมพ์ เช่น routh, root locus, asymptote, breakaway, bode, phase margin, nyquist, PID, lead, ziegler",
    parts: [
      { id: "foundations", n: 1, title: "ภาพรวมและแบบจำลอง", en: "Foundations & Modeling", blurb: "เริ่มจากวงจรไฟฟ้าที่เรารู้จัก แล้วมองมันเป็นระบบที่มีอินพุต เอาต์พุต และป้อนกลับ" },
      { id: "performance", n: 2, title: "สมรรถนะของระบบ", en: "Performance", blurb: "ระบบดีหรือไม่ดี วัดจากอะไร: ความเร็ว overshoot และความแม่นยำ" },
      { id: "stability", n: 3, title: "เสถียรภาพ", en: "Stability", blurb: "คำถามแรกของวิศวกรควบคุม: ระบบนี้เสถียรไหม และเสถียรได้ถึงเกนเท่าไร" },
      { id: "root-locus", n: 4, title: "รูทโลคัส", en: "Root Locus", blurb: "ดูว่าขั้วเคลื่อนอย่างไรเมื่อปรับเกน วาดด้วยมือให้ได้ก่อนเปิดโปรแกรม" },
      { id: "frequency", n: 5, title: "ตอบสนองความถี่", en: "Frequency Response", blurb: "มองระบบผ่านไซน์: Bode, margin และ Nyquist ภาษาที่วิศวกรทั่วโลกใช้" },
      { id: "design", n: 6, title: "ออกแบบตัวควบคุม", en: "Compensator & PID Design", blurb: "นำทุกเครื่องมือมาออกแบบ lead lag และ PID ให้ได้ตามสเปก" },
      { id: "modern", n: 7, title: "ระบบควบคุมสมัยใหม่", en: "Modern Control", blurb: "ปริภูมิสถานะ ต่อยอดจากพีชคณิตเชิงเส้น: วางขั้ว ตัวสังเกต LQR" },
      { id: "advanced", n: 8, title: "ดิจิทัลและขั้นสูง", en: "Digital & Advanced", blurb: "เมื่อตัวควบคุมคือไมโครคอนโทรลเลอร์ และเมื่อโลกไม่เป็นเชิงเส้น" },
      { id: "applications", n: 9, title: "งานประยุกต์", en: "Mechatronics, Robotics & Power Electronics", blurb: "ทฤษฎีลงสนามจริง: มอเตอร์ หุ่นยนต์ และตัวแปลงกำลัง ทางไปสู่อิเล็กทรอนิกส์กำลัง" },
    ],
    sub: [
      { slug: "introduction", part: "foundations", short: "ภาพรวมป้อนกลับ", title: "ระบบควบคุมคืออะไร: วงเปิด วงปิด และการป้อนกลับ", en: "What Is a Control System?", sym: "⟲", prefix: "F",
        summary: "ระบบควบคุมอัตโนมัติทำงานอย่างไร เปรียบเทียบวงเปิดกับวงปิด ป้อนกลับลดความผิดพลาดและต้านการรบกวนได้อย่างไร เป้าหมายการออกแบบ และตัวอย่างระบบจริงจากไฟฟ้า เมคาทรอนิกส์ โรโบติกส์ ถึงอิเล็กทรอนิกส์กำลัง" },
      { slug: "modeling", part: "foundations", short: "แบบจำลอง", title: "แบบจำลองทางคณิตศาสตร์: วงจรไฟฟ้า มอเตอร์ กลไก ความร้อน", en: "Mathematical Modeling", sym: "G(s)", prefix: "M",
        summary: "จากกฎฟิสิกส์สู่ฟังก์ชันถ่ายโอน วงจร RLC ออปแอมป์ มอเตอร์ไฟฟ้ากระแสตรง มวล-สปริง-ดัมเปอร์ ระบบหมุน ความร้อน ของไหล ความคล้ายเชิงอุปมาไฟฟ้า-กล และการทำให้เป็นเชิงเส้น" },
      { slug: "block-diagrams", part: "foundations", short: "บล็อกไดอะแกรม", title: "บล็อกไดอะแกรม แผนภาพสัญญาณ และฟังก์ชันถ่ายโอนวงปิด", en: "Block Diagrams & Signal-Flow Graphs", sym: "▭→▭", prefix: "B",
        summary: "การลดรูปบล็อกแบบอนุกรม ขนาน และป้อนกลับ ย้ายจุดรวมสัญญาณและจุดแยก กฎของเมสัน ฟังก์ชันถ่ายโอนวงปิด ความผิดพลาด และสัญญาณรบกวน" },
      { slug: "time-response", part: "performance", short: "ตอบสนองเวลา", title: "ผลตอบสนองเวลา: ขั้ว ศูนย์ และสเปกการออกแบบ", en: "Time Response & Specifications", sym: "y(t)", prefix: "T",
        summary: "ผลตอบสนองต่อขั้นบันไดของระบบอันดับหนึ่ง สอง และสูงกว่า ขั้วเด่น ผลของศูนย์และขั้วเพิ่ม เวลาขึ้น overshoot เวลาเข้าที่ และความสัมพันธ์กับตำแหน่งบนระนาบ s" },
      { slug: "steady-state-error", part: "performance", short: "ความผิดพลาดอยู่ตัว", title: "ความผิดพลาดสถานะอยู่ตัว ชนิดของระบบ และความไว", en: "Steady-State Error & System Type", sym: "e∞", prefix: "E",
        summary: "ทฤษฎีบทค่าสุดท้าย ชนิดของระบบ (type 0, 1, 2) ค่าคงตัวความผิดพลาด Kp Kv Ka ความผิดพลาดจากการรบกวน ความไว (sensitivity) และการยกชนิดด้วยอินทิเกรเตอร์" },
      { slug: "stability", part: "stability", short: "เสถียรภาพ", title: "เสถียรภาพของระบบควบคุม: ขั้วบนระนาบ s และเงื่อนไขเบื้องต้น", en: "Stability of Control Systems", sym: "Re s<0", prefix: "S",
        summary: "นิยามเสถียรภาพแบบ BIBO และเชิงอาการ ตำแหน่งขั้วบนระนาบ s เสถียรวิกฤต เงื่อนไขจำเป็นของสัมประสิทธิ์ ความไม่เสถียรจากการป้อนกลับ และเสถียรภาพสัมพัทธ์" },
      { slug: "routh-hurwitz", part: "stability", short: "เราท์–เฮอร์วิตซ์", title: "เกณฑ์เสถียรภาพของเราท์–เฮอร์วิตซ์ (Routh–Hurwitz Criterion)", en: "Routh–Hurwitz Stability Criterion", sym: "R", prefix: "R",
        summary: "สร้างตารางเราท์ทีละขั้น นับขั้วฝั่งขวา กรณีพิเศษ (ศูนย์ในคอลัมน์แรก แถวเป็นศูนย์) หาช่วงเกน K ที่เสถียร เกนวิกฤตและความถี่วิกฤต ε-method พหุนามช่วย เฮอร์วิตซ์ดีเทอร์มิแนนต์ และเสถียรภาพสัมพัทธ์" },
      { slug: "root-locus", part: "root-locus", short: "รูทโลคัส", title: "รูทโลคัส (Root Locus): นิยามและกฎการวาดทุกข้อ", en: "Root Locus: Definition & Sketching Rules", sym: "K→", prefix: "L",
        summary: "ขั้วของวงปิดเคลื่อนอย่างไรเมื่อเกน K เปลี่ยน เงื่อนไขมุมและขนาด กฎการวาดทุกข้อ: จุดเริ่ม-จบ เส้นกำกับ จุดแยก จุดตัดแกน jω มุมออก-เข้า พร้อมที่มาของแต่ละกฎ" },
      { slug: "root-locus-sketching", part: "root-locus", short: "วาดรูทโลคัส", title: "ฝึกวาดรูทโลคัสด้วยมือ: ทีละขั้น พร้อมตัวอย่างและแกลเลอรีรูปแบบ", en: "Sketching Root Loci by Hand", sym: "✎", prefix: "W",
        summary: "ตัวอย่างวาดด้วยมือทีละขั้นตั้งแต่ระบบง่ายถึงซับซ้อน ขั้วเชิงซ้อน ศูนย์ จุดแยกเชิงซ้อน ขั้วซ้ำ ผลของการเพิ่มศูนย์ (PD) แกลเลอรีรูปแบบมาตรฐาน และแล็บที่ตรวจคำตอบของกฎแต่ละข้อ ใช้แทน MATLAB" },
      { slug: "root-locus-design", part: "root-locus", short: "ออกแบบด้วยรูทโลคัส", title: "ออกแบบด้วยรูทโลคัส: เลือกเกน เพิ่มขั้วหรือศูนย์ และตัวชดเชย", en: "Design by Root Locus", sym: "ζ", prefix: "J",
        summary: "เลือก K จากสเปก ζ และ ωn ผลของการเพิ่มขั้วและศูนย์ต่อรูปร่างโลคัส ออกแบบ PD PI และ lead/lag ด้วยรูทโลคัส การหักล้างขั้ว-ศูนย์ รูทโลคัสเมื่อ K ติดลบ และรูทโลคัสของพารามิเตอร์อื่น" },
      { slug: "frequency-response", part: "frequency", short: "ตอบสนองความถี่", title: "ผลตอบสนองความถี่: G(jω) ขนาด เฟส และแบนด์วิดท์", en: "Frequency Response", sym: "G(jω)", prefix: "Q",
        summary: "ป้อนไซน์เข้าระบบเชิงเส้น ออกมาเป็นไซน์ที่ขนาดและเฟสเปลี่ยน ที่มาของ G(jω) ความถี่เรโซแนนซ์ ยอดเรโซแนนซ์ Mr แบนด์วิดท์ และความสัมพันธ์กับผลตอบสนองเวลาของระบบอันดับสอง" },
      { slug: "bode-plot", part: "frequency", short: "โบดไดอะแกรม", title: "โบดไดอะแกรม (Bode Plot): วาดด้วยมือทีละขั้น", en: "Bode Plot by Hand", sym: "dB", prefix: "D",
        summary: "เดซิเบล เดคาด การวาดขนาดและเฟสด้วยเส้นกำกับ ปัจจัยพื้นฐาน K sⁿ (1+τs) อันดับสอง และหน่วงเวลา ค่าแก้ที่จุดมุม ตัวอย่างหลายแบบ การหาฟังก์ชันถ่ายโอนจากกราฟ และแล็บโบดที่ตรวจคำตอบ" },
      { slug: "margins", part: "frequency", short: "เกนและเฟสมาร์จิน", title: "วิเคราะห์โบด: เกนมาร์จิน เฟสมาร์จิน และเสถียรภาพจากกราฟ", en: "Gain & Phase Margins", sym: "PM", prefix: "G",
        summary: "ความถี่ครอสโอเวอร์ เกนมาร์จิน เฟสมาร์จิน อ่านจากโบด ความสัมพันธ์ PM กับ ζ และ overshoot แบนด์วิดท์กับความเร็ว ระบบเสถียรแบบมีเงื่อนไข ผลของหน่วงเวลา และฟังก์ชันความไว S T" },
      { slug: "nyquist", part: "frequency", short: "ไนควิสต์", title: "เกณฑ์เสถียรภาพของไนควิสต์ (Nyquist Criterion)", en: "Nyquist Stability Criterion", sym: "−1", prefix: "N",
        summary: "ทฤษฎีบทอาร์กิวเมนต์ เส้นทางไนควิสต์ Z = N + P วาดกราฟขั้วทีละขั้น จัดการขั้วบนแกน jω ตัวอย่างเสถียร ไม่เสถียร และมีเงื่อนไข อ่านมาร์จิน และเปรียบเทียบกับโบด" },
      { slug: "compensators", part: "design", short: "Lead · Lag", title: "ตัวชดเชย Lead, Lag และ Lag-Lead: ออกแบบด้วยโบดและรูทโลคัส", en: "Lead, Lag & Lag-Lead Compensators", sym: "α", prefix: "C",
        summary: "ตัวชดเชยเลื่อนเฟส (lead) ลดความผิดพลาดอยู่ตัว (lag) และรวมสองแบบ สูตรเลือก α และ T ขั้นตอนออกแบบทีละขั้นด้วยโบดและรูทโลคัส วงจรออปแอมป์และ RC จริง และข้อควรระวัง" },
      { slug: "pid", part: "design", short: "P · PI · PD · PID", title: "ตัวควบคุม P, PI, PD และ PID: โครงสร้าง ผลของแต่ละเทอม และการออกแบบ", en: "P, PI, PD & PID Controllers", sym: "PID", prefix: "P",
        summary: "โครงสร้างขนาน อุดมคติ และอนุกรม ผลของเทอม P I D ต่อ rise time overshoot และความผิดพลาดอยู่ตัว ความเกี่ยวข้องกับ lead/lag ออกแบบ PID ด้วยรูทโลคัสและโบด พร้อมแล็บ PID แบบโต้ตอบ" },
      { slug: "pid-tuning", part: "design", short: "จูน PID", title: "การจูน PID: Ziegler–Nichols, Cohen–Coon, IMC และเรื่องที่ใช้งานจริง", en: "PID Tuning & Practical Issues", sym: "ZN", prefix: "Z",
        summary: "จูนจากกราฟตอบสนองขั้นบันได (reaction curve) และเกนวิกฤต (ultimate gain) Cohen–Coon, Lambda/IMC ฟิลเตอร์อนุพันธ์ anti-windup setpoint weighting ตัวควบคุม 2 องศาอิสระ และ relay auto-tune" },
      { slug: "state-space", part: "modern", short: "ปริภูมิสถานะ", title: "ปริภูมิสถานะ (State-Space): สมการสถานะ รูปแบบมาตรฐาน และ e^{At}", en: "State-Space Representation", sym: "ẋ=Ax", prefix: "X",
        summary: "ตัวแปรสถานะ สมการสถานะและสมการเอาต์พุต จากสมการเชิงอนุพันธ์ วงจร และฟังก์ชันถ่ายโอน รูปแบบมาตรฐานควบคุมได้ สังเกตได้ และโมดัล คำตอบ e^{At} ขั้วคือค่าเฉพาะ G(s) = C(sI − A)⁻¹B + D" },
      { slug: "controllability-observability", part: "modern", short: "ควบคุมได้ · สังเกตได้", title: "ความสามารถควบคุมได้และสังเกตได้ (Controllability & Observability)", en: "Controllability & Observability", sym: "𝒞", prefix: "O",
        summary: "นิยาม เมทริกซ์ควบคุมได้และสังเกตได้ ทดสอบแบบ Kalman และ PBH การแยกส่วนของ Kalman ความเกี่ยวข้องกับการหักล้างขั้ว-ศูนย์ และ realization ที่น้อยที่สุด" },
      { slug: "state-feedback", part: "modern", short: "ป้อนกลับสถานะ", title: "ป้อนกลับสถานะ: วางขั้ว ตัวสังเกต และ LQR", en: "State Feedback, Observers & LQR", sym: "u=−Kx", prefix: "V",
        summary: "การวางขั้ว (pole placement) สูตร Ackermann ตัวสังเกตสถานะ Luenberger หลักการแยกส่วน การติดตามสัญญาณอ้างอิงและอินทิเกรเตอร์ LQR สมการริคคาติเบื้องต้น และตัวกรองคาลมานโดยย่อ" },
      { slug: "digital-control", part: "advanced", short: "ควบคุมดิจิทัล", title: "ระบบควบคุมดิจิทัล: การสุ่ม z-transform และ PID ดิจิทัล", en: "Digital Control", sym: "z", prefix: "Y",
        summary: "การสุ่มและ ZOH, aliasing, การแปลง z, ฟังก์ชันถ่ายโอนแบบไม่ต่อเนื่อง เสถียรภาพบนวงกลมหนึ่งหน่วย (Jury) การแปลงตัวควบคุม (Euler, Tustin) PID ดิจิทัล และการเลือกความถี่สุ่ม" },
      { slug: "nonlinear-robust", part: "advanced", short: "ไม่เชิงเส้น · ทนทาน", title: "ระบบไม่เชิงเส้นและการควบคุมแบบทนทาน", en: "Nonlinear & Robust Control", sym: "NL", prefix: "U",
        summary: "การอิ่มตัว dead-zone backlash ฟังก์ชันพรรณนา (describing function) ลิมิตไซเคิล ระนาบเฟส เสถียรภาพแบบลียาปูนอฟ sliding mode ความไม่แน่นอนของแบบจำลอง ความทนทาน และแนวคิด H∞" },
      { slug: "mechatronics", part: "applications", short: "เมคาทรอนิกส์", title: "ระบบควบคุมเมคาทรอนิกส์: เซนเซอร์ แอคชูเอเตอร์ เซอร์โว และคาสเคด", en: "Mechatronic Systems Control", sym: "M", prefix: "K",
        summary: "มอเตอร์ DC เซนเซอร์ (เอนโค้ดเดอร์ โพเทนชิโอมิเตอร์ IMU) ไดรเวอร์และ PWM ลูปกระแส-ความเร็ว-ตำแหน่งแบบคาสเคด เซอร์โวตำแหน่ง ชุดเกียร์ ความฝืด backlash และตัวอย่างจริง" },
      { slug: "robotics", part: "applications", short: "โรโบติกส์", title: "ระบบควบคุมโรโบติกส์: แขนกล หุ่นยนต์เคลื่อนที่ และการควบคุมข้อต่อ", en: "Robotics & Robot Control", sym: "θ", prefix: "A",
        summary: "จลนศาสตร์ตรงและผกผัน จาโคเบียน พลศาสตร์แขนกล (Euler–Lagrange) ควบคุมข้อต่อแบบ PD/PID ชดเชยแรงโน้มถ่วง computed torque การสร้างวิถี หุ่นยนต์ล้อ differential drive และการติดตามเส้นทาง" },
      { slug: "power-electronics-control", part: "applications", short: "สะพานสู่อิเล็กทรอนิกส์กำลัง", title: "ควบคุมตัวแปลงกำลัง: จากฟังก์ชันถ่ายโอนบั๊กคอนเวอร์เตอร์ ถึงตัวชดเชย Type II/III", en: "Control of Power Converters", sym: "DC", prefix: "H",
        summary: "แบบจำลองสัญญาณเล็กของบั๊กคอนเวอร์เตอร์ Gvd(s) โหมดแรงดันและโหมดกระแส เลือกความถี่ครอสโอเวอร์ ตัวชดเชย Type II และ Type III ด้วยออปแอมป์ เฟสมาร์จิน และเส้นทางสู่บทอิเล็กทรอนิกส์กำลัง" },
      { slug: "examples", part: "applications", short: "คลังตัวอย่าง", title: "คลังไอเดียระบบควบคุม 60+ ระบบ: ตั้งแต่เทอร์โมสตัทถึงโดรน", en: "Control Systems Examples Gallery", sym: "✦", tag: "ตารางและโจทย์โปรเจกต์",
        summary: "รวมระบบควบคุมรอบตัวพร้อมตัวแปรที่ควบคุม แอคชูเอเตอร์ เซนเซอร์ ชนิดตัวควบคุม และบทเรียนที่เกี่ยวข้อง ใช้เป็นโจทย์โปรเจกต์ ไอเดียสอน และแรงบันดาลใจ" },
    ],
  },
  {
    // Topic 12: Fourier series → harmonics in circuits → power electronics → measurement, with the harmonic lab
    // (assets/fs-core.js + fs-lab.js). Same series machinery as control-systems (parts, live(), formula index).
    slug: "fourier-series",
    title: "อนุกรมฟูเรียร์และการวิเคราะห์ฮาร์มอนิก",
    en: "Fourier Series & Harmonic Analysis",
    sym: "Σ",
    summary: "อนุกรมฟูเรียร์ทีละขั้นจนใช้งานจริง: หาสัมประสิทธิ์ สมมาตร สเปกตรัม พาร์เซวาล วิเคราะห์วงจรทีละฮาร์มอนิก THD PF และกำลังไฟฟ้า เรกติไฟเออร์ อินเวอร์เตอร์ PWM บั๊กคอนเวอร์เตอร์ การแก้ฮาร์มอนิก และ FFT พร้อมแล็บออสซิลโลสโคปและเครื่องวิเคราะห์กำลังไฟฟ้าเสมือน",
    fxHint: "พิมพ์ เช่น euler, a0, bn, odd, half-wave, parseval, gibbs, sinc, thd, pf, neutral, 6k±1, spwm, ripple, resonance, fft",
    parts: [
      { id: "math", n: 1, title: "คณิตศาสตร์ของอนุกรมฟูเรียร์", en: "The Mathematics", blurb: "จากคลื่นคาบสู่ผลรวมของไซน์: หาสัมประสิทธิ์ ใช้สมมาตรลดงาน อ่านสเปกตรัม และรู้ว่าอนุกรมลู่เข้าอย่างไร" },
      { id: "circuits", n: 2, title: "ฮาร์มอนิกในวงจรไฟฟ้า", en: "Harmonics in Circuits & Power", blurb: "ใช้ฟูเรียร์แก้วงจร คำนวณ RMS กำลัง THD และเพาเวอร์แฟกเตอร์เมื่อกระแสไม่ใช่ไซน์" },
      { id: "power-electronics", n: 3, title: "อิเล็กทรอนิกส์กำลัง", en: "Power Electronics", blurb: "ตัวแปลงกำลังทุกชนิดคือเครื่องสร้างฮาร์มอนิก: เรกติไฟเออร์ อินเวอร์เตอร์ PWM บั๊กคอนเวอร์เตอร์ และวิธีแก้" },
      { id: "lab", n: 4, title: "การวัดและแล็บ", en: "Measurement & Lab", blurb: "เครื่องมือวัดคำนวณฮาร์มอนิกอย่างไร และแล็บเสมือนสำหรับทดลอง วิเคราะห์ และแก้ปัญหาด้วยตัวเอง" },
    ],
    sub: [
      { slug: "introduction", part: "math", short: "ฟูเรียร์คืออะไร", title: "อนุกรมฟูเรียร์คืออะไร: ทุกคลื่นคาบคือผลรวมของไซน์", en: "What Is a Fourier Series?", sym: "∿", prefix: "F",
        summary: "สัญญาณคาบ ฮาร์มอนิก สเปกตรัม การสังเคราะห์และการวิเคราะห์ ทำไมวิศวกรไฟฟ้าต้องรู้ และแผนที่การเรียนทั้งชุด" },
      { slug: "coefficients", part: "math", short: "หา a₀ aₙ bₙ", title: "หาสัมประสิทธิ์ฟูเรียร์ทีละขั้น: ความตั้งฉากและสูตรออยเลอร์", en: "Finding the Fourier Coefficients", sym: "aₙ", prefix: "T",
        summary: "ความตั้งฉากของไซน์ สูตรออยเลอร์ a₀ aₙ bₙ อินทิกรัลที่ใช้บ่อย ขั้นตอน 6 ขั้น ตัวอย่างสี่เหลี่ยม พัลส์ ฟันเลื่อย สามเหลี่ยม เรียงกระแส และข้อผิดพลาดที่เจอบ่อย" },
      { slug: "symmetry", part: "math", short: "สมมาตร", title: "ทางลัดด้วยสมมาตร: ฟังก์ชันคู่ คี่ ครึ่งคลื่น เสี้ยวคลื่น และการเลื่อน", en: "Symmetry Shortcuts", sym: "±", prefix: "S",
        summary: "รู้ก่อนอินทิเกรตว่าพจน์ไหนเป็นศูนย์ สมมาตรครึ่งคลื่นกับฮาร์มอนิกคู่ เสี้ยวคลื่นของอินเวอร์เตอร์ การเลื่อนเวลา การตัดยอด และอนุกรมครึ่งช่วง" },
      { slug: "complex-spectrum", part: "math", short: "เชิงซ้อน · สเปกตรัม", title: "รูปเชิงซ้อน สเปกตรัมขนาด–เฟส และสมบัติของอนุกรมฟูเรียร์", en: "Complex Form & Spectrum", sym: "cₙ", prefix: "C",
        summary: "cₙ จากสูตรออยเลอร์ รูปแอมพลิจูด–เฟส สเปกตรัมด้านเดียวและสองด้าน พัลส์กับเอนเวโลป sinc สมบัติการเลื่อน อนุพันธ์ ปริพันธ์ และเฟเซอร์ของแต่ละฮาร์มอนิก" },
      { slug: "convergence-parseval", part: "math", short: "กิบส์ · พาร์เซวาล", title: "การลู่เข้า ปรากฏการณ์กิบส์ ทฤษฎีบทพาร์เซวาล และอัตราลดของฮาร์มอนิก", en: "Convergence, Gibbs & Parseval", sym: "Σ²", prefix: "P",
        summary: "เงื่อนไขดีริชเลต์ ค่าที่จุดกระโดด หูกิบส์ 9 % พาร์เซวาลกับค่า RMS และ THD ความเรียบกับอัตราลด 1/n 1/n² และควรรวมกี่ฮาร์มอนิกในงานจริง" },
      { slug: "waveform-table", part: "circuits", short: "ตารางรูปคลื่น", title: "ตารางอนุกรมฟูเรียร์ของรูปคลื่นในงานไฟฟ้าและอิเล็กทรอนิกส์กำลัง", en: "Fourier Series Table of Common Waveforms", sym: "⊓", prefix: "W",
        summary: "18 รูปคลื่นพร้อมอนุกรม RMS และ THD: สี่เหลี่ยม พัลส์ สามเหลี่ยม ฟันเลื่อย เรียงกระแส quasi-square six-step กระแส 6 พัลส์ SPWM คางหมู ไตรแอก ตัดยอด และริปเปิลตัวเหนี่ยวนำ" },
      { slug: "circuit-analysis", part: "circuits", short: "วิเคราะห์วงจร", title: "วิเคราะห์วงจรด้วยอนุกรมฟูเรียร์: ซูเปอร์โพซิชันทีละฮาร์มอนิก", en: "Circuit Analysis with Fourier Series", sym: "H(jnω)", prefix: "A",
        summary: "แยก คูณ H(jnω₀) แล้วรวม: สี่เหลี่ยมเข้า RC อินเวอร์เตอร์ป้อนโหลด RL ฟิลเตอร์ LC ของเรียงกระแส RLC คัดฮาร์มอนิก กำลังเฉลี่ยจากฮาร์มอนิก และข้อจำกัดของวิธี" },
      { slug: "power-harmonics", part: "circuits", short: "THD · PF · กำลัง", title: "กำลังไฟฟ้าเมื่อมีฮาร์มอนิก: RMS THD PF DPF P Q S D และมาตรฐาน IEEE 519", en: "Power, THD & Power Factor with Harmonics", sym: "THD", prefix: "H",
        summary: "True RMS THD TDD crest factor กำลังจริง Q₁ และกำลังความเพี้ยน D เพาเวอร์แฟกเตอร์ที่แก้ด้วยคาปาซิเตอร์ไม่ได้ K-factor ลำดับเฟสกับนิวทรัลร้อน แรงดันเพี้ยนที่ PCC และขีดจำกัด IEEE 519-2022" },
      { slug: "rectifiers", part: "power-electronics", short: "เรกติไฟเออร์", title: "ฮาร์มอนิกของวงจรเรียงกระแส: 1 เฟส 3 เฟส 6 พัลส์ 12 พัลส์ และตัวเก็บประจุ", en: "Rectifier Harmonics", sym: "6k±1", prefix: "R",
        summary: "ฝั่ง DC และฝั่ง AC ของบริดจ์ 1 เฟส บริดจ์ + ตัวเก็บประจุของ SMPS และ VFD กฎ h = kp ± 1 ช่วงทับซ้อน μ ไทริสเตอร์กับ cos α และการหักล้างฮาร์มอนิกด้วย 12 และ 18 พัลส์" },
      { slug: "inverters-pwm", part: "power-electronics", short: "อินเวอร์เตอร์ · PWM", title: "สเปกตรัมของอินเวอร์เตอร์: สี่เหลี่ยม quasi-square six-step SHE และ SPWM", en: "Inverter & PWM Spectra", sym: "m_f", prefix: "V",
        summary: "อินเวอร์เตอร์คลื่นสี่เหลี่ยม กำจัดฮาร์มอนิกด้วยมุม α six-step 3 เฟส SHE SPWM ไบโพลาร์และยูนิโพลาร์ mₐ m_f ตำแหน่งไซด์แบนด์ WTHD และผลต่อมอเตอร์" },
      { slug: "dc-dc-converters", part: "power-electronics", short: "บั๊ก · ริปเปิล · EMI", title: "ฟูเรียร์ในคอนเวอร์เตอร์ DC-DC: บั๊ก ริปเปิล ฟิลเตอร์ LC และ EMI", en: "DC-DC Converters: Ripple & EMI", sym: "D", prefix: "B",
        summary: "โหนดสวิตช์คือพัลส์ DC = DV_in ประมาณริปเปิลด้วยฮาร์มอนิกแรกเทียบสูตรจริง กระแสตัวเหนี่ยวนำ ตัวเก็บประจุอินพุต เอนเวโลปคางหมูกับ EMI และการเลือกความถี่สวิตช์" },
      { slug: "mitigation", part: "power-electronics", short: "แก้ฮาร์มอนิก", title: "แก้ปัญหาฮาร์มอนิก: รีแอกเตอร์ เรโซแนนซ์ คาปาซิเตอร์ดีจูน ฟิลเตอร์จูน ฟิลเตอร์แอกทีฟ และ PFC", en: "Harmonic Mitigation", sym: "LC", prefix: "M",
        summary: "รีแอกเตอร์ไลน์และโช้ก DC เรโซแนนซ์ขนาน h_r = √(S_sc/Q_c) คาปาซิเตอร์ดีจูน 7 % 14 % ออกแบบฟิลเตอร์จูนทีละขั้น 12 พัลส์ ฟิลเตอร์แอกทีฟ PFC และเช็กลิสต์แก้ปัญหาหน้างาน" },
      { slug: "dft-fft", part: "lab", short: "DFT · FFT", title: "จากอนุกรมฟูเรียร์สู่ DFT และ FFT: เครื่องวัดคำนวณฮาร์มอนิกอย่างไร", en: "From Fourier Series to DFT & FFT", sym: "X[k]", prefix: "D",
        summary: "สุ่มสัญญาณแล้วได้ cₙ ความละเอียดความถี่ อเลียสซิง การรั่วของสเปกตรัมและหน้าต่าง มาตรฐาน IEC 61000-4-7 การใช้ FFT บนสโคป และ Goertzel บนไมโครคอนโทรลเลอร์" },
      { slug: "analyzer-lab", part: "lab", short: "แล็บเสมือน", title: "แล็บวิเคราะห์ฮาร์มอนิก: ออสซิลโลสโคปเสมือน + เครื่องวิเคราะห์กำลังไฟฟ้า", en: "Harmonic Analyzer Lab (Virtual Oscilloscope & Power Analyzer)", sym: "▶", tag: "แล็บโต้ตอบ + ใบงาน 16 ชุด",
        summary: "สังเคราะห์และวิเคราะห์ฟูเรียร์ ป้อนคลื่นเข้าวงจรทีละฮาร์มอนิก และวัดโหลดจริง 10 แบบด้วยสโคปกับเครื่องวิเคราะห์กำลัง พร้อมแปลผลอัตโนมัติ วิธีคำนวณทีละขั้น ใบงาน และกรณีศึกษาหน้างาน" },
    ],
  },
  {
    // Topic 13: Power electronics — DC-DC converters, modeling & control, hardware, practice, with the switching-level
    // converter lab (assets/pe-sim.js + pe-lab.js). Same series machinery as control-systems (parts, live(), formula index).
    slug: "power-electronics",
    title: "อิเล็กทรอนิกส์กำลัง",
    en: "Power Electronics",
    sym: "⚡",
    summary: "วงจรแปลงผัน DC-DC บั๊ก บูสต์ บั๊ก-บูสต์ ชุค ตั้งแต่ volt-second balance ถึงแบบจำลองสัญญาณเล็ก ออกแบบตัวชดเชย Type II/III peak current mode ควบคุมด้วยออปแอมป์และไมโครคอนโทรลเลอร์ ตัวสังเกต AI ออกแบบตัวเหนี่ยวนำ แหล่งจ่ายทดสอบ SMPS เทคนิคหน้างาน วิเคราะห์อาการเสีย พร้อมแล็บจำลองคอนเวอร์เตอร์",
    fxHint: "พิมพ์ เช่น duty, ripple, volt-second, dcm, rhp, gvd, type iii, k-factor, slope, tustin, observer, air gap, bulk capacitor, mppt",
    parts: [
      { id: "dc-dc", n: 1, title: "วงจรแปลงผัน DC-DC", en: "DC-DC Converters", blurb: "บั๊ก บูสต์ บั๊ก-บูสต์ และชุค ตั้งแต่ volt-second balance ริปเปิล CCM/DCM ความเค้น การสูญเสีย จนถึงฟังก์ชันถ่ายโอนและตัวอย่างออกแบบ" },
      { id: "control", n: 2, title: "การควบคุมและตัวชดเชย", en: "Modeling & Control", blurb: "แบบจำลองสัญญาณเล็ก ออกแบบตัวชดเชย Type II/III ควบคุมด้วยออปแอมป์และไมโครคอนโทรลเลอร์ ตัวสังเกตสถานะ และ AI ช่วยควบคุม" },
      { id: "hardware", n: 3, title: "ออกแบบฮาร์ดแวร์", en: "Hardware Design", blurb: "พันตัวเหนี่ยวนำ เลือกแหล่งจ่ายทดสอบ เลือกชิปควบคุมและไมโครคอนโทรลเลอร์ และภาพรวมแหล่งจ่ายไฟสวิตชิ่ง" },
      { id: "practice", n: 4, title: "ภาคปฏิบัติและแล็บ", en: "Practice & Lab", blurb: "เทคนิคหน้างาน การวัด การ bring-up งานบำรุงรักษา วิเคราะห์อาการเสีย และแล็บจำลองคอนเวอร์เตอร์พร้อมใบงาน" },
    ],
    sub: [
      { slug: "buck-converter", part: "dc-dc", short: "บั๊ก", title: "บั๊กคอนเวอร์เตอร์ (Buck Converter): หลักการ สูตร ริปเปิล CCM/DCM การออกแบบ และฟังก์ชันถ่ายโอน", en: "Buck Converter", sym: "↓V", prefix: "B",
        summary: "วงจรลดแรงดัน: volt-second balance V_o = DV_in ริปเปิลกระแสและแรงดัน ขอบ CCM/DCM ความเค้นของอุปกรณ์ การสูญเสีย G_vd(s) และตัวอย่างออกแบบ 24 V → 12 V" },
      { slug: "boost-converter", part: "dc-dc", short: "บูสต์", title: "บูสต์คอนเวอร์เตอร์ (Boost Converter): สูตร ขีดจำกัดอัตราขยาย RHP zero และการออกแบบ", en: "Boost Converter", sym: "↑V", prefix: "U",
        summary: "วงจรเพิ่มแรงดัน 1/(1−D) ความต้านทานแฝงจำกัดอัตราขยาย ริปเปิลและ ESR ขอบ DCM อันตรายเมื่อไร้โหลด RHP zero และตัวอย่าง 24 V → 48 V" },
      { slug: "buck-boost-converter", part: "dc-dc", short: "บั๊ก-บูสต์", title: "บั๊ก-บูสต์คอนเวอร์เตอร์: แบบกลับขั้ว แบบ 4 สวิตช์ และการเลือกโทโพโลยี", en: "Buck-Boost Converter", sym: "±V", prefix: "W",
        summary: "บั๊ก-บูสต์กลับขั้ว −D/(1−D) ความเค้น V_in + |V_o| RHP zero บั๊ก-บูสต์ 4 สวิตช์แบบไม่กลับขั้ว และตารางเลือกระหว่าง SEPIC Ćuk และ flyback" },
      { slug: "cuk-converter", part: "dc-dc", short: "ชุค (Ćuk)", title: "ชุคคอนเวอร์เตอร์ (Ćuk Converter): ตัวเก็บประจุคัปปลิ้ง การออกแบบ การหน่วง และ zero ripple", en: "Ćuk Converter", sym: "Ć", prefix: "K",
        summary: "ถ่ายโอนพลังงานผ่านตัวเก็บประจุ C1 สมการออกแบบ L1 L2 C1 ไดนามิกอันดับสี่และการหน่วง coupled inductor กับกระแสริปเปิลเกือบศูนย์" },
      { slug: "small-signal-model", part: "control", short: "แบบจำลองสัญญาณเล็ก", title: "แบบจำลองสัญญาณเล็กของคอนเวอร์เตอร์ DC-DC: State-Space Averaging และฟังก์ชันถ่ายโอน", en: "Small-Signal Modeling", sym: "Gvd", prefix: "S",
        summary: "เฉลี่ยสถานะตลอดคาบแล้ว linearize ได้ G_vd G_vg Z_out ตารางฟังก์ชันถ่ายโอนของบั๊ก บูสต์ บั๊ก-บูสต์ PWM gain ลูปเกน และเกณฑ์ฟิลเตอร์ขาเข้าของ Middlebrook" },
      { slug: "compensator-design", part: "control", short: "ออกแบบตัวชดเชย", title: "ออกแบบตัวชดเชย Type I II III ด้วยวิธี k-factor และ Peak Current Mode กับ Slope Compensation", en: "Compensator Design", sym: "Type III", prefix: "C",
        summary: "เป้าหมายลูป เฟสมาร์จิน ขีดจำกัดความถี่ครอสโอเวอร์ สูตรค่า R C ของ Type II/III ด้วย k-factor ตัวอย่างบั๊กที่ตรวจด้วย python-control และ peak current mode" },
      { slug: "analog-control", part: "control", short: "ควบคุมแบบอนาล็อก", title: "ควบคุมคอนเวอร์เตอร์แบบอนาล็อกด้วยออปแอมป์: PWM, Error Amplifier, วัดกระแส, TL494, UC3843", en: "Analog Control with Op-Amps", sym: "op-amp", prefix: "A",
        summary: "สร้าง PWM ด้วยออปแอมป์ล้วน error amplifier การเลือกออปแอมป์ วิธีวัดกระแส 4 แบบ ชิปคลาสสิก TL494 UC384x TL431 + optocoupler และเช็กลิสต์" },
      { slug: "digital-control", part: "control", short: "ควบคุมแบบดิจิทัล", title: "ควบคุมคอนเวอร์เตอร์ DC-DC แบบดิจิทัล: ADC, DPWM, Limit Cycle, Tustin และโค้ด PI", en: "Digital Control", sym: "z⁻¹", prefix: "Z",
        summary: "จังหวะสุ่มสัญญาณ ดีเลย์ ความละเอียด DPWM กับ limit cycle แปลงตัวชดเชยด้วย Tustin โค้ด PI พร้อม anti-windup การป้องกันในฮาร์ดแวร์ และขั้นตอน bring-up" },
      { slug: "observers", part: "control", short: "ตัวสังเกตกระแส", title: "ตัวสังเกตกระแสและสถานะ (Observer) ในคอนเวอร์เตอร์ และการเฝ้าสังเกตสภาวะแวดล้อม", en: "Observers & Condition Monitoring", sym: "x̂", prefix: "O",
        summary: "Luenberger observer ประมาณ i_L disturbance observer ประมาณกระแสโหลดเพื่อ feedforward Kalman filter ข้อควรระวัง และการเฝ้าสังเกต V_in อุณหภูมิ ESR และการอิ่มตัว" },
      { slug: "ai-control", part: "control", short: "AI ช่วยควบคุม", title: "AI ช่วยควบคุมและวินิจฉัยคอนเวอร์เตอร์: ปรับจูนอัตโนมัติ RL วินิจฉัยจากรูปคลื่น และ LLM", en: "AI-Assisted Control & Diagnosis", sym: "AI",
        summary: "แบ่งชั้นให้ปลอดภัย ลูปเร็วต้องเชิงกำหนด AI อยู่ชั้นกำกับ ปรับจูนอัตโนมัติ RL วินิจฉัยความผิดพลาดจากรูปคลื่น บำรุงรักษาเชิงพยากรณ์ และใช้ LLM เป็นผู้ช่วยออกแบบ" },
      { slug: "inductor-design", part: "hardware", short: "ออกแบบตัวเหนี่ยวนำ", title: "ออกแบบและพันตัวเหนี่ยวนำกำลัง: เลือกแกน จำนวนรอบ ช่องอากาศ ลวด และการสูญเสีย", en: "Power Inductor Design", sym: "N²A_L", prefix: "L",
        summary: "สมการ L = N²A_L ความหนาแน่นฟลักซ์ area product ขั้นตอนออกแบบพร้อมตัวเลข skin depth Steinmetz เลือกวัสดุแกน และวิธีวัด L กับกระแสอิ่มตัวในแล็บ" },
      { slug: "test-power-sources", part: "hardware", short: "แหล่งจ่ายทดสอบ", title: "แหล่งจ่ายไฟสำหรับทดสอบวงจร: แบตเตอรี่ ไฟบ้าน 220 V ผ่านเรกติไฟเออร์ และโซลาร์เซลล์", en: "Test Power Sources", sym: "⚡", prefix: "V",
        summary: "กฎทองของการทดสอบ แบตเตอรี่ 3 ชนิด คำนวณตัวเก็บประจุหลังบริดจ์ inrush ฟิวส์ หม้อแปลงแยกขด แบบจำลองแผงโซลาร์ MPPT และตารางเลือกแหล่งจ่าย" },
      { slug: "controller-selection", part: "hardware", short: "เลือกชิปควบคุม", title: "เลือกชิปควบคุมและไมโครคอนโทรลเลอร์สำหรับคอนเวอร์เตอร์: รุ่นปัจจุบันและรุ่นที่ไม่ตกยุค", en: "Controller & MCU Selection", sym: "IC",
        summary: "กรอบการตัดสินใจ ชิปอนาล็อกคลาสสิก TL494 SG3525 UC3843 TL431 ชิปรุ่นปัจจุบัน MCU C2000 STM32G4 dsPIC33 gate driver และคำเตือนเรื่องของปลอม" },
      { slug: "switching-power-supply", part: "hardware", short: "แหล่งจ่ายสวิตชิ่ง", title: "แหล่งจ่ายไฟสวิตชิ่ง (SMPS): Flyback Forward Bridge LLC PFC และมาตรฐานความปลอดภัย", en: "Switching Power Supply (SMPS)", sym: "SMPS", prefix: "F",
        summary: "โครงสร้างแหล่งจ่ายต่อไฟบ้าน EMI filter PFC ตระกูลวงจรแยกฉนวน ขั้นตอนออกแบบ flyback 7 ขั้น มาตรฐาน IEC 62368-1 และ CISPR 32" },
      { slug: "engineering-techniques", part: "practice", short: "เทคนิคหน้างาน", title: "เทคนิคเชิงช่างและวิศวกรรมสำหรับวงจรสวิตชิ่ง: Layout, Snubber, การวัด, Bode, Bring-up และงานประจำ", en: "Engineering Techniques & Routine Work", sym: "⚙",
        summary: "hot loop และ layout ออกแบบ RC snubber วัดด้วยสโคปให้ถูก วัดลูปเกนจริง ขั้นตอน bring-up 7 ขั้น ตารางงานบำรุงรักษา และกฎจากประสบการณ์" },
      { slug: "troubleshooting", part: "practice", short: "วิเคราะห์อาการเสีย", title: "วิเคราะห์อาการเสียของคอนเวอร์เตอร์และแหล่งจ่ายไฟสวิตชิ่ง: อาการ สาเหตุ วิธีตรวจ", en: "Troubleshooting", sym: "⚠",
        summary: "วิธีคิดแบบเป็นระบบ ตาราง 17 อาการ เช่น ไม่มีเอาต์พุต hiccup แกว่ง เสียงหอน MOSFET ระเบิด แกนอิ่มตัว ริปเปิลสูง EMI และวิธีฝึกด้วยซิมูเลเตอร์" },
      { slug: "converter-lab", part: "practice", short: "แล็บจำลอง", title: "แล็บจำลองคอนเวอร์เตอร์ DC-DC: ออสซิลโลสโคป ฟังก์ชันเจนเนอเรเตอร์ แหล่งจ่าย โหลด และคำนวณตัวเหนี่ยวนำ", en: "DC-DC Converter Simulator Lab", sym: "▶", tag: "แล็บโต้ตอบ + ใบงาน 10 ชุด",
        summary: "ซิมูเลเตอร์ระดับการสวิตช์ของบั๊ก บูสต์ บั๊ก-บูสต์ ชุค กับแบตเตอรี่ ไฟบ้าน โซลาร์ โหลด 3 แบบ ตัวควบคุม 4 โหมด สโคป 2 ช่อง ฟังก์ชันเจนฯ คำนวณ L และใบงาน 10 ชุด" },
    ],
  },
];

// ---------------------------------------------------------------------------
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const decode = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
const stripTags = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : d.name.endsWith(".html") ? [p] : [];
  });
}

function routeFor(rel) {
  // index.html -> /, about.html -> /about/, learn/index.html -> /learn/, learn/x.html -> /learn/x/
  const noExt = rel.replace(/\\/g, "/").replace(/\.html$/, "");
  if (noExt === "index") return "/";
  if (noExt.endsWith("/index")) return "/" + noExt.slice(0, -"index".length);
  return "/" + noExt + "/";
}

// Lecture-note markup inside math: \hlF{} formula used, \hlP{} property used, \hlU{} the u-substitution,
// \hlC{} constant of integration, \rc{} red strike-through (cancel), \carry{} small red value written above a cancel
const KATEX_MACROS = {
  "\\hlF": "\\htmlClass{hl-f}{#1}",
  "\\hlP": "\\htmlClass{hl-p}{#1}",
  "\\hlU": "\\htmlClass{hl-u}{#1}",
  "\\hlC": "\\htmlClass{hl-c}{#1}",
  "\\rc": "\\htmlClass{rc}{\\cancel{#1}}",
  "\\carry": "\\overset{\\htmlClass{carry}{#1}}{\\htmlClass{rc}{\\cancel{#2}}}",
};
function renderMath(html, file) {
  const render = (tex, displayMode) => {
    try {
      return katex.renderToString(decode(tex.trim()), { displayMode, throwOnError: true, strict: "ignore", trust: (c) => c.command === "\\htmlClass", macros: KATEX_MACROS });
    } catch (e) {
      throw new Error(`KaTeX error in ${file}: ${e.message}\n  in: ${tex.trim()}`);
    }
  };
  return html
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, t) => render(t, true))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, t) => render(t, false));
}

function thaiDate(iso) {
  return new Date(iso + "T00:00:00+07:00").toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
}

// ---------------------------------------------------------------------------
// Generated fragments
// ---------------------------------------------------------------------------
function topicCards() {
  return (
    '<div class="topic-grid">' +
    TOPICS.map(
      (t, i) => `
  <a class="topic-card" href="/learn/${t.slug}/">
    <span class="tc-top"><span class="tc-sym" aria-hidden="true">${t.sym}</span><span class="tc-num">${String(i + 1).padStart(2, "0")}</span></span>
    <b>${esc(t.title)}</b>
    <span class="tc-en">${esc(t.en)}</span>
    <span class="tc-sum">${esc(t.summary)}</span>
    <span class="tc-foot"><span class="tc-go">${t.sub ? `${live(t).length} หน้าย่อย →` : "อ่านบทเรียน →"}</span>${t.playlist ? '<span class="tc-vid">▶ มีวิดีโอ</span>' : ""}</span>
  </a>`
    ).join("") +
    "\n</div>"
  );
}

// level badges inside headings: <span class="lv lv-b">…</span> (b = basic, i = intermediate, a = advanced)
const LV_RE = /<span class="lv lv-([bia])"[^>]*>[\s\S]*?<\/span>/g;
function toc(html) {
  const items = [...html.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)];
  if (!items.length) return "";
  return (
    '<nav class="toc" aria-label="สารบัญ"><details open><summary>สารบัญ</summary><ol>' +
    items.map(([, id, t]) => {
      const lv = /<span class="lv lv-([bia])"/.exec(t);
      return `<li><a href="#${id}">${stripTags(t.replace(LV_RE, ""))}${lv ? `<i class="toc-lv lv-${lv[1]}" aria-hidden="true"></i>` : ""}</a></li>`;
    }).join("") +
    "</ol></details></nav>"
  );
}

// ---------------------------------------------------------------------------
// Series (a topic with sub-pages, e.g. linear algebra)
// ---------------------------------------------------------------------------
const seriesUrl = (t, s) => `/learn/${t.slug}/${s ? s.slug + "/" : ""}`;
// a sub-page is live once its source file exists; the rest are shown as "coming soon" and left out of prev/next, sitemap and llms.txt
const subFile = (t, s) => path.join(ROOT, "src/pages/learn", t.slug, s.slug + ".html");
const live = (t) => (t.sub || []).filter((s) => fs.existsSync(subFile(t, s)));
const subNo = (t, s) => t.sub.indexOf(s) + 1; // stable number, does not shift when pages are added

function seriesNav(t, cur) {
  const lv = new Set(live(t));
  const pill = (s) => {
    const sub = s && s.slug ? s : null;
    const here = (cur ? cur.slug : null) === (sub ? sub.slug : null);
    return `<a href="${seriesUrl(t, sub)}"${here ? ' aria-current="page"' : ""}><span class="sn-n">${sub ? subNo(t, sub) : 0}</span>${esc(sub ? sub.short : "ภาพรวม")}</a>`;
  };
  const head = `<span class="sn-title mono">${esc(t.en)}</span>`;
  if (!t.parts) {
    const items = [null, ...t.sub];
    return `<nav class="series-nav" aria-label="หน้าย่อยใน${esc(t.title)}">${head}<div class="sn-list">${items.map(pill).join("")}</div></nav>`;
  }
  const row = (p) => {
    const subs = t.sub.filter((s) => s.part === p.id && lv.has(s));
    if (!subs.length) return "";
    return `<div class="sn-part"><span class="sn-pt mono">${p.n} · ${esc(p.title)}</span><div class="sn-list">${subs.map(pill).join("")}</div></div>`;
  };
  const curPart = cur ? t.parts.find((p) => p.id === cur.part) : null;
  const inline = [null, ...(curPart ? t.sub.filter((s) => s.part === curPart.id && lv.has(s)) : [])];
  return `<nav class="series-nav" aria-label="หน้าย่อยใน${esc(t.title)}">${head}` +
    `<div class="sn-list">${inline.map(pill).join("")}</div>` +
    `<details class="sn-all"${cur ? "" : " open"}><summary>ดูครบทุกส่วน · ${lv.size} หน้า</summary>${t.parts.map(row).join("")}</details></nav>`;
}

function seriesCards(t) {
  const ti = TOPICS.indexOf(t) + 1;
  const lv = new Set(live(t));
  const card = (s) => {
    const n = `${ti}.${subNo(t, s)}`;
    const foot = s.prefix ? `สูตร ${s.prefix}1, ${s.prefix}2, …` : s.tag || "แล็บโต้ตอบ";
    const inner = `
    <span class="tc-top"><span class="tc-sym" aria-hidden="true">${esc(s.sym)}</span><span class="tc-num">${n}</span></span>
    <b>${esc(s.title)}</b>
    <span class="tc-en">${esc(s.en)}</span>
    <span class="tc-sum">${esc(s.summary)}</span>`;
    return lv.has(s)
      ? `
  <a class="la-card" href="${seriesUrl(t, s)}">${inner}
    <span class="tc-foot"><span class="tc-go">เปิดหน้า →</span><span class="mono">${foot}</span></span>
  </a>`
      : `
  <div class="la-card soon" aria-disabled="true">${inner}
    <span class="tc-foot"><span class="tc-go">เร็วๆ นี้</span><span class="mono">${foot}</span></span>
  </div>`;
  };
  if (!t.parts) return '<div class="la-cards">' + t.sub.map(card).join("") + "\n</div>";
  return t.parts.map((p) => {
    const subs = t.sub.filter((s) => s.part === p.id);
    if (!subs.length) return "";
    const done = subs.filter((s) => lv.has(s)).length;
    return `<div class="cs-part" id="part-${p.id}">
  <div class="cs-part-h"><span class="cs-part-n mono">ส่วนที่ ${p.n}</span><h3>${esc(p.title)} <small>${esc(p.en)}</small></h3><p>${esc(p.blurb)}${done < subs.length ? ` <span class="mono cs-part-soon">เปิดแล้ว ${done}/${subs.length}</span>` : ""}</p></div>
  <div class="la-cards">${subs.map(card).join("")}
  </div>
</div>`;
  }).join("\n");
}

function seriesPager(t, s) {
  const L = live(t);
  const i = L.indexOf(s), prev = L[i - 1], next = L[i + 1];
  const ti = TOPICS.indexOf(t), nextTopic = TOPICS[ti + 1];
  const a = (href, dir, label, title) => `<a class="pager-${dir}" href="${href}"><span class="mono">${label}</span><b>${esc(title)}</b></a>`;
  return `<nav class="pager" aria-label="หน้าถัดไป">${
    prev ? a(seriesUrl(t, prev), "prev", "← หน้าก่อนหน้า", prev.title) : a(seriesUrl(t), "prev", "← ภาพรวม", t.title)
  }${
    next ? a(seriesUrl(t, next), "next", "หน้าถัดไป →", next.title) : nextTopic ? a(`/learn/${nextTopic.slug}/`, "next", "บทถัดไป →", nextTopic.title) : a("/learn/", "next", "ไปต่อ →", "คลังความรู้ทั้งหมด")
  }</nav>`;
}

// number of formula cards (id="X1") or worked examples (class="wx") across a series' sub-pages
function seriesCount(t, kind) {
  return t.sub.reduce((n, s) => {
    const file = path.join(ROOT, "src/pages/learn", t.slug, s.slug + ".html");
    if (!fs.existsSync(file)) return n;
    const src = fs.readFileSync(file, "utf8");
    return n + (src.match(kind === "formula" ? /<div class="tf[^"]*" id="[A-Z]\d+[a-z]?"/g : /<div class="wx"/g) || []).length;
  }, 0);
}

// Formula index for a series: every <div class="tf…" id="X1" data-k="…"> card on its sub-pages, with its first display formula.
// Card format: <div class="tf" id="M9" data-k="keywords"><p class="tf-n"><b><span class="fid">M9</span> English</b> ไทย</p> \[ … \]
function formulaIndex(t) {
  const out = [];
  t.sub.forEach((s) => {
    const file = path.join(ROOT, "src/pages/learn", t.slug, s.slug + ".html");
    if (!fs.existsSync(file)) return;
    const src = fs.readFileSync(file, "utf8");
    const re = /<div class="tf[^"]*" id="([A-Z]\d+[a-z]?)" data-k="([^"]*)">\s*<p class="tf-n"><b><span class="fid">[^<]*<\/span>\s*([\s\S]*?)<\/b>([\s\S]*?)<\/p>\s*(?:<div class="wtfig">[\s\S]*?<\/div>\s*)?(\\\[[\s\S]*?\\\])?/g;
    let m;
    while ((m = re.exec(src))) {
      const [, id, keys, en, th, tex] = m;
      out.push({ id, keys, en: en.trim(), th: stripTags(th), tex: tex || "", s });
    }
  });
  const hay = (f) => (f.id + " " + f.keys + " " + stripTags(f.en) + " " + f.th + " " + f.s.short + " " + f.tex.replace(/\\[[\]()]/g, " ").replace(/\\([a-zA-Z]+)/g, " $1 ")).toLowerCase().replace(/"/g, "").replace(/\s+/g, " ");
  return `<div class="fx-index" id="fxIndex">
  <div class="tf-filter fx-tools" role="search">
    <label for="fxFilter">ค้นหาสูตร</label>
    <input id="fxFilter" type="search" placeholder="${esc(t.fxHint || "พิมพ์ เช่น inverse, det, eigen, คราเมอร์, ทรานสโพส, rank, 2x2")}" autocomplete="off">
    <span class="tf-count mono" id="fxCount" aria-live="polite">ทั้งหมด ${out.length} สูตร</span>
  </div>
  <div class="fx-chips" role="group" aria-label="กรองตามหน้า"><button type="button" aria-pressed="true" data-p="">ทุกหน้า</button>${t.sub.filter((s) => s.prefix).map((s) => `<button type="button" aria-pressed="false" data-p="${s.slug}">${s.prefix} · ${esc(s.short)}</button>`).join("")}</div>
  <ol class="fx-list">
${out.map((f) => `    <li class="fx" data-p="${f.s.slug}" data-k="${esc(hay(f))}"><a class="fx-h" href="${seriesUrl(t, f.s)}#${f.id}"><span class="fid">${f.id}</span><b>${f.en}</b><span class="fx-th">${esc(f.th)}</span></a>${f.tex ? `<div class="fx-f">${f.tex}</div>` : ""}</li>`).join("\n")}
  </ol>
  <p class="fx-empty" id="fxEmpty" hidden>ไม่พบสูตรที่ตรงกัน ลองพิมพ์คำอื่น หรือใช้ภาษาอังกฤษ เช่น inverse, determinant, eigenvalue</p>
</div>`;
}

function faqHtml(faq) {
  if (!faq?.length) return "";
  return (
    '<section class="faq" aria-labelledby="faq"><h2 id="faq">คำถามที่พบบ่อย</h2>' +
    faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${f.a}</p></details>`).join("") +
    "</section>"
  );
}

function pager(slug) {
  const i = TOPICS.findIndex((t) => t.slug === slug);
  const prev = TOPICS[i - 1], next = TOPICS[i + 1];
  const link = (t, dir) =>
    t
      ? `<a class="pager-${dir}" href="/learn/${t.slug}/"><span class="mono">${dir === "prev" ? "← บทก่อนหน้า" : "บทถัดไป →"}</span><b>${esc(t.title)}</b></a>`
      : `<a class="pager-${dir}" href="/learn/"><span class="mono">${dir === "prev" ? "← กลับ" : "ไปต่อ →"}</span><b>คลังความรู้ทั้งหมด</b></a>`;
  return `<nav class="pager" aria-label="บทเรียนถัดไป">${link(prev, "prev")}${link(next, "next")}</nav>`;
}

function videoFacade(t) {
  if (!t?.playlist) return "";
  return `
<section class="lesson-video" aria-labelledby="video">
  <h2 id="video">ดูวิดีโอประกอบ</h2>
  <div class="screen" data-yt-list="${t.playlist}" data-yt-title="${esc(t.en)}">
    <div class="facade"><div class="f-eq">${esc(t.sym)}</div><div><h3>${esc(t.en)}</h3><p>${esc(t.title)} · เพลย์ลิสต์บน YouTube</p></div>
    <button class="play" type="button"><i></i>เล่นเพลย์ลิสต์</button></div>
  </div>
  <p class="below-screen mono"><span>สอนโดยอาจารย์มด · ภาษาไทย</span><a href="https://www.youtube.com/playlist?list=${t.playlist}" target="_blank" rel="noopener">เปิดใน YouTube ↗</a></p>
</section>`;
}

// Trig table: sin, cos, tan every 0.05° from 0° to 90° (1,801 rows), grouped one <tbody> per degree
const TRIG_SPECIAL = { 0: "0", 15: "π/12", 18: "π/10", 22.5: "π/8", 30: "π/6", 36: "π/5", 45: "π/4", 54: "3π/10", 60: "π/3", 67.5: "3π/8", 72: "2π/5", 75: "5π/12", 90: "π/2" };
export const trigDegId = (i) => "deg-" + (i % 20 === 0 ? String(i / 20) : (i / 20).toFixed(2));
export const fmtTan = (v) => { const a = Math.abs(v); return v.toFixed(a < 10 ? 6 : a < 100 ? 5 : a < 1000 ? 4 : 3); };
function trigTable() {
  let rows = "";
  for (let d = 0; d <= 90; d++) {
    rows += "<tbody>";
    for (let k = 0; k < 20; k++) {
      const i = d * 20 + k;
      if (i > 1800) break;
      const deg = i / 20, rad = (i * Math.PI) / 3600;
      const sp = TRIG_SPECIAL[deg];
      const tan = i === 1800 ? '<td class="undef">∞<small>ไม่นิยาม</small></td>' : `<td>${fmtTan(Math.tan(rad))}</td>`;
      rows += `<tr id="${trigDegId(i)}"${sp ? ' class="sp"' : ""}><th scope="row">${deg.toFixed(2)}°</th><td>${rad.toFixed(6)}${sp ? `<small>${sp}</small>` : ""}</td><td>${Math.sin(rad).toFixed(6)}</td><td>${(i === 1800 ? 0 : Math.cos(rad)).toFixed(6)}</td>${tan}</tr>`;
    }
    rows += "</tbody>\n";
  }
  return `<table class="tt" id="trigTable">
<caption>ค่า sin, cos และ tan ของมุม 0° ถึง 90° ทุก 0.05° (1,801 แถว) ค่าปัดเป็นทศนิยม 6 ตำแหน่ง tan มีเลขนัยสำคัญ 7 หลัก</caption>
<thead><tr><th scope="col">องศา<small>θ (°)</small></th><th scope="col">เรเดียน<small>θ (rad)</small></th><th scope="col">sin θ</th><th scope="col">cos θ</th><th scope="col">tan θ</th></tr></thead>
${rows}</table>`;
}

function updatesData() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "data/updates.json"), "utf8"));
}

function nowHtml(data) {
  return (data.now || [])
    .map((n) => `<li><span class="now-ic" aria-hidden="true">${esc(n.icon || "•")}</span><span>${esc(n.text)}</span></li>`)
    .join("");
}

function feedHtml(data) {
  return [...(data.updates || [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      (u) => `<li class="post" data-tag="${esc(u.tag || "")}">
  <div class="post-meta">${u.tag ? `<span class="tag">${esc(u.tag)}</span>` : ""}<time datetime="${esc(u.date)}">${thaiDate(u.date)}</time></div>
  <p>${esc(u.text)}</p>${u.link ? `<a class="post-link" href="${esc(u.link)}">${esc(u.linkText || "อ่านต่อ")} →</a>` : ""}
</li>`
    )
    .join("");
}

// ---------------------------------------------------------------------------
// Structured data
// ---------------------------------------------------------------------------
function lessonSchema(meta, url, topic, ogImageUrl, sub) {
  const crumbs = [
    { "@type": "ListItem", position: 1, name: "หน้าแรก", item: SITE + "/" },
    { "@type": "ListItem", position: 2, name: "คลังความรู้", item: SITE + "/learn/" },
    { "@type": "ListItem", position: 3, name: topic.title, item: SITE + `/learn/${topic.slug}/` },
  ];
  if (sub) crumbs.push({ "@type": "ListItem", position: 4, name: sub.title, item: url });
  const graph = [
    {
      "@type": "Article",
      "@id": url + "#article",
      headline: meta.h1 || meta.title,
      description: meta.description,
      inLanguage: "th",
      url,
      mainEntityOfPage: url,
      datePublished: meta.published || TODAY,
      dateModified: meta.updated || TODAY,
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      about: meta.about || [sub ? sub.en : topic.en],
      isPartOf: sub ? { "@id": SITE + `/learn/${topic.slug}/#article` } : { "@id": `${SITE}/learn/#library` },
      ...(!sub && topic.sub ? { hasPart: live(topic).map((s) => ({ "@id": SITE + seriesUrl(topic, s) + "#article" })) } : {}),
      image: [ogImageUrl],
      educationalLevel: meta.level || "Undergraduate",
      ...(topic.playlist ? { citation: `https://www.youtube.com/playlist?list=${topic.playlist}` } : {}),
    },
    { "@type": "BreadcrumbList", itemListElement: crumbs },
  ];
  if (meta.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: meta.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: stripTags(f.a.replace(/\\\(|\\\)|\\\[|\\\]/g, "").replace(/\\,/g, " ").replace(/\\(\w+)/g, "$1")) },
      })),
    });
  }
  return graph;
}

// ---------------------------------------------------------------------------
// Share bar (lesson pages), plain-text export for llms-full.txt
// ---------------------------------------------------------------------------
function shareHtml(url, title) {
  const u = encodeURIComponent(url), t = encodeURIComponent(title);
  return `<div class="share" aria-label="แชร์หน้านี้">
  <span class="mono">แชร์ให้เพื่อน</span>
  <a href="https://social-plugins.line.me/lineit/share?url=${u}" target="_blank" rel="noopener">LINE</a>
  <a href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener">Facebook</a>
  <a href="https://twitter.com/intent/tweet?url=${u}&amp;text=${t}" target="_blank" rel="noopener">X</a>
  <button type="button" data-share-url="${esc(url)}" data-share-title="${esc(title)}">คัดลอกลิงก์</button>
</div>`;
}

// remove one balanced element that starts at the first match of `open` (e.g. /<div class="trig-lab"/)
function removeBlock(html, open) {
  const m = open.exec(html);
  if (!m) return html;
  const tag = /^<(\w+)/.exec(m[0])[1];
  const re = new RegExp(`<${tag}\\b|</${tag}>`, "g");
  re.lastIndex = m.index;
  let depth = 0, x;
  while ((x = re.exec(html))) {
    depth += x[0][1] === "/" ? -1 : 1;
    if (depth === 0) return html.slice(0, m.index) + html.slice(re.lastIndex);
  }
  return html;
}

function htmlToText(html) {
  let h = html;
  const theory = h.indexOf('id="theory"');
  if (theory > 0) h = h.slice(h.lastIndexOf("<", theory));
  for (const re of [/<div class="trig-lab"/, /<div class="tt-tools"/, /<table class="tt"/, /<div class="tf-filter"/, /<nav class="toc"/, /<nav class="pager"/, /<div class="share"/, /<div class="fx-index"/, /<div class="mx-calc"/, /<div class="la-lab"/, /<div class="mx-prod"/, /<nav class="series-nav"/, /<div class="int-legend"/, /<div class="fgs-bench"/, /<div class="fgs-mini"/, /<div class="fg-calc"/, /<div class="dds-lab"/, /<div class="cs-lab"/, /<div class="rh-calc"/, /<nav class="sn-all"/, /<details class="sn-all"/, /<div class="fs-lab"/, /<ol class="crumbs"/, /<div class="trig-quick"/, /<div class="lesson-meta"/])
    for (let i = 0; i < 3; i++) h = removeBlock(h, re);
  h = h
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|svg|button|select|textarea|aside)\b[\s\S]*?<\/\1>/g, "")
    .replace(/<input[^>]*>/g, "")
    .replace(/\\carry\{([^{}]*)\}\{/g, "\\cancel{")
    .replace(/\\(hlF|hlP|hlU|hlC)\{/g, "{")
    .replace(/\\rc\{/g, "\\cancel{")
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, t) => "$" + t.trim() + "$")
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, t) => "\n$$" + t.trim() + "$$\n")
    .replace(/<h1[^>]*>/g, "\n# ").replace(/<h2[^>]*>/g, "\n\n## ").replace(/<h3[^>]*>/g, "\n\n### ")
    .replace(/<li[^>]*>/g, "\n- ").replace(/<tr[^>]*>/g, "\n| ").replace(/<\/t[dh]>/g, " | ")
    .replace(/<br\s*\/?>/g, "\n").replace(/<summary[^>]*>/g, "\n").replace(/<\/(p|div|figure|details|summary|h\d|ul|ol|table|section|header|figcaption)>/g, "\n")
    .replace(/<[^>]+>/g, "");
  return decode(h).replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
const layout = fs.readFileSync(path.join(ROOT, "src/layout.html"), "utf8");
const pagesDir = path.join(ROOT, "src/pages");
const sitemap = [];
const updates = updatesData();
const fullText = []; // for llms-full.txt
// Clean Markdown copies (llmstxt.org convention: <page URL>index.html.md) for these series, plus hand-written guides.
const MD_SERIES = ["fourier-series", "power-electronics"];
const MD_GUIDES = [{ src: "src/md/fourier-series.md", out: "learn/fourier-series/guide.md", page: "/learn/fourier-series/", title: "Fourier series & harmonic analysis — complete guide (Thai, Markdown)" }];
const mdFiles = []; // [{ path, canonical }] → generated block in _headers
const ogManifest = []; // for scripts/og.py (social share images)

for (const file of walk(pagesDir)) {
  const rel = path.relative(pagesDir, file);
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`Missing <!--meta {...} --> block in ${rel}`);
  const meta = JSON.parse(m[1]);
  let body = raw.slice(m[0].length);
  const route = routeFor(rel);
  const url = SITE + route;
  const topic = meta.lesson ? TOPICS.find((t) => t.slug === meta.lesson) : null;
  if (meta.lesson && !topic) throw new Error(`Unknown lesson slug "${meta.lesson}" in ${rel}`);
  const sub = meta.sub ? topic?.sub?.find((s) => s.slug === meta.sub) : null;
  if (meta.sub && !sub) throw new Error(`Unknown sub-page "${meta.sub}" in ${rel}`);
  const key = meta.out ? meta.out.replace(/\.html$/, "") : route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replace(/\//g, "-");
  const ogFile = `/images/og/${key}.jpg`;
  const ogImage = meta.ogImage || (fs.existsSync(path.join(ROOT, ogFile)) ? ogFile : "/images/cover.jpg");
  if (!meta.noindex) {
    const og = meta.og || {};
    const n = topic ? TOPICS.indexOf(topic) + 1 : 0;
    const k = sub ? topic.sub.indexOf(sub) + 1 : 0;
    ogManifest.push({
      key,
      title: og.title || (sub ? sub.title : topic ? topic.title : meta.h1 || meta.title),
      sub: og.sub || (sub ? sub.summary : topic ? topic.summary : meta.description),
      eyebrow: og.eyebrow || (sub ? `บทที่ ${n}.${k} · ${sub.en}` : topic ? `บทที่ ${n} · ${topic.en}` : "Mod's Engineering Mathematics"),
      sym: og.sym || (sub ? sub.sym : topic ? topic.sym : "∿"),
    });
  }

  const fragments = {
    "<!--topic-cards-->": () => topicCards(),
    "<!--trig-table-->": () => trigTable(),
    "<!--faq-->": () => faqHtml(meta.faq),
    "<!--video-->": () => videoFacade(topic),
    "<!--pager-->": () => (topic ? shareHtml(url, meta.h1 || meta.title) + (sub ? seriesPager(topic, sub) : pager(topic.slug)) : ""),
    "<!--series-nav-->": () => (topic?.sub ? seriesNav(topic, sub) : ""),
    "<!--now-->": () => nowHtml(updates),
    "<!--feed-->": () => feedHtml(updates),
    "<!--updated-->": () => (meta.updated ? `<time datetime="${meta.updated}">${thaiDate(meta.updated)}</time>` : ""),
  };
  for (const [marker, fn] of Object.entries(fragments)) body = body.split(marker).join(fn());
  // <!--series-cards:slug--> and <!--formula-index:slug--> can be used on any page (hub, home)
  body = body.replace(/<!--series-cards:([\w-]+)-->/g, (_, s) => seriesCards(TOPICS.find((t) => t.slug === s)));
  body = body.replace(/<!--formula-index:([\w-]+)-->/g, (_, s) => formulaIndex(TOPICS.find((t) => t.slug === s)));
  body = body.replace(/<!--(formula|example)-count:([\w-]+)-->/g, (_, kind, s) => String(seriesCount(TOPICS.find((t) => t.slug === s), kind)));
  const mdExport = !meta.noindex && topic && MD_SERIES.includes(topic.slug);
  if (!meta.noindex && !meta.noLlms) {
    const text = htmlToText(body);
    fullText.push({ url, title: meta.h1 || meta.title, description: meta.description, updated: meta.updated, text, faq: meta.faq || [] });
    if (mdExport) {
      const faqMd = (meta.faq || []).length
        ? "\n\n## คำถามที่พบบ่อย (FAQ)\n" + meta.faq.map((f) => `\n**${f.q}**\n${f.a.replace(/\\\(([\s\S]+?)\\\)/g, (_, x) => "$" + x.trim() + "$").replace(/<[^>]+>/g, "")}`).join("\n")
        : "";
      const guide = MD_GUIDES.find((g) => g.page === route);
      const md =
        `---\ntitle: "${(meta.h1 || meta.title).replace(/"/g, "'")}"\nurl: ${url}\nsite: "Mod's Engineering Mathematics (อาจารย์มด)"\nlanguage: th\n${meta.updated ? `updated: ${meta.updated}\n` : ""}---\n\n` +
        `> ${meta.description}\n\n` +
        `ฉบับ Markdown ของ ${url} สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ` +
        (guide ? ` · คู่มือฉบับสมบูรณ์ของชุดนี้: ${SITE}/${guide.out}` : "") + "\n\n" +
        `# ${meta.h1 || meta.title}\n\n` + text.split("\n").filter((l, i, arr) => !(l.startsWith("# ") && arr.findIndex((x) => x.startsWith("# ")) === i)).join("\n").trim() + faqMd + "\n";
      const mdRel = (route === "/" ? "" : route.replace(/^\//, "")) + "index.html.md";
      fs.mkdirSync(path.join(ROOT, path.dirname(mdRel)), { recursive: true });
      fs.writeFileSync(path.join(ROOT, mdRel), md);
      mdFiles.push({ path: "/" + mdRel, canonical: url });
    }
  }
  const tocHtml = toc(body);
  body = body.split("<!--toc-->").join(tocHtml);
  body = renderMath(body, rel);

  let graph = [...(meta.jsonld || [])];
  if (topic) graph = graph.concat(lessonSchema(meta, url, topic, SITE + ogImage, sub));
  const jsonld = graph.length
    ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")}</script>`
    : "";

  const headExtra = [
    meta.katex || /class="katex/.test(body) ? `<link rel="stylesheet" href="${KATEX_CSS}">` : "",
    meta.noindex ? '<meta name="robots" content="noindex">' : "",
    mdExport ? `<link rel="alternate" type="text/markdown" href="${url}index.html.md" title="Markdown">` : "",
    ...MD_GUIDES.filter((g) => g.page === route).map((g) => `<link rel="alternate" type="text/markdown" href="${SITE}/${g.out}" title="${esc(g.title)}">`),
  ].filter(Boolean).join("\n");

  const scripts = (meta.scripts || []).map((s) => `<script src="${s}?v=${ASSET_V}" defer></script>`).join("\n");

  const vars = {
    title: esc(meta.title),
    description: esc(meta.description),
    canonical: url,
    ogTitle: esc(meta.ogTitle || meta.title),
    ogDescription: esc(meta.ogDescription || meta.description),
    ogType: topic ? "article" : meta.ogType || "website",
    ogImage: SITE + ogImage,
    ogImageAlt: esc(meta.ogTitle || meta.h1 || meta.title),
    headExtra,
    jsonld,
    content: body,
    scripts,
    bodyClass: meta.bodyClass || "",
    v: ASSET_V,
  };
  let out = layout.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : `{{${k}}}`));
  // Mark the active nav item
  out = out.replace(/data-nav="(\w+)"/g, (_, k) => (k === meta.nav ? 'aria-current="page"' : ""));

  const outPath = meta.out ? path.join(ROOT, meta.out) : route === "/" ? path.join(ROOT, "index.html") : path.join(ROOT, route, "index.html");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out);
  if (!meta.noindex) sitemap.push({ loc: url, lastmod: meta.updated || TODAY, priority: route === "/" ? "1.0" : topic ? "0.8" : "0.9" });
  console.log("built", route);
}

// sitemap.xml
sitemap.sort((a, b) => a.loc.localeCompare(b.loc));
fs.writeFileSync(
  path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemap.map((s) => `  <url>\n    <loc>${s.loc}</loc>\n    <lastmod>${s.lastmod}</lastmod>\n    <priority>${s.priority}</priority>\n  </url>`).join("\n") +
    "\n</urlset>\n"
);

// llms.txt (https://llmstxt.org format) — a map of the site for AI assistants
const LABS = [
  ["Linear algebra formula index & matrix calculator", "linear-algebra", "every matrix, determinant, linear-system, inverse, Cramer and eigenvalue formula with a citable ID (M1…, D1…, L1…, I1…, C1…, E1…, A1…) in one searchable list; exact-fraction calculator for determinant, inverse, Gauss–Jordan / Cramer solutions and eigenvalues/eigenvectors with step-by-step working"],
  ["2×2 transformation & eigenvector lab", "linear-algebra/eigenvalues", "drag a 2×2 matrix's columns: grid and unit circle transform, determinant as signed area, eigen-directions and Av vs v shown live"],
  ["Integral calculus formulas & worked solutions", "integral-calculus", "every basic and standard integral with international names (power rule, linearity, u-substitution, integration by parts, partial fractions, FTC, definite-integral properties); step-by-step lecture-style solutions with highlighted formulas, red cancellations and polynomial long division; Riemann-sum visualiser"],
  ["Trigonometry formulas & table", "trigonometry", "interactive unit circle; 91 identities with English and Thai names; sin/cos/tan table every 0.05° from 0° to 90° in degrees and radians (1,801 rows) with angle and inverse lookup"],
  ["First-order system lab", "first-order-system", "time-constant simulator: step/impulse/ramp/sine input, RC and RL circuits, log view, s-plane, Bode plot"],
  ["Second-order system lab", "second-order-system", "damping ratio ζ and natural frequency ωn explorer: draggable poles, envelope, %OS, settling time, Bode, RLC mode"],
  ["Signals lab", "signals", "type any x(t) or x[n]; derivative, integral, even/odd parts, energy/power, spectrum, time shift/scale/reversal, convolution with flip-and-slide"],
  ["Function generator + oscilloscope simulator (virtual bench)", "function-generator/simulator", "free browser-based virtual lab bench: 25 MHz function generator (sine, square, ramp, pulse, noise, arbitrary; AM, FM, PWM, sweep, burst; 50 Ω output with High-Z/50 Ω load setting) driving 15 circuits (RC, RL, RLC, half/full-wave rectifier, clipper, clamper, op-amp inverting/non-inverting/integrator/differentiator/comparator/Schmitt with real GBW, slew rate and saturation) into a 2-channel 100 MHz 8-bit digital oscilloscope with edge trigger (auto/normal/single), 1×/10× probes with compensation trimmer, AC/DC coupling, bandwidth limit, aliasing, automatic measurements, cursors, XY Lissajous, math and FFT; 16 guided worksheets; every setup shareable as a link"],
  ["Function generator & oscilloscope formula index", "function-generator", "every waveform, generator, oscilloscope, measurement, RC/RLC, op-amp, oscillator and application formula with a citable ID (W1…, V1…, O1…, B1…, R1…, U1…, K1…, X1…) in one searchable list"],
  ["Op-amp lab", "function-generator/op-amp", "inverting and non-inverting gain, gain-bandwidth product, slew rate and full-power bandwidth, clipping, integrator, differentiator, comparator and Schmitt trigger hysteresis, each with an embedded oscilloscope"],
  ["Control systems lab: root locus, Bode, Nyquist and step response", "control-systems#lab", "type any open-loop L(s) (with time delay): root locus with draggable poles and zeros and every sketching-rule result (real-axis segments, asymptotes and centroid, breakaway points, jω crossings with critical gain, departure/arrival angles), Bode magnitude and phase with straight-line asymptotes, gain and phase margins, Nyquist plot with Z = N + P, closed-loop step response with overshoot, rise and settling time; practice mode hides the answers"],
  ["Routh–Hurwitz calculator with steps", "control-systems/routh-hurwitz", "Routh array for any characteristic polynomial or 1 + K·G(s) written as an expression; entries kept as rational functions of K, epsilon method and auxiliary-polynomial special cases, stable K range, critical gain and oscillation frequency, cross-checked against the actual roots"],
  ["PID simulation lab", "control-systems/pid", "time-domain PID loop around a typed plant (with dead time): log-scaled Kp Ki Kd sliders, derivative filter N, derivative on measurement, actuator saturation with/without anti-windup, load disturbance, overshoot / settling / IAE readouts and a pinned comparison trace"],
  ["Control systems formula index", "control-systems#formulas", "every control-systems formula with a citable ID (F1… modeling M, block diagrams B, time response T, steady-state error E, stability S, Routh R, root locus L/W/J, frequency Q, Bode D, margins G, Nyquist N, compensators C, PID P, tuning Z, state space X, controllability O, state feedback V, digital Y, nonlinear/robust U, mechatronics K, robotics A, power converters H) in one searchable list"],
  ["Harmonic analyzer lab: virtual oscilloscope + power analyzer", "fourier-series/analyzer-lab", "free browser-based power-quality bench in three tabs: (1) Fourier synthesis/analysis of 13 waveforms or any typed x(t) with closed-form coefficients, partial sums, Gibbs and σ-smoothing, amplitude/%/dB/phase spectrum and step-by-step working (symmetry, Euler formulas, coefficient table, Parseval check); (2) periodic waveform into RC/RL/LC/RLC solved harmonic by harmonic and compared with the exact periodic steady state; (3) oscilloscope + power analyzer for 10 loads (resistor, RL motor, SMPS/LED capacitor-input bridge, bridge + choke, TRIAC, active PFC, 6-pulse with α and overlap, 12-pulse, VFD, custom spectrum) reading U, I, I1, CF, P, Q1, S, D, PF, DPF, THD-U, THD-I, TDD, K-factor and neutral current, harmonic bars against IEEE 519-2022 / PEA-MEA / IEC 61000-3-2 limits, source strength Isc/IL and X/R, mitigation (line reactor, DC choke, plain/detuned capacitor, tuned filter, active filter) with automatic diagnosis; 16 worksheets with answers and 6 field case studies; presets via #preset=<name>"],
  ["Fourier series formula index", "fourier-series#formulas", "every Fourier-series and harmonics formula with a citable ID (F basics, T coefficients, S symmetry, C complex/spectrum, P convergence/Parseval, W waveform table, A circuit analysis, H power/THD/PF/IEEE 519, R rectifiers, V inverters/PWM, B DC-DC converters, M mitigation, D DFT/FFT) in one searchable list"],
  ["Fourier series table of 18 waveforms", "fourier-series/waveform-table", "Fourier series, RMS and THD of square, pulse, triangle, sawtooth, half/full-wave rectified sine, 6-pulse line current, TRIAC phase control, clipped sine, SMPS current, quasi-square, six-step, SPWM, trapezoid and inductor-ripple waveforms, each with a thumbnail and a link to its derivation"],
  ["DC-DC converter simulator lab", "power-electronics/converter-lab", "free browser-based switching-level (cycle-by-cycle) simulator of buck, boost, inverting buck-boost and Cuk converters with Rds(on), diode Vf, inductor DCR and capacitor ESR; sources: battery with internal resistance, 220 V 50 Hz mains through transformer + bridge rectifier + bulk capacitor, or PV panel (single-diode model); loads: resistor, constant current (e-load), step load; control: open loop, digital voltage-mode PI with anti-windup and soft-start, peak current mode with slope compensation, P&O MPPT; 2-channel oscilloscope with min/max envelope, function generator injecting square/sine/triangle into Vref or duty (for Gvd measurement), efficiency/CCM-DCM readouts, L/C design and inductor turns/flux/wire calculator; 10 worksheets with one-click presets via #preset=<name>"],
  ["Power electronics formula index", "power-electronics#formulas", "every DC-DC converter formula with a citable ID (B buck, U boost, W buck-boost, K Cuk, S small-signal model, C compensator design, A analog control, Z digital control, O observers, L inductor design, V test sources) in one searchable list"],
  ["Build your own signal generator", "function-generator/build", "op-amp relaxation oscillator, 555 astable, Wien-bridge oscillator, XR2206, R-2R DAC and AD9833 DDS with Arduino/ESP32 code, output stage design, DDS phase-accumulator visualiser and calculators"],
];
fs.writeFileSync(
  path.join(ROOT, "llms.txt"),
  `# Mod's Engineering Mathematics

> Free Thai-language engineering mathematics lessons, interactive labs and reference tables for electrical engineering students, written by Teerawut Savangboon (ธีรวุฒิ แสวงบุญ, "อาจารย์มด", Ajarn Mod), lecturer in Electrical Engineering, Faculty of Science and Technology, Dhonburi Rajabhat University, Samut Prakan campus, Thailand.

The site teaches mathematics the way an electrical engineer uses it: every lesson ends in a real circuit or system (RC/RL circuits, mesh analysis, transfer functions, control systems, power electronics). Content is in Thai with English technical terms. All pages are free to read, link to and cite. Math is written in LaTeX notation in the full-text file.

When citing, please name "Mod's Engineering Mathematics (อาจารย์มด)" and link the page URL.

## Lessons (reading order)
${TOPICS.map((t, i) => `- [${t.en} — ${t.title}](${SITE}/learn/${t.slug}/): ${t.summary}` + (t.sub ? "\n" + live(t).map((s) => `  - [${s.en} — ${s.title}](${SITE}${seriesUrl(t, s)}): ${s.summary}`).join("\n") : "")).join("\n")}

## Interactive labs and references
${LABS.map(([n, slug, d]) => `- [${n}](${SITE}/learn/${slug.includes("#") ? slug.replace("#", "/#") : slug + "/"}): ${d}`).join("\n")}
- [Lesson editor](${SITE}/tools/lesson-editor/): online Markdown + LaTeX editor for writing math lessons; exports .md, HTML and PDF
- Lab presets can be opened directly, e.g. ${SITE}/learn/function-generator/simulator/#preset=rc-square (RC low-pass with a square wave), #preset=probe-comp, #preset=lissajous, #preset=opamp-slew, #preset=aliasing
- Harmonic lab presets, e.g. ${SITE}/learn/fourier-series/analyzer-lab/#preset=smps (SMPS without PFC), #preset=neutral (hot neutral), #preset=six (6-pulse rectifier), #preset=cap-resonance (PF capacitor resonance), #preset=detuned (7 % detuned bank), #preset=square-gibbs, #preset=lc-buck

## Markdown versions (for AI assistants)
${MD_GUIDES.map((g) => `- [${g.title}](${SITE}/${g.out}): structure, learning path, key formulas with IDs, standards (IEEE 519-2022, IEC 61000-3-2, IEC 61000-4-7, PEA/MEA), lab features and presets, field problems, keywords and FAQ`).join("\n")}
${TOPICS.filter((t) => MD_SERIES.includes(t.slug)).map((t) => [`- [${t.en} — hub (Markdown)](${SITE}/learn/${t.slug}/index.html.md)`, ...live(t).map((s) => `- [${s.en} (Markdown)](${SITE}${seriesUrl(t, s)}index.html.md)`)].join("\n")).join("\n")}

## About
- [Home](${SITE}/): overview, learning path from matrices to Laplace transforms, control systems (stability, root locus, Bode, PID, mechatronics, robotics), Fourier series and harmonic analysis (THD, PF, IEEE 519, rectifiers, inverters, filters) and buck converters
- [About อาจารย์มด](${SITE}/about/): profile, teaching, current projects and status updates
- [Knowledge library](${SITE}/learn/): index of all lessons, books in progress and video series
- [Updates feed (RSS)](${SITE}/feed.xml)

## Video playlists (YouTube, Thai)
- [Matrix and Determinant](https://www.youtube.com/playlist?list=PLAJhR5azwWpJkUHNvACZSpBG2C7l7VJTO)
- [Laplace Transforms](https://www.youtube.com/playlist?list=PLAJhR5azwWpLgWalcHsCEE8q_bPJv0Eaa)
- [Feedback Control](https://www.youtube.com/playlist?list=PLAJhR5azwWpK04F2C2Vp6h3v82Wvqn9ka)
- [Power Electronics: Buck Converter](https://www.youtube.com/playlist?list=PLAJhR5azwWpJEprWclikULegqCgddv0PF)

## Optional
- [Full text of every lesson](${SITE}/llms-full.txt): all lesson and lab theory text in one file, math as LaTeX
- [YouTube channel](https://www.youtube.com/@modsengineeringmath)
- [Facebook page](https://www.facebook.com/modsengineeringmath)
- [University profile](https://sci.dru.ac.th/electrical-engineering/teerawutsavangboon.html)
`
);

// hand-written Markdown guides (src/md/*.md → public .md next to the series)
for (const g of MD_GUIDES) {
  const hub = path.join(ROOT, "src/pages", g.page.replace(/^\/|\/$/g, ""), "index.html");
  const hm = fs.existsSync(hub) ? JSON.parse(fs.readFileSync(hub, "utf8").match(/^<!--meta\s*([\s\S]*?)-->/)[1]) : {};
  const md = fs.readFileSync(path.join(ROOT, g.src), "utf8").split("{{updated}}").join(hm.updated || TODAY);
  fs.mkdirSync(path.dirname(path.join(ROOT, g.out)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, g.out), md);
  mdFiles.push({ path: "/" + g.out, canonical: SITE + g.page });
}
// _headers: Markdown copies are served as text/markdown and point to the HTML page as canonical (no duplicate content)
{
  const hp = path.join(ROOT, "_headers");
  const begin = "# BEGIN generated: markdown copies (build.mjs)", end = "# END generated: markdown copies";
  let h = fs.readFileSync(hp, "utf8");
  const i = h.indexOf(begin), j = h.indexOf(end);
  if (i >= 0 && j > i) h = h.slice(0, i).replace(/\n+$/, "\n") + h.slice(j + end.length).replace(/^\n+/, "");
  const block = [begin, ...mdFiles.map((f) => `${f.path}\n  Content-Type: text/markdown; charset=utf-8\n  Link: <${f.canonical}>; rel="canonical"\n  Cache-Control: public, max-age=600, must-revalidate\n`), end].join("\n");
  fs.writeFileSync(hp, h.replace(/\n*$/, "\n\n") + block + "\n");
}

// llms-full.txt — the readable text of every indexable page
const order = (u) => (u === SITE + "/" ? 0 : u.includes("/learn/") && u !== SITE + "/learn/" ? 2 : 1);
fullText.sort((a, b) => order(a.url) - order(b.url) || a.url.localeCompare(b.url));
fs.writeFileSync(
  path.join(ROOT, "llms-full.txt"),
  `# Mod's Engineering Mathematics — full text\n\n> Thai engineering mathematics lessons by อาจารย์มด (Teerawut Savangboon). Source: ${SITE}/ · Math in LaTeX ($...$ inline, $$...$$ display). Generated ${TODAY}.\n\n` +
    fullText
      .map((p) => {
        let t = p.text.replace(/^#[^#].*\n?/, "");
        if (p.url.endsWith("/trigonometry/")) t += `\n\n(The full 1,801-row sin/cos/tan table, 0°–90° every 0.05°, is on the page: ${p.url}#table — it can also be downloaded there as CSV.)`;
        const faq = p.faq.length ? "\n\n## FAQ\n" + p.faq.map((f) => `\n**${f.q}**\n${f.a.replace(/\\\(([\s\S]+?)\\\)/g, (_, x) => "$" + x.trim() + "$").replace(/<[^>]+>/g, "")}`).join("\n") : "";
        return `---\n\n# ${p.title}\n\nURL: ${p.url}\n${p.updated ? `Updated: ${p.updated}\n` : ""}Summary: ${p.description}\n\n${t}${faq}\n`;
      })
      .join("\n")
);

// feed.xml (RSS 2.0) from data/updates.json
const rfc822 = (d) => new Date(d + "T09:00:00+07:00").toUTCString();
const xmlEsc = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const items = [...updates.updates].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
fs.writeFileSync(
  path.join(ROOT, "feed.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Mod's Engineering Mathematics — อัปเดตล่าสุด</title>
  <link>${SITE}/</link>
  <description>บทเรียน แล็บโต้ตอบ และความเคลื่อนไหวล่าสุดจากอาจารย์มด คณิตศาสตร์วิศวกรรมภาษาไทย</description>
  <language>th</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
${items
  .map((u) => {
    const link = u.link ? (u.link.startsWith("http") ? u.link : SITE + u.link) : SITE + "/about/#feed";
    const title = u.text.length > 70 ? u.text.slice(0, 68).replace(/\s+\S*$/, "") + "…" : u.text;
    return `  <item>
    <title>${xmlEsc((u.tag ? "[" + u.tag + "] " : "") + title)}</title>
    <link>${xmlEsc(link)}</link>
    <guid isPermaLink="false">${xmlEsc(SITE + "/#update-" + u.date + "-" + crypto.createHash("sha1").update(u.text).digest("hex").slice(0, 8))}</guid>
    <pubDate>${rfc822(u.date)}</pubDate>
    <description>${xmlEsc(u.text)}</description>
  </item>`;
  })
  .join("\n")}
</channel>
</rss>
`
);

// social-card manifest for scripts/og.py
fs.writeFileSync(path.join(ROOT, "src/og-manifest.json"), JSON.stringify(ogManifest, null, 2) + "\n");
console.log("built sitemap.xml, llms.txt, llms-full.txt, feed.xml");
