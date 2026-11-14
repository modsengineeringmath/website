---
title: "ตารางสูตรอินทิเกรต (Table of Integrals): 64 สูตรที่ใช้บ่อย พร้อมชื่อสากลและวิธีตรวจคำตอบ"
url: https://modsengineeringmath.com/learn/integral-calculus/integral-table/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-11-14
---

> ตารางสูตรอินทิเกรตทั้งหมดที่ใช้บ่อยในหน้าเดียว 64 สูตร: ยกกำลัง เลขชี้กำลัง ลอการิทึม ตรีโกณมิติ sec csc กำลังสอง รูปอาร์กแทนเจนต์ อาร์กไซน์ รากที่สอง ทีละส่วน ไฮเพอร์โบลิก สูตรลดกำลัง และอินทิกรัลจำกัดเขต ทุกสูตรตรวจด้วยการดิฟแล้ว พิมพ์เก็บไว้ได้

ฉบับ Markdown ของ https://modsengineeringmath.com/learn/integral-calculus/integral-table/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# ตารางสูตรอินทิเกรต (Table of Integrals): 64 สูตรที่ใช้บ่อย พร้อมชื่อสากลและวิธีตรวจคำตอบ

// บทที่ 5.3 · อินทิกรัล · Table of Integrals


สูตรอินทิเกรตที่ใช้บ่อยตั้งแต่ ม.ปลาย แคลคูลัส 1–2 ถึงคณิตศาสตร์วิศวกรรม รวมไว้ในหน้าเดียว 64 สูตร เรียงจากง่ายไปยาก ทุกแถวมีรหัส R ลิงก์ตรงได้ และมีชื่อสูตรภาษาอังกฤษไว้ค้นต่อ หน้านี้เป็นตารางอ้างอิง ถ้าต้องการวิธีทำทีละขั้นให้ไปที่สูตรอินทิเกรตพร้อมวิธีทำ และฝึกต่อที่โจทย์อินทิเกรตพร้อมเฉลย

ก่อนใช้ตาราง

- อินทิกรัลไม่จำกัดเขตทุกสูตรต้องเติม $+C$ เพราะดิฟค่าคงที่ได้ศูนย์

- ตรวจคำตอบด้วยการดิฟ ดิฟฝั่งขวาแล้วต้องได้ฟังก์ชันใต้เครื่องหมาย $\int$ ทุกแถวในหน้านี้ตรวจแบบนี้ด้วย sympy แล้ว

- ถ้าข้างในเป็น $ax+b$ แทน $x$ ให้หารด้วย $a$ เพิ่ม เช่น $\int\cos(3x+1)\,dx=\tfrac13\sin(3x+1)+C$

- สั่งพิมพ์ได้ทันที (Ctrl/⌘ + P) เมนูและแถบข้างจะถูกซ่อนให้เอง

## สูตรพื้นฐาน: ยกกำลัง เลขชี้กำลัง ลอการิทึม พื้นฐาน

สูตรกลุ่มนี้คือฐานของทุกข้อ อินทิเกรตคือย้อนกลับของการดิฟ ตรวจทุกบรรทัดได้โดยดิฟฝั่งขวาแล้วต้องได้ฟังก์ชันใต้เครื่องหมายอินทิกรัล ที่มาและตัวอย่างอยู่ในสูตรอินทิเกรตพื้นฐาน

| # | อินทิกรัล | ผลลัพธ์ | ชื่อสูตร |

| R1 | $\displaystyle \int x^n\,dx$ | $\displaystyle \frac{x^{n+1}}{n+1}+C,\quad n\ne -1$ | Power rule
กฎยกกำลัง |

| R2 | $\displaystyle \int \frac{1}{x}\,dx$ | $\displaystyle \ln|x|+C$ | Reciprocal
ส่วนกลับของ x |

| R3 | $\displaystyle \int e^{x}\,dx$ | $\displaystyle e^{x}+C$ | Natural exponential
เลขชี้กำลังฐาน e |

| R4 | $\displaystyle \int a^{x}\,dx$ | $\displaystyle \frac{a^{x}}{\ln a}+C,\quad a>0,\ a\ne1$ | Exponential base a
เลขชี้กำลังฐาน a |

| R5 | $\displaystyle \int e^{kx}\,dx$ | $\displaystyle \frac{1}{k}e^{kx}+C$ | Exponential e^(kx)
เลขชี้กำลัง e^{kx} |

| R6 | $\displaystyle \int (ax+b)^n\,dx$ | $\displaystyle \frac{(ax+b)^{n+1}}{a(n+1)}+C,\quad n\ne-1$ | Linear power
ยกกำลังของ ax + b |

| R7 | $\displaystyle \int \frac{dx}{ax+b}$ | $\displaystyle \frac{1}{a}\ln|ax+b|+C$ | Linear reciprocal
ส่วนกลับของ ax + b |

## สูตรอินทิเกรตตรีโกณมิติ พื้นฐาน

จำคู่ดิฟ-อินทิเกรตของ sin cos tan sec ให้ได้ก่อน สูตรกำลังสองใช้เอกลักษณ์มุมสองเท่าลดกำลังลง อ่านวิธีทำเต็มที่อินทิกรัลตรีโกณมิติ

| # | อินทิกรัล | ผลลัพธ์ | ชื่อสูตร |

| R8 | $\displaystyle \int \sin x\,dx$ | $\displaystyle -\cos x+C$ | Sine
ไซน์ |

| R9 | $\displaystyle \int \cos x\,dx$ | $\displaystyle \sin x+C$ | Cosine
โคไซน์ |

| R10 | $\displaystyle \int \sin kx\,dx$ | $\displaystyle -\frac{1}{k}\cos kx+C$ | Sine of kx
ไซน์ของ kx |

| R11 | $\displaystyle \int \cos kx\,dx$ | $\displaystyle \frac{1}{k}\sin kx+C$ | Cosine of kx
โคไซน์ของ kx |

| R12 | $\displaystyle \int \tan x\,dx$ | $\displaystyle \ln|\sec x|+C = -\ln|\cos x|+C$ | Tangent
แทนเจนต์ |

| R13 | $\displaystyle \int \cot x\,dx$ | $\displaystyle \ln|\sin x|+C$ | Cotangent
โคแทนเจนต์ |

| R14 | $\displaystyle \int \sec x\,dx$ | $\displaystyle \ln|\sec x+\tan x|+C$ | Secant
ซีแคนต์ |

| R15 | $\displaystyle \int \csc x\,dx$ | $\displaystyle -\ln|\csc x+\cot x|+C = \ln\left|\tan\tfrac{x}{2}\right|+C$ | Cosecant
โคซีแคนต์ |

| R16 | $\displaystyle \int \sec^2 x\,dx$ | $\displaystyle \tan x+C$ | Secant squared
ซีแคนต์กำลังสอง |

| R17 | $\displaystyle \int \csc^2 x\,dx$ | $\displaystyle -\cot x+C$ | Cosecant squared
โคซีแคนต์กำลังสอง |

| R18 | $\displaystyle \int \sec x\tan x\,dx$ | $\displaystyle \sec x+C$ | Secant tangent
ซีแคนต์คูณแทนเจนต์ |

| R19 | $\displaystyle \int \csc x\cot x\,dx$ | $\displaystyle -\csc x+C$ | Cosecant cotangent
โคซีแคนต์คูณโคแทนเจนต์ |

| R20 | $\displaystyle \int \sin^2 x\,dx$ | $\displaystyle \frac{x}{2}-\frac{\sin 2x}{4}+C$
ใช้ $\sin^2x=\tfrac{1-\cos2x}{2}$ | Sine squared
ไซน์กำลังสอง |

| R21 | $\displaystyle \int \cos^2 x\,dx$ | $\displaystyle \frac{x}{2}+\frac{\sin 2x}{4}+C$
ใช้ $\cos^2x=\tfrac{1+\cos2x}{2}$ | Cosine squared
โคไซน์กำลังสอง |

| R22 | $\displaystyle \int \tan^2 x\,dx$ | $\displaystyle \tan x-x+C$
ใช้ $\tan^2x=\sec^2x-1$ | Tangent squared
แทนเจนต์กำลังสอง |

| R23 | $\displaystyle \int \sin x\cos x\,dx$ | $\displaystyle \frac{\sin^2 x}{2}+C$
หรือ $-\tfrac{\cos2x}{4}+C$ ต่างกันแค่ค่าคงที่ | Sine times cosine
ไซน์คูณโคไซน์ |

## เศษส่วนพหุนาม: รูปอาร์กแทนเจนต์และลอการิทึม กลาง

ถ้าตัวส่วนแยกตัวประกอบได้ให้ใช้เศษส่วนย่อย ถ้าแยกไม่ได้ (ดิสคริมิแนนต์ติดลบ) ให้ทำกำลังสองสมบูรณ์แล้วจะได้รูปอาร์กแทนเจนต์

| # | อินทิกรัล | ผลลัพธ์ | ชื่อสูตร |

| R24 | $\displaystyle \int \frac{dx}{x^2+a^2}$ | $\displaystyle \frac{1}{a}\tan^{-1}\frac{x}{a}+C$ | Inverse tangent form
รูปอาร์กแทนเจนต์ |

| R25 | $\displaystyle \int \frac{dx}{x^2-a^2}$ | $\displaystyle \frac{1}{2a}\ln\left|\frac{x-a}{x+a}\right|+C$ | Difference of squares
ผลต่างกำลังสอง |

| R26 | $\displaystyle \int \frac{dx}{a^2-x^2}$ | $\displaystyle \frac{1}{2a}\ln\left|\frac{a+x}{a-x}\right|+C$ | Difference of squares (a² − x²)
ผลต่างกำลังสองแบบ a² − x² |

| R27 | $\displaystyle \int \frac{f'(x)}{f(x)}\,dx$ | $\displaystyle \ln|f(x)|+C$
เช่น $\int\frac{2x}{x^2+1}dx=\ln(x^2+1)+C$ | Log-derivative
ตัวเศษเป็นอนุพันธ์ของตัวส่วน |

| R28 | $\displaystyle \int \frac{x}{x^2+a^2}\,dx$ | $\displaystyle \frac12\ln\left(x^2+a^2\right)+C$ | x over x² + a²
x ส่วน x² + a² |

| R29 | $\displaystyle \int \frac{dx}{(x+p)^2+q^2}$ | $\displaystyle \frac{1}{q}\tan^{-1}\frac{x+p}{q}+C$
ทำตัวส่วนกำลังสองให้เป็นกำลังสองสมบูรณ์ก่อน | Completed square
กำลังสองสมบูรณ์ |

## รากที่สอง: รูปอาร์กไซน์ วงกลม และไฮเพอร์โบลา กลาง

รากของพหุนามกำลังสองมีสามแบบ $\sqrt{a^2-x^2}$ $\sqrt{x^2+a^2}$ $\sqrt{x^2-a^2}$ แต่ละแบบแทนค่าด้วย $x=a\sin\theta$ $x=a\tan\theta$ $x=a\sec\theta$ ตามลำดับ (trigonometric substitution)

| # | อินทิกรัล | ผลลัพธ์ | ชื่อสูตร |

| R30 | $\displaystyle \int \frac{dx}{\sqrt{a^2-x^2}}$ | $\displaystyle \sin^{-1}\frac{x}{a}+C$ | Inverse sine form
รูปอาร์กไซน์ |

| R31 | $\displaystyle \int \frac{dx}{x\sqrt{x^2-a^2}}$ | $\displaystyle \frac{1}{a}\sec^{-1}\frac{|x|}{a}+C$ | Inverse secant form
รูปอาร์กซีแคนต์ |

| R32 | $\displaystyle \int \frac{dx}{\sqrt{x^2+a^2}}$ | $\displaystyle \ln\left(x+\sqrt{x^2+a^2}\right)+C=\sinh^{-1}\frac{x}{a}+C$
ที่มาทีละขั้น: เฉลยอินทิเกรต #001 | Inverse hyperbolic sine form
รูปอาร์กไซน์ไฮเพอร์โบลิก |

| R33 | $\displaystyle \int \frac{dx}{\sqrt{x^2-a^2}}$ | $\displaystyle \ln\left|x+\sqrt{x^2-a^2}\right|+C$ | Inverse hyperbolic cosine form
รูปอาร์กโคไซน์ไฮเพอร์โบลิก |

| R34 | $\displaystyle \int \sqrt{a^2-x^2}\,dx$ | $\displaystyle \frac{x}{2}\sqrt{a^2-x^2}+\frac{a^2}{2}\sin^{-1}\frac{x}{a}+C$
อินทิเกรตจาก $-a$ ถึง $a$ ได้ $\pi a^2/2$ คือพื้นที่ครึ่งวงกลม | Circle root
รากของ a² − x² (วงกลม) |

| R35 | $\displaystyle \int \sqrt{x^2+a^2}\,dx$ | $\displaystyle \frac{x}{2}\sqrt{x^2+a^2}+\frac{a^2}{2}\ln\left(x+\sqrt{x^2+a^2}\right)+C$ | Root of x² + a²
รากของ x² + a² |

| R36 | $\displaystyle \int \sqrt{x^2-a^2}\,dx$ | $\displaystyle \frac{x}{2}\sqrt{x^2-a^2}-\frac{a^2}{2}\ln\left|x+\sqrt{x^2-a^2}\right|+C$ | Root of x² − a²
รากของ x² − a² |

| R37 | $\displaystyle \int \frac{x\,dx}{\sqrt{a^2-x^2}}$ | $\displaystyle -\sqrt{a^2-x^2}+C$ | x over root
x ส่วนราก a² − x² |

## ผลคูณ: x กับ eˣ, ln x, sin x และฟังก์ชันผกผัน กลาง

ผลคูณของฟังก์ชันต่างชนิดใช้การอินทิเกรตทีละส่วน $\int u\,dv=uv-\int v\,du$ เลือก u ตามลำดับ LIATE: Log, Inverse trig, Algebraic, Trig, Exponential

| # | อินทิกรัล | ผลลัพธ์ | ชื่อสูตร |

| R38 | $\displaystyle \int \ln x\,dx$ | $\displaystyle x\ln x-x+C$
ทีละส่วนโดยให้ $u=\ln x,\ dv=dx$ | Natural log
ลอการิทึมธรรมชาติ |

| R39 | $\displaystyle \int \log_a x\,dx$ | $\displaystyle \frac{x\ln x-x}{\ln a}+C$ | Log base a
ลอการิทึมฐาน a |

| R40 | $\displaystyle \int \frac{\ln x}{x}\,dx$ | $\displaystyle \frac{(\ln x)^2}{2}+C$ | Log over x
ln x ส่วน x |

| R41 | $\displaystyle \int x e^{ax}\,dx$ | $\displaystyle \frac{e^{ax}}{a^2}(ax-1)+C$
กรณี $a=1$: $\int xe^x\,dx=(x-1)e^x+C$ | x times e^(ax)
x คูณ e^{ax} |

| R42 | $\displaystyle \int x\ln x\,dx$ | $\displaystyle \frac{x^2}{2}\ln x-\frac{x^2}{4}+C$ | x times ln x
x คูณ ln x |

| R43 | $\displaystyle \int x\sin x\,dx$ | $\displaystyle \sin x-x\cos x+C$ | x times sine
x คูณไซน์ |

| R44 | $\displaystyle \int x\cos x\,dx$ | $\displaystyle \cos x+x\sin x+C$ | x times cosine
x คูณโคไซน์ |

| R45 | $\displaystyle \int e^{ax}\sin bx\,dx$ | $\displaystyle \frac{e^{ax}}{a^2+b^2}\left(a\sin bx-b\cos bx\right)+C$
ทีละส่วนสองรอบแล้วย้ายข้าง (แบบวนกลับ) | Exponential times sine
เลขชี้กำลังคูณไซน์ |

| R46 | $\displaystyle \int e^{ax}\cos bx\,dx$ | $\displaystyle \frac{e^{ax}}{a^2+b^2}\left(a\cos bx+b\sin bx\right)+C$ | Exponential times cosine
เลขชี้กำลังคูณโคไซน์ |

| R47 | $\displaystyle \int \tan^{-1}x\,dx$ | $\displaystyle x\tan^{-1}x-\frac12\ln\left(1+x^2\right)+C$ | Inverse tangent
อาร์กแทนเจนต์ |

| R48 | $\displaystyle \int \sin^{-1}x\,dx$ | $\displaystyle x\sin^{-1}x+\sqrt{1-x^2}+C$ | Inverse sine
อาร์กไซน์ |

## ฟังก์ชันไฮเพอร์โบลิก กลาง

$\sinh x=\tfrac{e^x-e^{-x}}{2}$ และ $\cosh x=\tfrac{e^x+e^{-x}}{2}$ ดิฟและอินทิเกรตสลับกันโดยไม่มีเครื่องหมายลบ ต่างจาก sin กับ cos ใช้มากกับสายไฟที่ห้อย (catenary) และสายส่งยาว

| # | อินทิกรัล | ผลลัพธ์ | ชื่อสูตร |

| R49 | $\displaystyle \int \sinh x\,dx$ | $\displaystyle \cosh x+C$ | Hyperbolic sine
ไซน์ไฮเพอร์โบลิก |

| R50 | $\displaystyle \int \cosh x\,dx$ | $\displaystyle \sinh x+C$ | Hyperbolic cosine
โคไซน์ไฮเพอร์โบลิก |

| R51 | $\displaystyle \int \tanh x\,dx$ | $\displaystyle \ln(\cosh x)+C$ | Hyperbolic tangent
แทนเจนต์ไฮเพอร์โบลิก |

| R52 | $\displaystyle \int \operatorname{sech}^2 x\,dx$ | $\displaystyle \tanh x+C$ | Hyperbolic secant squared
ซีแคนต์ไฮเพอร์โบลิกกำลังสอง |

## สูตรลดกำลัง (Reduction formulas) ขั้นสูง

เมื่อกำลังสูง ใช้สูตรลดกำลังซ้ำจนเหลือกำลัง 0 หรือ 1 ซึ่งอินทิเกรตได้ทันที ทุกสูตรได้จากการอินทิเกรตทีละส่วนหนึ่งครั้ง

| # | อินทิกรัล | ผลลัพธ์ | ชื่อสูตร |

| R53 | $\displaystyle \int \sin^n x\,dx$ | $\displaystyle -\frac{1}{n}\sin^{n-1}x\cos x+\frac{n-1}{n}\int \sin^{n-2}x\,dx$ | Reduction: power of sine
สูตรลดกำลังของไซน์ |

| R54 | $\displaystyle \int \cos^n x\,dx$ | $\displaystyle \frac{1}{n}\cos^{n-1}x\sin x+\frac{n-1}{n}\int \cos^{n-2}x\,dx$ | Reduction: power of cosine
สูตรลดกำลังของโคไซน์ |

| R55 | $\displaystyle \int x^n e^{x}\,dx$ | $\displaystyle x^n e^{x}-n\int x^{n-1}e^{x}\,dx$ | Reduction: x^n e^x
สูตรลดกำลังของ xⁿeˣ |

| R56 | $\displaystyle \int x^n\ln x\,dx$ | $\displaystyle \frac{x^{n+1}}{n+1}\ln x-\frac{x^{n+1}}{(n+1)^2}+C,\quad n\ne-1$ | Reduction: x^n ln x
xⁿ คูณ ln x |

## อินทิกรัลจำกัดเขตที่ใช้บ่อยในงานวิศวกรรม ขั้นสูง

ค่าเหล่านี้โผล่ซ้ำในวงจรไฟฟ้า สัญญาณ และสถิติ จำผลลัพธ์ไว้ช่วยประหยัดเวลาสอบ และใช้ตรวจคำตอบได้ทันที

| # | อินทิกรัล | ผลลัพธ์ | ชื่อสูตร |

| R57 | $\displaystyle \int_0^{\infty} e^{-ax}\,dx$ | $\displaystyle \frac{1}{a},\quad a>0$
ค่าคงตัวเวลาของวงจร RC: $\int_0^\infty e^{-t/\tau}dt=\tau$ | Exponential decay
เลขชี้กำลังลดลง |

| R58 | $\displaystyle \int_0^{\infty} x^n e^{-ax}\,dx$ | $\displaystyle \frac{n!}{a^{n+1}},\quad a>0,\ n=0,1,2,\dots$
ใช้บ่อยในตารางการแปลงลาปลาซ $\mathcal{L}\{t^n\}=n!/s^{n+1}$ | Gamma integral
อินทิกรัลแกมมา |

| R59 | $\displaystyle \int_{-\infty}^{\infty} e^{-x^2}\,dx$ | $\displaystyle \sqrt{\pi}$
พื้นที่ใต้โค้งระฆังของการแจกแจงปกติ | Gaussian integral
อินทิกรัลเกาส์ |

| R60 | $\displaystyle \int_0^{\pi/2}\sin^n x\,dx=\int_0^{\pi/2}\cos^n x\,dx$ | $\displaystyle \frac{(n-1)!!}{n!!}\cdot\frac{\pi}{2},\quad n\ \text{คู่}$
เช่น $n=4$: $\tfrac{3\cdot1}{4\cdot2}\cdot\tfrac{\pi}{2}=\tfrac{3\pi}{16}$ | Wallis (even n)
วอลลิส n คู่ |

| R61 | $\displaystyle \int_0^{\pi/2}\sin^n x\,dx=\int_0^{\pi/2}\cos^n x\,dx$ | $\displaystyle \frac{(n-1)!!}{n!!},\quad n\ \text{คี่}$
เช่น $n=5$: $\tfrac{4\cdot2}{5\cdot3\cdot1}=\tfrac{8}{15}$ | Wallis (odd n)
วอลลิส n คี่ |

| R62 | $\displaystyle \int_0^{T}\sin^2(\omega t)\,dt$ | $\displaystyle \frac{T}{2},\quad T=\frac{2\pi}{\omega}$
ที่มาของ $V_{\text{rms}}=V_m/\sqrt2$ ของไฟบ้าน | Sine squared over a period
ไซน์กำลังสองตลอดหนึ่งคาบ |

| R63 | $\displaystyle \int_0^{2\pi}\sin mx\,\sin nx\,dx$ | $\displaystyle \begin{cases}0,& m\ne n\\ \pi,& m=n\end{cases}$
m, n เป็นจำนวนเต็มบวก ฐานของอนุกรมฟูริเยร์ | Orthogonality of sines
ความตั้งฉากของไซน์ |

| R64 | $\displaystyle \int_0^{2\pi}\sin mx\,\cos nx\,dx$ | $\displaystyle 0$
m, n เป็นจำนวนเต็มใด ๆ | Orthogonality of sine and cosine
ไซน์ตั้งฉากกับโคไซน์ |

## หาสูตรไม่เจอในตาราง ทำอย่างไรต่อ

ตารางใด ๆ ก็มีสูตรไม่ครบทุกรูป สิ่งที่ต้องฝึกคือแปลงโจทย์ให้เข้ารูปในตาราง ลองตามลำดับนี้

- จัดรูปก่อน กระจายวงเล็บ แยกเศษส่วนออกเป็นหลายพจน์ ใช้เอกลักษณ์ตรีโกณ · จัดรูปและตัดเศษส่วนก่อนอินทิเกรต

- มองหาคู่ $f(x)$ กับ $f'(x)$ ถ้าเจอ ให้เปลี่ยนตัวแปร $u=f(x)$ · การเปลี่ยนตัวแปร u

- เศษส่วนพหุนาม ดีกรีบนไม่น้อยกว่าล่างให้หารยาว แล้วแยกเศษส่วนย่อย · หารยาว · เศษส่วนย่อย

- ผลคูณต่างชนิด ใช้ทีละส่วนตาม LIATE · อินทิเกรตทีละส่วน

- รากของพหุนามกำลังสอง แทนค่าตรีโกณ หรือการแทนค่าแบบออยเลอร์

- ตรวจคำตอบเสมอ ใช้เครื่องคิดเลขอินทิกรัลเทียบ หรือดิฟคำตอบด้วยมือ

## ฝึกใช้ตารางกับโจทย์จริง

รู้สูตรแล้วยังทำข้อสอบไม่ได้เป็นเรื่องปกติ ส่วนที่ยากคือเลือกว่าจะใช้สูตรไหน ฝึกต่อได้ที่

- โจทย์อินทิเกรตพร้อมเฉลย 32 ข้อ แบ่งพื้นฐาน เทคนิค และอินทิกรัลจำกัดเขต

- เฉลยโจทย์ทีละขั้น ข้อละหน้า พร้อมที่มาของแต่ละขั้น

- การประยุกต์อินทิกรัล ในงานไฟฟ้า เครื่องกล และโยธา

## คำถามที่พบบ่อย

สูตรอินทิเกรตที่ต้องจำจริง ๆ มีกี่สูตร?
สำหรับแคลคูลัส 1 จำแค่สองกลุ่มแรกก็พอ (สูตรพื้นฐาน R1–R7 และตรีโกณ R8–R23) รวมราว 20 สูตร ที่เหลือหาได้จากเทคนิคการเปลี่ยนตัวแปร ทีละส่วน และเศษส่วนย่อย สูตรกลุ่มรากที่สองและไฮเพอร์โบลิกควรจำเพื่อประหยัดเวลาสอบวิศวกรรม

∫sec x dx เท่ากับเท่าไร?
เท่ากับ $\ln|\sec x+\tan x|+C$ ได้จากการคูณทั้งเศษและส่วนด้วย $\sec x+\tan x$ แล้วตัวเศษจะเป็นอนุพันธ์ของตัวส่วนพอดี

ทำไมสูตร ∫1/x dx ต้องมีค่าสัมบูรณ์ ln|x|?
เพราะ $1/x$ นิยามได้ทั้ง x บวกและลบ แต่ $\ln x$ นิยามได้เฉพาะ x > 0 ฟังก์ชัน $\ln|x|$ ดิฟได้ $1/x$ ทั้งสองฝั่ง จึงเป็นคำตอบที่ใช้ได้ทุกช่วงที่ไม่มีศูนย์

จะตรวจว่าใช้สูตรอินทิเกรตถูกได้อย่างไร?
ดิฟคำตอบที่ได้ ถ้าได้ฟังก์ชันใต้เครื่องหมายอินทิกรัลกลับมาก็ถูก ทุกสูตรในตารางนี้ผ่านการตรวจแบบนี้ด้วยโปรแกรมคำนวณสัญลักษณ์ (sympy) แล้ว

## คำถามที่พบบ่อย (FAQ)

**สูตรอินทิเกรตที่ต้องจำจริง ๆ มีกี่สูตร?**
สำหรับแคลคูลัส 1 จำแค่สองกลุ่มแรกก็พอ (สูตรพื้นฐาน R1–R7 และตรีโกณ R8–R23) รวมราว 20 สูตร ที่เหลือหาได้จากเทคนิคการเปลี่ยนตัวแปร ทีละส่วน และเศษส่วนย่อย สูตรกลุ่มรากที่สองและไฮเพอร์โบลิกควรจำเพื่อประหยัดเวลาสอบวิศวกรรม

**∫sec x dx เท่ากับเท่าไร?**
เท่ากับ $\ln|\sec x+\tan x|+C$ ได้จากการคูณทั้งเศษและส่วนด้วย $\sec x+\tan x$ แล้วตัวเศษจะเป็นอนุพันธ์ของตัวส่วนพอดี

**ทำไมสูตร ∫1/x dx ต้องมีค่าสัมบูรณ์ ln|x|?**
เพราะ $1/x$ นิยามได้ทั้ง x บวกและลบ แต่ $\ln x$ นิยามได้เฉพาะ x > 0 ฟังก์ชัน $\ln|x|$ ดิฟได้ $1/x$ ทั้งสองฝั่ง จึงเป็นคำตอบที่ใช้ได้ทุกช่วงที่ไม่มีศูนย์

**จะตรวจว่าใช้สูตรอินทิเกรตถูกได้อย่างไร?**
ดิฟคำตอบที่ได้ ถ้าได้ฟังก์ชันใต้เครื่องหมายอินทิกรัลกลับมาก็ถูก ทุกสูตรในตารางนี้ผ่านการตรวจแบบนี้ด้วยโปรแกรมคำนวณสัญลักษณ์ (sympy) แล้ว
