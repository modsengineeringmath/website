---
title: "ฟังก์ชันเวกเตอร์ (Vector-Valued Functions): เส้นโค้งในอวกาศ ความเร็ว ความเร่ง ความยาวส่วนโค้ง และความโค้ง"
url: https://modsengineeringmath.com/learn/multivariable-calculus/vector-functions/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-10-17
---

> ฟังก์ชันเวกเตอร์ r(t) (vector function) คืออะไร เส้นโค้งในอวกาศ (space curve) อนุพันธ์และอินทิกรัลของ r(t) เวกเตอร์สัมผัส ความเร็ว ความเร่ง ความยาวส่วนโค้ง (arc length) ความโค้ง κ (curvature) กรอบ Frenet–Serret T N B torsion และ a_T a_N พร้อมตัวอย่างลูกกระสุน ทางโค้งถนน ทางลาดเกลียว อนุภาคในสนามแม่เหล็ก และแล็บเส้นโค้ง 3 มิติ

ฉบับ Markdown ของ https://modsengineeringmath.com/learn/multivariable-calculus/vector-functions/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# ฟังก์ชันเวกเตอร์ (Vector-Valued Functions): เส้นโค้งในอวกาศ ความเร็ว ความเร่ง ความยาวส่วนโค้ง และความโค้ง

// บทที่ 24.6 · แคลคูลัสเวกเตอร์ · Vector-Valued Functions


ลูกบอลที่ถูกโยน อนุภาคที่ลอยในสนามแม่เหล็ก หัวจับของแขนกลที่ลากเส้นทางหนึ่ง ทางลาดเกลียวของลานจอดรถ ทั้งหมดเคลื่อนที่ในอวกาศ ตำแหน่งของมันคือเวกเตอร์ที่เปลี่ยนตามเวลา เรียกว่าฟังก์ชันเวกเตอร์ (vector-valued function) $\mathbf r(t)$ เมื่อหาอนุพันธ์ได้ความเร็วและความเร่ง เมื่ออินทิเกรตได้ระยะทาง และเมื่อวิเคราะห์รูปร่างของเส้นทางได้ความโค้งและกรอบ Frenet–Serret ที่บอกว่า “เลี้ยวแรงแค่ไหน” หน้านี้มีแล็บที่วาดเส้นโค้ง 3 มิติ พร้อมเวกเตอร์ T N B วงกลมออสคิวเลติง และค่า κ τ แบบเรียลไทม์

สรุปใน 30 วินาที

- $\mathbf r(t) = \langle x(t), y(t), z(t)\rangle$ · ลิมิต อนุพันธ์ อินทิกรัล ทำทีละองค์ประกอบ · $\mathbf v = \mathbf r'$ (สัมผัสเส้นโค้ง) · $\mathbf a = \mathbf r''$

- ความยาวส่วนโค้ง $L = \int_a^b |\mathbf r'(t)|\,dt$ · ความโค้ง $\kappa = \dfrac{|\mathbf r'\times\mathbf r''|}{|\mathbf r'|^3}$ · รัศมี $R = 1/\kappa$

- กรอบ Frenet: $\mathbf T = \mathbf r'/|\mathbf r'|$ · $\mathbf N = \mathbf T'/|\mathbf T'|$ · $\mathbf B = \mathbf T\times\mathbf N$ · $\mathbf a = a_T\mathbf T + a_N\mathbf N$, $a_N = \kappa|\mathbf v|^2$

- ความเร่งทิศ $\mathbf N$ เกิดจากการเลี้ยว แม้อัตราเร็วคงที่ · ตัวอย่าง: โรเตอร์ 3000 rpm รัศมี 15 cm มี $a_N = 14\,800$ m/s² ≈ 1510 g

ระดับพื้นฐาน ปี 1 · แคลคูลัส 1กลาง แคลคูลัส 3 · คณิตศาสตร์วิศวกรรมขั้นสูง พิสูจน์ · ทฤษฎี

## ฟังก์ชันเวกเตอร์และเส้นโค้งในอวกาศ พื้นฐาน

ฟังก์ชันเวกเตอร์รับตัวเลขหนึ่งตัวและให้เวกเตอร์ออกมา ถ้า $t$ คือเวลา $\mathbf r(t)$ คือเวกเตอร์ตำแหน่ง ปลายของมันลากเป็นเส้นโค้งในอวกาศ (space curve) สมการ $x(t),\ y(t),\ z(t)$ เรียกว่าสมการพารามิเตอร์ (parametric equations) เส้นโค้งเดียวกันเขียนด้วยพารามิเตอร์ได้หลายแบบ แต่ทิศการเคลื่อนที่และความเร็วที่ผ่านแต่ละจุดต่างกัน

R1 Vector-valued function ฟังก์ชันเวกเตอร์

$$\mathbf r(t) = x(t)\,\mathbf i + y(t)\,\mathbf j + z(t)\,\mathbf k = \langle x(t),\, y(t),\, z(t)\rangle,\qquad t \in [a, b]$$

ตัวอย่าง: เส้นตรง $\mathbf r_0 + t\mathbf d$ · วงกลม $\langle R\cos t, R\sin t, 0\rangle$ · เกลียว $\langle R\cos t, R\sin t, ct\rangle$ · ลูกกระสุน $\langle v_x t,\ 0,\ v_z t - \tfrac12 gt^2\rangle$

R2 Calculus componentwise แคลคูลัสทำทีละองค์ประกอบ

$$\lim_{t\to a}\mathbf r(t) = \langle \lim x, \lim y, \lim z\rangle,\quad \mathbf r'(t) = \langle x', y', z'\rangle,\quad \int_a^b \mathbf r(t)\,dt = \left\langle \int_a^b x\,dt,\ \int_a^b y\,dt,\ \int_a^b z\,dt\right\rangle$$

ใช้ได้เพราะเวกเตอร์ประกอบด้วยสามองค์ประกอบอิสระ · $\mathbf r$ ต่อเนื่องก็ต่อเมื่อทุกองค์ประกอบต่อเนื่อง · ทฤษฎีบทมูลฐาน: $\int_a^b \mathbf r'\,dt = \mathbf r(b) - \mathbf r(a)$

### แล็บเส้นโค้งในอวกาศ

เลือกเส้นโค้งหรือพิมพ์ $x(t),\ y(t),\ z(t)$ เอง เลื่อนแถบเพื่อเดินไปตามเส้นโค้ง ลูกศรสีส้ม $\mathbf T$ ชี้ทิศเคลื่อนที่ สีฟ้า $\mathbf N$ ชี้เข้าหาศูนย์กลางความโค้ง สีเขียว $\mathbf B$ ตั้งฉากทั้งคู่ วงกลมประสีฟ้าคือวงกลมออสคิวเลติงที่ “แนบ” เส้นโค้งที่สุด ตารางด้านข้างแสดง $\mathbf v$, $\mathbf a$, $\kappa$, $\tau$, $a_T$, $a_N$ และความยาวส่วนโค้ง ส่วนต่าง ๆ ของบทนี้ใช้แล็บเดียวกันนี้อ้างอิง

กรอบ Frenet–Serret (Frenet frame) บนเส้นโค้งในอวกาศ: $\mathbf T$ สัมผัส $\mathbf N$ ชี้เข้าหาจุดศูนย์กลางความโค้ง $\mathbf B$ ตั้งฉากกับระนาบออสคิวเลติง (osculating plane) และวงกลมออสคิวเลติงรัศมี $R = 1/\kappa$

## อนุพันธ์ของ r(t): เวกเตอร์สัมผัส พื้นฐาน

อนุพันธ์ $\mathbf r'(t) = \lim_{h\to0}\dfrac{\mathbf r(t + h) - \mathbf r(t)}{h}$ คืออัตราเปลี่ยนของตำแหน่ง ทางเรขาคณิต $\mathbf r(t + h) - \mathbf r(t)$ คือเวกเตอร์ที่ลากจากจุดหนึ่งไปจุดถัดไปบนเส้นโค้ง เมื่อ $h \to 0$ เวกเตอร์นี้เข้าหาทิศสัมผัส จึงได้ว่า $\mathbf r'(t)$ สัมผัสเส้นโค้งเสมอ และชี้ไปทางที่ $t$ เพิ่ม

R3 Tangent vector and tangent line เวกเตอร์สัมผัสและเส้นสัมผัส

$$\mathbf T(t) = \frac{\mathbf r'(t)}{|\mathbf r'(t)|},\qquad \text{เส้นสัมผัสที่ } t_0:\ \mathbf L(s) = \mathbf r(t_0) + s\,\mathbf r'(t_0)$$

ต้องมี $\mathbf r'(t_0) \ne \mathbf 0$ (เส้นโค้งเรียบ ณ จุดนั้น) · $\mathbf T$ ไม่ขึ้นกับว่าใช้พารามิเตอร์ใด (แต่ทิศอาจกลับ)

R4 Differentiation rules กฎอนุพันธ์ของเวกเตอร์

$$(\mathbf u\cdot\mathbf v)' = \mathbf u'\cdot\mathbf v + \mathbf u\cdot\mathbf v',\qquad (\mathbf u\times\mathbf v)' = \mathbf u'\times\mathbf v + \mathbf u\times\mathbf v',\qquad (f\mathbf u)' = f'\mathbf u + f\mathbf u'$$

ลำดับในผลคูณไขว้ต้องคงเดิม ($\mathbf u'\times\mathbf v$ ไม่ใช่ $\mathbf v\times\mathbf u'$) · ผลสำคัญ: ถ้า $|\mathbf r(t)|$ คงที่ แล้ว $\mathbf r\cdot\mathbf r' = 0$ (เวกเตอร์ขนาดคงที่ตั้งฉากกับอนุพันธ์ของมัน) ซึ่งทำให้ $\mathbf T \perp \mathbf T'$

ตัวอย่าง R-1 · เส้นสัมผัสของ twisted cubic

### $\mathbf r(t) = \langle t,\ t^2,\ t^3\rangle$ หา $\mathbf r'(t)$, $\mathbf T(1)$ และเส้นสัมผัสที่ $t = 1$

- $\mathbf r'(t) = \langle 1,\ 2t,\ 3t^2\rangle$ · ที่ $t = 1$: $\mathbf r(1) = \langle 1,1,1\rangle$ และ $\mathbf r'(1) = \langle 1, 2, 3\rangle$

- $|\mathbf r'(1)| = \sqrt{1 + 4 + 9} = \sqrt{14} \approx 3.742$ · $\mathbf T(1) = \dfrac{1}{\sqrt{14}}\langle 1, 2, 3\rangle \approx \langle 0.267, 0.535, 0.802\rangle$

- เส้นสัมผัส: $\mathbf L(s) = \langle 1, 1, 1\rangle + s\langle 1, 2, 3\rangle$ หรือ $x = 1 + s,\ y = 1 + 2s,\ z = 1 + 3s$

$\mathbf r'(t) = \langle 1, 2t, 3t^2\rangle$ · $\mathbf T(1) = \langle 1,2,3\rangle/\sqrt{14}$

## ความเร็ว ความเร่ง และการเคลื่อนที่ในอวกาศ พื้นฐาน

ถ้า $\mathbf r(t)$ คือตำแหน่ง ความเร็วคืออนุพันธ์ตำแหน่ง และความเร่งคืออนุพันธ์ความเร็ว ตรงกับฟิสิกส์ แต่ในรูปเวกเตอร์ทั้งหมด การเคลื่อนที่ในอวกาศจึงเป็นการวิเคราะห์สามแกนพร้อมกัน และถ้ารู้ความเร่ง (จากแรง $\mathbf F = m\mathbf a$) ก็อินทิเกรตย้อนกลับเพื่อหาความเร็วและตำแหน่งได้

R5 Velocity, speed, acceleration ความเร็ว อัตราเร็ว ความเร่ง

$$\mathbf v(t) = \mathbf r'(t),\qquad v = |\mathbf v(t)| = \sqrt{x'^2 + y'^2 + z'^2},\qquad \mathbf a(t) = \mathbf v'(t) = \mathbf r''(t)$$

ความเร็ว = เวกเตอร์ (สัมผัสเส้นทาง) · อัตราเร็ว = สเกลาร์ ≥ 0 · ย้อนกลับ: $\mathbf v(t) = \mathbf v_0 + \int\mathbf a\,dt$ และ $\mathbf r(t) = \mathbf r_0 + \int\mathbf v\,dt$

R6 Projectile motion (no drag) การเคลื่อนที่แบบกระสุน (ไม่คิดแรงต้าน)

$$\mathbf r(t) = \big\langle v_0\cos\alpha\ t,\ \ 0,\ \ v_0\sin\alpha\ t - \tfrac12 gt^2\big\rangle,\quad t_f = \frac{2v_0\sin\alpha}{g},\quad R = \frac{v_0^2\sin2\alpha}{g},\quad H = \frac{v_0^2\sin^2\alpha}{2g}$$

$\mathbf a = \langle 0, 0, -g\rangle$ คงที่ · พิสัยสูงสุดที่ $\alpha = 45^\circ$ · ถ้ามีแรงต้านอากาศต้องแก้เชิงตัวเลข

R7 Uniform circular motion การเคลื่อนที่เป็นวงกลมสม่ำเสมอ

$$\mathbf r = \langle R\cos\omega t,\ R\sin\omega t\rangle,\quad \mathbf v = R\omega\langle-\sin\omega t,\ \cos\omega t\rangle,\quad \mathbf a = -\omega^2\mathbf r,\quad |\mathbf a| = R\omega^2 = \frac{v^2}{R}$$

$\mathbf a$ ชี้เข้าศูนย์กลาง ($-\mathbf r$) แม้อัตราเร็ว $|\mathbf v| = R\omega$ คงที่ · $\omega$ (rad/s) = $2\pi n/60$ เมื่อ $n$ = rpm

ตัวอย่าง R-2 · ลูกกระสุน (เครื่องกล)

### ขว้างวัตถุด้วยอัตราเร็ว $v_0 = 20$ m/s ทำมุม $60^\circ$ กับแนวราบ ($g = 9.8$ m/s²) หาเวลาตกพื้น พิสัย และความสูงสูงสุด

- $v_x = 20\cos60^\circ = 10$ m/s · $v_z = 20\sin60^\circ = 17.32$ m/s · $\mathbf r(t) = \langle 10t,\ 0,\ 17.32t - 4.9t^2\rangle$

- ตกพื้นเมื่อ $z = 0$: $t(17.32 - 4.9t) = 0$ → $t_f = 17.32/4.9 = 3.535$ s

- พิสัย $R = x(t_f) = 10(3.535) = 35.35$ m (ตรงกับ $v_0^2\sin120^\circ/g = 400(0.866)/9.8$)

- สูงสุดเมื่อ $v_z = 0$: $t = 17.32/9.8 = 1.767$ s · $H = 17.32(1.767) - 4.9(1.767)^2 = 15.31$ m

- ตรวจ: ความเร็วตอนตกพื้น $\mathbf v(t_f) = \langle 10,\ 0,\ -17.32\rangle$ อัตราเร็ว $= 20$ m/s เท่าตอนปล่อย (พลังงานคงตัว) ✓

$t_f = 3.535$ s · พิสัย $35.35$ m · $H = 15.31$ m

ตัวอย่าง R-3 · โรเตอร์หมุน (ไฟฟ้า/เครื่องกล)

### โรเตอร์มอเตอร์รัศมี 15 cm หมุน 3000 rpm หาอัตราเร็วที่ผิวและความเร่งสู่ศูนย์กลาง

- $\omega = 3000\times 2\pi/60 = 314.16$ rad/s

- อัตราเร็วที่ผิว $v = R\omega = 0.15\times314.16 = 47.12$ m/s (≈ 170 km/h)

- ความเร่งสู่ศูนย์กลาง $a = R\omega^2 = 0.15\times314.16^2 = 14\,804$ m/s² หรือเทียบกับแรงโน้มถ่วง $14\,804/9.81 = 1509\,g$

- แรงสู่ศูนย์กลางต่อมวล 1 กรัมของลวดทองแดงที่ปลายโรเตอร์ $= 0.001\times14\,804 = 14.8$ N จึงต้องมีลิ่มและแถบรัดยึดขดลวดกับโรเตอร์ (ความเค้นแปรผันตาม $\omega^2$ ทำให้ความเร็วรอบสูงสุดถูกจำกัดโดยวัสดุ)

$v = 47.1$ m/s · $a = 1.48\times10^4$ m/s² ≈ 1509 g

## ความยาวส่วนโค้ง (Arc Length) กลาง

ระยะทางที่เดินตามเส้นโค้ง คืออินทิกรัลของอัตราเร็วตามเวลา เพราะในช่วงเวลา $dt$ วัตถุเดินได้ $|\mathbf r'|\,dt$ ผลนี้ไม่ขึ้นกับพารามิเตอร์ที่เลือก ถ้าใช้ความยาวส่วนโค้ง $s$ เป็นพารามิเตอร์เอง (arc-length parametrization) จะได้ $|d\mathbf r/ds| = 1$ พอดี ซึ่งเป็นรากฐานของนิยามความโค้ง

R8 Arc length ความยาวส่วนโค้ง

$$L = \int_a^b |\mathbf r'(t)|\,dt = \int_a^b\sqrt{x'(t)^2 + y'(t)^2 + z'(t)^2}\,dt,\qquad s(t) = \int_a^t|\mathbf r'(u)|\,du,\ \ \frac{ds}{dt} = |\mathbf r'(t)|$$

เส้นโค้ง $y = f(x)$: $L = \int_a^b\sqrt{1 + f'(x)^2}\,dx$ · อินทิกรัลมักไม่มีรูปปิด ใช้วิธีเชิงตัวเลข (แล็บใช้ Gauss–Legendre) · พารามิเตอร์ด้วย $s$: $\mathbf r(s)$ มีอัตราเร็ว 1 เสมอ

ตัวอย่าง R-4 · ความยาวเกลียว

### หาความยาวของ $\mathbf r(t) = \langle\cos t,\ \sin t,\ t\rangle$ สำหรับ $0 \le t \le 2\pi$ (หนึ่งรอบ)

- $\mathbf r' = \langle-\sin t,\ \cos t,\ 1\rangle$ · $|\mathbf r'| = \sqrt{\sin^2t + \cos^2t + 1} = \sqrt2$ (คงที่ทั้งเส้น)

- $L = \displaystyle\int_0^{2\pi}\sqrt2\,dt = 2\pi\sqrt2 \approx 8.886$

- ตรวจด้วยเรขาคณิต: คลี่ผิวทรงกระบอกออกเป็นแผ่นราบ เกลียวเป็นเส้นทแยงมุมของสี่เหลี่ยมกว้าง $2\pi$ (เส้นรอบวง) สูง $2\pi$ (ระยะยก) → $\sqrt{(2\pi)^2 + (2\pi)^2} = 2\pi\sqrt2$ ✓

$L = 2\pi\sqrt2 \approx 8.886$

ตัวอย่าง R-5 · ทางลาดเกลียวของลานจอดรถ (โยธา)

### ทางลาดวนรัศมี 15 m ขึ้นสูง 4 m ต่อหนึ่งรอบ หาความยาวทางลาดต่อรอบและความชัน

- $\mathbf r(t) = \langle 15\cos t,\ 15\sin t,\ ct\rangle$ โดยยก 4 m ใน $2\pi$: $c = 4/(2\pi) = 0.6366$ m/rad

- $|\mathbf r'| = \sqrt{15^2 + c^2} = \sqrt{225.405} = 15.0135$ m/rad

- $L = 2\pi\times15.0135 = 94.33$ m ต่อรอบ

- ความชัน (grade) = ระยะยกต่อระยะทางราบ = $4/(2\pi\cdot15) = 4/94.25 = 4.24\%$ (ตามแนวรัศมี 15 m) · ที่ขอบในรัศมีเล็กกว่า ความชันจะมากกว่า (รัศมี 6 m ได้ 10.6%) จึงต้องตรวจเกณฑ์ความชันสูงสุดของทางลาด (มักไม่เกิน 12–15%)

$L = 94.33$ m ต่อรอบ · ความชัน $4.24\%$ ที่รัศมี 15 m

## ความโค้งและกรอบ Frenet–Serret ขั้นสูง

เส้นตรงไม่โค้ง วงกลมรัศมีเล็กโค้งมากกว่าวงกลมรัศมีใหญ่ ความโค้ง (curvature) $\kappa$ วัดว่าทิศสัมผัส $\mathbf T$ หมุนเร็วเท่าไรต่อระยะทางที่เดิน: $\kappa = |d\mathbf T/ds|$ รัศมีความโค้ง $R = 1/\kappa$ คือรัศมีของวงกลมที่แนบกับเส้นโค้งที่สุดที่จุดนั้น (วงกลมออสคิวเลติง) ดังนั้นโค้งแหลม = $\kappa$ มาก = $R$ เล็ก

R9 Curvature ความโค้ง

$$\kappa = \left|\frac{d\mathbf T}{ds}\right| = \frac{|\mathbf T'(t)|}{|\mathbf r'(t)|} = \frac{|\mathbf r'(t)\times\mathbf r''(t)|}{|\mathbf r'(t)|^3},\qquad R = \frac1\kappa$$

สูตรขวาสุดใช้ง่ายที่สุดในทางปฏิบัติ · วงกลมรัศมี $R$: $\kappa = 1/R$ · เส้นตรง: $\kappa = 0$ · เกลียว $\langle a\cos t, a\sin t, bt\rangle$: $\kappa = \dfrac{a}{a^2 + b^2}$

R10 Curvature of a plane curve ความโค้งของเส้นโค้งในระนาบ

$$y = f(x):\quad \kappa = \frac{|f''(x)|}{\big(1 + f'(x)^2\big)^{3/2}};\qquad \mathbf r = \langle x(t), y(t)\rangle:\quad \kappa = \frac{|x'y'' - y'x''|}{(x'^2 + y'^2)^{3/2}}$$

ใช้กับการโก่งตัวของคาน ($\kappa \approx f''$ เมื่อลาดน้อย) และทางโค้งแนวดิ่งของถนน

R11 Frenet–Serret frame กรอบ Frenet–Serret

$$\mathbf T = \frac{\mathbf r'}{|\mathbf r'|},\quad \mathbf N = \frac{\mathbf T'}{|\mathbf T'|},\quad \mathbf B = \mathbf T\times\mathbf N;\qquad \frac{d\mathbf T}{ds} = \kappa\mathbf N,\quad \frac{d\mathbf N}{ds} = -\kappa\mathbf T + \tau\mathbf B,\quad \frac{d\mathbf B}{ds} = -\tau\mathbf N$$

$\mathbf T, \mathbf N, \mathbf B$ เป็นหนึ่งหน่วยและตั้งฉากกันเป็นระบบมือขวา · ระนาบที่ขึงด้วย $\mathbf T, \mathbf N$ คือระนาบออสคิวเลติง · ในเส้นโค้งระนาบ $\mathbf B$ คงที่ และ $\tau = 0$

R12 Torsion ทอร์ชัน (การบิดของเส้นโค้ง)

$$\tau = \frac{(\mathbf r'\times\mathbf r'')\cdot\mathbf r'''}{|\mathbf r'\times\mathbf r''|^2}$$

$\tau = 0$ ทุกจุด ↔ เส้นโค้งอยู่ในระนาบเดียว · $\tau$ เป็นบวกเมื่อบิดแบบมือขวา (เหมือนสกรูมาตรฐาน) · เกลียวมือขวา $\langle a\cos t, a\sin t, bt\rangle$: $\tau = \dfrac{b}{a^2 + b^2}$

R13 Tangential and normal acceleration ความเร่งสัมผัสและความเร่งตั้งฉาก

$$\mathbf a = a_T\,\mathbf T + a_N\,\mathbf N,\quad a_T = \frac{d|\mathbf v|}{dt} = \frac{\mathbf r'\cdot\mathbf r''}{|\mathbf r'|},\quad a_N = \kappa|\mathbf v|^2 = \frac{|\mathbf r'\times\mathbf r''|}{|\mathbf r'|},\quad |\mathbf a|^2 = a_T^2 + a_N^2$$

$a_T$ เปลี่ยนอัตราเร็ว · $a_N$ เปลี่ยนทิศ (มี $v^2/R$ เสมอ) · ความเร่งไม่มีองค์ประกอบตามแนว $\mathbf B$

ตัวอย่าง R-6 · κ และ τ ของเกลียว

### หา $\kappa$ และ $\tau$ ของ $\mathbf r(t) = \langle\cos t,\ \sin t,\ t\rangle$

- $\mathbf r' = \langle-\sin t,\ \cos t,\ 1\rangle$ · $\mathbf r'' = \langle-\cos t,\ -\sin t,\ 0\rangle$ · $\mathbf r''' = \langle\sin t,\ -\cos t,\ 0\rangle$

- $\mathbf r'\times\mathbf r'' = \langle\sin t,\ -\cos t,\ 1\rangle$ · $|\mathbf r'\times\mathbf r''| = \sqrt2$ · $|\mathbf r'| = \sqrt2$

- $\kappa = \dfrac{\sqrt2}{(\sqrt2)^3} = \dfrac{\sqrt2}{2\sqrt2} = \dfrac12$ → รัศมีความโค้ง $R = 2$ (ใหญ่กว่ารัศมีของกระบอก 1 เพราะเกลียวเอียงขึ้น)

- $\tau = \dfrac{(\mathbf r'\times\mathbf r'')\cdot\mathbf r'''}{2} = \dfrac{\sin^2t + \cos^2t + 0}{2} = \dfrac12$ (บวก = เกลียวมือขวา)

- ตรวจด้วยสูตรทั่วไป $a = 1,\ b = 1$: $\kappa = \dfrac{a}{a^2+b^2} = \dfrac12$ และ $\tau = \dfrac{b}{a^2 + b^2} = \dfrac12$ ✓ (ทั้งคู่คงที่ทุกจุด)

$\kappa = \tfrac12$ · $R = 2$ · $\tau = \tfrac12$ (ค่าคงที่ตลอดเส้นโค้ง)

ตัวอย่าง R-7 · ความเร่งสัมผัสและตั้งฉาก

### $\mathbf r(t) = \langle t, t^2, t^3\rangle$ ที่ $t = 1$ หา $a_T,\ a_N,\ \kappa,\ \tau$

- จาก R-1: $\mathbf r'(1) = \langle1, 2, 3\rangle$ · $\mathbf r''(t) = \langle0, 2, 6t\rangle$ → $\mathbf r''(1) = \langle0, 2, 6\rangle$ · $\mathbf r'''= \langle0, 0, 6\rangle$

- $\mathbf r'\cdot\mathbf r'' = 0 + 4 + 18 = 22$ · $|\mathbf r'| = \sqrt{14}$ → $a_T = 22/\sqrt{14} = 5.880$

- $\mathbf r'\times\mathbf r'' = \langle 2\cdot6 - 3\cdot2,\ 3\cdot0 - 1\cdot6,\ 1\cdot2 - 0\rangle = \langle6, -6, 2\rangle$ · $|\,\cdot\,| = \sqrt{76} = 8.718$ → $a_N = 8.718/3.742 = 2.330$

- ตรวจ: $a_T^2 + a_N^2 = 34.57 + 5.43 = 40.0 = |\mathbf r''|^2 = 4 + 36$ ✓

- $\kappa = \dfrac{8.718}{14^{3/2}} = \dfrac{8.718}{52.38} = 0.1664$ ($R = 6.01$) · $\tau = \dfrac{(6, -6, 2)\cdot(0, 0, 6)}{76} = \dfrac{12}{76} = 0.1579$

$a_T = 5.880,\ a_N = 2.330,\ \kappa = 0.1664,\ \tau = 0.1579$ (ผลของแล็บตรงกันทุกค่า)

ตัวอย่าง R-8 · ทางโค้งถนน (โยธา)

### รถวิ่ง 100 km/h ผ่านทางโค้งราบรัศมี 300 m ความเร่งด้านข้างเท่าไร และต้องการแรงเสียดทานข้างเท่าไรถ้าไม่มี superelevation

- อัตราเร็ว $v = 100/3.6 = 27.78$ m/s · วิ่งคงที่ จึง $a_T = 0$ และ $\mathbf a = a_N\mathbf N$

- $\kappa = 1/300 = 0.00333$ m⁻¹ · $a_N = \kappa v^2 = v^2/R = \dfrac{27.78^2}{300} = 2.572$ m/s² ($= 0.262\,g$)

- ถ้าถนนราบ แรงเสียดทานข้างต่อน้ำหนักต้อง $f = a_N/g = 0.262$ (ใกล้ขีดจำกัดของผิวถนนเปียก 0.3–0.4) ในการออกแบบจริงจึงยกขอบนอกทางโค้ง (superelevation $e$) ให้ $e + f = v^2/(gR)$

- ความโค้งของถนน $\kappa$ คือสิ่งที่ผู้ออกแบบกำหนดจากรัศมีต่ำสุดที่ยอมรับได้สำหรับความเร็วออกแบบ ($R_{\min} = v^2/(g(e + f))$)

$a_N = 2.57$ m/s² $\approx 0.26\,g$ · ถ้าไม่ยกขอบ ต้องมีสัมประสิทธิ์เสียดทานข้าง $\ge 0.26$

ตัวอย่าง R-9 · อิเล็กตรอนในสนามแม่เหล็ก (ไฟฟ้า)

### อิเล็กตรอนมี $v_\perp = 2\times10^6$ m/s (ตั้งฉากสนาม) และ $v_\parallel = 10^6$ m/s (ขนานสนาม) ในสนามแม่เหล็กสม่ำเสมอ $B = 1$ mT จงหาวิถี รัศมี คาบ และพิตช์

- แรงลอเรนซ์ $\mathbf F = q\mathbf v\times\mathbf B$ ตั้งฉากกับ $\mathbf v$ จึงไม่ทำงาน อัตราเร็วคงที่ · ในระนาบตั้งฉากสนามเคลื่อนที่เป็นวงกลม ส่วนตามสนามเคลื่อนที่สม่ำเสมอ → วิถีเป็นเกลียว $\mathbf r(t) = \langle R\cos\omega t,\ R\sin\omega t,\ v_\parallel t\rangle$

- จาก $m\dfrac{v_\perp^2}{R} = ev_\perp B$: $R = \dfrac{mv_\perp}{eB} = \dfrac{9.109\times10^{-31}\times2\times10^6}{1.602\times10^{-19}\times10^{-3}} = 1.137\times10^{-2}$ m = 11.4 mm

- ความถี่ไซโคลตรอน $\omega = \dfrac{eB}{m} = 1.759\times10^{8}$ rad/s · คาบ $T = \dfrac{2\pi m}{eB} = 3.572\times10^{-8}$ s ($f \approx 28.0$ MHz) ไม่ขึ้นกับ $v_\perp$

- พิตช์ (ระยะตามสนามต่อหนึ่งรอบ) $p = v_\parallel T = 10^6\times3.572\times10^{-8} = 0.0357$ m = 35.7 mm

- ความโค้งของเกลียวนี้ $\kappa = \dfrac{R}{R^2 + (p/2\pi)^2}$ ซึ่งเป็นเรื่องเดียวกับเกลียวใน R-6 ที่ $a = R,\ b = v_\parallel/\omega$

เกลียวรัศมี $R = 11.4$ mm · คาบ $35.7$ ns (28.0 MHz) · พิตช์ $35.7$ mm

## นำไปใช้ในงานวิศวกรรม พื้นฐาน

| สาขา | ฟังก์ชันเวกเตอร์ / ปริมาณ | ใช้ทำอะไร |

| ไฟฟ้า | $\mathbf r(t)$ ของอนุภาคมีประจุ · $\mathbf F = q\mathbf v\times\mathbf B$ | วิถีเกลียวในสนามแม่เหล็ก มวลสเปกโตรมิเตอร์ ไซโคลตรอน (ตัวอย่าง R-9) |

| ไฟฟ้า | $\mathbf r(t)$ ของลวดขดโซลินอยด์ | ความยาวลวดทั้งหมดจากเกลียว (R8) สำหรับคำนวณความต้านทาน |

| เครื่องกล | $\mathbf r(t)$ ของปลายแขนกล / หัวเลเซอร์ | ความเร็ว $\mathbf v$ และความเร่ง $\mathbf a$ ที่ต้องการจากมอเตอร์ (แขนกล) |

| เครื่องกล | $a_N = \kappa v^2$ | แรงสู่ศูนย์กลางของโรเตอร์ (ตัวอย่าง R-3) และรางลูกเบี้ยว |

| เครื่องกล | เส้นทาง CNC $\mathbf r(s)$ | ความเร็วป้อนต้องลดที่ความโค้งสูงเพื่อจำกัด $a_N$ |

| โยธา | แนวเส้นทางถนน/ทางรถไฟ $\mathbf r(s)$ | รัศมีโค้งต่ำสุด superelevation ความยาวทางลาด (ตัวอย่าง R-5, R-8) |

| โยธา | เส้นโค้งสายเคเบิล/ซุ้มประตู | ความยาวส่วนโค้ง ความโค้งของคานที่โก่ง $\kappa \approx M/EI$ (แล็บคาน) |

## ข้อผิดพลาดที่พบบ่อย พื้นฐาน

- สับสนความเร็วกับอัตราเร็ว · $\mathbf v$ เป็นเวกเตอร์ ส่วน $|\mathbf v|$ เป็นสเกลาร์ และอัตราเร็วคงที่ไม่ได้แปลว่าความเร่งเป็นศูนย์

- ลืมหารด้วย $|\mathbf r'|^3$ ในสูตร $\kappa$ · ผิดบ่อยกว่าที่คิด ตรวจกับวงกลมรัศมี $R$ ต้องได้ $1/R$

- ลืมว่า $\mathbf N$ ไม่ใช่ $\mathbf r''/|\mathbf r''|$ · $\mathbf r''$ มีองค์ประกอบตาม $\mathbf T$ ด้วย ($a_T$) ต้องทำ $\mathbf T'$ หรือ $\mathbf B\times\mathbf T$

- หา $\mathbf T$ ที่จุดที่ $\mathbf r' = \mathbf 0$ · เส้นโค้งไม่เรียบที่จุดนั้น (เช่นยอดแหลม) ทิศสัมผัสไม่นิยาม

- พารามิเตอร์ต่างกัน เข้าใจว่าเส้นโค้งต่างกัน · $\langle t, t^2\rangle$ กับ $\langle 2t, 4t^2\rangle$ เป็นพาราโบลาเดียวกัน ต่างที่ความเร็ว (ความยาวส่วนโค้งและ $\kappa$ เป็นสมบัติของเส้นทาง ไม่ใช่ของพารามิเตอร์)

ไปต่อที่สนามเวกเตอร์ (Divergence และ Curl) ซึ่งแต่ละจุดในอวกาศมีเวกเตอร์ผูกอยู่ แล้วค่อยรวมสนามตามเส้นทางในบทอินทิกรัลตามเส้น

## คำถามที่พบบ่อย

ฟังก์ชันเวกเตอร์ (vector-valued function) คืออะไร?
คือฟังก์ชันที่รับตัวเลขหนึ่งตัว (มักเป็นเวลา $t$) แล้วให้ผลลัพธ์เป็นเวกเตอร์ เช่น $\mathbf r(t) = \langle x(t), y(t), z(t)\rangle$ ซึ่งแทนตำแหน่งของวัตถุที่เคลื่อนที่ในอวกาศ ปลายเวกเตอร์ตำแหน่งวาดเป็นเส้นโค้งเมื่อ $t$ เปลี่ยน ลิมิต อนุพันธ์ และอินทิกรัลทำทีละองค์ประกอบ เช่น $\mathbf r'(t) = \langle x'(t), y'(t), z'(t)\rangle$ คือเวกเตอร์ความเร็ว

ความเร็วกับอัตราเร็ว (velocity vs speed) ต่างกันอย่างไร?
ความเร็ว (velocity) $\mathbf v = \mathbf r'(t)$ เป็นเวกเตอร์ มีทั้งขนาดและทิศ (สัมผัสเส้นทาง) ส่วนอัตราเร็ว (speed) $|\mathbf v| = |\mathbf r'(t)|$ เป็นสเกลาร์ คือขนาดของความเร็ว ความเร่ง $\mathbf a = \mathbf r''(t)$ เป็นเวกเตอร์เช่นกัน ถ้าเคลื่อนที่ด้วยอัตราเร็วคงที่แต่เส้นทางโค้ง ความเร็วยังเปลี่ยนทิศจึงยังมีความเร่ง (ความเร่งสู่ศูนย์กลาง)

คำนวณความยาวส่วนโค้ง (arc length) ของเส้นโค้งอย่างไร?
ใช้ $L = \int_a^b |\mathbf r'(t)|\,dt = \int_a^b \sqrt{x'^2 + y'^2 + z'^2}\,dt$ คืออินทิกรัลของอัตราเร็วตามเวลา ตัวอย่างเกลียว $\langle\cos t, \sin t, t\rangle$ มี $|\mathbf r'| = \sqrt2$ หนึ่งรอบ ($0 \le t \le 2\pi$) ยาว $2\pi\sqrt2 \approx 8.886$ ทางลาดเกลียวรัศมี 15 ม. ขึ้น 4 ม. ต่อรอบยาว 94.33 ม. สูตรนี้ไม่ขึ้นกับวิธีเลือกพารามิเตอร์

ความโค้ง (curvature) κ หาอย่างไร มีความหมายอย่างไร?
ความโค้งคืออัตราที่ทิศทางสัมผัสหมุนต่อความยาวส่วนโค้ง $\kappa = |d\mathbf T/ds|$ คำนวณได้จาก $\kappa = \dfrac{|\mathbf r' \times \mathbf r''|}{|\mathbf r'|^3}$ สำหรับเส้นโค้ง $y = f(x)$ ในระนาบใช้ $\kappa = \dfrac{|f''|}{(1 + f'^2)^{3/2}}$ รัศมีความโค้ง $R = 1/\kappa$ คือรัศมีวงกลมที่แนบกับเส้นโค้งที่สุด ในงานถนนความโค้งกำหนดความเร่งด้านข้าง $a_N = v^2/R$ ที่ผู้โดยสารรู้สึก

กรอบ Frenet–Serret (T, N, B) คืออะไร?
เป็นระบบแกนที่เคลื่อนไปกับเส้นโค้ง ประกอบด้วยเวกเตอร์หนึ่งหน่วยสามตัวตั้งฉากกัน: $\mathbf T$ สัมผัสเส้นโค้ง (ทิศเคลื่อนที่) $\mathbf N = \mathbf T'/|\mathbf T'|$ ชี้เข้าหาจุดศูนย์กลางความโค้ง และ $\mathbf B = \mathbf T \times \mathbf N$ ตั้งฉากกับระนาบออสคิวเลติง ความเร่งแตกเป็น $\mathbf a = a_T\mathbf T + a_N\mathbf N$ โดย $a_T = \tfrac{d|\mathbf v|}{dt}$ (เปลี่ยนอัตราเร็ว) และ $a_N = \kappa|\mathbf v|^2$ (เปลี่ยนทิศ) ส่วน torsion $\tau$ วัดการบิดออกจากระนาบ

มด

อาจารย์มด · ธีรวุฒิ แสวงบุญ
อาจารย์สาขาวิชาวิศวกรรมไฟฟ้า มหาวิทยาลัยราชภัฏธนบุรี สมุทรปราการ · ดูโปรไฟล์

## คำถามที่พบบ่อย (FAQ)

**ฟังก์ชันเวกเตอร์ (vector-valued function) คืออะไร?**
คือฟังก์ชันที่รับตัวเลขหนึ่งตัว (มักเป็นเวลา $t$) แล้วให้ผลลัพธ์เป็นเวกเตอร์ เช่น $\mathbf r(t) = \langle x(t), y(t), z(t)\rangle$ ซึ่งแทนตำแหน่งของวัตถุที่เคลื่อนที่ในอวกาศ ปลายเวกเตอร์ตำแหน่งวาดเป็นเส้นโค้งเมื่อ $t$ เปลี่ยน ลิมิต อนุพันธ์ และอินทิกรัลทำทีละองค์ประกอบ เช่น $\mathbf r'(t) = \langle x'(t), y'(t), z'(t)\rangle$ คือเวกเตอร์ความเร็ว

**ความเร็วกับอัตราเร็ว (velocity vs speed) ต่างกันอย่างไร?**
ความเร็ว (velocity) $\mathbf v = \mathbf r'(t)$ เป็นเวกเตอร์ มีทั้งขนาดและทิศ (สัมผัสเส้นทาง) ส่วนอัตราเร็ว (speed) $|\mathbf v| = |\mathbf r'(t)|$ เป็นสเกลาร์ คือขนาดของความเร็ว ความเร่ง $\mathbf a = \mathbf r''(t)$ เป็นเวกเตอร์เช่นกัน ถ้าเคลื่อนที่ด้วยอัตราเร็วคงที่แต่เส้นทางโค้ง ความเร็วยังเปลี่ยนทิศจึงยังมีความเร่ง (ความเร่งสู่ศูนย์กลาง)

**คำนวณความยาวส่วนโค้ง (arc length) ของเส้นโค้งอย่างไร?**
ใช้ $L = \int_a^b |\mathbf r'(t)|\,dt = \int_a^b \sqrt{x'^2 + y'^2 + z'^2}\,dt$ คืออินทิกรัลของอัตราเร็วตามเวลา ตัวอย่างเกลียว $\langle\cos t, \sin t, t\rangle$ มี $|\mathbf r'| = \sqrt2$ หนึ่งรอบ ($0 \le t \le 2\pi$) ยาว $2\pi\sqrt2 \approx 8.886$ ทางลาดเกลียวรัศมี 15 ม. ขึ้น 4 ม. ต่อรอบยาว 94.33 ม. สูตรนี้ไม่ขึ้นกับวิธีเลือกพารามิเตอร์

**ความโค้ง (curvature) κ หาอย่างไร มีความหมายอย่างไร?**
ความโค้งคืออัตราที่ทิศทางสัมผัสหมุนต่อความยาวส่วนโค้ง $\kappa = |d\mathbf T/ds|$ คำนวณได้จาก $\kappa = \dfrac{|\mathbf r' \times \mathbf r''|}{|\mathbf r'|^3}$ สำหรับเส้นโค้ง $y = f(x)$ ในระนาบใช้ $\kappa = \dfrac{|f''|}{(1 + f'^2)^{3/2}}$ รัศมีความโค้ง $R = 1/\kappa$ คือรัศมีวงกลมที่แนบกับเส้นโค้งที่สุด ในงานถนนความโค้งกำหนดความเร่งด้านข้าง $a_N = v^2/R$ ที่ผู้โดยสารรู้สึก

**กรอบ Frenet–Serret (T, N, B) คืออะไร?**
เป็นระบบแกนที่เคลื่อนไปกับเส้นโค้ง ประกอบด้วยเวกเตอร์หนึ่งหน่วยสามตัวตั้งฉากกัน: $\mathbf T$ สัมผัสเส้นโค้ง (ทิศเคลื่อนที่) $\mathbf N = \mathbf T'/|\mathbf T'|$ ชี้เข้าหาจุดศูนย์กลางความโค้ง และ $\mathbf B = \mathbf T \times \mathbf N$ ตั้งฉากกับระนาบออสคิวเลติง ความเร่งแตกเป็น $\mathbf a = a_T\mathbf T + a_N\mathbf N$ โดย $a_T = \tfrac{d|\mathbf v|}{dt}$ (เปลี่ยนอัตราเร็ว) และ $a_N = \kappa|\mathbf v|^2$ (เปลี่ยนทิศ) ส่วน torsion $\tau$ วัดการบิดออกจากระนาบ
