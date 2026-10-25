---
title: "สูตรตรีโกณมิติทั้งหมด และตารางค่า sin cos tan"
url: https://modsengineeringmath.com/learn/trigonometry/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-10-12
---

> รวมสูตรตรีโกณมิติครบทุกหมวดพร้อมชื่อภาษาอังกฤษ เริ่มจากวงกลมหนึ่งหน่วยแบบโต้ตอบ มุมพิเศษ เอกลักษณ์พีทาโกรัส ผลบวกผลต่าง มุมสองเท่า สามเท่า ครึ่งมุม ผลคูณเป็นผลบวก ออยเลอร์ ฟังก์ชันผกผัน กฎของไซน์โคไซน์ แคลคูลัส และตารางค่า sin cos tan ทุก 0.05° ตั้งแต่ 0° ถึง 90° ทั้งองศาและเรเดียน ค้นหาและคัดลอกได้

ฉบับ Markdown ของ https://modsengineeringmath.com/learn/trigonometry/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# สูตรตรีโกณมิติทั้งหมด และตารางค่า sin cos tan

// บทที่ 2 · คณิตศาสตร์พื้นฐาน · สูตรและตาราง


เริ่มจากวงกลมหนึ่งหน่วย แล้วไล่ไปทุกหมวดที่วิศวกรต้องใช้ ตั้งแต่มุมพิเศษ เอกลักษณ์พีทาโกรัส สูตรมุมประกอบ ไปจนถึงสูตรของออยเลอร์ ฟังก์ชันผกผัน กฎของสามเหลี่ยม แคลคูลัส และอนุกรม ทุกสูตรมีชื่อภาษาอังกฤษกำกับไว้ให้ค้นต่อได้ ท้ายหน้าเป็นตารางค่า sin cos tan ทุก 0.05° ตั้งแต่ 0° ถึง 90° รวม 1,801 แถว

สรุปใน 30 วินาที

- จุดบนวงกลมหนึ่งหน่วยที่มุม θ คือ $(\cos\theta,\ \sin\theta)$ และ $\tan\theta = \sin\theta/\cos\theta$

- สูตรแม่บทมีสองตัว คือ $\sin^2\theta + \cos^2\theta = 1$ กับสูตรผลบวกของมุม สูตรอื่นเกือบทั้งหมดได้มาจากสองตัวนี้

- มุมนอกจตุภาคที่ 1 ให้ใช้มุมอ้างอิงเปิดตาราง แล้วใส่เครื่องหมายตาม ASTC

- ในแคลคูลัสและงานไฟฟ้า มุมต้องเป็นเรเดียน: $180^\circ = \pi$ rad

## วงกลมหนึ่งหน่วย (Unit Circle)

วงกลมหนึ่งหน่วยคือวงกลมรัศมี 1 ที่มีจุดศูนย์กลางที่จุดกำเนิด วางมุม θ ในตำแหน่งมาตรฐาน (standard position) คือให้แขนเริ่มต้น (initial side) ทับแกน x บวก แล้วหมุนทวนเข็มนาฬิกาเป็นมุมบวก แขนสิ้นสุด (terminal side) จะตัดวงกลมที่จุด P จุดนี้คือนิยามของ cos และ sin โดยตรง

### คำศัพท์ที่ใช้กับวงกลมหนึ่งหน่วย

Unit-circle definition นิยามบนวงกลมหนึ่งหน่วย

$$\begin{gathered} P(\theta) = (\cos\theta,\ \sin\theta) \\ x^2 + y^2 = 1 \end{gathered}$$

วงกลมรัศมี r ใด ๆ ใช้ $(x, y) = (r\cos\theta,\ r\sin\theta)$

Reference angle มุมอ้างอิง $\theta_{\text{ref}}$

$$\theta_{\text{ref}} = \begin{cases} \theta & \text{Q I} \\ 180^\circ - \theta & \text{Q II} \\ \theta - 180^\circ & \text{Q III} \\ 360^\circ - \theta & \text{Q IV} \end{cases}$$

มุมแหลมระหว่างแขนสิ้นสุดกับแกน x ค่าตรีโกณของ θ เท่ากับค่าของ $\theta_{\text{ref}}$ ต่างกันแค่เครื่องหมาย

Coterminal angles มุมที่มีแขนสิ้นสุดร่วมกัน

$$\begin{gathered} \theta + 360^\circ k \;=\; \theta + 2\pi k \\ (k \in \mathbb{Z}) \end{gathered}$$

เช่น 30°, 390°, −330° อยู่ตำแหน่งเดียวกันบนวง จึงมีค่าตรีโกณเท่ากันทุกตัว

ASTC rule เครื่องหมายในแต่ละจตุภาค

Q II · Ssin, csc บวก
Q I · Aบวกทุกตัว

Q III · Ttan, cot บวก
Q IV · Ccos, sec บวก

จำว่า “All Students Take Calculus” ไล่ทวนเข็มจากจตุภาคที่ 1

## การวัดมุม องศาและเรเดียน (Angle Measure)

หนึ่งเรเดียนคือมุมที่รองรับความยาวส่วนโค้งเท่ากับรัศมี วงกลมหนึ่งรอบยาว $2\pi r$ จึงเท่ากับ $2\pi$ เรเดียน หน่วยเรเดียนไม่มีมิติ (เป็นอัตราส่วนความยาวต่อความยาว) จึงใช้ได้ตรง ๆ ในสูตรแคลคูลัสและฟิสิกส์

Degree–radian conversion การแปลงองศาและเรเดียน

$$\begin{gathered} \theta_{\text{rad}} = \theta_{\text{deg}} \times \frac{\pi}{180^\circ} \\ \theta_{\text{deg}} = \theta_{\text{rad}} \times \frac{180^\circ}{\pi} \end{gathered}$$

$1\ \text{rad} \approx 57.29578^\circ$ และ $1^\circ \approx 0.0174533$ rad

Arc length ความยาวส่วนโค้ง

$$s = r\theta$$

θ เป็นเรเดียน

Area of a sector พื้นที่เซกเตอร์

$$A = \tfrac12 r^2\theta = \tfrac12 r s$$

Chord length ความยาวคอร์ด

$$c = 2r\sin\frac{\theta}{2}$$

Angular frequency ความถี่เชิงมุม

$$\begin{gathered} \omega = 2\pi f = \frac{2\pi}{T} \\ \theta(t) = \omega t + \phi \end{gathered}$$

ไฟบ้าน 50 Hz มี $\omega = 100\pi \approx 314.16$ rad/s

Turn and gradian หน่วยอื่น

$$1\ \text{turn} = 360^\circ = 2\pi\ \text{rad} = 400\ \text{grad}$$

เครื่องคิดเลขมีโหมด DEG, RAD, GRAD ตรวจโหมดก่อนกดทุกครั้ง

## ฟังก์ชันตรีโกณมิติทั้งหก (Six Trigonometric Functions)

ในสามเหลี่ยมมุมฉาก ด้านตรงข้ามมุม θ เรียกว่า ด้านข้าม (opposite) ด้านที่ติดกับ θ เรียกว่า ด้านชิด (adjacent) และด้านตรงข้ามมุมฉากเรียกว่า ด้านฉาก หรือ ไฮโปเทนิวส์ (hypotenuse) นิยามนี้ตรงกับวงกลมหนึ่งหน่วยเมื่อด้านฉากยาว 1

Right-triangle ratios (SOH-CAH-TOA) อัตราส่วนในสามเหลี่ยมมุมฉาก

$$\begin{gathered} \sin\theta = \frac{\text{opp}}{\text{hyp}} \\ \cos\theta = \frac{\text{adj}}{\text{hyp}} \\ \tan\theta = \frac{\text{opp}}{\text{adj}} \end{gathered}$$

ภาษาไทยจำว่า sin = ข้าม/ฉาก, cos = ชิด/ฉาก, tan = ข้าม/ชิด

Reciprocal identities เอกลักษณ์ส่วนกลับ

$$\begin{gathered} \csc\theta = \frac{1}{\sin\theta} \\ \sec\theta = \frac{1}{\cos\theta} \\ \cot\theta = \frac{1}{\tan\theta} \end{gathered}$$

cosecant, secant, cotangent · คู่ที่มี “co” จับคู่กับตัวที่ไม่มี co

Quotient identities เอกลักษณ์ผลหาร

$$\begin{gathered} \tan\theta = \frac{\sin\theta}{\cos\theta} \\ \cot\theta = \frac{\cos\theta}{\sin\theta} \end{gathered}$$

Slope interpretation tan คือความชัน

$$m = \tan\theta$$

เส้นตรงที่ทำมุม θ กับแกน x มีความชัน tan θ และ tan θ ยังเป็นความยาวเส้นสัมผัสวงกลมที่ x = 1 (ดูเส้นสีเขียวในรูปวงกลม)

### โดเมน เรนจ์ และคาบ (Domain, Range, Period)

| ฟังก์ชัน | โดเมน | เรนจ์ | คาบ | คู่/คี่ |

| $\sin\theta$ | $\mathbb{R}$ | $[-1, 1]$ | $2\pi$ | คี่ (odd) |

| $\cos\theta$ | $\mathbb{R}$ | $[-1, 1]$ | $2\pi$ | คู่ (even) |

| $\tan\theta$ | $\theta \ne \tfrac{\pi}{2} + k\pi$ | $\mathbb{R}$ | $\pi$ | คี่ |

| $\csc\theta$ | $\theta \ne k\pi$ | $(-\infty,-1] \cup [1,\infty)$ | $2\pi$ | คี่ |

| $\sec\theta$ | $\theta \ne \tfrac{\pi}{2} + k\pi$ | $(-\infty,-1] \cup [1,\infty)$ | $2\pi$ | คู่ |

| $\cot\theta$ | $\theta \ne k\pi$ | $\mathbb{R}$ | $\pi$ | คี่ |

## ค่าตรีโกณมิติของมุมพิเศษ (Exact Values of Special Angles)

The √n / 2 pattern เทคนิคจำมุม 0° 30° 45° 60° 90°

$$\begin{gathered} \sin\theta:\ \frac{\sqrt0}{2},\ \frac{\sqrt1}{2},\ \frac{\sqrt2}{2},\ \frac{\sqrt3}{2},\ \frac{\sqrt4}{2} \\ \cos\theta:\ \text{ลำดับเดียวกันแต่กลับหลัง} \end{gathered}$$

มาจากสามเหลี่ยมมุมฉากสองแบบ คือ 45-45-90 ด้าน $1 : 1 : \sqrt2$ และ 30-60-90 ด้าน $1 : \sqrt3 : 2$

| θ | เรเดียน | sin θ | cos θ | tan θ |

| 0° | $0$ | $0$ | $1$ | $0$ |

| 15° | $\tfrac{\pi}{12}$ | $\tfrac{\sqrt6-\sqrt2}{4}$ | $\tfrac{\sqrt6+\sqrt2}{4}$ | $2-\sqrt3$ |

| 18° | $\tfrac{\pi}{10}$ | $\tfrac{\sqrt5-1}{4}$ | $\tfrac{\sqrt{10+2\sqrt5}}{4}$ | $\tfrac{\sqrt{25-10\sqrt5}}{5}$ |

| 22.5° | $\tfrac{\pi}{8}$ | $\tfrac{\sqrt{2-\sqrt2}}{2}$ | $\tfrac{\sqrt{2+\sqrt2}}{2}$ | $\sqrt2-1$ |

| 30° | $\tfrac{\pi}{6}$ | $\tfrac12$ | $\tfrac{\sqrt3}{2}$ | $\tfrac{\sqrt3}{3}$ |

| 36° | $\tfrac{\pi}{5}$ | $\tfrac{\sqrt{10-2\sqrt5}}{4}$ | $\tfrac{1+\sqrt5}{4}$ | $\sqrt{5-2\sqrt5}$ |

| 45° | $\tfrac{\pi}{4}$ | $\tfrac{\sqrt2}{2}$ | $\tfrac{\sqrt2}{2}$ | $1$ |

| 54° | $\tfrac{3\pi}{10}$ | $\tfrac{1+\sqrt5}{4}$ | $\tfrac{\sqrt{10-2\sqrt5}}{4}$ | $\tfrac{\sqrt{25+10\sqrt5}}{5}$ |

| 60° | $\tfrac{\pi}{3}$ | $\tfrac{\sqrt3}{2}$ | $\tfrac12$ | $\sqrt3$ |

| 67.5° | $\tfrac{3\pi}{8}$ | $\tfrac{\sqrt{2+\sqrt2}}{2}$ | $\tfrac{\sqrt{2-\sqrt2}}{2}$ | $\sqrt2+1$ |

| 72° | $\tfrac{2\pi}{5}$ | $\tfrac{\sqrt{10+2\sqrt5}}{4}$ | $\tfrac{\sqrt5-1}{4}$ | $\sqrt{5+2\sqrt5}$ |

| 75° | $\tfrac{5\pi}{12}$ | $\tfrac{\sqrt6+\sqrt2}{4}$ | $\tfrac{\sqrt6-\sqrt2}{4}$ | $2+\sqrt3$ |

| 90° | $\tfrac{\pi}{2}$ | $1$ | $0$ | ไม่นิยาม |

ค่า $\cos 36^\circ = \tfrac{1+\sqrt5}{4} = \tfrac{\varphi}{2}$ เมื่อ $\varphi$ คืออัตราส่วนทองคำ (golden ratio) มุม 18°, 36°, 54°, 72° จึงพบในรูปห้าเหลี่ยมด้านเท่า

### ส่วนกลับของมุมหลัก (csc, sec, cot)

| θ | csc θ | sec θ | cot θ |

| 0° | ไม่นิยาม | $1$ | ไม่นิยาม |

| 30° | $2$ | $\tfrac{2\sqrt3}{3}$ | $\sqrt3$ |

| 45° | $\sqrt2$ | $\sqrt2$ | $1$ |

| 60° | $\tfrac{2\sqrt3}{3}$ | $2$ | $\tfrac{\sqrt3}{3}$ |

| 90° | $1$ | ไม่นิยาม | $0$ |

### รอบวงกลม 0° ถึง 360°

| θ | rad | จตุภาค | sin θ | cos θ | tan θ |

| 0° | $0$ | แกน +x | $0$ | $1$ | $0$ |

| 30° | $\tfrac{\pi}{6}$ | I | $\tfrac12$ | $\tfrac{\sqrt3}{2}$ | $\tfrac{\sqrt3}{3}$ |

| 45° | $\tfrac{\pi}{4}$ | I | $\tfrac{\sqrt2}{2}$ | $\tfrac{\sqrt2}{2}$ | $1$ |

| 60° | $\tfrac{\pi}{3}$ | I | $\tfrac{\sqrt3}{2}$ | $\tfrac12$ | $\sqrt3$ |

| 90° | $\tfrac{\pi}{2}$ | แกน +y | $1$ | $0$ | ไม่นิยาม |

| 120° | $\tfrac{2\pi}{3}$ | II | $\tfrac{\sqrt3}{2}$ | $-\tfrac12$ | $-\sqrt3$ |

| 135° | $\tfrac{3\pi}{4}$ | II | $\tfrac{\sqrt2}{2}$ | $-\tfrac{\sqrt2}{2}$ | $-1$ |

| 150° | $\tfrac{5\pi}{6}$ | II | $\tfrac12$ | $-\tfrac{\sqrt3}{2}$ | $-\tfrac{\sqrt3}{3}$ |

| 180° | $\pi$ | แกน −x | $0$ | $-1$ | $0$ |

| 210° | $\tfrac{7\pi}{6}$ | III | $-\tfrac12$ | $-\tfrac{\sqrt3}{2}$ | $\tfrac{\sqrt3}{3}$ |

| 225° | $\tfrac{5\pi}{4}$ | III | $-\tfrac{\sqrt2}{2}$ | $-\tfrac{\sqrt2}{2}$ | $1$ |

| 240° | $\tfrac{4\pi}{3}$ | III | $-\tfrac{\sqrt3}{2}$ | $-\tfrac12$ | $\sqrt3$ |

| 270° | $\tfrac{3\pi}{2}$ | แกน −y | $-1$ | $0$ | ไม่นิยาม |

| 300° | $\tfrac{5\pi}{3}$ | IV | $-\tfrac{\sqrt3}{2}$ | $\tfrac12$ | $-\sqrt3$ |

| 315° | $\tfrac{7\pi}{4}$ | IV | $-\tfrac{\sqrt2}{2}$ | $\tfrac{\sqrt2}{2}$ | $-1$ |

| 330° | $\tfrac{11\pi}{6}$ | IV | $-\tfrac12$ | $\tfrac{\sqrt3}{2}$ | $-\tfrac{\sqrt3}{3}$ |

| 360° | $2\pi$ | แกน +x | $0$ | $1$ | $0$ |

## เอกลักษณ์พีทาโกรัส (Pythagorean Identities)

จุด $(\cos\theta, \sin\theta)$ อยู่บนวงกลม $x^2 + y^2 = 1$ เสมอ จึงได้เอกลักษณ์ตัวแรกทันที อีกสองตัวได้จากการหารด้วย $\cos^2\theta$ และ $\sin^2\theta$

Pythagorean identity เอกลักษณ์พีทาโกรัส

$$\sin^2\theta + \cos^2\theta = 1$$

Tangent–secant form รูป tan กับ sec

$$1 + \tan^2\theta = \sec^2\theta$$

Cotangent–cosecant form รูป cot กับ csc

$$1 + \cot^2\theta = \csc^2\theta$$

Expressing one function by another เขียนฟังก์ชันหนึ่งด้วยอีกฟังก์ชัน

$$\begin{gathered} \sin\theta = \pm\sqrt{1-\cos^2\theta} = \pm\frac{\tan\theta}{\sqrt{1+\tan^2\theta}} \\ \cos\theta = \pm\sqrt{1-\sin^2\theta} = \pm\frac{1}{\sqrt{1+\tan^2\theta}} \end{gathered}$$

เลือกเครื่องหมายตามจตุภาคของ θ

## สมมาตร คาบ และโคฟังก์ชัน (Symmetry, Periodicity, Cofunctions)

Even–odd identities เอกลักษณ์ฟังก์ชันคู่-คี่

$$\begin{gathered} \sin(-\theta) = -\sin\theta \\ \cos(-\theta) = \cos\theta \\ \tan(-\theta) = -\tan\theta \end{gathered}$$

cos และ sec เป็นฟังก์ชันคู่ ที่เหลือเป็นฟังก์ชันคี่

Periodicity identities เอกลักษณ์คาบ

$$\begin{gathered} \sin(\theta + 2\pi k) = \sin\theta \\ \cos(\theta + 2\pi k) = \cos\theta \\ \tan(\theta + \pi k) = \tan\theta \end{gathered}$$

Cofunction identities เอกลักษณ์โคฟังก์ชัน (มุมประกอบสองมุมฉาก)

$$\begin{gathered} \sin\!\left(\tfrac{\pi}{2} - \theta\right) = \cos\theta \\ \tan\!\left(\tfrac{\pi}{2} - \theta\right) = \cot\theta \\ \sec\!\left(\tfrac{\pi}{2} - \theta\right) = \csc\theta \end{gathered}$$

คำว่า co-sine มาจาก complement’s sine คือ sine ของมุมที่เหลือ เช่น cos 70° = sin 20°

Supplementary-angle identities มุมรวมกันได้ 180°

$$\begin{gathered} \sin(\pi - \theta) = \sin\theta \\ \cos(\pi - \theta) = -\cos\theta \\ \tan(\pi - \theta) = -\tan\theta \end{gathered}$$

Quarter-period shifts การเลื่อนเฟส 90° และ 180°

$$\begin{gathered} \sin\!\left(\theta + \tfrac{\pi}{2}\right) = \cos\theta \\ \cos\!\left(\theta + \tfrac{\pi}{2}\right) = -\sin\theta \\ \sin(\theta + \pi) = -\sin\theta \\ \cos(\theta + \pi) = -\cos\theta \end{gathered}$$

ในวงจรไฟฟ้า cos นำหน้า (lead) sin อยู่ 90° กระแสในตัวเก็บประจุจึงนำแรงดัน 90° เพราะ $\tfrac{d}{dt}\sin\omega t = \omega\cos\omega t$

### ตารางลดมุม (Reduction Formulas)

กฎจำ: มุม $\pi \pm \theta$ และ $2\pi - \theta$ ชื่อฟังก์ชันคงเดิม ส่วนมุม $\tfrac{\pi}{2} \pm \theta$ และ $\tfrac{3\pi}{2} \pm \theta$ เปลี่ยนเป็นโคฟังก์ชัน แล้วใส่เครื่องหมายตามจตุภาคของมุมเดิมโดยถือว่า θ เป็นมุมแหลม

| มุม | sin | cos | tan |

| $-\theta$ | $-\sin\theta$ | $\cos\theta$ | $-\tan\theta$ |

| $\tfrac{\pi}{2} - \theta$ | $\cos\theta$ | $\sin\theta$ | $\cot\theta$ |

| $\tfrac{\pi}{2} + \theta$ | $\cos\theta$ | $-\sin\theta$ | $-\cot\theta$ |

| $\pi - \theta$ | $\sin\theta$ | $-\cos\theta$ | $-\tan\theta$ |

| $\pi + \theta$ | $-\sin\theta$ | $-\cos\theta$ | $\tan\theta$ |

| $\tfrac{3\pi}{2} - \theta$ | $-\cos\theta$ | $-\sin\theta$ | $\cot\theta$ |

| $\tfrac{3\pi}{2} + \theta$ | $-\cos\theta$ | $\sin\theta$ | $-\cot\theta$ |

| $2\pi - \theta$ | $-\sin\theta$ | $\cos\theta$ | $-\tan\theta$ |

## สูตรผลบวกและผลต่างของมุม (Angle Sum and Difference)

สูตรกลุ่มนี้เป็นแม่บทของสูตรมุมสองเท่า ครึ่งมุม และผลคูณเป็นผลบวก จำสูตร sin กับ cos ให้ได้ก่อน สูตรอื่นแปลงตามมาได้

Sine of a sum / difference sin ของผลบวกและผลต่าง

$$\sin(A \pm B) = \sin A\cos B \pm \cos A\sin B$$

Cosine of a sum / difference cos ของผลบวกและผลต่าง

$$\cos(A \pm B) = \cos A\cos B \mp \sin A\sin B$$

สังเกตเครื่องหมายกลับ: cos ของผลบวกได้ “ลบ”

Tangent of a sum / difference tan ของผลบวกและผลต่าง

$$\tan(A \pm B) = \frac{\tan A \pm \tan B}{1 \mp \tan A\tan B}$$

Cotangent of a sum / difference cot ของผลบวกและผลต่าง

$$\cot(A \pm B) = \frac{\cot A\cot B \mp 1}{\cot B \pm \cot A}$$

Difference-of-squares forms รูปผลต่างกำลังสอง

$$\begin{gathered} \sin(A+B)\sin(A-B) = \sin^2 A - \sin^2 B \\ \cos(A+B)\cos(A-B) = \cos^2 A - \sin^2 B \end{gathered}$$

มาจากไหน: หมุนเวกเตอร์ $(\cos B, \sin B)$ ไปอีกมุม A ด้วยเมทริกซ์การหมุน $\begin{bmatrix} \cos A & -\sin A \\ \sin A & \cos A \end{bmatrix}$ จะได้จุด $(\cos(A+B), \sin(A+B))$ คูณเมทริกซ์ออกมาก็ได้สองสูตรแรกพร้อมกัน หรือใช้ $e^{j(A+B)} = e^{jA}e^{jB}$ ในหัวข้อสูตรของออยเลอร์

ตัวอย่างที่ 1

### หาค่าแม่นตรงของ $\sin 75^\circ$

ดูวิธีทำ

$$\begin{aligned} \sin 75^\circ &= \sin(45^\circ + 30^\circ) \\ &= \sin45^\circ\cos30^\circ + \cos45^\circ\sin30^\circ \\ &= \frac{\sqrt2}{2}\cdot\frac{\sqrt3}{2} + \frac{\sqrt2}{2}\cdot\frac12 = \frac{\sqrt6 + \sqrt2}{4} \end{aligned}$$

$\sin 75^\circ = \tfrac{\sqrt6+\sqrt2}{4} \approx 0.965926$ ตรงกับแถว 75.00° ในตารางท้ายหน้า

## สูตรมุมสองเท่า (Double-Angle Formulas)

แทน $B = A$ ในสูตรผลบวกของมุม

Sine double-angle sin มุมสองเท่า

$$\sin 2\theta = 2\sin\theta\cos\theta = \frac{2\tan\theta}{1+\tan^2\theta}$$

Tangent double-angle tan มุมสองเท่า

$$\tan 2\theta = \frac{2\tan\theta}{1-\tan^2\theta}$$

Cosine double-angle (three forms) cos มุมสองเท่า มีสามรูป

$$\begin{aligned} \cos 2\theta &= \cos^2\theta - \sin^2\theta \\ &= 2\cos^2\theta - 1 \\ &= 1 - 2\sin^2\theta \\ &= \frac{1-\tan^2\theta}{1+\tan^2\theta} \end{aligned}$$

เลือกรูปที่ทำให้เหลือฟังก์ชันเดียว จะช่วยให้แก้สมการหรืออินทิเกรตง่ายขึ้น

## สูตรมุมสามเท่าและมุมหลายเท่า (Triple- and Multiple-Angle)

Sine triple-angle sin มุมสามเท่า

$$\sin 3\theta = 3\sin\theta - 4\sin^3\theta$$

Cosine triple-angle cos มุมสามเท่า

$$\cos 3\theta = 4\cos^3\theta - 3\cos\theta$$

Tangent triple-angle tan มุมสามเท่า

$$\tan 3\theta = \frac{3\tan\theta - \tan^3\theta}{1 - 3\tan^2\theta}$$

Chebyshev recurrence สูตรเวียนเกิดของมุมหลายเท่า

$$\cos(n+1)\theta = 2\cos\theta\,\cos n\theta - \cos(n-1)\theta$$

$\cos n\theta = T_n(\cos\theta)$ เป็นพหุนามเชบีเชฟ ใช้ออกแบบวงกรองแบบเชบีเชฟ

## สูตรครึ่งมุม (Half-Angle Formulas)

แก้สูตร $\cos 2x$ กลับหา $\sin x$ และ $\cos x$ แล้วแทน $x = \theta/2$ เครื่องหมาย ± ให้เลือกตามจตุภาคของ $\theta/2$ ไม่ใช่ของ θ

Sine half-angle sin ครึ่งมุม

$$\sin\frac{\theta}{2} = \pm\sqrt{\frac{1-\cos\theta}{2}}$$

Cosine half-angle cos ครึ่งมุม

$$\cos\frac{\theta}{2} = \pm\sqrt{\frac{1+\cos\theta}{2}}$$

Tangent half-angle tan ครึ่งมุม

$$\begin{aligned} \tan\frac{\theta}{2} &= \pm\sqrt{\frac{1-\cos\theta}{1+\cos\theta}} \\ &= \frac{\sin\theta}{1+\cos\theta} = \frac{1-\cos\theta}{\sin\theta} \end{aligned}$$

สองรูปหลังไม่มี ± ให้กังวล ใช้สะดวกกว่า

ตัวอย่างที่ 2

### หา $\cos 22.5^\circ$ จากสูตรครึ่งมุม

ดูวิธีทำ

$$\cos 22.5^\circ = \cos\frac{45^\circ}{2} = +\sqrt{\frac{1 + \tfrac{\sqrt2}{2}}{2}} = \frac{\sqrt{2+\sqrt2}}{2}$$

22.5° อยู่จตุภาคที่ 1 จึงเลือกเครื่องหมายบวก ได้ $\approx 0.923880$

## สูตรลดกำลัง (Power-Reduction Formulas)

เปลี่ยนกำลังสองหรือกำลังสูงให้เป็นผลบวกของ cos มุมหลายเท่าที่มีกำลังหนึ่ง จำเป็นมากเวลาอินทิเกรต หาค่า RMS และหาส่วนประกอบฮาร์มอนิก (ดูการใช้งานจริงใน อ่านสัมประสิทธิ์ฟูเรียร์จาก sin³ และ cos²)

Square of sine sin กำลังสอง

$$\sin^2\theta = \frac{1-\cos 2\theta}{2}$$

Square of cosine cos กำลังสอง

$$\cos^2\theta = \frac{1+\cos 2\theta}{2}$$

Square of tangent tan กำลังสอง

$$\tan^2\theta = \frac{1-\cos 2\theta}{1+\cos 2\theta}$$

Product of squares ผลคูณกำลังสอง

$$\sin^2\theta\cos^2\theta = \frac{1-\cos 4\theta}{8}$$

Cube of sine sin กำลังสาม

$$\sin^3\theta = \frac{3\sin\theta - \sin 3\theta}{4}$$

Cube of cosine cos กำลังสาม

$$\cos^3\theta = \frac{3\cos\theta + \cos 3\theta}{4}$$

Fourth power of sine sin กำลังสี่

$$\sin^4\theta = \frac{3 - 4\cos 2\theta + \cos 4\theta}{8}$$

Fourth power of cosine cos กำลังสี่

$$\cos^4\theta = \frac{3 + 4\cos 2\theta + \cos 4\theta}{8}$$

มุมมองวิศวกร: $\cos^3\omega t = \tfrac34\cos\omega t + \tfrac14\cos 3\omega t$ บอกว่าอุปกรณ์ที่ไม่เป็นเชิงเส้นแบบกำลังสาม สร้างฮาร์มอนิกที่ 3 ออกมาด้วยแอมพลิจูดหนึ่งในสี่ (ดู สมมาตรของความไม่เป็นเชิงเส้น)

## ผลคูณเป็นผลบวก (Product-to-Sum Formulas)

ได้จากการบวกหรือลบสูตรผลบวกและผลต่างของมุม หลักการของวงจรผสมสัญญาณ (mixer) และการมอดูเลตแอมพลิจูด (AM)

Product of cosines ผลคูณ cos กับ cos

$$\cos A\cos B = \tfrac12\left[\cos(A-B) + \cos(A+B)\right]$$

Product of sines ผลคูณ sin กับ sin

$$\sin A\sin B = \tfrac12\left[\cos(A-B) - \cos(A+B)\right]$$

Sine–cosine product ผลคูณ sin กับ cos

$$\sin A\cos B = \tfrac12\left[\sin(A+B) + \sin(A-B)\right]$$

Cosine–sine product ผลคูณ cos กับ sin

$$\cos A\sin B = \tfrac12\left[\sin(A+B) - \sin(A-B)\right]$$

ตัวอย่างที่ 3

### มิกเซอร์คูณสัญญาณ 1000 Hz กับ 100 Hz ได้ความถี่อะไร

ดูวิธีทำ

$$\begin{aligned} &\cos(2\pi\cdot1000t)\cos(2\pi\cdot100t) \\ &\quad = \tfrac12\cos(2\pi\cdot900t) + \tfrac12\cos(2\pi\cdot1100t) \end{aligned}$$

ได้ความถี่ผลต่าง 900 Hz และผลบวก 1100 Hz แอมพลิจูดตัวละครึ่งหนึ่ง เรียกว่าแถบข้าง (sidebands) ไม่มี 1000 Hz หรือ 100 Hz เหลืออยู่เลย

## ผลบวกเป็นผลคูณ (Sum-to-Product Formulas)

ทิศกลับของหัวข้อก่อน ใช้แยกตัวประกอบสมการตรีโกณ และอธิบายปรากฏการณ์บีต (beats) เมื่อคลื่นสองความถี่ใกล้กันรวมกัน

Sum of sines ผลบวกของ sin

$$\sin A + \sin B = 2\sin\frac{A+B}{2}\cos\frac{A-B}{2}$$

Difference of sines ผลต่างของ sin

$$\sin A - \sin B = 2\cos\frac{A+B}{2}\sin\frac{A-B}{2}$$

Sum of cosines ผลบวกของ cos (ใช้อธิบายบีต)

$$\cos A + \cos B = 2\cos\frac{A+B}{2}\cos\frac{A-B}{2}$$

Difference of cosines ผลต่างของ cos

$$\cos A - \cos B = -2\sin\frac{A+B}{2}\sin\frac{A-B}{2}$$

Sum of tangents ผลบวกของ tan

$$\tan A \pm \tan B = \frac{\sin(A \pm B)}{\cos A\cos B}$$

## การรวมไซน์และโคไซน์เป็นคลื่นเดียว (Harmonic Addition)

ไซน์และโคไซน์ความถี่เดียวกันรวมกันได้คลื่นไซน์ตัวเดียวเสมอ ในตำราบางเล่มเรียกว่า R-formula หรือ auxiliary angle method เป็นพื้นฐานของเฟเซอร์ (phasor) ในวงจรไฟฟ้ากระแสสลับ

Harmonic addition theorem รวมเป็นไซน์ตัวเดียว

$$\begin{gathered} a\sin\theta + b\cos\theta = R\sin(\theta + \varphi) \\ R = \sqrt{a^2 + b^2} \\ \varphi = \operatorname{atan2}(b, a) \end{gathered}$$

นั่นคือ $\cos\varphi = a/R$ และ $\sin\varphi = b/R$ ค่ามากสุดของนิพจน์คือ R และน้อยสุดคือ −R

Cosine form เขียนเป็น cos

$$\begin{gathered} a\cos\theta + b\sin\theta = R\cos(\theta - \varphi) \\ R = \sqrt{a^2 + b^2} \\ \varphi = \operatorname{atan2}(b, a) \end{gathered}$$

ตัวอย่างที่ 4

### เขียน $3\sin\omega t + 4\cos\omega t$ เป็นคลื่นไซน์ตัวเดียว

ดูวิธีทำ

$$\begin{gathered} R = \sqrt{3^2 + 4^2} = 5 \\ \varphi = \operatorname{atan2}(4, 3) = \arctan\tfrac43 \approx 53.13^\circ \end{gathered}$$

$3\sin\omega t + 4\cos\omega t = 5\sin(\omega t + 53.13^\circ)$ ค่ายอด 5 นำหน้า sin อยู่ 53.13° เทียบกับเฟเซอร์ $3 + j4 = 5\angle 53.13^\circ$

## การแทนค่า t = tan(θ/2) (Weierstrass Substitution)

เปลี่ยนฟังก์ชันตรีโกณทุกตัวเป็นฟังก์ชันตรรกยะของตัวแปรเดียว จึงอินทิเกรตด้วยเศษส่วนย่อยได้ เรียกอีกชื่อว่า tangent half-angle substitution

Weierstrass substitution แทนค่าด้วย t = tan(θ/2)

$$\begin{gathered} \sin\theta = \frac{2t}{1+t^2} \\ \cos\theta = \frac{1-t^2}{1+t^2} \\ \tan\theta = \frac{2t}{1-t^2} \\ d\theta = \frac{2\,dt}{1+t^2} \end{gathered}$$

ใช้กับปริพันธ์อย่าง $\int \frac{d\theta}{a + b\cos\theta}$ และเป็นที่มาของการแปลงไบลิเนียร์ (bilinear / Tustin) ในการออกแบบตัวกรองดิจิทัล ซึ่งมีการบิดความถี่ $\omega_a = \tfrac{2}{T}\tan\tfrac{\omega_d T}{2}$

## สูตรของออยเลอร์และจำนวนเชิงซ้อน (Euler’s Formula)

สะพานเชื่อมตรีโกณมิติกับเลขชี้กำลัง วิศวกรไฟฟ้าใช้ $j = \sqrt{-1}$ แทน i เพราะ i ใช้แทนกระแสไฟฟ้า สูตรเกือบทุกตัวในหน้านี้พิสูจน์ได้ในบรรทัดเดียวด้วยสูตรนี้

Euler’s formula สูตรของออยเลอร์

$$\begin{gathered} e^{j\theta} = \cos\theta + j\sin\theta \\ e^{j\pi} + 1 = 0 \end{gathered}$$

Exponential forms รูปเลขชี้กำลังของ sin และ cos

$$\begin{gathered} \cos\theta = \frac{e^{j\theta} + e^{-j\theta}}{2} \\ \sin\theta = \frac{e^{j\theta} - e^{-j\theta}}{2j} \end{gathered}$$

De Moivre’s theorem ทฤษฎีบทของเดอมัวฟร์

$$(\cos\theta + j\sin\theta)^n = \cos n\theta + j\sin n\theta$$

Polar form รูปเชิงขั้วของจำนวนเชิงซ้อน

$$\begin{gathered} x + jy = r e^{j\theta} = r\angle\theta \\ r = \sqrt{x^2+y^2} \\ \theta = \operatorname{atan2}(y, x) \end{gathered}$$

Link to hyperbolic functions เชื่อมกับฟังก์ชันไฮเพอร์โบลิก

$$\begin{gathered} \cos(jx) = \cosh x \\ \sin(jx) = j\sinh x \\ \cosh^2x - \sinh^2x = 1 \end{gathered}$$

พิสูจน์สูตรผลบวกในบรรทัดเดียว: $e^{j(A+B)} = e^{jA}e^{jB} = (\cos A + j\sin A)(\cos B + j\sin B)$ กระจายแล้วเทียบส่วนจริงได้ $\cos(A+B)$ เทียบส่วนจินตภาพได้ $\sin(A+B)$

## ฟังก์ชันตรีโกณมิติผกผัน (Inverse Trigonometric Functions)

ฟังก์ชันตรีโกณไม่ใช่ฟังก์ชันหนึ่งต่อหนึ่ง จึงต้องจำกัดช่วงก่อนหาตัวผกผัน ช่วงที่เลือกนี้เรียกว่า ค่าหลัก (principal value) เครื่องคิดเลขตอบค่าหลักเสมอ

| ฟังก์ชัน | ชื่ออังกฤษ | โดเมน | เรนจ์ (ค่าหลัก) |

| $\arcsin x = \sin^{-1}x$ | arcsine | $[-1, 1]$ | $[-\tfrac{\pi}{2}, \tfrac{\pi}{2}]$ |

| $\arccos x = \cos^{-1}x$ | arccosine | $[-1, 1]$ | $[0, \pi]$ |

| $\arctan x = \tan^{-1}x$ | arctangent | $\mathbb{R}$ | $(-\tfrac{\pi}{2}, \tfrac{\pi}{2})$ |

| $\operatorname{arccot} x$ | arccotangent | $\mathbb{R}$ | $(0, \pi)$ |

| $\operatorname{arcsec} x$ | arcsecant | $|x| \ge 1$ | $[0, \pi],\ \ne \tfrac{\pi}{2}$ |

| $\operatorname{arccsc} x$ | arccosecant | $|x| \ge 1$ | $[-\tfrac{\pi}{2}, \tfrac{\pi}{2}],\ \ne 0$ |

ระวัง: $\sin^{-1}x$ คือ arcsin ไม่ใช่ $1/\sin x$ ซึ่งคือ csc x

Complementary identities ผลบวกเป็นมุมฉาก

$$\begin{gathered} \arcsin x + \arccos x = \frac{\pi}{2} \\ \arctan x + \operatorname{arccot} x = \frac{\pi}{2} \end{gathered}$$

Reciprocal argument อาร์กิวเมนต์ส่วนกลับ

$$\arctan x + \arctan\frac1x = \begin{cases} \tfrac{\pi}{2} & x \gt 0 \\ -\tfrac{\pi}{2} & x \lt 0 \end{cases}$$

Negative arguments อาร์กิวเมนต์ติดลบ

$$\begin{gathered} \arcsin(-x) = -\arcsin x \\ \arctan(-x) = -\arctan x \\ \arccos(-x) = \pi - \arccos x \end{gathered}$$

Arctangent addition ผลบวกของ arctan

$$\begin{gathered} \arctan a + \arctan b = \arctan\frac{a+b}{1-ab} \\ (ab \lt 1) \end{gathered}$$

Compositions ฟังก์ชันประกอบ (วาดสามเหลี่ยมมุมฉากช่วยคิด)

$$\begin{gathered} \sin(\arccos x) = \cos(\arcsin x) = \sqrt{1-x^2} \\ \tan(\arcsin x) = \frac{x}{\sqrt{1-x^2}} \\ \sin(\arctan x) = \frac{x}{\sqrt{1+x^2}} \\ \cos(\arctan x) = \frac{1}{\sqrt{1+x^2}} \end{gathered}$$

Two-argument arctangent (atan2) arctan สองอาร์กิวเมนต์

$$\operatorname{atan2}(y, x) = \begin{cases} \arctan\frac{y}{x} & x \gt 0 \\ \arctan\frac{y}{x} + \pi & x \lt 0,\ y \ge 0 \\ \arctan\frac{y}{x} - \pi & x \lt 0,\ y \lt 0 \\ \pm\frac{\pi}{2} & x = 0,\ y \gtrless 0 \end{cases}$$

มุมเฟสของ $-1 - j$ คือ $\operatorname{atan2}(-1, -1) = -135^\circ$ ไม่ใช่ $\arctan(1) = 45^\circ$ ที่เครื่องคิดเลขตอบ

### ผลเฉลยทั่วไปของสมการตรีโกณ (General Solutions)

General solutions ผลเฉลยทุกค่า ($n \in \mathbb{Z}$)

$$\begin{gathered} \sin\theta = \sin\alpha \Rightarrow \theta = n\pi + (-1)^n\alpha \\ \cos\theta = \cos\alpha \Rightarrow \theta = 2n\pi \pm \alpha \\ \tan\theta = \tan\alpha \Rightarrow \theta = n\pi + \alpha \end{gathered}$$

ตัวอย่างที่ 5

### หา θ ทั้งหมดใน $[0, 2\pi)$ ที่ทำให้ $\sin\theta = -\tfrac12$

ดูวิธีทำ

มุมอ้างอิงคือ $\arcsin\tfrac12 = \tfrac{\pi}{6}$ และ sin ติดลบในจตุภาคที่ 3 กับ 4

$$\begin{gathered} \theta = \pi + \frac{\pi}{6} = \frac{7\pi}{6} \\ \theta = 2\pi - \frac{\pi}{6} = \frac{11\pi}{6} \end{gathered}$$

$\theta = \tfrac{7\pi}{6}$ (210°) และ $\tfrac{11\pi}{6}$ (330°) ส่วนเครื่องคิดเลขตอบ $\arcsin(-\tfrac12) = -30^\circ$ ซึ่งเป็นมุมร่วมแขนกับ 330°

## กฎของสามเหลี่ยมใด ๆ (Laws for Any Triangle)

ใช้กับสามเหลี่ยมทั่วไปที่ไม่จำเป็นต้องมีมุมฉาก ให้ด้าน a, b, c อยู่ตรงข้ามมุม A, B, C ตามลำดับ

Law of sines กฎของไซน์

$$\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C} = 2R$$

R คือรัศมีวงกลมล้อมรอบ (circumradius)

Law of cosines กฎของโคไซน์

$$\begin{gathered} c^2 = a^2 + b^2 - 2ab\cos C \\ \cos C = \frac{a^2 + b^2 - c^2}{2ab} \end{gathered}$$

เมื่อ C = 90° จะลดเป็นทฤษฎีบทพีทาโกรัส

Law of tangents กฎของแทนเจนต์

$$\frac{a-b}{a+b} = \frac{\tan\frac{A-B}{2}}{\tan\frac{A+B}{2}}$$

Projection formula สูตรภาพฉาย

$$a = b\cos C + c\cos B$$

Area (SAS) พื้นที่จากสองด้านกับมุมระหว่าง

$$\text{Area} = \tfrac12 ab\sin C$$

Heron’s formula สูตรของเฮรอน

$$\begin{gathered} \text{Area} = \sqrt{s(s-a)(s-b)(s-c)} \\ s = \tfrac{a+b+c}{2} \end{gathered}$$

Triangle identities เมื่อ $A + B + C = \pi$

$$\begin{gathered} \tan A + \tan B + \tan C = \tan A\tan B\tan C \\ \sin 2A + \sin 2B + \sin 2C = 4\sin A\sin B\sin C \end{gathered}$$

ตัวอย่างที่ 6

### สามเหลี่ยมมี a = 7, b = 8 และมุมระหว่างสองด้าน C = 60° หาด้าน c

ดูวิธีทำ

$$\begin{aligned} c^2 &= 7^2 + 8^2 - 2(7)(8)\cos60^\circ \\ &= 49 + 64 - 56 = 57 \end{aligned}$$

$c = \sqrt{57} \approx 7.550$ หน่วย ใช้แบบเดียวกันรวมแรงหรือเฟเซอร์สองตัวที่ทำมุมกัน

## อนุพันธ์ ปริพันธ์ และลิมิต (Calculus of Trigonometric Functions)

ทุกสูตรในหัวข้อนี้ใช้ได้เมื่อ x เป็นเรเดียนเท่านั้น ถ้าใช้องศาต้องคูณ $\tfrac{\pi}{180}$ เพิ่ม ดูต่อได้ในบทแคลคูลัสเบื้องต้น และวิธีอินทิเกรตทีละขั้นอยู่ในบทอินทิกรัล

Fundamental trigonometric limits ลิมิตพื้นฐาน

$$\begin{gathered} \lim_{x\to0}\frac{\sin x}{x} = 1 \\ \lim_{x\to0}\frac{1-\cos x}{x} = 0 \\ \lim_{x\to0}\frac{1-\cos x}{x^2} = \frac12 \end{gathered}$$

Derivatives อนุพันธ์

$$\begin{aligned} (\sin x)' &= \cos x & (\cos x)' &= -\sin x \\ (\tan x)' &= \sec^2 x & (\cot x)' &= -\csc^2 x \\ (\sec x)' &= \sec x\tan x & (\csc x)' &= -\csc x\cot x \end{aligned}$$

Derivatives of inverse functions อนุพันธ์ของฟังก์ชันผกผัน

$$\begin{gathered} (\arcsin x)' = \frac{1}{\sqrt{1-x^2}} \\ (\arccos x)' = -\frac{1}{\sqrt{1-x^2}} \\ (\arctan x)' = \frac{1}{1+x^2} \end{gathered}$$

Basic integrals ปริพันธ์พื้นฐาน (ละ + C)

$$\begin{aligned} \int\sin x\,dx &= -\cos x \\ \int\cos x\,dx &= \sin x \\ \int\tan x\,dx &= \ln|\sec x| \\ \int\cot x\,dx &= \ln|\sin x| \\ \int\sec x\,dx &= \ln|\sec x + \tan x| \\ \int\csc x\,dx &= -\ln|\csc x + \cot x| \\ \int\sec^2 x\,dx &= \tan x \\ \int\csc^2 x\,dx &= -\cot x \end{aligned}$$

Integrals of squares ปริพันธ์ของกำลังสอง

$$\begin{gathered} \int\sin^2 x\,dx = \frac{x}{2} - \frac{\sin 2x}{4} \\ \int\cos^2 x\,dx = \frac{x}{2} + \frac{\sin 2x}{4} \end{gathered}$$

Integrals giving inverse functions ปริพันธ์ที่ได้ฟังก์ชันผกผัน

$$\begin{gathered} \int\frac{dx}{\sqrt{a^2 - x^2}} = \arcsin\frac{x}{a} \\ \int\frac{dx}{a^2 + x^2} = \frac1a\arctan\frac{x}{a} \end{gathered}$$

## อนุกรมเทย์เลอร์และการประมาณมุมเล็ก (Taylor Series, Small-Angle Approximation)

Maclaurin series อนุกรมแมคลอริน

$$\begin{gathered} \sin x = x - \frac{x^3}{3!} + \frac{x^5}{5!} - \cdots \\ \cos x = 1 - \frac{x^2}{2!} + \frac{x^4}{4!} - \cdots \end{gathered}$$

Series for tan and arctan อนุกรมของ tan และ arctan

$$\begin{gathered} \tan x = x + \frac{x^3}{3} + \frac{2x^5}{15} + \frac{17x^7}{315} + \cdots \\ \arctan x = x - \frac{x^3}{3} + \frac{x^5}{5} - \cdots\ (|x| \le 1) \end{gathered}$$

Small-angle approximation การประมาณมุมเล็ก

$$\begin{gathered} \sin\theta \approx \theta \\ \tan\theta \approx \theta \\ \cos\theta \approx 1 - \frac{\theta^2}{2} \end{gathered}$$

ใช้ทำให้สมการลูกตุ้ม $\ddot\theta + \tfrac{g}{L}\sin\theta = 0$ เป็นเชิงเส้น และใช้วิเคราะห์ระบบรอบจุดทำงาน

| มุม | θ (rad) | ผิดพลาดของ sin θ ≈ θ | ผิดพลาดของ tan θ ≈ θ | ผิดพลาดของ cos θ ≈ 1 − θ²/2 |

| 5° | 0.087266 | 0.127% | 0.254% | 0.0002% |

| 10° | 0.174533 | 0.510% | 1.017% | 0.0039% |

| 15° | 0.261799 | 1.152% | 2.295% | 0.0202% |

| 20° | 0.349066 | 2.060% | 4.095% | 0.0656% |

| 30° | 0.523599 | 4.720% | 9.310% | 0.3583% |

กฎง่าย ๆ: ถ้ายอมผิดได้ 1% ใช้ sin θ ≈ θ ได้ถึงราว 14° และ tan θ ≈ θ ได้ถึงราว 10°

ที่มาของอนุกรมเหล่านี้ รัศมีการลู่เข้า ขอบเขตความคลาดเคลื่อนลากรองจ์ และแล็บเลือกดีกรีเอง อยู่ที่ อนุกรมเทย์เลอร์และแมคลอริน (Taylor Series)

## ค่าเฉลี่ย RMS และความตั้งฉาก (Averages, RMS, Orthogonality)

สูตรกลุ่มนี้เป็นฐานของค่า RMS กำลังไฟฟ้าเฉลี่ย และอนุกรมฟูริเยร์ ทุกปริพันธ์คิดตลอดหนึ่งคาบ เรียนต่อเป็นขั้นตอนที่ ความตั้งฉากและสูตรออยเลอร์–ฟูเรียร์ และ กำลังไฟฟ้าเมื่อมีฮาร์มอนิก

Mean over a period ค่าเฉลี่ยในหนึ่งคาบ

$$\begin{gathered} \overline{\sin\theta} = \overline{\cos\theta} = 0 \\ \overline{\sin^2\theta} = \overline{\cos^2\theta} = \frac12 \end{gathered}$$

RMS of a sinusoid ค่า RMS ของคลื่นไซน์

$$V_{\text{rms}} = \sqrt{\overline{V_m^2\sin^2\omega t}} = \frac{V_m}{\sqrt2} \approx 0.7071\,V_m$$

ไฟบ้าน 230 V rms มีค่ายอดราว 325 V

Orthogonality relations ความตั้งฉากของไซน์ (m, n เป็นจำนวนเต็มบวก)

$$\begin{gathered} \int_0^{2\pi}\sin mx\,\sin nx\,dx = \int_0^{2\pi}\cos mx\,\cos nx\,dx \\ = \begin{cases} \pi & m = n \\ 0 & m \ne n \end{cases} \\ \int_0^{2\pi}\sin mx\,\cos nx\,dx = 0 \end{gathered}$$

Average AC power กำลังไฟฟ้าเฉลี่ย

$$\begin{gathered} v = V_m\cos\omega t,\quad i = I_m\cos(\omega t - \phi) \\ P = \overline{vi} = \frac{V_m I_m}{2}\cos\phi = V_{\text{rms}}I_{\text{rms}}\cos\phi \end{gathered}$$

ใช้สูตรผลคูณเป็นผลบวก แล้วพจน์ที่ความถี่ 2ω เฉลี่ยได้ศูนย์ เหลือ cos φ คือตัวประกอบกำลัง (power factor)

## ตารางค่า sin cos tan ทุก 0.05° ตั้งแต่ 0° ถึง 90°

ทั้งหมด 1,801 แถว คอลัมน์ซ้ายเป็นองศา ถัดมาเป็นเรเดียน แถวที่เป็นมุมพิเศษทำตัวเน้นและบอกค่าในรูป π ไว้ใต้ค่าเรเดียน ค่าทุกช่องปัดเป็นทศนิยม 6 ตำแหน่ง ส่วน tan ของมุมใกล้ 90° แสดงเลขนัยสำคัญ 7 หลัก

- มุมเกิน 90° ให้หามุมอ้างอิงก่อน แล้วใส่เครื่องหมายตาม ASTC เช่น $\sin 143.13^\circ = +\sin 36.87^\circ$

- csc, sec, cot ใช้ส่วนกลับของค่าในตาราง

- อ่านตารางกลับหัว ได้ด้วยโคฟังก์ชัน: $\cos\theta = \sin(90^\circ - \theta)$ ค่า cos ของแถว 20° จึงเท่ากับค่า sin ของแถว 70°

ค้นหามุม ↑

## คำถามที่พบบ่อย

จำค่า sin cos tan ของมุม 30° 45° 60° อย่างไรให้ไม่ลืม?
เขียน sin ของ 0°, 30°, 45°, 60°, 90° เป็น $\tfrac{\sqrt0}{2}, \tfrac{\sqrt1}{2}, \tfrac{\sqrt2}{2}, \tfrac{\sqrt3}{2}, \tfrac{\sqrt4}{2}$ คือ √ ของ 0 ถึง 4 หารด้วย 2 ส่วน cos คือลำดับเดียวกันแต่กลับหลัง และ tan = sin ÷ cos

ทำไมในแคลคูลัสต้องใช้มุมเป็นเรเดียน?
เพราะสูตร $\tfrac{d}{dx}\sin x = \cos x$ มาจากลิมิต $\lim_{x\to0}\tfrac{\sin x}{x} = 1$ ซึ่งจริงเฉพาะเมื่อ x เป็นเรเดียน ถ้าใช้องศาจะได้ $\tfrac{d}{dx}\sin x^\circ = \tfrac{\pi}{180}\cos x^\circ$ มีตัวคูณเกินมา

หาค่า sin ของมุมที่มากกว่า 90° จากตาราง 0°–90° ได้อย่างไร?
หามุมอ้างอิง (reference angle) ซึ่งเป็นมุมแหลมระหว่างแขนมุมกับแกน x แล้วเปิดตาราง จากนั้นใส่เครื่องหมายตามจตุภาค ASTC เช่น $\sin 150^\circ = +\sin 30^\circ = 0.5$ และ $\cos 210^\circ = -\cos 30^\circ$

atan2 ต่างจาก arctan อย่างไร?
$\arctan(y/x)$ ให้มุมได้แค่ช่วง −90° ถึง 90° จึงแยก (1, 1) กับ (−1, −1) ไม่ออก ส่วน $\operatorname{atan2}(y, x)$ ดูเครื่องหมายของ x และ y แยกกัน จึงให้มุมถูกจตุภาคในช่วง −180° ถึง 180° ใช้หามุมเฟสของจำนวนเชิงซ้อนและเฟเซอร์

ตารางนี้ละเอียดแค่ไหน และใช้แทนเครื่องคิดเลขได้ไหม?
ตารางให้ค่าทุก 0.05° ปัดเป็นทศนิยม 6 ตำแหน่ง ถ้ามุมอยู่ระหว่างสองแถว ใช้ช่องค้นหาด้านบนตารางซึ่งคำนวณค่าจริงของมุมใดก็ได้ และหามุมจากค่า sin, cos หรือ tan ได้ด้วย

## คำถามที่พบบ่อย (FAQ)

**จำค่า sin cos tan ของมุม 30° 45° 60° อย่างไรให้ไม่ลืม?**
เขียน sin ของ 0°, 30°, 45°, 60°, 90° เป็น $\tfrac{\sqrt0}{2}, \tfrac{\sqrt1}{2}, \tfrac{\sqrt2}{2}, \tfrac{\sqrt3}{2}, \tfrac{\sqrt4}{2}$ คือ √ ของ 0 ถึง 4 หารด้วย 2 ส่วน cos คือลำดับเดียวกันแต่กลับหลัง และ tan = sin ÷ cos

**ทำไมในแคลคูลัสต้องใช้มุมเป็นเรเดียน?**
เพราะสูตร $\tfrac{d}{dx}\sin x = \cos x$ มาจากลิมิต $\lim_{x\to0}\tfrac{\sin x}{x} = 1$ ซึ่งจริงเฉพาะเมื่อ x เป็นเรเดียน ถ้าใช้องศาจะได้ $\tfrac{d}{dx}\sin x^\circ = \tfrac{\pi}{180}\cos x^\circ$ มีตัวคูณเกินมา

**หาค่า sin ของมุมที่มากกว่า 90° จากตาราง 0°–90° ได้อย่างไร?**
หามุมอ้างอิง (reference angle) ซึ่งเป็นมุมแหลมระหว่างแขนมุมกับแกน x แล้วเปิดตาราง จากนั้นใส่เครื่องหมายตามจตุภาค ASTC เช่น $\sin 150^\circ = +\sin 30^\circ = 0.5$ และ $\cos 210^\circ = -\cos 30^\circ$

**atan2 ต่างจาก arctan อย่างไร?**
$\arctan(y/x)$ ให้มุมได้แค่ช่วง −90° ถึง 90° จึงแยก (1, 1) กับ (−1, −1) ไม่ออก ส่วน $\operatorname{atan2}(y, x)$ ดูเครื่องหมายของ x และ y แยกกัน จึงให้มุมถูกจตุภาคในช่วง −180° ถึง 180° ใช้หามุมเฟสของจำนวนเชิงซ้อนและเฟเซอร์

**ตารางนี้ละเอียดแค่ไหน และใช้แทนเครื่องคิดเลขได้ไหม?**
ตารางให้ค่าทุก 0.05° ปัดเป็นทศนิยม 6 ตำแหน่ง ถ้ามุมอยู่ระหว่างสองแถว ใช้ช่องค้นหาด้านบนตารางซึ่งคำนวณค่าจริงของมุมใดก็ได้ และหามุมจากค่า sin, cos หรือ tan ได้ด้วย
