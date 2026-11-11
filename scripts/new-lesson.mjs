// สร้างไฟล์บทเรียนใหม่จากแม่แบบ:  node scripts/new-lesson.mjs <course> <เลขหน่วย> <slug> ["ชื่อหน่วย"]
// ตัวอย่าง:  node scripts/new-lesson.mjs control-engineering 3 modelling "แบบจำลองของระบบไฟฟ้าและระบบกล"
// โพสต์เสริม (ไม่มีเลขหน่วย):  node scripts/new-lesson.mjs control-engineering - midterm-review "สรุปก่อนสอบกลางภาค"
import fs from "node:fs";
import path from "node:path";
const [course, no, slug, title] = process.argv.slice(2);
const dir = path.join("content/courses", course || "");
if (!course || !slug || !fs.existsSync(path.join(dir, "course.md"))) { console.error("ใช้: node scripts/new-lesson.mjs <course> <เลขหน่วย หรือ -> <slug> [\"ชื่อหน่วย\"]\nรายวิชาที่มี: " + fs.readdirSync("content/courses").filter((d) => fs.existsSync(path.join("content/courses", d, "course.md"))).join(", ")); process.exit(1); }
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) { console.error("slug ใช้ได้เฉพาะ a-z 0-9 และ -"); process.exit(1); }
const name = (no && no !== "-" ? String(Number(no)).padStart(2, "0") + "-" : "") + slug + ".md";
const out = path.join(dir, name);
if (fs.existsSync(out)) { console.error(out + " มีอยู่แล้ว"); process.exit(1); }
let t = fs.readFileSync(path.join("content/courses/control-engineering/_template.md"), "utf8");
if (title) t = t.replace(/^title: .*$/m, "title: " + title);
fs.writeFileSync(out, t);
console.log("สร้าง " + out + " แล้ว (ยังเป็น draft) แก้เนื้อหา ลบบรรทัด draft: true แล้วรัน node build.mjs");
