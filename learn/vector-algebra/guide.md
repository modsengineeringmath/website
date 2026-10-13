# เวกเตอร์: จากแรงลัพธ์ถึงเฟสเซอร์ — คู่มือการเรียนและสรุปสูตร

เว็บไซต์: https://modsengineeringmath.com/learn/vector-algebra/
ผู้เขียน: อาจารย์มด · ธีรวุฒิ แสวงบุญ
ภาษา: ไทย · อัปเดต: 2026-10-13

## ขอบเขต

เวกเตอร์จริงในปริภูมิยุคลิด 2 และ 3 มิติ (ฐานคาร์ทีเซียนตั้งฉากหนึ่งหน่วย) และการนำไปใช้ในกลศาสตร์ (แรง โมเมนต์ สมดุล การหมุนแกน แขนกล) แม่เหล็กไฟฟ้า (สนาม แรงลอเรนซ์) และไฟฟ้ากระแสสลับ (เฟสเซอร์เป็นเวกเตอร์สองมิติบนระนาบเชิงซ้อน) ทุกตัวอย่างตัวเลขตรวจด้วย Python/NumPy และตรงกับแล็บในเว็บ

## โครงสร้าง 5 ส่วน 20 หน้า

### ส่วนที่ 1 · พื้นฐานเวกเตอร์ 2D/3D
1. [พื้นฐาน](https://modsengineeringmath.com/learn/vector-algebra/foundations/) — ขนาด ทิศทาง พิกัด เวกเตอร์หนึ่งหน่วย (F)
2. [บวก ลบ คูณสเกลาร์](https://modsengineeringmath.com/learn/vector-algebra/operations/) (V)
3. [องค์ประกอบและการฉาย](https://modsengineeringmath.com/learn/vector-algebra/components-projection/) (P)
4. [ทิศทางโคไซน์](https://modsengineeringmath.com/learn/vector-algebra/direction-cosines/) — α β γ, แตกแรงสองขั้น, แรงตามสาย (K)
### ส่วนที่ 2 · ผลคูณ
5. [Dot product](https://modsengineeringmath.com/learn/vector-algebra/dot-product/) (D)
6. [Cross product](https://modsengineeringmath.com/learn/vector-algebra/cross-product/) (C)
### ส่วนที่ 3 · แรงและกลศาสตร์
7. [แรงลัพธ์ด้วยกฎไซน์-โคไซน์](https://modsengineeringmath.com/learn/vector-algebra/resultant-forces/) (R)
8. [ระบบแรง โมเมนต์ สมดุล](https://modsengineeringmath.com/learn/vector-algebra/force-systems/) (S)
9. [การหมุนแกนพิกัด](https://modsengineeringmath.com/learn/vector-algebra/coordinate-rotation/) (T)
10. [เวกเตอร์ในแขนกล](https://modsengineeringmath.com/learn/vector-algebra/robot-arm/) (A)
11. [งานวิศวกรรมรวม](https://modsengineeringmath.com/learn/vector-algebra/engineering-applications/) (E)
### ส่วนที่ 4 · ไฟฟ้า: สนามและเฟสเซอร์
12. [สนามไฟฟ้า-แม่เหล็ก](https://modsengineeringmath.com/learn/vector-algebra/em-fields/) (M)
13. [sin · cos ในไฟฟ้า AC](https://modsengineeringmath.com/learn/vector-algebra/sinusoids/) (W)
14. [พื้นฐานเฟสเซอร์](https://modsengineeringmath.com/learn/vector-algebra/phasors/) (H)
15. [วิเคราะห์วงจร AC](https://modsengineeringmath.com/learn/vector-algebra/ac-circuits/) (Z)
### ส่วนที่ 5 · ห้องแล็บและเครื่องมือ
16. [สตูดิโอเวกเตอร์ 2D/3D](https://modsengineeringmath.com/learn/vector-algebra/vector-lab/) — หมุนแกน ส่งออก GeoGebra/MATLAB/Python
17. [แล็บกลศาสตร์ (ฟิสิกส์ 1)](https://modsengineeringmath.com/learn/vector-algebra/mechanics-lab/)
18. [แล็บสนามไฟฟ้า-แม่เหล็ก (ฟิสิกส์ 2)](https://modsengineeringmath.com/learn/vector-algebra/field-lab/)
19. [แล็บวงจร AC](https://modsengineeringmath.com/learn/vector-algebra/ac-lab/)
20. [เครื่องมือระดับโลก](https://modsengineeringmath.com/learn/vector-algebra/vector-tools/) — PhET, GeoGebra 3D, Falstad, MATLAB, Python

## สูตรหลักและเงื่อนไข

### พื้นฐานและผลคูณ
- A±B ทำทีละองค์ประกอบในฐานเดียวกัน; cA=(ca_x,ca_y,ca_z), |cA|=|c||A|
- |A|=sqrt(a_x²+a_y²+a_z²); unit direction A/|A| กำหนดเมื่อ A≠0
- A·B=Σa_ib_i=|A||B|cos θ; θ=acos((A·B)/(|A||B|)) ในช่วง 0–180°
- scalar projection (A·B)/|B|; vector projection ((A·B)/(B·B))B
- A×B=(a_yb_z−a_zb_y, a_zb_x−a_xb_z, a_xb_y−a_yb_x); |A×B|=|A||B|sin θ; B×A=−A×B

### ทิศทางโคไซน์ (K)
- cos α=F_x/F, cos β=F_y/F, cos γ=F_z/F; u_F=(cos α, cos β, cos γ)
- cos²α+cos²β+cos²γ=1; รู้สองมุม มุมที่สามมีสองค่า (γ หรือ 180°−γ)
- มุมราบ θ มุมเงย φ: F_h=F cos φ, F_z=F sin φ, F_x=F_h cos θ, F_y=F_h sin θ
- แรงตามแนวเส้น A→B: F=F (r_B−r_A)/|r_B−r_A|

### แรงลัพธ์ (R)
- R²=F₁²+F₂²+2F₁F₂cos θ (θ = มุมระหว่างแรง) = F₁²+F₂²−2F₁F₂cos β, β=180°−θ
- กฎไซน์ F₁/sin γ = F₂/sin α = R/sin β; arcsin ให้มุมแหลมเท่านั้น ถ้า F₂²>F₁²+R² มุม α ป้าน
- แตกแรงตามแนว u, v: F_u=F sin(θ_v−θ_F)/sin(θ_v−θ_u), F_v=F sin(θ_F−θ_u)/sin(θ_v−θ_u)
- แรงที่สองน้อยที่สุด: ตั้งฉากกับแนวของ R, F₂=F₁ sin φ
- ทฤษฎีลามี F₁/sin α₂₃ = F₂/sin α₃₁ = F₃/sin α₁₂; เชือกสองเส้น T₁=W cos θ₂/sin(θ₁+θ₂)

### ระบบแรง (S)
- M_O=r×F; ระนาบ M_O=xF_y−yF_x; |M|=Fd; ทฤษฎีวาริยอง
- โมเมนต์รอบแกน M_a=u_a·(r×F); แรงคู่ควบ M=Fd เท่ากันทุกจุด
- ระบบสมมูล R=ΣF, M_O=Σr×F; แรงลัพธ์เดี่ยว x̄=M_O/R_y
- แรงกระจาย W=∫w dx ที่เซนทรอยด์; สมดุล ΣF=0 และ ΣM=0

### การหมุนแกน (T)
- 2D: x′=x cos θ+y sin θ, y′=−x sin θ+y cos θ (v′=Rᵀv); หมุนเวกเตอร์ v_new=Rv
- RᵀR=I, det R=1; R=Rz(ψ)Ry(θ)Rx(φ) ลำดับสำคัญ
- มุมเอียงจาก accelerometer: θ=atan2(−f_x, sqrt(f_y²+f_z²)), φ=atan2(f_y,f_z)
- โรดริเกส v cos θ+(k×v) sin θ+k(k·v)(1−cos θ); Park transform คือการหมุนแกน αβ ตามมุมโรเตอร์

### แขนกล (A)
- p=L₁(cos θ₁, sin θ₁)+L₂(cos(θ₁+θ₂), sin(θ₁+θ₂)); |L₁−L₂|≤|p|≤L₁+L₂
- IK: cos θ₂=(x²+y²−L₁²−L₂²)/(2L₁L₂), θ₁=atan2(y,x)−atan2(L₂sin θ₂, L₁+L₂cos θ₂)
- v=Jθ̇, คอลัมน์ J = k×(p−p_i), det J=L₁L₂ sin θ₂; τ=JᵀF; τ_motor=τ/(Nη)

### สนามไฟฟ้า-แม่เหล็ก (M)
- F₁₂=k q₁q₂ (r₂−r₁)/|r₂−r₁|³, k=8.988×10⁹; E=Σ k q_i r̂_i/r_i² (บวกเวกเตอร์); V=Σ kq_i/r_i (สเกลาร์)
- Φ=B·A; F=q(E+v×B); r=mv⊥/(|q|B), T=2πm/(|q|B), v_d=E×B/B²
- F=I L×B; ลวดตรง B=μ₀I/(2πr); ลวดขนาน F/L=μ₀I₁I₂/(2πd); τ=m×B, m=NIA n̂

### ไซน์และเฟสเซอร์ (W, H)
- v=V_m sin(ωt+φ), ω=2πf; sin θ=cos(θ−90°); −sin θ=sin(θ±180°)
- เทียบเฟสต้องฟังก์ชันเดียวกัน แอมพลิจูดบวก ความถี่เดียวกัน; Δφ=360°Δt/T
- A cos ωt+B sin ωt=sqrt(A²+B²) cos(ωt−atan2(B,A)); V_rms=V_m/√2
- e^{jθ}=cos θ+j sin θ; V=V_m∠φ; บวกในรูป a+jb, คูณหารในรูป r∠θ; d/dt ↔ jω

### วงจร AC (Z)
- Z_R=R, Z_L=jωL, Z_C=1/(jωC); KVL/KCL บวกเฟสเซอร์
- S=VI*=P+jQ, PF=cos(φ_v−φ_i); Q_C=P(tan φ₁−tan φ₂), C=Q_C/(ωV²)
- f₀=1/(2π√(LC)), Q=ω₀L/R, BW=R/(2πL), |V_L|=|V_C|=Q|V_s| ที่เรโซแนนซ์
- RC low-pass H=1/(1+jωRC); สามเฟสสมดุล V_a+V_b+V_c=0, V_LL=√3 V_ph

## ตัวอย่างตรวจสอบ (ตรงกับแล็บ)

- F=(300,400,500) N: |F|=707.1 N, α=64.9°, β=55.6°, γ=45.0°
- สาย A(0,0,0)→B(2,−3,6), 840 N: F=(240,−360,720) N
- 600 N ที่ 0° + 400 N ที่ 50°: R=910.2 N ที่ 19.67°
- โคมไฟ 50 kg เชือก 30°/45°: T₁=359.1 N, T₂=439.8 N
- คาน 6 m: แรง 800 N↓ที่ 1.5 m, 600 N ที่ 240° ที่ 3.5 m, 400 N↑ที่ 5 m → R=967.3 N, M_O=−1018.7 N·m, x̄=1.108 m; A_x=300, A_y=749.8, B_y=169.8 N
- แขน L₁=0.5, L₂=0.4, θ=(30°,60°): p=(0.433,0.650) m, ถือ 2 kg → τ=(8.50, 0) N·m
- โปรตอน v=(2,0,0.6)×10⁵ m/s, B=0.05 T ẑ: r=41.76 mm, T=1.312 μs, pitch 78.7 mm
- RLC 30 Ω, 127 mH, 53 μF, 220 V 50 Hz: Z=36.14∠−33.9° Ω, I=6.087∠33.9° A, V_C=365.6 V
- แก้ PF มอเตอร์ RL (582.7 W, PF 0.601) เป็น 0.95: Q_C=583.4 var, C=38.4 μF

## ข้อผิดพลาดที่ควรตรวจ

- บวกขนาดแทนบวกเวกเตอร์ (แรง สนาม แรงดัน/กระแส AC)
- ใช้ arctan แทน atan2 หรือเชื่อ arcsin ในกฎไซน์โดยไม่ตรวจมุมป้าน
- สับสนองค์ประกอบตามแนวเฉียงกับการฉาย
- สลับลำดับ cross product (r×F, v×B, L×B, m×B)
- ใช้ R แทน Rᵀ เมื่อหมุนแกน; ลืมว่าลำดับการหมุนสามมิติสำคัญ
- เทียบเฟสระหว่าง sin กับ cos ตรง ๆ; ปนค่ายอดกับ RMS; ลืม conjugate ใน S=VI*

## เอกสารอ้างอิง

- OpenStax Calculus Volume 3 บทที่ 2: https://openstax.org/books/calculus-volume-3/pages/2-1-vectors-in-the-plane
- OpenStax University Physics Vol. 1 (vectors, torque, equilibrium): https://openstax.org/details/books/university-physics-volume-1
- OpenStax University Physics Vol. 2 (fields, magnetic force, AC circuits): https://openstax.org/details/books/university-physics-volume-2
- Engineering Statics: Open and Interactive: https://engineeringstatics.org/
- Lynch & Park, Modern Robotics: https://hades.mech.northwestern.edu/index.php/Modern_Robotics
- PhET Interactive Simulations: https://phet.colorado.edu/

สูตรทั้งหมดที่มีรหัสและตัวอย่างเต็ม: https://modsengineeringmath.com/learn/vector-algebra/#formulas
แต่ละหน้ามีสำเนา Markdown ที่ URL ต่อท้าย index.html.md สำหรับอ่านเนื้อหาโดยไม่ต้องใช้ JavaScript
