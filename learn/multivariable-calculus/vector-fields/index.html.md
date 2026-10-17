---
title: "สนามเวกเตอร์ (Vector Fields): Gradient, Divergence, Curl และสนามอนุรักษ์ (Conservative Field)"
url: https://modsengineeringmath.com/learn/multivariable-calculus/vector-fields/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-10-17
---

> สนามเวกเตอร์ (vector field) คืออะไร ตัวดำเนินการ ∇ (del) ดีเวอร์เจนซ์ (divergence) แสดงการแผ่ออก เคิร์ล (curl) แสดงการหมุน ลาปลาเซียน เอกลักษณ์ curl(grad f) = 0 และ div(curl F) = 0 สนามอนุรักษ์และฟังก์ชันศักย์ (potential function) เส้นกระแส พร้อมตัวอย่างไฟฟ้า ของไหล ความร้อน และแล็บสนามเวกเตอร์ที่วัด div curl บนวงกลม

ฉบับ Markdown ของ https://modsengineeringmath.com/learn/multivariable-calculus/vector-fields/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# สนามเวกเตอร์ (Vector Fields): Gradient, Divergence, Curl และสนามอนุรักษ์ (Conservative Field)

// บทที่ 24.7 · แคลคูลัสเวกเตอร์ · Vector Fields


สนามไฟฟ้ารอบประจุ ความเร็วของน้ำในท่อ ฟลักซ์ความร้อนในแผ่นโลหะ และแรงโน้มถ่วง ล้วนเป็นสนามเวกเตอร์ (vector field) คือการผูกลูกศรหนึ่งตัวไว้กับทุกจุดในอวกาศ คำถามพื้นฐานสองข้อที่วิศวกรถามกับสนามใดก็ตามคือ “สนามนี้แผ่ออกหรือไหลเข้าที่จุดนี้หรือไม่” และ “สนามนี้หมุนวนรอบจุดนี้หรือไม่” คำตอบคือดีเวอร์เจนซ์ (divergence) และเคิร์ล (curl) ซึ่งเป็นหัวใจของสมการแมกซ์เวลล์และกลศาสตร์ของไหล หน้านี้มีแล็บที่ให้ลากจุดแล้ววัด div กับ curl จากอินทิกรัลบนวงกลมเล็กเพื่อเห็นความหมายจริงของสองตัวนี้

สรุปใน 30 วินาที

- ดีเวอร์เจนซ์ $\nabla\cdot\mathbf F = P_x + Q_y + R_z$ (สเกลาร์) = การแผ่ออกต่อปริมาตร · เคิร์ล $\nabla\times\mathbf F$ (เวกเตอร์) = การหมุนวนต่อพื้นที่ (ใน 2D: $Q_x - P_y$)

- $\nabla\times(\nabla f) = \mathbf 0$ และ $\nabla\cdot(\nabla\times\mathbf F) = 0$ เสมอ · $\nabla\cdot\nabla f = \nabla^2 f$ (ลาปลาเซียน)

- อนุรักษ์ ⇔ $\nabla\times\mathbf F = \mathbf 0$ (บริเวณไม่มีรู) ⇔ $\mathbf F = \nabla f$ ⇔ งานไม่ขึ้นกับเส้นทาง

- ไฟฟ้าสถิต: $\nabla\cdot\mathbf E = \rho/\varepsilon_0,\ \nabla\times\mathbf E = \mathbf 0$ · ของไหลไม่บีบอัด: $\nabla\cdot\mathbf v = 0$

ระดับพื้นฐาน ปี 1 · แคลคูลัส 1กลาง แคลคูลัส 3 · คณิตศาสตร์วิศวกรรมขั้นสูง พิสูจน์ · ทฤษฎี

## สนามเวกเตอร์คืออะไร พื้นฐาน

สนามเวกเตอร์ (vector field) คือฟังก์ชันที่รับจุด $(x, y)$ หรือ $(x, y, z)$ แล้วให้เวกเตอร์ออกมา: $\mathbf F(x, y) = \langle P(x, y),\ Q(x, y)\rangle$ หรือ $\mathbf F = \langle P, Q, R\rangle$ ต่างจากฟังก์ชันสเกลาร์ที่ให้ตัวเลขตัวเดียวต่อจุด (อุณหภูมิ ศักย์ไฟฟ้า ความสูง) สนามเวกเตอร์ให้ทั้งขนาดและทิศ (สนามไฟฟ้า ความเร็วของไหล ฟลักซ์ความร้อน)

D1 Vector field สนามเวกเตอร์

$$\mathbf F(x, y, z) = P(x, y, z)\,\mathbf i + Q(x, y, z)\,\mathbf j + R(x, y, z)\,\mathbf k,\qquad \mathbf F: \mathbb R^3 \to \mathbb R^3$$

ตัวอย่าง: $\mathbf F = \langle -y, x\rangle$ (หมุนรอบจุดกำเนิด) · $\mathbf F = \langle x, y\rangle$ (พุ่งออก) · $\mathbf E = kq\,\mathbf r/r^3$ (ประจุจุด) · $\mathbf v = \langle x, -y\rangle$ (ไหลเข้ามุม)

D2 Gradient field สนามเกรเดียนต์

$$f(x, y, z) \ \longmapsto\ \nabla f = \langle f_x, f_y, f_z\rangle,\qquad \mathbf E = -\nabla V,\quad \mathbf q = -k\nabla T,\quad \mathbf v = -K\nabla h$$

ฟังก์ชันสเกลาร์ → สนามเวกเตอร์ (บทเกรเดียนต์) · สนามที่มาจากเกรเดียนต์เรียกสนามอนุรักษ์ มีฟังก์ชันศักย์ $f$

วาดสนามด้วยลูกศร ณ จุดตัวอย่างบนตาราง (ความยาวหรือสีบอกขนาด) หรือด้วยเส้นกระแส (flow lines / field lines) ที่สัมผัสทิศของสนามทุกจุด เช่นเส้นแรงไฟฟ้า เส้นลมในอุโมงค์ลม เส้นไหลของน้ำรอบเสา ทั้งสองแบบมีอยู่ในแล็บด้านล่าง

## ตัวดำเนินการ ∇ ดีเวอร์เจนซ์ เคิร์ล และลาปลาเซียน กลาง

ตัวดำเนินการ $\nabla = \left\langle\dfrac{\partial}{\partial x}, \dfrac{\partial}{\partial y}, \dfrac{\partial}{\partial z}\right\rangle$ (เดล) ทำหน้าที่เหมือนเวกเตอร์ที่ใส่อนุพันธ์ย่อยเป็นองค์ประกอบ ใช้ได้สามแบบ: คูณสเกลาร์ ($\nabla f$ = gradient) ดอตกับเวกเตอร์ ($\nabla\cdot\mathbf F$ = divergence) และครอสกับเวกเตอร์ ($\nabla\times\mathbf F$ = curl)

D3 Divergence ดีเวอร์เจนซ์

$$\nabla\cdot\mathbf F = \frac{\partial P}{\partial x} + \frac{\partial Q}{\partial y} + \frac{\partial R}{\partial z} = \lim_{V\to0}\frac{1}{V}\oint\!\!\oint_{S}\mathbf F\cdot\mathbf n\,dS$$

ความหมาย: การไหลออกสุทธิต่อหน่วยปริมาตร · $> 0$ แหล่งกำเนิด (source) · $< 0$ ท่อรับ (sink) · $= 0$ ไม่บีบอัด (solenoidal) · ผลเป็นสเกลาร์

D4 Curl เคิร์ล

$$\nabla\times\mathbf F = \begin{vmatrix}\mathbf i & \mathbf j & \mathbf k\\ \partial_x & \partial_y & \partial_z\\ P & Q & R\end{vmatrix} = \langle R_y - Q_z,\ P_z - R_x,\ Q_x - P_y\rangle$$

ความหมาย: การหมุนวนต่อหน่วยพื้นที่ · ทิศ = แกนหมุนตามกฎมือขวา · ขนาด = 2 × ความเร็วเชิงมุมของใบพัดเล็ก (paddle wheel) · $= \mathbf 0$ เรียก irrotational · ผลเป็นเวกเตอร์ · ในสองมิติ $\mathbf F = \langle P, Q, 0\rangle$ ให้ $\operatorname{curl} = Q_x - P_y$ (องค์ประกอบ $z$)

D5 Laplacian ลาปลาเซียน

$$\nabla^2 f = \nabla\cdot(\nabla f) = f_{xx} + f_{yy} + f_{zz}$$

ผลเป็นสเกลาร์ · $\nabla^2 f = 0$ คือสมการลาปลาซ (สภาวะคงตัว) · $\nabla^2 V = -\rho/\varepsilon_0$ พัวซอง

D6 Rigid rotation การหมุนแบบวัตถุแข็ง

$$\mathbf v = \boldsymbol\omega\times\mathbf r\ \Rightarrow\ \nabla\times\mathbf v = 2\boldsymbol\omega,\qquad \nabla\cdot\mathbf v = 0$$

เคิร์ลของความเร็วคือสองเท่าของความเร็วเชิงมุม (นี่คือที่มาของ “ความหมุนวน” $\boldsymbol\zeta = \nabla\times\mathbf v$ ในกลศาสตร์ของไหล)

### แล็บสนามเวกเตอร์: วัด div และ curl จากวงกลมเล็ก

เลือกสนามหรือพิมพ์ $P(x, y)$ และ $Q(x, y)$ เองแล้วเปิดสีพื้น “ดีเวอร์เจนซ์” หรือ “เคิร์ล” (สีส้ม = บวก สีฟ้า = ลบ) ลากจุดสีส้ม วงกลมดำคือวงทดสอบรัศมี $\rho$ โปรแกรมคำนวณการไหลออกสุทธิ $\oint\mathbf F\cdot\mathbf n\,ds$ และการหมุนวน $\oint\mathbf F\cdot d\mathbf r$ ตามวงกลมด้วยอินทิกรัลเชิงตัวเลข แล้วหารด้วยพื้นที่ $\pi\rho^2$ เทียบกับค่า div และ curl ที่ได้จากสูตร ยิ่งลดรัศมีวงกลม ตัวเลขยิ่งตรงกัน (นี่คือคำจำกัดความ “ต่อหน่วยพื้นที่” ของ div และ curl) เปิดอนุภาคไหลเพื่อดูการเคลื่อนที่

ดีเวอร์เจนซ์และเคิร์ลของสนามเวกเตอร์ 2 มิติ: สนามแผ่ออก ($\nabla\cdot\mathbf F > 0$) สนามหมุนวน ($\nabla\times\mathbf F \ne \mathbf 0$) และสนามเฉือน (ทั้ง div และ curl ได้จากตัวเลขเดียวกัน) · ใบพัดเล็กหมุนเมื่อ curl ≠ 0

ตัวอย่าง D-1 · คำนวณ div และ curl

### $\mathbf F = \langle x^2 y,\ y^2 z,\ z^2 x\rangle$ หา $\nabla\cdot\mathbf F$ และ $\nabla\times\mathbf F$ แล้วคำนวณที่ $(1, 2, 3)$

- $P = x^2y,\ Q = y^2z,\ R = z^2x$ · $\nabla\cdot\mathbf F = P_x + Q_y + R_z = 2xy + 2yz + 2zx$

- $R_y - Q_z = 0 - y^2 = -y^2$ · $P_z - R_x = 0 - z^2 = -z^2$ · $Q_x - P_y = 0 - x^2 = -x^2$

- $\nabla\times\mathbf F = \langle -y^2,\ -z^2,\ -x^2\rangle$

- ที่ $(1, 2, 3)$: div $= 2(2) + 2(6) + 2(3) = 4 + 12 + 6 = 22$ · curl $= \langle -4,\ -9,\ -1\rangle$

$\nabla\cdot\mathbf F = 2(xy + yz + zx)$ → 22 · $\nabla\times\mathbf F = \langle-y^2, -z^2, -x^2\rangle$ → $\langle-4,-9,-1\rangle$

ตัวอย่าง D-2 · โรเตอร์หมุน (เครื่องกล)

### ความเร็วของจุดบนโรเตอร์ที่หมุนรอบแกน $z$ ด้วย $\omega = 314$ rad/s คือ $\mathbf v = \langle -\omega y,\ \omega x,\ 0\rangle$ หา div และ curl

- $P = -\omega y,\ Q = \omega x,\ R = 0$

- $\nabla\cdot\mathbf v = \partial_x(-\omega y) + \partial_y(\omega x) + 0 = 0$ → วัสดุไม่ถูกบีบอัดหรือขยาย (เป็นการหมุนแบบแข็ง)

- $\nabla\times\mathbf v = \langle 0,\ 0,\ Q_x - P_y\rangle = \langle0, 0, \omega - (-\omega)\rangle = \langle 0, 0, 2\omega\rangle$ = $2\omega\,\mathbf k$

- เคิร์ลคือ $2\times314 = 628$ rad/s ชี้ตามแกน $z$ (กฎมือขวา) ตรงกับสูตร D6 ที่ $\nabla\times\mathbf v = 2\boldsymbol\omega$

div = 0 · curl = $2\omega\,\mathbf k = 628\,\mathbf k$ rad/s (ในแล็บ: ทุกจุด curl เป็นค่าคงที่ = 2)

ตัวอย่าง D-3 · สนามกำลังสองผกผัน (ไฟฟ้า)

### $\mathbf E = kq\,\dfrac{\mathbf r}{r^3}$ (ประจุจุด) แสดงว่า $\nabla\cdot\mathbf E = 0$ และ $\nabla\times\mathbf E = \mathbf 0$ ที่ $r \ne 0$

- องค์ประกอบ $E_x = kq\,x\,(x^2 + y^2 + z^2)^{-3/2}$ · $\partial_x E_x = kq\left[r^{-3} - 3x^2 r^{-5}\right]$

- บวกกับ $\partial_y E_y$ และ $\partial_z E_z$ (รูปเดียวกัน): $\nabla\cdot\mathbf E = kq\left[3r^{-3} - 3(x^2 + y^2 + z^2)r^{-5}\right] = kq\left[3r^{-3} - 3r^{-3}\right] = 0$

- เคิร์ล: เช่น $\partial_y E_z - \partial_z E_y = kq\left[-3yzr^{-5} + 3zyr^{-5}\right] = 0$ (ทุกองค์ประกอบเป็นศูนย์) เพราะ $\mathbf E = -\nabla(kq/r)$ เป็นเกรเดียนต์

- แต่ฟลักซ์ผ่านทรงกลมรอบประจุเท่ากับ $4\pi kq = q/\varepsilon_0$ ไม่ใช่ศูนย์ — ที่จุดกำเนิดสนามไม่นิยามและ div เป็น “ฟังก์ชันเดลต้า” (แหล่งกำเนิดจุด) ซึ่งคือเนื้อหาของกฎของเกาส์ (ลองในแล็บ Gauss ด้วย $\mathbf F = \mathbf r/\rho^3$)

นอกจุดกำเนิด $\nabla\cdot\mathbf E = 0$ และ $\nabla\times\mathbf E = \mathbf 0$ · ที่จุดกำเนิดมีแหล่งกำเนิดจุด

## เอกลักษณ์เวกเตอร์ที่ต้องรู้ กลาง

เอกลักษณ์สองข้อแรกมาจากข้อเท็จจริงเดียว: อนุพันธ์ย่อยผสมสลับลำดับได้ (ทฤษฎีบทของแคลโร บทอนุพันธ์ย่อย) สองข้อนี้อธิบายว่าทำไมสนามไฟฟ้าสถิตไม่หมุนวน และสนามแม่เหล็กไม่มีแหล่งกำเนิด

D7 Curl of a gradient เคิร์ลของเกรเดียนต์

$$\nabla\times(\nabla f) = \mathbf 0 \qquad\left(\text{เช่น } (f_z)_y - (f_y)_z = 0 \text{ เพราะ } f_{zy} = f_{yz}\right)$$

ทุกสนามที่เป็น gradient ไม่หมุนวน · ใช้ตรวจว่า $\mathbf F$ ไม่ใช่ gradient: ถ้า curl ≠ 0 แล้ว $\mathbf F \ne \nabla f$ ทุก $f$

D8 Divergence of a curl ดีเวอร์เจนซ์ของเคิร์ล

$$\nabla\cdot(\nabla\times\mathbf F) = 0$$

สนามที่เป็น curl ของสนามอื่น ไม่มีแหล่งกำเนิด · $\mathbf B = \nabla\times\mathbf A$ จึง $\nabla\cdot\mathbf B = 0$ (ไม่มีประจุแม่เหล็กเดี่ยว)

D9 Product rules กฎผลคูณ

$$\nabla\cdot(f\mathbf F) = f\,\nabla\cdot\mathbf F + \nabla f\cdot\mathbf F,\qquad \nabla\times(f\mathbf F) = f\,\nabla\times\mathbf F + \nabla f\times\mathbf F,\qquad \nabla\times(\nabla\times\mathbf F) = \nabla(\nabla\cdot\mathbf F) - \nabla^2\mathbf F$$

ข้อสุดท้ายใช้ในการหาสมการคลื่นแม่เหล็กไฟฟ้าจากสมการแมกซ์เวลล์ (บทไฟฟ้า)

ตัวอย่าง D-4 · ตรวจเอกลักษณ์

### ให้ $f = x^2y + xz^3$ หา $\nabla f$, ตรวจ $\nabla\times\nabla f = \mathbf 0$ และคำนวณ $\nabla^2 f$

- $\nabla f = \langle 2xy + z^3,\ x^2,\ 3xz^2\rangle$

- curl: $\langle (3xz^2)_y - (x^2)_z,\ (2xy + z^3)_z - (3xz^2)_x,\ (x^2)_x - (2xy + z^3)_y\rangle = \langle 0 - 0,\ 3z^2 - 3z^2,\ 2x - 2x\rangle = \mathbf 0$ ✓

- $\nabla^2 f = \nabla\cdot\nabla f = (2xy + z^3)_x + (x^2)_y + (3xz^2)_z = 2y + 0 + 6xz = 2y + 6xz$

curl(grad f) = $\mathbf 0$ ✓ · $\nabla^2 f = 2y + 6xz$

## สนามอนุรักษ์และฟังก์ชันศักย์ กลาง

สนามเวกเตอร์ $\mathbf F$ เป็นสนามอนุรักษ์ (conservative) ถ้ามีฟังก์ชันสเกลาร์ $f$ ที่ $\mathbf F = \nabla f$ (เรียก $f$ ว่าฟังก์ชันศักย์) ผลคืองานของสนามไม่ขึ้นกับเส้นทาง (บทอินทิกรัลตามเส้น) สนามไฟฟ้าสถิตและแรงโน้มถ่วงเป็นแบบนี้ ส่วนแรงเสียดทานและสนามไฟฟ้าเหนี่ยวนำไม่ใช่

D10 Test for a conservative field การทดสอบสนามอนุรักษ์

$$\mathbb R^2:\ \frac{\partial P}{\partial y} = \frac{\partial Q}{\partial x},\qquad \mathbb R^3:\ \nabla\times\mathbf F = \mathbf 0\qquad(\text{บนบริเวณเปิดที่เชื่อมต่อแบบง่าย})$$

ต้อง “เชื่อมต่อแบบง่าย” (simply connected: ไม่มีรู) · ตัวอย่างค้านที่มีรู: $\mathbf F = \dfrac{\langle -y, x\rangle}{x^2 + y^2}$ มี $Q_x = P_y$ ทุกจุดยกเว้นจุดกำเนิดแต่ $\oint\mathbf F\cdot d\mathbf r = 2\pi \ne 0$ รอบจุดกำเนิด → ไม่อนุรักษ์

D11 Finding the potential function วิธีหาฟังก์ชันศักย์

$$f_x = P \Rightarrow f = \int P\,dx + g(y,z);\ \ f_y = Q \Rightarrow g_y = Q - \partial_y\!\!\int P\,dx;\ \ \text{อินทิเกรต } g_y\text{ แล้วทำซ้ำกับ } f_z = R$$

ได้ $f$ ถึงค่าคงที่ $C$ · ตรวจทุกครั้งโดย $\nabla f = \mathbf F$ · ในไฟฟ้ามักนิยาม $\mathbf E = -\nabla V$ ดังนั้น $V = -f$

ตัวอย่าง D-5 · หาฟังก์ชันศักย์สามมิติ

### แสดงว่า $\mathbf F = \langle 2xy + z^3,\ x^2,\ 3xz^2\rangle$ เป็นสนามอนุรักษ์ และหา $f$

- เคิร์ล: $R_y - Q_z = 0 - 0 = 0$ · $P_z - R_x = 3z^2 - 3z^2 = 0$ · $Q_x - P_y = 2x - 2x = 0$ → $\nabla\times\mathbf F = \mathbf 0$ บน $\mathbb R^3$ (ไม่มีรู) → อนุรักษ์

- $f_x = 2xy + z^3$ → $f = x^2y + xz^3 + g(y, z)$

- $f_y = x^2 + g_y = Q = x^2$ → $g_y = 0$ → $g = h(z)$

- $f_z = 3xz^2 + h'(z) = R = 3xz^2$ → $h' = 0$ → $h = C$

- $f(x, y, z) = x^2y + xz^3 + C$ · ตรวจ: $\nabla f = \langle 2xy + z^3,\ x^2,\ 3xz^2\rangle = \mathbf F$ ✓ (นี่คือ $f$ ของตัวอย่าง D-4)

$f = x^2 y + x z^3 + C$

ตัวอย่าง D-6 · สนามสองมิติที่ไม่อนุรักษ์

### ตรวจ $\mathbf F_1 = \langle 2xy,\ x^2 - 3y^2\rangle$ และ $\mathbf F_2 = \langle y^2,\ x\rangle$

- $\mathbf F_1$: $P_y = 2x$ · $Q_x = 2x$ → เท่ากัน → อนุรักษ์ · ศักย์ $f = x^2y - y^3$ (ตรวจ $f_x = 2xy,\ f_y = x^2 - 3y^2$ ✓)

- $\mathbf F_2$: $P_y = 2y$ แต่ $Q_x = 1$ → ไม่เท่ากัน (curl $= 1 - 2y \ne 0$) → ไม่อนุรักษ์

- ในแล็บ เปิดสีพื้นเคิร์ลของ $\mathbf F_2$: ค่าเป็นบวกใต้เส้น $y = 0.5$ และลบเหนือเส้นนั้น ที่ $y = 0.5$ curl หายไป · งานตามวงปิดที่ผ่านบริเวณ curl ≠ 0 จึงไม่เป็นศูนย์

$\mathbf F_1$ อนุรักษ์ ($f = x^2y - y^3$) · $\mathbf F_2$ ไม่อนุรักษ์ (curl = $1 - 2y$)

| สนาม | อนุรักษ์? | เหตุผล / ความหมายทางฟิสิกส์ |

| สนามไฟฟ้าสถิต $\mathbf E$ | ใช่ | $\nabla\times\mathbf E = \mathbf 0$ · มีศักย์ไฟฟ้า $V$ · แรงดันระหว่างสองจุดไม่ขึ้นกับสายที่ใช้วัด |

| แรงโน้มถ่วง | ใช่ | มีพลังงานศักย์ $mgh$ · งานของแรงโน้มถ่วงขึ้นกับความสูงต้น-ปลาย เท่านั้น |

| แรงสปริง $\mathbf F = -k\mathbf r$ | ใช่ | ศักย์ $\tfrac12 kr^2$ |

| แรงเสียดทาน | ไม่ | ทำงานมากขึ้นถ้าเส้นทางยาวขึ้น · พลังงานสูญเป็นความร้อน |

| สนามไฟฟ้าเหนี่ยวนำ (ฟาราเดย์) | ไม่ | $\nabla\times\mathbf E = -\partial\mathbf B/\partial t \ne \mathbf 0$ · ใช้ในหม้อแปลงและมอเตอร์ |

| สนามแม่เหล็กรอบเส้นลวด $\mathbf B$ | ไม่ (ในบริเวณรอบลวด) | $\oint\mathbf B\cdot d\mathbf l = \mu_0 I$ (Ampère) ≠ 0 |

| ความเร็วของของไหลอุดมคติ (ไม่หมุนวน) | ใช่ (irrotational) | มีศักย์ความเร็ว $\phi$ และ $\nabla^2\phi = 0$ เมื่อไม่บีบอัด |

## เส้นกระแส (Flow Lines) กลาง

เส้นกระแสคือเส้นทาง $\mathbf r(t)$ ที่ความเร็วเท่ากับสนาม ณ ตำแหน่งนั้นเสมอ: $\mathbf r'(t) = \mathbf F(\mathbf r(t))$ เป็นระบบสมการเชิงอนุพันธ์ (เป็นเส้นทางของอนุภาคเล็กที่ลอยไปกับของไหลเมื่อการไหลคงที่) ในสนามไฟฟ้า เส้นแรงออกจากประจุบวกเข้าประจุลบ และไม่ตัดกัน

ตัวอย่าง D-7 · หาเส้นกระแสด้วยการแก้ ODE

### หาเส้นกระแสของ $\mathbf F = \langle x,\ -y\rangle$ ที่ผ่านจุด $(2, 1)$

- ตั้ง $\dfrac{dx}{dt} = x$ และ $\dfrac{dy}{dt} = -y$ → $x = 2e^{t}$ และ $y = e^{-t}$ (เริ่มที่ $t = 0$)

- กำจัด $t$: $xy = 2e^{t}e^{-t} = 2$ เป็นค่าคงที่ตลอดเส้นทาง

- เส้นกระแสคือไฮเพอร์โบลา $xy = 2$ เคลื่อนเข้าหาแกน $x$ และออกห่างแกน $y$ · นี่คือการไหลเข้ามุมฉาก (stagnation flow) ที่จุดกำเนิดความเร็วเป็นศูนย์

- ตรวจ: $\nabla\cdot\mathbf F = 1 + (-1) = 0$ (ไม่บีบอัด) และ $\nabla\times\mathbf F = 0$ → เป็นการไหลศักย์ของของไหลอุดมคติ

เส้นกระแส: $xy = 2$ (ไฮเพอร์โบลา) · div = 0 และ curl = 0

## นำไปใช้ในงานวิศวกรรม พื้นฐาน

| สาขา | สมการ | ความหมาย |

| ไฟฟ้า | $\nabla\cdot\mathbf D = \rho_v,\ \ \nabla\times\mathbf E = -\partial_t\mathbf B$ | กฎของเกาส์และฟาราเดย์ในรูปอนุพันธ์ (บทไฟฟ้า) |

| ไฟฟ้า | $\nabla\cdot\mathbf B = 0,\ \ \nabla\times\mathbf H = \mathbf J + \partial_t\mathbf D$ | ไม่มีประจุแม่เหล็ก · กฎของแอมแปร์-แมกซ์เวลล์ |

| เครื่องกล | $\nabla\cdot\mathbf v = 0$ (ไม่บีบอัด) · $\boldsymbol\zeta = \nabla\times\mathbf v$ | สมการความต่อเนื่องและความหมุนวนของของไหล (บทเครื่องกล) |

| เครื่องกล | $\nabla\cdot\mathbf q = \dot q_{gen}$ | สมดุลพลังงานความร้อนที่จุดหนึ่ง |

| โยธา | $\mathbf v = -K\nabla h,\ \ \nabla\cdot\mathbf v = 0$ | ดาร์ซีและความต่อเนื่อง → $\nabla^2h = 0$ การซึมผ่านดิน (บทโยธา) |

| โยธา | $\nabla\cdot\boldsymbol\sigma + \mathbf f = \mathbf 0$ | สมดุลความเค้นภายในวัสดุ (ดีเวอร์เจนซ์ของเทนเซอร์) |

## ข้อผิดพลาดที่พบบ่อย พื้นฐาน

- สลับผลลัพธ์ของ div กับ curl · div ได้สเกลาร์ curl (สามมิติ) ได้เวกเตอร์ · เขียน $\nabla\cdot\mathbf F$ ผลเป็นเวกเตอร์ผิดแน่นอน

- ใช้ curl = 0 ตัดสินสนามอนุรักษ์ในบริเวณที่มีรู · ตัวอย่าง $\langle -y, x\rangle/(x^2 + y^2)$

- เคิร์ลของสนามสองมิติ · ใช้ $Q_x - P_y$ (ไม่ใช่ $P_y - Q_x$) ลำดับสำคัญต่อเครื่องหมาย

- ลืมตัวห้อยของ $P_y$ · $P_y = \partial P/\partial y$ ไม่ใช่ $P$ คูณ $y$

- เชื่อว่า div = 0 แปลว่าสนามเป็นศูนย์ · สนามที่มีลูกศรใหญ่ได้ แต่ไหลเข้า-ออกสมดุล (เช่นการไหลเข้ามุม)

ไปต่อที่อินทิกรัลตามเส้นและทฤษฎีบทของกรีน ที่เชื่อมการหมุนวน (curl) กับการหมุนวนบนวงปิด และสนามอนุรักษ์กับงานที่ไม่ขึ้นกับเส้นทาง

## คำถามที่พบบ่อย

สนามเวกเตอร์ (vector field) คืออะไร ยกตัวอย่าง?
คือฟังก์ชันที่ผูกเวกเตอร์หนึ่งตัวกับทุกจุดในระนาบหรืออวกาศ $\mathbf F(x, y, z) = \langle P, Q, R\rangle$ เช่นสนามไฟฟ้ารอบประจุ $\mathbf E$ สนามความเร็วของน้ำในท่อ $\mathbf v$ ฟลักซ์ความร้อน $\mathbf q$ สนามแรงโน้มถ่วง และสนามแม่เหล็ก $\mathbf B$ ต่างจากฟังก์ชันสเกลาร์ที่ให้ตัวเลขตัวเดียวต่อจุด (อุณหภูมิ ศักย์) วาดสนามเป็นลูกศรที่ตำแหน่งต่าง ๆ หรือเป็นเส้นกระแสที่สัมผัสลูกศรทุกจุด

ดีเวอร์เจนซ์ (divergence) กับเคิร์ล (curl) ต่างกันอย่างไร?
ดีเวอร์เจนซ์ $\nabla\cdot\mathbf F = P_x + Q_y + R_z$ เป็นสเกลาร์ วัดการ “แผ่ออก” ของสนามจากจุดหนึ่ง (แหล่งกำเนิดเป็นบวก ท่อรับเป็นลบ) ส่วนเคิร์ล $\nabla\times\mathbf F$ เป็นเวกเตอร์ วัดการ “หมุนวน” รอบจุด (ทิศคือแกนหมุนตามกฎมือขวา ขนาดคือสองเท่าของความเร็วเชิงมุมของใบพัดเล็กที่วางในสนาม) สนามที่ $\nabla\cdot\mathbf F = 0$ เรียกว่า solenoidal (ไม่บีบอัด) สนามที่ $\nabla\times\mathbf F = \mathbf 0$ เรียกว่า irrotational

สนามอนุรักษ์ (conservative field) ตรวจอย่างไร?
ในสองมิติตรวจ $\partial P/\partial y = \partial Q/\partial x$ ในสามมิติตรวจ $\nabla\times\mathbf F = \mathbf 0$ บนบริเวณที่เชื่อมต่อแบบง่าย (ไม่มีรู) ถ้าผ่านการตรวจจะมีฟังก์ชันศักย์ $f$ ที่ $\mathbf F = \nabla f$ และงาน $\int\mathbf F\cdot d\mathbf r$ ไม่ขึ้นกับเส้นทาง ตัวอย่างคือสนามไฟฟ้าสถิตและแรงโน้มถ่วง ส่วนแรงเสียดทานไม่อนุรักษ์ ระวังกรณีมีรู เช่น $\langle -y, x\rangle/(x^2+y^2)$ มี curl เป็นศูนย์แต่ไม่อนุรักษ์เพราะวนรอบจุดกำเนิด

หาฟังก์ชันศักย์ (potential function) จากสนามอนุรักษ์อย่างไร?
อินทิเกรต $f_x = P$ ตาม $x$ ได้ $f = \int P\,dx + g(y, z)$ แล้วหาอนุพันธ์ตาม $y$ เทียบกับ $Q$ เพื่อหา $g_y$ อินทิเกรตหา $g$ แล้วทำซ้ำกับ $z$ ตัวอย่าง $\mathbf F = \langle 2xy + z^3,\ x^2,\ 3xz^2\rangle$ ได้ $f = x^2y + xz^3 + C$ ตรวจโดย $\nabla f = \mathbf F$ ในงานไฟฟ้า ศักย์ $V$ ในนิยาม $\mathbf E = -\nabla V$ ต่างจาก $f$ แค่เครื่องหมายลบ

เอกลักษณ์ curl(grad f) = 0 และ div(curl F) = 0 บอกอะไร?
$\nabla\times(\nabla f) = \mathbf 0$ บอกว่าสนามที่มาจาก gradient (เช่นสนามไฟฟ้าสถิต $\mathbf E = -\nabla V$) ไม่มีการหมุนวน ส่วน $\nabla\cdot(\nabla\times\mathbf F) = 0$ บอกว่าสนามที่มาจาก curl (เช่นสนามแม่เหล็ก $\mathbf B = \nabla\times\mathbf A$) ไม่มีแหล่งกำเนิดหรือท่อรับ นั่นคือ $\nabla\cdot\mathbf B = 0$ ไม่มีประจุแม่เหล็กเดี่ยว ทั้งสองมาจากการที่อนุพันธ์ย่อยผสมสลับลำดับได้ (ทฤษฎีบทของแคลโร)

มด

อาจารย์มด · ธีรวุฒิ แสวงบุญ
อาจารย์สาขาวิชาวิศวกรรมไฟฟ้า มหาวิทยาลัยราชภัฏธนบุรี สมุทรปราการ · ดูโปรไฟล์

## คำถามที่พบบ่อย (FAQ)

**สนามเวกเตอร์ (vector field) คืออะไร ยกตัวอย่าง?**
คือฟังก์ชันที่ผูกเวกเตอร์หนึ่งตัวกับทุกจุดในระนาบหรืออวกาศ $\mathbf F(x, y, z) = \langle P, Q, R\rangle$ เช่นสนามไฟฟ้ารอบประจุ $\mathbf E$ สนามความเร็วของน้ำในท่อ $\mathbf v$ ฟลักซ์ความร้อน $\mathbf q$ สนามแรงโน้มถ่วง และสนามแม่เหล็ก $\mathbf B$ ต่างจากฟังก์ชันสเกลาร์ที่ให้ตัวเลขตัวเดียวต่อจุด (อุณหภูมิ ศักย์) วาดสนามเป็นลูกศรที่ตำแหน่งต่าง ๆ หรือเป็นเส้นกระแสที่สัมผัสลูกศรทุกจุด

**ดีเวอร์เจนซ์ (divergence) กับเคิร์ล (curl) ต่างกันอย่างไร?**
ดีเวอร์เจนซ์ $\nabla\cdot\mathbf F = P_x + Q_y + R_z$ เป็นสเกลาร์ วัดการ “แผ่ออก” ของสนามจากจุดหนึ่ง (แหล่งกำเนิดเป็นบวก ท่อรับเป็นลบ) ส่วนเคิร์ล $\nabla\times\mathbf F$ เป็นเวกเตอร์ วัดการ “หมุนวน” รอบจุด (ทิศคือแกนหมุนตามกฎมือขวา ขนาดคือสองเท่าของความเร็วเชิงมุมของใบพัดเล็กที่วางในสนาม) สนามที่ $\nabla\cdot\mathbf F = 0$ เรียกว่า solenoidal (ไม่บีบอัด) สนามที่ $\nabla\times\mathbf F = \mathbf 0$ เรียกว่า irrotational

**สนามอนุรักษ์ (conservative field) ตรวจอย่างไร?**
ในสองมิติตรวจ $\partial P/\partial y = \partial Q/\partial x$ ในสามมิติตรวจ $\nabla\times\mathbf F = \mathbf 0$ บนบริเวณที่เชื่อมต่อแบบง่าย (ไม่มีรู) ถ้าผ่านการตรวจจะมีฟังก์ชันศักย์ $f$ ที่ $\mathbf F = \nabla f$ และงาน $\int\mathbf F\cdot d\mathbf r$ ไม่ขึ้นกับเส้นทาง ตัวอย่างคือสนามไฟฟ้าสถิตและแรงโน้มถ่วง ส่วนแรงเสียดทานไม่อนุรักษ์ ระวังกรณีมีรู เช่น $\langle -y, x\rangle/(x^2+y^2)$ มี curl เป็นศูนย์แต่ไม่อนุรักษ์เพราะวนรอบจุดกำเนิด

**หาฟังก์ชันศักย์ (potential function) จากสนามอนุรักษ์อย่างไร?**
อินทิเกรต $f_x = P$ ตาม $x$ ได้ $f = \int P\,dx + g(y, z)$ แล้วหาอนุพันธ์ตาม $y$ เทียบกับ $Q$ เพื่อหา $g_y$ อินทิเกรตหา $g$ แล้วทำซ้ำกับ $z$ ตัวอย่าง $\mathbf F = \langle 2xy + z^3,\ x^2,\ 3xz^2\rangle$ ได้ $f = x^2y + xz^3 + C$ ตรวจโดย $\nabla f = \mathbf F$ ในงานไฟฟ้า ศักย์ $V$ ในนิยาม $\mathbf E = -\nabla V$ ต่างจาก $f$ แค่เครื่องหมายลบ

**เอกลักษณ์ curl(grad f) = 0 และ div(curl F) = 0 บอกอะไร?**
$\nabla\times(\nabla f) = \mathbf 0$ บอกว่าสนามที่มาจาก gradient (เช่นสนามไฟฟ้าสถิต $\mathbf E = -\nabla V$) ไม่มีการหมุนวน ส่วน $\nabla\cdot(\nabla\times\mathbf F) = 0$ บอกว่าสนามที่มาจาก curl (เช่นสนามแม่เหล็ก $\mathbf B = \nabla\times\mathbf A$) ไม่มีแหล่งกำเนิดหรือท่อรับ นั่นคือ $\nabla\cdot\mathbf B = 0$ ไม่มีประจุแม่เหล็กเดี่ยว ทั้งสองมาจากการที่อนุพันธ์ย่อยผสมสลับลำดับได้ (ทฤษฎีบทของแคลโร)
