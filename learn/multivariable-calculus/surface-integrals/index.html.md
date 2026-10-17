---
title: "อินทิกรัลบนผิว (Surface Integrals) ฟลักซ์ ทฤษฎีบทดีเวอร์เจนซ์ (Gauss) และทฤษฎีบทสโตกส์ (Stokes)"
url: https://modsengineeringmath.com/learn/multivariable-calculus/surface-integrals/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-10-17
---

> อินทิกรัลบนผิว (surface integral) ผิวพารามิเตอร์ พื้นที่ผิว dS = |r_u × r_v| du dv ฟลักซ์ (flux) ∬F·n dS ทฤษฎีบทดีเวอร์เจนซ์ของเกาส์ (divergence theorem / Gauss) ทฤษฎีบทสโตกส์ (Stokes' theorem) กฎของเกาส์ กฎของฟาราเดย์ กฎของแอมแปร์และสมการแมกซ์เวลล์ พร้อมตัวอย่างจานรับสัญญาณ ท่อน้ำ และตัวตรวจ Gauss–Stokes ที่คำนวณทั้งสองฝั่ง

ฉบับ Markdown ของ https://modsengineeringmath.com/learn/multivariable-calculus/surface-integrals/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# อินทิกรัลบนผิว (Surface Integrals) ฟลักซ์ ทฤษฎีบทดีเวอร์เจนซ์ (Gauss) และทฤษฎีบทสโตกส์ (Stokes)

// บทที่ 24.9 · แคลคูลัสเวกเตอร์ · Surface Integrals, Gauss & Stokes


อัตราการไหลของน้ำผ่านหน้าตัดท่อ พลังงานรังสีที่ตกบนจานรับสัญญาณ ฟลักซ์ไฟฟ้าที่ออกจากประจุ และแรงเคลื่อนไฟฟ้าที่เหนี่ยวนำรอบขดลวด ล้วนคืออินทิกรัลบนผิว (surface integral) หน้านี้สร้างเครื่องมือทีละชั้น: อธิบายผิวด้วยพารามิเตอร์ หาพื้นที่ผิว คำนวณฟลักซ์ แล้วจึงถึงสองทฤษฎีบทใหญ่ คือทฤษฎีบทดีเวอร์เจนซ์ของเกาส์ (ผิวปิด ↔ ปริมาตร) และทฤษฎีบทสโตกส์ (ขอบ ↔ ผิว) ซึ่งเป็นรากฐานของสมการแมกซ์เวลล์ มีตัวตรวจที่คำนวณทั้งสองฝั่งของทั้งสองทฤษฎีบทให้เห็นว่าเท่ากัน

สรุปใน 30 วินาที

- พื้นที่ผิว $dS = |\mathbf r_u\times\mathbf r_v|\,du\,dv$ · กราฟ $z = g(x,y)$: $dS = \sqrt{1 + g_x^2 + g_y^2}\,dA$

- ฟลักซ์ $\Phi = \iint_S\mathbf F\cdot\mathbf n\,dS = \iint\mathbf F\cdot(\mathbf r_u\times\mathbf r_v)\,du\,dv$ · ทิศ $\mathbf n$ ต้องกำหนด (ผิวปิดชี้ออก)

- Gauss: $\oiint_S\mathbf F\cdot\mathbf n\,dS = \iiint_E\nabla\cdot\mathbf F\,dV$ · Stokes: $\oint_C\mathbf F\cdot d\mathbf r = \iint_S(\nabla\times\mathbf F)\cdot\mathbf n\,dS$

- ไฟฟ้า: Gauss → $\nabla\cdot\mathbf D = \rho_v$ · Stokes → $\nabla\times\mathbf E = -\partial_t\mathbf B$ (ฟาราเดย์) · แอมแปร์ $\oint\mathbf B\cdot d\mathbf l = \mu_0I$

ระดับพื้นฐาน ปี 1 · แคลคูลัส 1กลาง แคลคูลัส 3 · คณิตศาสตร์วิศวกรรมขั้นสูง พิสูจน์ · ทฤษฎี

## ผิวพารามิเตอร์และพื้นที่ผิว กลาง

เส้นโค้งใช้พารามิเตอร์ตัวเดียว $t$ ผิวต้องใช้สองตัว $(u, v)$: $\mathbf r(u, v) = \langle x(u,v),\ y(u,v),\ z(u,v)\rangle$ กริดของเส้น $u$ คงที่และ $v$ คงที่ปูผิวนั้น เวกเตอร์ $\mathbf r_u = \partial\mathbf r/\partial u$ และ $\mathbf r_v$ สัมผัสผิวทั้งคู่ และผลคูณไขว้ $\mathbf r_u\times\mathbf r_v$ ตั้งฉากกับผิว ขนาดของมันคือพื้นที่ของสี่เหลี่ยมด้านขนานเล็กบนผิว (เหมือนจาโคเบียนของช่องเล็กบนระนาบ $uv$ ที่ถูกแปลงขึ้นสู่ผิวในบทอินทิกรัลหลายชั้น)

ผิวพารามิเตอร์ (parametric surface) $\mathbf r(u, v)$: เวกเตอร์ $\mathbf r_u$ และ $\mathbf r_v$ สัมผัสผิว และ $\mathbf r_u\times\mathbf r_v$ เป็นเวกเตอร์ปกติที่มีขนาดเท่าพื้นที่ของสี่เหลี่ยมด้านขนานเล็ก $dS$

S1 Surface area (parametric) พื้นที่ผิว (พารามิเตอร์)

$$\mathbf r(u,v) = \langle x, y, z\rangle,\quad \mathbf N = \mathbf r_u\times\mathbf r_v,\quad dS = |\mathbf r_u\times\mathbf r_v|\,du\,dv,\quad A(S) = \iint_D|\mathbf r_u\times\mathbf r_v|\,du\,dv$$

$D$ = บริเวณของ $(u, v)$ · $\mathbf n = \mathbf N/|\mathbf N|$ · ทรงกลมรัศมี $a$: $\mathbf r = a\langle\sin u\cos v,\ \sin u\sin v,\ \cos u\rangle$ ได้ $dS = a^2\sin u\,du\,dv$ และ $A = 4\pi a^2$

S2 Surface area of a graph พื้นที่ผิวของกราฟ

$$z = g(x, y):\quad dS = \sqrt{1 + g_x^2 + g_y^2}\,dA,\qquad A(S) = \iint_D\sqrt{1 + g_x^2 + g_y^2}\,dA$$

มาจาก $\mathbf r(x, y) = \langle x, y, g\rangle$ → $\mathbf r_x\times\mathbf r_y = \langle -g_x, -g_y, 1\rangle$ · ตัวคูณ $\sqrt{1 + |\nabla g|^2} = 1/\cos\gamma$ ($\gamma$ = มุมระหว่างผิวกับระนาบ $xy$) ≥ 1 เสมอ

ตัวอย่าง S-1 · พื้นที่ผิวพาราโบลอยด์

### หาพื้นที่ผิวของ $z = x^2 + y^2$ ที่ $z \le 4$

- $g_x = 2x,\ g_y = 2y$ → $\sqrt{1 + 4x^2 + 4y^2} = \sqrt{1 + 4r^2}$ · บริเวณเงา: $r \le 2$

- $A = \displaystyle\int_0^{2\pi}\!\int_0^2\sqrt{1 + 4r^2}\,r\,dr\,d\theta = 2\pi\left[\dfrac{(1 + 4r^2)^{3/2}}{12}\right]_0^2$

- $= \dfrac{2\pi}{12}\left(17^{3/2} - 1\right) = \dfrac{\pi}{6}(70.093 - 1) = \dfrac{\pi}{6}(69.093) = 36.18$ (ผิวใหญ่กว่าแผ่นวงกลมเงา $\pi\cdot4 = 12.57$ เพราะชัน)

$A = \dfrac{\pi}{6}\left(17\sqrt{17} - 1\right) \approx 36.18$ หน่วยพื้นที่

ตัวอย่าง S-2 · พื้นที่ผิวจานรับสัญญาณดาวเทียม (ไฟฟ้า / เครื่องกล)

### จานพาราโบลาเส้นผ่านศูนย์กลาง 1.2 m ระยะโฟกัส $f = 0.45$ m รูปผิว $z = \dfrac{x^2 + y^2}{4f}$ หาความลึกและพื้นที่ผิว (วัสดุเคลือบสะท้อน)

- ความลึกที่ขอบ $r = R = 0.6$: $z = \dfrac{R^2}{4f} = \dfrac{0.36}{1.8} = 0.20$ m

- $g_x = \dfrac{x}{2f},\ g_y = \dfrac{y}{2f}$ → $\sqrt{1 + g_x^2 + g_y^2} = \sqrt{1 + \dfrac{r^2}{4f^2}}$

- $A = 2\pi\displaystyle\int_0^R\sqrt{1 + \dfrac{r^2}{4f^2}}\,r\,dr = 2\pi\cdot\dfrac{4f^2}{3}\left[\left(1 + \dfrac{R^2}{4f^2}\right)^{3/2} - 1\right]$

- $4f^2 = 0.81$ · $R^2/4f^2 = 0.4444$ · $(1.4444)^{3/2} = 1.7359$ → $A = 2\pi(0.27)(0.7359) = 1.2486$ m² เทียบกับแผ่นเรียบ $\pi R^2 = 1.131$ m² (ใหญ่กว่า 10%)

ความลึก $0.20$ m · พื้นที่ผิว $A \approx 1.249$ m²

ตัวอย่าง S-3 · ทรงกลมด้วยพารามิเตอร์ และอินทิกรัลสเกลาร์

### (ก) แสดงว่าพื้นที่ผิวทรงกลมรัศมี $a$ คือ $4\pi a^2$ (ข) หา $\iint_S z\,dS$ บนซีกบนของทรงกลม และความสูงเฉลี่ยของเปลือกซีก

- (ก) $\mathbf r_u = a\langle\cos u\cos v,\ \cos u\sin v,\ -\sin u\rangle$ · $\mathbf r_v = a\langle-\sin u\sin v,\ \sin u\cos v,\ 0\rangle$

- $\mathbf r_u\times\mathbf r_v = a^2\sin u\,\langle\sin u\cos v,\ \sin u\sin v,\ \cos u\rangle$ (ชี้ออกนอก) · $|\,\cdot\,| = a^2\sin u$ · $A = \int_0^{2\pi}\!\int_0^\pi a^2\sin u\,du\,dv = 4\pi a^2$

- (ข) บนทรงกลม $z = a\cos u$ ซีกบน $0 \le u \le \pi/2$: $\displaystyle\iint z\,dS = \int_0^{2\pi}\!\int_0^{\pi/2}(a\cos u)\,a^2\sin u\,du\,dv = a^3\cdot2\pi\cdot\dfrac12 = \pi a^3$

- พื้นที่ซีก $= 2\pi a^2$ → ความสูงเฉลี่ย $\bar z = \dfrac{\pi a^3}{2\pi a^2} = \dfrac{a}{2}$ (จุดศูนย์กลางมวลของเปลือกซีกอยู่ที่ครึ่งรัศมี ต่างจากซีกตัน $3a/8$)

(ก) $A = 4\pi a^2$ · (ข) $\iint z\,dS = \pi a^3$, $\bar z = a/2$

## ฟลักซ์ผ่านผิว (Flux) กลาง

ฟลักซ์ของ $\mathbf F$ ผ่านผิว $S$ วัดว่าสนามไหลผ่านผิวเท่าไรต่อหน่วยเวลา ถ้า $\mathbf F = \mathbf v$ (ความเร็วของน้ำ) ฟลักซ์คืออัตราการไหลเชิงปริมาตร (m³/s) เฉพาะองค์ประกอบที่ตั้งฉากกับผิว $\mathbf F\cdot\mathbf n$ ส่งผ่านจริง องค์ประกอบขนานผิวเฉียดผ่านโดยไม่เข้า ดังนั้นต้องเลือกทิศของ $\mathbf n$ (ผิวปิดมักเลือกชี้ออกนอก ผิวกราฟมักเลือกชี้ขึ้น) กลับทิศ $\mathbf n$ ฟลักซ์เปลี่ยนเครื่องหมาย

S3 Scalar surface integral อินทิกรัลบนผิวของฟังก์ชันสเกลาร์

$$\iint_S f\,dS = \iint_D f\big(\mathbf r(u,v)\big)\,|\mathbf r_u\times\mathbf r_v|\,du\,dv,\qquad m = \iint_S\sigma\,dS$$

เช่นมวลของเปลือกบางที่ความหนาแน่นผิว $\sigma$ หรือประจุรวมบนผิว · ไม่ขึ้นกับทิศของ $\mathbf n$

S4 Flux through a surface ฟลักซ์ผ่านผิว

$$\Phi = \iint_S\mathbf F\cdot\mathbf n\,dS = \iint_D\mathbf F\big(\mathbf r(u,v)\big)\cdot\big(\mathbf r_u\times\mathbf r_v\big)\,du\,dv$$

ใช้ $\mathbf r_u\times\mathbf r_v$ ทั้งก้อน (ไม่ต้องทำเป็นหนึ่งหน่วย เพราะขนาดของมันคือ $dS$ อยู่แล้ว) · ถ้า $\mathbf r_u\times\mathbf r_v$ ชี้ผิดทิศที่ต้องการ ให้เติมเครื่องหมายลบ · ผิวปิด $\oiint$

S5 Flux through a graph (upward) ฟลักซ์ผ่านกราฟ (ทิศขึ้น)

$$z = g(x, y),\ \mathbf n\ \text{ขึ้น}:\quad \Phi = \iint_D\big(-P\,g_x - Q\,g_y + R\big)\,dA,\qquad \mathbf F = \langle P, Q, R\rangle \text{ ประเมินที่ } (x, y, g(x,y))$$

มาจาก $\mathbf r_x\times\mathbf r_y = \langle -g_x, -g_y, 1\rangle$ ซึ่งชี้ขึ้น · ผิวทรงกระบอก/ผนังตั้งให้ใช้พารามิเตอร์ ($\theta, z$) แทน

ตัวอย่าง S-4 · ฟลักซ์ผ่านทรงกลม

### $\mathbf F = \langle x, y, z\rangle$ หาฟลักซ์ออกผ่านทรงกลมรัศมี $a$

- บนทรงกลม $\mathbf F = \mathbf r = a\hat{\mathbf r}$ และ $\mathbf n = \hat{\mathbf r}$ จึง $\mathbf F\cdot\mathbf n = a$ คงที่ทั้งผิว

- $\Phi = a\iint dS = a\cdot4\pi a^2 = 4\pi a^3$

- ตรวจด้วยพารามิเตอร์: บนผิว $\mathbf F = a\,\hat{\mathbf r}$ และ $\mathbf r_u\times\mathbf r_v = a^2\sin u\,\hat{\mathbf r}$ ($\hat{\mathbf r} = \langle\sin u\cos v,\ \sin u\sin v,\ \cos u\rangle$) ดอตกันได้ $a\cdot a^2\sin u$ → $\int_0^{2\pi}\!\int_0^\pi a^3\sin u\,du\,dv = 4\pi a^3$ ✓

$\Phi = 4\pi a^3$ (และจะได้ค่าเดียวกันจากทฤษฎีบทดีเวอร์เจนซ์ใน S-7)

ตัวอย่าง S-5 · ฟลักซ์ผ่านระนาบเอียง

### $\mathbf F = \langle x, y, z\rangle$ หาฟลักซ์ขึ้นผ่านส่วนของระนาบ $x + y + z = 1$ ในอ็อกแทนต์แรก

- เป็นกราฟ $z = g(x, y) = 1 - x - y$ · $g_x = g_y = -1$ · บริเวณเงา: สามเหลี่ยม $x, y \ge 0,\ x + y \le 1$

- $-Pg_x - Qg_y + R = -x(-1) - y(-1) + z = x + y + (1 - x - y) = 1$

- $\Phi = \iint_D1\,dA = \text{พื้นที่สามเหลี่ยม} = \dfrac12$

- เหตุผลเรขาคณิต: $\mathbf F\cdot\mathbf n$ บนระนาบเท่ากับระยะจากจุดกำเนิดถึงระนาบ $= 1/\sqrt3$ คงที่ และพื้นที่ผิวของสามเหลี่ยมเอียง $= \sqrt3/2$ → $\Phi = \dfrac{1}{\sqrt3}\cdot\dfrac{\sqrt3}{2} = \dfrac12$ ✓

$\Phi = \dfrac12$

ตัวอย่าง S-6 · อัตราการไหลในท่อ (เครื่องกล / โยธา)

### น้ำไหลแบบราบเรียบในท่อกลมรัศมี $R = 50$ mm มีโปรไฟล์ความเร็ว $v(r) = v_{\max}\left(1 - \dfrac{r^2}{R^2}\right)$ เมื่อ $v_{\max} = 1.2$ m/s หาอัตราการไหลเชิงปริมาตรและความเร็วเฉลี่ย

- หน้าตัดเป็นแผ่นวงกลมตั้งฉากกับการไหล $\mathbf n = \hat{\mathbf z}$ ฟลักซ์ = $\iint v\,dA$

- พิกัดขั้ว: $Q = \displaystyle\int_0^{2\pi}\!\int_0^R v_{\max}\left(1 - \dfrac{r^2}{R^2}\right)r\,dr\,d\theta = 2\pi v_{\max}\left[\dfrac{R^2}{2} - \dfrac{R^2}{4}\right] = \dfrac{\pi R^2v_{\max}}{2}$

- ตัวเลข: $Q = \dfrac{\pi(0.05)^2(1.2)}{2} = 4.712\times10^{-3}$ m³/s = 4.71 L/s

- ความเร็วเฉลี่ย $\bar v = Q/(\pi R^2) = v_{\max}/2 = 0.6$ m/s (ค่าที่มิเตอร์วัดการไหลอ่านจากอัตราไหลหารพื้นที่)

$Q = 4.71$ L/s · $\bar v = 0.6$ m/s = ครึ่งหนึ่งของ $v_{\max}$

## ทฤษฎีบทดีเวอร์เจนซ์ของเกาส์ (Divergence Theorem) ขั้นสูง

ลองนึกถึงห้องที่มีเครื่องทำอากาศไหลออกจากเครื่อง ลมที่ไหลออกทางประตูและหน้าต่างทั้งหมดเท่ากับลมที่เครื่องปล่อยออกมาภายในห้อง นี่คือสาระของทฤษฎีบท: ฟลักซ์ออกสุทธิผ่านผิวปิด = ผลรวมของดีเวอร์เจนซ์ (แหล่งกำเนิด) ภายในปริมาตร ความจริงนี้ใช้แปลงอินทิกรัลบนผิวที่ยาก (หลายหน้า) เป็นอินทิกรัลสามชั้นเดียว หรือกลับกัน

S6 Divergence theorem (Gauss) ทฤษฎีบทดีเวอร์เจนซ์ (เกาส์)

$$\oiint_S\mathbf F\cdot\mathbf n\,dS = \iiint_E\nabla\cdot\mathbf F\,dV \qquad(\mathbf n\ \text{ชี้ออกนอก } E,\ \ \partial E = S)$$

ต้องการ $\mathbf F$ เรียบ (มีอนุพันธ์ย่อยต่อเนื่อง) ทั่วทั้ง $E$ รวมภายใน — ถ้ามีจุดที่ $\mathbf F$ ไม่นิยามข้างใน (เช่นประจุจุดที่ $r = 0$) ทฤษฎีบทใช้ตรง ๆ ไม่ได้ · เป็นรูป 3 มิติของทฤษฎีบทกรีนฟลักซ์ (L7)

S7 Gauss's law (electrostatics) กฎของเกาส์ (ไฟฟ้าสถิต)

$$\oiint_S\mathbf E\cdot\mathbf n\,dS = \frac{Q_{\text{enc}}}{\varepsilon_0}\ \ \Longleftrightarrow\ \ \nabla\cdot\mathbf E = \frac{\rho_v}{\varepsilon_0}$$

สองรูปเชื่อมกันด้วยทฤษฎีบทดีเวอร์เจนซ์ (ใช้ $Q = \iiint\rho_v\,dV$) · ใช้หาสนามโดยตรงเมื่อมีความสมมาตร (ทรงกลม ทรงกระบอก ระนาบ) เลือกผิวเกาส์ให้ $\mathbf E\cdot\mathbf n$ คงที่

### ตัวตรวจ Gauss และ Stokes: คำนวณสองฝั่งให้ดู

โหมด Gauss คำนวณฟลักซ์ผ่านทุกหน้าของผิวปิด (ทรงกลม ลูกบาศก์ ทรงกระบอก) แล้วเทียบกับ $\iiint\nabla\cdot\mathbf F\,dV$ ตัวอย่างสุดท้าย $\mathbf F = \mathbf r/\rho^3$ (ประจุจุด) แสดงกรณีที่ทฤษฎีบท “ล้มเหลว” เพราะ $\mathbf F$ ไม่นิยามที่จุดกำเนิด ให้ฟลักซ์ $4\pi$ ทั้งที่ $\nabla\cdot\mathbf F = 0$ ทุกที่ที่นิยาม · แท็บ Stokes อยู่ในหัวข้อถัดไป

ทฤษฎีบทเกาส์ (ผิวปิด S ล้อมปริมาตร E · $\mathbf n$ ชี้ออก) เทียบกับทฤษฎีบทสโตกส์ (ผิวเปิด S ที่มีขอบ C · ทิศ $\mathbf n$ สัมพันธ์กับทิศวนของ C ตามกฎมือขวา)

ตัวอย่าง S-7 · ใช้ทฤษฎีบทแทนอินทิกรัลผิวหกหน้า

### (ก) ทรงกลม: $\mathbf F = \langle x, y, z\rangle$ (ข) ลูกบาศก์หนึ่งหน่วย $[0,1]^3$: $\mathbf F = \langle x^2, y^2, z^2\rangle$ หาฟลักซ์ออกรวม

- (ก) $\nabla\cdot\mathbf F = 3$ · $\iiint3\,dV = 3\cdot\dfrac{4\pi a^3}{3} = 4\pi a^3$ ตรงกับ S-4 ที่คำนวณฟลักซ์บนผิวโดยตรง ✓

- (ข) $\nabla\cdot\mathbf F = 2x + 2y + 2z$ · $\iiint_{[0,1]^3}2(x + y + z)\,dV = 2\left(\tfrac12 + \tfrac12 + \tfrac12\right) = 3$

- ตรวจโดยตรง (ข): หน้า $x = 1$ ให้ $\iint x^2\,dy\,dz = 1$, หน้า $x = 0$ ให้ 0 · ทำนองเดียวกันสำหรับ $y$ และ $z$ → $1 + 1 + 1 = 3$ ✓ (หกหน้าต้องบวกกัน แต่ทฤษฎีบทลดเหลืออินทิกรัลเดียว)

(ก) $\Phi = 4\pi a^3$ · (ข) $\Phi = 3$

ตัวอย่าง S-8 · ใช้กฎของเกาส์หาสนามไฟฟ้า (ไฟฟ้า)

### (ก) ประจุเส้นยาวอนันต์ $\lambda = 10$ nC/m หา $E$ ที่ระยะ 0.5 m (ข) ทรงกลมตันรัศมี $a = 0.1$ m มีประจุสม่ำเสมอ $\rho = 1\ \mu\text{C/m}^3$ หา $E$ ที่ $r = 0.05$ m และที่ผิว

- (ก) ผิวเกาส์: ทรงกระบอกรัศมี $r$ ยาว $L$ · ฟลักซ์ทะลุผนังข้างเท่านั้น $E\cdot2\pi rL = \dfrac{\lambda L}{\varepsilon_0}$ → $E = \dfrac{\lambda}{2\pi\varepsilon_0r}$

- แทนค่า: $E = \dfrac{10\times10^{-9}}{2\pi(8.854\times10^{-12})(0.5)} = 359.5$ V/m (ชี้ออกตามรัศมี)

- (ข) ผิวเกาส์ทรงกลมรัศมี $r < a$: $E\cdot4\pi r^2 = \dfrac{\rho\cdot\frac43\pi r^3}{\varepsilon_0}$ → $E = \dfrac{\rho r}{3\varepsilon_0}$ (เพิ่มเป็นเส้นตรงตาม $r$)

- $r = 0.05$: $E = \dfrac{10^{-6}(0.05)}{3(8.854\times10^{-12})} = 1882$ V/m · ที่ผิว $r = a = 0.1$: $E = 3765$ V/m

- ตรวจที่ผิวด้วยกฎของคูลอมบ์: $Q = \rho\cdot\frac43\pi a^3 = 4.189\times10^{-9}$ C → $\dfrac{kQ}{a^2} = \dfrac{8.988\times10^{9}\times4.189\times10^{-9}}{0.01} = 3765$ V/m ✓ ต่อเนื่องที่ผิว

(ก) $E = 359.5$ V/m · (ข) $E(0.05) = 1882$ V/m, $E(a) = 3765$ V/m

## ทฤษฎีบทสโตกส์ (Stokes' Theorem) ขั้นสูง

ทฤษฎีบทกรีนเกี่ยวกับการหมุนวนรอบวงปิดในระนาบ สโตกส์ยกขึ้นเป็นสามมิติ: การหมุนวน ($\oint\mathbf F\cdot d\mathbf r$) รอบขอบ $C$ ของผิวเปิด $S$ เท่ากับฟลักซ์ของ curl ผ่านผิว $S$ ผิวใดก็ได้ที่มีขอบเป็น $C$ (ผิวโค้งตะกร้า แผ่นเรียบ หรืออื่นใดให้ค่าเท่ากันทั้งหมด) นี่คือประโยชน์ใหญ่: เลือกผิวที่อินทิเกรตง่ายที่สุด ทิศ $\mathbf n$ ต้องสอดคล้องกับทิศวนของ $C$ ตามกฎมือขวา: ให้นิ้วทั้งสี่โค้งตามทิศวน $C$ นิ้วหัวแม่มือชี้ทางของ $\mathbf n$

S8 Stokes' theorem ทฤษฎีบทสโตกส์

$$\oint_C\mathbf F\cdot d\mathbf r = \iint_S(\nabla\times\mathbf F)\cdot\mathbf n\,dS \qquad(\partial S = C,\ \text{ทิศตามกฎมือขวา})$$

ถ้า $S$ แบนอยู่ในระนาบ $xy$ จะลดเหลือทฤษฎีบทกรีน (L6) · $\nabla\times\mathbf F = \mathbf 0$ ⇒ งานรอบวงปิดเป็น 0 (สนามอนุรักษ์) · เป็นที่มาของกฎของแอมแปร์และฟาราเดย์

S9 Ampère's and Faraday's laws กฎของแอมแปร์และฟาราเดย์

$$\oint_C\mathbf B\cdot d\mathbf l = \mu_0 I_{\text{enc}}\ \Leftrightarrow\ \nabla\times\mathbf B = \mu_0\mathbf J,\qquad \oint_C\mathbf E\cdot d\mathbf l = -\frac{d\Phi_B}{dt}\ \Leftrightarrow\ \nabla\times\mathbf E = -\frac{\partial\mathbf B}{\partial t}$$

$I_{enc} = \iint\mathbf J\cdot\mathbf n\,dS$ · $\Phi_B = \iint\mathbf B\cdot\mathbf n\,dS$ · ข้อแรกเป็นกรณีสถิต (เพิ่ม $\mu_0\varepsilon_0\partial_t\mathbf E$ ในกรณีไดนามิก)

ลองในตัวตรวจ ข้างล่างเลือกแท็บ Stokes แล้วดูว่า “ครึ่งทรงกลม” “แผ่นวงกลม” และ “พาราโบลอยด์” ซึ่งมีขอบเป็นวงกลมเดียวกันที่ $z = 0$ ให้ $\iint(\nabla\times\mathbf F)\cdot\mathbf n\,dS$ เท่ากันหมด และเท่ากับ $\oint\mathbf F\cdot d\mathbf r$ รอบวงกลม

ตัวอย่าง S-9 · เลือกผิวง่ายแทนผิวโค้ง

### $\mathbf F = \langle -y^2,\ x,\ z^2\rangle$ และ $C$ คือเส้นโค้งตัดกันของระนาบ $y + z = 2$ กับทรงกระบอก $x^2 + y^2 = 1$ (วนทวนเข็มเมื่อมองจากข้างบน) หา $\oint_C\mathbf F\cdot d\mathbf r$

- $\nabla\times\mathbf F = \langle 0 - 0,\ 0 - 0,\ 1 - (-2y)\rangle = \langle 0, 0, 1 + 2y\rangle$

- เลือกผิว $S$ = ส่วนของระนาบ $z = 2 - y$ ภายในทรงกระบอก (เป็นวงรี) · $g_x = 0,\ g_y = -1$ · $\mathbf n\,dS = \langle -g_x, -g_y, 1\rangle\,dA = \langle 0, 1, 1\rangle\,dA$ (ชี้ขึ้น)

- $(\nabla\times\mathbf F)\cdot\mathbf n\,dS = (1 + 2y)\cdot1\,dA$ · บริเวณเงา: แผ่นวงกลมรัศมี 1

- $\displaystyle\oint_C = \iint_{x^2+y^2\le1}(1 + 2y)\,dA = \pi + 2\iint y\,dA = \pi + 0 = \pi$ ($\iint y\,dA = 0$ โดยสมมาตร)

- ถ้าอินทิเกรตเส้นตรง ๆ ต้องพารามิเตอร์ $\langle\cos t, \sin t, 2 - \sin t\rangle$ แล้วคำนวณ $\int(-\sin^2t)(-\sin t) + \cos t\cos t + (2-\sin t)^2(-\cos t)\,dt$ ซึ่งยาวกว่าอย่างเห็นได้ชัด — และได้ $\pi$ เช่นกัน

$\oint_C\mathbf F\cdot d\mathbf r = \pi$

ตัวอย่าง S-10 · แรงเคลื่อนไฟฟ้าเหนี่ยวนำ (ไฟฟ้า)

### ห่วงลวดวงกลมรัศมี 5 cm วางตั้งฉากกับสนามแม่เหล็กสม่ำเสมอ $B(t) = B_0\sin\omega t$ เมื่อ $B_0 = 0.2$ T ความถี่ 50 Hz หาค่าแรงเคลื่อนไฟฟ้าเหนี่ยวนำสูงสุด

- ฟลักซ์แม่เหล็ก $\Phi_B = \iint\mathbf B\cdot\mathbf n\,dS = B(t)\cdot\pi r^2 = \pi(0.05)^2B_0\sin\omega t = 7.854\times10^{-3}\times0.2\sin\omega t = 1.571\times10^{-3}\sin\omega t$ Wb

- กฎของฟาราเดย์ (จากสโตกส์): $\mathcal E = \oint\mathbf E\cdot d\mathbf l = -\dfrac{d\Phi_B}{dt} = -\omega\Phi_{\max}\cos\omega t$

- $\omega = 2\pi\times50 = 314.16$ rad/s · $\mathcal E_{\max} = 314.16\times1.571\times10^{-3} = 0.4935$ V

- ตีความ: สนามไฟฟ้า $\mathbf E$ ที่เกิดขึ้นรอบห่วงมี $\nabla\times\mathbf E \ne \mathbf 0$ จึงไม่อนุรักษ์ — นี่คือกลไกของหม้อแปลงและเครื่องกำเนิดไฟฟ้า (ค่าสูงสุด 0.49 V ต่อหนึ่งรอบ ขดลวด $N$ รอบได้ $N$ เท่า)

$\Phi_{\max} = 1.571$ mWb · $\mathcal E_{\max} \approx 0.494$ V ต่อรอบ

ตัวอย่าง S-11 · สนามแม่เหล็กรอบสายไฟ (ไฟฟ้า)

### สายไฟตรงยาวมากนำกระแส 100 A หา $B$ ที่ระยะ 2 m ด้วยกฎของแอมแปร์

- วงแอมแปร์: วงกลมรัศมี $r$ รอบสายไฟ · โดยสมมาตร $\mathbf B$ สัมผัสวงและขนาดคงที่ → $\oint\mathbf B\cdot d\mathbf l = B(2\pi r)$

- $B(2\pi r) = \mu_0I$ → $B = \dfrac{\mu_0I}{2\pi r}$

- $B = \dfrac{(4\pi\times10^{-7})(100)}{2\pi(2)} = 1.0\times10^{-5}$ T = 10 µT (ประมาณ 1/5 ของสนามแม่เหล็กโลกที่ ~50 µT)

- ข้อสังเกต: ในแบบอนุพันธ์ $\nabla\times\mathbf B = \mu_0\mathbf J$ ตรวจได้ว่า $\nabla\times\mathbf B = \mathbf 0$ นอกสายไฟ แต่ $\oint\mathbf B\cdot d\mathbf l \ne 0$ รอบสาย — ตัวอย่างของบริเวณที่มีรู (สนามนี้มีรูปแบบเดียวกับ $\langle -y, x\rangle/(x^2+y^2)$ ในบทสนามเวกเตอร์)

$B = \mu_0I/(2\pi r) = 10\ \mu\text{T}$ ที่ 2 m จากสาย 100 A

## สรุปสมการแมกซ์เวลล์: Gauss และ Stokes ในรูปที่ใช้จริง ขั้นสูง

สมการแมกซ์เวลล์สี่ข้อเขียนได้สองรูป รูปปริพันธ์ (บนผิวและเส้น) และรูปอนุพันธ์ (ที่จุด) ทั้งสองรูปเชื่อมกันด้วยทฤษฎีบทเกาส์ (ข้อ 1–2) และสโตกส์ (ข้อ 3–4) ซึ่งเป็นเหตุผลที่แคลคูลัสเวกเตอร์เป็นภาษาของแม่เหล็กไฟฟ้า

| กฎ | รูปปริพันธ์ (integral) | รูปอนุพันธ์ (differential) | ทฤษฎีบทที่ใช้ |

| เกาส์ (ไฟฟ้า) | $\oiint\mathbf D\cdot d\mathbf S = Q_{enc}$ | $\nabla\cdot\mathbf D = \rho_v$ | ดีเวอร์เจนซ์ |

| เกาส์ (แม่เหล็ก) | $\oiint\mathbf B\cdot d\mathbf S = 0$ | $\nabla\cdot\mathbf B = 0$ | ดีเวอร์เจนซ์ |

| ฟาราเดย์ | $\oint\mathbf E\cdot d\mathbf l = -\dfrac{d}{dt}\iint\mathbf B\cdot d\mathbf S$ | $\nabla\times\mathbf E = -\dfrac{\partial\mathbf B}{\partial t}$ | สโตกส์ |

| แอมแปร์–แมกซ์เวลล์ | $\oint\mathbf H\cdot d\mathbf l = I_{enc} + \dfrac{d}{dt}\iint\mathbf D\cdot d\mathbf S$ | $\nabla\times\mathbf H = \mathbf J + \dfrac{\partial\mathbf D}{\partial t}$ | สโตกส์ |

เพิ่มเติมที่ บทแคลคูลัสหลายตัวแปรในวิศวกรรมไฟฟ้า มีแล็บประจุจุดที่ตรวจกฎของเกาส์ด้วยทรงกลมเกาส์ที่ลากได้ และการหาสมการคลื่นจากสมการข้างบน

## นำไปใช้ในงานวิศวกรรม พื้นฐาน

| สาขา | อินทิกรัลบนผิว | ผลลัพธ์ |

| ไฟฟ้า | $\Phi_E = \oiint\mathbf E\cdot d\mathbf S$ | ประจุภายในผิวปิด (กฎของเกาส์) · สนามของเส้น/ระนาบ/ทรงกลมประจุ |

| ไฟฟ้า | $\Phi_B = \iint\mathbf B\cdot d\mathbf S$ | ฟลักซ์แม่เหล็กในแกนเหล็ก · $\mathcal E = -N\,d\Phi_B/dt$ ของหม้อแปลง |

| ไฟฟ้า | $\mathbf S = \mathbf E\times\mathbf H,\ P = \oiint\mathbf S\cdot d\mathbf A$ | กำลังที่ไหลผ่านผิว (เวกเตอร์พอยน์ติง) เช่นกำลังที่แผ่ออกจากเสาอากาศ |

| เครื่องกล | $Q = \iint\mathbf v\cdot\mathbf n\,dA$ | อัตราการไหลเชิงปริมาตรผ่านท่อ/หน้าตัด (ตัวอย่าง S-6) |

| เครื่องกล | $\dot Q = \iint\mathbf q\cdot\mathbf n\,dA$ | อัตราการถ่ายเทความร้อนผ่านผิว ($\mathbf q = -k\nabla T$) · ทั้งผิวปิดรอบวัตถุ = พลังงานความร้อนที่ผลิต |

| เครื่องกล | $A = \iint dS$ | พื้นที่ผิวเคลือบ/ทาสี/แลกเปลี่ยนความร้อน (ตัวอย่าง S-1, S-2) |

| โยธา | $F = \iint p\,\mathbf n\,dS$ | แรงดันน้ำสุทธิบนผิวโค้งของเขื่อนหรือประตูน้ำ (บทโยธา) |

| โยธา | $Q = \iint\mathbf v\cdot\mathbf n\,dS$ | ปริมาณน้ำซึมผ่านดิน $\mathbf v = -K\nabla h$ · ปริมาณน้ำท่าผ่านหน้าตัดลำน้ำ |

## ข้อผิดพลาดที่พบบ่อย พื้นฐาน

- ทิศ $\mathbf n$ ผิด · ผิวปิดต้องชี้ออกนอก · ผิวเปิดต้องสัมพันธ์กับทิศวนของขอบด้วยกฎมือขวา (เครื่องหมายผิดทั้งคำตอบ)

- ทำ $\mathbf r_u\times\mathbf r_v$ เป็นหนึ่งหน่วยก่อนคำนวณฟลักซ์ · ไม่ต้อง: ขนาดของมันคือ $dS$ อยู่แล้ว (ต่างจากอนุพันธ์ตามทิศที่ต้องทำเป็นหนึ่งหน่วย)

- ลืมปิดผิว เมื่อใช้ทฤษฎีบทดีเวอร์เจนซ์ · ผิวทรงกระบอกต้องรวมฝาบนและล่าง (ถ้าผิวไม่ปิด ต้องเพิ่มผิวปิดแล้วลบออก)

- ใช้ทฤษฎีบทเกาส์เมื่อ $\mathbf F$ ไม่นิยามภายใน · ตัวอย่างประจุจุด $\mathbf r/\rho^3$ ให้ $\nabla\cdot\mathbf F = 0$ แต่ฟลักซ์ $= 4\pi$

- สับสนเกาส์ กรีน สโตกส์ · เกาส์: ผิวปิด↔ปริมาตร (div) · กรีน: เส้นปิดในระนาบ↔บริเวณ · สโตกส์: เส้นปิดในอวกาศ↔ผิวเปิด (curl)

ไปต่อที่หน้าการประยุกต์: วิศวกรรมไฟฟ้า · วิศวกรรมเครื่องกล · วิศวกรรมโยธา

## คำถามที่พบบ่อย

ฟลักซ์ (flux) ของสนามเวกเตอร์ผ่านผิวคืออะไร?
ฟลักซ์ $\Phi = \iint_S \mathbf F\cdot\mathbf n\,dS$ คืออัตราที่สนามไหลผ่านผิว S เมื่อ $\mathbf n$ เป็นเวกเตอร์ปกติหนึ่งหน่วย เมื่อ $\mathbf F$ เป็นความเร็วของน้ำ ฟลักซ์คืออัตราการไหลเชิงปริมาตร (m³/s) เมื่อ $\mathbf F$ เป็นสนามไฟฟ้า ฟลักซ์คือ $\Phi_E$ ในกฎของเกาส์ เฉพาะองค์ประกอบของสนามที่ตั้งฉากกับผิวเท่านั้นที่ส่งผ่าน องค์ประกอบที่ขนานผิวไหลเฉียดไม่ผ่าน ฟลักซ์เป็นบวกเมื่อไหลไปทางเดียวกับ $\mathbf n$

ทฤษฎีบทดีเวอร์เจนซ์ (divergence theorem) ของเกาส์บอกอะไร?
ฟลักซ์ออกสุทธิผ่านผิวปิด S เท่ากับผลรวมของดีเวอร์เจนซ์ภายในปริมาตรที่ล้อม $\oiint_S \mathbf F\cdot\mathbf n\,dS = \iiint_E \nabla\cdot\mathbf F\,dV$ $\mathbf n$ ชี้ออกนอก ความหมายคือ “สิ่งที่ไหลออกทางผิว = สิ่งที่ถูกสร้างขึ้นภายใน” ใช้เปลี่ยนอินทิกรัลบนผิวหกหน้าให้เป็นอินทิกรัลสามชั้นเดียว เช่น $\mathbf F = \langle x, y, z\rangle$ ผ่านทรงกลมรัศมี $a$ ได้ $\iiint 3\,dV = 4\pi a^3$ และเป็นที่มาของกฎของเกาส์ในไฟฟ้าสถิต

ทฤษฎีบทสโตกส์ (Stokes' theorem) ใช้ทำอะไร?
เชื่อมการหมุนวนรอบเส้นปิด C กับ curl ที่ผ่านผิวใดก็ได้ S ที่มี C เป็นขอบ: $\oint_C \mathbf F\cdot d\mathbf r = \iint_S (\nabla\times\mathbf F)\cdot\mathbf n\,dS$ โดยทิศ $\mathbf n$ สัมพันธ์กับทิศวน C ตามกฎมือขวา ผลคือเลือกผิวที่คำนวณง่ายที่สุดได้ (เช่นแผ่นเรียบแทนผิวโค้ง) และเป็นที่มาของกฎของแอมแปร์และกฎของฟาราเดย์ในรูปอนุพันธ์ ถ้า $\nabla\times\mathbf F = \mathbf 0$ ทั้งสองฝั่งเป็นศูนย์ ตรงกับสนามอนุรักษ์

ทฤษฎีบทของกรีน เกาส์ และสโตกส์ต่างกันอย่างไร?
ทั้งสามเป็นรูปแบบของทฤษฎีบทมูลฐานแบบเดียวกัน (อินทิกรัลของอนุพันธ์บนบริเวณ = อินทิกรัลของฟังก์ชันบนขอบ) กรีนใช้กับบริเวณในระนาบและขอบเป็นเส้นปิด (curl หรือ div ในสองมิติ) สโตกส์ยกกรีนขึ้นสามมิติ: ผิวในอวกาศและขอบเป็นเส้นปิด (curl) ส่วนเกาส์ (ดีเวอร์เจนซ์) ใช้กับปริมาตรสามมิติและขอบเป็นผิวปิด (div) ตัวแปรเดียวก็คือทฤษฎีบทมูลฐานของแคลคูลัส $\int_a^b F'\,dx = F(b) - F(a)$

สมการแมกซ์เวลล์ (Maxwell's equations) เกี่ยวกับ Gauss และ Stokes อย่างไร?
สมการทั้งสี่เขียนได้สองรูปที่เชื่อมกันด้วยสองทฤษฎีบทนี้ รูปปริพันธ์ (ผิว/เส้น) กับรูปอนุพันธ์ (จุด) ทฤษฎีบทดีเวอร์เจนซ์แปลงกฎของเกาส์ $\oiint\mathbf D\cdot d\mathbf S = Q$ เป็น $\nabla\cdot\mathbf D = \rho_v$ และ $\oiint\mathbf B\cdot d\mathbf S = 0$ เป็น $\nabla\cdot\mathbf B = 0$ ส่วนทฤษฎีบทสโตกส์แปลงกฎของฟาราเดย์ $\oint\mathbf E\cdot d\mathbf l = -d\Phi_B/dt$ เป็น $\nabla\times\mathbf E = -\partial\mathbf B/\partial t$ และกฎของแอมแปร์ในทำนองเดียวกัน

มด

อาจารย์มด · ธีรวุฒิ แสวงบุญ
อาจารย์สาขาวิชาวิศวกรรมไฟฟ้า มหาวิทยาลัยราชภัฏธนบุรี สมุทรปราการ · ดูโปรไฟล์

## คำถามที่พบบ่อย (FAQ)

**ฟลักซ์ (flux) ของสนามเวกเตอร์ผ่านผิวคืออะไร?**
ฟลักซ์ $\Phi = \iint_S \mathbf F\cdot\mathbf n\,dS$ คืออัตราที่สนามไหลผ่านผิว S เมื่อ $\mathbf n$ เป็นเวกเตอร์ปกติหนึ่งหน่วย เมื่อ $\mathbf F$ เป็นความเร็วของน้ำ ฟลักซ์คืออัตราการไหลเชิงปริมาตร (m³/s) เมื่อ $\mathbf F$ เป็นสนามไฟฟ้า ฟลักซ์คือ $\Phi_E$ ในกฎของเกาส์ เฉพาะองค์ประกอบของสนามที่ตั้งฉากกับผิวเท่านั้นที่ส่งผ่าน องค์ประกอบที่ขนานผิวไหลเฉียดไม่ผ่าน ฟลักซ์เป็นบวกเมื่อไหลไปทางเดียวกับ $\mathbf n$

**ทฤษฎีบทดีเวอร์เจนซ์ (divergence theorem) ของเกาส์บอกอะไร?**
ฟลักซ์ออกสุทธิผ่านผิวปิด S เท่ากับผลรวมของดีเวอร์เจนซ์ภายในปริมาตรที่ล้อม $\oiint_S \mathbf F\cdot\mathbf n\,dS = \iiint_E \nabla\cdot\mathbf F\,dV$ $\mathbf n$ ชี้ออกนอก ความหมายคือ “สิ่งที่ไหลออกทางผิว = สิ่งที่ถูกสร้างขึ้นภายใน” ใช้เปลี่ยนอินทิกรัลบนผิวหกหน้าให้เป็นอินทิกรัลสามชั้นเดียว เช่น $\mathbf F = \langle x, y, z\rangle$ ผ่านทรงกลมรัศมี $a$ ได้ $\iiint 3\,dV = 4\pi a^3$ และเป็นที่มาของกฎของเกาส์ในไฟฟ้าสถิต

**ทฤษฎีบทสโตกส์ (Stokes' theorem) ใช้ทำอะไร?**
เชื่อมการหมุนวนรอบเส้นปิด C กับ curl ที่ผ่านผิวใดก็ได้ S ที่มี C เป็นขอบ: $\oint_C \mathbf F\cdot d\mathbf r = \iint_S (\nabla\times\mathbf F)\cdot\mathbf n\,dS$ โดยทิศ $\mathbf n$ สัมพันธ์กับทิศวน C ตามกฎมือขวา ผลคือเลือกผิวที่คำนวณง่ายที่สุดได้ (เช่นแผ่นเรียบแทนผิวโค้ง) และเป็นที่มาของกฎของแอมแปร์และกฎของฟาราเดย์ในรูปอนุพันธ์ ถ้า $\nabla\times\mathbf F = \mathbf 0$ ทั้งสองฝั่งเป็นศูนย์ ตรงกับสนามอนุรักษ์

**ทฤษฎีบทของกรีน เกาส์ และสโตกส์ต่างกันอย่างไร?**
ทั้งสามเป็นรูปแบบของทฤษฎีบทมูลฐานแบบเดียวกัน (อินทิกรัลของอนุพันธ์บนบริเวณ = อินทิกรัลของฟังก์ชันบนขอบ) กรีนใช้กับบริเวณในระนาบและขอบเป็นเส้นปิด (curl หรือ div ในสองมิติ) สโตกส์ยกกรีนขึ้นสามมิติ: ผิวในอวกาศและขอบเป็นเส้นปิด (curl) ส่วนเกาส์ (ดีเวอร์เจนซ์) ใช้กับปริมาตรสามมิติและขอบเป็นผิวปิด (div) ตัวแปรเดียวก็คือทฤษฎีบทมูลฐานของแคลคูลัส $\int_a^b F'\,dx = F(b) - F(a)$

**สมการแมกซ์เวลล์ (Maxwell's equations) เกี่ยวกับ Gauss และ Stokes อย่างไร?**
สมการทั้งสี่เขียนได้สองรูปที่เชื่อมกันด้วยสองทฤษฎีบทนี้ รูปปริพันธ์ (ผิว/เส้น) กับรูปอนุพันธ์ (จุด) ทฤษฎีบทดีเวอร์เจนซ์แปลงกฎของเกาส์ $\oiint\mathbf D\cdot d\mathbf S = Q$ เป็น $\nabla\cdot\mathbf D = \rho_v$ และ $\oiint\mathbf B\cdot d\mathbf S = 0$ เป็น $\nabla\cdot\mathbf B = 0$ ส่วนทฤษฎีบทสโตกส์แปลงกฎของฟาราเดย์ $\oint\mathbf E\cdot d\mathbf l = -d\Phi_B/dt$ เป็น $\nabla\times\mathbf E = -\partial\mathbf B/\partial t$ และกฎของแอมแปร์ในทำนองเดียวกัน
