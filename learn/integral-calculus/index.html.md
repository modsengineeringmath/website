---
title: "อินทิกรัล (Integral Calculus): สูตร คุณสมบัติ และวิธีทำทีละขั้น"
url: https://modsengineeringmath.com/learn/integral-calculus/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-10-12
---

> รวมสูตรอินทิเกรตพร้อมชื่อสากล คุณสมบัติของอินทิกรัล สูตรสำเร็จ และตัวอย่างวิธีทำทีละขั้นแบบจดเลกเชอร์ การเปลี่ยนตัวแปร u การหารยาวพหุนาม เศษส่วนย่อย การอินทิเกรตทีละส่วน และอินทิกรัลจำกัดเขตจากนิยามผลบวกรีมันน์

ฉบับ Markdown ของ https://modsengineeringmath.com/learn/integral-calculus/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# อินทิกรัล (Integral Calculus): สูตร คุณสมบัติ และวิธีทำทีละขั้น

// บทที่ 5 · แคลคูลัส · สูตรและวิธีทำ


รวมสูตรอินทิเกรตตั้งแต่พื้นฐานไปจนถึงระดับกลาง ทุกสูตรและทุกคุณสมบัติมีรหัสและชื่อสากลกำกับไว้ให้อ้างอิงได้ ตัวอย่างเขียนแบบจดเลกเชอร์ บอกทุกขั้นว่าใช้สูตรไหน ใช้คุณสมบัติข้อใด ส่วนไหนตัดกันได้ก็ขีดเส้นสีแดงให้เห็น ปิดท้ายด้วยอินทิกรัลจำกัดเขตตั้งแต่นิยามผลบวกรีมันน์ไปจนถึงการแทนค่าขอบบนขอบล่าง

สรุปใน 30 วินาที

- อินทิเกรตคือการย้อนอนุพันธ์: ถ้า $F'(x) = f(x)$ แล้ว $\int f(x)\,dx = F(x) + C$

- สูตรที่ใช้บ่อยที่สุดคือกฎยกกำลัง $\int x^n\,dx = \dfrac{x^{n+1}}{n+1} + C$ ใช้ได้ทุก n ยกเว้น $-1$ ซึ่งให้ $\ln|x|$

- ถ้าเห็นก้อนข้างในพร้อมอนุพันธ์ของมัน ให้เปลี่ยนตัวแปร u ถ้าเป็นเศษส่วนที่ตัวเศษดีกรีสูงกว่า ให้หารยาวก่อน

- อินทิกรัลจำกัดเขต $\int_a^b f(x)\,dx = F(b) - F(a)$ ค่า C ตัดกันหายไป

## อินทิกรัลคืออะไร (Antiderivative)

อนุพันธ์ตอบคำถามว่า “เปลี่ยนเร็วแค่ไหน” ส่วนอินทิกรัลถามกลับว่า “รู้อัตราการเปลี่ยนแล้ว ของจริงเป็นอย่างไร” เช่น รู้กระแส $i(t)$ ที่ไหลเข้าตัวเก็บประจุ แล้วอยากรู้ประจุสะสม $q(t)$ งานนี้คือการหาปฏิยานุพันธ์ (antiderivative)

ฟังก์ชัน$F(x) = x^3 + C$

→ d/dx →
← ∫ dx ←
อนุพันธ์$f(x) = 3x^2$

⇄
เขียนเป็นอินทิกรัล$\int 3x^2\,dx = x^3 + C$

D1 Indefinite integral (antiderivative) นิยามอินทิกรัลไม่จำกัดเขต

$$\int f(x)\,dx = F(x) + C \quad\Longleftrightarrow\quad F'(x) = f(x)$$

อ่านว่า “อินทิกรัลของ f(x) เทียบกับ x” · $\int$ เครื่องหมายอินทิกรัล (integral sign) · $f(x)$ ตัวถูกอินทิเกรต (integrand) · $dx$ บอกตัวแปร (differential) · $C$ ค่าคงที่ของการอินทิเกรต (constant of integration)

ตรวจคำตอบทุกครั้งได้ฟรี: หาอนุพันธ์ของคำตอบ ถ้าได้ตัวถูกอินทิเกรตกลับมาแสดงว่าถูก ตัวอย่างทุกข้อในหน้านี้มีบรรทัด “ตรวจคำตอบ” ปิดท้าย

## คุณสมบัติของอินทิกรัลไม่จำกัดเขต (Properties)

คุณสมบัติทั้งหมดนี้ได้มาจากกฎของอนุพันธ์ ใช้รหัส P กำกับไว้ เวลาเห็น P2 ในวิธีทำ คลิกกลับมาดูได้ทันที

P1 Constant multiple rule กฎตัวคูณค่าคงที่

$$\int k\,f(x)\,dx = k\int f(x)\,dx$$

ดึงค่าคงที่ออกมานอกเครื่องหมายอินทิกรัลได้ (k ต้องไม่ใช่ฟังก์ชันของ x)

P2 Sum and difference rule กฎผลบวกและผลต่าง

$$\begin{aligned} &\int [f(x) \pm g(x)]\,dx \\ &= \int f(x)\,dx \pm \int g(x)\,dx \end{aligned}$$

อินทิเกรตแยกทีละพจน์ (term by term) ได้

P3 Linearity ความเป็นเชิงเส้น (P1 + P2 รวมกัน)

$$\begin{aligned} &\int [a\,f(x) + b\,g(x)]\,dx \\ &= a\int f(x)\,dx + b\int g(x)\,dx \end{aligned}$$

P4 Derivative of an integral อนุพันธ์หักล้างอินทิกรัล

$$\frac{d}{dx}\int f(x)\,dx = f(x)$$

P5 Integral of a derivative อินทิกรัลหักล้างอนุพันธ์

$$\int F'(x)\,dx = F(x) + C$$

P6 No product or quotient rule ข้อควรระวัง: ไม่มีกฎผลคูณและผลหาร

$$\begin{gathered} \int f(x)\,g(x)\,dx \ne \int f(x)\,dx \cdot \int g(x)\,dx \\ \int \frac{f(x)}{g(x)}\,dx \ne \frac{\int f(x)\,dx}{\int g(x)\,dx} \end{gathered}$$

ผลคูณต้องกระจายก่อน เปลี่ยนตัวแปร u หรืออินทิเกรตทีละส่วน (by parts) ส่วนเศษส่วนต้องจัดรูป หารยาว หรือแยกเศษส่วนย่อย

### ค่าคงที่ C₁ + C₂ + C₃ รวมเป็น C ตัวเดียวได้อย่างไร

เวลาใช้ P2 อินทิเกรตแยกทีละพจน์ แต่ละพจน์จะได้ค่าคงที่ของตัวเอง ผลบวกของค่าคงที่หลายตัวก็ยังเป็นค่าคงที่ตัวเดียว จึงตั้งชื่อใหม่ว่า C แล้วเขียนครั้งเดียวท้ายคำตอบ

ตัวอย่าง 1 · อินทิเกรตทีละพจน์

### หา $\displaystyle\int (3x^2 - 4x + 5)\,dx$

- แยกเป็นสามพจน์ด้วยกฎผลบวกผลต่าง แล้วดึงค่าคงที่ออก P2 Sum rule P1 Constant multiple

$$\begin{aligned} &\int (3x^2 - 4x + 5)\,dx \\ &= {3\int x^2\,dx} - {4\int x\,dx} + {5\int 1\,dx} \end{aligned}$$

- อินทิเกรตแต่ละพจน์ด้วยกฎยกกำลัง แต่ละพจน์มีค่าคงที่ของตัวเอง F2 Power rule F1 Constant rule

$$\begin{aligned} 3\int x^2\,dx &= 3\cdot{\frac{x^3}{3}} + {C_1} = x^3 + {C_1} \\ 4\int x\,dx &= 4\cdot{\frac{x^2}{2}} + {C_2} = 2x^2 + {C_2} \\ 5\int 1\,dx &= 5{x} + {C_3} \end{aligned}$$

- นำมารวมกันตามเครื่องหมายเดิม แล้วจับค่าคงที่ไว้ด้วยกัน

$$\begin{aligned} &(x^3 + {C_1}) - (2x^2 + {C_2}) + (5x + {C_3}) \\ &= x^3 - 2x^2 + 5x + {(C_1 - C_2 + C_3)} \end{aligned}$$

- $C_1 - C_2 + C_3$ เป็นตัวเลขคงที่ตัวหนึ่ง ตั้งชื่อใหม่ว่า $C$

$${C_1 - C_2 + C_3 = C}$$

$\displaystyle\int (3x^2 - 4x + 5)\,dx = x^3 - 2x^2 + 5x + C$

ตรวจคำตอบ: $\dfrac{d}{dx}(x^3 - 2x^2 + 5x + C) = 3x^2 - 4x + 5$ ✓ ในทางปฏิบัติจึงไม่ต้องเขียน $C_1, C_2, C_3$ แยก เขียน + C ครั้งเดียวตอนจบได้เลย

## สูตรอินทิเกรตพื้นฐาน (Basic Integration Formulas)

ทุกสูตรได้จากการอ่านตารางอนุพันธ์ย้อนกลับ ละ + C ไว้ทุกบรรทัดเพื่อให้อ่านง่าย มุมในฟังก์ชันตรีโกณต้องเป็นเรเดียน

F1 Constant rule อินทิกรัลของค่าคงที่

$$\int k\,dx = kx + C$$

F2 Power rule กฎยกกำลัง

$$\int x^n\,dx = \frac{x^{n+1}}{n+1} + C, \quad n \ne -1$$

“บวกเลขชี้กำลังหนึ่ง แล้วหารด้วยเลขชี้กำลังใหม่” ใช้ได้กับ n ที่เป็นเศษส่วนและติดลบด้วย

F3 Reciprocal rule กรณี n = −1 ได้ลอการิทึม

$$\int \frac{1}{x}\,dx = \ln|x| + C$$

ใส่ค่าสัมบูรณ์เพราะ ln ของจำนวนลบไม่นิยาม

F4 Exponential rule เอกซ์โพเนนเชียลฐาน e

$$\int e^x\,dx = e^x + C$$

F5 General exponential เอกซ์โพเนนเชียลฐาน a

$$\int a^x\,dx = \frac{a^x}{\ln a} + C, \quad a \gt 0,\ a \ne 1$$

F6 Sine and cosine sin และ cos

$$\begin{gathered} \int \sin x\,dx = -\cos x + C \\ \int \cos x\,dx = \sin x + C \end{gathered}$$

จำเครื่องหมาย: อนุพันธ์ของ cos มีลบ อินทิกรัลของ sin จึงมีลบ

F7 sec² and csc²

$$\begin{gathered} \int \sec^2 x\,dx = \tan x + C \\ \int \csc^2 x\,dx = -\cot x + C \end{gathered}$$

F8 sec·tan and csc·cot

$$\begin{gathered} \int \sec x\tan x\,dx = \sec x + C \\ \int \csc x\cot x\,dx = -\csc x + C \end{gathered}$$

F9 tan and cot

$$\begin{gathered} \int \tan x\,dx = \ln|\sec x| + C \\ \int \cot x\,dx = \ln|\sin x| + C \end{gathered}$$

$\ln|\sec x| = -\ln|\cos x|$ เขียนแบบไหนก็ได้

F10 sec and csc

$$\begin{gathered} \int \sec x\,dx = \ln|\sec x + \tan x| + C \\ \int \csc x\,dx = \ln|\csc x - \cot x| + C \end{gathered}$$

F11 Inverse tangent form ได้ arctan

$$\int \frac{dx}{1+x^2} = \arctan x + C$$

F12 Inverse sine form ได้ arcsin

$$\int \frac{dx}{\sqrt{1-x^2}} = \arcsin x + C$$

F13 Hyperbolic functions ฟังก์ชันไฮเพอร์โบลิก

$$\begin{gathered} \int \sinh x\,dx = \cosh x + C \\ \int \cosh x\,dx = \sinh x + C \end{gathered}$$

### ก่อนใช้กฎยกกำลัง: เปลี่ยนรากและเศษส่วนเป็นเลขชี้กำลัง

| เห็นแบบนี้ | เขียนใหม่เป็น | แล้วอินทิเกรตได้ |

| $\sqrt{x}$ | $x^{1/2}$ | $\dfrac{x^{3/2}}{3/2} = \dfrac{2}{3}x^{3/2}$ |

| $\sqrt[3]{x^2}$ | $x^{2/3}$ | $\dfrac{3}{5}x^{5/3}$ |

| $\dfrac{1}{x^2}$ | $x^{-2}$ | $\dfrac{x^{-1}}{-1} = -\dfrac{1}{x}$ |

| $\dfrac{1}{\sqrt{x}}$ | $x^{-1/2}$ | $\dfrac{x^{1/2}}{1/2} = 2\sqrt{x}$ |

| $\dfrac{5}{x^3}$ | $5x^{-3}$ | $5\cdot\dfrac{x^{-2}}{-2} = -\dfrac{5}{2x^2}$ |

| $x\sqrt{x}$ | $x^{1}\cdot x^{1/2} = x^{3/2}$ | $\dfrac{2}{5}x^{5/2}$ |

## สูตรเมื่อข้างในเป็น ax + b (Linear Substitution Forms)

ถ้าข้างในเป็นเชิงเส้น $ax + b$ ให้ใช้สูตรพื้นฐานได้เลย แล้วหารด้วย a ซึ่งคืออนุพันธ์ของข้างใน กลุ่มนี้คือการเปลี่ยนตัวแปร u ที่ทำไว้ให้แล้ว

G1 Power of a linear term พจน์เชิงเส้นยกกำลัง

$$\int (ax+b)^n\,dx = \frac{(ax+b)^{n+1}}{a\,(n+1)} + C, \quad n \ne -1$$

G2 Reciprocal of a linear term

$$\int \frac{dx}{ax+b} = \frac{1}{a}\ln|ax+b| + C$$

G3 Exponential of a linear term

$$\int e^{ax+b}\,dx = \frac{1}{a}e^{ax+b} + C$$

G4 Sine and cosine of a linear term

$$\begin{gathered} \int \sin(ax+b)\,dx = -\frac{1}{a}\cos(ax+b) + C \\ \int \cos(ax+b)\,dx = \frac{1}{a}\sin(ax+b) + C \end{gathered}$$

งานไฟฟ้าใช้บ่อยมาก: $\int \sin\omega t\,dt = -\dfrac{1}{\omega}\cos\omega t + C$

G5 sec² of a linear term

$$\begin{aligned} &\int \sec^2(ax+b)\,dx \\ &= \frac{1}{a}\tan(ax+b) + C \end{aligned}$$

ใช้ได้เฉพาะข้างในเป็นเชิงเส้นเท่านั้น: $\int (x^2+1)^3\,dx \ne \dfrac{(x^2+1)^4}{4\cdot 2x}$ เพราะ $2x$ ไม่ใช่ค่าคงที่ หารออกไม่ได้ ข้อนี้ต้องกระจายกำลังสามแล้วอินทิเกรตทีละพจน์

## รูปแบบที่โจทย์มักซ่อนไว้: f(x) คู่กับ f′(x)

หลังคุ้นกับสูตรพื้นฐานแล้ว ให้ฝึกมองโจทย์เป็น “ก้อน” ถ้าก้อนหนึ่งคือ $f(x)$ และมีอนุพันธ์ $f'(x)$ คูณอยู่ด้วย จะอินทิเกรตได้ทันทีตามตารางนี้ (ทุกสูตรคือการเปลี่ยนตัวแปร $u = f(x)$ ที่ทำเสร็จแล้ว)

H1 Generalized power rule ก้อนยกกำลัง

$$\int [f(x)]^n f'(x)\,dx = \frac{[f(x)]^{n+1}}{n+1} + C$$

H2 Logarithmic form ตัวเศษคืออนุพันธ์ของตัวส่วน

$$\int \frac{f'(x)}{f(x)}\,dx = \ln|f(x)| + C$$

H3 Exponential form

$$\int e^{f(x)} f'(x)\,dx = e^{f(x)} + C$$

H4 Square-root form

$$\int \frac{f'(x)}{\sqrt{f(x)}}\,dx = 2\sqrt{f(x)} + C$$

H5 Trigonometric forms

$$\begin{gathered} \int \cos(f)\,f'\,dx = \sin f + C \\ \int \sin(f)\,f'\,dx = -\cos f + C \end{gathered}$$

H6 Inverse-trig forms

$$\begin{gathered} \int \frac{f'}{1+f^2}\,dx = \arctan f + C \\ \int \frac{f'}{\sqrt{1-f^2}}\,dx = \arcsin f + C \end{gathered}$$

### ตารางมองโจทย์: เห็นแบบนี้ ให้ u เป็นอะไร

| โจทย์หน้าตาแบบนี้ | ให้ u = | เพราะเจอ du นี้ข้างนอก | รูปที่ได้ |

| $\int x(x^2+1)^4\,dx$ | $x^2+1$ | $du = 2x\,dx$ | H1 |

| $\int \dfrac{2x+3}{x^2+3x-1}\,dx$ | $x^2+3x-1$ | $du = (2x+3)\,dx$ | H2 |

| $\int x^2 e^{x^3}\,dx$ | $x^3$ | $du = 3x^2\,dx$ | H3 |

| $\int \sin^4 x\cos x\,dx$ | $\sin x$ | $du = \cos x\,dx$ | H1 |

| $\int \dfrac{(\ln x)^2}{x}\,dx$ | $\ln x$ | $du = \dfrac{1}{x}\,dx$ | H1 |

| $\int \dfrac{e^x}{1+e^{2x}}\,dx$ | $e^x$ | $du = e^x\,dx$ | H6 |

| $\int \tan x\,dx = \int \dfrac{\sin x}{\cos x}\,dx$ | $\cos x$ | $du = -\sin x\,dx$ | H2 |

## สูตรสำเร็จ (Standard Integrals)

สูตรที่พิสูจน์ครั้งเดียวแล้วใช้ซ้ำได้ตลอด ตรวจทุกสูตรด้วยการหาอนุพันธ์กลับแล้ว ให้ $a \gt 0$

S1 Sum of squares ผลบวกกำลังสอง

$$\int \frac{dx}{x^2+a^2} = \frac{1}{a}\arctan\frac{x}{a} + C$$

S2 Difference of squares ผลต่างกำลังสอง

$$\int \frac{dx}{x^2-a^2} = \frac{1}{2a}\ln\left|\frac{x-a}{x+a}\right| + C$$

S3 a² − x² in the denominator

$$\int \frac{dx}{a^2-x^2} = \frac{1}{2a}\ln\left|\frac{a+x}{a-x}\right| + C$$

S4 Inverse sine, scaled

$$\int \frac{dx}{\sqrt{a^2-x^2}} = \arcsin\frac{x}{a} + C$$

S5 Inverse hyperbolic forms

$$\int \frac{dx}{\sqrt{x^2 \pm a^2}} = \ln\left|x + \sqrt{x^2 \pm a^2}\right| + C$$

S6 Square root of a² − x² (พื้นที่ส่วนของวงกลม)

$$\begin{aligned} &\int \sqrt{a^2-x^2}\,dx \\ &= \frac{x}{2}\sqrt{a^2-x^2} + \frac{a^2}{2}\arcsin\frac{x}{a} + C \end{aligned}$$

S7 Square root of x² + a²

$$\begin{aligned} &\int \sqrt{x^2+a^2}\,dx \\ &= \frac{x}{2}\sqrt{x^2+a^2} + \frac{a^2}{2}\ln\left|x + \sqrt{x^2+a^2}\right| + C \end{aligned}$$

S8 x·e^(ax)

$$\int x e^{ax}\,dx = \frac{e^{ax}}{a^2}(ax - 1) + C$$

S9 Natural logarithm

$$\int \ln x\,dx = x\ln x - x + C$$

S10 xⁿ·ln x

$$\begin{gathered} \int x^n\ln x\,dx = \frac{x^{n+1}}{n+1}\left(\ln x - \frac{1}{n+1}\right) + C \\ n \ne -1 \end{gathered}$$

S11 Exponential times sine / cosine (คลื่นหน่วง damped oscillation)

$$\begin{gathered} \int e^{ax}\sin bx\,dx = \frac{e^{ax}}{a^2+b^2}(a\sin bx - b\cos bx) + C \\ \int e^{ax}\cos bx\,dx = \frac{e^{ax}}{a^2+b^2}(a\cos bx + b\sin bx) + C \end{gathered}$$

S12 sin² and cos² (จากสูตรลดกำลัง)

$$\begin{gathered} \int \sin^2 x\,dx = \frac{x}{2} - \frac{\sin 2x}{4} + C \\ \int \cos^2 x\,dx = \frac{x}{2} + \frac{\sin 2x}{4} + C \end{gathered}$$

S13 tan² (ใช้ $\tan^2 x = \sec^2 x - 1$)

$$\int \tan^2 x\,dx = \tan x - x + C$$

S14 Reduction formulas สูตรลดทอนกำลัง

$$\begin{gathered} \int \sin^n x\,dx = -\frac{\sin^{n-1}x\cos x}{n} + \frac{n-1}{n}\int \sin^{n-2}x\,dx \\ \int \cos^n x\,dx = \frac{\cos^{n-1}x\sin x}{n} + \frac{n-1}{n}\int \cos^{n-2}x\,dx \\ \int x^n e^{ax}\,dx = \frac{x^n e^{ax}}{a} - \frac{n}{a}\int x^{n-1}e^{ax}\,dx \end{gathered}$$

## เลือกวิธีอินทิเกรตอย่างไร (Strategy)

- จัดรูปก่อน กระจายวงเล็บ แยกเศษส่วนทีละพจน์ ตัดตัวร่วม เปลี่ยนรากเป็นเลขชี้กำลัง ดูตัวอย่าง

- ตรงสูตรหรือไม่ เทียบกับ F, G, S สูตรพื้นฐาน

- มีก้อน f(x) กับ f′(x) ไหม ถ้ามี เปลี่ยนตัวแปร u ดูวิธี

- เป็นเศษส่วนพหุนาม ดีกรีบน ≥ ดีกรีล่าง → หารยาว · ดีกรีบน < ดีกรีล่าง → แยกเศษส่วนย่อย

- เป็นผลคูณของฟังก์ชันต่างชนิด เช่น $x e^x$, $x\cos x$, $\ln x$ → อินทิเกรตทีละส่วน

## การเปลี่ยนตัวแปร u (Integration by Substitution)

การเปลี่ยนตัวแปรคือกฎลูกโซ่ (chain rule) ที่ทำย้อนกลับ เวลาหาอนุพันธ์ของฟังก์ชันซ้อน เราได้ “อนุพันธ์ข้างนอก × อนุพันธ์ข้างใน” ดังนั้นถ้าเห็นตัวถูกอินทิเกรตที่มี “ฟังก์ชันของก้อนข้างใน × อนุพันธ์ของก้อนข้างใน” ก็ย้อนกลับได้

T1 Substitution rule สูตรการเปลี่ยนตัวแปร

$$\begin{gathered} \int f\big({g(x)}\big)\,{g'(x)\,dx} = \int f({u})\,{du} \\ {u = g(x)} \\ {du = g'(x)\,dx} \end{gathered}$$

ก้อนข้างใน$\displaystyle\int x\,(\underbrace{{x^2+1}}_{u})^4\,dx$เลือกก้อนที่ “ถ้าหาอนุพันธ์แล้ว ได้ของที่เหลืออยู่ข้างนอก”

อนุพันธ์ของก้อน${du} = \dfrac{d}{dx}(x^2+1)\,dx = {2x\,dx}$ข้างนอกมี $x\,dx$ อยู่แล้ว ขาดแค่ 2 ซึ่งเป็นค่าคงที่ ปรับได้

หลังแทน$\displaystyle\frac{1}{2}\int {u}^4\,{du}$x หายหมด เหลือแต่ u แปลว่าเลือกถูก

### ห้าขั้นตอนที่ใช้ทุกข้อ

- เลือก u เป็นก้อนข้างใน (ในวงเล็บที่ยกกำลัง ใต้ราก ในเลขชี้กำลัง หรือตัวส่วน)

- หา du = (อนุพันธ์ของ u) × dx แล้วจัดให้ตรงกับของที่อยู่ข้างนอก

- แทนให้หมด ทุก x และ dx ต้องหายไป ถ้ายังเหลือ x ให้แสดง x เป็นฟังก์ชันของ u หรือเลือก u ใหม่

- อินทิเกรตในตัวแปร u ด้วยสูตรพื้นฐาน

- แทนกลับ u = ก้อนเดิม แล้วบวก C

ปรับได้เฉพาะค่าคงที่: ถ้า du ขาดตัวคูณที่เป็นตัวเลข (เช่น ต้องการ $2x\,dx$ แต่มีแค่ $x\,dx$) ให้คูณและหารด้วยตัวเลขนั้น แต่ถ้าขาด x หรือฟังก์ชันอื่น ห้ามเติมเอง

ตัวอย่าง U1 · พจน์เชิงเส้นยกกำลัง

### หา $\displaystyle\int (3x+2)^5\,dx$

- ก้อนข้างในคือ $3x+2$ ให้เป็น u แล้วหา du

$${u = 3x+2} \;\Rightarrow\; {du = 3\,dx} \;\Rightarrow\; {dx = \tfrac{1}{3}\,du}$$

- แทนค่าทั้ง u และ dx แล้วดึง $\tfrac13$ ออก P1 Constant multiple

$$\begin{aligned} \int ({3x+2})^5\,{dx} &= \int {u}^5\cdot{\tfrac{1}{3}\,du} \\ &= {\frac{1}{3}}\int u^5\,du \end{aligned}$$

- อินทิเกรตด้วยกฎยกกำลัง F2 Power rule

$$\frac{1}{3}\cdot{\frac{u^6}{6}} + C = \frac{u^6}{18} + C$$

- แทนกลับ $u = 3x+2$

$$\frac{(3x+2)^6}{18} + C$$

$\displaystyle\int (3x+2)^5\,dx = \frac{(3x+2)^6}{18} + C$ ตรงกับสูตร G1 ที่ a = 3, n = 5

ตรวจคำตอบ: $\dfrac{d}{dx}\dfrac{(3x+2)^6}{18} = \dfrac{6(3x+2)^5\cdot 3}{18} = (3x+2)^5$ ✓

ตัวอย่าง U2 · พหุนามยกกำลัง

### หา $\displaystyle\int x(x^2+1)^4\,dx$

- ถ้ากระจาย $(x^2+1)^4$ จะยาวมาก ให้มองก้อน $x^2+1$ ซึ่งอนุพันธ์คือ $2x$ และมี x อยู่ข้างนอกพอดี

$$\begin{gathered} {u = x^2+1} \\ \Rightarrow {du = 2x\,dx} \\ \Rightarrow {x\,dx = \tfrac{1}{2}\,du} \end{gathered}$$

- แทนค่า สังเกตว่า x กับ dx หายไปพร้อมกัน P1

$$\begin{aligned} \int ({x^2+1})^4\,{x\,dx} &= \int {u}^4\cdot{\tfrac{1}{2}\,du} \\ &= \frac{1}{2}\int u^4\,du \end{aligned}$$

- กฎยกกำลัง F2 แล้วแทนกลับ

$$\frac{1}{2}\cdot{\frac{u^5}{5}} + C = \frac{(x^2+1)^5}{10} + C$$

$\displaystyle\int x(x^2+1)^4\,dx = \frac{(x^2+1)^5}{10} + C$

ตรวจคำตอบ: $\dfrac{d}{dx}\dfrac{(x^2+1)^5}{10} = \dfrac{5(x^2+1)^4\cdot 2x}{10} = x(x^2+1)^4$ ✓

ตัวอย่าง U3 · du ตรงพอดี

### หา $\displaystyle\int (2x+3)(x^2+3x-1)^3\,dx$

- อนุพันธ์ของ $x^2+3x-1$ คือ $2x+3$ ซึ่งอยู่ข้างนอกครบ ไม่ต้องปรับค่าคงที่

$${u = x^2+3x-1} \;\Rightarrow\; {du = (2x+3)\,dx}$$

- แทนค่าแล้วใช้กฎยกกำลัง F2 (หรือมองเป็นสูตร H1 ได้เลย)

$$\int {u}^3\,{du} = {\frac{u^4}{4}} + C = \frac{(x^2+3x-1)^4}{4} + C$$

$\displaystyle\int (2x+3)(x^2+3x-1)^3\,dx = \frac{(x^2+3x-1)^4}{4} + C$

ตัวอย่าง U4 · ก้อนใต้รากที่สอง

### หา $\displaystyle\int x^2\sqrt{x^3+5}\,dx$

- เขียนรากเป็นเลขชี้กำลัง $\sqrt{\ } = (\ )^{1/2}$ แล้วเลือกก้อนใต้ราก

$$\begin{gathered} {u = x^3+5} \\ \Rightarrow {du = 3x^2\,dx} \\ \Rightarrow {x^2\,dx = \tfrac{1}{3}\,du} \end{gathered}$$

- แทนค่า P1

$$\int ({x^3+5})^{1/2}\,{x^2\,dx} = \frac{1}{3}\int u^{1/2}\,du$$

- กฎยกกำลังกับเลขชี้กำลังเศษส่วน: $\tfrac12 + 1 = \tfrac32$ แล้วหารด้วย $\tfrac32$ คือคูณ $\tfrac23$ F2

$$\begin{aligned} \frac{1}{3}\cdot{\frac{u^{3/2}}{3/2}} + C &= \frac{1}{3}\cdot\frac{2}{3}u^{3/2} + C \\ &= \frac{2}{9}(x^3+5)^{3/2} + C \end{aligned}$$

$\displaystyle\int x^2\sqrt{x^3+5}\,dx = \frac{2}{9}(x^3+5)^{3/2} + C$

ตัวอย่าง U5 · ก้อนอยู่ที่ตัวส่วน (เลขชี้กำลังติดลบ)

### หา $\displaystyle\int \frac{6x}{(x^2+4)^3}\,dx$

- ย้ายตัวส่วนขึ้นมาเป็นเลขชี้กำลังลบ แล้วเลือก u

$$\begin{gathered} \int 6x\,(x^2+4)^{-3}\,dx \\ {u = x^2+4},\ {du = 2x\,dx} \;\Rightarrow\; {6x\,dx = 3\,du} \end{gathered}$$

- แทนค่า แล้วใช้กฎยกกำลังที่ n = −3: บวกหนึ่งได้ −2 F2

$$3\int u^{-3}\,du = 3\cdot{\frac{u^{-2}}{-2}} + C = -\frac{3}{2u^2} + C$$

- แทนกลับ

$$-\frac{3}{2(x^2+4)^2} + C$$

$\displaystyle\int \frac{6x}{(x^2+4)^3}\,dx = -\frac{3}{2(x^2+4)^2} + C$

ตัวอย่าง U6 · ก้อนอยู่ในเลขชี้กำลัง

### หา $\displaystyle\int 2x\,e^{x^2}\,dx$

- ก้อนในเลขชี้กำลังคือ $x^2$ อนุพันธ์ $2x$ อยู่ข้างนอกแล้ว

$${u = x^2},\quad {du = 2x\,dx}$$

- แทนค่า F4 Exponential (หรือสูตร H3)

$$\int e^{{u}}\,{du} = {e^u} + C = e^{x^2} + C$$

$\displaystyle\int 2x\,e^{x^2}\,dx = e^{x^2} + C$

ตัวอย่าง U7 · ตัวเศษคืออนุพันธ์ของตัวส่วน

### หา $\displaystyle\int \frac{3x^2+2}{x^3+2x}\,dx$

- อนุพันธ์ของตัวส่วน $x^3+2x$ คือ $3x^2+2$ ซึ่งเป็นตัวเศษพอดี

$${u = x^3+2x},\quad {du = (3x^2+2)\,dx}$$

- แทนค่า F3 Reciprocal (สูตร H2)

$$\int \frac{{du}}{{u}} = {\ln|u|} + C = \ln|x^3+2x| + C$$

$\displaystyle\int \frac{3x^2+2}{x^3+2x}\,dx = \ln|x^3+2x| + C$

ตัวอย่าง U8 · ฟังก์ชันตรีโกณยกกำลัง

### หา $\displaystyle\int \sin^4 x\cos x\,dx$

- $\sin^4 x$ คือ $(\sin x)^4$ ก้อนข้างในคือ $\sin x$ และอนุพันธ์ $\cos x$ อยู่ข้างนอก

$${u = \sin x},\quad {du = \cos x\,dx}$$

- แทนค่าแล้วใช้กฎยกกำลัง F2

$$\int {u}^4\,{du} = {\frac{u^5}{5}} + C = \frac{\sin^5 x}{5} + C$$

$\displaystyle\int \sin^4 x\cos x\,dx = \frac{\sin^5 x}{5} + C$

ตัวอย่าง U9 · แทนแล้วยังเหลือ x (ระดับกลาง)

### หา $\displaystyle\int x\sqrt{x+1}\,dx$

- เลือกก้อนใต้ราก $u = x+1$ จะได้ $du = dx$ แต่ยังเหลือ x ข้างหน้า ให้แสดง x ในรูป u จาก $u = x+1$

$${u = x+1} \;\Rightarrow\; {x = u-1},\quad {dx = du}$$

- แทนให้หมด แล้วกระจาย P2 Sum rule

$$\int ({u-1})\,{u}^{1/2}\,{du} = \int \left(u^{3/2} - u^{1/2}\right)du$$

- กฎยกกำลังทีละพจน์ F2

$${\frac{u^{5/2}}{5/2}} - {\frac{u^{3/2}}{3/2}} + C = \frac{2}{5}u^{5/2} - \frac{2}{3}u^{3/2} + C$$

- แทนกลับ $u = x+1$

$$\frac{2}{5}(x+1)^{5/2} - \frac{2}{3}(x+1)^{3/2} + C$$

$\displaystyle\int x\sqrt{x+1}\,dx = \frac{2}{5}(x+1)^{5/2} - \frac{2}{3}(x+1)^{3/2} + C$

ตัวอย่าง U10 · ก้อนเป็นลอการิทึม

### หา $\displaystyle\int \frac{(\ln x)^2}{x}\,dx$

- มองให้เห็นว่า $\dfrac{1}{x}\,dx$ คืออนุพันธ์ของ $\ln x$

$${u = \ln x},\quad {du = \tfrac{1}{x}\,dx}$$

- แทนค่าแล้วใช้กฎยกกำลัง F2

$$\int {u}^2\,{du} = {\frac{u^3}{3}} + C = \frac{(\ln x)^3}{3} + C$$

$\displaystyle\int \frac{(\ln x)^2}{x}\,dx = \frac{(\ln x)^3}{3} + C$

## จัดรูปและตัดเศษส่วนก่อนอินทิเกรต

หลายข้อดูยาก แต่พอตัดตัวร่วมหรือแยกทีละพจน์แล้วเหลือแค่กฎยกกำลัง เส้นสีแดงคือส่วนที่ตัดกัน ตัวเลขสีแดงเหนือเส้นคือค่าที่เหลือหลังตัด (ทดไว้)

ตัวอย่าง A1 · หารทีละพจน์แล้วตัด

### หา $\displaystyle\int \frac{6x^5 - 9x^3 + 3x}{3x}\,dx$

- ตัวส่วนเป็นพจน์เดียว ให้แยกหารทีละพจน์

$$\frac{6x^5 - 9x^3 + 3x}{3x} = \frac{6x^5}{3x} - \frac{9x^3}{3x} + \frac{3x}{3x}$$

- ตัดตัวเลขและ x ทีละพจน์: 6 ÷ 3 เหลือ 2 (ทดไว้), $x^5 = x^4\cdot x$ ตัด x ได้หนึ่งตัว

$$\frac{\cancel{6}\,x^4\,\cancel{x}}{\cancel{3}\,\cancel{x}} - \frac{\cancel{9}\,x^2\,\cancel{x}}{\cancel{3}\,\cancel{x}} + \frac{\cancel{3}\,\cancel{x}}{\cancel{3}\,\cancel{x}} = 2x^4 - 3x^2 + 1$$

- อินทิเกรตทีละพจน์ P2 F2 F1

$$\begin{aligned} &\int (2x^4 - 3x^2 + 1)\,dx \\ &= 2\cdot{\frac{x^5}{5}} - 3\cdot{\frac{x^3}{3}} + {x} + C \\ &= \frac{2}{5}x^5 - x^3 + x + C\end{aligned}$$

$\displaystyle\int \frac{6x^5 - 9x^3 + 3x}{3x}\,dx = \frac{2}{5}x^5 - x^3 + x + C$

ตัวอย่าง A2 · แยกตัวประกอบแล้วตัด

### หา $\displaystyle\int \frac{x^3 - 1}{x - 1}\,dx$

- แยกตัวประกอบผลต่างกำลังสาม $a^3 - b^3 = (a-b)(a^2+ab+b^2)$

$$x^3 - 1 = (x-1)(x^2+x+1)$$

- ตัด $(x-1)$ บนและล่าง (ใช้ได้เมื่อ $x \ne 1$)

$$\frac{\cancel{(x-1)}\,(x^2+x+1)}{\cancel{(x-1)}} = x^2 + x + 1$$

- อินทิเกรตทีละพจน์ P2 F2

$$\int (x^2 + x + 1)\,dx = {\frac{x^3}{3}} + {\frac{x^2}{2}} + {x} + C$$

$\displaystyle\int \frac{x^3 - 1}{x - 1}\,dx = \frac{x^3}{3} + \frac{x^2}{2} + x + C$

ตัวอย่าง A3 · กระจายแล้วเปลี่ยนเป็นเลขชี้กำลัง

### หา $\displaystyle\int \frac{(\sqrt{x}+1)^2}{x}\,dx$

- กระจายกำลังสองด้วย $(a+b)^2 = a^2 + 2ab + b^2$

$$(\sqrt{x}+1)^2 = x + 2\sqrt{x} + 1$$

- หารทีละพจน์ แล้วตัด: $\dfrac{x}{x} = 1$ และ $\dfrac{\sqrt{x}}{x} = \dfrac{x^{1/2}}{x^1} = x^{-1/2}$

$$\frac{\cancel{x}}{\cancel{x}} + \frac{2x^{1/2}}{x} + \frac{1}{x} = 1 + 2x^{-1/2} + \frac{1}{x}$$

- อินทิเกรตทีละพจน์ F1 F2 F3

$$\begin{aligned} &{x} + 2\cdot{\frac{x^{1/2}}{1/2}} + {\ln|x|} + C \\ &= x + 4\sqrt{x} + \ln|x| + C \end{aligned}$$

$\displaystyle\int \frac{(\sqrt{x}+1)^2}{x}\,dx = x + 4\sqrt{x} + \ln|x| + C$

## เศษส่วนพหุนามที่ต้องหารยาว (Polynomial Long Division)

เมื่อดีกรีของตัวเศษ ≥ ดีกรีของตัวส่วน (improper rational function) ให้หารยาวก่อน จะได้ผลหารซึ่งเป็นพหุนาม บวกกับเศษส่วนที่ตัวเศษดีกรีต่ำกว่า

T2 Division algorithm ผลการหารยาว

$$\frac{N(x)}{D(x)} = \underbrace{Q(x)}_{\text{ผลหาร}} + \frac{\overbrace{R(x)}^{\text{เศษ}}}{D(x)}, \qquad \deg R \lt \deg D$$

วิธีหารยาวเหมือนหารเลขยาวในชั้นประถม: (1) เอาพจน์หน้าสุดของตัวตั้งหารด้วยพจน์หน้าสุดของตัวหาร (2) คูณกลับ (3) ลบ พจน์หน้าจะตัดกันเป็นศูนย์ (เส้นแดง) (4) ทดพจน์ถัดไปลงมา แล้ววนจนดีกรีของเศษต่ำกว่าตัวหาร

ตัวอย่าง D1 · หารด้วยพจน์เชิงเส้น

### หา $\displaystyle\int \frac{x^2 + 3x + 5}{x + 1}\,dx$

- ดีกรีบน 2 ≥ ดีกรีล่าง 1 จึงหารยาว

ผลหาร →$x$$+\,2$
$x+1$$x^2$$+\,3x$$+\,5$
$x(x+1)$$-(x^2$$+\,x)$
$2x$$+\,5$↓ ทด
$2(x+1)$$-(2x$$+\,2)$
$3$เศษ

- $x^2 \div x = \color{#2a78d6}{x}$ คูณกลับ $x(x+1) = x^2 + x$ ลบออก $x^2$ ตัดกัน เหลือ $3x - x = 2x$ แล้วทด $+5$ ลงมา

- $2x \div x = \color{#2a78d6}{2}$ คูณกลับ $2(x+1) = 2x + 2$ ลบออก $2x$ ตัดกัน เหลือ $5 - 2 = 3$

- เศษ 3 มีดีกรี 0 ต่ำกว่าตัวหาร จึงหยุด

- เขียนผลตามรูป ผลหาร + เศษ/ตัวหาร T2

$$\frac{x^2 + 3x + 5}{x + 1} = x + 2 + \frac{3}{x+1}$$

- อินทิเกรตทีละพจน์ P2 F2 F1 G2

$$\begin{aligned} &\int \left(x + 2 + \frac{3}{x+1}\right)dx \\ &= {\frac{x^2}{2}} + {2x} + 3{\ln|x+1|} + C \end{aligned}$$

$\displaystyle\int \frac{x^2 + 3x + 5}{x + 1}\,dx = \frac{x^2}{2} + 2x + 3\ln|x+1| + C$

ตรวจการหาร: $(x+1)(x+2) + 3 = x^2 + 3x + 2 + 3 = x^2 + 3x + 5$ ✓

ตัวอย่าง D2 · ตัวหารกำลังสอง (เติม 0x ให้ครบ)

### หา $\displaystyle\int \frac{2x^3 + 3x^2 - x + 1}{x^2 + 1}\,dx$

- ตัวหาร $x^2 + 1$ ไม่มีพจน์ x ให้เขียนเป็น $x^2 + 0x + 1$ เพื่อให้คอลัมน์ตรงกัน แล้วหารยาว

ผลหาร →$2x$$+\,3$
$x^2+0x+1$$2x^3$$+\,3x^2$$-\,x$$+\,1$
$2x(\cdots)$$-(2x^3$$+\,0x^2$$+\,2x)$
$3x^2$$-\,3x$$+\,1$↓ ทด
$3(\cdots)$$-(3x^2$$+\,0x$$+\,3)$
$-\,3x$$-\,2$เศษ

- $2x^3 \div x^2 = \color{#2a78d6}{2x}$ คูณกลับได้ $2x^3 + 0x^2 + 2x$ ลบออก: $2x^3$ ตัดกัน, $3x^2 - 0 = 3x^2$, $-x - 2x = -3x$ แล้วทด $+1$

- $3x^2 \div x^2 = \color{#2a78d6}{3}$ คูณกลับได้ $3x^2 + 0x + 3$ ลบออก: $3x^2$ ตัดกัน, $-3x - 0 = -3x$, $1 - 3 = -2$

- เศษ $-3x - 2$ ดีกรี 1 ต่ำกว่าตัวหารดีกรี 2 จึงหยุด

- เขียนผล แล้วแยกเศษส่วนที่เหลือเป็นสองพจน์ T2

$$\begin{aligned} &\frac{2x^3 + 3x^2 - x + 1}{x^2 + 1} \\ &= 2x + 3 - \frac{3x}{x^2+1} - \frac{2}{x^2+1} \end{aligned}$$

- พจน์ $\dfrac{3x}{x^2+1}$ ใช้ u = $x^2+1$ ($du = 2x\,dx$) ได้รูป ln H2 ส่วน $\dfrac{2}{x^2+1}$ ได้ arctan F11

$$\begin{gathered} \begin{aligned} \int \frac{3x}{x^2+1}\,dx &= \frac{3}{2}\int\frac{{du}}{{u}} \\ &= \frac{3}{2}{\ln(x^2+1)} \end{aligned} \\ \int \frac{2}{x^2+1}\,dx = 2{\arctan x} \end{gathered}$$

- รวมทุกพจน์ P2

$$\begin{aligned} &\int \left(2x + 3 - \frac{3x}{x^2+1} - \frac{2}{x^2+1}\right)dx \\ &= x^2 + 3x - \frac{3}{2}\ln(x^2+1) - 2\arctan x + C \end{aligned}$$

$\displaystyle\int \frac{2x^3 + 3x^2 - x + 1}{x^2 + 1}\,dx = x^2 + 3x - \frac{3}{2}\ln(x^2+1) - 2\arctan x + C$

ไม่ต้องใส่ค่าสัมบูรณ์ใน $\ln(x^2+1)$ เพราะ $x^2 + 1 \gt 0$ เสมอ

## แยกเศษส่วนย่อย (Partial Fraction Decomposition)

ใช้เมื่อดีกรีตัวเศษต่ำกว่าตัวส่วน และตัวส่วนแยกตัวประกอบได้ แยกเป็นเศษส่วนเล็ก ๆ ที่อินทิเกรตได้ด้วย ln หรือ arctan วิธีเดียวกันนี้ใช้หาอินเวอร์สลาปลาซในบทการแปลงลาปลาซ

| ตัวประกอบในตัวส่วน | ชื่อ | เขียนแยกเป็น |

| $(x-a)(x-b)$ | Distinct linear factors | $\dfrac{A}{x-a} + \dfrac{B}{x-b}$ |

| $(x-a)^2$ | Repeated linear factor | $\dfrac{A}{x-a} + \dfrac{B}{(x-a)^2}$ |

| $x^2 + px + q$ (แยกไม่ได้) | Irreducible quadratic | $\dfrac{Ax + B}{x^2 + px + q}$ |

ตัวอย่าง P1 · ตัวประกอบเชิงเส้นต่างกัน

### หา $\displaystyle\int \frac{5x+1}{(x-1)(x+2)}\,dx$

- ตั้งรูปแยก แล้วคูณตลอดด้วยตัวส่วน $(x-1)(x+2)$

$$\begin{aligned} &\frac{5x+1}{(x-1)(x+2)} \\ &= \frac{A}{x-1} + \frac{B}{x+2} \;\Rightarrow\; 5x + 1 \\ &= A(x+2) + B(x-1)\end{aligned}$$

- แทนค่า x ที่ทำให้วงเล็บหนึ่งเป็นศูนย์ (วิธีปิดตัวประกอบ cover-up method)

$$\begin{aligned} x = 1 &: \quad 6 = A(3) + B\cdot\cancel{0} \;\Rightarrow\; A = 2 \\ x = -2 &: \quad -9 = A\cdot\cancel{0} + B(-3) \;\Rightarrow\; B = 3 \end{aligned}$$

- อินทิเกรตทีละพจน์ P2 G2

$$\begin{aligned} &\int \left(\frac{2}{x-1} + \frac{3}{x+2}\right)dx \\ &= 2{\ln|x-1|} + 3{\ln|x+2|} + C \end{aligned}$$

$\displaystyle\int \frac{5x+1}{(x-1)(x+2)}\,dx = 2\ln|x-1| + 3\ln|x+2| + C$

ตัวอย่าง P2 · ตัวประกอบซ้ำ

### หา $\displaystyle\int \frac{x+3}{(x+1)^2}\,dx$

- ตั้งรูปแยกสำหรับตัวประกอบซ้ำ แล้วคูณตลอดด้วย $(x+1)^2$

$$\begin{aligned} \frac{x+3}{(x+1)^2} &= \frac{A}{x+1} + \frac{B}{(x+1)^2} \;\Rightarrow\; x + 3 \\ &= A(x+1) + B \end{aligned}$$

- เทียบสัมประสิทธิ์: พจน์ x ได้ $A = 1$ พจน์คงที่ได้ $A + B = 3$ จึง $B = 2$

$$\frac{x+3}{(x+1)^2} = \frac{1}{x+1} + \frac{2}{(x+1)^2}$$

- พจน์แรกได้ ln G2 พจน์ที่สองเป็นกำลัง −2 G1

$$\begin{aligned} &{\ln|x+1|} + 2\cdot{\frac{(x+1)^{-1}}{-1}} + C \\ &= \ln|x+1| - \frac{2}{x+1} + C \end{aligned}$$

$\displaystyle\int \frac{x+3}{(x+1)^2}\,dx = \ln|x+1| - \frac{2}{x+1} + C$

## อินทิเกรตทีละส่วน (Integration by Parts)

มาจากกฎผลคูณของอนุพันธ์ $(uv)' = u'v + uv'$ อินทิเกรตทั้งสองข้างแล้วจัดใหม่ ใช้กับผลคูณของฟังก์ชันต่างชนิด เช่น พหุนามคูณเอกซ์โพเนนเชียล

T3 Integration by parts อินทิเกรตทีละส่วน

$$\int u\,dv = uv - \int v\,du$$

T4 LIATE rule ลำดับเลือก u (ตัวที่มาก่อนเป็น u)

LLogarithmic
ln xIInverse trig
arctan xAAlgebraic
x², xTTrigonometric
sin xEExponential
eˣ

u ควรเป็นตัวที่หาอนุพันธ์แล้วง่ายขึ้น dv ควรเป็นตัวที่อินทิเกรตได้

ตัวอย่าง B1 · พหุนามคูณเอกซ์โพเนนเชียล

### หา $\displaystyle\int x e^x\,dx$

- ตาม LIATE: x (Algebraic) มาก่อน eˣ (Exponential) T4

$$\begin{gathered} u = x \\ \Rightarrow du = dx \\ dv = e^x\,dx \\ \Rightarrow v = e^x \end{gathered}$$

- แทนในสูตร T3

$$\int x e^x\,dx = {x e^x - \int e^x\,dx} = x e^x - e^x + C$$

$\displaystyle\int x e^x\,dx = e^x(x - 1) + C$ ตรงกับ S8 ที่ a = 1

ตัวอย่าง B2 · พหุนามคูณตรีโกณ

### หา $\displaystyle\int x\cos x\,dx$

- $u = x$ (A มาก่อน T)

$$\begin{gathered} u = x \\ \Rightarrow du = dx \\ dv = \cos x\,dx \\ \Rightarrow v = \sin x \end{gathered}$$

- แทนในสูตร T3 แล้วใช้ F6

$$\begin{aligned} &x\sin x - \int \sin x\,dx \\ &= x\sin x - ({-\cos x}) + C \\ &= x\sin x + \cos x + C\end{aligned}$$

$\displaystyle\int x\cos x\,dx = x\sin x + \cos x + C$

ตัวอย่าง B3 · ln x ตัวเดียว

### หา $\displaystyle\int \ln x\,dx$

- มองเป็น $\ln x \cdot 1$ ให้ u = ln x (L มาก่อนทุกตัว)

$$\begin{gathered} u = \ln x \\ \Rightarrow du = \frac{1}{x}\,dx \\ dv = dx \\ \Rightarrow v = x \end{gathered}$$

- แทนในสูตร T3 สังเกตการตัด x

$$\begin{aligned} x\ln x - \int \cancel{x}\cdot\frac{1}{\cancel{x}}\,dx &= x\ln x - \int 1\,dx \\ &= x\ln x - x + C \end{aligned}$$

$\displaystyle\int \ln x\,dx = x\ln x - x + C$

ตัวอย่าง B4 · ทำสองรอบด้วยวิธีตาราง (tabular / DI method)

### หา $\displaystyle\int x^2 e^x\,dx$

- คอลัมน์ D หาอนุพันธ์ของ $x^2$ จนเป็นศูนย์ คอลัมน์ I อินทิเกรต $e^x$ ไปพร้อมกัน เครื่องหมายสลับ + − +

| เครื่องหมาย | D (อนุพันธ์) | I (อินทิกรัล) |

| + | $x^2$ | $e^x$ |
| − | $2x$ | $e^x$ |
| + | $2$ | $e^x$ |
| | $0$ | $e^x$ |

- คูณทแยงลงตามเครื่องหมาย

$$+x^2 e^x - 2x e^x + 2e^x + C$$

$\displaystyle\int x^2 e^x\,dx = e^x(x^2 - 2x + 2) + C$

## อินทิกรัลตรีโกณมิติ (Trigonometric Integrals)

กำลังคู่ใช้สูตรลดกำลัง กำลังคี่แยกออกหนึ่งตัวแล้วเปลี่ยนตัวแปร สูตรตรีโกณทั้งหมดดูได้ที่หน้าสูตรตรีโกณมิติ · อินทิกรัลแบบ $\int t\cos at\,dt$ และผลคูณไซน์ตลอดคาบเป็นเครื่องมือหลักของการหาสัมประสิทธิ์ฟูเรียร์

ตัวอย่าง T1 · กำลังคี่

### หา $\displaystyle\int \sin^3 x\,dx$

- แยก $\sin x$ ออกหนึ่งตัว แล้วใช้ $\sin^2 x = 1 - \cos^2 x$ เอกลักษณ์พีทาโกรัส

$$\int \sin^2 x\,\sin x\,dx = \int (1 - \cos^2 x)\sin x\,dx$$

- ให้ $u = \cos x$ จะได้ $du = -\sin x\,dx$ หรือ $\sin x\,dx = -du$

$$\begin{aligned} \int (1 - {u}^2)({-du}) &= -\int (1 - u^2)\,du \\ &= -u + \frac{u^3}{3} + C \end{aligned}$$

$\displaystyle\int \sin^3 x\,dx = -\cos x + \frac{\cos^3 x}{3} + C$

### การแทนค่าด้วยตรีโกณ (Trigonometric Substitution)

| ถ้าเจอ | ให้ | เพราะ |

| $\sqrt{a^2 - x^2}$ | $x = a\sin\theta$ | $a^2 - a^2\sin^2\theta = a^2\cos^2\theta$ |

| $\sqrt{a^2 + x^2}$ | $x = a\tan\theta$ | $a^2 + a^2\tan^2\theta = a^2\sec^2\theta$ |

| $\sqrt{x^2 - a^2}$ | $x = a\sec\theta$ | $a^2\sec^2\theta - a^2 = a^2\tan^2\theta$ |

## อินทิกรัลจำกัดเขต (Definite Integral)

อินทิกรัลจำกัดเขตให้ตัวเลข ไม่ใช่ฟังก์ชัน มีความหมายเป็นพื้นที่ใต้กราฟแบบคิดเครื่องหมาย (ส่วนที่อยู่ใต้แกน x นับเป็นลบ) ในงานไฟฟ้าคือ ประจุสะสม $q = \int i\,dt$ พลังงาน $W = \int p\,dt$ และค่าเฉลี่ย

Q0 Riemann-sum definition นิยามด้วยผลบวกรีมันน์

$$\begin{gathered} \begin{aligned} &\int_a^b f(x)\,dx \\ &= \lim_{n\to\infty}\sum_{k=1}^{n} f(x_k^*)\,\Delta x \end{aligned} \\ \Delta x = \frac{b-a}{n} \\ x_k = a + k\,\Delta x \end{gathered}$$

แบ่งช่วง [a, b] เป็น n ช่วงย่อย (partition) กว้างช่วงละ Δx สร้างสี่เหลี่ยมสูง $f(x_k^*)$ แล้วรวมพื้นที่ เมื่อ n → ∞ ผลรวมจะเข้าใกล้พื้นที่จริง

### ลองเอง: ผลบวกรีมันน์เข้าใกล้ค่าจริง
เพิ่มจำนวนสี่เหลี่ยม n แล้วดูว่าผลรวมเข้าใกล้ค่าอินทิกรัลจริงเท่าไร

ฟังก์ชัน
a
b

จำนวนช่วง n8

ตัวอย่าง R1 · หาจากนิยามโดยตรง

### หา $\displaystyle\int_0^1 x^2\,dx$ ด้วยผลบวกรีมันน์ (จุดขวา)

- แบ่ง [0, 1] เป็น n ช่วง หาความกว้างและจุดขวาของช่วงที่ k

$$\Delta x = \frac{1-0}{n} = \frac{1}{n}, \qquad x_k = 0 + k\cdot\frac{1}{n} = \frac{k}{n}$$

- เขียนผลรวมของพื้นที่สี่เหลี่ยม แล้วกระจายตัวที่ไม่ขึ้นกับ k ออกมานอกซิกมา

$$\begin{aligned} \sum_{k=1}^{n} f(x_k)\,\Delta x &= \sum_{k=1}^{n}\left(\frac{k}{n}\right)^2\cdot\frac{1}{n} \\ &= \sum_{k=1}^{n}\frac{k^2}{n^3} \\ &= \frac{1}{n^3}\sum_{k=1}^{n}k^2 \end{aligned}$$

- ใช้สูตรผลบวกกำลังสอง $\sum_{k=1}^{n} k^2 = \dfrac{n(n+1)(2n+1)}{6}$

$$\frac{1}{n^3}\cdot\frac{n(n+1)(2n+1)}{6} = \frac{2n^3 + 3n^2 + n}{6n^3}$$

- หารทุกพจน์ด้วย $n^3$ แล้วตัด

$$\frac{2\cancel{n^3}}{6\cancel{n^3}} + \frac{3\cancel{n^2}}{6\,n\cancel{n^2}} + \frac{\cancel{n}}{6\,n^2\cancel{n}} = \frac{1}{3} + \frac{1}{2n} + \frac{1}{6n^2}$$

- ให้ n → ∞ พจน์ที่มี n ในตัวส่วนเข้าใกล้ 0

$$\lim_{n\to\infty}\left(\frac{1}{3} + \frac{1}{2n} + \frac{1}{6n^2}\right) = \frac{1}{3} + 0 + 0 = \frac{1}{3}$$

$\displaystyle\int_0^1 x^2\,dx = \frac{1}{3}$ ลองตั้ง n ในกล่องด้านบนเป็น 8, 50, 200 จะเห็นผลรวม $\tfrac13 + \tfrac{1}{2n} + \tfrac{1}{6n^2}$ ลดลงเข้าหา 0.3333

ตัวอย่าง R2 · นิยามกับฟังก์ชันเชิงเส้น

### หา $\displaystyle\int_1^3 (2x+1)\,dx$ ด้วยผลบวกรีมันน์

- หา Δx และจุดขวา แล้วแทนลงใน f

$$\begin{gathered} \Delta x = \frac{3-1}{n} = \frac{2}{n} \\ x_k = 1 + \frac{2k}{n} \\ \begin{aligned} f(x_k) &= 2\left(1 + \frac{2k}{n}\right) + 1 \\ &= 3 + \frac{4k}{n} \end{aligned} \end{gathered}$$

- กระจายผลรวมเป็นสองก้อน

$$\begin{aligned} \sum_{k=1}^{n}\left(3 + \frac{4k}{n}\right)\frac{2}{n} &= \frac{6}{n}\sum_{k=1}^{n}1 + \frac{8}{n^2}\sum_{k=1}^{n}k \\ &= \frac{6}{n}\cdot n + \frac{8}{n^2}\cdot\frac{n(n+1)}{2} \end{aligned}$$

- ตัดและจัดรูป

$$\begin{aligned} \frac{6}{\cancel{n}}\cdot\cancel{n} + \frac{\cancel{8}\,\cancel{n}(n+1)}{\cancel{2}\,n\,\cancel{n}} &= 6 + \frac{4(n+1)}{n} \\ &= 10 + \frac{4}{n} \end{aligned}$$

- ให้ n → ∞

$$\lim_{n\to\infty}\left(10 + \frac{4}{n}\right) = 10$$

$\displaystyle\int_1^3 (2x+1)\,dx = 10$ ตรงกับวิธีลัด $[x^2 + x]_1^3 = 12 - 2 = 10$ ในหัวข้อถัดไป

### ทฤษฎีบทหลักมูลของแคลคูลัส (Fundamental Theorem of Calculus)

การหาลิมิตของผลรวมทุกข้อเหนื่อยมาก ทฤษฎีบทนี้บอกว่าไม่ต้องทำ ใช้ปฏิยานุพันธ์แทนค่าขอบบนลบขอบล่างได้เลย

Q1 FTC, part 2 (evaluation theorem) การหาค่าอินทิกรัลจำกัดเขต

$$\begin{gathered} \begin{aligned} \int_a^b f(x)\,dx &= \Big[F(x)\Big]_a^b \\ &= F(b) - F(a) \end{aligned} \\ F'(x) = f(x) \end{gathered}$$

Q2 FTC, part 1 อนุพันธ์ของอินทิกรัลที่ขอบบนเป็นตัวแปร

$$\begin{gathered} \frac{d}{dx}\int_a^{x} f(t)\,dt = f(x) \\ \frac{d}{dx}\int_a^{g(x)} f(t)\,dt = f\big(g(x)\big)\,g'(x) \end{gathered}$$

รูปที่สองเรียกว่ากฎของไลบ์นิซ (Leibniz integral rule) แบบพื้นฐาน

Q3 The constant cancels ทำไมไม่มี C

$$\begin{aligned} \Big[F(x) + {C}\Big]_a^b &= \big(F(b) + \cancel{C}\big) - \big(F(a) + \cancel{C}\big) \\ &= F(b) - F(a) \end{aligned}$$

### คุณสมบัติของอินทิกรัลจำกัดเขต (Properties of Definite Integrals)

Q4 Zero-width interval ขอบบนเท่าขอบล่าง

$$\int_a^a f(x)\,dx = 0$$

Q5 Reversal of limits สลับขอบเขตเปลี่ยนเครื่องหมาย

$$\int_b^a f(x)\,dx = -\int_a^b f(x)\,dx$$

Q6 Linearity ความเป็นเชิงเส้น

$$\int_a^b [k f + g]\,dx = k\int_a^b f\,dx + \int_a^b g\,dx$$

Q7 Additivity over intervals การแบ่งช่วง

$$\int_a^b f\,dx + \int_b^c f\,dx = \int_a^c f\,dx$$

Q8 Comparison property การเปรียบเทียบ

$$\begin{gathered} f(x) \le g(x) \text{ บน } [a,b] \\ \Rightarrow \int_a^b f\,dx \le \int_a^b g\,dx \end{gathered}$$

Q9 Symmetry (even / odd) ฟังก์ชันคู่และคี่

$$\int_{-a}^{a} f\,dx = \begin{cases} 2\int_0^a f\,dx & f \text{ คู่ (even)} \\ 0 & f \text{ คี่ (odd)} \end{cases}$$

Q10 Average value / Mean value theorem for integrals ค่าเฉลี่ยของฟังก์ชัน

$$\begin{gathered} f_{\text{avg}} = \frac{1}{b-a}\int_a^b f(x)\,dx \\ \exists\,c \in [a,b]:\ f(c) = f_{\text{avg}} \end{gathered}$$

Q11 Substitution in a definite integral เปลี่ยนตัวแปรพร้อมเปลี่ยนขอบเขต

$$\int_a^b f\big(g(x)\big)\,g'(x)\,dx = \int_{{g(a)}}^{{g(b)}} f(u)\,du$$

Q12 Integration by parts, definite

$$\int_a^b u\,dv = \Big[uv\Big]_a^b - \int_a^b v\,du$$

ตัวอย่าง E1 · แทนค่าขอบบนขอบล่างอย่างละเอียด

### หา $\displaystyle\int_1^3 (3x^2 - 2x + 1)\,dx$

- หาปฏิยานุพันธ์ทีละพจน์ (ไม่ต้องเขียน C) Q6 F2

$$\int_1^3 (3x^2 - 2x + 1)\,dx = \Big[{x^3} - {x^2} + {x}\Big]_1^3$$

- แทนขอบบน x = 3 ทุกตัว ลบด้วยการแทนขอบล่าง x = 1 ทุกตัว ใส่วงเล็บเสมอ Q1 FTC

$$= \big({3}^3 - {3}^2 + {3}\big) - \big({1}^3 - {1}^2 + {1}\big)$$

- คำนวณในแต่ละวงเล็บ

$$= (27 - 9 + 3) - (1 - 1 + 1) = 21 - 1 = 20$$

- อีกวิธี: กระจายเครื่องหมาย [ ] ไปทีละพจน์ได้ผลเท่ากัน Q6 Linearity

$$\begin{aligned} &\Big[x^3\Big]_1^3 - \Big[x^2\Big]_1^3 + \Big[x\Big]_1^3 \\ &= (27 - 1) - (9 - 1) + (3 - 1) \\ &= 26 - 8 + 2 \\ &= 20\end{aligned}$$

$\displaystyle\int_1^3 (3x^2 - 2x + 1)\,dx = 20$

จุดที่พลาดบ่อย: ลืมวงเล็บก้อนขอบล่าง แล้วลบแค่พจน์แรก ทำให้ได้ $21 - 1 - 1 + 1$ ซึ่งผิด

ตัวอย่าง E2 · ตรีโกณ

### หา $\displaystyle\int_0^{\pi} \sin x\,dx$

- ปฏิยานุพันธ์ของ sin คือ −cos F6

$$\int_0^{\pi}\sin x\,dx = \Big[{-\cos x}\Big]_0^{\pi}$$

- แทนขอบบน ลบขอบล่าง ระวังเครื่องหมายลบซ้อน: $\cos\pi = -1$, $\cos 0 = 1$

$$\begin{aligned} &= \big(-\cos\pi\big) - \big(-\cos 0\big) \\ &= \big(-(-1)\big) - \big(-1\big) \\ &= 1 + 1 \\ &= 2 \end{aligned}$$

$\displaystyle\int_0^{\pi} \sin x\,dx = 2$ คือพื้นที่ใต้โค้งไซน์ครึ่งลูก

ตัวอย่าง E3 · เปลี่ยนตัวแปร u พร้อมเปลี่ยนขอบเขต

### หา $\displaystyle\int_0^2 x(x^2+1)^3\,dx$

- เลือก u และ du เหมือนอินทิกรัลไม่จำกัดเขต

$${u = x^2+1},\quad {du = 2x\,dx} \Rightarrow {x\,dx = \tfrac12\,du}$$

- แปลงขอบเขตจากค่า x เป็นค่า u ด้วย $u = x^2 + 1$ Q11

$$\begin{gathered} x = 0 \\ \Rightarrow u = 0^2 + 1 = {1} \\ x = 2 \\ \Rightarrow u = 2^2 + 1 = {5} \end{gathered}$$

- อินทิเกรตในตัวแปร u ด้วยขอบเขตใหม่ ไม่ต้องแทนกลับ F2

$$\begin{aligned} \frac{1}{2}\int_{{1}}^{{5}} u^3\,du &= \frac{1}{2}\Big[{\frac{u^4}{4}}\Big]_1^5 \\ &= \frac{1}{2}\cdot\frac{5^4 - 1^4}{4} \\ &= \frac{625 - 1}{8} \\ &= \frac{624}{8} \\ &= 78 \end{aligned}$$

- ตรวจด้วยวิธีแทนกลับเป็น x แล้วใช้ขอบเขตเดิม

$$\Big[\frac{(x^2+1)^4}{8}\Big]_0^2 = \frac{5^4}{8} - \frac{1^4}{8} = \frac{624}{8} = 78$$

$\displaystyle\int_0^2 x(x^2+1)^3\,dx = 78$

ตัวอย่าง E4 · ใช้สมมาตรประหยัดแรง

### หา $\displaystyle\int_{-2}^{2} (x^3 + 4x)\,dx$ และ $\displaystyle\int_{-1}^{1} (3x^2 + 1)\,dx$

- $x^3 + 4x$ เป็นฟังก์ชันคี่ เพราะ $f(-x) = -f(x)$ บนช่วงสมมาตร [−2, 2] ได้ศูนย์ทันที Q9

$$\int_{-2}^{2} (x^3 + 4x)\,dx = 0$$

- $3x^2 + 1$ เป็นฟังก์ชันคู่ คิดครึ่งเดียวแล้วคูณสอง Q9

$$\begin{aligned} \int_{-1}^{1} (3x^2+1)\,dx &= 2\int_0^1 (3x^2+1)\,dx \\ &= 2\Big[x^3 + x\Big]_0^1 \\ &= 2(2 - 0) \\ &= 4 \end{aligned}$$

ได้ 0 และ 4 ตามลำดับ

ตัวอย่าง E5 · งานไฟฟ้า: ค่า RMS

### หาค่า RMS ของ $v(t) = V_m\sin\omega t$

- นิยาม RMS คือรากที่สองของค่าเฉลี่ยของกำลังสองในหนึ่งคาบ $T = 2\pi/\omega$ Q10 Average value

$$V_{\text{rms}}^2 = \frac{1}{T}\int_0^T V_m^2\sin^2\omega t\,dt$$

- ใช้สูตรลดกำลัง $\sin^2\theta = \tfrac{1 - \cos 2\theta}{2}$ S12 แล้วอินทิเกรต G4

$$\frac{V_m^2}{T}\int_0^T \frac{1 - \cos 2\omega t}{2}\,dt = \frac{V_m^2}{2T}\Big[t - \frac{\sin 2\omega t}{2\omega}\Big]_0^T$$

- แทนขอบเขต: $\sin 2\omega T = \sin 4\pi = 0$ และ $\sin 0 = 0$

$$\frac{V_m^2}{2T}\Big[(T - 0) - (0 - 0)\Big] = \frac{V_m^2}{2\cancel{T}}\cdot\cancel{T} = \frac{V_m^2}{2}$$

$V_{\text{rms}} = \dfrac{V_m}{\sqrt{2}} \approx 0.707\,V_m$ ไฟบ้าน 230 V rms จึงมีค่ายอดราว 325 V

## ข้อผิดพลาดที่พบบ่อย (Common Mistakes)

| เขียนผิด | ที่ถูก | เหตุผล |

| $\int 2x\,dx = x^2$ | $x^2 + C$ | ลืมค่าคงที่ |

| $\int x^{-1}\,dx = \dfrac{x^0}{0}$ | $\ln|x| + C$ | กฎยกกำลังใช้ไม่ได้ที่ n = −1 |

| $\int (x^2+1)^3\,dx = \dfrac{(x^2+1)^4}{4}$ | กระจายก่อน | ไม่มี $2x$ ข้างนอก จึงใช้ H1 ไม่ได้ |

| $\int x e^x\,dx = \dfrac{x^2}{2}e^x$ | $e^x(x-1) + C$ | ไม่มีกฎผลคูณ (P6) ต้องทำทีละส่วน |

| $\int \dfrac{dx}{x^2+1} = \ln(x^2+1)$ | $\arctan x + C$ | ตัวเศษไม่ใช่ $2x$ จึงไม่ใช่รูป ln |

| แทน u แล้วใช้ขอบเขต x เดิม | เปลี่ยนขอบเขตเป็นค่า u | ดู Q11 และตัวอย่าง E3 |

| $\int \sin 3x\,dx = -\cos 3x$ | $-\tfrac13\cos 3x + C$ | ลืมหารด้วยอนุพันธ์ข้างใน (G4) |

## หน้าในชุดอินทิกรัล: ทบทวนพื้นฐานและการประยุกต์

อินทิเกรตเป็นแล้ว ไปดูว่าวิศวกรใช้มันทำอะไร: ประจุ พลังงาน และ RMS ในงานไฟฟ้า งาน จุดศูนย์ถ่วง และความเฉื่อยในงานเครื่องกล แรงดันน้ำบนเขื่อน หน้าตัด และการโก่งของคานในงานโยธา พร้อมแล็บคานที่เห็นสายอินทิกรัลจากน้ำหนักถึงการโก่ง ถ้ายังไม่แน่นเรื่องลิมิตและอนุพันธ์ เริ่มที่หน้าแคลคูลัสเบื้องต้น

f′5.1
แคลคูลัสเบื้องต้นสำหรับวิศวกรรมไฟฟ้า
Basic Calculus
ลิมิต อนุพันธ์ และปริพันธ์ในหน้าเดียว พร้อมตัวอย่างกระแสในตัวเก็บประจุ พลังงานที่สะสม และค่า RMS ของไฟบ้าน 220 V
เปิดหน้า →ทบทวนก่อนอินทิกรัล

∫dx5.2
การประยุกต์อินทิกรัลทางวิศวกรรมไฟฟ้า เครื่องกล และโยธา
Applications of Integrals in Electrical, Mechanical & Civil Engineering
ประจุ พลังงาน ค่าเฉลี่ยและ RMS งานของแรง จุดศูนย์ถ่วง โมเมนต์ความเฉื่อย แรงดันน้ำบนเขื่อน ปริมาตรดินขุด-ถม และแล็บคาน น้ำหนัก → แรงเฉือน → โมเมนต์ → ความชัน → การโก่ง
เปิดหน้า →สูตร A1, A2, …

เส้นทางเต็มของแคลคูลัส: ฟังก์ชัน → ลิมิต → อนุพันธ์ → อินทิกรัล (หน้านี้) → การแปลงลาปลาซ

## วิดีโอจากช่อง Mod's Engineering Mathematics

คลิปล่าสุดทั้งหมดของช่อง และเพลย์ลิสต์การแปลงลาปลาซ ซึ่งนิยามด้วยอินทิกรัลและใช้เทคนิคในหน้านี้เกือบทุกข้อ

∫

### คลิปล่าสุดจากช่อง
Mod's Engineering Mathematics · ภาษาไทย

ℒ

### Laplace Transforms
อินทิกรัลในงานจริง · เพลย์ลิสต์

สอนโดยอาจารย์มด · ภาษาไทยค้นหาคลิปอินทิเกรตในช่อง ↗

## คำถามที่พบบ่อย

ทำไมอินทิกรัลไม่จำกัดเขตต้องบวก C?
เพราะอนุพันธ์ของค่าคงที่เป็นศูนย์ ฟังก์ชัน $x^2$, $x^2+5$ และ $x^2-3$ จึงมีอนุพันธ์เท่ากันคือ $2x$ เมื่อย้อนกลับจาก $2x$ จึงบอกได้แค่ว่าคำตอบคือ $x^2 + C$ โดย C เป็นค่าคงที่ใดก็ได้

อินทิเกรตทีละพจน์แล้วได้ C1, C2, C3 ทำไมเขียน C ตัวเดียว?
ผลบวกของค่าคงที่ก็ยังเป็นค่าคงที่ จึงรวม $C_1 + C_2 + C_3$ เป็นค่าคงที่ตัวใหม่ชื่อ C แล้วเขียนครั้งเดียวท้ายคำตอบ

การเปลี่ยนตัวแปร u ควรเลือก u อย่างไร?
มองหาก้อนข้างใน (ในวงเล็บ ใต้รากที่สอง ในเลขชี้กำลัง หรือในตัวส่วน) ที่อนุพันธ์ของมันอยู่นอกก้อนนั้น เช่น $\int x(x^2+1)^4\,dx$ ให้ $u = x^2+1$ เพราะ $du = 2x\,dx$ และมี x อยู่ข้างนอกแล้ว ถ้าแทนแล้วยังเหลือ x แปลว่าต้องเลือก u ใหม่

เมื่อไหร่ต้องหารยาวพหุนามก่อนอินทิเกรต?
เมื่อเป็นเศษส่วนพหุนามที่ดีกรีของตัวเศษมากกว่าหรือเท่ากับดีกรีของตัวส่วน ให้หารยาวก่อนจะได้ผลหาร + เศษ/ตัวส่วน แล้วอินทิเกรตทีละส่วน

อินทิกรัลจำกัดเขตทำไมไม่มี C?
เพราะ $(F(b) + C) - (F(a) + C) = F(b) - F(a)$ ค่า C ถูกลบหายไปเสมอ จึงไม่ต้องเขียน

เปลี่ยนตัวแปร u ในอินทิกรัลจำกัดเขต ต้องเปลี่ยนขอบเขตไหม?
ต้องเปลี่ยน ถ้าอินทิเกรตในตัวแปร u ให้แทนขอบเขตเป็น $u(a)$ และ $u(b)$ หรือจะแทนกลับเป็น x ก่อนแล้วใช้ขอบเขตเดิมก็ได้ ห้ามผสมสองแบบ

## คำถามที่พบบ่อย (FAQ)

**ทำไมอินทิกรัลไม่จำกัดเขตต้องบวก C?**
เพราะอนุพันธ์ของค่าคงที่เป็นศูนย์ ฟังก์ชัน $x^2$, $x^2+5$ และ $x^2-3$ จึงมีอนุพันธ์เท่ากันคือ $2x$ เมื่อย้อนกลับจาก $2x$ จึงบอกได้แค่ว่าคำตอบคือ $x^2 + C$ โดย C เป็นค่าคงที่ใดก็ได้

**อินทิเกรตทีละพจน์แล้วได้ C1, C2, C3 ทำไมเขียน C ตัวเดียว?**
ผลบวกของค่าคงที่ก็ยังเป็นค่าคงที่ จึงรวม $C_1 + C_2 + C_3$ เป็นค่าคงที่ตัวใหม่ชื่อ C แล้วเขียนครั้งเดียวท้ายคำตอบ

**การเปลี่ยนตัวแปร u ควรเลือก u อย่างไร?**
มองหาก้อนข้างใน (ในวงเล็บ ใต้รากที่สอง ในเลขชี้กำลัง หรือในตัวส่วน) ที่อนุพันธ์ของมันอยู่นอกก้อนนั้น เช่น $\int x(x^2+1)^4\,dx$ ให้ $u = x^2+1$ เพราะ $du = 2x\,dx$ และมี x อยู่ข้างนอกแล้ว ถ้าแทนแล้วยังเหลือ x แปลว่าต้องเลือก u ใหม่

**เมื่อไหร่ต้องหารยาวพหุนามก่อนอินทิเกรต?**
เมื่อเป็นเศษส่วนพหุนามที่ดีกรีของตัวเศษมากกว่าหรือเท่ากับดีกรีของตัวส่วน ให้หารยาวก่อนจะได้ผลหาร + เศษ/ตัวส่วน แล้วอินทิเกรตทีละส่วน

**อินทิกรัลจำกัดเขตทำไมไม่มี C?**
เพราะ $(F(b) + C) - (F(a) + C) = F(b) - F(a)$ ค่า C ถูกลบหายไปเสมอ จึงไม่ต้องเขียน

**เปลี่ยนตัวแปร u ในอินทิกรัลจำกัดเขต ต้องเปลี่ยนขอบเขตไหม?**
ต้องเปลี่ยน ถ้าอินทิเกรตในตัวแปร u ให้แทนขอบเขตเป็น $u(a)$ และ $u(b)$ หรือจะแทนกลับเป็น x ก่อนแล้วใช้ขอบเขตเดิมก็ได้ ห้ามผสมสองแบบ
