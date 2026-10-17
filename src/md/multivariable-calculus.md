# แคลคูลัสหลายตัวแปรและแคลคูลัสเวกเตอร์ — คู่มือการเรียนและสรุปสูตร

เว็บไซต์: https://modsengineeringmath.com/learn/multivariable-calculus/
ผู้เขียน: อาจารย์มด · ธีรวุฒิ แสวงบุญ
ภาษา: ไทย (ศัพท์เทคนิคระบุอังกฤษในวงเล็บ) · อัปเดต: {{updated}}

## ขอบเขต

Calculus III / Multivariable & Vector Calculus สำหรับนักศึกษาวิศวกรรม: ฟังก์ชันหลายตัวแปร อนุพันธ์ย่อยและ gradient ค่าสุดขีดและตัวคูณลากรองจ์ อินทิกรัลสองชั้นและสามชั้น ฟังก์ชันเวกเตอร์ สนามเวกเตอร์ อินทิกรัลตามเส้นและบนผิว ทฤษฎีบทกรีน ดีเวอร์เจนซ์ (เกาส์) และสโตกส์ พร้อมการประยุกต์ในวิศวกรรมไฟฟ้า เครื่องกล และโยธา ทุกตัวอย่างตัวเลขตรวจด้วย sympy/numpy และตรงกับแล็บในเว็บ

## โครงสร้าง 6 ส่วน 13 หน้า

1. [ฟังก์ชันหลายตัวแปร](https://modsengineeringmath.com/learn/multivariable-calculus/functions-of-several-variables/) — โดเมน กราฟผิว เส้นชั้นความสูง ผิวกำลังสอง ลิมิต (F)
2. [อนุพันธ์ย่อย](https://modsengineeringmath.com/learn/multivariable-calculus/partial-derivatives/) — ระนาบสัมผัส ผลต่างรวม กฎลูกโซ่ (P)
3. [Gradient และอนุพันธ์ตามทิศ](https://modsengineeringmath.com/learn/multivariable-calculus/gradient-directional-derivative/) (G)
4. [ค่าสุดขีดและตัวคูณลากรองจ์](https://modsengineeringmath.com/learn/multivariable-calculus/optimization/) (O)
5. [อินทิกรัลสองชั้นและสามชั้น](https://modsengineeringmath.com/learn/multivariable-calculus/multiple-integrals/) — พิกัดขั้ว ทรงกระบอก ทรงกลม จาโคเบียน มวล (M)
6. [ฟังก์ชันเวกเตอร์](https://modsengineeringmath.com/learn/multivariable-calculus/vector-functions/) — เส้นโค้งในอวกาศ ความโค้ง กรอบ Frenet (R)
7. [สนามเวกเตอร์ div curl](https://modsengineeringmath.com/learn/multivariable-calculus/vector-fields/) (D)
8. [อินทิกรัลตามเส้นและทฤษฎีบทกรีน](https://modsengineeringmath.com/learn/multivariable-calculus/line-integrals/) (L)
9. [อินทิกรัลบนผิว ฟลักซ์ Gauss Stokes](https://modsengineeringmath.com/learn/multivariable-calculus/surface-integrals/) (S)
10. [วิศวกรรมไฟฟ้า](https://modsengineeringmath.com/learn/multivariable-calculus/electrical-engineering/) — ศักย์ สนามไฟฟ้า กฎของเกาส์ Laplace (E)
11. [วิศวกรรมเครื่องกล](https://modsengineeringmath.com/learn/multivariable-calculus/mechanical-engineering/) — การนำความร้อน ของไหล โมเมนต์ความเฉื่อย Jacobian (K)
12. [วิศวกรรมโยธา](https://modsengineeringmath.com/learn/multivariable-calculus/civil-engineering/) — ภูมิประเทศ ขุด-ถม หน้าตัด แรงดันน้ำ การซึม (C)
13. [แล็บแคลคูลัสหลายตัวแปร](https://modsengineeringmath.com/learn/multivariable-calculus/multivariable-lab/) — เครื่องมือโต้ตอบ 19 ชุด พิมพ์สมการเองได้

## สูตรหลัก

### อนุพันธ์
- อนุพันธ์ย่อย: f_x = ∂f/∂x ถือ y คงที่ · ทฤษฎีบทแคลโร f_xy = f_yx เมื่อต่อเนื่อง
- ระนาบสัมผัส: z = f(a, b) + f_x(a, b)(x − a) + f_y(a, b)(y − b)
- ผลต่างรวม: df = f_x dx + f_y dy
- กฎลูกโซ่: ∂z/∂s = (∂z/∂x)(∂x/∂s) + (∂z/∂y)(∂y/∂s)
- Gradient: ∇f = ⟨f_x, f_y, f_z⟩ ชี้ทางที่ f เพิ่มเร็วที่สุด ตั้งฉากกับเส้นชั้นความสูง
- อนุพันธ์ตามทิศ: D_u f = ∇f · u (u เป็นเวกเตอร์หนึ่งหน่วย) มีค่าสูงสุด |∇f|

### ค่าสุดขีด
- จุดวิกฤต: ∇f = 0
- Hessian test: D = f_xx f_yy − f_xy² — D > 0 และ f_xx > 0 ต่ำสุดสัมพัทธ์ · D > 0 และ f_xx < 0 สูงสุดสัมพัทธ์ · D < 0 จุดอานม้า · D = 0 ไม่สรุป
- ตัวคูณลากรองจ์: ∇f = λ∇g ภายใต้ g = c

### อินทิกรัลหลายชั้น
- Fubini: ∬ f dA = ∫∫ f dy dx (สลับลำดับได้เมื่อ f ต่อเนื่องบนบริเวณปิดมีขอบเขต)
- พิกัดขั้ว: dA = r dr dθ · ทรงกระบอก: dV = r dr dθ dz · ทรงกลม: dV = ρ² sin φ dρ dφ dθ
- เปลี่ยนตัวแปร: dA = |∂(x, y)/∂(u, v)| du dv
- มวล M = ∬ ρ dA · จุดศูนย์กลางมวล x̄ = (1/M) ∬ x ρ dA · โมเมนต์ความเฉื่อยรอบแกนตั้งฉาก I_0 = ∬ (x² + y²) ρ dA

### แคลคูลัสเวกเตอร์
- ความเร็ว v = r′(t) · ความเร่ง a = r″(t) · ความยาวส่วนโค้ง s = ∫ |r′| dt
- ความโค้ง κ = |r′ × r″| / |r′|³ · T = r′/|r′| · N = T′/|T′| · B = T × N
- Divergence: ∇·F = P_x + Q_y + R_z · Curl: ∇×F · Laplacian: ∇²f = f_xx + f_yy + f_zz
- เอกลักษณ์: ∇×(∇f) = 0 · ∇·(∇×F) = 0
- อินทิกรัลตามเส้น: ∫ F·dr = ∫ F(r(t))·r′(t) dt · F = ∇f ⇒ ∫ F·dr = f(B) − f(A)
- ทฤษฎีบทกรีน: ∮_C P dx + Q dy = ∬_D (Q_x − P_y) dA (C วนทวนเข็มนาฬิกา)
- พื้นที่ผิว dS = |r_u × r_v| du dv · ฟลักซ์ ∬ F·n dS
- ทฤษฎีบทดีเวอร์เจนซ์ (เกาส์): ∯_S F·n dS = ∭_E ∇·F dV
- ทฤษฎีบทสโตกส์: ∮_C F·dr = ∬_S (∇×F)·n dS

### วิศวกรรม
- ไฟฟ้า: E = −∇V · ∇·E = ρ/ε₀ · ∇²V = −ρ/ε₀ · ประจุจุด V = kq/r, k = 1/(4πε₀) = 8.988×10⁹ N·m²/C²
- เครื่องกล: กฎของฟูริเยร์ q = −k∇T · สมการความร้อนคงตัว ∇²T = 0 · ความต่อเนื่องของของไหลไม่บีบอัด ∇·v = 0
- โยธา: ความลาดชัน S = 100|∇h| % · ขุด = ∬ max(h − z₀, 0) dA · ถม = ∬ max(z₀ − h, 0) dA · ระดับสมดุล z₀ = (1/A) ∬ h dA · พื้นที่หน้าตัดจากพิกัดจุดยอด A = ½ Σ (xᵢ yᵢ₊₁ − xᵢ₊₁ yᵢ) · ดาร์ซี v = −K∇h

## วิธีตรวจคำตอบ
1. วาดบริเวณหรือเส้นชั้นความสูงก่อนตั้งขอบเขตอินทิกรัล
2. ตรวจหน่วยและมิติ
3. สองวิธีต้องตรงกัน: สลับลำดับ dx dy หรือเปลี่ยนพิกัด และใช้ทฤษฎีบทกรีน เกาส์ สโตกส์ตรวจอินทิกรัลตามเส้นและบนผิว
4. ใช้แล็บตรวจหลังคำนวณเอง

## คำถามที่พบบ่อย
- **Calculus III เรียนอะไร?** ฟังก์ชันหลายตัวแปร อนุพันธ์ย่อย อินทิกรัลหลายชั้น และแคลคูลัสเวกเตอร์
- **ควรรู้อะไรก่อน?** อนุพันธ์/อินทิกรัลตัวแปรเดียว ตรีโกณมิติ และเวกเตอร์ (dot, cross)
- **ทฤษฎีบทกรีน เกาส์ สโตกส์ต่างกันอย่างไร?** ทั้งหมดคือทฤษฎีบทมูลฐานของแคลคูลัสในมิติสูง: กรีนบริเวณในระนาบ สโตกส์ผิวโค้งในอวกาศ เกาส์ปริมาตรและผิวปิด
- **ใช้ในวิศวกรรมอย่างไร?** E = −∇V ในไฟฟ้า q = −k∇T ในเครื่องกล และปริมาตรดินขุด-ถมในโยธา

## เอกสารค้นคว้าต่อ
- OpenStax Calculus Volume 3: https://openstax.org/books/calculus-volume-3/pages/1-introduction
- MIT OpenCourseWare 18.02SC: https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/
- Paul's Online Math Notes, Calculus III: https://tutorial.math.lamar.edu/Classes/CalcIII/CalcIII.aspx
