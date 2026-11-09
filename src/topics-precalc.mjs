// Topic 27 (added 2026-11-09): Precalculus — Thai original and English edition, imported into TOPICS by build.mjs.
// Thai pages: src/pages/learn/precalculus/…  ·  English pages: src/pages/learn/en/precalculus/… (same sub-page slugs, so the
// TH ⇄ EN language switch and hreflang pairs come from `enSlug` / `thSlug`).
// Widgets: assets/precalc.js (window.PC; engine also loads in Node for scripts/test-precalc.mjs) · styles: "PRECALCULUS" block in site.css
// Tables (trig 0°–360°, z, t, χ², F): python3 scripts/pc_tables.py fills the <!--TABLE:pc-…--> blocks in both languages (scipy values).
// Short URLs: /precalculus /precalc /trigonometric-table /z-table /t-table /chi-square-table /f-table … in _redirects.

const PARTS_TH = [
  { id: "algebra", n: 1, title: "พีชคณิต ฟังก์ชัน และกราฟ", en: "Algebra, Functions & Graphs", blurb: "เลขยกกำลัง กรณฑ์ แยกตัวประกอบ สมการ-อสมการกำลังสอง ค่าสัมบูรณ์ ฟังก์ชัน โดเมน เรนจ์ ฟังก์ชันประกอบ และการแปลงกราฟ" },
  { id: "polynomial", n: 2, title: "พหุนาม ตรรกยะ และฟังก์ชันผกผัน", en: "Polynomial, Rational & Inverse Functions", blurb: "รากและภาวะรากซ้ำ พฤติกรรมปลายกราฟ การหารสังเคราะห์ เส้นกำกับ จุดเว้น ฟังก์ชันหนึ่งต่อหนึ่ง และกราฟสะท้อนเส้น y = x" },
  { id: "explog", n: 3, title: "เอกซ์โพเนนเชียลและลอการิทึม", en: "Exponential & Logarithmic Functions", blurb: "กราฟ bˣ การเติบโต การสลาย ดอกเบี้ยทบต้น จำนวน e ครึ่งชีวิต สมบัติลอการิทึม การเปลี่ยนฐาน และสมการ" },
  { id: "trig", n: 4, title: "ตรีโกณมิติ", en: "Trigonometry", blurb: "วงกลมหนึ่งหน่วย เรเดียน กราฟไซน์ โคไซน์ แทนเจนต์ กฎของไซน์ กฎของโคไซน์ และตารางตรีโกณมิติ 0°–360°" },
  { id: "discrete", n: 5, title: "ลำดับ อนุกรม ความน่าจะเป็น และสถิติ", en: "Sequences, Series, Probability & Statistics", blurb: "ลำดับและอนุกรมเลขคณิต-เรขาคณิต การนับ ความน่าจะเป็น การแจกแจงทวินาม สถิติเชิงพรรณนา การแจกแจงปกติ และตารางสถิติ" },
];
const PARTS_EN = [
  { id: "algebra", n: 1, title: "Algebra, Functions & Graphs", en: "Algebra, Functions & Graphs", blurb: "Exponents, radicals, factoring, quadratic equations and inequalities, absolute value, functions, domain and range, composition and graph transformations" },
  { id: "polynomial", n: 2, title: "Polynomial, Rational & Inverse Functions", en: "Polynomial, Rational & Inverse Functions", blurb: "Zeros and multiplicity, end behavior, synthetic division, asymptotes, holes, one-to-one functions and reflection in y = x" },
  { id: "explog", n: 3, title: "Exponential & Logarithmic Functions", en: "Exponential & Logarithmic Functions", blurb: "Graphs of bˣ, growth, decay, compound interest, the number e, half-life, laws of logarithms, change of base and equations" },
  { id: "trig", n: 4, title: "Trigonometry", en: "Trigonometry", blurb: "Unit circle, radians, graphs of sine, cosine and tangent, the laws of sines and cosines, and a 0°–360° trig table" },
  { id: "discrete", n: 5, title: "Sequences, Series, Probability & Statistics", en: "Sequences, Series, Probability & Statistics", blurb: "Arithmetic and geometric sequences and series, counting, probability, the binomial distribution, descriptive statistics, the normal distribution and statistical tables" },
];

const SUB = [
  { slug: "algebra", part: "algebra", sym: "x²", prefix: "A",
    th: ["พีชคณิต · สมการ · อสมการ", "พีชคณิตสำหรับพรีแคลคูลัส: เลขยกกำลัง กรณฑ์ การแยกตัวประกอบ สมการและอสมการกำลังสอง และค่าสัมบูรณ์", "กฎเลขยกกำลังและกรณฑ์ การทำส่วนให้เป็นจำนวนตรรกยะ แยกตัวประกอบทุกแบบ สูตรกำลังสอง ดิสคริมิแนนต์ ผลบวกและผลคูณราก อสมการกำลังสองด้วยเส้นจำนวน และสมการ-อสมการค่าสัมบูรณ์ พร้อมเครื่องมือกราฟพาราโบลา"],
    en: ["Algebra review", "Algebra Review for Precalculus: Exponents, Radicals, Factoring, Quadratic Equations and Inequalities, Absolute Value", "Laws of exponents and radicals, rationalizing denominators, every factoring pattern, the quadratic formula, the discriminant, sum and product of roots, quadratic inequalities with a sign chart, and absolute-value equations and inequalities, with an interactive parabola explorer"] },
  { slug: "functions", part: "algebra", sym: "f(x)", prefix: "F",
    th: ["ฟังก์ชัน · โดเมน · เรนจ์", "ฟังก์ชันในพรีแคลคูลัส: ความสัมพันธ์ โดเมน เรนจ์ สัญกรณ์ f(x) การดำเนินการ และฟังก์ชันประกอบ", "ฟังก์ชันคืออะไรเมื่อเทียบกับความสัมพันธ์ การทดสอบเส้นแนวตั้ง หาโดเมนจากตัวส่วน รากที่สอง และลอการิทึม หาเรนจ์ ฟังก์ชันเป็นช่วง การบวก ลบ คูณ หารฟังก์ชัน ฟังก์ชันประกอบ f∘g และอัตราการเปลี่ยนแปลงเฉลี่ย พร้อมแล็บพิมพ์ฟังก์ชัน"],
    en: ["Functions", "Functions in Precalculus: Relations, Domain, Range, Function Notation, Operations and Composition", "What makes a relation a function, the vertical line test, finding the domain from denominators, square roots and logarithms, finding the range, piecewise functions, sum, difference, product and quotient of functions, composition f∘g and average rate of change, with a function lab"] },
  { slug: "graphs", part: "algebra", sym: "f(x−h)", prefix: "G",
    th: ["กราฟ · การแปลงกราฟ", "กราฟของฟังก์ชันและการแปลงกราฟ: เลื่อน ยืด หด สะท้อน สมมาตร ฟังก์ชันคู่-คี่ และเส้นตรง", "อ่านกราฟให้ได้ข้อมูลครบ ความชัน สมการเส้นตรงทุกรูปแบบ เส้นขนานและตั้งฉาก กราฟฟังก์ชันพื้นฐาน 10 แบบ การเลื่อน การยืด-หด การสะท้อน ลำดับการแปลง y = a·f(b(x − h)) + k ฟังก์ชันคู่-คี่ และแล็บแปลงกราฟแบบลากสไลเดอร์"],
    en: ["Graphs & transformations", "Graphs of Functions and Transformations: Shifts, Stretches, Reflections, Symmetry, Even and Odd Functions, and Lines", "Reading a graph completely, slope and every form of a line, parallel and perpendicular lines, ten parent functions, shifts, stretches and compressions, reflections, the order of transformations in y = a·f(b(x − h)) + k, even and odd functions, and a slider transformation lab"] },
  { slug: "polynomial-functions", part: "polynomial", sym: "xⁿ", prefix: "P",
    th: ["ฟังก์ชันพหุนาม", "ฟังก์ชันพหุนาม: กราฟ รากและภาวะรากซ้ำ พฤติกรรมปลายกราฟ การหารสังเคราะห์ ทฤษฎีบทเศษเหลือและทฤษฎีบทตัวประกอบ", "ดีกรีและสัมประสิทธิ์นำ พฤติกรรมปลายกราฟ 4 แบบ รากตัดแกนกับรากสัมผัสแกน จุดวกกลับ การหารยาวและการหารสังเคราะห์ ทฤษฎีบทเศษเหลือ ทฤษฎีบทตัวประกอบ ทฤษฎีบทรากตรรกยะ และอสมการพหุนาม พร้อมแล็บสร้างพหุนามจากราก"],
    en: ["Polynomial functions", "Polynomial Functions: Graphs, Zeros and Multiplicity, End Behavior, Synthetic Division, Remainder and Factor Theorems", "Degree and leading coefficient, the four end-behavior patterns, zeros that cross versus touch, turning points, long and synthetic division, the remainder and factor theorems, the rational root theorem and polynomial inequalities, with a build-from-zeros lab"] },
  { slug: "rational-functions", part: "polynomial", sym: "p/q", prefix: "R",
    th: ["ฟังก์ชันตรรกยะ · เส้นกำกับ", "ฟังก์ชันตรรกยะ: เส้นกำกับแนวดิ่ง แนวนอน แนวเฉียง จุดเว้น (Hole) และขั้นตอนวาดกราฟ", "ฟังก์ชันส่วนกลับ 1/x และ 1/x² โดเมนของฟังก์ชันตรรกยะ แยกจุดเว้นกับเส้นกำกับแนวดิ่ง กฎเทียบดีกรีหาเส้นกำกับแนวนอน การหารยาวหาเส้นกำกับแนวเฉียง ตารางเครื่องหมาย และอสมการตรรกยะ พร้อมเครื่องวิเคราะห์กราฟ"],
    en: ["Rational functions", "Rational Functions: Vertical, Horizontal and Slant Asymptotes, Holes and How to Graph Them", "The reciprocal functions 1/x and 1/x², the domain of a rational function, holes versus vertical asymptotes, the degree rule for horizontal asymptotes, long division for slant asymptotes, sign charts and rational inequalities, with a graph analyzer"] },
  { slug: "inverse-functions", part: "polynomial", sym: "f⁻¹", prefix: "I",
    th: ["ฟังก์ชันผกผัน f⁻¹", "ฟังก์ชันผกผัน: ฟังก์ชันหนึ่งต่อหนึ่ง การทดสอบเส้นแนวนอน วิธีหา f⁻¹(x) และกราฟที่สะท้อนเส้น y = x", "ฟังก์ชันหนึ่งต่อหนึ่ง การทดสอบเส้นแนวนอน หาฟังก์ชันผกผันด้วยการสลับ x กับ y ตรวจด้วย f(f⁻¹(x)) = x การจำกัดโดเมนให้ x² และ sin x มีตัวผกผัน โดเมน-เรนจ์ที่สลับกัน และแล็บเงาสะท้อน"],
    en: ["Inverse functions", "Inverse Functions: One-to-One Functions, the Horizontal Line Test, Finding f⁻¹(x) and Graphing by Reflection in y = x", "One-to-one functions, the horizontal line test, finding an inverse by swapping x and y, checking with f(f⁻¹(x)) = x, restricting the domain of x² and sin x, swapped domain and range, and a reflection lab"] },
  { slug: "exponential-functions", part: "explog", sym: "bˣ", prefix: "E",
    th: ["ฟังก์ชันเอกซ์โพเนนเชียล", "ฟังก์ชันเอกซ์โพเนนเชียล: กราฟ การเติบโตและการสลาย ดอกเบี้ยทบต้น จำนวน e ครึ่งชีวิต และสมการเลขชี้กำลัง", "นิยาม f(x) = bˣ กราฟเมื่อ b > 1 และ 0 < b < 1 เส้นกำกับ y = 0 การแปลงกราฟ แบบจำลองการเติบโตและการสลาย ดอกเบี้ยทบต้นรายปี รายเดือน และต่อเนื่อง จำนวน e ครึ่งชีวิต เวลาเพิ่มเป็นสองเท่า และสมการที่ทำฐานให้เท่ากัน พร้อมแล็บ"],
    en: ["Exponential functions", "Exponential Functions: Graphs, Growth and Decay, Compound Interest, the Number e, Half-Life and Exponential Equations", "The definition f(x) = bˣ, graphs for b > 1 and 0 < b < 1, the asymptote y = 0, transformations, growth and decay models, compound interest yearly, monthly and continuously, the number e, half-life and doubling time, and equations solved by matching bases, with a lab"] },
  { slug: "logarithmic-functions", part: "explog", sym: "log", prefix: "L",
    th: ["ฟังก์ชันลอการิทึม", "ฟังก์ชันลอการิทึม: นิยาม สมบัติ การเปลี่ยนฐาน กราฟ สมการและอสมการลอการิทึม และสเกล pH เดซิเบล ริกเตอร์", "log คือเลขชี้กำลัง กราฟ y = log_b x ที่สะท้อนจาก bˣ โดเมน x > 0 สมบัติผลคูณ ผลหาร กำลัง การเปลี่ยนฐาน log ฐาน 10 และ ln แก้สมการเอกซ์โพเนนเชียลด้วย log ตรวจคำตอบเกิน อสมการลอการิทึม และสเกลลอการิทึมในวิทยาศาสตร์ พร้อมเครื่องคิดเลข"],
    en: ["Logarithmic functions", "Logarithmic Functions: Definition, Laws of Logarithms, Change of Base, Graphs, Equations, Inequalities and Log Scales", "A log is an exponent, the graph of y = log_b x as the reflection of bˣ, the domain x > 0, the product, quotient and power laws, change of base, common log and ln, solving exponential equations with logs, checking for extraneous roots, log inequalities and the pH, decibel and Richter scales, with a calculator"] },
  { slug: "trigonometric-functions", part: "trig", sym: "sin θ", prefix: "T",
    th: ["ฟังก์ชันตรีโกณมิติ · กราฟ", "ฟังก์ชันตรีโกณมิติ: วงกลมหนึ่งหน่วย เรเดียน มุมอ้างอิง กราฟไซน์ โคไซน์ แทนเจนต์ และเอกลักษณ์พื้นฐาน", "มุมในตำแหน่งมาตรฐาน องศากับเรเดียน ความยาวส่วนโค้ง วงกลมหนึ่งหน่วยแบบลากมุม มุมอ้างอิงและเครื่องหมายตามจตุภาค กราฟ y = A sin(B(x − C)) + D แอมพลิจูด คาบ การเลื่อนเฟส กราฟ tan cot sec csc เอกลักษณ์พื้นฐาน และฟังก์ชันตรีโกณมิติผกผัน"],
    en: ["Trigonometric functions", "Trigonometric Functions: the Unit Circle, Radians, Reference Angles, Graphs of Sine, Cosine and Tangent, and Basic Identities", "Angles in standard position, degrees and radians, arc length, a draggable unit circle, reference angles and signs by quadrant, graphs of y = A sin(B(x − C)) + D with amplitude, period and phase shift, graphs of tan, cot, sec and csc, basic identities and inverse trigonometric functions"] },
  { slug: "applications-of-trigonometry", part: "trig", sym: "△", prefix: "K",
    th: ["ประยุกต์ตรีโกณมิติ · สามเหลี่ยม", "การประยุกต์ของฟังก์ชันตรีโกณมิติ: กฎของไซน์ กฎของโคไซน์ พื้นที่สามเหลี่ยม มุมก้ม-มุมเงย ทิศ และสมการตรีโกณมิติ", "แก้สามเหลี่ยมมุมฉาก มุมก้มและมุมเงย กฎของไซน์ กรณีกำกวม SSA กฎของโคไซน์ พื้นที่ ½ab sin C และสูตรเฮรอน ทิศทางและแบริ่ง สมการตรีโกณมิติในช่วง 0 ถึง 2π และงานประยุกต์ในสำรวจ ฟิสิกส์ ไฟฟ้า พร้อมเครื่องแก้สามเหลี่ยมทุกกรณี"],
    en: ["Applications of trigonometry", "Applications of Trigonometry: Law of Sines, Law of Cosines, Triangle Area, Angles of Elevation and Depression, Bearings and Trig Equations", "Solving right triangles, angles of elevation and depression, the law of sines and the ambiguous SSA case, the law of cosines, area ½ab sin C and Heron's formula, bearings, trigonometric equations on 0 to 2π, and uses in surveying, physics and electrical work, with a triangle solver for every case"] },
  { slug: "trig-table", part: "trig", sym: "0–360°", prefix: "V", tag: ["ตาราง + ค้นหา", "Table + search"],
    th: ["ตารางตรีโกณมิติ 0°–360°", "ตารางตรีโกณมิติ 0°–360° ครบ 6 ฟังก์ชัน: sin cos tan cot sec csc พร้อมเรเดียน ค่าแม่นตรง และค้นหามุมจากค่า", "ตารางค่าฟังก์ชันตรีโกณมิติทุก 1° ตั้งแต่ 0° ถึง 360° ทั้งหกฟังก์ชันพร้อมเรเดียน ตารางค่าแม่นตรงของมุมพิเศษ 16 มุม เครื่องค้นหาที่พิมพ์มุมหรือพิมพ์ค่า เช่น sin = 0.6 แล้วได้ทุกมุม มุมอ้างอิง เครื่องหมายตามจตุภาค และวิธีอ่านตาราง"],
    en: ["Trig table 0°–360°", "Trigonometric Table 0°–360°: sin, cos, tan, cot, sec and csc with Radians, Exact Values and Reverse Lookup", "Values of all six trigonometric functions for every degree from 0° to 360° with radians, exact values for the 16 special angles, a lookup box that accepts an angle or a value such as sin = 0.6 and returns every angle, reference angles, signs by quadrant and how to read the table"] },
  { slug: "sequences", part: "discrete", sym: "aₙ", prefix: "Q",
    th: ["ลำดับเลขคณิต · เรขาคณิต", "ลำดับ ม.ปลาย: ลำดับเลขคณิต ลำดับเรขาคณิต สูตรพจน์ทั่วไป ลำดับเวียนเกิด และกราฟของลำดับ", "ลำดับคือฟังก์ชันที่มีโดเมนเป็นจำนวนนับ ลำดับเลขคณิตเป็นจุดบนเส้นตรง ลำดับเรขาคณิตเป็นจุดบนกราฟเอกซ์โพเนนเชียล สูตรพจน์ทั่วไป หาพจน์จากสองพจน์ที่รู้ ค่าเฉลี่ยเลขคณิตและเรขาคณิต ลำดับเวียนเกิด ฟีโบนัชชี และลิมิตของลำดับเบื้องต้น พร้อมแล็บ"],
    en: ["Sequences", "Sequences in Precalculus: Arithmetic and Geometric Sequences, the nth Term, Recursive Formulas and Graphs", "A sequence is a function on the natural numbers, arithmetic sequences lie on a line and geometric sequences on an exponential curve, the nth-term formulas, finding terms from two known terms, arithmetic and geometric means, recursive sequences, Fibonacci and a first look at limits, with a lab"] },
  { slug: "series", part: "discrete", sym: "Σ", prefix: "S",
    th: ["อนุกรม · ซิกมา", "อนุกรม ม.ปลาย: สัญลักษณ์ซิกมา อนุกรมเลขคณิต อนุกรมเรขาคณิต อนุกรมอนันต์ และเงินออม-เงินผ่อนรายงวด", "อ่านและเขียนสัญลักษณ์ซิกมา สมบัติของซิกมา สูตร Σk Σk² Σk³ ผลบวก n พจน์ของอนุกรมเลขคณิตและเรขาคณิต อนุกรมเรขาคณิตอนันต์และเงื่อนไข |r| < 1 ทศนิยมซ้ำ อนุกรมกล้องส่องทางไกล และมูลค่าเงินออม-เงินผ่อนรายงวด พร้อมแล็บผลบวกย่อย"],
    en: ["Series", "Series in Precalculus: Sigma Notation, Arithmetic and Geometric Series, Infinite Geometric Series and Annuities", "Reading and writing sigma notation, its properties, the formulas for Σk, Σk² and Σk³, the sum of n terms of arithmetic and geometric series, infinite geometric series and the condition |r| < 1, repeating decimals, telescoping sums, and savings and loan annuities, with a partial-sum lab"] },
  { slug: "probability", part: "discrete", sym: "nCr", prefix: "C",
    th: ["การนับ · ความน่าจะเป็น", "หลักการนับและความน่าจะเป็น: การเรียงสับเปลี่ยน การจัดหมู่ ทฤษฎีบททวินาม ความน่าจะเป็นแบบมีเงื่อนไข และการแจกแจงทวินาม", "กฎการบวกและการคูณ แฟกทอเรียล การเรียงสับเปลี่ยนเชิงเส้น เชิงวงกลม และของซ้ำ การจัดหมู่ ทฤษฎีบททวินามและสามเหลี่ยมปาสกาล ปริภูมิตัวอย่าง เหตุการณ์ ความน่าจะเป็นแบบมีเงื่อนไข เหตุการณ์อิสระ ทฤษฎีบทของเบส์ ตัวแปรสุ่ม ค่าคาดหมาย และการแจกแจงทวินาม พร้อมเครื่องนับและเครื่องจำลอง"],
    en: ["Counting & probability", "Counting and Probability: Permutations, Combinations, the Binomial Theorem, Conditional Probability and the Binomial Distribution", "The addition and multiplication principles, factorials, linear and circular permutations and permutations with repeats, combinations, the binomial theorem and Pascal's triangle, sample spaces and events, conditional probability, independence, Bayes' theorem, random variables, expected value and the binomial distribution, with a counting calculator and a simulator"] },
  { slug: "statistics", part: "discrete", sym: "x̄", prefix: "D",
    th: ["สถิติ · การแจกแจงปกติ", "สถิติ: ค่ากลาง การกระจาย ควอร์ไทล์ แผนภาพกล่อง ค่ามาตรฐาน z การแจกแจงปกติ สหสัมพันธ์ และการถดถอยเชิงเส้น", "ข้อมูลเชิงคุณภาพและเชิงปริมาณ ตารางแจกแจงความถี่ ฮิสโทแกรม ค่าเฉลี่ย มัธยฐาน ฐานนิยม พิสัย ส่วนเบี่ยงเบนมาตรฐานของประชากรและตัวอย่าง ควอร์ไทล์ เปอร์เซ็นไทล์ แผนภาพกล่อง ค่าผิดปกติ ค่ามาตรฐาน z การแจกแจงปกติ กฎ 68–95–99.7 สหสัมพันธ์ และเส้นถดถอย พร้อมเครื่องคิดเลขสถิติ"],
    en: ["Statistics", "Statistics: Mean, Median, Standard Deviation, Quartiles, Box Plots, z-Scores, the Normal Distribution, Correlation and Linear Regression", "Categorical and numerical data, frequency tables, histograms, mean, median and mode, range, population and sample standard deviation, quartiles and percentiles, box plots and outliers, z-scores, the normal distribution and the 68–95–99.7 rule, correlation and the regression line, with a statistics calculator"] },
  { slug: "statistical-tables", part: "discrete", sym: "z t χ²", prefix: "Z", tag: ["ตาราง + เครื่องคิดค่า p", "Tables + p-value calculator"],
    th: ["ตาราง z · t · χ² · F", "ตารางสถิติ: ตาราง z พื้นที่ใต้โค้งปกติ ตาราง t ตารางไคกำลังสอง ตาราง F และเครื่องคิดค่า p", "ตารางพื้นที่ใต้เส้นโค้งปกติมาตรฐานทั้งแบบสะสม Φ(z) และแบบ 0 ถึง z ที่ใช้ใน ม.6 ค่าวิกฤต z ตาราง t ของสติวเดนต์ ตารางไคกำลังสอง ตาราง F ที่ระดับนัยสำคัญ 0.05 และ 0.01 วิธีอ่านแต่ละตาราง และเครื่องคิดค่า p กับค่าวิกฤตสำหรับทุกการแจกแจง"],
    en: ["z, t, χ², F tables", "Statistical Tables: Standard Normal (z) Table, Student's t Table, Chi-Square Table, F Table and a p-Value Calculator", "Standard normal tables both cumulative Φ(z) and area from 0 to z, critical values of z, Student's t table, the chi-square table, F tables at the 0.05 and 0.01 levels, how to read each table, and a p-value and critical-value calculator for every distribution"] },
];

const mkSub = (lang) => SUB.map((s) => {
  const [short, title, summary] = s[lang];
  const o = { slug: s.slug, part: s.part, short, title, en: s.en[1].split(":")[0], sym: s.sym, summary };
  if (s.prefix) o.prefix = s.prefix;
  if (s.tag) o.tag = s.tag[lang === "th" ? 0 : 1];
  return o;
});

export const PRECALC_TOPICS = [
  {
    slug: "precalculus",
    enSlug: "en/precalculus",
    title: "พรีแคลคูลัส (Precalculus): ฟังก์ชันและกราฟ ครบ ม.4–ม.6 ก่อนเรียนแคลคูลัส",
    en: "Precalculus",
    sym: "f⁻¹",
    hubFx: true, hubShort: "ภาพรวม · เส้นทางเรียน", hubPrefix: "H",
    summary: "พรีแคลคูลัสครบ 16 หน้าที่เน้นฟังก์ชันและกราฟ: พีชคณิต ฟังก์ชัน การแปลงกราฟ พหุนาม ฟังก์ชันตรรกยะ ฟังก์ชันผกผัน เอกซ์โพเนนเชียล ลอการิทึม ตรีโกณมิติและการประยุกต์ ตารางตรีโกณมิติ 0°–360° ลำดับ อนุกรม ความน่าจะเป็น สถิติ และตาราง z t χ² F พร้อมแล็บโต้ตอบ 21 ชุด",
    fxHint: "พิมพ์ เช่น quadratic, discriminant, domain, composition, asymptote, inverse, log, half-life, radian, law of sines, sigma, nCr, binomial, standard deviation, z-score",
    parts: PARTS_TH,
    sub: mkSub("th"),
  },
  {
    slug: "en/precalculus",
    lang: "en", num: 27, thSlug: "precalculus",
    title: "Precalculus: Functions and Graphs, a Complete Course with Interactive Labs",
    en: "Precalculus",
    sym: "f⁻¹",
    hubFx: true, hubShort: "Overview · study path", hubPrefix: "H",
    summary: "A 16-page precalculus course built around functions and graphs: algebra review, functions, transformations, polynomial, rational and inverse functions, exponential and logarithmic functions, trigonometry and its applications, a 0°–360° trig table, sequences, series, probability, statistics and z, t, χ² and F tables, with 21 interactive labs.",
    fxHint: "Try quadratic, discriminant, domain, composition, asymptote, inverse, log, half-life, radian, law of sines, sigma, nCr, binomial, standard deviation, z-score",
    parts: PARTS_EN,
    sub: mkSub("en"),
  },
];
