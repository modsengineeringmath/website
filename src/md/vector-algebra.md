# เวกเตอร์และพีชคณิตเวกเตอร์ — คู่มือการเรียนและสรุปสูตร

เว็บไซต์: https://modsengineeringmath.com/learn/vector-algebra/
ผู้เขียน: อาจารย์มด · ธีรวุฒิ แสวงบุญ
ภาษา: ไทย · อัปเดต: {{updated}}

## ขอบเขต

เวกเตอร์จริงในปริภูมิยุคลิด 2 และ 3 มิติ ใช้ฐานคาร์ทีเซียนตั้งฉากหนึ่งหน่วย ไม่ใช่การคูณเฟสเซอร์เชิงซ้อนหรือการฉายในฐานเฉียง ผลคูณไขว้ในชุดนี้หมายถึง cross product สามมิติ

## เส้นทางการเรียน

1. [พื้นฐาน 2D/3D](https://modsengineeringmath.com/learn/vector-algebra/foundations/): จุดกับเวกเตอร์ ขนาด ทิศทาง เวกเตอร์หนึ่งหน่วย รหัสสูตร F
2. [การบวก ลบ คูณสเกลาร์](https://modsengineeringmath.com/learn/vector-algebra/operations/): ต่อหัวกับหาง แรงลัพธ์ รหัส V
3. [องค์ประกอบและการฉาย](https://modsengineeringmath.com/learn/vector-algebra/components-projection/): scalar component, vector component, scalar projection, vector projection รหัส P
4. [Dot product](https://modsengineeringmath.com/learn/vector-algebra/dot-product/): มุม ความตั้งฉาก งาน รหัส D
5. [Cross product](https://modsengineeringmath.com/learn/vector-algebra/cross-product/): กฎมือขวา ดีเทอร์มิแนนต์ พื้นที่ ปริมาตร รหัส C
6. [วิศวกรรม](https://modsengineeringmath.com/learn/vector-algebra/engineering-applications/): แรง งาน แรงบิด สนามแม่เหล็ก หุ่นยนต์ รหัส E
7. [แล็บ](https://modsengineeringmath.com/learn/vector-algebra/vector-lab/): เปลี่ยนองค์ประกอบ เปรียบเทียบภาพกับตัวเลข 2D/3D

## สูตรหลักและเงื่อนไข

- A+B=(a_x+b_x,a_y+b_y,a_z+b_z), A−B ทำทีละองค์ประกอบในฐานเดียวกัน
- cA=(ca_x,ca_y,ca_z); |cA|=|c||A|
- |A|=sqrt(a_x²+a_y²+a_z²); unit direction A/|A| กำหนดเมื่อ A≠0
- A·B=a_xb_x+a_yb_y+a_zb_z=|A||B|cos θ
- θ=acos((A·B)/(|A||B|)) เมื่อ A,B ไม่เป็นศูนย์; เลือก θ ในช่วง 0 ถึง π
- scalar projection comp_B A=(A·B)/|B| เมื่อ B≠0 เป็นสเกลาร์มีเครื่องหมาย
- vector projection proj_B A=((A·B)/(B·B))B เมื่อ B≠0 เป็นเวกเตอร์
- A_perp=A−proj_B A; A_perp·B=0
- A×B=(a_yb_z−a_zb_y,a_zb_x−a_xb_z,a_xb_y−a_yb_x)
- |A×B|=|A||B|sin θ; B×A=−A×B
- พื้นที่สี่เหลี่ยมด้านขนาน=|A×B|; สามเหลี่ยมเป็นครึ่งหนึ่ง
- ปริมาตรทรงขนาน=|A·(B×C)|
- งานแรงคงที่ W=F·Δr (J); แรงแปรผัน W=∫F·dr
- แรงบิด τ=r×F (N·m); r วัดจากจุดอ้างอิงไปยังจุดออกแรง
- โมเมนต์รอบแกนหน่วย u: M_u=u·(r×F)
- ตัวนำตรงในสนามสม่ำเสมอ F=I(L×B) (N); L ชี้ตามกระแสตามแบบแผน
- แรงแม่เหล็กบนประจุ F_B=q(v×B); ประจุลบทิศแรงกลับจาก v×B

## ตัวอย่างตรวจสอบ

A=(3,4), B=(2,1): dot=10, comp=2sqrt(5), proj=(4,2), residual=(−1,2); residual dot B=0

A=(1,2,2), B=(3,0,4): |A|=3, |B|=5, dot=11, θ=acos(11/15)≈42.8334°, cross=(8,2,−6), |cross|=sqrt(104)

r=(0.2,0,0) m, F=(0,50,0) N: τ=(0,0,10) N·m

## ข้อผิดพลาดที่ควรตรวจ

- ขนาดไม่มีเครื่องหมายลบ แต่องค์ประกอบและ scalar projection มีได้
- เวกเตอร์ศูนย์ไม่มีทิศ จึงไม่มีมุมกับเวกเตอร์อื่นหรือ unit direction
- A·B=0 ไม่ได้แปลว่ามุม 90° หากมีเวกเตอร์ศูนย์
- ส่วนฉายบน B หารด้วย B·B ไม่ใช่ |B| เว้นแต่เขียน scalar projection แยกไว้
- ใน 3D มุมกับแกนทั้งสามมี cos²α+cos²β+cos²γ=1; ใช้ sin/cos จากมุมเดียวหาทั้งสามองค์ประกอบไม่ได้
- ลำดับ cross สำคัญ และรูปบนจอ 3D เป็นภาพฉาย มุมบนภาพไม่ใช่มุมจริง
- กำลัง AC และ spatial dot product เป็นคนละแบบจำลอง; สูตร phasor ใช้ complex conjugate และนิยาม RMS ที่เหมาะสม

## เอกสารอ้างอิงเพื่อค้นคว้าต่อ

- OpenStax Calculus Volume 3 §2.1–2.4: https://openstax.org/books/calculus-volume-3/pages/2-1-vectors-in-the-plane
- MIT OCW 18.02SC Vectors, Determinants and Planes: https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/1.-vectors-and-matrices/part-a-vectors-determinants-and-planes/
- OpenStax University Physics Volume 1 (vectors, work, torque): https://openstax.org/details/books/university-physics-volume-1
- OpenStax University Physics Volume 2 (magnetic force): https://openstax.org/details/books/university-physics-volume-2

สูตรทั้งหมดที่มีรหัสและตัวอย่างเต็ม: https://modsengineeringmath.com/learn/vector-algebra/#formulas
แต่ละหน้ามีสำเนา Markdown ที่ URL ต่อท้าย index.html.md สำหรับอ่านเนื้อหาโดยไม่ต้องใช้ JavaScript
