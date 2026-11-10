---
title: "Power Factor Calculator: cos φ, Correction Capacitor Size and the Utility's Power Factor Charge"
url: https://modsengineeringmath.com/en/tools/power-factor-calculator/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-10
---

> Calculate power factor online, free, from kW and PF, from voltage, current and power, or from kW and kvar. Get P, Q, S, the phase angle, the capacitor size in kvar and µF for a target PF, the drop in current, and the Thai utility charge of 56.07 baht per kvar.

Markdown copy of https://modsengineeringmath.com/en/tools/power-factor-calculator/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Power Factor Calculator: cos φ, Correction Capacitor Size and the Utility's Power Factor Charge

THภาษาไทยENEnglish
// Tool · Power Factor Calculator


Enter what you know (a motor nameplate, a meter reading or an electricity bill) and get the power factor, the real, reactive and apparent power, the capacitor needed to reach a target PF, the reduction in current and losses, and the power factor charge a Thai utility would bill.

## Calculator

This calculator needs JavaScript.

## The formulas

Real power $P$ (kW), reactive power $Q$ (kvar) and apparent power $S$ (kVA) form a right triangle.

$$S = \sqrt{P^{2} + Q^{2}}, \qquad \cos\varphi = \frac{P}{S}, \qquad Q = P\tan\varphi$$

$$S_{1\phi} = VI, \qquad S_{3\phi} = \sqrt{3}\,V_{LL}I_{L}$$

The capacitor needed to raise the power factor from $\cos\varphi_1$ to $\cos\varphi_2$ at the same real power:

$$Q_C = P\left(\tan\varphi_1 - \tan\varphi_2\right)$$

Capacitance per phase in a three-phase system with line voltage $V_{LL}$ and frequency $f$:

$$C_{\Delta} = \frac{Q_C}{3\cdot 2\pi f\,V_{LL}^{2}}, \qquad C_{Y} = \frac{Q_C}{2\pi f\,V_{LL}^{2}} = 3C_{\Delta}$$

## A worked example by hand

A plant draws $P = 100$ kW at 0.75 lagging on a 400 V, three-phase, 50 Hz supply and wants 0.95.

$$\tan\varphi_1 = \tan(\cos^{-1}0.75) = 0.8819, \qquad \tan\varphi_2 = \tan(\cos^{-1}0.95) = 0.3287$$

$$Q_C = 100(0.8819 - 0.3287) = 55.3\ \text{kvar}$$

The line current falls from $\dfrac{100{,}000}{\sqrt{3}(400)(0.75)} = 192.5$ A to $\dfrac{100{,}000}{\sqrt{3}(400)(0.95)} = 151.9$ A, a 21 % drop. Line losses, which go as $I^{2}$, fall by 37.7 %.

## The power factor charge in Thailand (MEA and PEA)

Customers billed on demand (medium and large general service, specific business, and the TOU rates of categories 6 and 7) pay a power factor charge when the highest 15-minute reactive demand in the month exceeds 61.97 % of the highest 15-minute active demand. The excess is charged at 56.07 baht per kvar. A fraction below 0.5 kvar is dropped; 0.5 kvar or more counts as 1 kvar.

$$\frac{Q}{P} = 0.6197 \iff \tan\varphi = 0.6197 \iff \cos\varphi = 0.85$$

So the 61.97 % limit is simply a power factor of 0.85. In the example above, $Q = 88.19$ kvar exceeds the allowed $61.97$ kvar by 26.22 kvar, billed as 26 kvar: $26 \times 56.07 = 1{,}457.82$ baht a month before VAT.

## Practical cautions

- Choose the nearest standard capacitor rating, and do not over-correct into a leading power factor at light load. Where the load varies through the day, use an automatic capacitor bank.

- With many non-linear loads (inverters, drives, welders), check harmonics and resonance with the transformer first. Detuning reactors may be needed.

- This calculation uses the displacement power factor at the fundamental frequency. Capacitors cannot correct the part caused by harmonics.

## Learn the theory

- What is power factor?

- How to calculate a PF-correction capacitor

- Thailand electricity bill calculator

- Power factor lessons (in Thai)

## Frequently asked questions

What is a good power factor?
Thai utilities set 0.85 as the limit for customers billed on demand. Designs usually aim for about 0.95 to leave a margin as the load changes.

Do households pay a power factor charge in Thailand?
No. It applies only to customers with a demand charge: categories 3, 4 and 5, and the TOU rates of categories 6 and 7.

Delta or star connection for the capacitors?
For the same kvar, delta needs one third of the capacitance per phase that star does, but each capacitor must withstand the line voltage. Most 400 V capacitor banks are delta-connected.

How much does correction cut the bill?
The energy charge (kWh) barely changes. What goes down is the power factor charge on the bill, and the losses in cables and transformers inside the plant.

## More calculators

LaTeX equation editor (PNG / SVG)
Laplace transform calculator
Inverse Laplace transform calculator
Fourier series calculator
Derivative calculator
Integral calculator
Area calculator
Thailand electricity bill calculator
All tools →

## Frequently asked questions

**What is a good power factor?**
Thai utilities set 0.85 as the limit for customers billed on demand. Designs usually aim for about 0.95 to leave a margin as the load changes.

**Do households pay a power factor charge in Thailand?**
No. It applies only to customers with a demand charge: categories 3, 4 and 5, and the TOU rates of categories 6 and 7.

**Delta or star connection for the capacitors?**
For the same kvar, delta needs one third of the capacitance per phase that star does, but each capacitor must withstand the line voltage. Most 400 V capacitor banks are delta-connected.

**How much does correction cut the bill?**
The energy charge (kWh) barely changes. What goes down is the power factor charge on the bill, and the losses in cables and transformers inside the plant.
