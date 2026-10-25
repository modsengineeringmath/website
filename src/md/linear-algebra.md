---
title: "พีชคณิตเชิงเส้น: เมทริกซ์ ดีเทอร์มิแนนต์ แรงก์ คราเมอร์ และผลเฉลยเชิงตัวเลข — คู่มือฉบับสมบูรณ์ (Linear Algebra: matrices, determinants, rank, Cramer's rule and numerical solution of linear systems, complete guide)"
url: https://modsengineeringmath.com/learn/linear-algebra/
markdown_url: https://modsengineeringmath.com/learn/linear-algebra/guide.md
lab_url: https://modsengineeringmath.com/learn/linear-algebra/matrix-lab/
exam_url: https://modsengineeringmath.com/learn/linear-algebra/exam-practice/
author: "ธีรวุฒิ แสวงบุญ (อาจารย์มด, Teerawut Savangboon) — อาจารย์สาขาวิชาวิศวกรรมไฟฟ้า มหาวิทยาลัยราชภัฏธนบุรี สมุทรปราการ"
site: "Mod's Engineering Mathematics"
language: th
audience: ["High school (ม.5–ม.6, TCAS / A-Level คณิตศาสตร์ประยุกต์ 1)", "Undergraduate linear algebra / engineering mathematics", "Numerical methods courses", "Self-learners and tutors"]
license: "อ่าน ลิงก์ และอ้างอิงได้ฟรี โปรดระบุ Mod's Engineering Mathematics (อาจารย์มด) และลิงก์หน้าเว็บ"
published: 2026-10-25
updated: {{updated}}
keywords: [เมทริกซ์, ดีเทอร์มิแนนต์, ตัวกำหนด, ค่าลำดับขั้น, แรงก์, ระบบสมการเชิงเส้น, การกำจัดแบบเกาส์, เกาส์-จอร์แดน, อินเวอร์ส, แอดจอยต์, กฎของคราเมอร์, หลักเกณฑ์คราเมอร์, ทฤษฎีบทรูเช-กาเปลลี, ปริภูมิศูนย์, การแยก LU, โชเลสกี, อัลกอริทึมโทมัส, จาโคบี, เกาส์-ไซเดล, SOR, เลขเงื่อนไข, ค่าเฉพาะ, matrix, determinant, rank of a matrix, Gaussian elimination, partial pivoting, inverse matrix, adjugate, Cramer's rule, Rouché–Capelli theorem, null space, LU decomposition, Cholesky, Thomas algorithm, Jacobi method, Gauss–Seidel method, successive over-relaxation, condition number, eigenvalues]
---

# พีชคณิตเชิงเส้น: เมทริกซ์ ดีเทอร์มิแนนต์ แรงก์ คราเมอร์ และผลเฉลยเชิงตัวเลข

> ชุดบทเรียนภาษาไทย 13 หน้า (หน้าหลัก + 12 บท) จากการคูณเมทริกซ์ระดับ ม.ปลาย ผ่านดีเทอร์มิแนนต์ แรงก์ (ค่าลำดับขั้น) อินเวอร์ส และกฎของคราเมอร์ ไปจนถึงวิธีเชิงตัวเลขที่โปรแกรมจำลองวงจรใช้ (LU จาโคบี เกาส์-ไซเดล SOR เลขเงื่อนไข) ค่าเฉพาะ และการประยุกต์ในวงจรไฟฟ้า ระบบไฟฟ้ากำลัง เครื่องกล และโยธา ทุกสูตรมีรหัสอ้างอิงถาวร ทุกตัวอย่างตรวจตัวเลขด้วย SymPy มีแนวข้อสอบ 45 ข้อ และแล็บโต้ตอบที่ใช้บนมือถือได้

ไฟล์นี้เป็น Markdown ที่เขียนไว้ให้ผู้ช่วย AI เครื่องมือค้นหา และผู้สอน อ่านโครงสร้าง สูตรหลัก และวิธีใช้แล็บของชุดนี้ได้ในไฟล์เดียว เนื้อหาเต็มอยู่ใน Markdown รายหน้า (`index.html.md` ท้าย URL) และใน [llms-full.txt](https://modsengineeringmath.com/llms-full.txt)

---

## 1. สรุปในหนึ่งนาที

- ระบบสมการเชิงเส้นทุกระบบเขียนได้เป็น \(A\mathbf x = \mathbf b\)
- **ดีเทอร์มิแนนต์** \(\det A \ne 0\) ⇔ มีคำตอบเดียว ⇔ \(A^{-1}\) มีอยู่ สมบัติหลัก: \(\det(kA) = k^n\det A\), \(\det(AB) = \det A\det B\), \(\det A^{-1} = 1/\det A\), \(\det(\operatorname{adj}A) = (\det A)^{n-1}\)
- **แรงก์ (ค่าลำดับขั้น)** = จำนวนแถวอิสระ = จำนวนตัวหลักหลังลดแถวเป็นขั้นบันได หรืออันดับของไมเนอร์ใหญ่ที่สุดที่ไม่เป็นศูนย์
- **ทฤษฎีบทรูเช-กาเปลลี**: \(\operatorname{rank}A \lt \operatorname{rank}[A\mid\mathbf b]\) ไม่มีคำตอบ · เท่ากัน \(= n\) คำตอบเดียว · เท่ากัน \(= r \lt n\) ไม่จำกัด (ตัวแปรอิสระ \(n - r\) ตัว)
- **กฎของคราเมอร์** \(x_i = \Delta_i/\Delta\) — เร็วสำหรับ 2–3 ตัวแปรหรือถามตัวแปรเดียว แต่ต้นทุน \(\approx (n+1)!\) จึงไม่ใช้กับระบบใหญ่
- **วิธีเชิงตัวเลข**: เกาส์ + partial pivoting / LU \(\approx \tfrac23n^3\) flops · โชเลสกีสำหรับ SPD · โทมัส \(O(n)\) สำหรับสามแนวทแยง · จาโคบี / เกาส์-ไซเดล / SOR สำหรับระบบใหญ่เบาบาง ลู่เข้าเมื่อทแยงเด่นหรือ \(\rho(T) \lt 1\)
- **เลขเงื่อนไข** \(\kappa(A) = \lVert A\rVert\lVert A^{-1}\rVert\): \(\lVert\delta\mathbf x\rVert/\lVert\mathbf x\rVert \le \kappa\,\lVert\delta\mathbf b\rVert/\lVert\mathbf b\rVert\) เสียความแม่นราว \(\log_{10}\kappa\) หลัก

## 2. โครงสร้างชุดบทเรียน (บทที่ 7)

| บท | หน้า | URL | รหัสสูตร | เนื้อหาหลัก |
|---|---|---|---|---|
| 7 | ภาพรวม | /learn/linear-algebra/ | — | เส้นทางตามระดับ ดัชนีสูตรค้นหาได้ งงตรงไหน สัญลักษณ์ |
| 7.1 | เมทริกซ์ | /learn/linear-algebra/matrices/ | M | ชนิด บวก คูณ ทรานสโพส เทรซ กำลัง บล็อก |
| 7.2 | ดีเทอร์มิแนนต์ | /learn/linear-algebra/determinants/ | D | 2×2 ซาร์รัส โคแฟกเตอร์ สมบัติ ลดแถว สูตรลัดออกสอบ D22–D25 |
| 7.3 | ระบบสมการ | /learn/linear-algebra/linear-systems/ | L | เกาส์ เกาส์-จอร์แดน แรงก์เบื้องต้น LU กำลังสองน้อยสุด |
| 7.4 | อินเวอร์ส | /learn/linear-algebra/inverse/ | I | 2×2 แอดจอยต์ [A\|I] ทฤษฎีบทหาอินเวอร์สได้ Sherman–Morrison |
| 7.5 | กฎของคราเมอร์ | /learn/linear-algebra/cramers-rule/ | C | 2×2 3×3 ที่มา Δ = 0 พารามิเตอร์ k วงจร AC โดเมน s |
| 7.6 | ค่าเฉพาะ | /learn/linear-algebra/eigenvalues/ | E | สมการลักษณะเฉพาะ ทแยงมุม เคย์ลีย์-แฮมิลตัน e^{At} |
| 7.7 | งานไฟฟ้า | /learn/linear-algebra/ee-applications/ | A | เมช โนด AC ปริภูมิสถานะ สองพอร์ต องค์ประกอบสมมาตร Y-bus |
| 7.8 | ไฟฟ้า·เครื่องกล·โยธา | /learn/linear-algebra/engineering-applications/ | G | อุบัติการณ์ โครงถัก โหมดการสั่น รังวัด จราจร |
| 7.9 | แล็บเมทริกซ์ | /learn/linear-algebra/matrix-lab/ | — | เครื่องคิดเลขเศษส่วนแม่นตรงแสดงวิธีทำ |
| 7.10 | แรงก์ (ค่าลำดับขั้น) | /learn/linear-algebra/rank/ | R | ลดแถว ไมเนอร์ พารามิเตอร์ k รูเช-กาเปลลี ปริภูมิศูนย์ แรงก์-ภาวะศูนย์ แรงก์ในวงจร/ระบบควบคุม/SVD |
| 7.11 | ผลเฉลยเชิงตัวเลข | /learn/linear-algebra/numerical-methods/ | N | จำนวนการคำนวณ partial pivoting LU PA=LU โชเลสกี โทมัส จาโคบี เกาส์-ไซเดล SOR ρ(T) ω* เลขเงื่อนไข refinement |
| 7.12 | แนวข้อสอบ 45 ข้อ | /learn/linear-algebra/exam-practice/ | X | ชุด A เข้ามหาวิทยาลัย 18 ข้อ · ชุด B ป.ตรี 15 ข้อ · ชุด C เชิงตัวเลข 12 ข้อ + โจทย์สุ่ม 10 แบบ |

เส้นทางอ่านเรื่องระบบสมการ: 7.1 → 7.2 → 7.3 → 7.10 → 7.4 → 7.5 → 7.11 → 7.12

## 3. สูตรหลักพร้อมรหัส (เลือกมา)

- **D7** \(\det(kA) = k^n\det A\) · **D11** \(\det(AB) = \det A\det B\), \(\det A^{-1} = 1/\det A\)
- **D22** \(\det(\operatorname{adj}A) = (\det A)^{n-1}\) · **D23** \(\operatorname{adj}(kA) = k^{n-1}\operatorname{adj}A\), \(\operatorname{adj}(\operatorname{adj}A) = (\det A)^{n-2}A\) · **D25** แนวทแยง \(a\) ตัวอื่น \(b\): \(\det = (a - b)^{n-1}(a + (n-1)b)\)
- **R1** แรงก์ = แถวอิสระ = หลักอิสระ = จำนวนตัวหลัก · **R4** ไมเนอร์ใหญ่สุดที่ไม่เป็นศูนย์ · **R6** ขั้นตอนโจทย์ k: det(k) → แยกตัวประกอบ → แทนค่าวิกฤตแล้วลดแถว
- **R7** รูเช-กาเปลลี · **R8** ตัวแปรอิสระ = n − rank · **R9** ระบบเอกพันธ์มีคำตอบไม่ชัด ⇔ rank < n
- **R10** rank + nullity = n · **R12** ซิลเวสเตอร์ \(\operatorname{rank}A + \operatorname{rank}B - n \le \operatorname{rank}AB \le \min\) · **R16** เมทริกซ์อุบัติการณ์มีแรงก์ n − 1 · **R17** คาลมาน \(\operatorname{rank}[B\ AB\ \cdots] = n\)
- **C1** \(x_i = \Delta_i/\Delta\) · **C10** พารามิเตอร์: Δ(k) = 0 ต้องแยกกรณี ห้ามตัดตัวประกอบ
- **N1** เกาส์/LU ≈ ⅔n³ flops, คราเมอร์ (โคแฟกเตอร์) ≈ (n+1)! · **N5** partial pivoting |m| ≤ 1 · **N7–N10** LU, PA = LU, det = (−1)^swaps Π u_ii
- **N11** โชเลสกี \(\ell_{jj} = \sqrt{a_{jj} - \sum\ell_{jk}^2}\) · **N12** โทมัส O(n)
- **N13** จาโคบี · **N14** เกาส์-ไซเดล · **N15** SOR \(x \leftarrow (1-\omega)x + \omega x^{GS}\) · **N18** ทแยงเด่น ⇒ ลู่เข้า · **N19** ρ(T) < 1 · **N20** k ≈ d/(−log₁₀ρ) · **N21** \(\omega^* = 2/(1 + \sqrt{1 - \rho_J^2})\)
- **N23** \(\kappa = \lVert A\rVert\lVert A^{-1}\rVert\) · **N24** ขอบเขตความคลาดเคลื่อน · **N25** ส่วนเหลือเล็กไม่รับประกันคำตอบแม่น

## 4. ตัวเลขตัวอย่างที่ตรวจแล้ว (SymPy, scripts/la_check.py)

- \(\begin{pmatrix} 1 & 1 & k \\ 1 & k & 1 \\ k & 1 & 1 \end{pmatrix}\): det = −(k−1)²(k+2); rank 1 ที่ k = 1, rank 2 ที่ k = −2, rank 3 อื่น ๆ
- ระบบ x+y+z=1, x+2y+3z=2, x+3y+az=b: a ≠ 5 คำตอบเดียว; a = 5, b = 3 ไม่จำกัด (t, 1−2t, t); a = 5, b ≠ 3 ไม่มีคำตอบ
- เกาส์ 3 หลักนัยสำคัญกับ 0.0001x + y = 1, x + y = 2: ไม่สลับแถว x = 0 (ผิด 100%), สลับแถว x = 1.00
- LU ของ [[1,2,4],[3,8,14],[2,6,13]]: L = [[1,0,0],[3,1,0],[2,1,1]], U = [[1,2,4],[0,2,2],[0,0,3]], det = 6; b = (3,13,4) → x = (3,4,−2)
- PA = LU ของ [[2,1,1],[4,−6,0],[−2,7,2]]: U = [[4,−6,0],[0,4,1],[0,0,1]], det = −16
- โชเลสกี [[4,2,2],[2,5,3],[2,3,6]] = LLᵀ, L = [[2,0,0],[1,2,0],[1,1,2]]; i = (10,13,17) → v = (1,1,2)
- โทมัส: แท่ง 100 °C / 0 °C 4 โหนด → (80, 60, 40, 20) °C
- จาโคบี / เกาส์-ไซเดล กับ 4x−y+z=7, 4x−8y+z=−21, −2x+y+5z=15 จาก (1,2,2): รอบ 1 = (1.75, 3.375, 3.0) / (1.75, 3.75, 2.95); ρ(T_J) ≈ 0.335, ρ(T_GS) = 0.125
- tridiag(−1,2,−1) 10×10: ρ_J = cos(π/11) = 0.9595, ρ_GS = 0.9206, ω* = 1.560, รอบเพื่อ 10⁻⁶ ≈ 334 / 167 / 24
- [[1,1],[1,1.0001]]: κ∞ ≈ 4.0 × 10⁴; κ∞(H₄) = 28,375, κ∞(H₁₀) ≈ 3.5 × 10¹³

## 5. แล็บโต้ตอบ (ใช้บนมือถือได้)

- แล็บหาแรงก์ (/learn/linear-algebra/rank/#lab): พิมพ์เมทริกซ์ถึง 6×7 เศษส่วนได้ ลดแถว REF/RREF ทีละขั้น แรเงาตัวหลัก แรงก์ ภาวะศูนย์ ฐานปริภูมิหลักและปริภูมิศูนย์ ทดสอบ [A|b] พร้อมคำตอบทั่วไป
- แล็บแรงก์กับ k (/learn/linear-algebra/rank/#parameter) และสามระนาบ 3 มิติที่หมุนได้ (/learn/linear-algebra/rank/#planes)
- แล็บการสลับแถวและการปัดเศษ 2–10 หลัก (/learn/linear-algebra/numerical-methods/#pivoting)
- แล็บแยก LU / PA = LU / โชเลสกี พร้อมแทนค่าสองรอบ (/learn/linear-algebra/numerical-methods/#lu)
- ซิมูเลเตอร์จาโคบี · เกาส์-ไซเดล · SOR: กราฟการลู่เข้า ρ(T) เส้นทาง 2×2 สแกน ω (/learn/linear-algebra/numerical-methods/#iter-lab)
- แล็บเลขเงื่อนไขและเมทริกซ์ฮิลเบิร์ต (/learn/linear-algebra/numerical-methods/#conditioning) · แผ่นความร้อนด้วยวิธีผ่อนคลาย (/learn/linear-algebra/numerical-methods/#heat)
- โจทย์สุ่ม 10 แบบตรวจคำตอบ (/learn/linear-algebra/exam-practice/#drill) · เครื่องคิดเลขเมทริกซ์แสดงวิธีทำ (/learn/linear-algebra/matrix-lab/)

## 6. บทความ (ไทย / English แยกลิงก์)

- แผนที่การเรียนเมทริกซ์และดีเทอร์มิแนนต์: /blog/matrix-determinant-roadmap/ · /en/blog/matrix-determinant-roadmap/
- แรงก์ของเมทริกซ์คืออะไร: /blog/matrix-rank/ · /en/blog/matrix-rank/
- กฎของคราเมอร์ใช้อย่างไร: /blog/cramers-rule/ · /en/blog/cramers-rule/
- สมบัติดีเทอร์มิแนนต์ 12 ข้อ: /blog/determinant-properties/ · /en/blog/determinant-properties/
- เกาส์ LU จาโคบี เกาส์-ไซเดล เลือกวิธีไหน: /blog/jacobi-vs-gauss-seidel/ · /en/blog/jacobi-vs-gauss-seidel/
- วิธีหา Determinant และ Inverse Matrix: /blog/determinant-and-inverse-matrix/ · /en/blog/determinant-and-inverse-matrix/

## 7. คำถามที่พบบ่อย

- **det A = 0 แปลว่าแรงก์ n − 1 ไหม?** ไม่เสมอ ต้องลดแถว เช่น เมทริกซ์ 3×3 ที่ทุกตัวเป็น 1 มีแรงก์ 1
- **ทำไมคอมพิวเตอร์ไม่ใช้คราเมอร์?** ต้นทุน ≈ (n+1)!; 20 ตัวแปร ≈ 5 × 10¹⁹ การคูณ (ราว 1,600 ปีที่ 10⁹ ครั้ง/วินาที) เทียบกับเกาส์ ≈ 2,700
- **จาโคบีกับเกาส์-ไซเดลต่างกันอย่างไร?** จาโคบีใช้ค่ารอบก่อนทั้งหมด เกาส์-ไซเดลใช้ค่าใหม่ทันที มักเร็วกว่าราวสองเท่า
- **det(2A) = 2 det A ไหม?** ไม่ ต้องเป็น 2ⁿ det A
