---
title: "การหมุนแกนพิกัด: เมทริกซ์หมุน มุมออยเลอร์ และการเปลี่ยนกรอบอ้างอิง"
url: https://modsengineeringmath.com/learn/vector-algebra/coordinate-rotation/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-10-13
---

> เรียนการหมุนแกนภาษาไทย: เวกเตอร์เดียวกันมีองค์ประกอบต่างกันในสองกรอบ สูตร x′ = x cos θ + y sin θ หมุนแกนกับหมุนเวกเตอร์ เมทริกซ์หมุนตั้งฉาก RᵀR = I det R = 1 พื้นเอียง เมทริกซ์ Rx Ry Rz ลำดับการหมุน มุมออยเลอร์ Z-Y-X ของโดรนและ IMU หามุมเอียงจากแรงโน้มถ่วง สูตรโรดริเกส และการแปลง Clarke-Park ของมอเตอร์ พร้อมฉาก 3 มิติหมุนกรอบได้

ฉบับ Markdown ของ https://modsengineeringmath.com/learn/vector-algebra/coordinate-rotation/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# การหมุนแกนพิกัด: เมทริกซ์หมุน มุมออยเลอร์ และการเปลี่ยนกรอบอ้างอิง

// เวกเตอร์ · ส่วนที่ 3 · Rotation of axes & rotation matrices


โจทย์พื้นเอียงง่ายขึ้นทันทีเมื่อหมุนแกน x ให้ขนานกับพื้น โดรนรู้ว่าตัวเองเอียงเท่าไรจากการอ่านแรงโน้มถ่วงในแกนของตัวเอง และอินเวอร์เตอร์ขับมอเตอร์ควบคุมกระแสได้นิ่งเพราะหมุนแกนตามโรเตอร์ ทั้งหมดใช้ความคิดเดียว: เวกเตอร์ไม่เปลี่ยน แต่ตัวเลขที่ใช้บรรยายมันเปลี่ยนตามกรอบ บทนี้สร้างเมทริกซ์หมุนจาก dot product แล้วต่อยอดสู่สามมิติ มุมออยเลอร์ และงานไฟฟ้า

สรุปใน 30 วินาที

- องค์ประกอบในแกนใหม่ = dot product กับเวกเตอร์หนึ่งหน่วยของแกนใหม่

- 2D: $x'=x\cos\theta+y\sin\theta,\ y'=-x\sin\theta+y\cos\theta$ คือ $\mathbf v'=R(\theta)^{\mathsf T}\mathbf v$

- $R^{\mathsf T}R=I,\ \det R=1$: ความยาวและมุมไม่เปลี่ยน

- 3D: $R=R_z(\psi)R_y(\theta)R_x(\phi)$ ลำดับสำคัญ — คูณสลับแล้วได้คนละการหมุน

## 1. แนวคิด: ลูกศรเดิม ตัวเลขใหม่ พื้นฐาน

เวกเตอร์ความยาว 7.21 หน่วยที่ชี้ไปทางหนึ่ง อาจเขียนเป็น (6, 4) ในแกน xy หรือ (7.20, 0.46) ในแกนที่หมุนไป 30° ทั้งสองชุดบรรยายลูกศรเส้นเดียวกัน การเลือกกรอบที่ดีทำให้สมการง่ายลง เช่น ให้แกนหนึ่งขนานกับพื้นเอียง กับเพลามอเตอร์ หรือกับแขนหุ่นยนต์

เครื่องมือที่ทำงานนี้คือ dot product: ถ้า $\mathbf e_1'$ คือเวกเตอร์หนึ่งหน่วยของแกน x′ องค์ประกอบ x′ ของ $\mathbf v$ คือ $\mathbf v\cdot\mathbf e_1'$ (การฉายบนแกนใหม่ ดู Component · Projection)

## 2. หมุนแกนในระนาบ พื้นฐาน

หมุนแกนไปทวนเข็ม θ เวกเตอร์หนึ่งหน่วยของแกนใหม่คือ $\mathbf e_1'=(\cos\theta,\sin\theta)$ และ $\mathbf e_2'=(-\sin\theta,\cos\theta)$ จึงได้

T1 Rotation of axes (2D) องค์ประกอบในแกนที่หมุน θ

$$x'=\mathbf v\cdot\mathbf e_1'=x\cos\theta+y\sin\theta,\qquad y'=\mathbf v\cdot\mathbf e_2'=-x\sin\theta+y\cos\theta$$

$$\begin{bmatrix}x'\\y'\end{bmatrix}=\begin{bmatrix}\cos\theta&\sin\theta\\-\sin\theta&\cos\theta\end{bmatrix}\begin{bmatrix}x\\y\end{bmatrix}=R(\theta)^{\mathsf T}\begin{bmatrix}x\\y\end{bmatrix}$$

T2 Active vs passive rotation หมุนเวกเตอร์กับหมุนแกน

$$\text{หมุนเวกเตอร์ (active): }\mathbf v_{\text{new}}=R(\theta)\mathbf v,\qquad \text{หมุนแกน (passive): }\mathbf v'=R(\theta)^{\mathsf T}\mathbf v=R(-\theta)\mathbf v,\qquad R(\theta)=\begin{bmatrix}\cos\theta&-\sin\theta\\\sin\theta&\cos\theta\end{bmatrix}$$

ความสับสนอันดับหนึ่งของบทนี้: ตำราหุ่นยนต์มักใช้ active ส่วนตำรากลศาสตร์มักใช้ passive ให้ดูว่าอะไรถูกหมุน — ลูกศรหรือแกน

ตัวอย่าง T-1 · อ่านเวกเตอร์ในแกนที่หมุน 30°

### $\mathbf v=(6,4)$ จงหาองค์ประกอบในแกนที่หมุนทวนเข็ม 30°

- $x'=6\cos30^\circ+4\sin30^\circ=5.196+2=7.196$

- $y'=-6\sin30^\circ+4\cos30^\circ=-3+3.464=0.464$

- ตรวจความยาว: $\sqrt{6^2+4^2}=7.211$ และ $\sqrt{7.196^2+0.464^2}=7.211$ ✓

$\mathbf v'=(7.196,\ 0.464)$ — แกน x′ เกือบขนานกับ v จึงได้ y′ เล็ก

เปิด JavaScript เพื่อใช้แล็บ

## 3. เมทริกซ์หมุนเป็นเมทริกซ์ตั้งฉาก กลาง

T3 Properties of rotation matrices สมบัติของเมทริกซ์หมุน

$$R^{\mathsf T}R=RR^{\mathsf T}=I,\qquad R^{-1}=R^{\mathsf T},\qquad \det R=+1,\qquad \lVert R\mathbf v\rVert=\lVert\mathbf v\rVert,\qquad (R\mathbf a)\cdot(R\mathbf b)=\mathbf a\cdot\mathbf b$$

ทุกคอลัมน์คือแกนใหม่หนึ่งแกนที่เขียนในกรอบเดิม ถ้า det = −1 คือการสะท้อน (กลับมือ) ไม่ใช่การหมุน อินเวอร์สที่ได้จากการทรานสโพสทำให้คอมพิวเตอร์คำนวณเร็วมาก

เชื่อมกับ เมทริกซ์และการดำเนินการ และ ค่าเฉพาะ: เมทริกซ์หมุนสามมิติมีค่าเฉพาะ 1 หนึ่งค่า เวกเตอร์เฉพาะคู่กับค่านี้คือแกนหมุน

## 4. ใช้จริงครั้งแรก: พื้นเอียง พื้นฐาน

วางแกน x′ ตามพื้นเอียงมุม θ และ y′ ตั้งฉากพื้น น้ำหนัก $\mathbf W=(0,-mg)$ ในแกนเดิม หมุนแกนด้วย T1 ได้ $W_{x'}=-mg\sin\theta$ (ลงเนิน) และ $W_{y'}=-mg\cos\theta$ (กดพื้น) ทันที ไม่ต้องจำรูปสามเหลี่ยมที่สับสนมุม

ตัวอย่าง T-2 · กล่อง 10 kg บนพื้นเอียง 30°

### จงหาองค์ประกอบน้ำหนักขนานและตั้งฉากกับพื้นด้วยการหมุนแกน

- $\mathbf W=(0,-98.1)$ N, θ = 30°

- $W_{x'}=0\cdot\cos30^\circ+(-98.1)\sin30^\circ=-49.05$ N · $W_{y'}=-0\cdot\sin30^\circ+(-98.1)\cos30^\circ=-84.96$ N

49.05 N ลงเนิน และ 84.96 N กดพื้น — ต่อด้วยแรงเสียดทานในแล็บด้านล่าง

เปิด JavaScript เพื่อใช้แล็บ

## 5. หมุนในสามมิติ: Rx Ry Rz และลำดับการหมุน กลาง

T4 Elementary rotations (active, right-hand rule) เมทริกซ์หมุนรอบแกนหลัก

$$R_x(\phi)=\begin{bmatrix}1&0&0\\0&\cos\phi&-\sin\phi\\0&\sin\phi&\cos\phi\end{bmatrix},\quad R_y(\theta)=\begin{bmatrix}\cos\theta&0&\sin\theta\\0&1&0\\-\sin\theta&0&\cos\theta\end{bmatrix},\quad R_z(\psi)=\begin{bmatrix}\cos\psi&-\sin\psi&0\\\sin\psi&\cos\psi&0\\0&0&1\end{bmatrix}$$

สังเกตเครื่องหมายของ R_y สลับตำแหน่งกับอีกสองตัว เพราะลำดับวงจร z → x (x × z = −y)

T5 Composition is not commutative ลำดับการหมุนสำคัญ

$$R_z(90^\circ)R_x(90^\circ)\,\mathbf i=\mathbf j\qquad\text{แต่}\qquad R_x(90^\circ)R_z(90^\circ)\,\mathbf i=\mathbf k$$

ลองกับโทรศัพท์จริง: หมุนรอบแกนตั้งก่อนแล้วพลิก กับพลิกก่อนแล้วหมุน หน้าจอจะชี้คนละทิศ

## 6. มุมออยเลอร์ Z-Y-X: yaw pitch roll ของโดรนและแขนกล ขั้นสูง

T6 Z-Y-X Euler angles มุมออยเลอร์แบบ yaw-pitch-roll

$$R=R_z(\psi)\,R_y(\theta)\,R_x(\phi),\qquad \mathbf v_{\text{world}}=R\,\mathbf v_{\text{body}},\qquad \mathbf v_{\text{body}}=R^{\mathsf T}\mathbf v_{\text{world}}$$

ψ (yaw) หันรอบแกนตั้ง θ (pitch) เงยรอบแกน y ใหม่ φ (roll) หมุนควงรอบแกน x ใหม่ เมื่อ θ = ±90° จะเกิด gimbal lock (yaw กับ roll กลายเป็นแกนเดียวกัน) ระบบจริงจึงนิยม quaternion ภายใน

T7 Tilt from gravity (accelerometer at rest) หามุมเอียงจากแรงโน้มถ่วง

$$\mathbf f_{\text{body}}=R^{\mathsf T}\begin{bmatrix}0\\0\\g\end{bmatrix}=g\begin{bmatrix}-\sin\theta\\\sin\phi\cos\theta\\\cos\phi\cos\theta\end{bmatrix}\ \Rightarrow\ \theta=\operatorname{atan2}\!\big(-f_x,\sqrt{f_y^2+f_z^2}\big),\quad \phi=\operatorname{atan2}(f_y,f_z)$$

yaw หาจากแรงโน้มถ่วงไม่ได้ (การหมุนรอบแกนตั้งไม่เปลี่ยนทิศของ g) ต้องใช้แมกนีโตมิเตอร์ช่วย ดูตัวอย่าง K-5

ตัวอย่าง T-3 · ตรวจมุมเอียงของ IMU

### บอร์ดเอียงด้วย ψ = 40°, θ = −25°, φ = 20° จงหาเมทริกซ์ R ค่าที่ accelerometer อ่านได้ขณะนิ่ง และกู้มุมเอียงกลับ

- $R=R_z(40^\circ)R_y(-25^\circ)R_x(20^\circ)=\begin{bmatrix}0.6943&-0.7147&-0.0844\\0.5826&0.6269&-0.5173\\0.4226&0.3100&0.8517\end{bmatrix}$, det R = 1

- $\mathbf f=R^{\mathsf T}(0,0,9.81)=9.81\times(\text{แถวที่ 3 ของ }R)=(4.146,\ 3.041,\ 8.355)$ m/s²

- $\theta=\operatorname{atan2}(-4.146,\sqrt{3.041^2+8.355^2})=-25.0^\circ$, $\phi=\operatorname{atan2}(3.041,8.355)=20.0^\circ$ ✓

- ψ = 40° ไม่ปรากฏใน f เลย ยืนยันว่าต้องใช้เซนเซอร์อื่นหา yaw

accelerometer อ่าน (4.15, 3.04, 8.36) m/s² และกู้ pitch −25°, roll 20° ได้ตรง

เปิด JavaScript เพื่อใช้ฉาก 3 มิติ

## 7. หมุนรอบแกนใด ๆ: สูตรโรดริเกส ขั้นสูง

T8 Rodrigues' rotation formula หมุนรอบแกนหนึ่งหน่วย k ด้วยมุม θ

$$\mathbf v_{\text{rot}}=\mathbf v\cos\theta+(\mathbf k\times\mathbf v)\sin\theta+\mathbf k(\mathbf k\cdot\mathbf v)(1-\cos\theta)$$

อ่านจากเวกเตอร์ล้วน: ส่วนที่ขนานกับแกน $\mathbf k(\mathbf k\cdot\mathbf v)$ ไม่หมุน ส่วนตั้งฉากหมุนในระนาบที่มี $\mathbf v_\perp$ และ $\mathbf k\times\mathbf v$ เป็นแกน — ใช้ทั้ง dot และ cross ในสูตรเดียว

ตัวอย่าง T-4 · หมุนรอบแนวทแยง

### หมุน $\mathbf i=(1,0,0)$ รอบแกน $\mathbf k=(1,1,1)/\sqrt3$ ไป 120°

- $\mathbf k\cdot\mathbf i=1/\sqrt3$, $\mathbf k\times\mathbf i=(0,1,-1)/\sqrt3$, $\cos120^\circ=-\tfrac12$, $\sin120^\circ=\tfrac{\sqrt3}{2}$

- $\mathbf v=(-\tfrac12,0,0)+\tfrac12(0,1,-1)+\tfrac{1}{3}(1,1,1)(\tfrac32)=(-\tfrac12+\tfrac12,\ \tfrac12+\tfrac12,\ -\tfrac12+\tfrac12)=(0,1,0)$

ได้ $\mathbf j$ — การหมุน 120° รอบแนว (1,1,1) สลับแกน x → y → z → x เป็นวงจร

## 8. งานไฟฟ้า: การแปลง Clarke และ Park คือการหมุนแกน ขั้นสูง

มอเตอร์สามเฟสที่ควบคุมด้วย field oriented control (FOC) วัดกระแส $i_a,i_b,i_c$ ที่เป็นไซน์ แปลงเป็นเวกเตอร์สองมิติ $(i_\alpha,i_\beta)$ บนระนาบนิ่ง (Clarke) ซึ่งหมุนด้วยความเร็วซิงโครนัส จากนั้นหมุนแกนตามมุมโรเตอร์ θ (Park) เวกเตอร์กระแสจึงนิ่งในกรอบ dq ทำให้ตัวควบคุม PI ควบคุมค่าคงที่ได้ เหมือนนั่งบนม้าหมุนแล้วม้าตัวหน้าดูอยู่กับที่

T9 Clarke and Park transforms (amplitude-invariant) การแปลง Clarke และ Park

$$i_\alpha=\tfrac23\big(i_a-\tfrac12 i_b-\tfrac12 i_c\big),\quad i_\beta=\tfrac{1}{\sqrt3}(i_b-i_c);\qquad \begin{bmatrix}i_d\\i_q\end{bmatrix}=\begin{bmatrix}\cos\theta&\sin\theta\\-\sin\theta&\cos\theta\end{bmatrix}\begin{bmatrix}i_\alpha\\i_\beta\end{bmatrix}$$

เมทริกซ์ Park คือ T1 ทุกประการ — เป็นการหมุนแกนแบบ passive ด้วยมุมไฟฟ้าของโรเตอร์

ตัวอย่าง T-5 · กระแสสามเฟสสมดุล 10 A ที่ ωt = 30°

### $i_a=10\cos\omega t,\ i_b=10\cos(\omega t-120^\circ),\ i_c=10\cos(\omega t+120^\circ)$ จงหา $i_\alpha,i_\beta$ และ $i_d,i_q$ เมื่อ θ = ωt = 30°

- $i_a=8.660,\ i_b=0,\ i_c=-8.660$ A

- Clarke: $i_\alpha=\tfrac23(8.660-0+4.330)=8.660$ A, $i_\beta=(0+8.660)/\sqrt3=5.000$ A → เวกเตอร์ยาว 10 A ที่มุม 30°

- Park: $i_d=8.660\cos30^\circ+5\sin30^\circ=10.00$ A, $i_q=-8.660\sin30^\circ+5\cos30^\circ=0$ A

- ไม่ว่า ωt เป็นเท่าใด ได้ $i_d=10,\ i_q=0$ เสมอ: ไซน์สามเส้นกลายเป็นค่าคงที่สองค่า

$i_d=10$ A, $i_q=0$ — นี่คือเหตุผลที่ FOC ควบคุมแรงบิดของมอเตอร์ได้เหมือนมอเตอร์ DC

รายละเอียดการควบคุมอยู่ใน ระบบควบคุมในอิเล็กทรอนิกส์กำลัง และการหมุนของเฟสเซอร์ใน พื้นฐานเฟสเซอร์

## 9. ข้อผิดพลาดที่พบบ่อย

| ข้อผิดพลาด | วิธีป้องกัน |

| ใช้ R แทน Rᵀ (หรือกลับกัน) | ถามตัวเองว่าหมุนลูกศรหรือหมุนแกน ตรวจด้วยกรณีง่าย θ = 90° |

| คูณเมทริกซ์ผิดลำดับ | ZYX หมายถึง $R_zR_yR_x$ เวกเตอร์ถูกคูณด้วย R_x ก่อน (อยู่ขวาสุด) |

| ลืมแปลงองศาเป็นเรเดียนในโปรแกรม | Math.cos ใน JavaScript/Python รับเรเดียน |

| ปัดเศษเมทริกซ์จนไม่ตั้งฉาก | ตรวจ $R^{\mathsf T}R\approx I$ และ det ≈ 1 หลังคำนวณเสมอ |

| คิดว่าหา yaw จาก accelerometer ได้ | การหมุนรอบแกนแรงโน้มถ่วงไม่เปลี่ยนค่าที่อ่าน ต้องใช้เข็มทิศหรือไจโร |

## 10. แบบฝึกหัดพร้อมเฉลย

- $\mathbf v=(3,-4)$ จงหาองค์ประกอบในแกนที่หมุน 90° และ −53.13°

- หมุนเวกเตอร์ (1, 2, 0) ด้วย $R_z(90^\circ)$

- accelerometer นิ่งอ่าน (0, 4.905, 8.496) m/s² บอร์ดเอียงอย่างไร?

- กระแส $i_\alpha=0,\ i_\beta=7$ A และ θ = 90° จงหา $i_d, i_q$

เปิดเฉลย

- θ = 90°: (−4, −3) · θ = −53.13° (cos = 0.6, sin = −0.8): x′ = 3(0.6) + (−4)(−0.8) = 5, y′ = −3(−0.8) + (−4)(0.6) = 0 → (5, 0) แกน x′ ชี้ตามเวกเตอร์พอดี

- $R_z(90^\circ)(1,2,0)=(-2,1,0)$

- $\theta=\operatorname{atan2}(0,9.81)=0^\circ$, $\phi=\operatorname{atan2}(4.905,8.496)=30^\circ$: roll 30° ไม่เงย

- $i_d=0\cdot0+7\cdot1=7$ A, $i_q=-0+7\cdot0=0$

## 11. สรุปสูตร

| หัวข้อ | สูตร |

| T1 หมุนแกน 2D | $\mathbf v'=R(\theta)^{\mathsf T}\mathbf v$ |

| T2 หมุนเวกเตอร์ | $\mathbf v_{\text{new}}=R(\theta)\mathbf v$ |

| T3 สมบัติ | $R^{\mathsf T}R=I,\ \det R=1$ |

| T4–T6 สามมิติ | $R=R_zR_yR_x$ ลำดับสำคัญ |

| T7 มุมเอียงจาก g | $\theta=\operatorname{atan2}(-f_x,\sqrt{f_y^2+f_z^2}),\ \phi=\operatorname{atan2}(f_y,f_z)$ |

| T8 โรดริเกส | $\mathbf v\cos\theta+(\mathbf k\times\mathbf v)\sin\theta+\mathbf k(\mathbf k\cdot\mathbf v)(1-\cos\theta)$ |

| T9 Clarke–Park | หมุนแกน αβ ตามมุมโรเตอร์ได้ dq |

## 12. แหล่งอ้างอิงและอ่านต่อ

- Lynch & Park, Modern Robotics (ฉบับเปิด) บทที่ 3 Rigid-Body Motions — เมทริกซ์หมุน exponential coordinates และสูตรโรดริเกส

- MIT OCW 18.06SC Linear Algebra — เมทริกซ์ตั้งฉากและการเปลี่ยนฐาน

- Texas Instruments, Field Orientated Control of 3-Phase AC-Motors (BPRA073) — การแปลง Clarke และ Park ในทางปฏิบัติ

ต่อไป: ใช้เมทริกซ์หมุนต่อกันเป็นโซ่ใน เวกเตอร์ในแขนกล หรือหมุนกรอบเองใน สตูดิโอเวกเตอร์ (ติ๊ก “กรอบหมุน”)

## คำถามที่พบบ่อย

หมุนแกนกับหมุนเวกเตอร์ต่างกันอย่างไร?
หมุนเวกเตอร์ (active) คือย้ายลูกศรไปชี้ทิศใหม่ในกรอบเดิม v_new = R v ส่วนหมุนแกน (passive) คือเวกเตอร์อยู่ที่เดิมแต่เราอ่านองค์ประกอบในแกนที่หมุนไป v′ = Rᵀ v การหมุนแกนไป +θ ให้องค์ประกอบเหมือนการหมุนเวกเตอร์ไป −θ

เมทริกซ์หมุนมีสมบัติอะไร?
คอลัมน์และแถวเป็นเวกเตอร์หนึ่งหน่วยที่ตั้งฉากกัน RᵀR = I จึงหาอินเวอร์สได้ง่าย R⁻¹ = Rᵀ และ det R = +1 การหมุนไม่เปลี่ยนความยาวและมุมระหว่างเวกเตอร์

ลำดับการหมุนสำคัญไหม?
สำคัญมากในสามมิติ การหมุนรอบ x แล้ว z ให้ผลต่างจาก z แล้ว x เพราะการคูณเมทริกซ์ไม่สลับที่ มุมออยเลอร์จึงต้องระบุลำดับเสมอ เช่น Z-Y-X (yaw-pitch-roll)

การหมุนแกนเกี่ยวกับมอเตอร์ไฟฟ้าอย่างไร?
การแปลง Park ในการควบคุมมอเตอร์แบบ field oriented control คือการหมุนแกน αβ ไปตามมุมโรเตอร์ θ ทำให้กระแสสามเฟสที่เป็นไซน์กลายเป็นค่าคงที่ i_d และ i_q ซึ่งควบคุมด้วย PI ได้ง่าย

มด
อาจารย์มด · ธีรวุฒิ แสวงบุญ
อาจารย์สาขาวิชาวิศวกรรมไฟฟ้า มหาวิทยาลัยราชภัฏธนบุรี สมุทรปราการ · ดูโปรไฟล์

## คำถามที่พบบ่อย (FAQ)

**หมุนแกนกับหมุนเวกเตอร์ต่างกันอย่างไร?**
หมุนเวกเตอร์ (active) คือย้ายลูกศรไปชี้ทิศใหม่ในกรอบเดิม v_new = R v ส่วนหมุนแกน (passive) คือเวกเตอร์อยู่ที่เดิมแต่เราอ่านองค์ประกอบในแกนที่หมุนไป v′ = Rᵀ v การหมุนแกนไป +θ ให้องค์ประกอบเหมือนการหมุนเวกเตอร์ไป −θ

**เมทริกซ์หมุนมีสมบัติอะไร?**
คอลัมน์และแถวเป็นเวกเตอร์หนึ่งหน่วยที่ตั้งฉากกัน RᵀR = I จึงหาอินเวอร์สได้ง่าย R⁻¹ = Rᵀ และ det R = +1 การหมุนไม่เปลี่ยนความยาวและมุมระหว่างเวกเตอร์

**ลำดับการหมุนสำคัญไหม?**
สำคัญมากในสามมิติ การหมุนรอบ x แล้ว z ให้ผลต่างจาก z แล้ว x เพราะการคูณเมทริกซ์ไม่สลับที่ มุมออยเลอร์จึงต้องระบุลำดับเสมอ เช่น Z-Y-X (yaw-pitch-roll)

**การหมุนแกนเกี่ยวกับมอเตอร์ไฟฟ้าอย่างไร?**
การแปลง Park ในการควบคุมมอเตอร์แบบ field oriented control คือการหมุนแกน αβ ไปตามมุมโรเตอร์ θ ทำให้กระแสสามเฟสที่เป็นไซน์กลายเป็นค่าคงที่ i_d และ i_q ซึ่งควบคุมด้วย PI ได้ง่าย
