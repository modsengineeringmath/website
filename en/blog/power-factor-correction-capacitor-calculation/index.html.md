---
title: "How to Calculate the Size of a Power Factor Correction Capacitor (kvar) with an Example"
url: https://modsengineeringmath.com/en/blog/power-factor-correction-capacitor-calculation/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-16
---

> The formula Qc = P(tan φ1 − tan φ2) with a 100 kW, 400 V load corrected from PF 0.75 to 0.95 giving 55.3 kvar, microfarads per phase, a multiplier table and cautions about harmonics.

Markdown copy of https://modsengineeringmath.com/en/blog/power-factor-correction-capacitor-calculation/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# How to Calculate the Size of a Power Factor Correction Capacitor (kvar) with an Example

THภาษาไทยENEnglish
// Article · Power Factor Correction


Correcting the PF means installing capacitors that supply the reactive power (kvar) to inductive loads, instead of drawing it from the grid. The size you need follows from a single formula and can be checked with the power triangle.

30-second summary

- $Q_c=P\,(\tan\varphi_1-\tan\varphi_2)$, where $\varphi_1$ is the angle before correction and $\varphi_2$ the target angle

- Real power P does not change; what falls is Q and S, so the current falls

- Choose the nearest standard size, and check harmonics before installing

## Where the formula comes from

From the power triangle, $Q=P\tan\varphi$. Before correction the load has $Q_1=P\tan\varphi_1$; after correction we want $Q_2=P\tan\varphi_2$. The capacitor must supply the difference.

$$Q_c=Q_1-Q_2=P\,(\tan\varphi_1-\tan\varphi_2),\qquad \varphi=\cos^{-1}(\text{PF})$$

Then find the capacitance per phase from $Q_c=3\,\omega C V^2$ for a delta connection, where $V$ is the line voltage and $\omega=2\pi f$.

## Example: a 100 kW, 400 V three-phase load, PF 0.75 → 0.95

- Find the angles and tangents before and after

$$\tan\varphi_1=\tan\!\big(\cos^{-1}0.75\big)=0.8819,\qquad \tan\varphi_2=\tan\!\big(\cos^{-1}0.95\big)=0.3287$$

- The reactive power to compensate

$$Q_c=100\times(0.8819-0.3287)\approx55.3\ \text{kvar}$$

- Line current before and after correction ($I=\dfrac{P}{\sqrt{3}\,V\,\text{PF}}$)

$$I_1=\frac{100000}{\sqrt{3}\,(400)(0.75)}\approx192.5\ \text{A},\qquad I_2=\frac{100000}{\sqrt{3}\,(400)(0.95)}\approx151.9\ \text{A}$$

- Capacitance per phase for a delta connection at 50 Hz

$$C=\frac{Q_c}{3\,\omega V^2}=\frac{55323}{3\,(2\pi\cdot50)(400)^2}\approx367\ \mu\text{F}$$

About 55.3 kvar of capacitors is needed. Choose the next standard size up, for example 60 kvar in several switched steps. The line current falls from 192.5 A to 151.9 A (about 21 % lower). If connected in wye, the capacitance per phase would be three times larger, about 1,101 µF.

## Multiplier table: Qc = P × k for a target PF of 0.95

Multiply the real power in kW by $k=\tan\varphi_1-\tan\varphi_2$ to get kvar directly.

| Original PF | $k$ | Example P = 100 kW |

| 0.70 | 0.692 | 69.2 kvar |

| 0.75 | 0.553 | 55.3 kvar |

| 0.80 | 0.421 | 42.1 kvar |

| 0.85 | 0.291 | 29.1 kvar |

| 0.90 | 0.156 | 15.6 kvar |

## Cautions before installing

- Use the measured P, not the motor nameplate power, because at light load the PF is lower and P is below the rating.

- Do not over-correct. If the capacitor is larger than the load's Q at light load, you get a leading PF and a higher voltage. Use an automatic bank that switches in steps.

- Harmonics: resonance between the capacitors and the system inductance can amplify harmonic currents. Measure THD, and choose a detuned type with reactors when there are many electronic loads.

- Voltage rating: choose capacitors with a voltage rating comfortably above the system voltage, as the manufacturer recommends.

## Keep learning in the library

The full lessons are in Thai, with English technical terms and the same formulas.

- Power factor correction: the complete capacitor calculation (in Thai)

- Automatic capacitor banks and detuned reactors (in Thai)

- kvar penalties on the electricity bill and whether it pays off (in Thai)

- Simulator: add a capacitor bank and watch the current fall (in Thai)

- Read first: what is power factor?

## Frequently asked questions

What power factor should I correct to?
A common target is 0.95 or above, because it allows for light-load periods when a motor's PF drops, and it stops short of 1.0, which needs a lot more capacitance for only a small further reduction in current. An automatic installation that switches steps with the load prevents over-compensation into a leading PF.

Should capacitors be connected in delta or wye?
For the same kvar, a delta connection needs one third of the capacitance per phase of a wye connection (because the voltage across each unit is $\sqrt{3}$ times higher). Low-voltage capacitor banks are usually connected in delta.

What should I watch for after installing capacitors?
If the system has a lot of harmonics, the capacitors may resonate with the transformer inductance and amplify harmonic currents. Measure THD before installing, and use a capacitor bank in series with reactors (detuned) when necessary.

Which part of the electricity bill do capacitors reduce?
They reduce the PF penalty on the bill under the utility's criteria, and they reduce current in cables and transformers, which lowers losses. They do not reduce the kWh the load actually uses.

## More articles worth reading

Power factor
What Is Power Factor? The cos φ Formula and the Relationship between kW, kVA and kvar
Power factor is the ratio of real power to apparent power. See the P Q S power triangle, a worked current calculation at PF 0.8 versus 1.0, lagging…
16 Oct 2026Read the article →

Motors · research
How Many Seconds Should a Star–Delta Timer Be Set To? Numerical Experiments on a Squirrel-Cage Induction Motor: Changeover Time, Dead Time, Current and Energy
How many seconds for a star–delta timer? Research simulating a 7.5 kW squirrel-cage motor: t = c·τm, a c table by load, dead time, KM3 phase order,…
19 Oct 2026Read the article →

3-phase motors
3-Phase Motor Delta (Δ) Connection: Remember U1–W2, V1–U2, W1–V2 and Choose from the Nameplate
How to connect a 3-phase motor in delta: links U1-W2, V1-U2, W1-V2, what U1 V1 W1 U2 V2 W2 mean and which wire colours go where, line vs phase…
17 Oct 2026Read the article →

All 4 articles in Power Systems & Motors → · All articles

## Frequently asked questions

**What power factor should I correct to?**
A common target is 0.95 or above, because it allows for light-load periods when a motor's PF drops, and it stops short of 1.0, which needs a lot more capacitance for only a small further reduction in current. An automatic installation that switches steps with the load prevents over-compensation into a leading PF.

**Should capacitors be connected in delta or wye?**
For the same kvar, a delta connection needs one third of the capacitance per phase of a wye connection (because the voltage across each unit is $\sqrt{3}$ times higher). Low-voltage capacitor banks are usually connected in delta.

**What should I watch for after installing capacitors?**
If the system has a lot of harmonics, the capacitors may resonate with the transformer inductance and amplify harmonic currents. Measure THD before installing, and use a capacitor bank in series with reactors (detuned) when necessary.

**Which part of the electricity bill do capacitors reduce?**
They reduce the PF penalty on the bill under the utility's criteria, and they reduce current in cables and transformers, which lowers losses. They do not reduce the kWh the load actually uses.
