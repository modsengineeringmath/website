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
    // Topic 4: vectors — redone 2026-10-14 as a 5-part series (basics, products, mechanics, electrical, labs) with the
    // 3D viewer / Vector Studio (assets/vec3d.js), mechanics lab (vec-mech.js), field lab (vec-field.js) and AC phasor lab (ac-phasor.js).
    slug: "vector-algebra",
    title: "เวกเตอร์: จากแรงลัพธ์ถึงเฟสเซอร์",
    en: "Vectors: Forces, Fields & Phasors",
    sym: "→",
    summary: "เวกเตอร์ 2D/3D ทิศทางโคไซน์ แรงลัพธ์ด้วยกฎไซน์-โคไซน์ ระบบแรงและโมเมนต์ การหมุนแกน แขนกล สนามไฟฟ้า-แม่เหล็ก sin/cos สู่เฟสเซอร์และวงจรไฟฟ้ากระแสสลับ พร้อมแล็บ 3 มิติหมุนได้ แล็บกลศาสตร์ แล็บสนาม และแล็บวงจร AC",
    fxHint: "พิมพ์ เช่น cosine law, sine law, direction cosine, moment, couple, rotation, jacobian, coulomb, lorentz, phasor, impedance, kvl",
    parts: [
      { id: "basics", n: 1, title: "พื้นฐานเวกเตอร์ 2D / 3D", en: "Vector Basics", blurb: "ขนาด ทิศทาง พิกัด บวก ลบ คูณสเกลาร์ แตกองค์ประกอบ การฉาย และทิศทางโคไซน์ของแรงสามมิติ" },
      { id: "products", n: 2, title: "ผลคูณของเวกเตอร์", en: "Dot & Cross Products", blurb: "Dot product สำหรับมุม งาน และการฉาย · Cross product สำหรับพื้นที่ แรงบิด และทิศตั้งฉาก" },
      { id: "mechanics", n: 3, title: "แรงและกลศาสตร์", en: "Forces & Mechanics", blurb: "แรงลัพธ์ด้วยกฎของไซน์-โคไซน์ ระบบแรงและโมเมนต์ การหมุนแกนพิกัด และเวกเตอร์ในแขนกล" },
      { id: "electrical", n: 4, title: "ไฟฟ้า: สนามและเฟสเซอร์", en: "Fields & Phasors", blurb: "สนามไฟฟ้า สนามแม่เหล็ก แรงลอเรนซ์ ความสัมพันธ์ sin–cos เฟสเซอร์ และการวิเคราะห์วงจรไฟฟ้ากระแสสลับ" },
      { id: "labs", n: 5, title: "ห้องแล็บและเครื่องมือ", en: "Labs & Tools", blurb: "สตูดิโอเวกเตอร์ 3 มิติ แล็บกลศาสตร์แบบฟิสิกส์ 1 แล็บสนามแบบฟิสิกส์ 2 แล็บวงจร AC และเครื่องมือระดับโลก" },
    ],
    sub: [
      { slug: "foundations", part: "basics", short: "พื้นฐาน 2D/3D", title: "เวกเตอร์ ขนาด ทิศทาง และพิกัด 2D/3D", en: "Vector foundations", sym: "→", prefix: "F", summary: "แยกสเกลาร์กับเวกเตอร์ พิกัด จุดต้นปลาย ขนาด เวกเตอร์หนึ่งหน่วย และทิศทางสามมิติ" },
      { slug: "operations", part: "basics", short: "บวก ลบ สเกลาร์", title: "การบวก ลบ และคูณเวกเตอร์ด้วยสเกลาร์", en: "Vector operations", sym: "+", prefix: "V", summary: "ต่อหัวกับหาง กฎสี่เหลี่ยมด้านขนาน แรงลัพธ์ และการคำนวณทีละองค์ประกอบ" },
      { slug: "components-projection", part: "basics", short: "Component · Projection", title: "องค์ประกอบและการฉายเวกเตอร์", en: "Components & projection", sym: "⊥", prefix: "P", summary: "แตกแรงตามแกน ฉายบนทิศที่ไม่ใช่เวกเตอร์หนึ่งหน่วย และแยกส่วนขนานกับตั้งฉาก" },
      { slug: "direction-cosines", part: "basics", short: "ทิศทางโคไซน์", title: "ทิศทางโคไซน์และการแตกแรงสามมิติ: α β γ มุมราบ-มุมเงย และแรงตามแนวเส้น", en: "Direction cosines & 3D force components", sym: "cos γ", prefix: "K",
        summary: "มุม α β γ กับสามแกน cos²α + cos²β + cos²γ = 1 แตกแรงสองขั้นด้วยมุมราบ-มุมเงย แรงตามสายเคเบิลจากพิกัดสองจุด และฉาก 3 มิติหมุนดูได้" },
      { slug: "dot-product", part: "products", short: "Dot product", title: "ผลคูณจุดและมุมระหว่างเวกเตอร์", en: "Dot product", sym: "·", prefix: "D", summary: "ความหมายเชิงเรขาคณิต พิสูจน์สูตร หามุม ความตั้งฉาก และงานของแรง" },
      { slug: "cross-product", part: "products", short: "Cross product", title: "ผลคูณไขว้ กฎมือขวา พื้นที่และปริมาตร", en: "Cross product", sym: "×", prefix: "C", summary: "คำนวณสามมิติ ลำดับและเครื่องหมาย พื้นที่เวกเตอร์ และผลคูณสามชั้น" },
      { slug: "resultant-forces", part: "mechanics", short: "แรงลัพธ์ · กฎไซน์-โคไซน์", title: "แรงลัพธ์ด้วยกฎของโคไซน์และกฎของไซน์: สี่เหลี่ยมด้านขนาน สามเหลี่ยมแรง และการแตกแรงตามแนวเฉียง", en: "Resultant forces: laws of sines & cosines", sym: "R²", prefix: "R",
        summary: "พิสูจน์กฎโคไซน์จากเวกเตอร์ รวมสองแรงด้วยสามเหลี่ยมแรง หาทิศด้วยกฎไซน์และกรณีกำกวม แตกแรงตามสองแนวที่ไม่ตั้งฉาก สามแรงขึ้นไปด้วยองค์ประกอบ และทฤษฎีของลามี" },
      { slug: "force-systems", part: "mechanics", short: "ระบบแรง · โมเมนต์", title: "ระบบแรง: โมเมนต์ แรงคู่ควบ ระบบสมมูล แรงลัพธ์เดี่ยว และสมดุลของวัตถุแข็งเกร็ง", en: "Force systems, moments & equilibrium", sym: "ΣM", prefix: "S",
        summary: "แรงร่วมจุด แรงในระนาบ โมเมนต์ M = r × F และทฤษฎีวาริยอง แรงคู่ควบ ย้ายแรงเป็นระบบแรง-แรงคู่ควบ แรงลัพธ์เดี่ยว แผนภาพวัตถุอิสระ และแรงปฏิกิริยาของคาน" },
      { slug: "coordinate-rotation", part: "mechanics", short: "หมุนแกนพิกัด", title: "การหมุนแกนพิกัด 2D/3D: เมทริกซ์หมุน มุมออยเลอร์ และการเปลี่ยนกรอบอ้างอิง", en: "Rotation of axes & rotation matrices", sym: "R(θ)", prefix: "T",
        summary: "องค์ประกอบเดียวกันในสองกรอบ หมุนแกนกับหมุนเวกเตอร์ เมทริกซ์หมุนตั้งฉาก RᵀR = I มุมออยเลอร์ Z-Y-X สูตรโรดริเกส พื้นเอียง และกรอบ dq ของมอเตอร์" },
      { slug: "robot-arm", part: "mechanics", short: "แขนกล", title: "เวกเตอร์ในแขนกล: จลนศาสตร์ไปข้างหน้า-ย้อนกลับ Jacobian ความเร็ว และแรงบิดข้อต่อ", en: "Vectors in robot arms", sym: "J", prefix: "A",
        summary: "ตำแหน่งปลายแขนเป็นผลบวกเวกเตอร์ของข้อแขน FK/IK ของแขน 2 ข้อต่อ แขน 3 มิติ Jacobian v = Jθ̇ ภาวะเอกฐาน และ τ = JᵀF สำหรับเลือกมอเตอร์" },
      { slug: "engineering-applications", part: "mechanics", short: "งานวิศวกรรม", title: "การประยุกต์เวกเตอร์ทางวิศวกรรม", en: "Engineering applications", sym: "τ", prefix: "E", summary: "แรงในสายเคเบิล งาน แรงบิด แรงแม่เหล็ก และการเคลื่อนที่ของหุ่นยนต์ พร้อมหน่วยและข้อสมมติ" },
      { slug: "em-fields", part: "electrical", short: "สนามไฟฟ้า-แม่เหล็ก", title: "เวกเตอร์ในสนามไฟฟ้าและสนามแม่เหล็ก: คูลอมบ์ การซ้อนทับ ลอเรนซ์ F = IL × B และแรงบิดของมอเตอร์", en: "Vectors in electromagnetic fields", sym: "E·B", prefix: "M",
        summary: "แรงคูลอมบ์เชิงเวกเตอร์ สนามจากประจุหลายตัว ศักย์สเกลาร์ ฟลักซ์ Φ = B·A แรงลอเรนซ์ แรงบนลวด สนามจากลวดตรง แรงระหว่างลวดขนาน และแรงบิดบนขดลวด τ = m × B" },
      { slug: "sinusoids", part: "electrical", short: "sin · cos ไฟฟ้า AC", title: "ความสัมพันธ์ของ sin และ cos ในไฟฟ้ากระแสสลับ: แอมพลิจูด เฟส นำหน้า-ตามหลัง และค่า RMS", en: "Sine & cosine in AC circuits", sym: "∿", prefix: "W",
        summary: "v(t) = Vm sin(ωt + φ) ความถี่ คาบ ω เปลี่ยน sin เป็น cos ด้วย ±90° หาความต่างเฟสและนำหน้า-ตามหลัง รวม A cos + B sin เป็นไซน์เดียว ค่าเฉลี่ยและ RMS" },
      { slug: "phasors", part: "electrical", short: "เฟสเซอร์", title: "พื้นฐานเฟสเซอร์: เวกเตอร์หมุน สูตรออยเลอร์ จำนวนเชิงซ้อน และการบวกไซน์ด้วยเวกเตอร์", en: "Phasor fundamentals", sym: "V∠φ", prefix: "H",
        summary: "เฟสเซอร์คือลูกศรหมุนที่หยุดไว้ที่ t = 0 สูตรออยเลอร์ รูปสี่เหลี่ยมมุมฉากและเชิงขั้ว บวก คูณ หาร อนุพันธ์เป็น jω และการบวกไซน์ความถี่เดียวกันด้วยกฎโคไซน์" },
      { slug: "ac-circuits", part: "electrical", short: "วิเคราะห์วงจร AC", title: "วิเคราะห์วงจรไฟฟ้ากระแสสลับด้วยเฟสเซอร์: อิมพีแดนซ์ KVL KCL เชิงเวกเตอร์ แผนภาพเฟสเซอร์ กำลัง และเรโซแนนซ์", en: "AC circuit analysis with phasors", sym: "Z", prefix: "Z",
        summary: "อิมพีแดนซ์ R jX_L −jX_C วงจรอนุกรม ขนาน และผสม KVL/KCL เป็นการบวกเวกเตอร์ แผนภาพเฟสเซอร์ กำลังเชิงซ้อน S = VI* การแก้ PF เรโซแนนซ์ และ nodal analysis" },
      { slug: "vector-lab", part: "labs", short: "สตูดิโอเวกเตอร์ 3D", title: "สตูดิโอเวกเตอร์ 2D/3D: วาด หมุนแกน วิเคราะห์ และส่งออกไป GeoGebra MATLAB Python", en: "Vector Studio 2D/3D", sym: "↗", tag: "แล็บโต้ตอบ 3 มิติ",
        summary: "หมุนมุมมอง 3 มิติด้วยการลาก มุมมอง xy xz yz ผลรวม หัวต่อหาง กล่ององค์ประกอบ มุม α β γ projection cross กรอบหมุนมุมออยเลอร์ และเครื่องคิดเลขเวกเตอร์เดิม" },
      { slug: "mechanics-lab", part: "labs", short: "แล็บกลศาสตร์", title: "แล็บกลศาสตร์เสมือน (ฟิสิกส์ 1): โต๊ะแรง สามเหลี่ยมแรง เชือกแขวน พื้นเอียง คาน และแขนกล", en: "Virtual mechanics lab (Physics 1)", sym: "⚖", tag: "แล็บโต้ตอบ + ใบงาน",
        summary: "ทดลองโต๊ะแรงหาแรงสมดุลพร้อม %error กฎไซน์-โคไซน์ ทฤษฎีลามี พื้นเอียงกับแรงเสียดทาน ระบบแรงบนคาน และแขนกล พร้อมใบงานแบบรายงานแล็บ" },
      { slug: "field-lab", part: "labs", short: "แล็บสนามไฟฟ้า", title: "แล็บสนามไฟฟ้าและแม่เหล็กเสมือน (ฟิสิกส์ 2): ประจุจุด เส้นแรง ศักย์ ลวดตัวนำ และแรงลอเรนซ์", en: "Virtual electric & magnetic field lab (Physics 2)", sym: "E", tag: "แล็บโต้ตอบ + ใบงาน",
        summary: "ลากประจุแล้วเห็นเวกเตอร์สนาม เส้นแรง เส้นศักย์เท่า และการซ้อนทับที่จุด P สนามจากลวดตรง แรงระหว่างลวด และอนุภาคในสนาม E กับ B" },
      { slug: "ac-lab", part: "labs", short: "แล็บวงจร AC", title: "แล็บวงจรไฟฟ้ากระแสสลับเสมือน: เฟสเซอร์หมุน บวกไซน์ วงจร RLC และเครื่องคิดเลขจำนวนเชิงซ้อน", en: "Virtual AC circuit lab", sym: "∠", tag: "แล็บโต้ตอบ + ใบงาน",
        summary: "เฟสเซอร์หมุนกับรูปคลื่น บวกไซน์ด้วยเวกเตอร์ วงจร RLC อนุกรม ขนาน และแก้ PF พร้อมแผนภาพเฟสเซอร์ สามเหลี่ยมกำลัง ผลตอบสนองเชิงความถี่ และเครื่องคิดเลขเชิงซ้อน" },
      { slug: "vector-tools", part: "labs", short: "เครื่องมือระดับโลก", title: "เครื่องมือระดับโลกสำหรับเวกเตอร์ สนาม และวงจร AC: PhET GeoGebra Falstad MATLAB Python", en: "World-class vector tools", sym: "⊕", tag: "ฝังเครื่องมือจริง + วิธีใช้",
        summary: "เปิดซิมูเลชัน PhET GeoGebra 3D และ Falstad ในหน้าเดียว วิธีใช้ให้ได้ผลกับบทเรียน ส่งออกเวกเตอร์ไป GeoGebra MATLAB Python และตารางเลือกเครื่องมือ" },
    ],
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
  {
    // Topic 14: Solar PV system design — from the cell to rooftop, battery, air conditioning, solar farms and farming,
    // with the design calculators in assets/pv-calc.js. Same series machinery as power-electronics (parts, live(), formula index).
    slug: "solar-pv",
    title: "ออกแบบระบบโซลาร์เซลล์",
    en: "Solar PV System Design",
    sym: "☀",
    summary: "ออกแบบและใช้งานโซลาร์เซลล์ครบวงจร ตั้งแต่เส้นโค้ง I-V เลือกแผง แสงอาทิตย์ในไทย ระบบ on-grid off-grid hybrid ออกแบบสตริง สายไฟและการป้องกัน แบตเตอรี่ คาดการณ์พลังงานและความคุ้มค่า พยากรณ์ล่วงหน้า MPPT อินเวอร์เตอร์ เลือกตัวควบคุม โซลาร์จ่ายแอร์ โซลาร์ฟาร์ม ปั๊มน้ำเพื่อการเกษตร งานติดตั้งและบำรุงรักษา พร้อมเครื่องคำนวณออกแบบฟรี",
    fxHint: "พิมพ์ เช่น voc, string, psh, pr, kwh, dod, btu, mppt, lcoe, irr, ระยะคืนทุน, แรงดันตก, ปั๊มน้ำ",
    parts: [
      { id: "basics", n: 1, title: "พื้นฐานและการเลือกแผง", en: "Fundamentals & Modules", blurb: "เซลล์แสงอาทิตย์ทำงานอย่างไร เส้นโค้ง I-V ผลของแสงและอุณหภูมิ แสงอาทิตย์ในไทย มุมเอียง เงาบัง และการเลือกแผงจากดาต้าชีต" },
      { id: "system", n: 2, title: "ออกแบบระบบและการจ่ายไฟ", en: "System Design & Grid Connection", blurb: "เลือกชนิดระบบ ขนานไฟกับ กฟภ./กฟน. ออกแบบสตริงให้เข้ากับอินเวอร์เตอร์ สายไฟ อุปกรณ์ป้องกัน กราวด์ และแบตเตอรี่" },
      { id: "forecast", n: 3, title: "คาดการณ์ล่วงหน้าและความคุ้มค่า", en: "Prediction & Economics", blurb: "คำนวณพลังงานที่จะผลิตได้ก่อนติดตั้ง เลือกขนาดจากบิลค่าไฟ ระยะคืนทุน NPV IRR LCOE และพยากรณ์กำลังผลิตรายชั่วโมงถึงรายวัน" },
      { id: "power-electronics", n: 4, title: "อิเล็กทรอนิกส์กำลังในระบบโซลาร์", en: "Power Electronics for PV", blurb: "MPPT อินเวอร์เตอร์เชื่อมกริด PLL การควบคุมกระแส anti-islanding และการเลือกตัวควบคุม ชิป และ MCU ที่ทันสมัยแต่ไม่ตกยุค" },
      { id: "applications", n: 5, title: "งานประยุกต์และภาคปฏิบัติ", en: "Applications & Practice", blurb: "โซลาร์จ่ายแอร์ โซลาร์ฟาร์ม ปั๊มน้ำและเกษตร งานติดตั้ง ทดสอบ บำรุงรักษา วิเคราะห์อาการเสีย และเครื่องมือออกแบบออนไลน์" },
    ],
    sub: [
      { slug: "pv-cell", part: "basics", short: "เซลล์และเส้น I-V", title: "เซลล์แสงอาทิตย์ทำงานอย่างไร: เส้นโค้ง I-V แบบจำลองไดโอด STC NOCT และผลของอุณหภูมิ", en: "How a Solar Cell Works: I-V Curve", sym: "I-V", prefix: "P",
        summary: "รอยต่อ p-n กับแสง แบบจำลองไดโอดเดี่ยว Isc Voc MPP fill factor ประสิทธิภาพ STC กับ NOCT สัมประสิทธิ์อุณหภูมิ บายพาสไดโอด พร้อมแล็บเส้นโค้ง I-V และเงาบัง" },
      { slug: "solar-resource", part: "basics", short: "แสงอาทิตย์ · มุม · เงา", title: "แสงอาทิตย์ในประเทศไทย: ความเข้มแสง ชั่วโมงแดดสูงสุด มุมเอียง ทิศ และเงาบัง", en: "Solar Resource, Orientation & Shading", sym: "PSH", prefix: "R",
        summary: "GHI DNI DHI POA ชั่วโมงแดดสูงสุด (PSH) ข้อมูลแสงของไทย ตำแหน่งดวงอาทิตย์ มุมเอียงและทิศที่เหมาะ ระยะห่างแถวกันเงา และวิธีประเมินเงาบังหน้างาน" },
      { slug: "panel-selection", part: "basics", short: "เลือกแผง", title: "เลือกแผงโซลาร์เซลล์: PERC TOPCon HJT Back-contact Bifacial อ่านดาต้าชีต และมาตรฐาน", en: "Choosing Solar Panels", sym: "Wp", prefix: "M",
        summary: "เทคโนโลยีเซลล์ปัจจุบัน half-cut multi-busbar bifacial อ่านดาต้าชีตทุกบรรทัด tolerance การเสื่อม ประกัน มาตรฐาน IEC 61215 61730 มอก. และเช็กลิสต์เลือกซื้อ" },
      { slug: "system-types", part: "system", short: "ชนิดระบบ · ขนานไฟ", title: "ระบบโซลาร์ On-grid Off-grid Hybrid และการขนานไฟกับ กฟภ. กฟน.", en: "System Types & Grid Connection", sym: "⇄", prefix: "S",
        summary: "เปรียบเทียบ on-grid off-grid hybrid และระบบ DC ตรง zero export net billing ขั้นตอนขออนุญาต กฟภ. กฟน. กกพ. ท้องถิ่น และการเลือกระบบตามรูปแบบการใช้ไฟ" },
      { slug: "string-sizing", part: "system", short: "ออกแบบสตริง", title: "ออกแบบสตริงและจับคู่อินเวอร์เตอร์: Voc ตอนหนาว ช่วง MPPT กระแส และ DC/AC ratio", en: "String Sizing & Inverter Matching", sym: "Ns", prefix: "D",
        summary: "คำนวณจำนวนแผงต่ออนุกรมสูงสุดต่ำสุด สตริงขนานต่อ MPPT ตรวจกระแส Isc DC/AC ratio และ clipping พร้อมเครื่องคำนวณและตัวอย่างระบบ 5 kW 10 kW และ 100 kW" },
      { slug: "wiring-protection", part: "system", short: "สายไฟ · ป้องกัน", title: "สายไฟ ฟิวส์ เบรกเกอร์ SPD กราวด์ และการต่อเข้าตู้ไฟ สำหรับระบบโซลาร์", en: "Wiring, Protection & Earthing", sym: "⏚", prefix: "W",
        summary: "สาย PV1-F ขั้วต่อ MC4 แรงดันตก ฟิวส์สตริง DC isolator SPD Type 1/2 RCD Type A/B กราวด์และ equipotential bonding การต่อเข้าตู้ไฟบ้าน ไฟไหม้ DC และ rapid shutdown" },
      { slug: "battery-storage", part: "system", short: "แบตเตอรี่", title: "แบตเตอรี่สำหรับโซลาร์: LiFePO4 ขนาด kWh DoD C-rate BMS และระบบสำรองไฟ", en: "Battery Storage for PV", sym: "kWh", prefix: "B",
        summary: "เคมีแบตเตอรี่ LFP NMC ตะกั่วกรด โซเดียมไอออน ขนาดตามพลังงานกลางคืนและวันสำรอง DoD C-rate อายุรอบ BMS ระบบ 48 V กับ high voltage ความปลอดภัย และความคุ้มค่า" },
      { slug: "energy-yield", part: "forecast", short: "คาดการณ์พลังงาน", title: "คาดการณ์พลังงานที่ผลิตได้: Performance Ratio ห่วงโซ่การสูญเสีย และ kWh/kWp ในไทย", en: "Energy Yield Prediction", sym: "PR", prefix: "E",
        summary: "สมการพลังงาน E = P·H·PR แยกการสูญเสียทีละขั้น อุณหภูมิ ฝุ่น สาย อินเวอร์เตอร์ clipping การเสื่อมรายปี P50 P90 รายเดือน และการใช้ PVGIS PVsyst SAM" },
      { slug: "load-sizing", part: "forecast", short: "ขนาดจากบิลค่าไฟ", title: "เลือกขนาดระบบจากบิลค่าไฟและโปรไฟล์โหลด: ใช้เองกลางวัน ส่งคืนกริด และแบตเตอรี่", en: "Sizing from Bills & Load Profile", sym: "kWp", prefix: "L",
        summary: "อ่านบิลค่าไฟ แยกโหลดกลางวันกลางคืน self-consumption self-sufficiency โปรไฟล์บ้าน ร้านค้า โรงงาน TOU ความต้องการพลังไฟฟ้า และตัวอย่างเลือกขนาด 3 กรณี" },
      { slug: "economics", part: "forecast", short: "ความคุ้มค่า", title: "ความคุ้มค่าของโซลาร์เซลล์: ระยะคืนทุน NPV IRR LCOE และการวิเคราะห์ความไว", en: "Economics: Payback, NPV, IRR, LCOE", sym: "฿", prefix: "F",
        summary: "ต้นทุนระบบ ผลประหยัดรายปี ระยะคืนทุนอย่างง่ายและคิดลด NPV IRR LCOE ค่าเสื่อม การเปลี่ยนอินเวอร์เตอร์ ภาษีและสินเชื่อ และการวิเคราะห์ความไวพร้อมเครื่องคำนวณ" },
      { slug: "forecasting-monitoring", part: "forecast", short: "พยากรณ์ · เฝ้าติดตาม", title: "พยากรณ์กำลังผลิตโซลาร์ล่วงหน้าและการเฝ้าติดตาม: clear-sky พยากรณ์อากาศ ML และตรวจจับความผิดปกติ", en: "PV Forecasting & Monitoring", sym: "ŷ", prefix: "A",
        summary: "ระยะพยากรณ์นาทีถึงวัน แบบจำลอง clear-sky persistence NWP ดาวเทียม machine learning ตัวชี้วัด MAE RMSE skill score ระบบเฝ้าติดตาม KPI และตรวจจับความผิดปกติอัตโนมัติ" },
      { slug: "mppt", part: "power-electronics", short: "MPPT", title: "MPPT ติดตามจุดกำลังสูงสุด: P&O Incremental Conductance เงาบังบางส่วน และ Global MPPT", en: "Maximum Power Point Tracking", sym: "MPP", prefix: "T",
        summary: "ทำไมต้องมีคอนเวอร์เตอร์ระหว่างแผงกับโหลด จุดทำงานกับความต้านทาน P&O InC ขนาดก้าว ความถี่ ประสิทธิภาพ MPPT เงาบังกับหลายยอด global scan และโค้ดตัวอย่าง พร้อมซิมูเลเตอร์" },
      { slug: "pv-inverter", part: "power-electronics", short: "อินเวอร์เตอร์", title: "อินเวอร์เตอร์โซลาร์: โครงสร้าง Boost + H-bridge PLL ควบคุมกระแสกริด Anti-islanding และมาตรฐาน", en: "PV Inverters & Grid-Tie Control", sym: "DC→AC", prefix: "V",
        summary: "string micro optimizer central โครงสร้างสองขั้น DC-link SPWM ฟิลเตอร์ L LCL PLL ควบคุมกระแสแบบ PR และ dq anti-islanding grid code ride-through Volt-VAR และฮาร์มอนิก" },
      { slug: "controller-selection", part: "power-electronics", short: "เลือกตัวควบคุม", title: "เลือกตัวควบคุมโซลาร์: ชาร์จคอนโทรลเลอร์ อินเวอร์เตอร์ ชิป และ MCU รุ่นปัจจุบันกับรุ่นที่แข็งแกร่งไม่ตกยุค", en: "Choosing Solar Controllers, Chips & MCUs", sym: "IC", prefix: "C",
        summary: "PWM กับ MPPT ชาร์จคอนโทรลเลอร์ เกณฑ์เลือกอินเวอร์เตอร์ on-grid hybrid ชิป MPPT ชาร์จเจอร์ gate driver MCU C2000 STM32G4 dsPIC33 ESP32 การสื่อสาร Modbus CAN และการวางแผนไม่ให้ตกยุค" },
      { slug: "solar-air-conditioner", part: "applications", short: "โซลาร์จ่ายแอร์", title: "โซลาร์เซลล์จ่ายแอร์: คำนวณ BTU เป็น kW ขนาดแผง แอร์อินเวอร์เตอร์ แอร์ DC/AC ไฮบริด และกระแสกระชาก", en: "Solar Power for Air Conditioning", sym: "❄", prefix: "H",
        summary: "ภาระความเย็น BTU COP EER SEER แอร์เบอร์ 5 กำลังไฟจริงตลอดวัน ทำไมแอร์กับโซลาร์เข้ากันดี วิธีต่อแบบ on-grid hybrid และแอร์โซลาร์ DC การเลือกขนาดและตัวอย่าง" },
      { slug: "solar-farm", part: "applications", short: "โซลาร์ฟาร์ม", title: "ออกแบบโซลาร์ฟาร์ม: ผังแผง ระยะห่างแถว GCR Tracker อินเวอร์เตอร์ หม้อแปลง และการเชื่อมต่อระบบ", en: "Utility-Scale Solar Farm Design", sym: "MW", prefix: "G",
        summary: "ขั้นตอนพัฒนาโครงการ เลือกที่ดิน ผังและ GCR fixed tilt กับ single-axis tracker bifacial central กับ string inverter MV สถานีไฟฟ้า SCADA grid code โซลาร์ลอยน้ำ และพลังงานต่อไร่" },
      { slug: "solar-agriculture", part: "applications", short: "ปั๊มน้ำ · เกษตร", title: "โซลาร์เพื่อการเกษตร: ปั๊มน้ำโซลาร์ คำนวณ Head และอัตราไหล Agrivoltaics และฟาร์มอัจฉริยะ", en: "Solar Pumping & Agrivoltaics", sym: "Q·H", prefix: "K",
        summary: "ความต้องการน้ำของพืช กำลังปั๊ม ρgQH หัวสูบรวม ปั๊ม DC บัสเลส ปั๊ม AC ผ่าน VFD ถังเก็บน้ำแทนแบตเตอรี่ โซลาร์ร่วมกับเกษตร โรงเรือน ฟาร์มปศุสัตว์และประมง และ IoT" },
      { slug: "installation-maintenance", part: "applications", short: "ติดตั้ง · บำรุงรักษา", title: "ติดตั้ง ทดสอบ ส่งมอบ และบำรุงรักษาระบบโซลาร์: IEC 62446 I-V tracer ภาพความร้อน และวิเคราะห์อาการเสีย", en: "Installation, Commissioning & O&M", sym: "✓", prefix: "I",
        summary: "หลังคาและโครงยึด ขั้นตอนติดตั้งปลอดภัย การทดสอบก่อนจ่ายไฟ Voc Isc ฉนวน I-V curve ภาพถ่ายความร้อน ล้างแผง ตารางบำรุงรักษา และตารางอาการเสีย 20 แบบ" },
      { slug: "design-lab", part: "applications", short: "เครื่องมือออกแบบ", title: "เครื่องมือออกแบบระบบโซลาร์ออนไลน์: สตริง พลังงาน แบตเตอรี่ แอร์ ปั๊มน้ำ สายไฟ และความคุ้มค่า", en: "Solar PV Design Calculator", sym: "▶", tag: "เครื่องคำนวณ 9 ตัว",
        summary: "รวมเครื่องคำนวณทุกตัวในหน้าเดียว: แล็บเส้น I-V ขนาดจากบิล ออกแบบสตริง คาดการณ์พลังงาน แบตเตอรี่ แอร์ ปั๊มน้ำ แรงดันตก และความคุ้มค่า พร้อมใบงานฝึกออกแบบ" },
    ],
  },
  {
    // Topic 15: Home EV charging — portable (Mode 2) "slow" charging from a house socket, the home wallbox (Mode 3),
    // the house wiring behind it, and how solar PV, air conditioning and the car share one supply. Tools in assets/ev-calc.js.
    slug: "ev-charging",
    title: "ระบบชาร์จรถยนต์ไฟฟ้าที่บ้าน",
    en: "Home EV Charging",
    sym: "🔌",
    summary: "ชาร์จช้าด้วยสายชาร์จพกพาจากเต้ารับบ้าน (Mode 2) กับชาร์จเร็วที่บ้านด้วยวอลล์บ็อกซ์ (Mode 3) ตั้งแต่ kW กับ kWh แบตเตอรี่ CC-CV สัญญาณ Control Pilot ขนาดมิเตอร์ สายไฟ เบรกเกอร์ RCD Type B กราวด์ ค่าไฟ TOU และการใช้โซลาร์ แอร์ และรถ EV ร่วมกันในบ้านเดียว พร้อมเครื่องคำนวณและซิมูเลเตอร์พลังงานบ้าน 24 ชั่วโมง",
    fxHint: "พิมพ์ เช่น kwh, mode 2, wallbox, duty, control pilot, rcd, มิเตอร์, แรงดันตก, tou, solar, แอร์, เวลาชาร์จ",
    parts: [
      { id: "basics", n: 1, title: "พื้นฐานการชาร์จ", en: "Charging Fundamentals", blurb: "กำลังกับพลังงาน โหมดและระดับการชาร์จ AC กับ DC เครื่องชาร์จในรถ หัวชาร์จ แบตเตอรี่ลิเทียม CC-CV และการคำนวณเวลาชาร์จ" },
      { id: "home", n: 2, title: "ชาร์จที่บ้าน: ชาร์จช้าและชาร์จเร็ว", en: "Home Charging Equipment & Wiring", blurb: "สายชาร์จพกพาเสียบเต้ารับบ้าน วอลล์บ็อกซ์ 7.4–22 kW สัญญาณ Control Pilot ระบบไฟบ้าน มิเตอร์ สายไฟ เบรกเกอร์ RCD กราวด์ และมาตรฐานความปลอดภัย" },
      { id: "energy", n: 3, title: "ค่าไฟและพลังงานในบ้าน", en: "Cost & Home Energy", blurb: "ค่าไฟปกติกับ TOU ค่าใช้จ่ายต่อกิโลเมตร และการจัดการพลังงานที่เชื่อมโซลาร์เซลล์ แอร์ และการชาร์จรถเข้าด้วยกัน" },
      { id: "lab", n: 4, title: "เครื่องมือคำนวณและซิมูเลเตอร์", en: "Calculators & Simulator", blurb: "เครื่องคำนวณทุกตัวในหน้าเดียว และซิมูเลเตอร์พลังงานบ้าน 24 ชั่วโมงพร้อมใบงาน" },
    ],
    sub: [
      { slug: "charging-basics", part: "basics", short: "พื้นฐาน · โหมดชาร์จ", title: "พื้นฐานการชาร์จรถยนต์ไฟฟ้า: kW กับ kWh, Mode 1–4, AC กับ DC, On-board Charger และหัวชาร์จ", en: "EV Charging Basics: Modes, AC vs DC, Connectors", sym: "kW", prefix: "C",
        summary: "กำลังกับพลังงาน ชาร์จช้า ชาร์จเร็วที่บ้าน และชาร์จด่วน DC ต่างกันอย่างไร Mode 1–4 ตาม IEC 61851 เครื่องชาร์จในรถ (OBC) หัว Type 2 CCS2 CHAdeMO GB/T และตารางเลือกวิธีชาร์จ" },
      { slug: "battery-charging", part: "basics", short: "แบตเตอรี่ · เวลาชาร์จ", title: "แบตเตอรี่รถ EV กับเวลาชาร์จ: SOC, CC-CV, ประสิทธิภาพ, กำลังที่ลดลงหลัง 80 % และอายุแบตเตอรี่", en: "EV Battery & Charging Time", sym: "SOC", prefix: "B",
        summary: "ความจุ kWh กับ Ah แรงดันแพ็ก SOC กราฟ CC-CV ทำไมชาร์จช้าลงหลัง 80 % การสูญเสียในเครื่องชาร์จ คำนวณเวลาชาร์จจริง อุณหภูมิ และวิธีชาร์จให้แบตอายุยาว" },
      { slug: "portable-charger", part: "home", short: "ชาร์จช้า (Mode 2)", title: "ชาร์จช้าด้วยไฟบ้าน (Mode 2): สายชาร์จพกพา เต้ารับ 16 A กระแสที่ปลอดภัย และความร้อนที่ปลั๊ก", en: "Portable Charger from a House Socket (Mode 2)", sym: "16A", prefix: "M",
        summary: "สายชาร์จพกพา (ICCB) ทำงานอย่างไร เลือกกระแส 8–16 A ให้เหมาะกับเต้ารับและสาย ความร้อนที่หน้าสัมผัส I²R แรงดันตก เต้ารับ IEC 60309 กับเต้ารับบ้าน ข้อห้ามสายพ่วง และเวลาชาร์จ" },
      { slug: "wallbox", part: "home", short: "ชาร์จเร็วที่บ้าน (Wallbox)", title: "ชาร์จเร็วที่บ้านด้วยวอลล์บ็อกซ์ (Mode 3): 7.4 kW 11 kW 22 kW, Control Pilot PWM, Proximity และการเลือกเครื่อง", en: "Home Wallbox Charger (Mode 3) & Control Pilot", sym: "PWM", prefix: "W",
        summary: "วอลล์บ็อกซ์ไม่ใช่ตัวชาร์จแต่เป็นสวิตช์อัจฉริยะ สัญญาณ Control Pilot ±12 V PWM duty → กระแส สถานะ A–F ตัวต้านทาน Proximity 1 เฟสกับ 3 เฟส ขีดจำกัด OBC load balancing และเกณฑ์เลือกซื้อ" },
      { slug: "home-electrical", part: "home", short: "ระบบไฟบ้าน · มิเตอร์ · สาย", title: "เตรียมระบบไฟบ้านสำหรับชาร์จรถ EV: ขนาดมิเตอร์ โหลดรวม สายเมน เบรกเกอร์ ขนาดสาย และแรงดันตก", en: "Home Electrical System for EV Charging", sym: "A", prefix: "H",
        summary: "คำนวณโหลดรวมของบ้านเมื่อเพิ่มรถ EV ดีมานด์แฟกเตอร์ มิเตอร์ 15(45) A กับ 30(100) A เมนเบรกเกอร์ วงจรย่อยเฉพาะ ขนาดสายตามกระแสต่อเนื่อง 125 % แรงดันตก และขั้นตอนขอ กฟภ. กฟน." },
      { slug: "safety-standards", part: "home", short: "ความปลอดภัย · RCD · กราวด์", title: "ความปลอดภัยการชาร์จรถ EV: RCD Type A กับ Type B, กระแสรั่ว DC 6 mA, การต่อลงดิน, มาตรฐาน และอาการเสีย", en: "EV Charging Safety, RCD & Earthing", sym: "⏚", prefix: "P",
        summary: "ไฟดูดเกิดอย่างไร RCD ทำงานด้วยหลักอะไร ทำไมต้อง Type B หรือ RDC-DD 6 mA ระบบ TN-C-S กับ TT หลักดิน แรงดันสัมผัส IP มาตรฐาน IEC 61851 IEC 62196 IEC 60364-7-722 วสท. และตารางอาการเสีย" },
      { slug: "charging-cost", part: "energy", short: "ค่าไฟ · TOU · ต่อกิโลเมตร", title: "ค่าชาร์จรถ EV ที่บ้าน: ค่าไฟอัตราก้าวหน้ากับ TOU, ค่าใช้จ่ายต่อกิโลเมตร และความคุ้มค่าของการเปลี่ยนมิเตอร์", en: "Home Charging Cost: Tariffs, TOU & Cost per km", sym: "฿", prefix: "T",
        summary: "อ่านโครงสร้างค่าไฟบ้าน อัตราก้าวหน้า ค่า Ft VAT อัตรา TOU On-Peak Off-Peak พลังงานต่อ 100 km ค่าใช้จ่ายต่อกิโลเมตรเทียบน้ำมัน และคำนวณว่าเปลี่ยนเป็นมิเตอร์ TOU คุ้มหรือไม่" },
      { slug: "solar-ac-ev", part: "energy", short: "โซลาร์ + แอร์ + รถ EV", title: "โซลาร์เซลล์ แอร์ และรถ EV ในบ้านเดียว: สมดุลพลังงาน การชาร์จจากโซลาร์ส่วนเกิน การจัดการโหลด และ V2H", en: "Solar PV, Air Conditioning & EV in One Home", sym: "☀", prefix: "S",
        summary: "หลักการที่เชื่อมสามระบบ: กำลังทุกขณะต้องสมดุล ไฟไหลไปทางไหน โปรไฟล์โหลด 24 ชั่วโมง self-consumption การชาร์จจากโซลาร์ส่วนเกิน dynamic load balancing แบตเตอรี่บ้าน V2L V2H และขนาดระบบที่เหมาะ" },
      { slug: "ev-lab", part: "lab", short: "เครื่องมือ · ซิมูเลเตอร์", title: "เครื่องมือคำนวณการชาร์จรถ EV ที่บ้าน และซิมูเลเตอร์พลังงานบ้าน 24 ชั่วโมง (โซลาร์ + แอร์ + รถ)", en: "Home EV Charging Calculators & Energy Simulator", sym: "▶", tag: "เครื่องคำนวณ 7 ตัว + ซิมูเลเตอร์",
        summary: "เวลาชาร์จ สายชาร์จพกพา Control Pilot ระบบไฟบ้าน ขนาดสายและแรงดันตก ค่าไฟและ TOU และซิมูเลเตอร์ที่จำลองโซลาร์ แอร์ และรถ EV ทุก 15 นาทีตลอดวัน พร้อมใบงาน" },
    ],
  },
  {
    // Topic 16: Power systems & protection (a preparation course): structure, phasors and three-phase, per-unit,
    // transformers and lines, faults and symmetrical components, protection, overcurrent coordination, earthing. Tools in assets/ps-calc.js.
    slug: "power-systems",
    title: "ระบบไฟฟ้ากำลังและระบบป้องกัน",
    en: "Power Systems & Protection",
    sym: "⚡",
    summary: "ปูพื้นก่อนเรียนวิชาระบบไฟฟ้ากำลังและการป้องกันระบบไฟฟ้ากำลัง: โครงสร้างระบบไฟฟ้าไทย เฟสเซอร์ สามเฟส กำลังเชิงซ้อน ระบบต่อหน่วย หม้อแปลงและสายส่ง การลัดวงจร องค์ประกอบสมมาตร หลักการป้องกัน CT รีเลย์กระแสเกินและการประสาน การต่อลงดิน รีเลย์ผลต่างและระยะทาง พร้อมแล็บคำนวณ",
    fxHint: "พิมพ์ เช่น per unit, base, fault, mva, %z, symmetrical, sequence, idmt, tms, cti, ct, earth, 87, mho",
    parts: [
      { id: "foundations", n: 1, title: "พื้นฐานระบบไฟฟ้ากำลัง", en: "Foundations", blurb: "ระบบไฟฟ้าตั้งแต่โรงไฟฟ้าถึงบ้าน เฟสเซอร์และสามเฟส กำลังเชิงซ้อน ระบบต่อหน่วย หม้อแปลง และสายส่ง" },
      { id: "faults", n: 2, title: "การลัดวงจร", en: "Fault Analysis", blurb: "คำนวณกระแสลัดวงจรสามเฟสด้วย %Z และ MVA องค์ประกอบสมมาตร และการลัดวงจรไม่สมมาตร" },
      { id: "protection", n: 3, title: "ระบบป้องกัน", en: "Power System Protection", blurb: "หลักการป้องกัน CT VT รีเลย์กระแสเกินและการประสาน การต่อลงดินและความปลอดภัย รีเลย์ผลต่างและรีเลย์ระยะทาง" },
      { id: "lab", n: 4, title: "แล็บคำนวณ", en: "Lab", blurb: "ระบบต่อหน่วย กระแสลัดวงจร กราฟประสานรีเลย์ (TCC) การส่งกำลัง P-δ และองค์ประกอบสมมาตร" },
    ],
    sub: [
      { slug: "power-system-overview", part: "foundations", short: "ภาพรวมระบบไฟฟ้า", title: "ภาพรวมระบบไฟฟ้ากำลัง: ผลิต ส่ง จำหน่าย ระดับแรงดันในประเทศไทย และทำไมต้องส่งด้วยแรงดันสูง", en: "Power System Overview", sym: "G", prefix: "G",
        summary: "โรงไฟฟ้า สายส่ง สถานีไฟฟ้า ระบบจำหน่าย 500/230/115 kV 22/33 kV 400/230 V บทบาท กฟผ. กฟภ. กฟน. ทำไมแรงดันสูงลดการสูญเสีย I²R ความถี่ 50 Hz สมดุลกำลัง และแผนที่วิชาที่ต้องเรียน" },
      { slug: "phasors-three-phase", part: "foundations", short: "เฟสเซอร์ · สามเฟส", title: "เฟสเซอร์ อิมพีแดนซ์ กำลังเชิงซ้อน และระบบสามเฟส: Y กับ Δ, √3 และกำลังสามเฟส", en: "Phasors, Complex Power & Three-Phase Systems", sym: "∠", prefix: "A",
        summary: "เขียนไซน์เป็นเฟสเซอร์ อิมพีแดนซ์ R X Z กำลังเชิงซ้อน S = VI* แรงดันเฟสกับแรงดันสาย การต่อ Y และ Δ กำลังสามเฟส √3 V_L I_L cosφ และวงจรสมมูลเฟสเดียว" },
      { slug: "per-unit", part: "foundations", short: "ระบบต่อหน่วย", title: "ระบบต่อหน่วย (Per-Unit System): ค่าฐาน การเปลี่ยนฐาน หม้อแปลง และไดอะแกรมอิมพีแดนซ์", en: "Per-Unit System", sym: "pu", prefix: "U",
        summary: "ทำไมวิศวกรระบบไฟฟ้าใช้ pu เลือก S_base V_base คำนวณ Z_base I_base เปลี่ยนฐานอิมพีแดนซ์ หม้อแปลงหายไปจากวงจร ตัวอย่างระบบเครื่องกำเนิด–หม้อแปลง–สายส่ง–โหลด" },
      { slug: "transformers-lines", part: "foundations", short: "หม้อแปลง · สายส่ง", title: "หม้อแปลงและสายส่งในระบบกำลัง: วงจรสมมูล %Z การควบคุมแรงดัน แบบจำลองสายส่ง และสมการส่งกำลัง P-δ", en: "Transformers, Lines & Power Transfer", sym: "P-δ", prefix: "L",
        summary: "วงจรสมมูลหม้อแปลง %Z จากการทดสอบลัดวงจร voltage regulation การต่อ Dyn11 แบบจำลองสายสั้น ปานกลาง ยาว แรงดันตก ΔV ≈ (RP + XQ)/V และ P = V₁V₂ sin δ / X" },
      { slug: "fault-analysis", part: "faults", short: "กระแสลัดวงจร", title: "คำนวณกระแสลัดวงจร: ลัดวงจรสามเฟสด้วย %Z และวิธี MVA, แหล่งจ่าย หม้อแปลง สาย และค่ายอดที่ไม่สมมาตร", en: "Short-Circuit Calculation", sym: "Isc", prefix: "F",
        summary: "ทำไมต้องรู้กระแสลัดวงจร แหล่งจ่ายต้นทาง หม้อแปลง สายเคเบิล วิธี %Z กับวิธี MVA กระแสลัดวงจรที่ตู้ MDB อัตรา X/R ค่ายอด i_p พิกัดตัดกระแส (Icu kA) และตัวอย่างหม้อแปลง 1,000 kVA" },
      { slug: "symmetrical-components", part: "faults", short: "องค์ประกอบสมมาตร", title: "องค์ประกอบสมมาตรและการลัดวงจรไม่สมมาตร: ลำดับบวก ลบ ศูนย์ ลัดลงดินหนึ่งเฟส สองเฟส และสองเฟสลงดิน", en: "Symmetrical Components & Unbalanced Faults", sym: "a", prefix: "S",
        summary: "ตัวดำเนินการ a เมทริกซ์ Fortescue แยกระบบไม่สมดุลเป็นลำดับ 1 2 0 วงจรลำดับของเครื่องกำเนิด หม้อแปลง Dyn สายส่ง การต่อวงจรลำดับสำหรับ SLG LL DLG และกระแสลงดิน" },
      { slug: "protection-principles", part: "protection", short: "หลักการป้องกัน · CT", title: "หลักการระบบป้องกันไฟฟ้ากำลัง: โซนป้องกัน การเลือกตัด CT VT รหัส ANSI และคุณสมบัติของรีเลย์", en: "Protection Principles, CTs & Relays", sym: "52", prefix: "P",
        summary: "คุณสมบัติ 5 ข้อของระบบป้องกัน โซนป้องกันและการซ้อนทับ ป้องกันหลักกับสำรอง เบรกเกอร์ CT ความอิ่มตัว คลาส 5P20 VT รหัส ANSI 50 51 50N 87 21 27 59 81 และรีเลย์ดิจิทัล" },
      { slug: "overcurrent-coordination", part: "protection", short: "รีเลย์กระแสเกิน · ประสาน", title: "รีเลย์กระแสเกินและการประสานการป้องกัน: กราฟ IDMT IEC 60255, TMS, CTI, ฟิวส์ และเบรกเกอร์ MCB/MCCB", en: "Overcurrent Protection & Coordination", sym: "TCC", prefix: "R",
        summary: "รีเลย์ 50/51 กราฟ Standard Very Extremely Inverse ตั้ง pickup และ TMS ช่วงเวลาประสาน CTI 0.3 s การประสานรีเลย์–ฟิวส์–เบรกเกอร์ กราฟ MCB B C D และตัวอย่างประสาน 3 ระดับ" },
      { slug: "earthing-safety", part: "protection", short: "การต่อลงดิน", title: "การต่อลงดินและการป้องกันไฟดูด: TN-C-S TT IT อิมพีแดนซ์วงรอบ เวลาตัดวงจร RCD แรงดันสัมผัส และหลักดิน", en: "Earthing Systems & Shock Protection", sym: "⏚", prefix: "E",
        summary: "ระบบการต่อลงดิน TN TT IT วงรอบความผิดพร่อง Z_s เงื่อนไขตัดวงจรอัตโนมัติ 0.4 s แรงดันสัมผัส RCD 30 mA ความต้านทานหลักดิน 5 Ω ตามแบบไทย และการวัดด้วย fall-of-potential" },
      { slug: "differential-distance", part: "protection", short: "รีเลย์ผลต่าง · ระยะทาง", title: "รีเลย์ผลต่าง (87) และรีเลย์ระยะทาง (21): ป้องกันหม้อแปลง บัส สายส่ง เปอร์เซ็นต์ไบแอส และโซน Mho", en: "Differential (87) & Distance (21) Protection", sym: "87", prefix: "D",
        summary: "หลักกฎกระแสของเคอร์ชอฟฟ์ในรีเลย์ผลต่าง ไบแอสเปอร์เซ็นต์ inrush และฮาร์มอนิกที่ 2 ป้องกันหม้อแปลง รีเลย์ระยะทาง Z = V/I วงกลม Mho โซน 1 2 3 และระยะเวลาหน่วง" },
      { slug: "power-lab", part: "lab", short: "แล็บคำนวณ", title: "แล็บคำนวณระบบไฟฟ้ากำลังและการป้องกัน: Per-unit กระแสลัดวงจร TCC ประสานรีเลย์ P-δ และองค์ประกอบสมมาตร", en: "Power Systems & Protection Lab", sym: "▶", tag: "เครื่องคำนวณ 6 ตัว + ใบงาน",
        summary: "ระบบต่อหน่วย เปลี่ยนฐาน กระแสลัดวงจรจากแหล่งจ่าย–หม้อแปลง–สาย ประสานรีเลย์ IDMT 3 ระดับบนกราฟ log-log การส่งกำลัง P-δ และแยกองค์ประกอบสมมาตร พร้อมใบงาน" },
    ],
  },
  {
    // Topic 17: Power factor for every level — waveforms, power triangle, correction, billing, harmonics, measurement,
    // with the PF simulator and virtual capacitor bank in assets/pf-lab.js.
    slug: "power-factor",
    title: "เพาเวอร์แฟกเตอร์ เข้าใจได้ทุกระดับ",
    en: "Power Factor Explained",
    sym: "φ",
    summary: "เพาเวอร์แฟกเตอร์ตั้งแต่ภาพเปรียบเทียบง่าย ๆ จนถึงสมการ รูปคลื่น v i p สามเหลี่ยมกำลัง P Q S การปรับปรุงด้วยคาปาซิเตอร์ ตู้คาปาซิเตอร์อัตโนมัติ ค่าปรับ kvar ของการไฟฟ้า ฮาร์มอนิกกับ PF จริง และการวัด พร้อมซิมูเลเตอร์และอุปกรณ์จำลองเสมือนที่ทดลองได้ทันที",
    fxHint: "พิมพ์ เช่น cos, kvar, tan, capacitor, μF, ค่าปรับ, true pf, dpf, thd, wattmeter, resonance, ตู้คาปาซิเตอร์",
    parts: [
      { id: "understand", n: 1, title: "เข้าใจเพาเวอร์แฟกเตอร์", en: "Understanding Power Factor", blurb: "ภาพเปรียบเทียบ สามเหลี่ยมกำลัง รูปคลื่นแรงดัน กระแส และกำลังขณะใดขณะหนึ่ง" },
      { id: "correct", n: 2, title: "ปรับปรุงเพาเวอร์แฟกเตอร์", en: "Power Factor Correction", blurb: "คำนวณคาปาซิเตอร์ ตู้คาปาซิเตอร์อัตโนมัติ และค่าปรับ kvar ในบิลค่าไฟ" },
      { id: "advanced", n: 3, title: "ฮาร์มอนิกและการวัด", en: "Harmonics & Measurement", blurb: "PF จริงเมื่อมีฮาร์มอนิก เรโซแนนซ์ ตู้ detuned และการวัด PF ด้วยเครื่องมือจริง" },
      { id: "lab", n: 4, title: "ซิมูเลเตอร์และอุปกรณ์จำลอง", en: "Simulator & Virtual Equipment", blurb: "ซิมูเลเตอร์ PF แบบเห็นคลื่นและเฟสเซอร์ ตู้คาปาซิเตอร์อัตโนมัติจำลอง และใบงาน" },
    ],
    sub: [
      { slug: "pf-basics", part: "understand", short: "PF คืออะไร", title: "เพาเวอร์แฟกเตอร์คืออะไร: ภาพเปรียบเทียบ สามเหลี่ยมกำลัง P Q S, cos φ, ตามหลังกับนำหน้า", en: "What Is Power Factor?", sym: "S", prefix: "B",
        summary: "เริ่มจากแก้วเบียร์และเรือลากจูง แล้วไปสู่ P (kW) Q (kvar) S (kVA) สามเหลี่ยมกำลัง cos φ โหลดตัวต้านทาน ตัวเหนี่ยวนำ ตัวเก็บประจุ PF ของเครื่องใช้ไฟฟ้า และ PF ต่ำทำให้เสียอะไร" },
      { slug: "waveforms-power", part: "understand", short: "รูปคลื่น v · i · p", title: "เพาเวอร์แฟกเตอร์ในรูปคลื่น: กำลังขณะหนึ่ง p(t) กำลังไหลกลับ เฟสเซอร์ และความหมายของกำลังรีแอกทีฟ", en: "Power Factor in Waveforms & Phasors", sym: "p", prefix: "W",
        summary: "คูณ v(t) กับ i(t) ทีละจุด ได้ p(t) ที่มีค่าเฉลี่ยคือ P และแกว่งด้วยความถี่สองเท่า กำลังไหลกลับไปมา พลังงานที่เก็บในสนามแม่เหล็กและไฟฟ้า เฟสเซอร์ และพิสูจน์ P = VI cos φ" },
      { slug: "pf-correction", part: "correct", short: "คำนวณคาปาซิเตอร์", title: "ปรับปรุงเพาเวอร์แฟกเตอร์ด้วยคาปาซิเตอร์: Q_c = P(tan φ₁ − tan φ₂), kvar เป็น μF, กระแสลด การสูญเสียลด และ kVA ที่ได้คืน", en: "Power Factor Correction Calculation", sym: "Qc", prefix: "C",
        summary: "สูตรขนาดคาปาซิเตอร์ ตารางตัวคูณ kvar/kW แปลง kvar เป็น μF ทั้ง 1 เฟส สามเฟส Y Δ กระแสสายลดลงเท่าไร การสูญเสียลดตาม 1/PF² kVA หม้อแปลงที่ได้คืน แรงดันเพิ่ม และการชดเชยมอเตอร์รายตัว" },
      { slug: "capacitor-bank", part: "correct", short: "ตู้คาปาซิเตอร์", title: "ตู้คาปาซิเตอร์อัตโนมัติ: PF Controller ขั้นสวิตช์ C/k คอนแทกเตอร์ ตัวต้านทานคายประจุ กระแสพุ่งเข้า และการบำรุงรักษา", en: "Automatic Capacitor Banks", sym: "C", prefix: "K",
        summary: "ส่วนประกอบของตู้ คอนโทรลเลอร์วัดและตัดต่ออย่างไร ค่า C/k การแบ่งขั้น 1:1:2:2 คอนแทกเตอร์สำหรับคาปาซิเตอร์ inrush ตัวต้านทานคายประจุ แรงดันเกิน การตรวจเช็กประจำปี และอาการเสีย" },
      { slug: "pf-billing", part: "correct", short: "ค่าปรับ kvar ในบิล", title: "เพาเวอร์แฟกเตอร์กับค่าไฟ: ค่าปรับ kvar ส่วนที่เกิน 61.97 % ของ kW ความต้องการพลังไฟฟ้า และความคุ้มค่าของตู้คาปาซิเตอร์", en: "Power Factor & the Electricity Bill", sym: "฿", prefix: "T",
        summary: "ผู้ใช้ไฟประเภทใดเสียค่าเพาเวอร์แฟกเตอร์ ทำไมเกณฑ์คือ PF 0.85 คำนวณ kvar ที่ถูกเรียกเก็บ ค่าความต้องการพลังไฟฟ้า และระยะคืนทุนของตู้คาปาซิเตอร์จากบิลจริง" },
      { slug: "harmonics-true-pf", part: "advanced", short: "PF จริง · ฮาร์มอนิก", title: "PF จริงกับฮาร์มอนิก: Displacement PF, Distortion PF, THD, เรโซแนนซ์ของคาปาซิเตอร์ และตู้ Detuned 7 %", en: "True Power Factor & Harmonics", sym: "THD", prefix: "H",
        summary: "ทำไมโหลดอิเล็กทรอนิกส์มี cos φ ≈ 1 แต่ PF จริงแค่ 0.6 PF = DPF/√(1+THD²) คาปาซิเตอร์ช่วยไม่ได้ เรโซแนนซ์ h = √(S_sc/Q_c) ตู้ detuned 7 % 14 % active filter และ PFC" },
      { slug: "pf-measurement", part: "advanced", short: "การวัด PF", title: "วัดเพาเวอร์แฟกเตอร์: แคลมป์มิเตอร์วัดกำลัง เพาเวอร์มิเตอร์ วัตต์มิเตอร์สองตัว และการอ่านมิเตอร์ของการไฟฟ้า", en: "Measuring Power Factor", sym: "W", prefix: "M",
        summary: "วัด P Q S PF ด้วยแคลมป์มิเตอร์ เพาเวอร์อนาไลเซอร์ และมิเตอร์ดิจิทัล วิธีวัตต์มิเตอร์สองตัว tan φ = √3(W₁−W₂)/(W₁+W₂) ทิศ CT ที่กลับข้าง การบันทึกโหลด และเช็กลิสต์ก่อนออกแบบตู้" },
      { slug: "pf-lab", part: "lab", short: "ซิมูเลเตอร์ PF", title: "ซิมูเลเตอร์เพาเวอร์แฟกเตอร์: รูปคลื่น เฟสเซอร์ สามเหลี่ยมกำลัง มิเตอร์เสมือน และตู้คาปาซิเตอร์อัตโนมัติจำลอง", en: "Power Factor Simulator & Virtual Capacitor Bank", sym: "▶", tag: "ซิมูเลเตอร์ + อุปกรณ์จำลอง + ใบงาน 10 ชุด",
        summary: "เลือกโหลดจริง เช่น มอเตอร์ หลอดไฟ ฮีตเตอร์ ไดรเวอร์ LED เปิดคาปาซิเตอร์ทีละขั้น เห็นคลื่น v i p เฟสเซอร์หมุน สามเหลี่ยมกำลัง มิเตอร์ และค่าไฟ พร้อมตู้คาปาซิเตอร์อัตโนมัติจำลองตลอดวันทำงาน" },
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
  // Render in one pass: KaTeX annotations can contain \\ followed by (,
  // which must not be mistaken for a new inline delimiter in rendered output.
  return html.replace(/\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g,
    (_, display, inline) => render(display ?? inline, display !== undefined));
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
      return `<li><a href="#${id}">${stripTags(t.replace(LV_RE, "")).replace(/^\s*\d+\.\s+/, "")}${lv ? `<i class="toc-lv lv-${lv[1]}" aria-hidden="true"></i>` : ""}</a></li>`;
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
  for (const re of [/<div class="trig-lab"/, /<div class="tt-tools"/, /<table class="tt"/, /<div class="tf-filter"/, /<nav class="toc"/, /<nav class="pager"/, /<div class="share"/, /<div class="fx-index"/, /<div class="mx-calc"/, /<div class="la-lab"/, /<div class="mx-prod"/, /<nav class="series-nav"/, /<div class="int-legend"/, /<div class="fgs-bench"/, /<div class="fgs-mini"/, /<div class="fg-calc"/, /<div class="dds-lab"/, /<div class="cs-lab"/, /<div class="rh-calc"/, /<nav class="sn-all"/, /<details class="sn-all"/, /<div class="fs-lab"/, /<ol class="crumbs"/, /<div class="trig-quick"/, /<div class="lesson-meta"/, /<div class="pv-iv"/, /<div class="fg-calc pv-calc"/, /<div class="pe-lab"/, /<div class="vec-lab"/, /<div class="fg-calc ev-calc"/, /<div class="ev-sim"/, /<div class="ev-cp"/, /<div class="fg-calc ps-calc"/, /<div class="ps-tcc"/, /<div class="ps-pd"/, /<div class="pf-sim"/, /<div class="pf-bank"/, /<div class="fg-calc pf-calc"/])
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
const MD_SERIES = ["vector-algebra", "fourier-series", "power-electronics", "solar-pv", "ev-charging", "power-systems", "power-factor"];
const MD_GUIDES = [
  { src: "src/md/vector-algebra.md", out: "learn/vector-algebra/guide.md", page: "/learn/vector-algebra/", title: "Vectors: forces, fields & phasors — learning guide & formula summary (Thai, Markdown)", desc: "2D/3D foundations, projections, direction cosines, dot/cross products, resultant forces with the laws of sines and cosines, moments and equilibrium, rotation matrices and Euler angles, robot-arm kinematics and Jacobian, electric/magnetic field vectors and Lorentz force, sinusoids, phasors and AC circuit analysis, labs and reference sources" },
  { src: "src/md/fourier-series.md", out: "learn/fourier-series/guide.md", page: "/learn/fourier-series/", title: "Fourier series & harmonic analysis — complete guide (Thai, Markdown)",
    desc: "structure, learning path, key formulas with IDs, standards (IEEE 519-2022, IEC 61000-3-2, IEC 61000-4-7, PEA/MEA), lab features and presets, field problems, keywords and FAQ" },
  { src: "src/md/solar-pv.md", out: "learn/solar-pv/guide.md", page: "/learn/solar-pv/", title: "Solar PV system design — complete guide (Thai, Markdown)",
    desc: "19-chapter structure, 10-step design workflow, key formulas with IDs (cell, resource, modules, string sizing, wiring, batteries, yield, economics, forecasting, MPPT, inverters, air conditioning, solar farms, pumping), Thai solar data, worked-example numbers, calculators, standards (IEC 61215/61730/62548/62446/62109/62116, IEEE 1547, PEA/MEA) and FAQ" },
];
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
  ["Vector Studio 2D/3D (rotatable)", "vector-algebra/vector-lab", "free browser-based 3D vector tool in Thai: up to 8 vectors, drag to orbit, xy/xz/yz views, perspective, resultant and head-to-tail polygon, component box, direction angles α β γ and direction cosines, projection, dot/cross products, triple product, rotated frame with Z-Y-X Euler angles, pairwise angle table, shareable link (#studio=…), export to GeoGebra commands, MATLAB/Octave quiver3, Python NumPy/Matplotlib and CSV; plus a step-by-step two-vector calculator"],
  ["Vector formula index (forces, fields & phasors)", "vector-algebra#formulas", "every vector formula with a citable ID: F foundations, V operations, P components/projection, K direction cosines, D dot, C cross, R resultant forces (laws of sines/cosines, oblique resolution, Lami), S force systems (moments, couples, equivalent systems, distributed loads, equilibrium), T rotation of axes (rotation matrices, Euler angles, Rodrigues, Clarke/Park), A robot arms (FK/IK, Jacobian, τ = JᵀF), E engineering applications, M electromagnetic fields (Coulomb, superposition, potential, flux, Lorentz force, F = IL×B, parallel conductors, τ = m×B), W sinusoids (phase, lead/lag, RMS), H phasors, Z AC circuits (impedance, complex power, PF correction, resonance, RC filter, three-phase)"],
  ["Virtual mechanics lab (Physics 1)", "vector-algebra/mechanics-lab", "force table with equilibrant and percent error, force triangle with laws of sines and cosines (including the obtuse-angle arcsin trap) and oblique resolution, two-cable equilibrium with Lami's theorem, inclined plane with rotated axes and static/kinetic friction, beam force system (equivalent force-couple, single resultant, support reactions), two-link robot arm with FK/IK (drag the target), Jacobian, tip velocity and joint torques; worksheets with data tables"],
  ["Virtual electric & magnetic field lab (Physics 2)", "vector-algebra/field-lab", "draggable point charges with field vectors, RK4 field lines, equipotentials and potential map, superposition breakdown at a probe point, Coulomb force on a selected charge, zero-field point, parallel plates; long straight wires with B = μ0I/(2πr), field lines as A_z contours and force per metre between wires; charged particle in uniform E and B (circle, velocity selector, cycloid, E×B drift) with a Boris integrator; 3D superposition scene"],
  ["Virtual AC circuit lab (phasors)", "vector-algebra/ac-lab", "rotating phasor with sine/cosine projections and lead/lag, adding sinusoids as vectors (law of cosines) and why different frequencies cannot be added as phasors, series/parallel RLC and RL∥C power-factor correction with phasor diagram (KVL/KCL polygons), waveforms, power triangle, frequency sweep and resonance, complex-number calculator"],
  ["World-class tools for vectors, fields and AC circuits", "vector-algebra/vector-tools", "click-to-load PhET simulations (Vector Addition, Charges and Fields, Faraday's Electromagnetic Lab, Circuit Construction Kit: AC, Trig Tour), Falstad Circuit Simulator, GeoGebra 3D command table, MATLAB/Octave and Python starter code matching the lessons, and a tool-selection table"],
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
  ["Solar PV design calculators", "solar-pv/design-lab", "free browser-based solar PV design tools (Thai): I-V and P-V curve lab of a 580 Wp module with three bypass-diode substrings, irradiance, temperature and partial shading (shows global vs local MPP that P&O gets stuck on); system size from the electricity bill; string sizing (Voc at minimum temperature, Vmp at hot cell temperature, MPPT window, current per MPPT, DC/AC ratio); energy yield with a loss chain and Performance Ratio for Thai sites by month; battery sizing (kWh, Ah, DoD, C-rate, inverter surge); solar for air conditioners (BTU, SEER, kWp); solar water pump sizing (crop water, total dynamic head, kWp); DC/AC voltage drop and cable size; economics (payback, NPV, IRR, LCOE)"],
  ["Solar PV formula index", "solar-pv#formulas", "every solar PV design formula with a citable ID (P cell & I-V, R solar resource, M modules, S system types, D string sizing, W wiring & protection, B batteries, E energy yield, L load sizing, F economics, A forecasting, T MPPT, V inverters, C controllers, H air conditioning, G solar farms, K pumping & agriculture, I installation & O&M) in one searchable list"],
  ["Home energy simulator: solar PV + air conditioning + EV charging", "ev-charging/ev-lab", "free browser-based 24-hour home energy simulator (15-minute steps, Thai tariffs): PV yield shape, base/morning/evening loads, daytime and bedroom air conditioners, EV daily driving with charging strategies (plug-in on arrival, off-peak timer 22:00, solar-surplus only, solar first then off-peak top-up), home battery, normal vs TOU tariff, export price, main-breaker current check; plus calculators for charging time with CC-CV taper, Mode 2 portable charger socket heating (I²R contact resistance) and voltage drop, Control Pilot PWM duty ↔ current with A–F states and Proximity resistor, home load/meter sizing (15(45) vs 30(100) A), EV circuit breaker/cable/voltage drop, monthly cost normal vs TOU and cost per km, solar share of EV charging"],
  ["EV charging formula index", "ev-charging#formulas", "every home EV charging formula with a citable ID (C basics, B battery & charging time, M Mode 2 portable charger, W wallbox & Control Pilot, H home electrical system, P safety/RCD/earthing, T tariffs, S solar + AC + EV energy management)"],
  ["Overcurrent relay coordination (TCC) lab", "power-systems/overcurrent-coordination", "three IDMT relays (IEC 60255 SI/VI/EI/LTI/DT) with pickup, TMS and instantaneous settings on a log-log time-current plot, operating times and CTI at the chosen fault current, automatic TMS grading"],
  ["Power systems & protection calculators", "power-systems/power-lab", "per-unit bases and change of base, transformer regulation, P-δ power transfer, IEC 60909 style LV short-circuit current (source + transformer + cable, κ and peak i_p, MVA method), symmetrical components with phasor diagrams, SLG/LL/DLG fault currents, IDMT relay time, TN/TT automatic disconnection and touch voltage, percentage-bias differential relay"],
  ["Power systems & protection formula index", "power-systems#formulas", "every formula with a citable ID (G overview, A phasors/three-phase, U per-unit, L transformers/lines, F short circuit, S symmetrical components, P protection/CT, R overcurrent coordination, E earthing, D differential/distance)"],
  ["Power factor simulator & virtual capacitor bank", "power-factor/pf-lab", "animated v(t), i(t), p(t) with negative-power shading, rotating phasors, power triangle, PF dial and digital meters for real loads (heater, induction motor with load-dependent PF, magnetic-ballast fluorescent, SMPS/LED without PFC with harmonics, inverter AC with PFC, fridge, custom R-X) and a 6-step capacitor bank; automatic capacitor bank over a factory day with PF controller, C/k, step arrangements, switching count and Thai kvar penalty; calculators for capacitor kvar/µF, PF penalty and payback, true PF with THD, resonance and detuned banks, motor individual compensation, two-wattmeter method; presets via #preset=<name>"],
  ["Power factor formula index", "power-factor#formulas", "every power factor formula with a citable ID (B basics, W waveforms, C correction, K capacitor banks, T billing, H harmonics, M measurement)"],
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
- Solar PV design calculators (string sizing, energy yield, battery, air conditioner, solar pump, voltage drop, payback/NPV/IRR/LCOE): ${SITE}/learn/solar-pv/design-lab/ ; MPPT switching-level simulation: ${SITE}/learn/power-electronics/converter-lab/#preset=solar-mppt
- Harmonic lab presets, e.g. ${SITE}/learn/fourier-series/analyzer-lab/#preset=smps (SMPS without PFC), #preset=neutral (hot neutral), #preset=six (6-pulse rectifier), #preset=cap-resonance (PF capacitor resonance), #preset=detuned (7 % detuned bank), #preset=square-gibbs, #preset=lc-buck

## Markdown versions (for AI assistants)
${MD_GUIDES.map((g) => `- [${g.title}](${SITE}/${g.out}): ${g.desc}`).join("\n")}
${TOPICS.filter((t) => MD_SERIES.includes(t.slug)).map((t) => [`- [${t.en} — hub (Markdown)](${SITE}/learn/${t.slug}/index.html.md)`, ...live(t).map((s) => `- [${s.en} (Markdown)](${SITE}${seriesUrl(t, s)}index.html.md)`)].join("\n")).join("\n")}

## About
- [Home](${SITE}/): overview, learning path from matrices to Laplace transforms, control systems (stability, root locus, Bode, PID, mechatronics, robotics), Fourier series and harmonic analysis (THD, PF, IEEE 519, rectifiers, inverters, filters), power electronics and solar PV system design (string sizing, batteries, energy yield, MPPT, inverters, solar air conditioning, solar farms, solar pumping), home EV charging (Mode 2/Mode 3, Control Pilot, meters, RCD Type B, TOU, solar + AC + EV), power systems & protection fundamentals (per-unit, short circuit, symmetrical components, relay coordination, earthing) and power factor (correction, capacitor banks, kvar penalty, harmonics) with simulators
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
