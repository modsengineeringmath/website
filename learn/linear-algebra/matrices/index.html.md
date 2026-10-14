---
title: "เมทริกซ์และการดำเนินการ (Matrices & Matrix Operations)"
url: https://modsengineeringmath.com/learn/linear-algebra/matrices/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-10-12
---

> สรุปเมทริกซ์ครบตั้งแต่ ม.ปลายถึงมหาวิทยาลัย นิยาม ขนาด ชนิดของเมทริกซ์ การบวก ลบ คูณด้วยสเกลาร์ การคูณเมทริกซ์ทีละช่อง ทรานสโพส เทรซ กำลังของเมทริกซ์ และเมทริกซ์บล็อก ทุกสูตรมีรหัสอ้างอิงและชื่อภาษาอังกฤษ

ฉบับ Markdown ของ https://modsengineeringmath.com/learn/linear-algebra/matrices/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# เมทริกซ์และการดำเนินการ (Matrices & Matrix Operations)

// บทที่ 7.1 · พีชคณิตเชิงเส้น · Matrices


เมทริกซ์คือภาษากลางของวิศวกรรม ระบบสมการจากวงจรสิบลูป สมการสถานะของมอเตอร์ หรือการแปลงสามเฟส ล้วนเขียนเป็นเมทริกซ์ได้ หน้านี้รวบรวมนิยาม ชนิด และการดำเนินการทุกแบบที่ต้องใช้ ทุกสูตรมีรหัส M กำกับไว้ให้อ้างอิง ตัวอย่างทำให้ดูทีละขั้น

สรุปใน 30 วินาที

- เมทริกซ์ $m\times n$ มี $m$ แถว $n$ หลัก สมาชิกแถว $i$ หลัก $j$ เขียนว่า $a_{ij}$

- บวก ลบ ทำทีละช่อง ขนาดต้องเท่ากัน ส่วนการคูณ $AB$ ต้องให้ “หลักของ A = แถวของ B” แล้วเอาแถวคูณจุดกับหลัก

- โดยทั่วไป $AB \ne BA$ และ $(AB)^T = B^TA^T$ ลำดับสำคัญเสมอ

- $I$ ทำหน้าที่เหมือนเลข 1: $AI = IA = A$

ระดับพื้นฐาน ม.ปลาย · ปี 1กลาง ป.ตรี วิศวกรรมขั้นสูง ป.โท · งานวิจัย

## เมทริกซ์คืออะไร พื้นฐาน

เมทริกซ์ (matrix) คือตัวเลขที่จัดเรียงเป็นตารางสี่เหลี่ยม มีแถว (row) เรียงตามแนวนอน และหลัก (column) เรียงตามแนวตั้ง เราบอกขนาดเป็น “จำนวนแถว × จำนวนหลัก” เสมอ ตัวอักษรใหญ่ใช้แทนทั้งเมทริกซ์ ตัวอักษรเล็กที่มีดัชนีสองตัวใช้แทนสมาชิกหนึ่งตัว

ดัชนีตัวแรกคือแถว ตัวที่สองคือหลัก เสมอ จำว่า “แถวก่อน หลักทีหลัง” (row then column)

M1 Matrix and its entries นิยามและสัญลักษณ์ของเมทริกซ์

$$A = [a_{ij}]_{m\times n} = \begin{pmatrix} a_{11} & a_{12} & \cdots & a_{1n} \\ a_{21} & a_{22} & \cdots & a_{2n} \\ \vdots & \vdots & \ddots & \vdots \\ a_{m1} & a_{m2} & \cdots & a_{mn} \end{pmatrix}$$

ขนาด (size, order) $m\times n$ อ่านว่า “m คูณ n” · เมทริกซ์ $1\times n$ เรียกเวกเตอร์แถว (row vector) · $m\times 1$ เรียกเวกเตอร์หลัก (column vector) · ถ้า $m = n$ เรียกเมทริกซ์จัตุรัส (square matrix) และสมาชิก $a_{11}, a_{22}, \dots, a_{nn}$ คือเส้นทแยงมุมหลัก (main diagonal)

M2 Equality of matrices การเท่ากันของเมทริกซ์

$$A = B \iff \text{ขนาดเท่ากัน และ } a_{ij} = b_{ij} \ \text{ทุก } i, j$$

ใช้ตั้งสมการหาตัวแปร เช่น $\begin{pmatrix} x+y & 2 \\ 3 & x-y\end{pmatrix} = \begin{pmatrix} 5 & 2 \\ 3 & 1\end{pmatrix}$ ให้ $x + y = 5,\ x - y = 1$ จึงได้ $x = 3,\ y = 2$

ตัวอย่าง M-0 · อ่านขนาดและสมาชิก

### ให้ $A = \begin{pmatrix} 3 & -1 & 0 & 2 \\ 5 & 4 & 7 & -6 \end{pmatrix}$ จงบอกขนาด $a_{13}$, $a_{24}$ และ $a_{31}$

- นับแถวได้ 2 นับหลักได้ 4 ขนาดจึงเป็น $2\times 4$ M1

- $a_{13}$ คือแถวที่ 1 หลักที่ 3 ได้ $0$ และ $a_{24}$ คือแถวที่ 2 หลักที่ 4 ได้ $-6$

- $a_{31}$ ต้องอยู่แถวที่ 3 แต่เมทริกซ์มีแค่ 2 แถว จึงไม่มีสมาชิกนี้

ขนาด $2\times4$ · $a_{13} = 0$ · $a_{24} = -6$ · $a_{31}$ ไม่นิยาม

## ชนิดของเมทริกซ์ (Types of Matrices) พื้นฐาน → ขั้นสูง

ชื่อเฉพาะเหล่านี้โผล่ในโจทย์และตำราตลอด รู้ชื่อแล้วรู้สมบัติทันที เช่น เห็นคำว่า “สามเหลี่ยม” ก็รู้ว่าดีเทอร์มิแนนต์คือผลคูณเส้นทแยง เห็นคำว่า “เชิงตั้งฉาก” ก็รู้ว่าอินเวอร์สคือทรานสโพส

| ชื่อ | เงื่อนไข | ตัวอย่าง | ระดับ |

| จัตุรัส
square | $m = n$ | $\begin{pmatrix}1&2\\3&4\end{pmatrix}$ | พื้นฐาน |

| ศูนย์
zero, $O$ | ทุกสมาชิกเป็น 0 | $\begin{pmatrix}0&0\\0&0\end{pmatrix}$ | พื้นฐาน |

| เอกลักษณ์
identity, $I_n$ | $a_{ii} = 1$, นอกเส้นทแยงเป็น 0 | $\begin{pmatrix}1&0\\0&1\end{pmatrix}$ | พื้นฐาน |

| ทแยงมุม
diagonal | $a_{ij} = 0$ เมื่อ $i \ne j$ | $\begin{pmatrix}2&0\\0&-5\end{pmatrix}$ | พื้นฐาน |

| สเกลาร์
scalar | ทแยงมุมที่ทุกตัวเท่ากัน $= kI$ | $\begin{pmatrix}3&0\\0&3\end{pmatrix}$ | พื้นฐาน |

| สามเหลี่ยมบน
upper triangular | $a_{ij} = 0$ เมื่อ $i \gt j$ | $\begin{pmatrix}1&4&2\\0&3&5\\0&0&6\end{pmatrix}$ | พื้นฐาน |

| สามเหลี่ยมล่าง
lower triangular | $a_{ij} = 0$ เมื่อ $i \lt j$ | $\begin{pmatrix}1&0\\7&2\end{pmatrix}$ | พื้นฐาน |

| สมมาตร
symmetric | $A^T = A$ คือ $a_{ij} = a_{ji}$ | $\begin{pmatrix}6&-4\\-4&10\end{pmatrix}$ | กลาง |

| สมมาตรเสมือน
skew-symmetric | $A^T = -A$ (ทแยงเป็น 0) | $\begin{pmatrix}0&3\\-3&0\end{pmatrix}$ | กลาง |

| เชิงตั้งฉาก
orthogonal | $Q^TQ = I$ ดังนั้น $Q^{-1} = Q^T$ | $\begin{pmatrix}\cos\theta&-\sin\theta\\ \sin\theta&\cos\theta\end{pmatrix}$ | กลาง |

| เอกฐาน
singular | $\det A = 0$ ไม่มีอินเวอร์ส | $\begin{pmatrix}1&2\\2&4\end{pmatrix}$ | พื้นฐาน |

| ฉายซ้ำคงเดิม
idempotent | $A^2 = A$ | $\begin{pmatrix}1&0\\0&0\end{pmatrix}$ | ขั้นสูง |

| นิลโพเทนต์
nilpotent | $A^k = O$ สำหรับบาง $k$ | $\begin{pmatrix}0&1\\0&0\end{pmatrix}$ | ขั้นสูง |

| เฮอร์มิเชียน
Hermitian | $A^H = A$ (สมมาตรแบบเชิงซ้อน) | $\begin{pmatrix}2&1-j\\1+j&3\end{pmatrix}$ | ขั้นสูง |

| ยูนิแทรี
unitary | $U^HU = I$ | $\tfrac{1}{\sqrt2}\begin{pmatrix}1&j\\j&1\end{pmatrix}$ | ขั้นสูง |

M3 Identity matrix เมทริกซ์เอกลักษณ์

$$I_n = \begin{pmatrix} 1 & 0 & \cdots & 0 \\ 0 & 1 & \cdots & 0 \\ \vdots & & \ddots & \vdots \\ 0 & 0 & \cdots & 1 \end{pmatrix}, \quad AI = IA = A$$

ทำหน้าที่เหมือนเลข 1 ของการคูณ ถ้า $A$ ไม่จัตุรัส ขนาด $I$ ทางซ้ายและขวาจะต่างกัน: $I_mA = AI_n = A$

M4 Symmetric + skew-symmetric split แยกเป็นส่วนสมมาตรและสมมาตรเสมือน

$$A = \underbrace{\tfrac12(A + A^T)}_{\text{สมมาตร}} + \underbrace{\tfrac12(A - A^T)}_{\text{สมมาตรเสมือน}}$$

เมทริกซ์จัตุรัสทุกตัวแยกแบบนี้ได้แบบเดียว ในรูปกำลังสอง $\mathbf x^TA\mathbf x$ มีแต่ส่วนสมมาตรที่มีผล

M5 Orthogonal matrix เมทริกซ์เชิงตั้งฉาก

$$Q^TQ = QQ^T = I \iff Q^{-1} = Q^T$$

หลักทุกหลักยาว 1 และตั้งฉากกัน รักษาความยาวและมุม $\det Q = \pm 1$ ตัวอย่างสำคัญคือเมทริกซ์หมุน $R(\theta)$ ที่ใช้ในการแปลงพาร์ก (Park transform)

M6 Conjugate transpose ทรานสโพสสังยุค (สำหรับเมทริกซ์เชิงซ้อน)

$$A^H = \overline{A}^{\,T}, \qquad (A^H)_{ij} = \overline{a_{ji}}$$

ใช้กับวงจร AC ที่สมาชิกเป็นอิมพีแดนซ์เชิงซ้อน กำลังเชิงซ้อน $S = \mathbf V^T\overline{\mathbf I}$ เขียนในรูปนี้ บางตำราเขียน $A^*$ หรือ $A^\dagger$

## บวก ลบ และคูณด้วยสเกลาร์ พื้นฐาน

สองการดำเนินการนี้ทำทีละช่อง (element-wise) ช่องตรงกันจับคู่กัน จึงต้องมีขนาดเท่ากันทุกประการ

M7 Matrix addition การบวกและลบ

$$(A \pm B)_{ij} = a_{ij} \pm b_{ij}$$

ใช้ได้เมื่อ $A$ และ $B$ ขนาดเท่ากันเท่านั้น

M8 Scalar multiplication การคูณด้วยสเกลาร์

$$(kA)_{ij} = k\,a_{ij}$$

คูณ $k$ เข้าไปทุกช่อง (ต่างจากดีเทอร์มิแนนต์ที่คูณแค่แถวเดียว ดู D7)

M9 Properties of addition and scalar multiplication สมบัติการบวกและการคูณสเกลาร์

$$\begin{gathered} A + B = B + A \qquad (A + B) + C = A + (B + C) \qquad A + O = A \\ k(A + B) = kA + kB \qquad (k + l)A = kA + lA \qquad k(lA) = (kl)A \end{gathered}$$

ตัวอย่าง M-1 · บวกลบและคูณสเกลาร์

### ให้ $A = \begin{pmatrix} 1 & -2 \\ 3 & 0 \end{pmatrix},\ B = \begin{pmatrix} 2 & 1 \\ -1 & 4 \end{pmatrix}$ จงหา $2A - 3B$

- คูณสเกลาร์เข้าทุกช่อง M8

$$2A = \begin{pmatrix} 2 & -4 \\ 6 & 0 \end{pmatrix}, \qquad 3B = \begin{pmatrix} 6 & 3 \\ -3 & 12 \end{pmatrix}$$

- ลบช่องต่อช่อง M7

$$2A - 3B = \begin{pmatrix} 2-6 & -4-3 \\ 6-(-3) & 0-12 \end{pmatrix}$$

$2A - 3B = \begin{pmatrix} -4 & -7 \\ 9 & -12 \end{pmatrix}$

## การคูณเมทริกซ์ (Matrix Multiplication) พื้นฐาน

การคูณเมทริกซ์ไม่ได้คูณทีละช่อง สมาชิกแต่ละตัวของผลคูณได้จากแถวของตัวหน้า “คูณจุด” กับหลักของตัวหลัง คือคูณตัวที่ตรงกันแล้วบวกรวม ก่อนคูณต้องเช็กขนาดก่อนเสมอ

เขียนขนาดเรียงกันแล้วดูตัวเลขด้านใน ถ้าไม่เท่ากันให้หยุด คูณไม่ได้

M10 Matrix product นิยามการคูณเมทริกซ์

$$(AB)_{ij} = \sum_{k=1}^{n} a_{ik}\,b_{kj} = a_{i1}b_{1j} + a_{i2}b_{2j} + \cdots + a_{in}b_{nj}$$

$A$ ขนาด $m\times n$, $B$ ขนาด $n\times p$ ได้ $AB$ ขนาด $m\times p$ · ช่อง $(i,j)$ = แถวที่ $i$ ของ $A$ คูณจุดกับหลักที่ $j$ ของ $B$

ตัวอย่าง M-2 · คูณเมทริกซ์ 2×3 กับ 3×2

### ให้ $A = \begin{pmatrix} 2 & -1 & 3 \\ 0 & 4 & 1 \end{pmatrix},\ B = \begin{pmatrix} 1 & 2 \\ 3 & 0 \\ -2 & 5 \end{pmatrix}$ จงหา $AB$ และ $BA$

- เช็กขนาด $(2\times{3})({3}\times 2)$ ด้านในเท่ากัน คูณได้ ผลลัพธ์ขนาด $2\times 2$

- ช่อง $(1,1)$: แถว 1 ของ A คูณจุดหลัก 1 ของ B M10

$$c_{11} = (2)(1) + (-1)(3) + (3)(-2) = 2 - 3 - 6 = -7$$

- ช่อง $(1,2)$: แถว 1 คูณจุดหลัก 2

$$c_{12} = (2)(2) + (-1)(0) + (3)(5) = 4 + 0 + 15 = 19$$

- ช่อง $(2,1)$ และ $(2,2)$: แถว 2 คูณจุดหลัก 1 และหลัก 2

$$\begin{aligned} c_{21} &= (0)(1) + (4)(3) + (1)(-2) = 10 \\ c_{22} &= (0)(2) + (4)(0) + (1)(5) = 5 \end{aligned}$$

- ส่วน $BA$ มีขนาด $(3\times{2})({2}\times3) = 3\times 3$ คำนวณแบบเดียวกันได้

$$BA = \begin{pmatrix} 2 & 7 & 5 \\ 6 & -3 & 9 \\ -4 & 22 & -1 \end{pmatrix}$$

$AB = \begin{pmatrix} -7 & 19 \\ 10 & 5 \end{pmatrix}$ ขนาด 2×2 แต่ $BA$ ขนาด 3×3 สองตัวนี้ไม่มีทางเท่ากัน

### สมบัติของการคูณเมทริกซ์

M11 Properties of matrix multiplication สมบัติที่ใช้ได้

$$\begin{gathered} (AB)C = A(BC) \qquad A(B + C) = AB + AC \qquad (A + B)C = AC + BC \\ k(AB) = (kA)B = A(kB) \qquad I_mA = AI_n = A \end{gathered}$$

M12 What does NOT hold สิ่งที่ใช้กับเมทริกซ์ไม่ได้ (ต่างจากตัวเลข)

$$\begin{gathered} AB \ne BA \ \text{(โดยทั่วไป)} \qquad AB = O \not\Rightarrow A = O \text{ หรือ } B = O \\ AB = AC \not\Rightarrow B = C \qquad (A + B)^2 = A^2 + AB + BA + B^2 \ne A^2 + 2AB + B^2 \end{gathered}$$

ตัดเมทริกซ์ทั้งสองข้างได้ก็ต่อเมื่อ $A$ มีอินเวอร์ส ($\det A \ne 0$) แล้วคูณ $A^{-1}$ ทางซ้ายทั้งสองข้าง

ตัวอย่าง M-3 · ลำดับการคูณสำคัญ

### ให้ $A = \begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix},\ B = \begin{pmatrix} 1 & 0 \\ 3 & 1 \end{pmatrix}$ แสดงว่า $AB \ne BA$

-
$$AB = \begin{pmatrix} 1\cdot1 + 2\cdot3 & 1\cdot0 + 2\cdot1 \\ 0\cdot1 + 1\cdot3 & 0\cdot0 + 1\cdot1 \end{pmatrix} = \begin{pmatrix} 7 & 2 \\ 3 & 1 \end{pmatrix}$$

-
$$BA = \begin{pmatrix} 1\cdot1 + 0\cdot0 & 1\cdot2 + 0\cdot1 \\ 3\cdot1 + 1\cdot0 & 3\cdot2 + 1\cdot1 \end{pmatrix} = \begin{pmatrix} 1 & 2 \\ 3 & 7 \end{pmatrix}$$

ขนาดเท่ากันแต่ค่าต่างกัน จึง $AB \ne BA$ M12

ตัวอย่างที่น่าตกใจกว่า: $\begin{pmatrix}1&1\\1&1\end{pmatrix}\begin{pmatrix}1&-1\\-1&1\end{pmatrix} = \begin{pmatrix}0&0\\0&0\end{pmatrix}$ ทั้งที่ไม่มีตัวไหนเป็นเมทริกซ์ศูนย์

### มองการคูณสามแบบ กลาง

สูตร M10 เป็นวิธีคำนวณ แต่การ “มองออก” ว่าการคูณหมายถึงอะไรช่วยมากในบทหลัง โดยเฉพาะมุมมองแบบหลัก ซึ่งเป็นหัวใจของระบบสมการและค่าเฉพาะ

M13 Column view: Ax is a combination of columns $A\mathbf x$ คือผลรวมเชิงเส้นของหลัก

$$A\mathbf x = \begin{pmatrix} | & | & & | \\ \mathbf a_1 & \mathbf a_2 & \cdots & \mathbf a_n \\ | & | & & | \end{pmatrix}\begin{pmatrix} x_1 \\ x_2 \\ \vdots \\ x_n \end{pmatrix} = x_1\mathbf a_1 + x_2\mathbf a_2 + \cdots + x_n\mathbf a_n$$

การแก้ $A\mathbf x = \mathbf b$ จึงคือการถามว่า “ผสมหลักของ A ด้วยปริมาณเท่าไรจึงได้ $\mathbf b$” ถ้าหลักขึ้นต่อกันเชิงเส้น ($\det A = 0$) อาจผสมไม่ได้หรือผสมได้หลายแบบ

M14 Row view มุมมองแถว

$$(A\mathbf x)_i = \mathbf r_i \cdot \mathbf x$$

แต่ละแถวคือสมการหนึ่งสมการ เช่น KVL หนึ่งลูป

M15 Outer-product view ผลรวมผลคูณภายนอก

$$AB = \sum_{k=1}^{n} (\text{หลัก } k \text{ ของ } A)(\text{แถว } k \text{ ของ } B)$$

แต่ละพจน์เป็นเมทริกซ์แรงก์หนึ่ง เป็นพื้นฐานของ SVD และการบีบอัดข้อมูล

ระบบสมการคือการคูณเมทริกซ์: $\begin{aligned}2x + 3y &= 8\\ x - y &= -1\end{aligned}$ เขียนเป็น $\begin{pmatrix}2&3\\1&-1\end{pmatrix}\begin{pmatrix}x\\y\end{pmatrix} = \begin{pmatrix}8\\-1\end{pmatrix}$ หรือ $A\mathbf x = \mathbf b$ ทุกวิธีในหน้าถัด ๆ ไปคือวิธีหา $\mathbf x$ ตัวนี้ ไปหน้าระบบสมการ →

## ทรานสโพส (Transpose) พื้นฐาน

ทรานสโพสคือการพลิกเมทริกซ์ตามเส้นทแยงมุมหลัก แถวกลายเป็นหลัก หลักกลายเป็นแถว เมทริกซ์ $m\times n$ จึงกลายเป็น $n\times m$ ภาษาไทยเรียกเมทริกซ์สลับเปลี่ยน

M16 Transpose นิยามทรานสโพส

$$(A^T)_{ij} = a_{ji}, \qquad \begin{pmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \end{pmatrix}^{\!T} = \begin{pmatrix} 1 & 4 \\ 2 & 5 \\ 3 & 6 \end{pmatrix}$$

M17 Properties of transpose สมบัติของทรานสโพส

$$\begin{gathered} (A^T)^T = A \qquad (A + B)^T = A^T + B^T \\ (kA)^T = kA^T \qquad {(AB)^T = B^TA^T} \end{gathered}$$

ทรานสโพสของผลคูณกลับลำดับ ขยายได้: $(ABC)^T = C^TB^TA^T$

ตัวอย่าง M-4 · ตรวจ (AB)ᵀ = BᵀAᵀ

### ใช้ $A, B$ จากตัวอย่าง M-2 ตรวจว่า $(AB)^T = B^TA^T$

- จากตัวอย่าง M-2 ได้ $AB = \begin{pmatrix} -7 & 19 \\ 10 & 5 \end{pmatrix}$ จึง $(AB)^T = \begin{pmatrix} -7 & 10 \\ 19 & 5 \end{pmatrix}$

- คำนวณ $B^TA^T$ โดยขนาด $(2\times3)(3\times2) = 2\times2$

$$B^TA^T = \begin{pmatrix} 1 & 3 & -2 \\ 2 & 0 & 5 \end{pmatrix}\begin{pmatrix} 2 & 0 \\ -1 & 4 \\ 3 & 1 \end{pmatrix} = \begin{pmatrix} 2 - 3 - 6 & 0 + 12 - 2 \\ 4 + 0 + 15 & 0 + 0 + 5 \end{pmatrix}$$

$B^TA^T = \begin{pmatrix} -7 & 10 \\ 19 & 5 \end{pmatrix} = (AB)^T$ ✓ ส่วน $A^TB^T$ มีขนาด 3×3 จึงผิดตั้งแต่ขนาด

เกร็ดที่ใช้บ่อย: $A^TA$ และ $AA^T$ สมมาตรเสมอ เพราะ $(A^TA)^T = A^T(A^T)^T = A^TA$ เมทริกซ์นี้ปรากฏในวิธีกำลังสองน้อยสุด L10

## เทรซ (Trace) กลาง

เทรซคือผลบวกสมาชิกบนเส้นทแยงมุมหลักของเมทริกซ์จัตุรัส ดูเหมือนเล็กน้อย แต่เท่ากับผลบวกค่าเฉพาะทุกตัว จึงเป็นเครื่องมือตรวจคำตอบที่เร็วที่สุด

M18 Trace นิยามเทรซ

$$\operatorname{tr}A = \sum_{i=1}^{n} a_{ii} = a_{11} + a_{22} + \cdots + a_{nn}$$

M19 Properties of trace สมบัติของเทรซ

$$\begin{gathered} \operatorname{tr}(A + B) = \operatorname{tr}A + \operatorname{tr}B \qquad \operatorname{tr}(kA) = k\operatorname{tr}A \\ \operatorname{tr}(A^T) = \operatorname{tr}A \qquad {\operatorname{tr}(AB) = \operatorname{tr}(BA)} \end{gathered}$$

ข้อสุดท้ายจริงแม้ $AB$ กับ $BA$ ขนาดต่างกัน และ $\operatorname{tr}A = \lambda_1 + \cdots + \lambda_n$ E6

ตรวจด้วยตัวอย่าง M-2: $\operatorname{tr}(AB) = -7 + 5 = -2$ และ $\operatorname{tr}(BA) = 2 + (-3) + (-1) = -2$ เท่ากันจริง แม้ตัวหนึ่ง 2×2 อีกตัว 3×3

## กำลังของเมทริกซ์ (Matrix Powers) กลาง

M20 Matrix power กำลังของเมทริกซ์จัตุรัส

$$A^0 = I, \quad A^k = \underbrace{AA\cdots A}_{k \text{ ตัว}}, \quad A^mA^n = A^{m+n}, \quad (A^m)^n = A^{mn}$$

นิยามได้เฉพาะเมทริกซ์จัตุรัส และโดยทั่วไป $(AB)^k \ne A^kB^k$

M21 Power of a diagonal matrix กำลังของเมทริกซ์ทแยงมุม

$$\begin{pmatrix} d_1 & & \\ & \ddots & \\ & & d_n \end{pmatrix}^{\!k} = \begin{pmatrix} d_1^k & & \\ & \ddots & \\ & & d_n^k \end{pmatrix}$$

นี่คือเหตุผลที่อยากทำเมทริกซ์ให้เป็นทแยงมุม: $A^k = PD^kP^{-1}$ E10

ตัวอย่าง M-5 · หารูปแบบของ Aⁿ

### ให้ $A = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ จงหา $A^n$

- ลองคำนวณกำลังน้อย ๆ ก่อน

$$A^2 = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix} = \begin{pmatrix} 1 & {2} \\ 0 & 1 \end{pmatrix}, \qquad A^3 = A^2A = \begin{pmatrix} 1 & {3} \\ 0 & 1 \end{pmatrix}$$

- เดาว่า $A^n = \begin{pmatrix} 1 & n \\ 0 & 1 \end{pmatrix}$ แล้วพิสูจน์ด้วยอุปนัย: ถ้าจริงที่ $n$ จะได้

$$A^{n+1} = A^nA = \begin{pmatrix} 1 & n \\ 0 & 1 \end{pmatrix}\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix} = \begin{pmatrix} 1 & n+1 \\ 0 & 1 \end{pmatrix}$$

$A^n = \begin{pmatrix} 1 & n \\ 0 & 1 \end{pmatrix}$ (เมทริกซ์เฉือน shear ที่เฉือนสะสมทีละหนึ่งหน่วย)

## เมทริกซ์บล็อก (Block Matrices) ขั้นสูง

เมทริกซ์ใหญ่แบ่งเป็นบล็อกย่อยได้ แล้วคูณบล็อกเหมือนคูณตัวเลข (แต่ต้องรักษาลำดับ) ใช้มากในระบบที่ประกอบจากระบบย่อย เช่น การวิเคราะห์โนดดัดแปลง (MNA) ใน SPICE ที่มีรูป $\begin{pmatrix} G & B \\ C & D\end{pmatrix}$ และแบบจำลองปริภูมิสถานะของระบบหลายส่วน

M22 Block multiplication การคูณแบบบล็อก

$$\begin{pmatrix} A & B \\ C & D \end{pmatrix}\begin{pmatrix} E & F \\ G & H \end{pmatrix} = \begin{pmatrix} AE + BG & AF + BH \\ CE + DG & CF + DH \end{pmatrix}$$

ขนาดของบล็อกต้องคูณกันได้ทุกคู่ · บล็อกทแยงมุม $\operatorname{diag}(A_1, A_2)$ ยกกำลัง หาอินเวอร์ส และหาดีเทอร์มิแนนต์แยกบล็อกได้เลย

## เวกเตอร์ในรูปเมทริกซ์ กลาง

เวกเตอร์หลัก $\mathbf x$ คือเมทริกซ์ $n\times 1$ การคูณจุดและความยาวเขียนเป็นการคูณเมทริกซ์ได้ ทำให้สูตรของเวกเตอร์กับเมทริกซ์ใช้ภาษาเดียวกัน (ทบทวนเวกเตอร์ที่ พีชคณิตของเวกเตอร์)

M23 Inner product, norm and outer product ผลคูณภายใน ความยาว และผลคูณภายนอก

$$\mathbf x^T\mathbf y = \sum_{i} x_iy_i, \qquad \lVert\mathbf x\rVert = \sqrt{\mathbf x^T\mathbf x}, \qquad \mathbf x \perp \mathbf y \iff \mathbf x^T\mathbf y = 0, \qquad \mathbf x\mathbf y^T = [x_iy_j]$$

$\mathbf x^T\mathbf y$ เป็นตัวเลข (1×1) ส่วน $\mathbf x\mathbf y^T$ เป็นเมทริกซ์ $n\times n$ ลำดับต่างกันผลต่างกันมาก กำลังไฟฟ้ารวมในวงจร $P = \mathbf v^T\mathbf i$

## ข้อผิดพลาดที่พบบ่อย พื้นฐาน

เช็กลิสต์ก่อนส่งคำตอบ

- คูณเมทริกซ์ทีละช่องเหมือนการบวก → ผิด ต้องแถวคูณจุดหลัก M10

- ลืมเช็กขนาดก่อนคูณ → เขียนขนาดเรียงกันทุกครั้ง ด้านในต้องเท่ากัน

- สลับลำดับ $AB$ เป็น $BA$ โดยไม่รู้ตัว → ผิด เว้นแต่โจทย์บอกว่าสลับที่ได้ M12

- เขียน $(AB)^T = A^TB^T$ → ผิด ต้องกลับลำดับเป็น $B^TA^T$ M17

- กระจาย $(A + B)^2 = A^2 + 2AB + B^2$ → ผิด ต้องเป็น $A^2 + AB + BA + B^2$

- สับสน $a_{ij}$ ว่าตัวไหนแถว → ตัวแรกแถว ตัวหลังหลัก เสมอ M1

## ต่อยอดไปหน้าถัดไป

เมื่อเขียนระบบเป็น $A\mathbf x = \mathbf b$ ได้แล้ว คำถามแรกคือ “ระบบนี้มีคำตอบเดียวไหม” ตัวเลขที่ตอบคำถามนี้ได้ทันทีคือ ดีเทอร์มิแนนต์ ส่วนตัวอย่างการเขียนเมทริกซ์จากวงจรจริงอยู่ในหน้า ประยุกต์ในวิศวกรรมไฟฟ้า

## คำถามที่พบบ่อย

คูณเมทริกซ์ได้เมื่อไร?
คูณ $AB$ ได้เมื่อจำนวนหลักของ $A$ เท่ากับจำนวนแถวของ $B$ ถ้า $A$ ขนาด $m\times n$ และ $B$ ขนาด $n\times p$ ผลคูณมีขนาด $m\times p$ จำง่าย ๆ ว่าตัวเลขด้านในต้องเท่ากัน ตัวเลขด้านนอกคือขนาดคำตอบ

ทำไม AB ไม่เท่ากับ BA?
เพราะสมาชิกของ $AB$ มาจากแถวของ $A$ คูณหลักของ $B$ ส่วน $BA$ มาจากแถวของ $B$ คูณหลักของ $A$ เป็นการจับคู่ตัวเลขคนละชุด บางครั้งขนาดยังไม่เท่ากันด้วยซ้ำ ในความหมายเชิงเรขาคณิต $AB$ คือทำการแปลง $B$ ก่อนแล้วตามด้วย $A$ ลำดับจึงสำคัญ

ทรานสโพสของผลคูณคืออะไร?
$(AB)^T = B^T A^T$ ลำดับกลับด้านเสมอ เหมือนใส่ถุงเท้าแล้วใส่รองเท้า ตอนถอดต้องถอดรองเท้าก่อน

เทรซ (trace) ใช้ทำอะไร?
เทรซคือผลบวกสมาชิกบนเส้นทแยงมุมหลัก เท่ากับผลบวกของค่าเฉพาะทุกตัว ใช้ตรวจคำตอบค่าเฉพาะได้ทันที และในระบบอันดับสองเทรซของเมทริกซ์สถานะบอกค่าการหน่วง

มด

อาจารย์มด · ธีรวุฒิ แสวงบุญ
อาจารย์สาขาวิชาวิศวกรรมไฟฟ้า มหาวิทยาลัยราชภัฏธนบุรี สมุทรปราการ · ดูโปรไฟล์

## คำถามที่พบบ่อย (FAQ)

**คูณเมทริกซ์ได้เมื่อไร?**
คูณ $AB$ ได้เมื่อจำนวนหลักของ $A$ เท่ากับจำนวนแถวของ $B$ ถ้า $A$ ขนาด $m\times n$ และ $B$ ขนาด $n\times p$ ผลคูณมีขนาด $m\times p$ จำง่าย ๆ ว่าตัวเลขด้านในต้องเท่ากัน ตัวเลขด้านนอกคือขนาดคำตอบ

**ทำไม AB ไม่เท่ากับ BA?**
เพราะสมาชิกของ $AB$ มาจากแถวของ $A$ คูณหลักของ $B$ ส่วน $BA$ มาจากแถวของ $B$ คูณหลักของ $A$ เป็นการจับคู่ตัวเลขคนละชุด บางครั้งขนาดยังไม่เท่ากันด้วยซ้ำ ในความหมายเชิงเรขาคณิต $AB$ คือทำการแปลง $B$ ก่อนแล้วตามด้วย $A$ ลำดับจึงสำคัญ

**ทรานสโพสของผลคูณคืออะไร?**
$(AB)^T = B^T A^T$ ลำดับกลับด้านเสมอ เหมือนใส่ถุงเท้าแล้วใส่รองเท้า ตอนถอดต้องถอดรองเท้าก่อน

**เทรซ (trace) ใช้ทำอะไร?**
เทรซคือผลบวกสมาชิกบนเส้นทแยงมุมหลัก เท่ากับผลบวกของค่าเฉพาะทุกตัว ใช้ตรวจคำตอบค่าเฉพาะได้ทันที และในระบบอันดับสองเทรซของเมทริกซ์สถานะบอกค่าการหน่วง
