---
title: "เฉลยอินทิเกรต ∫sec x dx: ที่มาของ ln|sec x + tan x| สองวิธี"
url: https://modsengineeringmath.com/solutions/integral-sec-x/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-11-14
---

> เฉลย ∫sec x dx = ln|sec x + tan x| + C สองวิธี: คูณด้วย sec x + tan x ให้ตัวเศษเป็นอนุพันธ์ของตัวส่วน และเปลี่ยนตัวแปร u = sin x ที่ไม่ต้องจำเทคนิค พร้อมตรวจคำตอบ ตัวอย่างตัวเลข และแผนที่เมอร์เคเตอร์

ฉบับ Markdown ของ https://modsengineeringmath.com/solutions/integral-sec-x/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# เฉลยอินทิเกรต ∫sec x dx: ที่มาของ ln|sec x + tan x| สองวิธี

// เฉลยโจทย์อินทิเกรต #005 · Multiply by a clever one / u-substitution


โจทย์ · อินทิเกรต #005
จงหาอินทิกรัลไม่จำกัดเขต $\int \sec x\,dx$ และอธิบายที่มาของคำตอบ $\ln|\sec x + \tan x| + C$

$$\int \sec x\,dx$$

แตะเพื่อดูคำตอบสุดท้าย (ลองคิดเองก่อนนะ)

$$\int \sec x\,dx = \ln|\sec x + \tan x| + C$$

ระดับ ●●○ ปานกลางเทคนิค: Multiply by a clever one / u-substitutionเฉลยโดย อาจารย์มดอัปเดต 14 พ.ย. 2569

ไปที่วิธีทำ ↓

แชร์ให้เพื่อน
LINE
Facebook
X

## มองโจทย์ก่อน: อะไรทำให้ข้อนี้ยาก

$\sec x = \tfrac{1}{\cos x}$ ดูเหมือนง่าย แต่ไม่มีฟังก์ชันพื้นฐานตัวไหนที่ดิฟแล้วได้ $\sec x$ ตรง ๆ คู่สูตรที่จำกันได้คือ $\int\sec^2x\,dx = \tan x$ และ $\int\sec x\tan x\,dx = \sec x$ ไม่มี $\sec x$ ตัวเดียว

ตำราส่วนใหญ่สอนให้ “คูณด้วย $\tfrac{\sec x+\tan x}{\sec x+\tan x}$” ซึ่งได้คำตอบเร็ว แต่ดูเหมือนเดาสุ่ม หน้านี้จึงแสดงสองวิธี: วิธีลัดที่ใช้ในห้องสอบ และวิธีที่คิดเองได้โดยไม่ต้องจำเทคนิค ซึ่งอธิบายด้วยว่าเทคนิคลัดมาจากไหน

## ที่มาของการคูณด้วย sec x + tan x

เป้าหมายคือทำให้อินทิกรัลอยู่ในรูป H2 $\int\tfrac{f'(x)}{f(x)}\,dx = \ln|f(x)|$ เราจึงต้องหาฟังก์ชัน $f$ ที่ $f'/f = \sec x$ หรือ $f' = \sec x\cdot f$

ลองดิฟคู่สูตรที่มี sec อยู่แล้ว

$$\frac{d}{dx}\sec x = \sec x\tan x, \qquad \frac{d}{dx}\tan x = \sec^2 x$$

ทั้งสองตัวมีตัวประกอบ $\sec x$ อยู่ ลองรวมกัน

$$\frac{d}{dx}(\sec x + \tan x) = \sec x\tan x + \sec^2 x = \sec x\,(\tan x + \sec x)$$

ได้ $f' = \sec x\cdot f$ พอดีเมื่อ $f = \sec x + \tan x$ นี่คือเหตุผลของการคูณ ไม่ใช่การเดา ใครสังเกตเห็นตรงนี้ก็คิดเทคนิคเองได้

## วิธีที่ 1 · คูณด้วย sec x + tan x

วิธีทำ · คูณด้วยหนึ่งที่เลือกมา

### หา $\displaystyle \int \sec x\,dx$

- คูณทั้งเศษและส่วนด้วย $\sec x + \tan x$ (เท่ากับคูณด้วย 1)

$$\int \sec x\,dx = \int \frac{\sec x\,(\sec x + \tan x)}{\sec x + \tan x}\,dx = \int \frac{\sec^2 x + \sec x\tan x}{\sec x + \tan x}\,dx$$

- ให้ตัวส่วนเป็นตัวแปรใหม่ ตัวเศษคืออนุพันธ์ของมันพอดี T1 Substitution

$${u = \sec x + \tan x} \;\Rightarrow\; {du = (\sec x\tan x + \sec^2 x)\,dx}$$

- อินทิกรัลเหลือ $\int du/u$ F3 Reciprocal rule

$$\int \frac{{du}}{{u}} = {\ln|u|} + C = \ln|\sec x + \tan x| + {C}$$

$\displaystyle \int \sec x\,dx = \ln|\sec x + \tan x| + {C}$

ตรวจคำตอบ: $\tfrac{d}{dx}\ln|\sec x+\tan x| = \tfrac{\sec x\tan x + \sec^2x}{\sec x + \tan x} = \tfrac{\sec x\,\cancel{(\tan x+\sec x)}}{\cancel{\sec x+\tan x}} = \sec x$ ✓

## วิธีที่ 2 · ไม่ต้องจำเทคนิค: เปลี่ยนตัวแปร u = sin x

ถ้าลืมเทคนิคในห้องสอบ ใช้หลักทั่วไปของอินทิกรัลตรีโกณ: กำลังของ cos เป็นคี่ (กำลัง −1) ให้ดึง cos ออกหนึ่งตัวแล้วเปลี่ยนเป็น sin

วิธีทำ · u = sin x

### หา $\displaystyle \int \sec x\,dx$ อีกทาง

- คูณเศษและส่วนด้วย $\cos x$ แล้วใช้ $\cos^2x = 1 - \sin^2x$

$$\int \frac{dx}{\cos x} = \int \frac{\cos x\,dx}{\cos^2 x} = \int \frac{\cos x\,dx}{1 - \sin^2 x}$$

- ให้ ${u = \sin x}$, ${du = \cos x\,dx}$ ได้รูปผลต่างกำลังสอง S3

$$\int \frac{{du}}{1 - {u}^2} = \frac12\ln\left|\frac{1+u}{1-u}\right| + C = \frac12\ln\left|\frac{1+\sin x}{1-\sin x}\right| + C$$

- คูณเศษและส่วนข้างใน ln ด้วย $1+\sin x$ ตัวส่วนกลายเป็น $1-\sin^2x = \cos^2x$

$$\frac12\ln\frac{(1+\sin x)^2}{\cos^2 x} = \ln\left|\frac{1+\sin x}{\cos x}\right| = \ln|\sec x + \tan x|$$

ได้คำตอบเดียวกัน และเห็นว่า $\sec x + \tan x$ คือ $\tfrac{1+\sin x}{\cos x}$ ที่โผล่มาเองจากวิธีทั่วไป

## ตัวอย่างตัวเลข: ∫ sec x จาก 0 ถึง π/4

$$\int_0^{\pi/4}\sec x\,dx = \Big[\ln|\sec x + \tan x|\Big]_0^{\pi/4} = \ln\left(\sqrt2 + 1\right) - \ln(1 + 0) = \ln\left(1+\sqrt2\right) \approx 0.8814$$

ตรวจขนาด: บนช่วงนี้ $\sec x$ อยู่ระหว่าง 1 กับ $\sqrt2 \approx 1.41$ ช่วงยาว $\pi/4 \approx 0.785$ พื้นที่จึงต้องอยู่ระหว่าง 0.785 กับ 1.11 ✓ ค่า $\ln(1+\sqrt2)$ เท่ากับ $\sinh^{-1}1$ ซึ่งเชื่อมกับเฉลยอินทิเกรต #001 เพราะแทน $x = \tan\theta$ ใน $\int\tfrac{dx}{\sqrt{x^2+1}}$ จะได้ $\int\sec\theta\,d\theta$ พอดี

## อินทิกรัลที่ช่วยวาดแผนที่โลก

แผนที่เมอร์เคเตอร์ (Mercator projection) ที่ใช้ในการเดินเรือและใน Google Maps ต้องยืดแนวตั้งที่ละติจูด $\varphi$ ด้วยตัวประกอบ $\sec\varphi$ เพื่อให้ทิศเข็มทิศเป็นเส้นตรงบนแผนที่ ระยะจากเส้นศูนย์สูตรบนแผนที่จึงเป็น

$$y(\varphi) = R\int_0^{\varphi}\sec\theta\,d\theta = R\ln\left|\sec\varphi + \tan\varphi\right|$$

ในยุคนั้นยังไม่มีแคลคูลัส นักทำแผนที่ต้องบวกค่า sec ทีละช่วงเล็ก ๆ เป็นตาราง (ก็คือผลบวกรีมันน์) และต่อมามีผู้สังเกตว่าตารางนั้นตรงกับค่าลอการิทึมของ $\tan\left(\tfrac{\varphi}{2}+\tfrac{\pi}{4}\right)$ ก่อนที่จะพิสูจน์ได้ด้วยแคลคูลัสในภายหลัง ที่ละติจูด 60° ได้ $y \approx 1.317R$ แต่ที่ 85° พุ่งไปถึง $\approx 3.13R$ นี่คือเหตุผลที่กรีนแลนด์บนแผนที่ดูใหญ่เกินจริง

## จุดที่มักพลาด

- ตอบ $\tan x$ หรือ $\sec x\tan x$ สับสนกับ $\int\sec^2x\,dx = \tan x$ และอนุพันธ์ของ $\sec x$

- ตอบ $\ln|\cos x|$ หรือ $\tfrac{1}{\sin x}$ อินทิเกรตเศษส่วนแบบ “กลับเศษส่วน” ไม่มีกฎนี้ ดู P6

- ลืมค่าสัมบูรณ์ $\sec x + \tan x$ ติดลบได้ เช่นช่วง $\tfrac{\pi}{2}

- คิดว่าคำตอบรูปอื่นผิด $\tfrac12\ln\left|\tfrac{1+\sin x}{1-\sin x}\right|$ และ $\ln\left|\tan\left(\tfrac x2+\tfrac\pi4\right)\right|$ ถูกเหมือนกัน

ทบทวนได้ที่อินทิกรัลตรีโกณมิติ และตารางสูตรอินทิเกรตตรีโกณ (R14 sec, R15 csc)

## คำถามที่พบบ่อย

∫sec x dx เท่ากับเท่าไร?
เท่ากับ $\ln|\sec x + \tan x| + C$ เขียนอีกแบบได้ว่า $\tfrac12\ln\left|\tfrac{1+\sin x}{1-\sin x}\right| + C$ หรือ $\ln\left|\tan\left(\tfrac{x}{2}+\tfrac{\pi}{4}\right)\right| + C$ ทุกแบบเท่ากัน

ทำไมต้องคูณด้วย sec x + tan x?
เพราะอนุพันธ์ของ $\sec x + \tan x$ คือ $\sec x\tan x + \sec^2 x = \sec x(\sec x + \tan x)$ เมื่อคูณเข้าไปตัวเศษจะเป็นอนุพันธ์ของตัวส่วนพอดี อินทิกรัลจึงเป็น $\ln|\text{ตัวส่วน}|$

∫csc x dx เท่ากับเท่าไร?
ใช้วิธีเดียวกันโดยคูณด้วย $\csc x + \cot x$ ได้ $-\ln|\csc x + \cot x| + C$ หรือ $\ln\left|\tan\tfrac{x}{2}\right| + C$

## ลองทำโจทย์ข้ออื่นต่อ

อินทิเกรต #007●●○ ปานกลาง

$$\int e^{x}\sin x\,dx$$

∫eˣ sin x dx ด้วยทีละส่วนแบบวนกลับ
Cyclic integration by parts
14 พ.ย. 2569ดูเฉลยทีละขั้น →

อินทิเกรต #006●●○ ปานกลาง

$$\int \sqrt{a^2-x^2}\,dx$$

∫√(a² − x²) dx ด้วยการแทนค่าตรีโกณ
Trigonometric substitution
14 พ.ย. 2569ดูเฉลยทีละขั้น →

อินทิเกรต #004●●○ ปานกลาง

$$\int \frac{5x-1}{x^2-x-2}\,dx$$

∫(5x − 1)/(x² − x − 2) dx ด้วยเศษส่วนย่อย
Partial fraction decomposition
14 พ.ย. 2569ดูเฉลยทีละขั้น →

## คำถามที่พบบ่อย (FAQ)

**∫sec x dx เท่ากับเท่าไร?**
เท่ากับ $\ln|\sec x + \tan x| + C$ เขียนอีกแบบได้ว่า $\tfrac12\ln\left|\tfrac{1+\sin x}{1-\sin x}\right| + C$ หรือ $\ln\left|\tan\left(\tfrac{x}{2}+\tfrac{\pi}{4}\right)\right| + C$ ทุกแบบเท่ากัน

**ทำไมต้องคูณด้วย sec x + tan x?**
เพราะอนุพันธ์ของ $\sec x + \tan x$ คือ $\sec x\tan x + \sec^2 x = \sec x(\sec x + \tan x)$ เมื่อคูณเข้าไปตัวเศษจะเป็นอนุพันธ์ของตัวส่วนพอดี อินทิกรัลจึงเป็น $\ln|\text{ตัวส่วน}|$

**∫csc x dx เท่ากับเท่าไร?**
ใช้วิธีเดียวกันโดยคูณด้วย $\csc x + \cot x$ ได้ $-\ln|\csc x + \cot x| + C$ หรือ $\ln\left|\tan\tfrac{x}{2}\right| + C$
